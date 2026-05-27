import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, RemoteTrack, Track, createLocalAudioTrack, LocalAudioTrack } from "livekit-client";
import { useServerFn } from "@tanstack/react-start";
import { issueLiveKitToken, issueBroadcasterToken } from "./livekit.functions";

/** Listener hook — subscribes to mosque audio room. */
export function useLiveAudio(mosqueId: string | null, active: boolean) {
  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [connected, setConnected] = useState(false);
  const [listeners, setListeners] = useState(0);
  const fetchToken = useServerFn(issueLiveKitToken);

  useEffect(() => {
    if (!mosqueId || !active) return;
    let cancelled = false;
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Audio && audioRef.current) {
        track.attach(audioRef.current);
      }
    });
    room.on(RoomEvent.ParticipantConnected, () => setListeners(room.numParticipants));
    room.on(RoomEvent.ParticipantDisconnected, () => setListeners(room.numParticipants));
    room.on(RoomEvent.Disconnected, () => setConnected(false));

    (async () => {
      try {
        const { token, wsUrl } = await fetchToken({ data: { mosqueId, role: "listener" } });
        if (cancelled) return;
        await room.connect(wsUrl, token);
        if (cancelled) { room.disconnect(); return; }
        setConnected(true);
        setListeners(room.numParticipants);
      } catch (e) {
        console.error("LiveKit listener connect failed", e);
      }
    })();

    return () => {
      cancelled = true;
      room.disconnect();
      roomRef.current = null;
    };
  }, [mosqueId, active, fetchToken]);

  return { audioRef, connected, listeners };
}

/** Broadcaster hook — publishes mic audio to the mosque room. */
export function useBroadcaster() {
  const roomRef = useRef<Room | null>(null);
  const trackRef = useRef<LocalAudioTrack | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const fetchToken = useServerFn(issueBroadcasterToken);

  const start = async (mosqueId: string) => {
    const { token, wsUrl } = await fetchToken({ data: { mosqueId } });
    const room = new Room();
    await room.connect(wsUrl, token);
    const track = await createLocalAudioTrack({
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    });
    await room.localParticipant.publishTrack(track);
    roomRef.current = room;
    trackRef.current = track;
    setBroadcasting(true);
  };

  const stop = async () => {
    trackRef.current?.stop();
    await roomRef.current?.disconnect();
    trackRef.current = null;
    roomRef.current = null;
    setBroadcasting(false);
  };

  useEffect(() => () => { void stop(); }, []);

  return { broadcasting, start, stop };
}
