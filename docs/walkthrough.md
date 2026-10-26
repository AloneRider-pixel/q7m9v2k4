# Walkthrough guide, not a completed video

Record the actual app after reviewing it. Explain AI assistance honestly. Do not read claims of unaided development.

## Customer section, about 4 minutes

- Explain the UK day-ahead decision and why wind forecasts matter.
- Show decision date, assumed cutoff and next-day delivery mapping.
- Show the forecast available at that time, contrasted with retrospective actuals.
- Explain MAE, RMSE, signed bias and coverage in MW.
- Change the cutoff to show a different available forecast vintage.
- Explain why missing customer demand/prices mean this does not recommend a purchase quantity.

## Technical section, about 5 minutes

- React frontend -> same-origin Python API -> versioned Elexon historical snapshot.
- Data provenance, manifest and refresh script; only FUELHH WIND and WINDFOR used.
- Latest eligible publishTime per target, no post-decision leakage.
- Half-hour actual averaging to hourly targets; missing data and conflicts.
- Show no-hindsight tests and CSV audit columns.
- Describe local run, multi-stage Dockerfile and deployment adapters. State what has actually been executed. Do not claim container/cloud success before verifying it.
- Explain limitations: adjustable cutoff assumption, actual revisions, no inference of utility procurement, no formal uncertainty bounds.

Keep total under 10 minutes. Use an unlisted YouTube link only after publication approval and verify anonymous access.
