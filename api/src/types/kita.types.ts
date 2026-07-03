// import { Decimal } from '@prisma/client/runtime/library';

import { Decimal } from '@prisma/client/runtime/client';

export interface Kita {
  id: string;
  name: string;
  website: string | null;
  cost: Decimal | null;
  latitude: Decimal;
  longitude: Decimal;
  hasVacancies: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface CreateKitaDto {
  name: string;
  website?: string;
  cost?: number;
  latitude: number;
  longitude: number;
  hasVacancies?: boolean;
}
