import { useEffect, useRef, useState } from "react";

const defaultCenter: [number, number] = [14.082216, -87.191523];

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

  useEffect(() => {
    if (!mapRef.current || !leaflet) return;
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

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onLocationChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationChange(e.latlng.lat.toFixed(6), e.latlng.lng.toFixed(6));
    });

    return () => {
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaflet]);

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="w-full h-56 rounded-xl border z-0" />
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>Lat: {lat || "—"}</span>
        <span>Lng: {lng || "—"}</span>
        <span className="text-muted-foreground/60">Arrastra el marcador o haz clic en el mapa</span>
      </div>
    </div>
  );
}
