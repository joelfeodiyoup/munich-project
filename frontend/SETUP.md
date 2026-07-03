# Frontend Setup

## Environment Variables

1. Create a `.env` file (optional - uses defaults if not present):
```bash
cp .env.example .env
```

2. Configure the API URL if needed (defaults to `http://localhost:3001`):
```
VITE_API_URL=http://localhost:3001
```

## Running the Frontend

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

- **Interactive Map**: Displays all kitas in Munich using OpenStreetMap (free, no API key needed)
- **Color-coded Markers**: 
  - Green = Has vacancies
  - Red = No vacancies
- **Interactive Popups**: Click any marker to see:
  - Kita name
  - Vacancy status
  - Cost (if available)
  - Link to website (if available)
  - Link to Google Maps for directions

## Map Controls

- Zoom: Scroll wheel or +/- buttons
- Pan: Click and drag

## Technology

- **Leaflet + React-Leaflet**: Free, open-source mapping library
- **OpenStreetMap**: Free map tiles (no API key required)
- **Google Maps Integration**: Popup links open location in Google Maps
