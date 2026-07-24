import { useEffect, useRef, useState } from "react";
import { MapPinOff, ExternalLink } from "lucide-react";

interface EventDetailMapPreviewProps {
  lat?: number | string | null;
  lng?: number | string | null;
  lugar?: string;
  className?: string;
}

export function EventDetailMapPreview({ lat, lng, lugar, className = "" }: EventDetailMapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [leaflet, setLeaflet] = useState<typeof import("leaflet") | null>(null);

  // Parsear lat/lng si vienen codificados dentro de la cadena lugar ("bName|gLink|lat,lng")
  let parsedLat: number | null = typeof lat === "number" ? lat : (lat ? parseFloat(lat) : null);
  let parsedLng: number | null = typeof lng === "number" ? lng : (lng ? parseFloat(lng) : null);

  if ((parsedLat === null || parsedLng === null || isNaN(parsedLat) || isNaN(parsedLng)) && lugar && lugar.includes("|")) {
    const parts = lugar.split("|");
    if (parts.length >= 3 && parts[2].includes(",")) {
      const [cLat, cLng] = parts[2].split(",");
      parsedLat = parseFloat(cLat);
      parsedLng = parseFloat(cLng);
    }
  }

  const hasValidCoords = parsedLat !== null && parsedLng !== null && !isNaN(parsedLat) && !isNaN(parsedLng);

  useEffect(() => {
    if (!hasValidCoords) return;
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      setLeaflet(() => L);
    })();
  }, [hasValidCoords]);

  useEffect(() => {
    if (!hasValidCoords || !containerRef.current || !leaflet || mapInstance.current) return;
    const L = leaflet;

    const redPinIcon = L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [22, 36],
      iconAnchor: [11, 36],
      popupAnchor: [1, -30],
      shadowSize: [36, 36],
    });

    const map = L.map(containerRef.current, {
      center: [parsedLat!, parsedLng!],
      zoom: 16,
      zoomControl: false,
      dragging: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      touchZoom: false,
      boxZoom: false,
    });

    L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      attribution: "&copy; Google Maps",
      maxZoom: 20,
    }).addTo(map);

    L.marker([parsedLat!, parsedLng!], { icon: redPinIcon }).addTo(map);

    mapInstance.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [leaflet, hasValidCoords, parsedLat, parsedLng]);

  if (!hasValidCoords) {
    return (
      <div className={`flex flex-col items-center justify-center h-48 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-400 text-xs text-center p-4 space-y-1 ${className}`}>
        <MapPinOff className="size-8 text-slate-400 opacity-60" />
        <span className="font-semibold text-slate-600">Ubicación no disponible</span>
        <span className="text-[11px] text-slate-400">Este evento no incluye coordenadas registradas.</span>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${parsedLat},${parsedLng}`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="relative rounded-xl border border-slate-200 overflow-hidden shadow-2xs group">
        <div ref={containerRef} className="w-full h-48 z-0 cursor-default" />

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-800 hover:text-[#004B87] text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm border border-slate-200 flex items-center gap-1 transition-all z-10"
        >
          Ver en Google Maps <ExternalLink className="size-3" />
        </a>
      </div>
      <p className="text-[10px] text-slate-500 font-mono text-right">
        📍 {parsedLat?.toFixed(6)}, {parsedLng?.toFixed(6)}
      </p>
    </div>
  );
}
