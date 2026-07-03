// Port - interface that defines what the domain needs from persistence

import { Kita, BoundingBox, CreateKitaInput } from '../domain/kita.model';

export interface IKitaRepository {
  findAll(): Promise<Kita[]>;

  findInBoundingBox(boundingBox: BoundingBox): Promise<Kita[]>;

  findNearPoint(lat: number, lng: number, radiusKm: number): Promise<Kita[]>;

  findWithVacancies(): Promise<Kita[]>;

  upsert(data: CreateKitaInput): Promise<Kita>;
}

export const KITA_REPOSITORY = Symbol('KITA_REPOSITORY');
