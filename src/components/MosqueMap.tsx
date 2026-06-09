import { useEffect, useState } from "react";
import type { DbMosque } from "@/lib/use-mosques";

type Coord = { lat: number; lng: number; label?: string };

/**
 * Lightweight Leaflet-based map for the mosque picker. SSR-safe: only loads
 * react-leaflet on the client to avoid `window is not defined` during SSR.
 */
export default function MosqueMap({
  center, mosques, onSelect, selectedId,
}: {
  center: Coord;
  mosques: { m: DbMosque; d: number }[];
  onSelect: (id: string) => void;
  selectedId?: string | null;
}) {
  const [Comp, setComp] = useState<null | {
    MapContainer: typeof import("react-leaflet").MapContainer;
    TileLayer: typeof import("react-leaflet").TileLayer;
    Marker: typeof import("react-leaflet").Marker;
    Popup: typeof import("react-leaflet").Popup;
    CircleMarker: typeof import("react-leaflet").CircleMarker;
    icon: typeof import("leaflet").icon;
  }>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rl, L] = await Promise.all([
        import("react-leaflet"),
        import("leaflet"),
      ]);
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;
      setComp({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Popup: rl.Popup,
        CircleMarker: rl.CircleMarker,
        icon: L.icon,
      });
    })();
    return () => { cancelled = true; };
  }, []);

  if (!Comp) {
    return <div className="h-72 w-full animate-pulse rounded-xl bg-muted" />;
  }
  const { MapContainer, TileLayer, Marker, Popup, CircleMarker, icon } = Comp;
  const pin = icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  });

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={[center.lat, center.lng]}
          radius={8}
          pathOptions={{ color: "#0ea5a4", fillColor: "#0ea5a4", fillOpacity: 0.4 }}
        >
          <Popup>You are here{center.label ? ` · ${center.label}` : ""}</Popup>
        </CircleMarker>
        {mosques.map(({ m, d }) =>
          m.latitude != null && m.longitude != null ? (
            <Marker key={m.id} position={[m.latitude, m.longitude]} icon={pin}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.city}{m.country ? `, ${m.country}` : ""} · {d.toFixed(1)} km
                  </div>
                  <button
                    onClick={() => onSelect(m.id)}
                    className={`mt-1 inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${selectedId === m.id ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}
                  >
                    {selectedId === m.id ? "Selected" : "Use this mosque"}
                  </button>
                </div>
              </Popup>
            </Marker>
          ) : null,
        )}
      </MapContainer>
    </div>
  );
}
