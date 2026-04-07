'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Zone } from '@/lib/types';

const ZONE_COLORS: Record<string, string> = {
  grass: '#22c55e',
  waste: '#f97316',
  maintenance: '#3b82f6',
};

interface AdminMapProps {
  zones: Zone[];
  onPolygonDrawn: (geojson: GeoJSON.Feature) => void;
  editingGeojson: GeoJSON.Feature | null;
}

export default function AdminMap({ zones, onPolygonDrawn, editingGeojson }: AdminMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [51.505, -0.09],
      zoom: 16,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    import('leaflet-draw').then(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const drawControl = new (L.Control as any).Draw({
        edit: {
          featureGroup: drawnItems,
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
          },
          polyline: false,
          circle: false,
          circlemarker: false,
          marker: false,
          rectangle: true,
        },
      });
      map.addControl(drawControl);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on(L.Draw.Event.CREATED, (e: any) => {
        drawnItems.clearLayers();
        const layer = e.layer;
        drawnItems.addLayer(layer);
        const geojson = layer.toGeoJSON() as GeoJSON.Feature;
        onPolygonDrawn(geojson);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on(L.Draw.Event.EDITED, (e: any) => {
        const layers = e.layers;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        layers.eachLayer((layer: any) => {
          const geojson = layer.toGeoJSON() as GeoJSON.Feature;
          onPolygonDrawn(geojson);
        });
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      drawnItemsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.GeoJSON) {
        map.removeLayer(layer);
      }
    });

    zones.forEach((zone) => {
      const color = ZONE_COLORS[zone.type] || '#6b7280';
      L.geoJSON(zone.geojson, {
        style: { color, fillColor: color, fillOpacity: 0.3, weight: 2, dashArray: '4' },
      })
        .bindTooltip(zone.name, { permanent: false, direction: 'center' })
        .addTo(map);
    });

    if (zones.length > 0) {
      const bounds = zones.map((z) => L.geoJSON(z.geojson).getBounds());
      const combined = bounds.reduce((acc, b) => acc.extend(b));
      if (combined.isValid()) map.fitBounds(combined, { padding: [40, 40] });
    }
  }, [zones]);

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    if (!drawnItems) return;

    drawnItems.clearLayers();

    if (editingGeojson) {
      const layer = L.geoJSON(editingGeojson);
      layer.eachLayer((l) => drawnItems.addLayer(l));
    }
  }, [editingGeojson]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-64" />;
}
