import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type DbMosque = {
  id: string;
  owner_id: string | null;
  name: string;
  arabic_name: string | null;
  imam_name: string | null;
  imam_bio: string | null;
  village: string | null;
  city: string;
  country: string;
  is_live: boolean;
  live_started_at: string | null;
  listeners_count: number;
  followers_count: number;
  cover_image_url: string | null;
};

export function useMosques() {
  const [mosques, setMosques] = useState<DbMosque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("mosques").select("*").order("is_live", { ascending: false });
      if (mounted) {
        setMosques((data ?? []) as DbMosque[]);
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel("mosques-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "mosques" }, () => load())
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { mosques, loading };
}
