import type { KitaDto } from "#/lib/api";
import type { KitaResponse } from "./data.types";

export const transformData = (kitaResponse: KitaResponse): KitaDto => ({
  id: String(kitaResponse.id),
  name: kitaResponse.name,
  website: null,
  cost: null,
  latitude: kitaResponse.address.latitude ?? 0,
  longitude: kitaResponse.address.longitude ?? 0,
  hasVacancies: [
    kitaResponse.availabilities[0].predecessor,
    kitaResponse.availabilities[0].current,
    kitaResponse.availabilities[0].successor,
  ].some((a) => a.availability),
});
