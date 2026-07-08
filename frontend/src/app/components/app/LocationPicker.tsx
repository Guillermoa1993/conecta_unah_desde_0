import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

const defaultCenter: [number, number] = [14.082216, -87.191523]; // UNAH CU

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    (async () => {
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setLeaflet(() => L);
    })();
  }, []);

  // Inicializar Mapa
  useEffect(() => {
    if (!mapRef.current || !leaflet || mapInstance.current) return;
    const L = leaflet;

    const initialLat = parseFloat(lat) || defaultCenter[0];
    const initialLng = parseFloat(lng) || defaultCenter[1];

    const map = L.map(mapRef.current, {
      center: [initialLat, initialLng] as L.LatLngExpression,
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng] as L.LatLngExpression, {
      draggable: true,
    }).addTo(map);

    mapInstance.current = map;
    markerInstance.current = marker;

    // Clic en el mapa para mover marcador
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
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
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaflet]);

  // Sincronizar de forma reactiva si el prop de lat/lng cambia (por entrada de inputs)
  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current || !leaflet) return;
    const currentLat = parseFloat(lat);
    const currentLng = parseFloat(lng);
    if (!isNaN(currentLat) && !isNaN(currentLng)) {
      const markerPos = markerInstance.current.getLatLng();
      if (markerPos.lat.toFixed(6) !== currentLat.toFixed(6) || markerPos.lng.toFixed(6) !== currentLng.toFixed(6)) {
        markerInstance.current.setLatLng([currentLat, currentLng]);
        mapInstance.current.panTo([currentLat, currentLng]);
      }
    }
  }, [lat, lng, leaflet]);

  // Búsqueda de lugares usando Nominatim de OpenStreetMap
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
          mapInstance.current.setView([newLat, newLng], 17);
          markerInstance.current.setLatLng([newLat, newLng]);
          onLocationChange(newLat.toFixed(6), newLng.toFixed(6));
          toast.success(`Ubicación encontrada: ${first.display_name.split(',')[0]}`);
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
      {/* Buscador */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar edificio o lugar (ej. Edificio D1 UNAH)..."
            className="w-full h-10 pl-3 pr-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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

      {/* Mapa */}
      <div ref={mapRef} className="w-full h-64 rounded-xl border z-0 overflow-hidden shadow-sm" />

      {/* Inputs de Sincronización */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Latitud</label>
          <input
            type="text"
            value={lat}
            onChange={(e) => onLocationChange(e.target.value, lng)}
            placeholder="Latitud"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring font-mono"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Longitud</label>
          <input
            type="text"
            value={lng}
            onChange={(e) => onLocationChange(lat, e.target.value)}
            placeholder="Longitud"
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm mt-1 focus:outline-none focus:ring-1 focus:ring-ring font-mono"
          />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/85 italic">
        * Arrastra el marcador, haz clic en el mapa o busca un lugar para autocompletar.
      </p>
    </div>
  );
}
