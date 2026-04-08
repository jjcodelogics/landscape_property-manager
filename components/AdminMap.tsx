'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Zone } from '@/lib/types';

// DonkerGroep zone palette
const ZONE_COLORS: Record<string, string> = {
  grass:       '#6aa84f',
  waste:       '#3d85c6',
  maintenance: '#e69138',
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

    // Center on the actual property location (DonkerGroep facility)
    const map = L.map(mapContainerRef.current, {
      center: [52.9815, 6.5737],
      zoom: 16,
      minZoom: 14,
      maxZoom: 20,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    import('leaflet-draw').then(() => {
      // Check if map is still mounted and initialized
      if (!mapRef.current || !(map as any)._loaded) return;

      // Type for Leaflet Draw control
      const LDrawControl = (L.Control as any).Draw;
      
      const drawControl = new LDrawControl({
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

      // Type for draw created event
      interface DrawCreatedEvent {
        layer: L.Layer & { toGeoJSON: () => GeoJSON.Feature };
        layerType: string;
      }

      map.on(L.Draw.Event.CREATED, (e: DrawCreatedEvent) => {
        drawnItems.clearLayers();
        const layer = e.layer;
        drawnItems.addLayer(layer);
        const geojson = layer.toGeoJSON() as GeoJSON.Feature;
        onPolygonDrawn(geojson);
      });

      // Type for draw edited event
      interface DrawEditedEvent {
        layers: L.LayerGroup;
      }

      map.on(L.Draw.Event.EDITED, (e: DrawEditedEvent) => {
        const layers = e.layers;
        layers.eachLayer((layer: L.Layer) => {
          const geoJsonLayer = layer as L.Layer & { toGeoJSON: () => GeoJSON.Feature };
          const geojson = geoJsonLayer.toGeoJSON() as GeoJSON.Feature;
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
        .bindTooltip(zone.title, { permanent: false, direction: 'center' })
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
