import { useEffect, useState } from "react";

export type KMLFeature = {
  name: string;
  coordinates: [number, number][];
  type: "Point" | "LineString";
  raw?: string;
};

export type UseKMLOptions = {
  expectedBBox?: [number, number, number, number];
  debug?: boolean;
};

function isValidLat(l: number) {
  return Number.isFinite(l) && l >= -90 && l <= 90;
}
function isValidLon(l: number) {
  return Number.isFinite(l) && l >= -180 && l <= 180;
}
function insideBBox(lat: number, lon: number, bbox?: [number, number, number, number]) {
  if (!bbox) return true;
  const [minLat, minLon, maxLat, maxLon] = bbox;
  return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
}

function parseTokenToLatLon(
  token: string,
  options?: UseKMLOptions
): [number, number] | null {
  if (!token) return null;
  const parts = token.trim().split(",");
  if (parts.length < 2) return null;

  const lon = parseFloat(parts[0]);
  const lat = parseFloat(parts[1]);

  let candidate: [number, number] = [lat, lon];

  if (isValidLat(candidate[0]) && isValidLon(candidate[1]) &&
      insideBBox(candidate[0], candidate[1], options?.expectedBBox)) {
    return candidate;
  }

  const swapped: [number, number] = [lon, lat];
  if (isValidLat(swapped[0]) && isValidLon(swapped[1]) &&
      insideBBox(swapped[0], swapped[1], options?.expectedBBox)) {
    return swapped;
  }

  if (isValidLat(candidate[0]) && isValidLon(candidate[1])) return candidate;
  return null;
}

function parseCoordinateString(
  coordText: string | undefined,
  options?: UseKMLOptions
): [number, number][] {
  if (!coordText) return [];
  const tokens = coordText.trim().split(/\s+/);
  const out: [number, number][] = [];

  for (const t of tokens) {
    const parsed = parseTokenToLatLon(t, options);
    if (parsed) out.push(parsed);
  }

  return out;
}

export function useDestinationsFromKML(kmlFileName: string, options?: UseKMLOptions) {
  const [features, setFeatures] = useState<KMLFeature[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchAndParse = async () => {
      try {
        let text: string | null = null;

        // 🔥 ELECTRON MODE — use preload file loader
        if ((window as any).api?.readKmlFile) {
          text = await (window as any).api.readKmlFile(kmlFileName);
        } else {
          // 🔥 BROWSER MODE (vite dev)
          const res = await fetch(kmlFileName);
          text = await res.text();
        }

        if (!text) throw new Error("KML file empty or unreadable");

        const doc = new DOMParser().parseFromString(text, "application/xml");
        const placemarkEls = Array.from(doc.getElementsByTagName("Placemark"));
        const parsed: KMLFeature[] = [];

        for (const pm of placemarkEls) {
          const name = pm.getElementsByTagName("name")[0]?.textContent?.trim() || "Unnamed";

          const lineEl = pm.getElementsByTagName("LineString")[0];
          if (lineEl) {
            const coordsText = lineEl.getElementsByTagName("coordinates")[0]?.textContent;
            const coords = parseCoordinateString(coordsText || undefined, options);
            if (coords.length) {
              parsed.push({ name, coordinates: coords, type: "LineString", raw: coordsText });
            }
            continue;
          }

          const pointEl = pm.getElementsByTagName("Point")[0];
          if (pointEl) {
            const coordsText = pointEl.getElementsByTagName("coordinates")[0]?.textContent;
            const coords = parseCoordinateString(coordsText || undefined, options);
            if (coords.length) {
              parsed.push({ name, coordinates: coords, type: "Point", raw: coordsText });
            }
            continue;
          }
        }

        if (mounted) setFeatures(parsed);
      } catch (e) {
        console.error("Error loading or parsing KML:", e);
        if (mounted) setFeatures([]);
      }
    };

    fetchAndParse();
    return () => { mounted = false };
  }, [kmlFileName, JSON.stringify(options)]);

  return features;
}
