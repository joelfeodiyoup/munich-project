import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { filterKitas, getUniqueTypes } from "#/data/db";
import { Search, Filter, X, Mail, Heart, Copy, ExternalLink } from "lucide-react";

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

// Create icon function that accounts for availability and favorite status
const createMarkerIcon = (hasAvailability: boolean, isFavorite: boolean) => {
  let bgColor;
  if (isFavorite) {
    bgColor = "#ef4444"; // red for favorites
  } else if (hasAvailability) {
    bgColor = "#10b981"; // green for available
  } else {
    bgColor = "#6b7280"; // gray for unavailable
  }

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${bgColor};
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
};

// Component that manages viewport-filtered markers with clustering
function MarkersLayer({
  kitas,
  onVisibleCountChange,
  selectedKitas,
  toggleKitaSelection,
}: {
  kitas: Kita[];
  onVisibleCountChange: (count: number) => void;
  selectedKitas: Set<number>;
  toggleKitaSelection: (kitaId: number) => void;
}) {
  const map = useMap();
  const isInitialLoadRef = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [visibleKitas, setVisibleKitas] = useState<Kita[]>([]);

  const msToTime = (ms: number): string => {
    const hours = Math.floor(ms / (3600 * 1000));
    const minutes = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const updateVisibleMarkers = () => {
    const start = performance.now();

    // Get current map bounds
    const bounds = map.getBounds();

    // Filter kitas to only those visible in current viewport
    const filtered = kitas.filter((kita) =>
      bounds.contains([kita.latitude, kita.longitude]),
    );

    setVisibleKitas(filtered);
    onVisibleCountChange(filtered.length);

    const end = performance.now();
    console.log(
      `Viewport filter took ${(end - start).toFixed(2)}ms for ${filtered.length}/${kitas.length} markers`,
    );
  };

  useEffect(() => {
    // Only fit bounds on initial load
    const shouldFitBounds = isInitialLoadRef.current && kitas.length > 0;
    if (shouldFitBounds) {
      const allBounds = L.latLngBounds(
        kitas.map((k) => [k.latitude, k.longitude] as [number, number]),
      );
      map.fitBounds(allBounds, { padding: [50, 50], maxZoom: 13 });
      isInitialLoadRef.current = false;
    }

    // Initial marker render
    updateVisibleMarkers();

    // Debounced update on map move/zoom
    const handleMapMove = () => {
      // Clear existing timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Set new timeout (300ms debounce)
      updateTimeoutRef.current = setTimeout(() => {
        updateVisibleMarkers();
      }, 300);
    };

    // Listen to map move and zoom events
    map.on("moveend", handleMapMove);
    map.on("zoomend", handleMapMove);

    // Cleanup on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      map.off("moveend", handleMapMove);
      map.off("zoomend", handleMapMove);
    };
  }, [kitas, map]);

  return (
    <MarkerClusterGroup
      chunkedLoading
      maxClusterRadius={80}
      spiderfyOnMaxZoom={true}
      showCoverageOnHover={false}
      disableClusteringAtZoom={15}
      iconCreateFunction={(cluster: any) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: `
            <div style="
              background-color: #3b82f6;
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 14px;
            ">${count}</div>
          `,
          className: 'custom-cluster-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
      }}
    >
      {visibleKitas.map((kita) => {
        const isFavorite = selectedKitas.has(kita.id);
        const hasAvailability = kita.current_availability > 0;
        const icon = createMarkerIcon(hasAvailability, isFavorite);

        return (
          <Marker
            key={kita.id}
            position={[kita.latitude, kita.longitude]}
            icon={icon}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold text-lg">{kita.name}</h3>
                  <button
                    onClick={() => toggleKitaSelection(kita.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedKitas.has(kita.id)
                        ? "bg-red-100 text-red-800 hover:bg-red-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Heart
                      className={`w-3 h-3 ${selectedKitas.has(kita.id) ? "fill-current" : ""}`}
                    />
                    {selectedKitas.has(kita.id) ? "Saved" : "Save"}
                  </button>
                </div>
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
                  <p className="text-sm text-gray-600 mb-1">
                    District: {kita.district}
                  </p>
                )}

                {kita.opening_hours_from && kita.opening_hours_to && (
                  <p className="text-sm text-gray-600 mb-1">
                    Hours: {msToTime(kita.opening_hours_from)} -{" "}
                    {msToTime(kita.opening_hours_to)}
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
        );
      })}
    </MarkerClusterGroup>
  );
}

export function KitaMap() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    hasAvailability: false,
    barrierfree: false,
    integrational: false,
    type: "",
    opensBefore: "",
    closesAfter: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [selectedKitas, setSelectedKitas] = useState<Set<number>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Initialize selected kitas from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const savedParam = params.get('saved');
    if (savedParam) {
      const ids = savedParam.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      setSelectedKitas(new Set(ids));
    }
  }, []);

  // Update URL when selection changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedKitas.size > 0) {
      params.set('saved', Array.from(selectedKitas).sort((a, b) => a - b).join(','));
    } else {
      params.delete('saved');
    }
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [selectedKitas]);

  // Helper to convert time string to milliseconds
  const timeToMs = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    return (hours * 3600 + minutes * 60) * 1000;
  };

  // Fetch unique types for dropdown (only runs once)
  const { data: uniqueTypes = [] } = useQuery({
    queryKey: ["kitas-unique-types"],
    queryFn: getUniqueTypes,
  });

  // Fetch filtered kitas using SQL (runs on every filter change)
  const {
    data: filteredKitas,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["kitas-filtered", filters],
    queryFn: async () => {
      const start = performance.now();
      const result = await filterKitas({
        search: filters.search || undefined,
        hasAvailability: filters.hasAvailability || undefined,
        barrierfree: filters.barrierfree || undefined,
        integrational: filters.integrational || undefined,
        type: filters.type || undefined,
        opensBefore: filters.opensBefore
          ? timeToMs(filters.opensBefore)
          : undefined,
        closesAfter: filters.closesAfter
          ? timeToMs(filters.closesAfter)
          : undefined,
      });
      const end = performance.now();
      console.log(
        `SQL filter query took ${(end - start).toFixed(2)}ms, returned ${result.length} results`,
      );
      return result;
    },
    staleTime: 0,
    placeholderData: (previousData) => previousData,
  });

  // Get count of all kitas for display (cheap query)
  const { data: totalCount = 0 } = useQuery({
    queryKey: ["kitas-count"],
    queryFn: async () => {
      const db = await import("#/data/db").then((m) => m.getDatabase());
      const result = db.exec(
        "SELECT COUNT(*) as count FROM kitas WHERE latitude IS NOT NULL",
      );
      return (result[0]?.values[0]?.[0] as number) || 0;
    },
  });

  const resetFilters = () => {
    setFilters({
      search: "",
      hasAvailability: false,
      barrierfree: false,
      integrational: false,
      type: "",
      opensBefore: "",
      closesAfter: "",
    });
  };

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    (filters.hasAvailability ? 1 : 0) +
    (filters.barrierfree ? 1 : 0) +
    (filters.integrational ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.opensBefore ? 1 : 0) +
    (filters.closesAfter ? 1 : 0);

  const msToTime = (ms: number): string => {
    const hours = Math.floor(ms / (3600 * 1000));
    const minutes = Math.floor((ms % (3600 * 1000)) / (60 * 1000));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const toggleKitaSelection = (kitaId: number) => {
    setSelectedKitas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kitaId)) {
        newSet.delete(kitaId);
      } else {
        newSet.add(kitaId);
      }
      return newSet;
    });
  };

  const getShareUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const ids = Array.from(selectedKitas).sort((a, b) => a - b).join(',');
    return `${baseUrl}?saved=${ids}`;
  };

  const createEmailBody = () => {
    if (selectedKitas.size === 0 || !filteredKitas) return '';

    const selected = filteredKitas.filter(k => selectedKitas.has(k.id));
    const shareUrl = getShareUrl();

    let body = `Munich Kitas - My Shortlist (${selected.length} kitas)\n\n`;
    body += `View this shortlist online:\n${shareUrl}\n\n`;
    body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    selected.forEach((kita, idx) => {
      body += `${idx + 1}. ${kita.name}\n`;
      body += `   Institution: ${kita.institution}\n`;

      if (kita.current_availability > 0) {
        body += `   ✓ ${kita.current_availability} spots available\n`;
      } else {
        body += `   ✗ No availability info\n`;
      }

      if (kita.street) {
        body += `   Address: ${kita.street} ${kita.number}, ${kita.postalcode} ${kita.town}\n`;
      }

      if (kita.district) {
        body += `   District: ${kita.district}\n`;
      }

      if (kita.opening_hours_from && kita.opening_hours_to) {
        body += `   Hours: ${msToTime(kita.opening_hours_from)} - ${msToTime(kita.opening_hours_to)}\n`;
      }

      const features = [];
      if (kita.barrierfree === 1) features.push('Barrier-free');
      if (kita.integrational === 1) features.push('Integrational');
      if (features.length > 0) {
        body += `   Features: ${features.join(', ')}\n`;
      }

      body += `   Google Maps: https://www.google.com/maps/search/?api=1&query=${kita.latitude},${kita.longitude}\n`;
      body += '\n';
    });

    return body;
  };

  const handleCopyToClipboard = async () => {
    const body = createEmailBody();
    try {
      await navigator.clipboard.writeText(body);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSendEmail = () => {
    const subject = `Munich Kitas Shortlist - ${selectedKitas.size} locations`;
    const body = createEmailBody();
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Error loading kitas
          </h2>
          <p className="text-gray-600">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      {/* Loading overlay - only show on initial load */}
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
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
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
                      setFilters({
                        ...filters,
                        hasAvailability: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Has Availability</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.barrierfree}
                    onChange={(e) =>
                      setFilters({ ...filters, barrierfree: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Barrier-free</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.integrational}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        integrational: e.target.checked,
                      })
                    }
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
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Opening Hours
                  </label>
                  {(filters.opensBefore || filters.closesAfter) && (
                    <button
                      onClick={() =>
                        setFilters({
                          ...filters,
                          opensBefore: "",
                          closesAfter: "",
                        })
                      }
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {/* Opens before */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Opens before
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = filters.opensBefore || "08:00";
                          const [h, m] = current.split(":").map(Number);
                          let totalMins = h * 60 + m - 15;
                          if (totalMins < 0) totalMins = 0;
                          const newH = Math.floor(totalMins / 60);
                          const newM = totalMins % 60;
                          setFilters({
                            ...filters,
                            opensBefore: `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`,
                          });
                        }}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                      >
                        −
                      </button>
                      <input
                        type="time"
                        value={filters.opensBefore || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            opensBefore: e.target.value,
                          })
                        }
                        placeholder="--:--"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-center"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = filters.opensBefore || "08:00";
                          const [h, m] = current.split(":").map(Number);
                          let totalMins = h * 60 + m + 15;
                          if (totalMins > 1440) totalMins = 1440;
                          const newH = Math.floor(totalMins / 60);
                          const newM = totalMins % 60;
                          setFilters({
                            ...filters,
                            opensBefore: `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`,
                          });
                        }}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Closes after */}
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Closes after
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const current = filters.closesAfter || "17:00";
                          const [h, m] = current.split(":").map(Number);
                          let totalMins = h * 60 + m - 15;
                          if (totalMins < 0) totalMins = 0;
                          const newH = Math.floor(totalMins / 60);
                          const newM = totalMins % 60;
                          setFilters({
                            ...filters,
                            closesAfter: `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`,
                          });
                        }}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                      >
                        −
                      </button>
                      <input
                        type="time"
                        value={filters.closesAfter || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            closesAfter: e.target.value,
                          })
                        }
                        placeholder="--:--"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm text-center"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const current = filters.closesAfter || "17:00";
                          const [h, m] = current.split(":").map(Number);
                          let totalMins = h * 60 + m + 15;
                          if (totalMins > 1440) totalMins = 1440;
                          const newH = Math.floor(totalMins / 60);
                          const newM = totalMins % 60;
                          setFilters({
                            ...filters,
                            closesAfter: `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`,
                          });
                        }}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                      >
                        +
                      </button>
                    </div>
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
              Showing{" "}
              <span className="font-bold text-gray-900">{visibleCount}</span> of{" "}
              <span className="font-bold text-gray-900">
                {filteredKitas?.length || 0}
              </span>{" "}
              matches
              {filteredKitas && filteredKitas.length > visibleCount && (
                <span className="block text-xs text-gray-500 mt-1">
                  (Pan/zoom to see more)
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={MUNICH_CENTER}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Native Leaflet markers for performance */}
        {filteredKitas && (
          <MarkersLayer
            kitas={filteredKitas}
            onVisibleCountChange={setVisibleCount}
            selectedKitas={selectedKitas}
            toggleKitaSelection={toggleKitaSelection}
          />
        )}
      </MapContainer>

      {/* Email Button - Fixed Bottom Right */}
      {selectedKitas.size > 0 && (
        <button
          onClick={() => setShowEmailModal(true)}
          className="fixed bottom-6 right-6 z-1000 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all"
        >
          <Mail className="w-5 h-5" />
          Email {selectedKitas.size} location{selectedKitas.size > 1 ? "s" : ""} to myself
        </button>
      )}

      {/* Email Preview Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-2000 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Email Preview</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border">
                {createEmailBody()}
              </pre>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-4 border-t bg-gray-50">
              <div className="flex items-center gap-2">
                {copySuccess && (
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Copied!
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
                >
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </button>
                <button
                  onClick={handleSendEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in Email Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
