import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fetchServerMenu } from './api/menu.js'

function serverMenuPlugin() {
  return {
    name: 'server-menu-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url === '/api/menu' || url === '/api/catalog') {
          try {
            const data = await fetchServerMenu();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache');
            res.statusCode = 200;
            res.end(JSON.stringify(data));
            return;
          } catch (err) {
            console.error('[Dev /api/menu Error]:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
        }
        next();
      });
    },
    async transformIndexHtml(html) {
      try {
        const preloadedData = await fetchServerMenu();
        if (Array.isArray(preloadedData) && preloadedData.length > 0) {
          const scriptTag = `<script id="server-preloaded-menu">window.__PRELOADED_MENU__ = ${JSON.stringify(preloadedData)};</script>`;
          return html.replace('</head>', `  ${scriptTag}\n  </head>`);
        }
      } catch (err) {
        console.warn('[Build Preload Warning] Live fetch during build skipped, falling back to runtime serverless route:', err.message);
      }
      return html;
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serverMenuPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'https://staropub-menu.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
