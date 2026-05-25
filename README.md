# Shoe Dev

Shoe model development tracker: catalog of models with permanent attributes, custom fields, image galleries, and threaded comments with attachments. Username/password authentication.

## Stack

- **Frontend**: React + Vite (port 5173)
- **Backend**: Node.js + Express (port 3001)
- **Database**: SQLite
- **Image storage**: [Cloudinary](https://cloudinary.com/) (or local `backend/uploads/` if not configured)

## Quick start

```bash
npm install
npm run install:all
cp backend/.env.example backend/.env   # add Cloudinary credentials
npm run seed
npm run dev
```

### Cloudinary setup

1. Create a free account at [cloudinary.com](https://cloudinary.com/).
2. Copy **Cloud name**, **API Key**, and **API Secret** from the dashboard.
3. Paste them into `backend/.env` (see `backend/.env.example`).

Images are uploaded to the `shoe-dev/` folder in your Cloudinary account (`main`, `gallery`, `comments` subfolders). Without credentials, uploads fall back to local disk under `backend/uploads/`.

Open [http://localhost:5173](http://localhost:5173).

**Default login** (after seed): `admin` / `admin`

## Bulk import (CSV)

On the main sheet, use **Download CSV template** then **Import CSV** to add many color variants at once. Required columns: `MODEL NUMBER`, `UPDATED MODEL NAME`. Header names match the sheet (e.g. `UPPER COLOR`, `SN`). Photos are not imported via CSV — add them on the model page after import.

## Features

| Area | Details |
|------|---------|
| **List** | All models with title, type, serial number, upper color, main picture, custom fields |
| **New model** | Permanent fields + optional custom values before save |
| **Item page** | Full gallery, add more pictures, custom fields, comments with image attachments |
| **Auth** | Register or sign in; JWT protects all item routes |

## API (authenticated)

- `POST /api/auth/login` — `{ username, password }`
- `POST /api/auth/register` — `{ username, password }`
- `GET /api/items` — list
- `GET /api/items/:id` — detail with images & comments
- `POST /api/items` — multipart: title, type, serial_number, upper_color, main_image
- `POST /api/items/:id/fields` — `{ field_name, field_value }`
- `POST /api/items/:id/images` — multipart `images[]`
- `POST /api/items/:id/comments` — multipart `body`, optional `images[]`

## Production notes

Set `JWT_SECRET` and Cloudinary variables in the environment. Run `npm run build` in `frontend` and serve `frontend/dist` behind your reverse proxy with API proxy to the backend.
