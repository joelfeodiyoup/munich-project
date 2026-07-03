// API client for Munich Kitas backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface KitaDto {
  id: string;
  name: string;
  website: string | null;
  cost: number | null;
  latitude: number;
  longitude: number;
  hasVacancies: boolean;
}

export interface BoundingBox {
  northEast: {
    lat: number;
    lng: number;
  };
  southWest: {
    lat: number;
    lng: number;
  };
}

export async function fetchKitas(params?: {
  boundingBox?: BoundingBox;
  center?: { lat: number; lng: number; radius?: number };
  vacancies?: boolean;
}): Promise<KitaDto[]> {
  const url = new URL(`${API_BASE_URL}/kitas`);

  if (params?.boundingBox) {
    url.searchParams.set('neLat', params.boundingBox.northEast.lat.toString());
    url.searchParams.set('neLng', params.boundingBox.northEast.lng.toString());
    url.searchParams.set('swLat', params.boundingBox.southWest.lat.toString());
    url.searchParams.set('swLng', params.boundingBox.southWest.lng.toString());
  }

  if (params?.center) {
    url.searchParams.set('lat', params.center.lat.toString());
    url.searchParams.set('lng', params.center.lng.toString());
    if (params.center.radius) {
      url.searchParams.set('radius', params.center.radius.toString());
    }
  }

  if (params?.vacancies) {
    url.searchParams.set('vacancies', 'true');
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch kitas: ${response.statusText}`);
  }

  return response.json();
}
