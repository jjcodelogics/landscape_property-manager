'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zone } from '@/lib/types';
import { getZoneColorByLastWorked } from '@/lib/zone-colors';
import { useUserLocation } from '@/lib/useUserLocation';

interface MapProps {
  zones: Zone[];
  selectedZoneId: string | null;
  onZoneClick: (zone: Zone) => void;
}

export default function Map({ zones, selectedZoneId, onZoneClick }: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<Record<string, L.GeoJSON>>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const [hasInitiallycentered, setHasInitiallyCenter] = useState(false);
  
  const { position, error: locationError } = useUserLocation();

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

  // Handle user location updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;

    // Create custom blue dot icon for user location
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background-color: #4285F4;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const userLatLng = L.latLng(position.latitude, position.longitude);

    // Update or create user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userLatLng);
    } else {
      userMarkerRef.current = L.marker(userLatLng, { 
        icon: userIcon,
        zIndexOffset: 1000, // Keep user marker on top
      }).addTo(map);
    }

    // Update or create accuracy circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng(userLatLng);
      accuracyCircleRef.current.setRadius(position.accuracy);
    } else {
      accuracyCircleRef.current = L.circle(userLatLng, {
        radius: position.accuracy,
        color: '#4285F4',
        fillColor: '#4285F4',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
    }

    // Center on user location only on first load
    if (!hasInitiallycentered) {
      map.setView(userLatLng, 18);
      setHasInitiallyCenter(true);
    }
  }, [position, hasInitiallycentered]);

  // Cleanup user location markers on unmount
  useEffect(() => {
    return () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }
    };
  }, []);

  // Function to center map on user location
  const centerOnUserLocation = () => {
    const map = mapRef.current;
    if (!map || !position) return;
    
    map.setView(L.latLng(position.latitude, position.longitude), 18, {
      animate: true,
      duration: 0.5,
    });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Center on Me button */}
      {position && (
        <button
          onClick={centerOnUserLocation}
          className="absolute bottom-6 right-6 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-lg shadow-lg border border-gray-300 flex items-center gap-2 z-[1000] touch-manipulation min-h-[48px]"
          aria-label="Center map on my location"
        >
          <span className="text-xl">📍</span>
          <span>Center on Me</span>
        </button>
      )}
      
      {/* Location error message */}
      {locationError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-md z-[1000]">
          {locationError}
        </div>
      )}
    </div>
  );
}
