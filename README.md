# mini-concert-booking-app

Mini concert ticket booking app with Spring Boot backend, Next.js frontend, PostgreSQL, and Redis.

## Project Layout

```text
.
├── client/                 # Next.js frontend
├── server/                 # Spring Boot backend and Gradle wrapper
├── docker-compose.yml      # Local Docker orchestration
├── docker-compose.prod.yml # Production override skeleton
├── .env.example            # Docker Compose env template
└── README.md
```

Gradle lives inside `server/`, so backend commands should be run from that directory.

## Local Development

Backend:

```powershell
cd server
Copy-Item .env.example .env
.\gradlew.bat bootRun
```

Frontend:

```powershell
cd client
Copy-Item .env.local.example .env.local
pnpm install
pnpm dev
```

## Docker Development

Create a Docker env file from the template, then start the stack:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Services:

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- PgAdmin: `http://localhost:5050`

Do not commit real `.env`, `server/.env`, or `client/.env.local` files.
