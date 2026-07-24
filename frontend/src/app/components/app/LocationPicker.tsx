import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

const defaultCenter: [number, number] = [14.082216, -87.165000]; // UNAH CU

const UNAH_BUILDINGS = [
  { name: "Seleccionar un edificio de la UNAH...", lat: "", lng: "" },
  { name: "Alma Mater / Edificio Administrativo", lat: "14.082216", lng: "-87.165000" },
  { name: "Edificio D1 (Ingeniería / Sistemas)", lat: "14.082823", lng: "-87.163972" },
  { name: "Edificio B1 (Ciencias Económicas)", lat: "14.083818", lng: "-87.164487" },
  { name: "Edificio B2 (Aulas)", lat: "14.084128", lng: "-87.164305" },
  { name: "Edificio C1 (Aulas)", lat: "14.083318", lng: "-87.163706" },
  { name: "Edificio C2 (Aulas)", lat: "14.083618", lng: "-87.163506" },
  { name: "Edificio F1 (Ciencias / Física)", lat: "14.082348", lng: "-87.163016" },
  { name: "Edificio J1 (Odontología)", lat: "14.083908", lng: "-87.163316" },
  { name: "Edificio I1 (Ciencias Sociales)", lat: "14.083548", lng: "-87.165316" },
  { name: "Edificio G1 (Aulas)", lat: "14.082248", lng: "-87.162316" },
  { name: "Palacio de los Deportes (Polideportivo)", lat: "14.082000", lng: "-87.165500" },
  { name: "Plaza de las Cuatro Culturas", lat: "14.082834", lng: "-87.164845" },
  { name: "CRAI / Biblioteca Central", lat: "14.082531", lng: "-87.165323" },
];

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

  // Sincronizar de forma reactiva si el prop de lat/lng cambia (por entrada de inputs o select)
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
      {/* Buscador & Lista rápida */}
      <div className="space-y-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar dirección general..."
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

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Selección rápida de edificios de Ciudad Universitaria:
          </label>
          <select
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const [bLat, bLng] = val.split(",");
              onLocationChange(bLat, bLng);
              toast.success("Ubicación fijada en el edificio seleccionado");
            }}
            className="w-full h-10 px-3 rounded-lg border border-input bg-white text-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            {UNAH_BUILDINGS.map((b) => (
              <option key={b.name} value={b.lat && b.lng ? `${b.lat},${b.lng}` : ""}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

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
