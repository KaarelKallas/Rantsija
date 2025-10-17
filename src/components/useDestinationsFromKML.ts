// src/components/useDestinationsFromKML.ts
import { useEffect, useState } from "react";

export type KMLFeature = {
  name: string;
  coordinates: [number, number][]; // [lat, lon]
  type: "Point" | "LineString";
  raw?: string; // original kml coordinate string for debugging
};

export type UseKMLOptions = {
  // optional bounding box to validate coordinates and auto-fix swapped pairs
  // [minLat, minLon, maxLat, maxLon]
  expectedBBox?: [number, number, number, number];
  // if true, console.log parsed -> useful for debugging
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

/**
 * Parse a single "lon,lat[,alt]" token into [lat, lon]
 * Returns null if parsing fails.
 * Heuristic:
 *  - Parse numbers first as [lon, lat]
 *  - Convert to [lat, lon] (Leaflet order)
 *  - If the [lat,lon] are invalid but swapped [lon,lat] would be valid relative to expected bbox, swap them.
 */
function parseTokenToLatLon(
  token: string,
  options?: UseKMLOptions
): [number, number] | null {
  if (!token) return null;
  const parts = token.trim().split(",");
  if (parts.length < 2) return null;
  const lon = parseFloat(parts[0].trim());
  const lat = parseFloat(parts[1].trim());
  if (!isFinite(lon) || !isFinite(lat)) return null;

  // Normal case -> [lat, lon]
  let candidate: [number, number] = [lat, lon];

  // if candidate is valid, and (optionally) inside bbox, accept it
  if (isValidLat(candidate[0]) && isValidLon(candidate[1]) &&
      insideBBox(candidate[0], candidate[1], options?.expectedBBox)) {
    return candidate;
  }

  // If candidate invalid or outside bbox, try swapping (in case parsing order was wrong)
  const swapped: [number, number] = [lon, lat]; // lat/lon swapped
  if (isValidLat(swapped[0]) && isValidLon(swapped[1]) &&
      insideBBox(swapped[0], swapped[1], options?.expectedBBox)) {
    return swapped;
  }

  // If neither fits bbox but candidate is valid as lat/lon within global ranges, return candidate.
  if (isValidLat(candidate[0]) && isValidLon(candidate[1])) return candidate;

  // otherwise return null
  return null;
}

/**
 * Parse a coordinate text block like:
 *  "22.49383562100051,58.25479092682001,9.411034113325867"
 * or multiple pairs separated by spaces/newlines:
 *  "22.4937,58.2547,0 22.4935,58.2547,0"
 */
function parseCoordinateString(
  coordText: string | undefined,
  options?: UseKMLOptions
): [number, number][] {
  if (!coordText) return [];
  // remove extra whitespace, split by whitespace (tokens)
  const tokens = coordText.trim().split(/\s+/);
  const out: [number, number][] = [];
  for (const t of tokens) {
    const parsed = parseTokenToLatLon(t, options);
    if (parsed) out.push(parsed);
    else if (options?.debug) console.warn("Skipped invalid token:", t);
  }
  return out;
}

export function useDestinationsFromKML(kmlPath: string, options?: UseKMLOptions) {
  const [features, setFeatures] = useState<KMLFeature[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchAndParse = async () => {
      try {
        const res = await fetch(kmlPath);
        if (!res.ok) throw new Error(`Failed to fetch KML: ${res.status}`);
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "application/xml");

        const placemarkEls = Array.from(doc.getElementsByTagName("Placemark"));
        const parsed: KMLFeature[] = [];

        for (const pm of placemarkEls) {
          const name = pm.getElementsByTagName("name")[0]?.textContent?.trim() || "Unnamed";

          // try LineString first
          const lineEl = pm.getElementsByTagName("LineString")[0];
          if (lineEl) {
            const coordsText = lineEl.getElementsByTagName("coordinates")[0]?.textContent;
            const coords = parseCoordinateString(coordsText || undefined, options);
            if (coords.length) {
              parsed.push({ name, coordinates: coords, type: "LineString", raw: coordsText });
              if (options?.debug) console.log("Parsed LineString", name, coords.slice(0,3), "raw:", coordsText);
            } else if (options?.debug) console.warn("LineString had no valid coords:", name, coordsText);
            continue; // skip point parsing if it had a linestring
          }

          const pointEl = pm.getElementsByTagName("Point")[0];
          if (pointEl) {
            const coordsText = pointEl.getElementsByTagName("coordinates")[0]?.textContent;
            const coords = parseCoordinateString(coordsText || undefined, options);
            if (coords.length) {
              parsed.push({ name, coordinates: coords, type: "Point", raw: coordsText });
              if (options?.debug) console.log("Parsed Point", name, coords[0], "raw:", coordsText);
            } else if (options?.debug) console.warn("Point had no valid coords:", name, coordsText);
            continue;
          }

          // if neither LineString nor Point, skip
          if (options?.debug) console.warn("Placemark without Point/LineString skipped:", name);
        }

        if (mounted) setFeatures(parsed);
      } catch (e) {
        console.error("Error loading or parsing KML:", e);
        if (mounted) setFeatures([]);
      }
    };

    fetchAndParse();
    return () => {
      mounted = false;
    };
  }, [kmlPath, JSON.stringify(options)]);

  return features;
}
