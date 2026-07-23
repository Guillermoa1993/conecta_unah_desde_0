import { useEffect, useRef, useState } from "react";
import { Layers, Maximize2, Check, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const defaultCenter: [number, number] = [14.083902, -87.161601]; // UNAH CU

export const UNAH_SEDES = [
  { name: "Ciudad Universitaria (Tegucigalpa)", lat: "14.083902", lng: "-87.161601" },
  { name: "UNAH-VS (San Pedro Sula)", lat: "15.531200", lng: "-88.026400" },
  { name: "UNAH-CURLA (La Ceiba)", lat: "15.753800", lng: "-86.822900" },
  { name: "UNAH-CURLP (Choluteca)", lat: "13.308700", lng: "-87.190600" },
  { name: "UNAH-CURC (Comayagua)", lat: "14.457800", lng: "-87.640300" },
  { name: "UNAH-CUROC (Santa Rosa de Copán)", lat: "14.770500", lng: "-88.784200" },
  { name: "UNAH-CURN (Nacaome)", lat: "13.535000", lng: "-87.490000" },
  { name: "UNAH-CURNO (Olancho - Juticalpa)", lat: "14.675600", lng: "-86.208100" },
  { name: "UNAH-CURO (Danlí)", lat: "14.032600", lng: "-86.568400" },
  { name: "UNAH-Tec Aguán (Yoro)", lat: "15.580200", lng: "-86.234600" },
];

export const PREDEFINED_BUILDINGS: { keywords: string[]; lat: string; lng: string; name: string }[] = [
  { keywords: ["alma mater", "administrativo", "rectoria"], lat: "14.083902", lng: "-87.161601", name: "Alma Mater" },
  { keywords: ["1847"], lat: "14.084850", lng: "-87.162850", name: "Edificio 1847" },
  { keywords: ["d1", "ingenieria", "sistemas"], lat: "14.082823", lng: "-87.163972", name: "Edificio D1" },
  { keywords: ["b1", "economicas"], lat: "14.083850", lng: "-87.164100", name: "Edificio B1" },
  { keywords: ["b2"], lat: "14.084128", lng: "-87.163850", name: "Edificio B2" },
  { keywords: ["c1", "sociales"], lat: "14.083318", lng: "-87.163706", name: "Edificio C1" },
  { keywords: ["c2"], lat: "14.083618", lng: "-87.163506", name: "Edificio C2" },
  { keywords: ["c3", "lenguas"], lat: "14.083950", lng: "-87.163300", name: "Edificio C3" },
  { keywords: ["f1", "fisica"], lat: "14.082348", lng: "-87.163016", name: "Edificio F1" },
  { keywords: ["g1", "biologia"], lat: "14.082248", lng: "-87.162316", name: "Edificio G1" },
  { keywords: ["i1", "derecho", "juridicas"], lat: "14.083548", lng: "-87.165316", name: "Edificio I1" },
  { keywords: ["j1", "odontologia", "salud"], lat: "14.083908", lng: "-87.163316", name: "Edificio J1" },
  { keywords: ["polideportivo", "palacio de los deportes"], lat: "14.082400", lng: "-87.165900", name: "Polideportivo" },
  { keywords: ["plaza de las cuatro culturas", "4 culturas", "cuatro culturas"], lat: "14.082834", lng: "-87.164845", name: "Plaza 4 Culturas" },
  { keywords: ["crai", "biblioteca central"], lat: "14.082531", lng: "-87.165323", name: "CRAI Biblioteca" },
  { keywords: ["juan lindo", "auditorio juan lindo"], lat: "14.082950", lng: "-87.164500", name: "Auditorio Juan Lindo" },
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

interface LocationPickerProps {
  buildingName?: string;
  centroRegional?: string;
  lat?: string;
  lng?: string;
  onLocationChange?: (lat: string, lng: string) => void;
  selectedSede?: string;
  onSedeSelect?: (sedeName: string, lat: string, lng: string) => void;
}

export function LocationPicker({
  buildingName = "",
  centroRegional = "Ciudad Universitaria",
  lat = "14.083902",
  lng = "-87.161601",
  onLocationChange,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const fullMapRef = useRef<HTMLDivElement>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  const mapInstance = useRef<any>(null);
  const markerInstance = useRef<any>(null);
  const tileLayerInstance = useRef<any>(null);

  const fullMapInstance = useRef<any>(null);
  const fullMarkerInstance = useRef<any>(null);

  const [activeLayerKey, setActiveLayerKey] = useState<keyof typeof TILE_LAYERS>("google_roadmap");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [geocodingStatus, setGeocodingStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      setLeaflet(() => L);
    })();
  }, []);

  // Inicializar Mini Preview del Mapa (~280px)
  useEffect(() => {
    if (!mapRef.current || !leaflet || mapInstance.current) return;
    const L = leaflet;

    const initialLat = parseFloat(lat) || defaultCenter[0];
    const initialLng = parseFloat(lng) || defaultCenter[1];

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

    map.on("click", (e: L.LeafletMouseEvent) => {
      const clickLat = e.latlng.lat.toFixed(6);
      const clickLng = e.latlng.lng.toFixed(6);
      marker.setLatLng(e.latlng);
      if (onLocationChange) onLocationChange(clickLat, clickLng);
    });

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      if (onLocationChange) onLocationChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
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

  // Geocodificación Automática por Texto al escribir el edificio o cambiar de centro regional
  useEffect(() => {
    if (!leaflet || !mapInstance.current || !markerInstance.current) return;

    const cleanBuilding = buildingName.trim().toLowerCase();
    const cleanCentro = centroRegional.trim();

    if (!cleanBuilding) {
      // Buscar sede por defecto
      const sedeObj = UNAH_SEDES.find((s) => s.name.toLowerCase().includes(cleanCentro.toLowerCase())) || UNAH_SEDES[0];
      const targetLat = parseFloat(sedeObj.lat);
      const targetLng = parseFloat(sedeObj.lng);
      mapInstance.current.setView([targetLat, targetLng], 16, { animate: true });
      markerInstance.current.setLatLng([targetLat, targetLng]);
      if (onLocationChange) onLocationChange(sedeObj.lat, sedeObj.lng);
      setGeocodingStatus(`📍 Centrado en ${sedeObj.name}`);
      return;
    }

    // 1. Verificación previa en nuestro diccionario de coordenadas exactas de la UNAH
    const matched = PREDEFINED_BUILDINGS.find((b) =>
      b.keywords.some((k) => cleanBuilding.includes(k))
    );

    if (matched) {
      const nLat = parseFloat(matched.lat);
      const nLng = parseFloat(matched.lng);
      mapInstance.current.setView([nLat, nLng], 18, { animate: true });
      markerInstance.current.setLatLng([nLat, nLng]);
      if (onLocationChange) onLocationChange(matched.lat, matched.lng);
      setGeocodingStatus(`📍 Ubicación exactas fijada: UNAH • ${matched.name}`);
      return;
    }

    // 2. Consulta en segundo plano a Nominatim OpenStreetMap (Debounce 450ms)
    const timeoutId = setTimeout(async () => {
      try {
        const queryStr = `${cleanBuilding} ${cleanCentro} UNAH Honduras`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}`);
        const data = await res.json();

        if (data && data.length > 0) {
          const first = data[0];
          const foundLat = parseFloat(first.lat);
          const foundLng = parseFloat(first.lon);

          mapInstance.current.setView([foundLat, foundLng], 18, { animate: true });
          markerInstance.current.setLatLng([foundLat, foundLng]);
          if (onLocationChange) onLocationChange(foundLat.toFixed(6), foundLng.toFixed(6));
          setGeocodingStatus(`📍 Geocodificado: ${first.display_name.split(",")[0]}`);
        } else {
          setGeocodingStatus(`📍 Buscando ubicación de "${buildingName}"...`);
        }
      } catch (err) {
        // Silencioso
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [buildingName, centroRegional, leaflet]);

  // Inicializar Mapa Expandido de Pantalla Completa
  useEffect(() => {
    if (!isFullscreen || !fullMapRef.current || !leaflet) return;
    const L = leaflet;

    const curLat = parseFloat(lat) || defaultCenter[0];
    const curLng = parseFloat(lng) || defaultCenter[1];

    const redPinIcon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [30, 48],
      iconAnchor: [15, 48],
      popupAnchor: [1, -40],
      shadowSize: [48, 48],
    });

    const fullMap = L.map(fullMapRef.current, {
      center: [curLat, curLng] as L.LatLngExpression,
      zoom: 18,
      zoomControl: true,
    });

    const layerConfig = TILE_LAYERS[activeLayerKey];
    L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom,
    }).addTo(fullMap);

    const fullMarker = L.marker([curLat, curLng] as L.LatLngExpression, {
      icon: redPinIcon,
      draggable: true,
    }).addTo(fullMap);

    fullMapInstance.current = fullMap;
    fullMarkerInstance.current = fullMarker;

    setTimeout(() => {
      fullMap.invalidateSize();
    }, 250);

    fullMap.on("click", (e: L.LeafletMouseEvent) => {
      const clickLat = e.latlng.lat.toFixed(6);
      const clickLng = e.latlng.lng.toFixed(6);
      fullMarker.setLatLng(e.latlng);
      if (onLocationChange) onLocationChange(clickLat, clickLng);
    });

    fullMarker.on("dragend", () => {
      const pos = fullMarker.getLatLng();
      if (onLocationChange) onLocationChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
    });

    return () => {
      if (fullMapInstance.current) {
        fullMapInstance.current.remove();
        fullMapInstance.current = null;
        fullMarkerInstance.current = null;
      }
    };
  }, [isFullscreen, leaflet]);

  // Cambiar capa del mapa dinámicamente
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

  return (
    <div className="space-y-2 mt-2">
      {/* Selector de Capa del Mapa */}
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

      {/* Mini Preview del Mapa Integrado (~280px) con Botón "Expandir" */}
      <div className="relative rounded-xl border border-slate-300 overflow-hidden shadow-2xs group">
        <div ref={mapRef} className="w-full h-[280px] z-0 cursor-default" />

        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2.5 right-2.5 bg-white/95 hover:bg-white text-slate-800 hover:text-[#004B87] text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-1.5 transition-all z-10"
        >
          <Maximize2 className="size-3.5" /> Expandir Mapa
        </button>

        {geocodingStatus && (
          <div className="absolute bottom-2.5 left-2.5 bg-white/90 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-slate-200 z-10">
            {geocodingStatus}
          </div>
        )}
      </div>

      {/* Modal Dialog de Mapa en Pantalla Completa (Expandir) */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-4">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base text-[#003366] font-bold flex items-center justify-between">
              <span>📍 Inspección de Ubicación en Mapa (Pantalla Completa)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 w-full rounded-xl border border-slate-200 overflow-hidden relative mt-2">
            <div ref={fullMapRef} className="w-full h-full z-0" />
          </div>

          <div className="flex items-center justify-between pt-3 border-t mt-2">
            <span className="text-xs font-semibold text-slate-600">
              {geocodingStatus || "Mapa en vista de inspección ampliada"}
            </span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="bg-[#004B87] hover:bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              ✓ Cerrar Mapa
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

