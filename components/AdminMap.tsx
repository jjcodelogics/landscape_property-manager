'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { Zone } from '@/lib/types';
import { getZoneColorByLastWorked } from '@/lib/zone-colors';

interface AdminMapProps {
  zones: Zone[];
  onPolygonDrawn: (geojson: GeoJSON.Feature) => void;
  editingGeojson: GeoJSON.Feature | null;
  onMarkerPlaced?: (geojson: GeoJSON.Feature) => void;
  enableMarker?: boolean;
}

export default function AdminMap({ zones, onPolygonDrawn, editingGeojson, onMarkerPlaced, enableMarker = false }: AdminMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const propertyBounds: L.LatLngBoundsExpression = [
      [52.97663782252974, 6.565499658064198],
      [52.98629205327026, 6.581936137427363],
    ];

    // Center on the actual property location (DonkerGroep facility)
    const map = L.map(mapContainerRef.current, {
      center: [52.9815, 6.5737],
      zoom: 16,
      zoomControl: true,
      minZoom: 16,
      maxZoom: 20,
      maxBounds: propertyBounds,
      maxBoundsViscosity: 1.0,
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
      if (!mapRef.current || !map.getContainer()) return;

      // Add Leaflet Draw control
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const drawControl = new (L.Control as any).Draw({
        edit: {
          featureGroup: drawnItems,
        },
        draw: {
          polygon: enableMarker ? false : {
            allowIntersection: false,
            showArea: true,
          },
          polyline: false,
          circle: false,
          circlemarker: false,
          marker: enableMarker,
          rectangle: enableMarker ? false : true,
        },
      });
      map.addControl(drawControl);

      // Handle draw created event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on(L.Draw.Event.CREATED, (e: any) => {
        drawnItems.clearLayers();
        const layer = e.layer as L.Layer & { toGeoJSON: () => GeoJSON.Feature };
        drawnItems.addLayer(layer);
        const geojson = layer.toGeoJSON() as GeoJSON.Feature;
        
        // Check if it's a marker or polygon
        if (geojson.geometry.type === 'Point' && onMarkerPlaced) {
          onMarkerPlaced(geojson);
        } else {
          onPolygonDrawn(geojson);
        }
      });

      // Handle draw edited event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on(L.Draw.Event.EDITED, (e: any) => {
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
      const color = getZoneColorByLastWorked(zone.last_worked_at);
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
