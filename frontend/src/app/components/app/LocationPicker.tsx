import { useEffect, useRef, useState } from "react";
import { Layers, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

const defaultCenter: [number, number] = [14.084952, -87.16493]; // UNAH CU

export const SEDES_DATA: Record<
  string,
  {
    name: string;
    lat: string;
    lng: string;
    buildings: { name: string; lat: string; lng: string }[];
  }
> = {
  "Ciudad Universitaria": {
    name: "Ciudad Universitaria",
    lat: "14.08495201746369",
    lng: "-87.16492979656168",
    buildings: [
      { name: "Edificio 1847", lat: "14.085680781376468", lng: "-87.16497398788229" },
      { name: "Edificio A1", lat: "14.085073816208418", lng: "-87.16236818190535" },
      { name: "Edificio A2", lat: "14.085675203214366", lng: "-87.16234928106398" },
      { name: "Edificio B1", lat: "14.086105572168691", lng: "-87.1617859874194" },
      { name: "Edificio B2", lat: "14.08668643973484", lng: "-87.16204041452343" },
      { name: "Edificio C1", lat: "14.086752055032203", lng: "-87.16347528406372" },
      { name: "Edificio C2", lat: "14.086795900193511", lng: "-87.1650403504828" },
      { name: "Edificio C3", lat: "14.08642172740938", lng: "-87.16523386379184" },
      { name: "Edificio D1", lat: "14.085611901988056", lng: "-87.1640688717249" },
      { name: "Edificio E1", lat: "14.084148287843714", lng: "-87.1623470968732" },
      { name: "Edificio F1", lat: "14.085005329264273", lng: "-87.16420832822966" },
      { name: "Edificio G1", lat: "14.083914563033325", lng: "-87.1658849008035" },
      { name: "Edificio H1", lat: "14.08383545755685", lng: "-87.16675990014004" },
      { name: "Edificio I1", lat: "14.084083424381717", lng: "-87.16739233491666" },
      { name: "Edificio J1", lat: "14.08611712911209", lng: "-87.16665587832145" },
      { name: "Edificio K2", lat: "14.087826105791576", lng: "-87.15989838658267" },
      { name: "Edificio Alma Mater", lat: "14.083893438520747", lng: "-87.16158336462048" },
      { name: "UNAH – Plaza Central", lat: "14.085137462369", lng: "-87.16379514414831" },
      { name: "UNAH – Anfiteatro", lat: "14.084495025197668", lng: "-87.16537733871743" },
      { name: "UNAH - Palacio Universitario de los Deportes", lat: "14.084898374141375", lng: "-87.17011992884017" },
      { name: "Estadio Olímpico – UNAH", lat: "14.084916223126891", lng: "-87.16886467836136" },
      { name: "Piscina Olímpica – UNAH", lat: "14.08840646661159", lng: "-87.16052073557765" },
      { name: "UNAH - Canchas de Básquetbol", lat: "14.083493181873324", lng: "-87.16231908649024" },
      { name: "UNAH - Canchas de Voleibol", lat: "14.083390230709723", lng: "-87.1620167431988" },
      { name: "UNAH - Auditorio Juan Lindo", lat: "14.084577783412305", lng: "-87.16275912235449" },
      { name: "Biblioteca – UNAH", lat: "14.085334010280228", lng: "-87.16327853681811" },
      { name: "UNAH-Biblioteca de estudiantes de Física", lat: "14.084203469547557", lng: "-87.16263280968678" },
      { name: "UNAH – Mariposario", lat: "14.085315077802093", lng: "-87.16617670311959" },
      { name: "UNAH – Observatorio Astronómico", lat: "14.087394454679938", lng: "-87.15944866122724" },
    ],
  },
  "UNAH-CURLA": {
    name: "UNAH-CURLA",
    lat: "15.737930954248155",
    lng: "-86.85631224495717",
    buildings: [
      { name: "Museo de Entomología del CURLA", lat: "15.73752134643521", lng: "-86.85625735613837" },
      { name: "Biblioteca – UNAH-CURLA", lat: "15.738184000339679", lng: "-86.85204969494599" },
      { name: "Vinculación UNAH-Sociedad", lat: "15.738717174345721", lng: "-86.8515942190944" },
      { name: "Edificio 1", lat: "15.735925839871552", lng: "-86.85346948121804" },
      { name: "Edificio 2 Enfermería", lat: "15.736366579283935", lng: "-86.85261570789693" },
      { name: "Edificio Carrera de Economía Agrícola", lat: "15.737321613620566", lng: "-86.85529739638339" },
      { name: "Nodo de Matemáticas", lat: "15.736919300700777", lng: "-86.8542524456425" },
      { name: "Nodo de Deportes", lat: "15.73661735596144", lng: "-86.85364605086521" },
      { name: "Nodo de Enfermería", lat: "15.737261142550562", lng: "-86.85379847731652" },
      { name: "Nodo de Producción Animal", lat: "15.73956836549316", lng: "-86.85202496779895" },
      { name: "Parque del Sol UNAH", lat: "15.73626129200829", lng: "-86.85537434409055" },
      { name: "Observatorio Universitario – CURLA", lat: "15.736922575268622", lng: "-86.85083033199236" },
      { name: "Herbario CURLA", lat: "15.737432120881408", lng: "-86.85293380270137" },
    ],
  },
  "CURLP": {
    name: "CURLP",
    lat: "13.327611127584316",
    lng: "-87.1360166537021",
    buildings: [
      { name: "Laboratorio de Microbiología", lat: "13.327205844553678", lng: "-87.13603712618585" },
      { name: "Procesos y Laboratorios Unah-Curlp", lat: "13.326881660263478", lng: "-87.1350569569034" },
      { name: "Biblioteca-UNAH-CURLP", lat: "13.327014858655184", lng: "-87.13535979700293" },
      { name: "Parque del sol – UNAH-CURLA", lat: "13.328142519213268", lng: "-87.13562487097226" },
    ],
  },
  "CURC": {
    name: "CURC",
    lat: "14.42936402958184",
    lng: "-87.63346640175627",
    buildings: [
      { name: "Parque del Sol – UNAH CURC", lat: "14.429476870818501", lng: "-87.63368312828906" },
      { name: "Complejo de laboratorios UNAH-CURC", lat: "14.428928361695531", lng: "-87.63457171615717" },
      { name: "Edificio 1", lat: "14.429088208364549", lng: "-87.6348734624165" },
      { name: "Edificio 2", lat: "14.429272628897008", lng: "-87.63404665976893" },
    ],
  },
  "UNAH-VS": {
    name: "UNAH-VS",
    lat: "15.529722161329282",
    lng: "-88.03749009134847",
    buildings: [
      { name: "UNAH-VS-Edificio 1", lat: "15.529168891373383", lng: "-88.03724470254508" },
      { name: "UNAH-VS-Edificio 2", lat: "15.530066709894214", lng: "-88.03720906593323" },
      { name: "UNAH-VS-Edificio 3", lat: "15.530554505109503", lng: "-88.03651515273316" },
      { name: "UNAH-VS-Edificio 4", lat: "15.531295538785933", lng: "-88.03599887508378" },
      { name: "UNAH-VS-Edificio 5", lat: "15.5314537881732", lng: "-88.03789445504385" },
      { name: "UNAH-VS-Anexos", lat: "15.529703928738515", lng: "-88.0376770704869" },
      { name: "UNAH-VS-Torre Médica", lat: "15.528743900500974", lng: "-88.03864357269961" },
      { name: "UNAH-VS-Biblioteca", lat: "15.52914333559055", lng: "-88.03632511071785" },
      { name: "Canchas Deportivas UNAH-VS", lat: "15.530479157223265", lng: "-88.03795574253161" },
      { name: "UNAH-VS-Campo de Fútbol", lat: "15.53099796714967", lng: "-88.03893062971234" },
      { name: "Parque del sol UNAH-VS", lat: "15.53133946849754", lng: "-88.03688539199612" },
    ],
  },
  "UNAH-TEC Danli": {
    name: "UNAH-TEC Danli",
    lat: "13.99312784958775",
    lng: "-86.57026951532075",
    buildings: [
      { name: "Edificio Principal", lat: "13.993079588786044", lng: "-86.57042869940112" },
      { name: "Parque del Sol UNAH-TEC-Danli", lat: "13.993525936702095", lng: "-86.57068887367457" },
    ],
  },
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
  lat?: string;
  lng?: string;
  onLocationChange?: (lat: string, lng: string) => void;
  titleBanner?: string;
}

export function LocationPicker({
  lat = "14.08495201746369",
  lng = "-87.16492979656168",
  onLocationChange,
  titleBanner,
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

  // Actualizar reactivamente la posición y centrado del mapa cuando cambian lat/lng
  useEffect(() => {
    if (!leaflet || !mapInstance.current || !markerInstance.current) return;
    const nLat = parseFloat(lat);
    const nLng = parseFloat(lng);

    if (!isNaN(nLat) && !isNaN(nLng)) {
      mapInstance.current.setView([nLat, nLng], 18, { animate: true });
      markerInstance.current.setLatLng([nLat, nLng]);
    }
  }, [lat, lng, leaflet]);

  // Inicializar Mapa Expandido de Pantalla Completa
  useEffect(() => {
    if (!isFullscreen || !leaflet) return;
    const L = leaflet;

    const timer = setTimeout(() => {
      if (!fullMapRef.current) return;

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

      if (fullMapInstance.current) {
        fullMapInstance.current.remove();
        fullMapInstance.current = null;
      }

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

      fullMap.invalidateSize();

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
    }, 180);

    return () => {
      clearTimeout(timer);
      if (fullMapInstance.current) {
        fullMapInstance.current.remove();
        fullMapInstance.current = null;
        fullMarkerInstance.current = null;
      }
    };
  }, [isFullscreen, leaflet, lat, lng]);

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

        {titleBanner && (
          <div className="absolute bottom-2.5 left-2.5 bg-white/90 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-slate-200 z-10">
            📍 {titleBanner}
          </div>
        )}
      </div>

      {/* Modal Dialog de Mapa en Pantalla Completa (Expandir) */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] flex flex-col p-4">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-base text-[#003366] font-bold flex items-center justify-between">
              <span>📍 Vista de Inspección en Pantalla Completa</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 w-full min-h-[480px] rounded-xl border border-slate-200 overflow-hidden relative mt-2">
            <div ref={fullMapRef} className="w-full h-full min-h-[480px] z-0" />
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

