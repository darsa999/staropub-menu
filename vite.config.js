import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fetchServerMenu, fetchServerSettings } from './api/menu.js'

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
            res.setHeader('Cache-Control', 'no-store');
            res.statusCode = 200;
            res.end(JSON.stringify(Array.isArray(data) ? data : []));
            return;
          } catch (err) {
            console.error('[Dev /api/menu Error]:', err);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify([]));
            return;
          }
        }
        if (url === '/api/settings') {
          try {
            const data = await fetchServerSettings();
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Cache-Control', 'no-store');
            res.statusCode = 200;
            res.end(JSON.stringify(data || {}));
            return;
          } catch (err) {
            console.error('[Dev /api/settings Error]:', err);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({}));
            return;
          }
        }
        next();
      });
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
