import { Injectable, Inject } from '@nestjs/common';
import type { IKitaRepository } from './ports/kita.repository.interface';
import { KITA_REPOSITORY } from './ports/kita.repository.interface';
import { Kita, BoundingBox, CreateKitaInput } from './domain/kita.model';

@Injectable()
export class AppService {
  constructor(
    @Inject(KITA_REPOSITORY)
    private readonly kitaRepository: IKitaRepository,
  ) {}

  // Core domain logic: Get all kitas
  async getAllKitas(): Promise<Kita[]> {
    return this.kitaRepository.findAll();
  }

  // Core domain logic: Get kitas within a bounding box (for map viewport)
  async getKitasInBoundingBox(boundingBox: BoundingBox): Promise<Kita[]> {
    return this.kitaRepository.findInBoundingBox(boundingBox);
  }

  // Core domain logic: Get kitas near a point (radius in km)
  async getKitasNearPoint(
    lat: number,
    lng: number,
    radiusKm: number = 2,
  ): Promise<Kita[]> {
    return this.kitaRepository.findNearPoint(lat, lng, radiusKm);
  }

  // Core domain logic: Get kitas with vacancies
  async getKitasWithVacancies(): Promise<Kita[]> {
    return this.kitaRepository.findWithVacancies();
  }

  // Core domain logic: Create or update a kita (for data ingestion)
  async upsertKita(data: CreateKitaInput): Promise<Kita> {
    return this.kitaRepository.upsert(data);
  }
}
