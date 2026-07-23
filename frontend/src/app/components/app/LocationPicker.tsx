import { useEffect, useRef, useState } from "react";
import { Search, Layers } from "lucide-react";
import { toast } from "sonner";

const defaultCenter: [number, number] = [14.082216, -87.165000]; // UNAH CU

const UNAH_BUILDINGS = [
  { name: "Seleccionar un edificio de la UNAH...", lat: "", lng: "" },
  { name: "Alma Mater / Edificio Administrativo", lat: "14.083902", lng: "-87.161601" },
  { name: "Edificio 1847", lat: "14.084850", lng: "-87.162850" },
  { name: "Edificio D1 (Ingeniería / Sistemas)", lat: "14.082823", lng: "-87.163972" },
  { name: "Edificio B1 (Ciencias Económicas)", lat: "14.083850", lng: "-87.164100" },
  { name: "Edificio B2 (Aulas / Económicas)", lat: "14.084128", lng: "-87.163850" },
  { name: "Edificio C1 (Ciencias Sociales)", lat: "14.083318", lng: "-87.163706" },
  { name: "Edificio C2 (Aulas)", lat: "14.083618", lng: "-87.163506" },
  { name: "Edificio C3 (Lenguas Extranjeras)", lat: "14.083950", lng: "-87.163300" },
  { name: "Edificio F1 (Ciencias / Física)", lat: "14.082348", lng: "-87.163016" },
  { name: "Edificio G1 (Biología / Ciencias)", lat: "14.082248", lng: "-87.162316" },
  { name: "Edificio I1 (Ciencias Jurídicas / Derecho)", lat: "14.083548", lng: "-87.165316" },
  { name: "Edificio J1 (Odontología / Salud)", lat: "14.083908", lng: "-87.163316" },
  { name: "Palacio de los Deportes (Polideportivo)", lat: "14.082400", lng: "-87.165900" },
  { name: "Plaza de las Cuatro Culturas", lat: "14.082834", lng: "-87.164845" },
  { name: "CRAI / Biblioteca Central", lat: "14.082531", lng: "-87.165323" },
  { name: "Auditorio Juan Lindo", lat: "14.082950", lng: "-87.164500" },
];

