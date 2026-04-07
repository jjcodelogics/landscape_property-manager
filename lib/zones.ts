import { Zone } from './types';

/**
 * Hardcoded zones for testing map interaction before database integration.
 * These zones represent different areas of a facility in the Netherlands.
 */
export const HARDCODED_ZONES: Zone[] = [
  {
    id: '1',
    name: 'Main Entrance Lawn',
    type: 'grass',
    instructions: `## Tasks
- Weekly mowing during growing season (April–October)
- Edge trimming along pathways
- Check irrigation system every Monday

## Notes
- High-visibility area; keep pristine
- Watch for drainage issues near southwest corner

## Key Info
- Area: ~450 m²
- Grass type: Sports turf mix

## Contact
**Supervisor:** Jan de Vries  
**Phone:** +31 6 1234 5678

## Quality Standards
- Mowing height: 3–4 cm
- No bare patches tolerated`,
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.500, 52.900],
          [6.502, 52.900],
          [6.502, 52.901],
          [6.500, 52.901],
          [6.500, 52.900],
        ]],
      },
    },
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Parking North',
    type: 'waste',
    instructions: `## Tasks
- Empty waste bins: Mon, Wed, Fri (7:00 AM)
- Sweep parking area: Daily
- Check recycling stations: Weekly

## Notes
- 12 bins total (6 general, 4 recycling, 2 glass)
- Heavy use on weekdays

## Key Info
- Collection route: Start northwest, work clockwise
- Bin capacity: 240L standard

## Contact
**Waste Coordinator:** Emma Jansen  
**Phone:** +31 6 2345 6789

## Quality Standards
- No overflowing bins
- Litter-free surface by 8:00 AM`,
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.503, 52.900],
          [6.505, 52.900],
          [6.505, 52.901],
          [6.503, 52.901],
          [6.503, 52.900],
        ]],
      },
    },
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'HVAC Service Zone',
    type: 'maintenance',
    instructions: `## Tasks
- Monthly filter replacements
- Quarterly equipment inspection
- Check access pathway: Weekly

## Notes
- Restricted area; staff badge required
- Equipment operational 24/7

## Key Info
- Units: 4 rooftop HVAC systems
- Access: East stairwell

## Contact
**Facility Manager:** Pieter Bakker  
**Phone:** +31 6 3456 7890  
**Emergency:** +31 6 9999 0000

## Quality Standards
- Keep 2m clearance around units
- Report unusual sounds/vibrations immediately`,
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.500, 52.902],
          [6.502, 52.902],
          [6.502, 52.903],
          [6.500, 52.903],
          [6.500, 52.902],
        ]],
      },
    },
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Garden South',
    type: 'grass',
    instructions: `## Tasks
- Mowing: Every 10 days
- Flower bed weeding: Weekly
- Mulch refresh: Spring & Fall

## Notes
- Contains decorative plants; use caution
- Wildflower section (northeast) — mow only in October

## Key Info
- Area: ~600 m²
- Includes 3 ornamental beds

## Contact
**Horticulturist:** Sofia van Dijk  
**Phone:** +31 6 4567 8901

## Quality Standards
- Preserve flower bed edges
- No herbicides without approval`,
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.503, 52.902],
          [6.505, 52.902],
          [6.505, 52.903],
          [6.503, 52.903],
          [6.503, 52.902],
        ]],
      },
    },
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Loading Dock',
    type: 'maintenance',
    instructions: `## Tasks
- Daily sweep & debris removal
- Pressure wash: Monthly
- Inspect dock equipment: Weekly
- Check drainage grates: After rainfall

## Notes
- Active deliveries: Mon–Fri, 6 AM–4 PM
- Schedule cleaning outside delivery hours

## Key Info
- Surface: Concrete, sealed
- Drainage: 6 floor grates

## Contact
**Operations Lead:** Marco Hendriks  
**Phone:** +31 6 5678 9012

## Quality Standards
- Oil spill response < 15 min
- No trip hazards
- Grates clear of debris`,
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.506, 52.900],
          [6.508, 52.900],
          [6.508, 52.902],
          [6.506, 52.902],
          [6.506, 52.900],
        ]],
      },
    },
    created_at: new Date().toISOString(),
  },
];
