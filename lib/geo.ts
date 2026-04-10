import type { GeoJSON } from 'geojson';

const R = 6371000; // Earth radius in meters

function ringArea(coords: number[][]): number {
  const n = coords.length;
  if (n < 3) return 0;
  let area = 0;
  for (let i = 0; i < n - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    if (!p1 || !p2 || p1.length < 2 || p2.length < 2) continue;
    const lon1 = p1[0];
    const lat1 = p1[1];
    const lon2 = p2[0];
    const lat2 = p2[1];
    if (lon1 === undefined || lat1 === undefined || lon2 === undefined || lat2 === undefined) continue;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dLambda = ((lon2 - lon1) * Math.PI) / 180;
    area += dLambda * (2 + Math.sin(phi1) + Math.sin(phi2));
  }
  return Math.abs((area * R * R) / 2);
}

function geometryArea(geometry: GeoJSON.Geometry): number {
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates?.[0];
    if (!coords || coords.length === 0) return 0;
    return ringArea(coords as number[][]);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce((sum, poly) => {
      const ring = poly[0];
      return ring ? sum + ringArea(ring as number[][]) : sum;
    }, 0);
  }
  return 0;
}

export function calculatePolygonArea(geojson: GeoJSON.Feature | GeoJSON.Geometry | null): number {
  if (!geojson) return 0;
  if ((geojson as GeoJSON.Feature).type === 'Feature') {
    const feature = geojson as GeoJSON.Feature;
    if (!feature.geometry) return 0;
    return geometryArea(feature.geometry);
  }
  return geometryArea(geojson as GeoJSON.Geometry);
}