const TILE_LAYERS = {
  google_roadmap: {
    name: "Google Maps Callejero",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    maxZoom: 20,
  },
  google_satellite: {
    name: "Google Maps Satelital",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps Satelital",
    maxZoom: 20,
  },
  openstreetmap: {
    name: "OpenStreetMap",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
};

export function LocationPicker({
  lat,
  lng,
  onLocationChange,
}: {
  lat: string;
  lng: string;
  onLocationChange: (lat: string, lng: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);
  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const tileLayerInstance = useRef<any>(null);

  const [activeLayerKey, setActiveLayerKey] = useState<keyof typeof TILE_LAYERS>("google_roadmap");
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      setLeaflet(() => L);
    })();
  }, []);

  // Inicializar Mapa con la Capa Gratuita de Google Maps
  useEffect(() => {
    if (!mapRef.current || !leaflet || mapInstance.current) return;
    const L = leaflet;

    const initialLat = parseFloat(lat) || defaultCenter[0];
    const initialLng = parseFloat(lng) || defaultCenter[1];

    // Red Pin Icon con anclaje exacto en la punta inferior [12, 41]
    const redPinIcon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const map = L.map(mapRef.current, {
      center: [initialLat, initialLng] as L.LatLngExpression,
      zoom: 17,
      zoomControl: true,
    });

    const layerConfig = TILE_LAYERS[activeLayerKey];
    const tileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
    }).addTo(map);

    tileLayerInstance.current = tileLayer;

    const marker = L.marker([initialLat, initialLng] as L.LatLngExpression, {
      icon: redPinIcon,
      draggable: true,
    }).addTo(map);

    mapInstance.current = map;
    markerInstance.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    // Clic en el mapa para fijar exactamente las coordenadas en la punta del marcador
    map.on("click", (e: L.LeafletMouseEvent) => {
      const clickLat = e.latlng.lat.toFixed(6);
      const clickLng = e.latlng.lng.toFixed(6);
      marker.setLatLng(e.latlng);
      onLocationChange(clickLat, clickLng);
    });

    // Arrastrar marcador para actualizar coordenadas
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onLocationChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
        tileLayerInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaflet]);

  // Cambiar capa del mapa dinámicamente (Google Maps Callejero / Satelital / OSM)
  const changeTileLayer = (key: keyof typeof TILE_LAYERS) => {
    if (!mapInstance.current || !leaflet) return;
    const L = leaflet;
    setActiveLayerKey(key);

    if (tileLayerInstance.current) {
      mapInstance.current.removeLayer(tileLayerInstance.current);
    }

    const layerConfig = TILE_LAYERS[key];
    const newLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
    }).addTo(mapInstance.current);

    tileLayerInstance.current = newLayer;
  };

  // Sincronizar reactivamente si lat/lng cambia externamente (ej. al seleccionar un edificio)
  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current || !leaflet) return;
    const currentLat = parseFloat(lat);
    const currentLng = parseFloat(lng);

    if (!isNaN(currentLat) && !isNaN(currentLng)) {
      const markerPos = markerInstance.current.getLatLng();
      if (
        markerPos.lat.toFixed(6) !== currentLat.toFixed(6) ||
        markerPos.lng.toFixed(6) !== currentLng.toFixed(6)
      ) {
        markerInstance.current.setLatLng([currentLat, currentLng]);
        mapInstance.current.setView([currentLat, currentLng], 18, { animate: true });
      }
    }
  }, [lat, lng, leaflet]);

  // Búsqueda de lugares usando Nominatim
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const first = data[0];
        const newLat = parseFloat(first.lat);
        const newLng = parseFloat(first.lon);

        if (mapInstance.current && markerInstance.current) {
          mapInstance.current.setView([newLat, newLng], 18);
          markerInstance.current.setLatLng([newLat, newLng]);
          onLocationChange(newLat.toFixed(6), newLng.toFixed(6));
          toast.success(`Ubicación encontrada: ${first.display_name.split(",")[0]}`);
        }
      } else {
        toast.error("No se encontraron resultados para ese lugar");
      }
    } catch (err) {
      toast.error("Error al conectar con el servicio de búsqueda");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Buscador & Selector rápido de Edificios UNAH */}
      <div className="space-y-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar dirección o lugar general..."
              className="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={searching}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <Search className="size-4" />
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Edificios de Ciudad Universitaria (Coordenadas Exactas):
          </label>
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const [bLat, bLng] = val.split(",");
              onLocationChange(bLat, bLng);

              if (mapInstance.current && markerInstance.current) {
                const numLat = parseFloat(bLat);
                const numLng = parseFloat(bLng);
                markerInstance.current.setLatLng([numLat, numLng]);
                mapInstance.current.setView([numLat, numLng], 18, { animate: true });
              }

              toast.success("Ubicación exacta fijada y centrada en el mapa");
            }}
            className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer font-medium text-slate-800"
          >
            {UNAH_BUILDINGS.map((b) => (
              <option key={b.name} value={b.lat && b.lng ? `${b.lat},${b.lng}` : ""}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selector de Capa del Mapa (Google Maps / Satelital / OSM) */}
      <div className="flex items-center justify-between gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs">
        <span className="font-bold text-slate-700 flex items-center gap-1.5 px-2">
          <Layers className="size-3.5 text-[#004B87]" /> Capa del Mapa:
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeTileLayer("google_roadmap")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              activeLayerKey === "google_roadmap"
                ? "bg-[#004B87] text-white shadow-2xs"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            🗺️ Google Maps
          </button>
          <button
            type="button"
            onClick={() => changeTileLayer("google_satellite")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              activeLayerKey === "google_satellite"
                ? "bg-[#004B87] text-white shadow-2xs"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            🛰️ Satelital
          </button>
          <button
            type="button"
            onClick={() => changeTileLayer("openstreetmap")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              activeLayerKey === "openstreetmap"
                ? "bg-[#004B87] text-white shadow-2xs"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            🌍 OpenStreetMap
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div ref={mapRef} className="w-full h-72 rounded-xl border border-slate-300 z-0 overflow-hidden shadow-xs relative" />

      {/* Coordenadas Sincronizadas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Latitud</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => onLocationChange(e.target.value, lng)}
            placeholder="Latitud"
            className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring font-mono font-bold text-slate-800"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Longitud</label>
          <input
            type="text"
            value={lng}
            onChange={(e) => onLocationChange(lat, e.target.value)}
            placeholder="Longitud"
            className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring font-mono font-bold text-slate-800"
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-600 italic font-medium">
        📍 Haz clic en cualquier parte del mapa o arrastra el marcador rojo para fijar las coordenadas exactas de la ubicación.
      </p>
    </div>
  );
}
