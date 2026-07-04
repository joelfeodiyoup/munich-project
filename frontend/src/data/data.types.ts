type Availability = {
  availability?: number;
  referenceDate: [number, number, number];
};
export type KitaResponse = {
  id: number;
  address: {
    street?: string;
    number?: string;
    postalSupplement?: string;
    postalcode?: string;
    town?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
    postfachVerwenden: boolean;
  };
  barrierfree: boolean;
  careFrom: number;
  careTo: number;
  careType?: string;
  educationalConcept?: string;
  flexibleCareTime: boolean;
  integrational: boolean;
  institution: string;
  name: string;
  openingHoursFrom: number;
  openingHoursTo: number;
  schoolDistrict?: string;
  applicationAllowed: boolean;
  plaetzeAmpelAnzeigenImEpOhneOnlineAnmeldung: boolean;
  type: string;
  availabilities: Array<{
    dayCareId: number;
    predecessor: Availability;
    current: Availability;
    successor: Availability;
  }>;
  imageIds: number[];
  bietetNebenvertraegeAn?: boolean;
  agbVorhanden: boolean;
  bilder: Array<{
    bildId: number;
    titel: string;
    beschreibung: string | null;
    bildQuelle: string | null;
  }>;
  infoVonDerEinrichtung?: string;
  auswaehlbareBetreuungszeiten: string[];
};
