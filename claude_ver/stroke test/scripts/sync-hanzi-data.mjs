import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptsDir, '..')

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

const main = async () => {
  const rootCount = await copyRootJson(pkgRoot, targetDir)
  if (rootCount > 0) {
    process.stdout.write(`hanzi-data: ${rootCount} files -> ${path.relative(rootDir, targetDir)}\n`)
    return
  }

  const dataDir = path.resolve(pkgRoot, 'data')
  const dataCount = await copyRootJson(dataDir, targetDir)
  if (dataCount > 0) {
    process.stdout.write(`hanzi-data: ${dataCount} files -> ${path.relative(rootDir, targetDir)}\n`)
    return
  }

  throw new Error('找不到 hanzi-writer-data JSON 檔案（請確認已安裝依賴，並且套件內含字庫檔）')
}

main().catch((error) => {
  process.stderr.write(`${error?.message || String(error)}\n`)
  process.exit(1)
})

