import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const number = (v, suffix = "") =>
  v == null ? "Unavailable" : Math.round(v).toLocaleString("en-GB") + suffix;
function Chart({ points }) {
  const W = 1000,
    H = 290,
    pad = 42,
    values = points
      .flatMap((p) => [p.forecast, p.actual])
      .filter((x) => x != null),
    max = Math.max(...values, 1000) * 1.1;
  const x = (i) => pad + (i * (W - pad * 2)) / 23,
    y = (v) => H - pad - (v / max) * (H - pad * 2);
  let path = (key) =>
    points
      .map((p, i) =>
        p[key] == null
          ? ""
          : `${i === 0 || points[i - 1][key] == null ? "M" : "L"}${x(i)},${y(p[key])}`,
      )
      .join(" ");
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Hourly forecast and actual wind generation in megawatts"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line
            x1={pad}
            x2={W - pad}
            y1={y(max * f)}
            y2={y(max * f)}
            stroke="#e3e8e6"
          />
          <text x="0" y={y(max * f) + 4} fontSize="13" fill="#55665f">
            {Math.round(max * f)}
          </text>
        </g>
      ))}
      <path d={path("actual")} fill="none" stroke="#263e50" strokeWidth="3" />
      <path
        d={path("forecast")}
        fill="none"
        stroke="#118270"
        strokeWidth="3"
        strokeDasharray="8 4"
      />
      {[0, 6, 12, 18, 23].map((i) => (
        <text key={i} x={x(i) - 15} y={H - 12} fontSize="14" fill="#55665f">
          {String(i).padStart(2, "0")}:00
        </text>
      ))}
    </svg>
  );
}
function App() {
  const [date, setDate] = useState("2026-01-15"),
    [cutoff, setCutoff] = useState("09:00"),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    fetch(`/api/analysis?date=${date}&cutoff=${cutoff}`)
      .then((r) => {
        if (!r.ok)
          throw Error(
            "Could not load this decision. Please check the date and time.",
          );
        return r.json();
      })
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setData(null);
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [date, cutoff]);
  const m = data?.metrics;
  return (
    <main>
      <header>
        <div>
          <span className="eyebrow">GRIDBRICKS CHALLENGE / RESEARCH PILOT</span>
          <h1>Wind Decision Lab</h1>
          <p>
            See what was knowable before the day-ahead decision. Then measure
            what happened.
          </p>
        </div>
        <span className="pill">Elexon / Great Britain</span>
      </header>
      <section className="controls">
        <label>
          Decision date (January 2026)
          <input
            type="date"
            min="2026-01-01"
            max="2026-01-31"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Assumed decision cutoff (UTC)
          <input
            type="time"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
          />
        </label>
        <div className="context">
          Delivery day<strong>{data?.deliveryDate || "..."}</strong>
          <small>Following calendar day, 00:00-24:00 UTC</small>
        </div>
      </section>
      <aside>
        <strong>Point-in-time selection.</strong> Only forecasts published at or
        before the selected cutoff are used. 09:00 UTC is an editable pilot
        assumption, not a verified market gate closure. Actuals below are
        retrospective and were not known at decision time.
      </aside>
      {loading && <p role="status">Loading decision snapshot...</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {data && !loading && (
        <>
          <section className="metrics">
            {[
              [
                "Mean absolute error",
                number(m.mae, " MW"),
                "Average absolute hourly difference",
              ],
              [
                "Root mean square error",
                number(m.rmse, " MW"),
                "Higher weight on large misses",
              ],
              [
                "Forecast bias",
                number(m.bias, " MW"),
                "Positive means overforecast",
              ],
              [
                "Matched coverage",
                `${m.n} / ${m.expected}`,
                "Complete hourly forecast / actual pairs",
              ],
            ].map(([k, v, s]) => (
              <article key={k}>
                <span>{k}</span>
                <strong>{v}</strong>
                <small>{s}</small>
              </article>
            ))}
          </section>
          {(data.missingForecast > 0 ||
            data.missingActual > 0 ||
            data.conflicts > 0) && (
            <aside className="warning">
              Coverage warning: {data.missingForecast} missing forecasts,{" "}
              {data.missingActual} missing complete actual hours,{" "}
              {data.conflicts} conflicting forecast targets. No interpolation or
              invented values. Metrics use matched pairs only.
            </aside>
          )}
          <section className="panel">
            <div className="sectionhead">
              <div>
                <h2>Next-day wind outlook</h2>
                <p>Hourly mean power (MW) / {data.deliveryDate} / UTC</p>
              </div>
              <div className="legend">
                <span className="forecast">Forecast at decision</span>
                <span className="actual">Actual, retrospective</span>
              </div>
            </div>
            <div className="chartscroll">
              <Chart points={data.points} />
            </div>
            <small className="scrollhint">
              On narrow screens, scroll the chart and table horizontally for all
              hours and columns.
            </small>
            <div className="summary">
              <span>
                Forecast energy{" "}
                <strong>{number(m.forecastEnergyMWh, " MWh")}</strong>
              </span>
              <span>
                Largest absolute miss{" "}
                <strong>{number(m.maxAbsoluteError, " MW")}</strong>
              </span>
            </div>
          </section>
          <section className="panel">
            <div className="sectionhead">
              <div>
                <h2>Audit the decision</h2>
                <p>
                  Each hourly forecast carries its publication timestamp. Error
                  = forecast minus actual.
                </p>
              </div>
              <a
                className="button"
                href={`/api/export?date=${date}&cutoff=${cutoff}`}
              >
                Download CSV
              </a>
            </div>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    {[
                      "Target UTC",
                      "Published UTC",
                      "Forecast MW",
                      "Actual MW",
                      "Error MW",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.points.map((p) => (
                    <tr key={p.time}>
                      <td>{p.time.slice(11, 16)}</td>
                      <td>
                        {p.publishTime?.replace("T", " ").slice(0, 16) ||
                          "Unavailable"}
                      </td>
                      <td>{number(p.forecast)}</td>
                      <td>{number(p.actual)}</td>
                      <td>{number(p.error)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      <section className="method">
        <h2>What this pilot does, and does not do</h2>
        <p>
          FUELHH half-hourly WIND actuals are averaged in complete pairs to
          match the hourly WINDFOR targets in the captured dataset. Forecast
          vintages are selected independently for each target using the latest
          eligible publishTime. Decisions span 1-31 January 2026; deliveries
          span 2 January-1 February. All times are UTC.
        </p>
        <p>
          This is a national wind-forecast analysis, not a utility procurement
          recommendation. Customer demand, generation ownership, prices and
          other power sources are intentionally absent. No MAPE is shown because
          near-zero generation makes it unstable. Coverage and source revisions
          limit conclusions. Error metrics are a hindsight evaluation, not a
          live uncertainty interval.
        </p>
        <p>
          Historical Elexon snapshot captured 27 October 2026 IST. Actuals may
          include later revisions. No claim is made that these actuals were
          available at the decision time.
        </p>
        <nav>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream"
            target="_blank"
            rel="noreferrer"
          >
            Actuals source
          </a>
          <a
            href="https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream"
            target="_blank"
            rel="noreferrer"
          >
            Forecast source
          </a>
        </nav>
      </section>
      <footer>
        AI-assisted implementation. See README for disclosure, limitations and
        reproducible tests.
        <br />
        Contains BMRS data © Elexon Limited copyright and database right 2026.{" "}
        <a
          href="https://www.elexon.co.uk/bsc/data/balancing-mechanism-reporting-agent/copyright-licence-bmrs-data/"
          target="_blank"
          rel="noreferrer"
        >
          Data licence
        </a>
        . No Elexon endorsement.
      </footer>
    </main>
  );
}
createRoot(document.getElementById("root")).render(<App />);
