import { useEffect, useRef, useState } from "react";
import type { Map, Marker, TileLayer } from "leaflet";
import { Navigation, MapPin, RotateCcw } from "lucide-react";

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

// Honduras center
const DEFAULT_LAT = 14.0818;
const DEFAULT_LNG = -87.2068;
const DEFAULT_ZOOM = 13;

export function LocationPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<Map | null>(null);
  const markerRef    = useRef<Marker | null>(null);
  const tileRef      = useRef<TileLayer | null>(null);
  const [loading, setLoading]     = useState(false);
  const [geoError, setGeoError]   = useState<string | null>(null);

  /* ── Bootstrap Leaflet once ── */
  useEffect(() => {
    let L: typeof import("leaflet");

    const init = async () => {
      // Dynamic import so Vite doesn't SSR-break
      L = (await import("leaflet")).default;

      // Fix default icon path for bundlers
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!containerRef.current || mapRef.current) return;

      const initialLat = lat ?? DEFAULT_LAT;
      const initialLng = lng ?? DEFAULT_LNG;

      const map = L.map(containerRef.current, {
        center: [initialLat, initialLng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true,
      });

      tileRef.current = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>' }
      ).addTo(map);

      // Custom UNAH-colored icon
      const unahIcon = L.divIcon({
        className: "",
        html: `<div style="
          width:32px;height:32px;border-radius:50% 50% 50% 0;
          background:#004B87;border:3px solid #FFD100;
          transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,.35);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -34],
      });

      if (lat !== null && lng !== null) {
        markerRef.current = L.marker([lat, lng], { icon: unahIcon, draggable: true })
          .addTo(map)
          .bindPopup("📍 Ubicación del evento")
          .openPopup();

        markerRef.current.on("dragend", () => {
          const pos = markerRef.current!.getLatLng();
          onChange(+pos.lat.toFixed(6), +pos.lng.toFixed(6));
        });
      }

      map.on("click", (e) => {
        const { lat: cLat, lng: cLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([cLat, cLng]);
        } else {
          markerRef.current = L.marker([cLat, cLng], { icon: unahIcon, draggable: true })
            .addTo(map)
            .bindPopup("📍 Ubicación del evento")
            .openPopup();

          markerRef.current.on("dragend", () => {
            const pos = markerRef.current!.getLatLng();
            onChange(+pos.lat.toFixed(6), +pos.lng.toFixed(6));
          });
        }
        onChange(+cLat.toFixed(6), +cLng.toFixed(6));
      });

      mapRef.current = map;

      // Leaflet CSS (injected once)
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id   = "leaflet-css";
        link.rel  = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Keep marker in sync when lat/lng prop changes externally ── */
  useEffect(() => {
    if (!mapRef.current || lat === null || lng === null) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  /* ── Geolocation handler ── */
  const geolocate = () => {
    if (!navigator.geolocation) { setGeoError("Tu navegador no soporta geolocalización"); return; }
    setLoading(true); setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange(+latitude.toFixed(6), +longitude.toFixed(6));
        mapRef.current?.setView([latitude, longitude], 16);
        setLoading(false);
      },
      (err) => {
        setGeoError(err.code === 1 ? "Permiso denegado — actívalo en tu navegador" : "No se pudo obtener ubicación");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const clear = () => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    onChange(DEFAULT_LAT, DEFAULT_LNG);
    mapRef.current?.setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM);
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={geolocate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#004B87] hover:bg-[#003366] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
          ) : (
            <Navigation className="h-3.5 w-3.5"/>
          )}
          {loading ? "Localizando..." : "Usar mi ubicación"}
        </button>

        {lat !== null && lng !== null && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-[#717182] rounded-lg text-xs font-bold transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5"/>Limpiar
          </button>
        )}

        <span className="text-[10px] text-[#717182] ml-auto">
          Haz clic en el mapa o arrastra el marcador
        </span>
      </div>

      {/* Map container */}
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm"
        style={{ height: "280px", zIndex: 0 }}
      />

      {/* Coordinates display */}
      {lat !== null && lng !== null && (
        <div className="flex items-center gap-2 bg-[#004B87]/5 border border-[#004B87]/20 rounded-lg px-3 py-2">
          <MapPin className="h-3.5 w-3.5 text-[#004B87] flex-shrink-0"/>
          <span className="text-xs font-semibold text-[#003366]">
            Lat: <span className="font-mono">{lat}</span>
            &nbsp;·&nbsp;
            Lng: <span className="font-mono">{lng}</span>
          </span>
        </div>
      )}

      {geoError && (
        <p className="text-[10px] text-red-500 font-semibold">{geoError}</p>
      )}
    </div>
  );
}
