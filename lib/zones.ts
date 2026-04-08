import { Zone } from './types';

/**
 * Actual facility zones loaded from GeoJSON.
 * These zones represent different areas of the facility.
 */
export const HARDCODED_ZONES: Zone[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'North Entrance Lawn',
    name: 'North Entrance Lawn',
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
          [6.5685955124618545, 52.98294148252975],
          [6.568379347111119, 52.98243360462092],
          [6.569043660141773, 52.982344725373025],
          [6.569244008516705, 52.98286530122388],
          [6.5685955124618545, 52.98294148252975]
        ]],
      },
    },
    last_worked_at: null,
    next_scheduled_work: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    title: 'Main Parking Area',
    name: 'Main Parking Area',
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
          [6.569093151152288, 52.98208591007733],
          [6.569453480276053, 52.98216506431535],
          [6.569760246962602, 52.98205366201253],
          [6.570125445399782, 52.98214747449731],
          [6.5700475363995, 52.98160511825563],
          [6.569541127901914, 52.981493714508986],
          [6.568990895590076, 52.981575801507944],
          [6.568976287652475, 52.9818455148353],
          [6.569093151152288, 52.98208591007733]
        ]],
      },
    },
    last_worked_at: null,
    next_scheduled_work: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    title: 'East Building Maintenance',
    name: 'East Building Maintenance',
    type: 'maintenance',
    instructions: `## Tasks
- Monthly equipment inspection
- Quarterly deep clean
- Check access pathway: Weekly
- HVAC filter replacement: Monthly

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
          [6.57425843667977, 52.98156322661845],
          [6.574131937527113, 52.98117153663915],
          [6.573704249915465, 52.98101921179938],
          [6.5737524400692, 52.980841498807536],
          [6.574270484218005, 52.98093216879252],
          [6.574246389141564, 52.9806347705302],
          [6.574475292369556, 52.98062389006705],
          [6.575282477439146, 52.980841498807536],
          [6.575583665897312, 52.98129847359539],
          [6.5754993331288745, 52.98138914262137],
          [6.57425843667977, 52.98156322661845]
        ]],
      },
    },
    last_worked_at: null,
    next_scheduled_work: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
    title: 'Storage Yard',
    name: 'Storage Yard',
    type: 'maintenance',
    instructions: `## Tasks
- Daily sweep & debris removal
- Pressure wash: Monthly
- Inspect storage structures: Weekly
- Check drainage grates: After rainfall

## Notes
- Active use: Mon–Fri, 6 AM–4 PM
- Schedule cleaning outside peak hours

## Key Info
- Surface: Concrete, sealed
- Drainage: 4 floor grates

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
          [6.575537876522674, 52.98099651063825],
          [6.575375284820382, 52.980500290572735],
          [6.5766479853887745, 52.98045978256059],
          [6.576305982152661, 52.98103026689836],
          [6.575537876522674, 52.98099651063825]
        ]],
      },
    },
    last_worked_at: null,
    next_scheduled_work: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '6ba7b813-9dad-11d1-80b4-00c04fd430c8',
    title: 'South Sports Field',
    name: 'South Sports Field',
    type: 'grass',
    instructions: `## Tasks
- Mowing: Every 7 days during season
- Line marking: Monthly
- Aeration: Spring & Fall
- Fertilizing: Quarterly

## Notes
- Sports field in active use
- Coordinate maintenance with facility schedule
- No mowing during events

## Key Info
- Area: ~2,500 m²
- Grass type: Professional sports turf
- Usage: Soccer/multi-sport

## Contact
**Sports Coordinator:** Lisa Vermeer  
**Phone:** +31 6 7890 1234

## Quality Standards
- Mowing height: 2.5–3 cm
- Even, level surface required
- No standing water`,
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.576173229073476, 52.97890347637821],
          [6.576838676002012, 52.977860690236895],
          [6.579261585333597, 52.978615813749286],
          [6.5779136286246, 52.979740768953064],
          [6.576173229073476, 52.97890347637821]
        ]],
      },
    },
    last_worked_at: null,
    next_scheduled_work: null,
    created_at: new Date().toISOString(),
  },
  {
    id: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
    title: 'Central Garden',
    name: 'Central Garden',
    type: 'grass',
    instructions: `## Tasks
- Mowing: Every 10 days
- Flower bed weeding: Weekly
- Mulch refresh: Spring & Fall
- Pruning: Seasonal

## Notes
- Contains decorative plants; use caution
- Wildflower section (northeast) — mow only in October
- Public access area

## Key Info
- Area: ~800 m²
- Includes 5 ornamental beds
- Mixed grass and garden beds

## Contact
**Horticulturist:** Sofia van Dijk  
**Phone:** +31 6 4567 8901

## Quality Standards
- Preserve flower bed edges
- No herbicides without approval
- Keep pathways clear`,
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [6.5707862819641605, 52.981174100823466],
          [6.5706071231755345, 52.98072721904401],
          [6.570675374141928, 52.98002863596756],
          [6.572398711060686, 52.980583394039826],
          [6.572535212995859, 52.98104055043129],
          [6.572125707192583, 52.98156174776119],
          [6.5707862819641605, 52.981174100823466]
        ]],
      },
    },
    last_worked_at: null,
    next_scheduled_work: null,
    created_at: new Date().toISOString(),
  },
];
