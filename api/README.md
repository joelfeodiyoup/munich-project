# Munich Kitas API

NestJS API with hexagonal architecture for managing Munich kindergarten data.

## Architecture

```
src/
├── domain/               # Pure domain models (no dependencies)
│   └── kita.model.ts
├── ports/                # Interfaces (what the domain needs)
│   └── kita.repository.interface.ts
├── adapters/             # Implementations (how we fulfill the needs)
│   ├── kita.repository.prisma.ts   # PostgreSQL implementation
│   └── kita.repository.mock.ts     # In-memory mock implementation
├── app.service.ts        # Domain logic (uses the port interface)
└── app.controller.ts     # REST adapter
```

## Switching Between Mock and Real Data

Set the `USE_MOCK_DATA` environment variable:

**Use mock data (8 sample kitas in memory):**
```bash
USE_MOCK_DATA=true npm run start:dev
```

**Use PostgreSQL (requires DB setup):**
```bash
npm run start:dev
# or explicitly:
USE_MOCK_DATA=false npm run start:dev
```

### When to use mock data:
- Frontend development without database setup
- Quick testing
- CI/CD pipeline tests

### When to use real data:
- Production
- Data ingestion from scraping
- Testing actual database queries

## API Endpoints

### GET /kitas
Get kitas with optional filtering:

```bash
# Get all kitas
curl http://localhost:3001/kitas

# Get kitas in bounding box (map viewport)
curl "http://localhost:3001/kitas?neLat=48.2&neLng=11.7&swLat=48.0&swLng=11.4"

# Get kitas near a point (default 2km radius)
curl "http://localhost:3001/kitas?lat=48.1372&lng=11.5761&radius=5"

# Get only kitas with vacancies
curl "http://localhost:3001/kitas?vacancies=true"
```

### POST /kitas
Create or update a kita (for data ingestion):

```bash
curl -X POST http://localhost:3001/kitas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Kita",
    "website": "https://example.com",
    "cost": 450.00,
    "latitude": 48.137154,
    "longitude": 11.576124,
    "hasVacancies": true
  }'
```

## Database Setup

See [SETUP.md](./SETUP.md) for database configuration.

## Development

```bash
# Start with mock data
USE_MOCK_DATA=true npm run start:dev

# Start with PostgreSQL
npm run start:dev

# Build
npm run build

# Run tests
npm run test
```
