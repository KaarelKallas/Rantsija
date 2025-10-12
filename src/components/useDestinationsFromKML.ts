// src/routes/destinations/useDestinationsFromKML.ts
import { useEffect, useState } from 'react';
import { DOMParser } from 'xmldom';
import xpath from 'xpath';

export interface Placemark {
  id?: string;
  name: string;
  coordinates?: string;
  type: 'Point' | 'LineString' | 'Polygon';
}

export function useDestinationsFromKML(kmlPath: string) {
  const [placemarks, setPlacemarks] = useState<Placemark[]>([]);

  useEffect(() => {
    const fetchKML = async () => {
      try {
        const res = await fetch(kmlPath);
        if (!res.ok) return;
        const kmlText = await res.text();

        const doc = new DOMParser().parseFromString(kmlText, 'text/xml');
        const select = xpath.useNamespaces({
          kml: 'http://www.opengis.net/kml/2.2',
          gx: 'http://www.google.com/kml/ext/2.2',
        });

        const nodes = select('//kml:Placemark', doc) as any[];

        const allPlacemarks: Placemark[] = nodes.map((node) => {
          const nameNode = select('kml:name/text()', node)[0];
          const pointNode = select('kml:Point/kml:coordinates/text()', node)[0];
          const lineNode = select('kml:LineString/kml:coordinates/text()', node)[0];
          const polygonNode = select('kml:Polygon/kml:outerBoundaryIs/kml:LinearRing/kml:coordinates/text()', node)[0];

          return {
            id: node.getAttribute('id') || undefined,
            name: nameNode?.nodeValue || 'Unnamed',
            coordinates: pointNode?.nodeValue || lineNode?.nodeValue || polygonNode?.nodeValue || undefined,
            type: pointNode ? 'Point' : lineNode ? 'LineString' : polygonNode ? 'Polygon' : 'Point',
          };
        });

        // filter out bus stations
        const filtered = allPlacemarks.filter(pm => !/bussijaam/i.test(pm.name));
        setPlacemarks(filtered);
      } catch (error) {
        console.error('Failed to load KML:', error);
      }
    };

    fetchKML();
  }, [kmlPath]);

  return placemarks;
}
