import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptsDir, '..')

const JSDELIVR_VERSION = '2.0.1'
const JSDELIVR_FLAT_API = `https://data.jsdelivr.com/v1/package/npm/hanzi-writer-data@${JSDELIVR_VERSION}/flat`
const JSDELIVR_CDN_BASE = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@${JSDELIVR_VERSION}`

const pkgRoot = path.resolve(rootDir, 'node_modules', 'hanzi-writer-data')
const publicDir = path.resolve(rootDir, 'public')
const targetDir = path.resolve(publicDir, 'hanzi-data')

const listJsonFiles = async (dir) => {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'package.json')
      .map((entry) => entry.name)
  } catch {
    return []
  }
}

const countRootJson = async (srcDir) => {
  const names = await listJsonFiles(srcDir)
  return names.length
}

const copyRootJson = async (srcDir, destDir) => {
  const names = await listJsonFiles(srcDir)
  if (names.length === 0) return 0

  await fs.rm(destDir, { recursive: true, force: true })
  await fs.mkdir(destDir, { recursive: true })

  await Promise.all(
    names.map((name) => fs.copyFile(path.join(srcDir, name), path.join(destDir, name))),
  )

  return names.length
}

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true })
}

const downloadFile = async (url, destPath) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下載失敗: ${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.writeFile(destPath, buf)
}

const downloadFromJsdelivr = async () => {
  await fs.rm(targetDir, { recursive: true, force: true })
  await ensureDir(targetDir)

  const flat = await fetch(JSDELIVR_FLAT_API).then((res) => res.json())
  const files = (flat?.files || [])
    .filter((file) => typeof file?.name === 'string' && file.name.endsWith('.json') && /^\/[^/]+\.json$/.test(file.name))
    .filter((file) => file.name !== '/package.json')
    .map((file) => file.name)

  const limit = Number.parseInt(process.env.HANZI_DATA_LIMIT || '', 10)
  const finalFiles = Number.isFinite(limit) && limit > 0 ? files.slice(0, limit) : files

  const concurrency = Math.max(1, Number.parseInt(process.env.HANZI_DATA_CONCURRENCY || '24', 10))
  let idx = 0
  let done = 0

  const worker = async () => {
    while (idx < finalFiles.length) {
      const current = finalFiles[idx]
      idx += 1

      const fileName = current.slice(1)
      const url = `${JSDELIVR_CDN_BASE}/${encodeURIComponent(fileName)}`
      const dest = path.resolve(targetDir, fileName)
      await downloadFile(url, dest)

      done += 1
      if (done % 200 === 0 || done === finalFiles.length) {
        process.stdout.write(`hanzi-data: ${done}/${finalFiles.length}\n`)
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))
  return finalFiles.length
}

const main = async () => {
  const desiredMin = Math.max(1, Number.parseInt(process.env.HANZI_DATA_MIN || '9000', 10))

  const localCount = await countRootJson(pkgRoot)
  const localDataDir = path.resolve(pkgRoot, 'data')
  const localDataCount = await countRootJson(localDataDir)

  const bestLocalDir = localDataCount > localCount ? localDataDir : pkgRoot
  const bestLocalCount = Math.max(localCount, localDataCount)

  if (bestLocalCount >= desiredMin) {
    const copied = await copyRootJson(bestLocalDir, targetDir)
    process.stdout.write(`hanzi-data(local): ${copied} files -> ${path.relative(rootDir, targetDir)}\n`)
    return
  }

  if ((process.env.HANZI_DATA_SOURCE || '').toLowerCase() === 'local') {
    const copied = await copyRootJson(bestLocalDir, targetDir)
    process.stdout.write(`hanzi-data(local): ${copied} files -> ${path.relative(rootDir, targetDir)}\n`)
    return
  }

  const downloaded = await downloadFromJsdelivr()
  process.stdout.write(`hanzi-data(cdn): ${downloaded} files -> ${path.relative(rootDir, targetDir)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error?.message || String(error)}\n`)
  process.exit(1)
})
