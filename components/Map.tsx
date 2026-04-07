'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zone } from '@/lib/types';

const ZONE_COLORS: Record<string, string> = {
  grass: '#22c55e',      // green
  waste: '#3b82f6',      // blue
  maintenance: '#f97316', // orange
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

    // Property boundary - extracted from facility GeoJSON polygon
    const propertyBounds: L.LatLngBoundsExpression = [
      [52.97663782252974, 6.565499658064198],   // Southwest corner (southLat, westLng)
      [52.98629205327026, 6.581936137427363],   // Northeast corner (northLat, eastLng)
    ];

    const map = L.map(mapContainerRef.current, {
      center: [52.9815, 6.5737],    // Center of property
      zoom: 16,
      zoomControl: true,
      minZoom: 16,                     // Prevents zooming out to see the city
      maxZoom: 20,                     // Allow detailed inspection
      maxBounds: propertyBounds,       // Restrict panning to property boundary
      maxBoundsViscosity: 1.0,         // Hard boundary - cannot pan outside
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
          weight: isSelected ? 4 : 2,
        },
      });

      layer.on('click', () => onZoneClick(zone));
      
      // Enhanced hover effect
      layer.on('mouseover', (e) => {
        const target = e.target;
        target.setStyle({ 
          fillOpacity: 0.65,
          weight: 4,
          color: '#ffffff',
        });
      });
      
      layer.on('mouseout', (e) => {
        const target = e.target;
        target.setStyle({
          color: isSelected ? '#ffffff' : color,
          fillOpacity: isSelected ? 0.7 : 0.4,
          weight: isSelected ? 4 : 2,
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
