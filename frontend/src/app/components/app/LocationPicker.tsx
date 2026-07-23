import { useEffect, useRef, useState } from "react";
import { Search, Layers, Maximize2, X, MapPin, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const defaultCenter: [number, number] = [14.083902, -87.161601];

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

export const BUILDINGS_BY_SEDE: Record<string, { name: string; lat: string; lng: string }[]> = {
  "Ciudad Universitaria (Tegucigalpa)": [
    { name: "Seleccionar edificio de Ciudad Universitaria...", lat: "", lng: "" },
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
  ],
  "UNAH-VS (San Pedro Sula)": [
    { name: "Seleccionar edificio de UNAH-VS...", lat: "", lng: "" },
    { name: "Edificio 1 (Administración y Dirección)", lat: "15.531500", lng: "-88.026800" },
    { name: "Edificio 2 (Aulas Generales)", lat: "15.531800", lng: "-88.026200" },
    { name: "Edificio 3 (Laboratorios de Ciencias)", lat: "15.531100", lng: "-88.025900" },
    { name: "Edificio 4 (Ciencias Médicas y Salud)", lat: "15.530800", lng: "-88.026500" },
    { name: "Biblioteca UNAH-VS", lat: "15.531400", lng: "-88.026000" },
    { name: "Auditorio 1 UNAH-VS", lat: "15.531600", lng: "-88.026400" },
    { name: "Complejo Deportivo UNAH-VS", lat: "15.532200", lng: "-88.027000" },
  ],
  "UNAH-CURLA (La Ceiba)": [
    { name: "Seleccionar área de CURLA...", lat: "", lng: "" },
    { name: "Edificio Administrativo y Dirección", lat: "15.754000", lng: "-86.823200" },
    { name: "Edificio de Aulas Agronomía", lat: "15.753500", lng: "-86.822500" },
    { name: "Laboratorios de Ingeniería Forestal", lat: "15.754200", lng: "-86.822000" },
    { name: "Biblioteca CURLA", lat: "15.753700", lng: "-86.823000" },
  ],
  "UNAH-CURLP (Choluteca)": [
    { name: "Seleccionar área de CURLP...", lat: "", lng: "" },
    { name: "Edificio de Aulas y Administración", lat: "13.309000", lng: "-87.190800" },
    { name: "Laboratorios Agroindustriales", lat: "13.308400", lng: "-87.190300" },
  ],
  "UNAH-CURC (Comayagua)": [
    { name: "Seleccionar área de CURC...", lat: "", lng: "" },
    { name: "Edificio Administrativo CURC", lat: "14.458000", lng: "-87.640500" },
    { name: "Edificio de Aulas Central", lat: "14.457500", lng: "-87.640100" },
  ],
  "UNAH-CUROC (Santa Rosa de Copán)": [
    { name: "Seleccionar área de CUROC...", lat: "", lng: "" },
    { name: "Edificio Central y Aulas CUROC", lat: "14.770800", lng: "-88.784500" },
  ],
  "UNAH-CURN (Nacaome)": [
    { name: "Seleccionar área de CURN...", lat: "", lng: "" },
    { name: "Edificio de Aulas CURN", lat: "13.535000", lng: "-87.490000" },
  ],
  "UNAH-CURNO (Olancho - Juticalpa)": [
    { name: "Seleccionar área de CURNO...", lat: "", lng: "" },
    { name: "Edificio Principal CURNO", lat: "14.675800", lng: "-86.208300" },
  ],
  "UNAH-CURO (Danlí)": [
    { name: "Seleccionar área de CURO...", lat: "", lng: "" },
    { name: "Edificio Tec Danlí", lat: "14.032800", lng: "-86.568600" },
  ],
  "UNAH-Tec Aguán (Yoro)": [
    { name: "Seleccionar área de Tec Aguán...", lat: "", lng: "" },
    { name: "Edificio Principal Tec Aguán", lat: "15.580200", lng: "-86.234600" },
  ],
};

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
  lat: string;
  lng: string;
  onLocationChange: (lat: string, lng: string) => void;
  selectedSede?: string;
  onSedeSelect?: (sedeName: string, lat: string, lng: string) => void;
}

