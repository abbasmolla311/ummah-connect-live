import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, MapPin } from "lucide-react";

export const Route = createFileRoute("/qibla")({
  head: () => ({
    meta: [
      { title: "Qibla Direction — DeenConnect" },
      { name: "description", content: "Find the direction of the Kaaba in Mecca from your current location using GPS and your device compass." },
    ],
  }),
  component: QiblaPage,
});

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function bearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(lat1), φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function QiblaPage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [qiblaDir, setQiblaDir] = useState<number | null>(null);
  const [error, setError] = useState<string>("");
  const [compassActive, setCompassActive] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setError("Geolocation is not supported on this device."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setQiblaDir(bearing(latitude, longitude, KAABA_LAT, KAABA_LNG));
      },
      () => setError("Please allow location access to find the Qibla."),
      { enableHighAccuracy: true }
    );
  }, []);

  const enableCompass = async () => {
    try {
      // iOS permission
      const anyDOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof anyDOE.requestPermission === "function") {
        const res = await anyDOE.requestPermission();
        if (res !== "granted") { setError("Compass permission denied."); return; }
      }
      window.addEventListener("deviceorientationabsolute", onOrient as EventListener, true);
      window.addEventListener("deviceorientation", onOrient as EventListener, true);
      setCompassActive(true);
    } catch {
      setError("Compass not available on this device.");
    }
  };

  const onOrient = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
    const h = typeof e.webkitCompassHeading === "number" ? e.webkitCompassHeading : (e.alpha != null ? 360 - e.alpha : 0);
    setHeading(h);
  };

  const rotation = qiblaDir !== null ? qiblaDir - heading : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 md:py-20 text-center">
      <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-emerald shadow-emerald">
        <Compass className="h-7 w-7 text-gold" />
      </div>
      <h1 className="font-serif text-4xl text-foreground">Qibla Direction</h1>
      <p className="mt-2 text-muted-foreground">Direction to the Kaaba in Makkah</p>

      <div className="relative mx-auto mt-12 h-72 w-72 rounded-full border-4 border-gold/30 bg-gradient-emerald shadow-emerald">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-arabic text-5xl text-gold">ﷲ</span>
        </div>
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="absolute left-1/2 top-2 h-0 w-0 -translate-x-1/2 border-x-[14px] border-b-[28px] border-x-transparent border-b-destructive" />
          <div className="absolute left-1/2 top-10 -translate-x-1/2 text-xs font-bold uppercase tracking-widest text-gold">Qibla</div>
        </div>
        {["N", "E", "S", "W"].map((d, i) => (
          <div key={d}
            className="absolute left-1/2 top-1/2 text-xs font-semibold text-primary-foreground/80"
            style={{ transform: `translate(-50%, -50%) rotate(${i * 90}deg) translateY(-130px) rotate(${-i * 90}deg)` }}
          >{d}</div>
        ))}
      </div>

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      <div className="mt-8 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Qibla bearing</div>
          <div className="font-serif text-2xl text-foreground">{qiblaDir !== null ? `${qiblaDir.toFixed(1)}°` : "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your heading</div>
          <div className="font-serif text-2xl text-foreground">{compassActive ? `${heading.toFixed(0)}°` : "—"}</div>
        </div>
      </div>

      {coords && (
        <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" /> {coords.lat.toFixed(3)}, {coords.lng.toFixed(3)}
        </p>
      )}

      {!compassActive && (
        <button
          onClick={enableCompass}
          className="mt-8 rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold text-gold-foreground shadow-gold"
        >
          Enable compass
        </button>
      )}
    </div>
  );
}
