import { useCallback, useEffect, useState } from "react";
export default function useLocalData(url, fallback, backupUrl = null) {
  const [data, setData] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    async function getJSON(endpoint) {
      const response = await fetch(endpoint, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status} requesting ${endpoint}`);
      return response.json();
    }
    (async () => {
      try {
        const result = await getJSON(url);
        if (!controller.signal.aborted) setData(result);
      } catch (error) {
        if (controller.signal.aborted) return;
        if (backupUrl) {
          try { setData(await getJSON(backupUrl)); }
          catch (backupError) { if (!controller.signal.aborted) setError(backupError.message); }
        } else setError(error.message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [url, backupUrl, attempt]);
  return { data, loading, error, retry };
}
