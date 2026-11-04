import { useEffect, useState } from "react";

export default function useSteamPatchNotes(fallback = []) {
  const [items, setItems] = useState(fallback);
  const [source, setSource] = useState("local");
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/steam/patch-notes", { signal: controller.signal });
        if (!response.ok) throw new Error(`Steam feed HTTP ${response.status}`);
        const data = await response.json();
        if (!controller.signal.aborted && Array.isArray(data) && data.length) {
          setItems(data); setSource("steam");
        }
      } catch (error) {
        if (!controller.signal.aborted) setSource("local");
      }
    }
    refresh();
    const timer = setInterval(refresh, 15 * 60 * 1000);
    return () => { controller.abort(); clearInterval(timer); };
  }, []);
  return { items, source };
}
