# Wind Decision Lab

A React and Python research pilot for the Gridbricks Full Stack SWE challenge. It shows the wind forecasts available at a selected January 2026 decision time and compares them with retrospective Elexon wind actuals.

**Status:** live app deployed and anonymously verified at https://q7m9v2k4.vercel.app . Public implementation is merged to main in https://github.com/AloneRider-pixel/q7m9v2k4 (PR #1). Sixteen analysis/HTTP tests pass, verified in CI inside the built container. Production app/API, CSV and responsive views were checked without login. No completed video or assessment submission is claimed. The Dockerfile builds and the container runs, verified by the container-verify GitHub Actions workflow: endpoint checks plus all sixteen tests inside the container image (run: https://github.com/AloneRider-pixel/q7m9v2k4/actions/runs/40742031820 ).

## AI assistance disclosure

AI assistance was used to design and implement the application, retrieve and inspect public API documentation, write tests, and prepare documentation. Review the code and explain it honestly in the walkthrough. This is not represented as unaided work. No generative model is used to invent data or forecast values at runtime.

## Run locally

Requirements: Node.js 22+, npm, Python 3.12+.

```sh
npm --prefix frontend ci
npm --prefix frontend run build
python3 backend/server.py
```

Open `http://localhost:8000`. The Python server serves the production React bundle and API on one origin. No runtime Python dependencies or credentials are needed.

```sh
python3 -m unittest discover -s tests -v
```

## Docker

```sh
docker build -t wind-decision-lab .
docker run --rm -p 8000:8000 wind-decision-lab
```

Multi-stage build: Node builds the React bundle; Python serves it as an unprivileged user. Container build and runtime are verified by the container-verify GitHub Actions workflow (.github/workflows/container-verify.yml): it builds the image, starts the container, checks /api/health, the homepage, /api/analysis including the January 31 to February 1 overnight spill, and /api/export, then runs all sixteen unit tests inside the container image. Latest verified run: https://github.com/AloneRider-pixel/q7m9v2k4/actions/runs/40742031820

## Directory map

- `frontend/src/`: React dashboard, SVG plot and responsive styles.
- `frontend/package-lock.json`: reproducible dependency resolution.
- `backend/analysis.py`: pure point-in-time selection, alignment and metrics.
- `backend/server.py`: standard-library HTTP API and static file serving for local/Docker use.
- `api/`: Vercel file-based Python handler adapters using the same implementation.
- `data/actuals.json`, `data/forecasts.json`: captured genuine Elexon historical responses.
- `data/manifest.json`: exact sources, capture timestamp, row counts and SHA256 hashes.
- `data/refresh.py`: optional one-shot refresh from the named public APIs, not a poller.
- `tests/`: deterministic edge-case and no-hindsight tests.
- `docs/`: analysis findings, verification and walkthrough guide.
- `Dockerfile`, `vercel.json`: deployment configuration; the Dockerfile container build and runtime are verified in CI (see Docker section).

## Method

1. Decision dates are January 1-31, 2026 in UTC. The delivery day is the following calendar day, so January 31 maps to February 1.
2. The default 09:00 UTC decision cutoff is an **editable assumption**, not a verified official market gate closure. No trading decision or procurement quantity is recommended.
3. For each target hour, use the forecast with the latest `publishTime <= decisionTime`. Forecast records published after the decision are excluded, even if their target is historical. Publication ties with conflicting values are flagged and omitted.
4. The downloaded WINDFOR targets are hourly. FUELHH WIND is average MW over half-hours. Two complete half-hours are averaged to each hourly target. Missing pairs are not filled or interpolated. This is temporal aggregation of national data, not a cross-source capacity adjustment.
5. Error is forecast MW minus actual MW. MAE, RMSE, signed bias and largest absolute error use only complete matched hourly pairs. Coverage is always visible.
6. The sum of 24 hourly forecast MW values is the day's MWh. Energy is unavailable unless all 24 hours have forecasts. Do not add half-hour MW values without duration weighting.
7. Actuals are retrospective observations, potentially revised since delivery. They are never used in forecast selection. This is a historical snapshot replay, not proof that all records were available through this exact API at the original decision time.
8. MAPE is omitted because wind can be near zero. Realized error is not an ex-ante uncertainty interval.

Scope excludes customer demand, prices, utility-owned wind shares, thermal availability and other fuel types, as the challenge limits inputs to national wind data. A forecast MW quantity cannot by itself determine how much the utility must procure.

## Deployment preparation

The challenge names Vercel or Heroku. Vercel supports file-based Python handlers and a free Hobby tier for personal, non-commercial projects. Confirm the account and project eligibility before deploying. The supplied `vercel.json` builds `frontend/dist` and includes the historical JSON in Python functions. Use repository root as the project root and the explicit **Vite** framework preset. Python version: 3.12.

Production deployment was completed and anonymously checked on 27 October 2026. The Vite preset is explicit so the required root Dockerfile does not select the Container preset. API entrypoints declare handler subclasses directly for Vercel discovery. After approved deployment, verify `/`, `/api/health`, `/api/analysis?date=2026-01-15&cutoff=09:00`, `/api/export?date=2026-01-15&cutoff=09:00`, January31->February1, all controls, mobile layout and anonymous access. Verified production URL: https://q7m9v2k4.vercel.app .

Heroku Eco currently costs $5/month; it was not selected because this project has no paid-service approval. Docker is for reproducible local/container execution; Vercel's Python deployment does not run that Dockerfile.

## Submission checklist

- Review the code and reproduce the tests.
- Public random-name repository creation and eligible free Vercel deployment were approved. Vercel sign-in used the approved AloneRider-pixel GitHub identity; authenticated CLI access was approved and deployment completed on the existing Hobby team. Resume sharing and unlisted YouTube publication still require their own approval. An anonymous repo name does not anonymize its owner or commit metadata.
- Keep code changes reviewable through pull requests.
- Record a maximum 10-minute walkthrough: customer pitch and technical review, with initial overview no more than 5 minutes for each part. See `docs/walkthrough.md`.
- Verify all submitted links without signed-in access. The assessment says evaluation starts with the video and not to submit without it.
- Fill the submission form only with genuine completed deliverables and reviewed truthful answers. Build authorization is not submission authorization.

## Sources

- https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream
- https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream
- https://vercel.com/docs/functions/runtimes/python/api-directory
- https://vercel.com/docs/plans/hobby
- https://devcenter.heroku.com/articles/eco-dyno-hours

Exact API queries and content hashes are in `data/manifest.json`. The BMRS open-data licence permits copying, publication, distribution and adaptation with attribution, no implied endorsement and no misleading use. Contains BMRS data © Elexon Limited copyright and database right 2026. Licence: https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/ . Any further distribution of the bundled data must retain this attribution and licence reference. No Elexon endorsement. The public app serves this fixed snapshot, not continuous upstream API calls.
