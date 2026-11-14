# Gari Yangu – full stack (React + Flask)

Reverse car marketplace: buyers post what they want, verified dealers send offers.

    gari-yangu/
    ├── backend/    Flask API (SQLAlchemy, JWT auth, SQLite by default)
    ├── frontend/   React + Vite app (talks to the API through src/api.js)
    └── gari-yangu-schema.dbml

## Run it (development) – two terminals

Requirements: **Python 3.10+** and **Node 18+**.

**Terminal 1 – backend** (http://localhost:8000)

    cd backend
    python -m venv venv
    source venv/bin/activate            # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    python run.py

On first start it creates `gariyangu.db` and loads demo data automatically.

**Terminal 2 – frontend** (http://localhost:5173)

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173. Vite proxies `/api` to the Flask server on port 8000, so no CORS or URL setup is needed.

### Demo accounts (password `demo1234`)
| Role   | Email             |
|--------|-------------------|
| Buyer  | buyer@demo.com    |
| Dealer | dealer@demo.com   |
| Admin  | admin@demo.com    |

Other dealers (e.g. `savannah@dealers.demo`, pending approval) use the same password.

### Reset the demo data

    cd backend && flask --app run seed

### Run the tests

    cd backend && python -m pytest -q

## Single-server mode (production-style)

    cd frontend && npm run build
    cd ../backend && python run.py          # or: gunicorn run:app -b 0.0.0.0:8000

If `frontend/dist` exists, Flask serves the app and the API together at http://localhost:8000.

## Configuration (`backend/.env`, copy from `.env.example`)
| Variable       | Default                      | Notes |
|----------------|------------------------------|-------|
| SECRET_KEY     | dev value                    | **Set a long random value in production** |
| DATABASE_URL   | sqlite file in `backend/`    | e.g. `postgresql+psycopg2://user:pass@host/db` (also `pip install psycopg2-binary`) |
| CORS_ORIGINS   | http://localhost:5173        | Comma-separated; only needed if frontend is on another origin |
| TOKEN_HOURS    | 72                           | Login session length |

If the frontend is hosted separately from the API, build it with `VITE_API_URL=https://your-api.example.com npm run build`.

## API overview
Auth uses `Authorization: Bearer <token>` (returned by login/register). Errors are `{"error": "message"}`.

| Method & path | Who | Purpose |
|---|---|---|
| POST `/api/auth/register`, `/api/auth/login`; GET `/api/auth/me` | public / any | Accounts (dealers register as `pending`) |
| GET `/api/cars`, `/api/cars/<id>` | public | Active listings |
| POST `/api/requests`; GET `/api/requests/mine`; POST `/api/requests/<id>/close` | buyer | Post & manage car requests |
| POST `/api/offers/<id>/accept` · `/decline` · `/review` | buyer | Act on offers; review dealer after accepting |
| GET `/api/dealer/requests`; GET `/api/dealer/offers`; GET `/api/dealer/stats` | dealer | Browse open requests, my offers, dashboard |
| POST `/api/dealer/offers`; POST `/api/dealer/offers/<id>/withdraw` | approved dealer | Send / withdraw offers |
| GET/POST `/api/dealer/listings`; PUT/DELETE `/api/dealer/listings/<id>`; POST `.../status` | dealer | Manage own stock |
| GET `/api/admin/dealers`; POST `/api/admin/dealers/<user_id>/review` | admin | Approve / reject dealers |

Rules enforced server-side: role checks, ownership checks, only approved dealers may send offers, one offer per dealer per request (withdrawn offers can be re-sent), dealer phone number revealed to the buyer only after acceptance, accepting an offer declines the others and fulfils the request.

## What changed in the frontend
Only `src/api.js` (now real `fetch` calls with a JWT) and a small tweak in `src/AuthContext.jsx` (logout clears the token). Pages are unchanged. The `backend/` Django stub that shipped empty was replaced with Flask.

## Gari Yangu 2.0 visual refresh

The React/Vite frontend now uses a futuristic luxury visual direction: a midnight/graphite interface, electric-lime accents, cinematic hero treatment, glass-style search panel, refined vehicle cards, dashboard surfaces, dark forms, responsive layouts, and reduced-motion support. Existing React routes, API client calls, authentication flow, and Flask backend files are retained.

The homepage hero uses a remotely hosted Unsplash automotive background image; an internet connection is needed to load that decorative image. All core application functionality remains local/API-driven.


## Dealer vehicle photos

Dealers can add up to 10 real photos to each vehicle from **Manage listings → Add a listing / Edit**. Select JPG, PNG, or WebP images (maximum 5 MB each and minimum 320 × 200 pixels). The server validates and converts accepted photos to optimized WebP files. The first uploaded image is the cover photo; dealers can change the cover or remove images later.

Uploaded files are stored in `backend/uploads` by default and served from `/uploads/<filename>`. Set `UPLOAD_FOLDER` in `backend/.env` to choose another persistent directory. The database stores image metadata in the `listing_images` table, which is created automatically on startup; existing listing rows do not need a schema alteration. For production deployments with ephemeral server disks or multiple app instances, configure a persistent shared volume or replace the local file store with object storage (for example S3 or Cloudinary).
