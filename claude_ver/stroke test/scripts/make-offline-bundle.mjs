import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptsDir, '..')

const distDir = path.resolve(rootDir, 'dist')
const outDir = path.resolve(rootDir, 'offline-build')

const serverMjs = `import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const cwd = process.cwd()
const port = Number.parseInt(process.env.PORT || '4173', 10)
const distDir = path.resolve(cwd, 'dist')

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
}

const safeJoin = (base, target) => {
  const targetPath = path.resolve(base, target)
  if (!targetPath.startsWith(base)) return null
  return targetPath
}

const tryReadFile = async (filePath) => {
  try {
    const buf = await fs.readFile(filePath)
    return buf
  } catch {
    return null
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const rawUrl = new URL(req.url || '/', 'http://localhost')
    const pathname = decodeURIComponent(rawUrl.pathname || '/')
    const requested = pathname === '/' ? '/index.html' : pathname
    const filePath = safeJoin(distDir, '.' + requested)

    const send = (statusCode, buf, ext) => {
      res.statusCode = statusCode
      if (ext) res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream')
      res.end(buf)
    }

    if (!filePath) {
      send(403, Buffer.from('Forbidden'))
      return
    }

    const ext = path.extname(filePath)
    const buf = await tryReadFile(filePath)
    if (buf) {
      send(200, buf, ext)
      return
    }

    if (!ext) {
      const html = await tryReadFile(path.join(distDir, 'index.html'))
      if (html) {
        send(200, html, '.html')
        return
      }
    }

    send(404, Buffer.from('Not Found'))
  } catch (error) {
    res.statusCode = 500
    res.end(error?.message || 'Internal Server Error')
  }
})

server.listen(port, '127.0.0.1', () => {
  process.stdout.write('Offline server running at http://localhost:' + port + '\\n')
})
`

const startPs1 = `Set-Location -Path $PSScriptRoot
$env:PORT = $env:PORT -ne $null ? $env:PORT : "4173"
Start-Process "http://localhost:$env:PORT/"
node server.mjs
`

const startBat = `@echo off
cd /d %~dp0
set PORT=4173
start "" "http://localhost:%PORT%/"
node server.mjs
`

const readmeTxt = `離線版本（可攜帶）

1) 先確認已安裝 Node.js（用於本地伺服器）
2) 直接執行 start-offline.ps1（PowerShell）或 start-offline.bat
3) 瀏覽器會打開 http://localhost:4173/

備註：
- dist/ 係前端 build 輸出
- server.mjs 只做本地靜態檔案服務，唔需要外網
`

const main = async () => {
  await fs.access(distDir)

  await fs.rm(outDir, { recursive: true, force: true })
  await fs.mkdir(outDir, { recursive: true })

  await fs.cp(distDir, path.resolve(outDir, 'dist'), { recursive: true })
  await fs.writeFile(path.resolve(outDir, 'server.mjs'), serverMjs, 'utf-8')
  await fs.writeFile(path.resolve(outDir, 'start-offline.ps1'), startPs1, 'utf-8')
  await fs.writeFile(path.resolve(outDir, 'start-offline.bat'), startBat, 'utf-8')
  await fs.writeFile(path.resolve(outDir, 'README.txt'), readmeTxt, 'utf-8')

  process.stdout.write(`offline-build ready -> ${path.relative(rootDir, outDir)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error?.message || String(error)}\n`)
  process.exit(1)
})

