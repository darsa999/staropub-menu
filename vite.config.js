import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import menuHandler from './api/menu.js'
import settingsHandler from './api/settings.js'
import callsHandler from './api/calls.js'
import reviewsHandler from './api/reviews.js'
import { BACKEND_BASE } from './api/_lib/upstream.js'

const LOCAL_FUNCTIONS = {
  '/api/menu': menuHandler,
  '/api/catalog': menuHandler,
  '/api/settings': settingsHandler,
  '/api/calls': callsHandler,
  '/api/reviews': reviewsHandler,
}

function readRawBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', (chunk) => { raw += chunk })
    req.on('end', () => resolve(raw))
    req.on('error', () => resolve(''))
  })
}

// Runs the api/*.js Vercel functions locally so `vite dev` matches production routing.
function localFunctionsPlugin() {
  return {
    name: 'local-vercel-functions',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost')
        const handler = LOCAL_FUNCTIONS[url.pathname]
        if (!handler) return next()

        req.query = Object.fromEntries(url.searchParams)
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          req.body = await readRawBody(req)
        }
        try {
          await handler(req, res)
        } catch (err) {
          console.error(`[dev ${url.pathname}]`, err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'internal_error' }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localFunctionsPlugin()],
  server: {
    proxy: {
      // Everything not handled by a local function goes to the Render backend.
      '/api': {
        // Override with BACKEND_API_URL=http://localhost:4000/api to develop against a local backend.
        target: new URL(BACKEND_BASE).origin,
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        advancedChunks: {
          groups: [{ name: 'react-vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ }],
        },
      },
    },
  },
})
