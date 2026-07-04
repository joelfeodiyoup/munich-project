import { useState, useEffect, useMemo, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { filterKitas, getUniqueTypes } from '#/data/db';
import { Search, Filter, X } from 'lucide-react';

// Munich city center coordinates
const MUNICH_CENTER: [number, number] = [48.137154, 11.576124];

interface Kita {
  id: number;
  name: string;
  institution: string;
  type: string;
  street: string;
  number: string;
  postalcode: string;
  town: string;
  district: string;
  latitude: number;
  longitude: number;
  barrierfree: number;
  care_from: number;
  care_to: number;
  educational_concept: string;
  flexible_care_time: number;
  integrational: number;
  opening_hours_from: number;
  opening_hours_to: number;
  application_allowed: number;
  current_availability: number;
  info: string;
}

interface Filters {
  search: string;
  hasAvailability: boolean;
  barrierfree: boolean;
  integrational: boolean;
  type: string;
  opensBefore: string;
  closesAfter: string;
}

// Custom marker icons - memoized to prevent recreation
const availableIcon = new DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background-color: #10b981;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const unavailableIcon = new DivIcon({
  className: 'custom-marker',
  html: `
    <div style="
      background-color: #6b7280;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const MapUpdater = memo(({ kitas }: { kitas: Kita[] }) => {
  const map = useMap();

  useEffect(() => {
    if (kitas.length > 0) {
      const start = performance.now();
      const bounds = kitas.map((k) => [k.latitude, k.longitude] as [number, number]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
      const end = performance.now();
      console.log(`Map bounds update took ${(end - start).toFixed(2)}ms`);
    }
  }, [kitas, map]);

  return null;
});

export function KitaMap() {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    hasAvailability: false,
    barrierfree: false,
    integrational: false,
    type: '',
    opensBefore: '',
    closesAfter: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Helper to convert time string to milliseconds
  const timeToMs = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 3600 + minutes * 60) * 1000;
  };

  // Helper to convert milliseconds to time string
  const msToTime = (ms: number): string => {
    const hours = Math.floor(ms / (3600 * 1000));
    const minutes = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Fetch unique types for dropdown (only runs once)
  const { data: uniqueTypes = [] } = useQuery({
    queryKey: ['kitas-unique-types'],
    queryFn: getUniqueTypes,
  });

  // Fetch filtered kitas using SQL (runs on every filter change)
  const { data: filteredKitas, isLoading, isFetching, error } = useQuery({
    queryKey: ['kitas-filtered', filters],
    queryFn: async () => {
      const start = performance.now();
      const result = await filterKitas({
        search: filters.search || undefined,
        hasAvailability: filters.hasAvailability || undefined,
        barrierfree: filters.barrierfree || undefined,
        integrational: filters.integrational || undefined,
        type: filters.type || undefined,
        opensBefore: filters.opensBefore ? timeToMs(filters.opensBefore) : undefined,
        closesAfter: filters.closesAfter ? timeToMs(filters.closesAfter) : undefined,
      });
      const end = performance.now();
      console.log(`SQL filter query took ${(end - start).toFixed(2)}ms, returned ${result.length} results`);
      return result;
    },
    staleTime: 0,
    placeholderData: (previousData) => previousData, // Keep showing previous results while fetching
  });

  // Get count of all kitas for display (cheap query)
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['kitas-count'],
    queryFn: async () => {
      const db = await import('#/data/db').then(m => m.getDatabase());
      const result = db.exec('SELECT COUNT(*) as count FROM kitas WHERE latitude IS NOT NULL');
      return result[0]?.values[0]?.[0] as number || 0;
    },
  });

  const resetFilters = () => {
    setFilters({
      search: '',
      hasAvailability: false,
      barrierfree: false,
      integrational: false,
      type: '',
      opensBefore: '',
      closesAfter: '',
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.hasAvailability) count++;
    if (filters.barrierfree) count++;
    if (filters.integrational) count++;
    if (filters.type) count++;
    if (filters.opensBefore) count++;
    if (filters.closesAfter) count++;
    return count;
  }, [filters]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error loading kitas</h2>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* Loading overlay - only show on initial load, not on filter changes */}
      {isLoading && !filteredKitas && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-[1000]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4" />
            <p className="text-lg font-medium">Loading kitas...</p>
          </div>
        </div>
      )}

      {/* Small loading indicator while filtering */}
      {isFetching && filteredKitas && (
        <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg px-3 py-2 z-[1000] flex items-center gap-2">
          <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent" />
          <span className="text-sm text-gray-600">Updating...</span>
        </div>
      )}

      {/* Search and Filter Panel */}
      {!isLoading && (
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 max-w-sm">
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, district, institution..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="flex-1 outline-none text-sm"
              />
            </div>
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white rounded-lg shadow-lg p-3 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
          </button>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-lg p-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasAvailability}
                    onChange={(e) =>
                      setFilters({ ...filters, hasAvailability: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Has Availability</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.barrierfree}
                    onChange={(e) => setFilters({ ...filters, barrierfree: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Barrier-free</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.integrational}
                    onChange={(e) => setFilters({ ...filters, integrational: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Integrational</span>
                </label>
              </div>

              {/* Type Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opening Hours */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Opening Hours</label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Opens before</label>
                    <input
                      type="time"
                      value={filters.opensBefore}
                      onChange={(e) => setFilters({ ...filters, opensBefore: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Closes after</label>
                    <input
                      type="time"
                      value={filters.closesAfter}
                      onChange={(e) => setFilters({ ...filters, closesAfter: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetFilters}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Results Count */}
          <div className="bg-white rounded-lg shadow-lg p-3">
            <p className="text-sm text-gray-600">
              Showing <span className="font-bold text-gray-900">{filteredKitas?.length || 0}</span> of{' '}
              <span className="font-bold text-gray-900">{totalCount}</span> kitas
            </p>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={MUNICH_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* OpenStreetMap tiles - free, no token needed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit bounds to filtered results */}
        {filteredKitas && filteredKitas.length > 0 && <MapUpdater kitas={filteredKitas} />}

        {/* Kita markers */}
        {filteredKitas?.map((kita) => (
          <Marker
            key={kita.id}
            position={[kita.latitude, kita.longitude]}
            icon={kita.current_availability > 0 ? availableIcon : unavailableIcon}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <h3 className="font-bold text-lg mb-1">{kita.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{kita.institution}</p>

                {kita.current_availability > 0 ? (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-2">
                    {kita.current_availability} spots available
                  </span>
                ) : (
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mb-2">
                    No availability info
                  </span>
                )}

                {kita.street && (
                  <p className="text-sm text-gray-600 mb-1">
                    {kita.street} {kita.number}, {kita.postalcode} {kita.town}
                  </p>
                )}

                {kita.district && (
                  <p className="text-sm text-gray-600 mb-1">District: {kita.district}</p>
                )}

                {kita.opening_hours_from && kita.opening_hours_to && (
                  <p className="text-sm text-gray-600 mb-1">
                    Hours: {msToTime(kita.opening_hours_from)} - {msToTime(kita.opening_hours_to)}
                  </p>
                )}

                <div className="flex gap-2 mt-2 text-xs flex-wrap">
                  {kita.barrierfree === 1 && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Barrier-free
                    </span>
                  )}
                  {kita.integrational === 1 && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Integrational
                    </span>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${kita.latitude},${kita.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
