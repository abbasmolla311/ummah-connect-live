import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getVapidPublicKey, savePushSubscription } from "./push.functions";
import { toast } from "sonner";

function urlBase64ToUint8Array(b64: string) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export type PushStatus = "unsupported" | "denied" | "default" | "granted" | "subscribed";

/** Subscribe the current browser to Web Push for azan/prayer alerts. */
export function useWebPush(mosqueId?: string | null) {
  const [status, setStatus] = useState<PushStatus>("default");
  const [busy, setBusy] = useState(false);
  const fetchKey = useServerFn(getVapidPublicKey);
  const saveSub = useServerFn(savePushSubscription);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    const perm = Notification.permission;
    if (perm === "denied") setStatus("denied");
    else if (perm === "granted") {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setStatus(sub ? "subscribed" : "granted"))
        .catch(() => setStatus("granted"));
    } else setStatus("default");
  }, []);

  const subscribe = async () => {
    if (status === "unsupported") {
      toast.error("Push notifications not supported on this device");
      return;
    }
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus(perm as PushStatus);
        toast.error("Notification permission denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await fetchKey();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Subscription missing keys");
      }
      await saveSub({
        data: {
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          mosqueId: mosqueId ?? null,
          userAgent: navigator.userAgent.slice(0, 500),
        },
      });
      setStatus("subscribed");
      toast.success("Azan alerts enabled");
    } catch (e) {
      console.error("Push subscribe failed", e);
      toast.error(e instanceof Error ? e.message : "Could not enable alerts");
    } finally {
      setBusy(false);
    }
  };

  return { status, busy, subscribe };
}
