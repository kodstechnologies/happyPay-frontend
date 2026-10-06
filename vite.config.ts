import react from '@vitejs/plugin-react'
import http from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const RD_SERVICE_PORT = 11100

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })

    req.on('error', reject)
  })
}

function forwardRdRequest(
  method: string,
  path: string,
  res: ServerResponse,
  body?: string,
  headers: Record<string, string> = {},
) {
  const proxyReq = http.request(
    {
      hostname: '127.0.0.1',
      port: RD_SERVICE_PORT,
      path,
      method,
      headers: {
        ...headers,
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
      },
    },
    (proxyRes: IncomingMessage) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )

  proxyReq.on('error', () => {
    if (!res.writableEnded) {
      res.statusCode = 502
      res.end('MFS110 RD Service is not reachable')
    }
  })

  if (body) {
    proxyReq.write(body)
  }

  proxyReq.end()
}

function mantraRdServiceProxy(): Plugin {
  return {
    name: 'mantra-rd-service-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/rd-service')) {
          return next()
        }

        const url = new URL(req.url, 'http://localhost')
        const subPath = url.pathname.replace(/^\/rd-service/, '') || '/'

        try {
          if (subPath === '/discover' && req.method === 'GET') {
            return forwardRdRequest('RDSERVICE', '/', res)
          }

          if (subPath === '/info' && req.method === 'GET') {
            return forwardRdRequest('DEVICEINFO', '/rd/info', res)
          }

          if (subPath === '/capture' && req.method === 'POST') {
            const body = await readRequestBody(req)
            return forwardRdRequest('CAPTURE', '/rd/capture', res, body, {
              'Content-Type': req.headers['content-type'] || 'text/xml',
            })
          }
        } catch {
          if (!res.writableEnded) {
            res.statusCode = 500
            res.end('Failed to proxy RD Service request')
          }
          return
        }

        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), mantraRdServiceProxy()],
})
