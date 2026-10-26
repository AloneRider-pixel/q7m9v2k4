# Historical findings at the assumed 09:00 UTC cutoff

This is a retrospective replay of decisions in January 2026, not a live trading result. The cutoff is an explicit assumption.

- matchedHours: 744.000
- expectedHours: 744.000
- maeMW: 2038.913
- rmseMW: 2504.759
- biasMW: 1747.887

Matched-hour errors are pooled across all 31 delivery days (Jan 2-Feb 1), not averaged from already-rounded daily metrics. Positive bias means the selected wind forecasts exceeded realized wind on average. These values describe this specific snapshot and cutoff; they do not establish future error rates or a prediction interval. Day-level output is in monthly-summary.json.

Selection eligibility was asserted across all 31 days: every selected publication timestamp was at or before its decision time. No missing-data interpolation was used. National wind is not utility-owned supply; no procurement recommendation is supported without additional demand/portfolio data.
