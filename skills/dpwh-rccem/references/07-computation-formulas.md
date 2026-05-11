# Appendix C — Calculation of Cycle Time for Hauling Equipment
> Source: DPWH RCCEM 2015, PDF pages 243–244 (Section C)

---

## C. CALCULATION OF CYCLE TIME FOR HAULING EQUIPMENT

---

## C.1 ESTIMATED TRAVEL SPEED, LOADING/UNLOADING & ALLOWANCE FOR DELAY

### Table: Dump Truck Travel Speed

| Terrain Condition | Road Surface Condition | Loaded Speed (km/h) | Empty Speed (km/h) |
|---|---|---|---|
| FLAT | PAVED | 35 | 55 |
| FLAT | UNPAVED | 30 | 45 |
| ROLLING | PAVED | 30 | 40 |
| ROLLING | UNPAVED | 25 | 35 |
| MOUNTAINOUS | PAVED | 20 | 30 |
| MOUNTAINOUS | UNPAVED | 15 | 25 |

### Fixed Time Components

| Component | Time |
|---|---|
| LOADING TIME | 3 min |
| UNLOADING TIME | 3 min |
| ALLOWANCE FOR DELAY | 10% of Cycle Time |

---

## C.2 FORMULA FOR THE CALCULATION OF DUMP TRUCK TRAVEL TIME

**Formula:**

```
T = D ÷ R
```

Where:
- **T** = Time, Time of Travel (h)
- **D** = Distance, Hauling Distance (km)
- **R** = Rate, Travel Speed (km/h)

---

## C.3 COMPUTATION OF CYCLE TIME, T

### Sample Computation

**Given:** Average Hauling Distance = 2.00 km, Flat Terrain, Paved Road

| Step | Description | Calculation | Result |
|---|---|---|---|
| Loaded Travel Time | First 200 m @ 20 kph | 200/20,000 × 60 | 0.60 min |
| | Succeeding 1600 m @ 30 kph | 1,600/30,000 × 60 | 3.20 min |
| | Next 200 m @ 20 kph | 200/20,000 × 60 | 0.60 min (?) |
| Unload and Maneuver | — | — | 3.00 min |
| Return Empty | First 200 m @ 30 kph | 200/30,000 × 60 | 0.40 min |
| | Succeeding 1600 m @ 45 kph | 1,600/45,000 × 60 | 2.13 min (?) |
| | Next 200 m @ 30 kph | 200/30,000 × 60 | 0.40 min (?) |

| Sub-total | Cycle Time (without delay) | — | 12.33 min |
|---|---|---|---|
| Allowance for Delay (10%) | — | — | 1.23 min |
| **Total Cycle Time, T** | — | — | **13.56 min** |

> **Note:** The assumed travel time for loaded and unloaded dump trucks for each type of road surface and terrain condition are for normal conditions. They may vary depending on traffic and road surface conditions and other factors, provided that a detailed justification/explanation is to be supported with the preceding output and newer information should be presented.

---

## General Cycle Time Calculation Method

### Step-by-Step Procedure

1. **Identify terrain and road surface condition** from the Travel Speed table.
2. **Calculate Loaded Travel Time:**
   - For first 200 m: use reduced speed (lower speed bracket applies)
   - For middle distance: use full loaded speed for that terrain/surface
   - For last 200 m near destination: use reduced speed
3. **Add Fixed Loading Time:** 3 minutes
4. **Add Fixed Unloading Time:** 3 minutes (Dump + maneuver)
5. **Calculate Empty Return Travel Time:**
   - Same distance breakdown as loaded, but at empty truck speeds
6. **Sub-total all components**
7. **Add 10% Allowance for Delay** = 10% × Sub-total
8. **Total Cycle Time** = Sub-total + Delay Allowance

### Variables Summary

| Symbol | Meaning | Unit |
|---|---|---|
| T | Total Cycle Time | minutes or hours |
| D | Hauling Distance (one-way) | km |
| R_L | Loaded Travel Speed | km/h |
| R_E | Empty Travel Speed | km/h |
| t_L | Loading Time | 3 min (fixed) |
| t_U | Unloading Time | 3 min (fixed) |
| t_D | Delay Allowance | 10% of raw cycle time |
| t_TL | Loaded Travel Time = D ÷ R_L × 60 | min |
| t_TE | Empty Travel Time = D ÷ R_E × 60 | min |

### Complete Cycle Time Formula

```
Raw Cycle Time = t_TL + t_L + t_U + t_TE
Total Cycle Time, T = Raw Cycle Time × 1.10  (adding 10% delay)
```

Or equivalently:

```
T = (D/R_L + D/R_E) × 60 + t_L + t_U) × 1.10
```

---

## Application: Number of Trucks Required

Once the cycle time is computed:

```
No. of Trucks = Cycle Time (min) ÷ Loading Time (min)
             = T ÷ t_L
```

Where Loading Time (t_L) is based on the truck capacity and the loading equipment production rate.

---

## Notes on Usage

- The RCCEM 2015 uses Cycle Time primarily for **earthwork hauling operations** (e.g., borrow excavation, embankment fill transport).
- Standard loading time = 3 minutes assumes a backhoe or bulldozer-pusher loader combination.
- Standard unloading/dumping time = 3 minutes for a standard dump truck.
- The 10% delay factor covers traffic stops, maneuvering, minor breakdowns, and queue waiting.
- For projects in urban areas or with significant congestion, the district engineer may apply a higher delay factor with justification.

---

## Terrain Classification Reference

| Terrain | Typical Gradient | Description |
|---|---|---|
| Flat | 0% – 5% | Level ground, coastal areas |
| Rolling | 5% – 15% | Hilly terrain, foothills |
| Mountainous | >15% | Steep grades, mountain roads |
