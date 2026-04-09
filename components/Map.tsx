'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zone } from '@/lib/types';
import { getZoneColorByLastWorked } from '@/lib/zone-colors';

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

    const propertyBounds: L.LatLngBoundsExpression = [
      [52.97663782252974, 6.565499658064198],
      [52.98629205327026, 6.581936137427363],
    ];

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
      const color = getZoneColorByLastWorked(zone.last_worked_at);
      const isSelected = zone.id === selectedZoneId;

      const layer = L.geoJSON(zone.geojson, {
        style: {
          color:       isSelected ? '#005f73' : color,
          fillColor:   color,
          fillOpacity: isSelected ? 0.72 : 0.38,
          weight:      isSelected ? 3.5 : 2,
        },
      });

      layer.on('click', () => onZoneClick(zone));

      layer.on('mouseover', (e) => {
        e.target.setStyle({
          fillOpacity: 0.6,
          weight:      3,
          color:       '#005f73',
        });
        e.target.bringToFront();
      });

      layer.on('mouseout', (e) => {
        e.target.setStyle({
          color:       isSelected ? '#005f73' : color,
          fillOpacity: isSelected ? 0.72 : 0.38,
          weight:      isSelected ? 3.5 : 2,
        });
      });

      // Zone label tooltip at higher zoom
      layer.bindTooltip(zone.title, {
        permanent: false,
        direction: 'center',
        className: 'zone-tooltip',
        opacity: 0.9,
      });

      layer.addTo(map);
      layersRef.current[zone.id] = layer;
    });

    if (zones.length > 0 && !selectedZoneId) {
      const allBounds = zones.map((zone) => L.geoJSON(zone.geojson).getBounds());
      const combined = allBounds.reduce((acc, b) => acc.extend(b));
      if (combined.isValid()) {
        map.fitBounds(combined, { padding: [60, 60] });
      }
    }
  }, [zones, selectedZoneId, onZoneClick]);

  return <div ref={mapContainerRef} className="w-full h-full" />;
}
