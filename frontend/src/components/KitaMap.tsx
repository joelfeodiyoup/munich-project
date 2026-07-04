import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon, DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { fetchKitas, type KitaDto } from "#/lib/api";
import { api_01_response } from "#/data/api_01";
import { transformData } from "#/data/transformData";

// Munich city center coordinates
const MUNICH_CENTER: [number, number] = [48.137154, 11.576124];

// Custom marker icons
const createMarkerIcon = (hasVacancies: boolean) => {
  return new DivIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${hasVacancies ? "#10b981" : "#ef4444"};
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

export function KitaMap() {
  // Fetch kitas - for now get all, later we can add bounding box filtering
  // const { data: kitas, isLoading, error } = useQuery({
  //   queryKey: ['kitas'],
  //   queryFn: () => fetchKitas(),
  // });

  const kitas = api_01_response.map(transformData);
  const isLoading = false;
  const error = null;

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
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-[1000]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4" />
            <p className="text-lg font-medium">Loading kitas...</p>
          </div>
        </div>
      )}

      {/* Info panel */}
      {kitas && !isLoading && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-[1000] max-w-xs">
          <h2 className="text-xl font-bold mb-2">Munich Kitas</h2>
          <p className="text-gray-600">
            Found{" "}
            <span className="font-semibold text-gray-900">{kitas.length}</span>{" "}
            kitas
          </p>
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Has vacancies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>No vacancies</span>
            </div>
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
        {/* OpenStreetMap tiles - free, no token needed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Kita markers */}
        {kitas?.map((kita) => (
          <Marker
            key={kita.id}
            position={[kita.latitude, kita.longitude]}
            icon={createMarkerIcon(kita.hasVacancies)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg mb-2">{kita.name}</h3>
                {kita.hasVacancies ? (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mb-2">
                    Has Vacancies
                  </span>
                ) : (
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded mb-2">
                    No Vacancies
                  </span>
                )}
                {kita.cost !== null && (
                  <p className="text-sm text-gray-600 mb-1">
                    Cost: €{kita.cost.toFixed(2)}/month
                  </p>
                )}
                {kita.website && (
                  <a
                    href={kita.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Visit website →
                  </a>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${kita.latitude},${kita.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open in Google Maps
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
