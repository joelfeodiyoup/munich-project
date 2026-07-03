// Adapter - Prisma/PostgreSQL implementation of the repository

import { Injectable } from '@nestjs/common';
import { IKitaRepository } from '../ports/kita.repository.interface';
import { Kita, BoundingBox, CreateKitaInput } from '../domain/kita.model';
import { Decimal } from '@prisma/client/runtime/client';
import { PrismaService } from 'src/prisma.service';
import { Kita as KitaPrisma } from '@prisma/client';

@Injectable()
export class KitaRepositoryPrisma implements IKitaRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Kita[]> {
    const kitas = await this.prisma.kita.findMany({
      orderBy: { name: 'asc' },
    });
    return kitas.map((k) => this.toDomain(k));
  }

  async findInBoundingBox(boundingBox: BoundingBox): Promise<Kita[]> {
    const kitas = await this.prisma.kita.findMany({
      where: {
        latitude: {
          gte: new Decimal(boundingBox.southWest.lat),
          lte: new Decimal(boundingBox.northEast.lat),
        },
        longitude: {
          gte: new Decimal(boundingBox.southWest.lng),
          lte: new Decimal(boundingBox.northEast.lng),
        },
      },
      orderBy: { name: 'asc' },
    });
    return kitas.map((k) => this.toDomain(k));
  }

  async findNearPoint(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<Kita[]> {
    // Simple bounding box approximation
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    const kitas = await this.prisma.kita.findMany({
      where: {
        latitude: {
          gte: new Decimal(lat - latDelta),
          lte: new Decimal(lat + latDelta),
        },
        longitude: {
          gte: new Decimal(lng - lngDelta),
          lte: new Decimal(lng + lngDelta),
        },
      },
      orderBy: { name: 'asc' },
    });

    // Filter by actual distance and sort
    const kitasWithDistance = kitas
      .map((kita) => ({
        kita,
        distance: this.calculateDistance(
          lat,
          lng,
          kita.latitude.toNumber(),
          kita.longitude.toNumber(),
        ),
      }))
      .filter((item) => item.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return kitasWithDistance.map((item) => this.toDomain(item.kita));
  }

  async findWithVacancies(): Promise<Kita[]> {
    const kitas = await this.prisma.kita.findMany({
      where: { hasVacancies: true },
      orderBy: { name: 'asc' },
    });
    return kitas.map((k) => this.toDomain(k));
  }

  async upsert(data: CreateKitaInput): Promise<Kita> {
    // Try to find existing kita by name and approximate location
    const existing = await this.prisma.kita.findFirst({
      where: {
        name: data.name,
        latitude: {
          gte: new Decimal(data.latitude - 0.001),
          lte: new Decimal(data.latitude + 0.001),
        },
        longitude: {
          gte: new Decimal(data.longitude - 0.001),
          lte: new Decimal(data.longitude + 0.001),
        },
      },
    });

    const kita = existing
      ? await this.prisma.kita.update({
          where: { id: existing.id },
          data: {
            website: data.website,
            cost: data.cost ? new Decimal(data.cost) : null,
            latitude: new Decimal(data.latitude),
            longitude: new Decimal(data.longitude),
            hasVacancies: data.hasVacancies ?? false,
          },
        })
      : await this.prisma.kita.create({
          data: {
            name: data.name,
            website: data.website,
            cost: data.cost ? new Decimal(data.cost) : null,
            latitude: new Decimal(data.latitude),
            longitude: new Decimal(data.longitude),
            hasVacancies: data.hasVacancies ?? false,
          },
        });

    return this.toDomain(kita);
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

  private toDomain(prismaKita: KitaPrisma): Kita {
    return {
      id: prismaKita.id,
      name: prismaKita.name,
      website: prismaKita.website,
      cost: prismaKita.cost ? prismaKita.cost.toNumber() : null,
      latitude: prismaKita.latitude.toNumber(),
      longitude: prismaKita.longitude.toNumber(),
      hasVacancies: prismaKita.hasVacancies,
      createdAt: prismaKita.createdAt,
      updatedAt: prismaKita.updatedAt,
    };
  }
}