export function LocationPicker({
  lat,
  lng,
  onLocationChange,
  selectedSede = "Ciudad Universitaria (Tegucigalpa)",
  onSedeSelect,
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

  // B1 — Dropdown desplegable hacia abajo overlay para Sede UNAH
  const [sedeDropdownOpen, setSedeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // B2 — Modal mapa expandido en pantalla completa
  const [isFullscreen, setIsFullscreen] = useState(false);

  // B3 — Banner de geolocalización automática
  const [geoBanner, setGeoBanner] = useState<string | null>(null);

  // Lista dinámica de edificios según la Sede elegida
  const currentBuildings = BUILDINGS_BY_SEDE[selectedSede] || BUILDINGS_BY_SEDE["Ciudad Universitaria (Tegucigalpa)"];

  // Cierre de dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSedeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      setLeaflet(() => L);
    })();
  }, []);

  // B3 — Solicitar permiso de geolocalización automática al cargar el componente
  useEffect(() => {
    if (navigator.geolocation && !lat && !lng) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude.toFixed(6);
          const userLng = pos.coords.longitude.toFixed(6);
          onLocationChange(userLat, userLng);
          setGeoBanner("📍 Tu ubicación actual fue detectada. Mueve el marcador si el lugar es diferente.");
        },
        () => {
          // Falla en silencio si se rechaza el permiso
        },
        { timeout: 8000 }
      );
    }
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
      zoom: 16,
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
      onLocationChange(clickLat, clickLng);
    });

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

  // Inicializar Mapa Expandido de Pantalla Completa cuando se abre el modal
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
      zoom: 17,
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
      onLocationChange(clickLat, clickLng);
    });

    fullMarker.on("dragend", () => {
      const pos = fullMarker.getLatLng();
      onLocationChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
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

  // Sincronización reactiva de lat/lng
  useEffect(() => {
    if (!leaflet) return;
    const currentLat = parseFloat(lat);
    const currentLng = parseFloat(lng);

    if (!isNaN(currentLat) && !isNaN(currentLng)) {
      if (mapInstance.current && markerInstance.current) {
        const markerPos = markerInstance.current.getLatLng();
        if (
          markerPos.lat.toFixed(6) !== currentLat.toFixed(6) ||
          markerPos.lng.toFixed(6) !== currentLng.toFixed(6)
        ) {
          markerInstance.current.setLatLng([currentLat, currentLng]);
          mapInstance.current.setView([currentLat, currentLng], mapInstance.current.getZoom() || 16, { animate: true });
        }
      }

      if (fullMapInstance.current && fullMarkerInstance.current) {
        fullMarkerInstance.current.setLatLng([currentLat, currentLng]);
        fullMapInstance.current.setView([currentLat, currentLng], 17, { animate: true });
      }
    }
  }, [lat, lng, leaflet]);

  // Seleccionar Sede UNAH (B1)
  const handleSelectSede = (s: typeof UNAH_SEDES[0]) => {
    setSedeDropdownOpen(false);
    onLocationChange(s.lat, s.lng);

    if (mapInstance.current && markerInstance.current) {
      const numLat = parseFloat(s.lat);
      const numLng = parseFloat(s.lng);
      markerInstance.current.setLatLng([numLat, numLng]);
      mapInstance.current.setView([numLat, numLng], 15, { animate: true });
    }

    if (onSedeSelect) {
      onSedeSelect(s.name, s.lat, s.lng);
    }

    toast.success(`Mapa centrado en ${s.name} (Zoom 15)`);
  };

  return (
    <div className="space-y-3">
      {/* B1 — Selector de Sede UNAH (Dropdown desplegable hacia abajo en overlay) */}
      <div className="space-y-1 relative" ref={dropdownRef}>
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
          Centro universitario (Sede UNAH)
        </label>
        <button
          type="button"
          onClick={() => setSedeDropdownOpen((prev) => !prev)}
          className="w-full h-11 px-3.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 flex items-center justify-between shadow-2xs hover:border-[#004B87] transition-all cursor-pointer"
        >
          <span className="truncate flex items-center gap-2">
            <MapPin className="size-4 text-[#004B87] shrink-0" />
            {selectedSede || "Seleccionar sede oficial..."}
          </span>
          <span className="text-xs text-slate-400">▼</span>
        </button>

        {sedeDropdownOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-xl z-50 max-h-60 overflow-y-auto p-1 animate-in fade-in duration-150">
            {UNAH_SEDES.map((s) => {
              const isSelected = selectedSede === s.name;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => handleSelectSede(s)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    isSelected ? "bg-[#004B87]/10 text-[#004B87]" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{s.name}</span>
                  {isSelected && <Check className="size-4 text-[#004B87]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* B3 — Banner de Geolocalización Automática */}
      {geoBanner && (
        <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/90 text-blue-900 text-xs flex items-start justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
          <div className="font-semibold">{geoBanner}</div>
          <button
            type="button"
            onClick={() => setGeoBanner(null)}
            className="text-blue-600 hover:text-blue-900 font-bold p-0.5"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Selector dinámico de Edificios según la SEDE Seleccionada */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Edificios de {selectedSede} (Coordenadas Exactas):
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

            toast.success("Ubicación exacta fijada en el edificio seleccionado");
          }}
          className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer font-medium text-slate-800"
        >
          {currentBuildings.map((b) => (
            <option key={b.name} value={b.lat && b.lng ? `${b.lat},${b.lng}` : ""}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

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

      {/* B2 — Mini Preview del Mapa Integrado (~280px) con Botón "Expandir" */}
      <div className="relative rounded-xl border border-slate-300 overflow-hidden shadow-2xs group">
        <div ref={mapRef} className="w-full h-[280px] z-0 cursor-default" />

        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2.5 right-2.5 bg-white/95 hover:bg-white text-slate-800 hover:text-[#004B87] text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 flex items-center gap-1.5 transition-all z-10"
        >
          <Maximize2 className="size-3.5" /> Expandir Mapa
        </button>
      </div>

      {/* Inputs de Coordenadas Sincronizadas */}
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

      {/* Modal Dialog de Mapa en Pantalla Completa (Expandir) */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-4">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base text-[#003366] font-bold flex items-center justify-between">
              <span>📍 Ajuste de Precisión de Ubicación (Pantalla Completa)</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 w-full rounded-xl border border-slate-200 overflow-hidden relative mt-2">
            <div ref={fullMapRef} className="w-full h-full z-0" />
          </div>

          <div className="flex items-center justify-between pt-3 border-t mt-2">
            <span className="text-xs font-mono text-slate-600 font-bold">
              Lat: {lat}, Lng: {lng}
            </span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="bg-[#004B87] hover:bg-[#003366] text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              ✓ Confirmar Ubicación
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

