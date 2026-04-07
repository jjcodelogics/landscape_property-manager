'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zone } from '@/lib/types';

const ZONE_COLORS: Record<string, string> = {
  grass: '#22c55e',
  waste: '#f97316',
  maintenance: '#3b82f6',
};

interface MapProps {
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneClick: (zone: Zone) => void;
}

export default function Map({ zones, selectedZoneId, onZoneClick }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<Record<string, L.GeoJSON>>({}); 

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [51.505, -0.09],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(layersRef.current).forEach((layer) => map.removeLayer(layer));
    layersRef.current = {};

    zones.forEach((zone) => {
      const color = ZONE_COLORS[zone.type] || '#6b7280';
      const isSelected = zone.id === selectedZoneId;

      const layer = L.geoJSON(zone.geojson, {
        style: {
          color: isSelected ? '#ffffff' : color,
          fillColor: color,
          fillOpacity: isSelected ? 0.7 : 0.4,
          weight: isSelected ? 3 : 2,
        },
      });

      layer.on('click', () => onZoneClick(zone));
      layer.on('mouseover', () => {
        layer.setStyle({ fillOpacity: 0.6, weight: 3 });
      });
      layer.on('mouseout', () => {
        layer.setStyle({
          fillOpacity: isSelected ? 0.7 : 0.4,
          weight: isSelected ? 3 : 2,
        });
      });

      layer.addTo(map);
      layersRef.current[zone.id] = layer;
    });

    if (zones.length > 0 && !selectedZoneId) {
      const allBounds = zones.map((zone) => L.geoJSON(zone.geojson).getBounds());
      const combined = allBounds.reduce((acc, b) => acc.extend(b));
      if (combined.isValid()) {
        map.fitBounds(combined, { padding: [40, 40] });
      }
    }
  }, [zones, selectedZoneId, onZoneClick]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
