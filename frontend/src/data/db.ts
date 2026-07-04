import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import { api_01_response } from './api_01';

let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  console.log('Initializing SQLite database...');
  const startTime = performance.now();

  // Initialize sql.js with WASM file
  // Use BASE_URL to handle GitHub Pages deployment with base path
  const baseUrl = import.meta.env.BASE_URL || '/';
  const SQL = await initSqlJs({
    locateFile: (file) => `${baseUrl}sql-wasm.wasm`,
  });

  // Create empty database in memory
  const db = new SQL.Database();

  // Create table with all the fields from KitaResponse
  db.run(`
    CREATE TABLE kitas (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      institution TEXT,
      type TEXT,
      street TEXT,
      number TEXT,
      postalcode TEXT,
      town TEXT,
      district TEXT,
      latitude REAL,
      longitude REAL,
      barrierfree INTEGER,
      care_from INTEGER,
      care_to INTEGER,
      educational_concept TEXT,
      flexible_care_time INTEGER,
      integrational INTEGER,
      opening_hours_from INTEGER,
      opening_hours_to INTEGER,
      application_allowed INTEGER,
      current_availability INTEGER,
      current_reference_date TEXT,
      info TEXT
    )
  `);

  // Create indexes for common queries
  db.run(`CREATE INDEX idx_latitude ON kitas(latitude)`);
  db.run(`CREATE INDEX idx_longitude ON kitas(longitude)`);
  db.run(`CREATE INDEX idx_type ON kitas(type)`);
  db.run(`CREATE INDEX idx_barrierfree ON kitas(barrierfree)`);
  db.run(`CREATE INDEX idx_integrational ON kitas(integrational)`);
  db.run(`CREATE INDEX idx_availability ON kitas(current_availability)`);
  db.run(`CREATE INDEX idx_opening_hours_from ON kitas(opening_hours_from)`);
  db.run(`CREATE INDEX idx_opening_hours_to ON kitas(opening_hours_to)`);

  // Prepare insert statement
  const stmt = db.prepare(`
    INSERT INTO kitas (
      id, name, institution, type,
      street, number, postalcode, town, district,
      latitude, longitude,
      barrierfree, care_from, care_to,
      educational_concept, flexible_care_time, integrational,
      opening_hours_from, opening_hours_to,
      application_allowed,
      current_availability, current_reference_date,
      info
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Insert all kitas
  for (const kita of api_01_response) {
    // Extract current availability if available
    const currentAvailability = kita.availabilities?.[0]?.current?.availability ?? null;
    const currentRefDate = kita.availabilities?.[0]?.current?.referenceDate
      ? kita.availabilities[0].current.referenceDate.join('-')
      : null;

    stmt.run([
      kita.id,
      kita.name,
      kita.institution,
      kita.type,
      kita.address.street ?? null,
      kita.address.number ?? null,
      kita.address.postalcode ?? null,
      kita.address.town ?? null,
      kita.address.district ?? null,
      kita.address.latitude ?? null,
      kita.address.longitude ?? null,
      kita.barrierfree ? 1 : 0,
      kita.careFrom,
      kita.careTo,
      kita.educationalConcept ?? null,
      kita.flexibleCareTime ? 1 : 0,
      kita.integrational ? 1 : 0,
      kita.openingHoursFrom,
      kita.openingHoursTo,
      kita.applicationAllowed ? 1 : 0,
      currentAvailability,
      currentRefDate,
      kita.infoVonDerEinrichtung ?? null,
    ]);
  }

  stmt.free();

  const endTime = performance.now();
  console.log(`Database initialized in ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`Loaded ${api_01_response.length} kitas into SQLite`);

  dbInstance = db;
  return db;
}

// Helper function to execute queries
export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const db = await getDatabase();
  const results = db.exec(sql, params);

  if (results.length === 0) {
    return [];
  }

  const { columns, values } = results[0];

  // Convert array of arrays to array of objects
  return values.map((row) => {
    const obj: any = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj as T;
  });
}

// Example helper functions for common queries
export async function getAllKitas() {
  return query(`
    SELECT
      id, name, institution, type,
      street, number, postalcode, town, district,
      latitude, longitude,
      barrierfree, care_from, care_to,
      educational_concept, flexible_care_time, integrational,
      opening_hours_from, opening_hours_to,
      application_allowed, current_availability,
      info
    FROM kitas
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY name
  `);
}

export async function getKitasInBoundingBox(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number
) {
  return query(
    `
    SELECT * FROM kitas
    WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    ORDER BY name
  `,
    [swLat, neLat, swLng, neLng]
  );
}

export async function getKitasWithAvailability() {
  return query(`
    SELECT * FROM kitas
    WHERE current_availability > 0
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    ORDER BY current_availability DESC
  `);
}

export async function searchKitas(searchTerm: string) {
  return query(
    `
    SELECT * FROM kitas
    WHERE (name LIKE ? OR institution LIKE ? OR district LIKE ?)
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
    ORDER BY name
  `,
    [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
  );
}

export interface KitaFilters {
  search?: string;
  hasAvailability?: boolean;
  barrierfree?: boolean;
  integrational?: boolean;
  type?: string;
  opensBefore?: number; // milliseconds
  closesAfter?: number; // milliseconds
}

export async function getUniqueTypes(): Promise<string[]> {
  const results = await query<{ type: string }>(`
    SELECT DISTINCT type
    FROM kitas
    WHERE type IS NOT NULL
    ORDER BY type
  `);
  return results.map(r => r.type);
}

export async function filterKitas(filters: KitaFilters) {
  const whereClauses: string[] = [
    'latitude IS NOT NULL',
    'longitude IS NOT NULL',
  ];
  const params: any[] = [];

  // Search filter (name, institution, district, street)
  if (filters.search && filters.search.trim()) {
    whereClauses.push(
      '(name LIKE ? OR institution LIKE ? OR district LIKE ? OR street LIKE ?)'
    );
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  // Availability filter
  if (filters.hasAvailability) {
    whereClauses.push('current_availability > 0');
  }

  // Barrierfree filter
  if (filters.barrierfree) {
    whereClauses.push('barrierfree = 1');
  }

  // Integrational filter
  if (filters.integrational) {
    whereClauses.push('integrational = 1');
  }

  // Type filter
  if (filters.type) {
    whereClauses.push('type = ?');
    params.push(filters.type);
  }

  // Opening hours - opens before specified time
  if (filters.opensBefore !== undefined && filters.opensBefore > 0) {
    whereClauses.push('opening_hours_from <= ?');
    params.push(filters.opensBefore);
  }

  // Closing hours - closes after specified time
  if (filters.closesAfter !== undefined && filters.closesAfter > 0) {
    whereClauses.push('opening_hours_to >= ?');
    params.push(filters.closesAfter);
  }

  const sql = `
    SELECT * FROM kitas
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY name
  `;

  return query(sql, params);
}

export async function getKitasByIds(ids: number[]) {
  if (ids.length === 0) {
    return [];
  }

  const placeholders = ids.map(() => '?').join(',');
  const sql = `
    SELECT * FROM kitas
    WHERE id IN (${placeholders})
    ORDER BY name
  `;

  return query(sql, ids);
}
