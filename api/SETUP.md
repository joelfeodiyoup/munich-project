# Database Setup Instructions

## Prerequisites
- Docker installed and running

## Setup Steps

### 1. Clean up mixed package manager state
```bash
cd /home/joel/munich-project/api
rm -rf node_modules pnpm-lock.yaml pnpm-workspace.yaml
```

### 2. Install dependencies with npm
```bash
npm install
npm install prisma @prisma/client --save
```

### 3. Start PostgreSQL with Docker
```bash
cd /home/joel/munich-project
docker-compose up -d
```

### 4. Run Prisma migrations
```bash
cd /home/joel/munich-project/api
npx prisma migrate dev --name init
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

## Useful Commands

### View database in Prisma Studio
```bash
npx prisma studio
```

### Create a new migration
```bash
npx prisma migrate dev --name <migration_name>
```

### Reset database
```bash
npx prisma migrate reset
```

### Format schema
```bash
npx prisma format
```

## Database Schema

The schema includes:
- **Kita**: Main table for kindergarten data (name, website, cost, location, vacancies)
- **User**: User accounts for tracking preferences
- **UserKitaPreference**: Junction table tracking which kitas users are interested in/not interested in
