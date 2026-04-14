# Option A Implementation Plan (MVP)

## Goal
Build a Growth Readiness Dashboard that shows:
1) where growth is likely, 2) readiness level, 3) main constraint, 4) recommended action.

## Scope
- 8-12 sample areas
- Interactive map (Leaflet + GeoJSON)
- Readiness score + factor breakdown
- Explanation + main constraint + recommended actions
- Optional side-by-side comparison if time allows

## Data
- `data/areas.sample.json` as the starter dataset
- `configs/scoring_rules.json` for weights and band labels

## UI Layout
- Left: area list + quick filters
- Center: map with clickable areas
- Right: readiness score + breakdown + explanation + action list

## Mapping
- Primary: Leaflet + OpenStreetMap tiles
- Fallback: static map image + clickable overlays

## Build Order
1) Finalize data schema + sample areas
2) Build UI layout and selection flow
3) Add map integration
4) Wire score breakdown and explanations
5) Polish + demo copy
