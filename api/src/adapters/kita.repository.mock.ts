// Adapter - Mock in-memory implementation for testing/development

import { Injectable } from '@nestjs/common';
import { IKitaRepository } from '../ports/kita.repository.interface';
import { Kita, BoundingBox, CreateKitaInput } from '../domain/kita.model';

@Injectable()
export class KitaRepositoryMock implements IKitaRepository {
  private kitas: Kita[] = [
    {
      id: '1',
      name: 'Kindergarten Schwabing',
      website: 'https://example.com/schwabing',
      cost: 450.0,
      latitude: 48.1641,
      longitude: 11.5822,
      hasVacancies: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      name: 'Kita Maxvorstadt',
      website: 'https://example.com/maxvorstadt',
      cost: 380.5,
      latitude: 48.1486,
      longitude: 11.5656,
      hasVacancies: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '3',
      name: 'Kinderhaus Giesing',
      website: null,
      cost: 420.0,
      latitude: 48.1102,
      longitude: 11.5869,
      hasVacancies: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '4',
      name: 'Kita Haidhausen',
      website: 'https://example.com/haidhausen',
      cost: 500.0,
      latitude: 48.1302,
      longitude: 11.5989,
      hasVacancies: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '5',
      name: 'Kindergarten Sendling',
      website: 'https://example.com/sendling',
      cost: null,
      latitude: 48.1089,
      longitude: 11.5436,
      hasVacancies: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '6',
      name: 'Kita Neuhausen',
      website: 'https://example.com/neuhausen',
      cost: 410.0,
      latitude: 48.1589,
      longitude: 11.5436,
      hasVacancies: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '7',
      name: 'Kinderhaus Bogenhausen',
      website: 'https://example.com/bogenhausen',
      cost: 550.0,
      latitude: 48.1589,
      longitude: 11.6156,
      hasVacancies: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '8',
      name: 'Kita Pasing',
      website: null,
      cost: 395.0,
      latitude: 48.1499,
      longitude: 11.4619,
      hasVacancies: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  findAll(): Promise<Kita[]> {
    return Promise.resolve(
      [...this.kitas].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  findInBoundingBox(boundingBox: BoundingBox): Promise<Kita[]> {
    return Promise.resolve(
      this.kitas
        .filter(
          (kita) =>
            kita.latitude >= boundingBox.southWest.lat &&
            kita.latitude <= boundingBox.northEast.lat &&
            kita.longitude >= boundingBox.southWest.lng &&
            kita.longitude <= boundingBox.northEast.lng,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  findNearPoint(lat: number, lng: number, radiusKm: number): Promise<Kita[]> {
    const kitasWithDistance = this.kitas
      .map((kita) => ({
        kita,
        distance: this.calculateDistance(
          lat,
          lng,
          kita.latitude,
          kita.longitude,
        ),
      }))
      .filter((item) => item.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return Promise.resolve(kitasWithDistance.map((item) => item.kita));
  }

  findWithVacancies(): Promise<Kita[]> {
    return Promise.resolve(
      this.kitas
        .filter((kita) => kita.hasVacancies)
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  upsert(data: CreateKitaInput): Promise<Kita> {
    // Try to find existing by name and approximate location
    const existingIndex = this.kitas.findIndex(
      (k) =>
        k.name === data.name &&
        Math.abs(k.latitude - data.latitude) < 0.001 &&
        Math.abs(k.longitude - data.longitude) < 0.001,
    );

    const now = new Date();

    if (existingIndex >= 0) {
      // Update existing
      const updated: Kita = {
        ...this.kitas[existingIndex],
        website: data.website || null,
        cost: data.cost || null,
        latitude: data.latitude,
        longitude: data.longitude,
        hasVacancies: data.hasVacancies ?? false,
        updatedAt: now,
      };
      this.kitas[existingIndex] = updated;
      return Promise.resolve(updated);
    } else {
      // Create new
      const newKita: Kita = {
        id: (this.kitas.length + 1).toString(),
        name: data.name,
        website: data.website || null,
        cost: data.cost || null,
        latitude: data.latitude,
        longitude: data.longitude,
        hasVacancies: data.hasVacancies ?? false,
        createdAt: now,
        updatedAt: now,
      };
      this.kitas.push(newKita);
      return Promise.resolve(newKita);
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
