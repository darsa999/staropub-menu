# StaroPub Menu

Digital menu for StaroPub (React 19 + Vite + Tailwind), deployed on Vercel. Menu
data and admin authentication live on a separate backend hosted on Render.

## Architecture

```
browser ──► Vercel
            ├── static SPA (dist/)
            ├── api/menu.js      GET  grouped menu, edge-cached (s-maxage=60, SWR 24h)
            ├── api/catalog.js   alias of /api/menu
            ├── api/settings.js  GET  public feature flags only · PUT/PATCH proxied to backend with caller's auth
            ├── api/calls.js     POST waiter/bill/order calls (validated, rate-limited) · GET/DELETE admin only
            ├── api/reviews.js   POST guest reviews (validated, rate-limited) · GET admin only
            └── /api/*           rewritten to the Render backend (auth, categories, dishes, upload)
```

- `shared/menuTransform.js` — dish/category normalization, price parsing, Cloudinary
  URLs. Used by both the functions and the browser bundle.
- `api/_lib/upstream.js` — server-side fetch with timeouts, admin verification
  (via the backend's `/auth/me`), rate limiting.
- `src/services/api.js` — menu loading for guests; `src/services/adminApi.js` —
  the single admin API client (throws on non-2xx, logs out on 401).
- Routes: `/`, `/menu` (`#category-<id>` deep links), `/about`, `/admin`.
  The `?table=N` query from table QR codes is kept across navigation.
- The admin page, About page and Firebase are lazy-loaded chunks.

## Development

```bash
npm install
npm run dev        # Vite + the api/*.js functions running locally
npm test           # Vitest unit tests (tests/)
npm run lint       # oxlint
npm run build
```

`npm run dev` talks to the production Render backend by default. Point it at
another backend with `BACKEND_API_URL=http://localhost:4000/api npm run dev`.

See `.env.example` for all environment variables.

## Known backend limitations

Waiter calls and reviews are stored inside the backend's settings document using
read-modify-write, so two writes at the same instant can race. The proper fix is a
dedicated `calls`/`reviews` collection with atomic inserts on the Render backend.
