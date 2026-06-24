import http from 'node:http'
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
  process.stdout.write('Offline server running at http://localhost:' + port + '\n')
})
