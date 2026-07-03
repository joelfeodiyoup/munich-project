// Pure domain model - no dependencies on infrastructure

export interface Kita {
  id: string;
  name: string;
  website: string | null;
  cost: number | null;
  latitude: number;
  longitude: number;
  hasVacancies: boolean;
  createdAt: Date;
  updatedAt: Date;
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

export interface CreateKitaInput {
  name: string;
  website?: string;
  cost?: number;
  latitude: number;
  longitude: number;
  hasVacancies?: boolean;
}
