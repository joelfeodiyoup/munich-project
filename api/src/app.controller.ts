import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import type { Kita, BoundingBox, CreateKitaInput } from './domain/kita.model';

@Controller('kitas')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // GET /kitas - Get all kitas (simple case for initial map load)
  @Get()
  async getKitas(
    @Query('neLat') neLat?: string,
    @Query('neLng') neLng?: string,
    @Query('swLat') swLat?: string,
    @Query('swLng') swLng?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
    @Query('vacancies') vacancies?: string,
  ): Promise<Kita[]> {
    // Filter by vacancies
    if (vacancies === 'true') {
      return this.appService.getKitasWithVacancies();
    }

    // Search by radius around a point
    if (lat && lng) {
      const radiusKm = radius ? parseFloat(radius) : 2;
      return this.appService.getKitasNearPoint(
        parseFloat(lat),
        parseFloat(lng),
        radiusKm,
      );
    }

    // Search within bounding box (map viewport)
    if (neLat && neLng && swLat && swLng) {
      const boundingBox: BoundingBox = {
        northEast: {
          lat: parseFloat(neLat),
          lng: parseFloat(neLng),
        },
        southWest: {
          lat: parseFloat(swLat),
          lng: parseFloat(swLng),
        },
      };
      return this.appService.getKitasInBoundingBox(boundingBox);
    }

    // Default: return all kitas
    return this.appService.getAllKitas();
  }

  // POST /kitas - Create or update a kita (for data ingestion)
  @Post()
  async createKita(@Body() data: CreateKitaInput): Promise<Kita> {
    return this.appService.upsertKita(data);
  }
}
