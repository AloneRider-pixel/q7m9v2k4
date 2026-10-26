# Verification record

- React production build: passed with npm ci/install and Vite build.
- Python unit tests: 9 passed. Includes future-publication exclusion, cutoff equality, latest revision, missing half-hour, conflicting publication tie, zero actual, empty forecasts, invalid date and January31->February1 mapping.
- Real-data January replay: all 31 dates evaluated; every selected publishTime was asserted <= decisionTime. Results in monthly-summary.json.
- Local Chromium functional test: 320, 390, 1280px widths; no body overflow or JavaScript exceptions; controls, next-day mapping, CSV export with 24 hourly records, out-of-range API 400 response.
- Actual desktop/mobile screenshots inspected. Table and chart intentionally scroll horizontally at mobile widths; explicit scroll hint included.
- Source manifest contains byte hashes and file retrieval timestamps; no generated stand-in data.
- Docker: prepared, not executed. Docker was not available.
- Vercel: adapters/configuration prepared from current official documentation, not deployed or cloud-runtime verified.
- No public repo, unlisted video, reviewer access or assessment submission has been performed.

`browser-verification.cjs` records the local smoke-test logic. Its original local working paths need adjustment to run on another machine; it requires Playwright, which is not a runtime app dependency.
