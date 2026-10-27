"""Point-in-time wind forecast evaluation. All timestamps are UTC."""
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import math

def parse(s): return datetime.fromisoformat(s.replace('Z', '+00:00'))
def iso(t): return t.isoformat().replace('+00:00', 'Z')

def evaluate(actuals, forecasts, decision_date, cutoff='09:00'):
    decision = datetime.fromisoformat(f'{decision_date}T{cutoff}:00').replace(tzinfo=timezone.utc)
    if not datetime(2026,1,1,tzinfo=timezone.utc) <= decision < datetime(2026,2,1,tzinfo=timezone.utc):
        raise ValueError('Decision date must be in January 2026')
    start = (decision + timedelta(days=1)).replace(hour=0,minute=0,second=0)
    end = start + timedelta(days=1)
    # WINDFOR is hourly in the downloaded dataset. Aggregate two half-hour MW
    # actuals to the same hour. Reject partial actual hours; do not interpolate.
    buckets=defaultdict(dict)
    for row in actuals:
        t=parse(row['startTime'])
        if row.get('fuelType')=='WIND' and start <= t < end:
            buckets[t.replace(minute=0,second=0,microsecond=0)][t.minute]=row['generation']
    selected={}
    conflicts=set()
    for row in forecasts:
        t,pub=parse(row['startTime']),parse(row['publishTime'])
        if start <= t < end and pub <= decision:
            if t not in selected or pub > selected[t][0]:
                selected[t]=(pub,row['generation']); conflicts.discard(t)
            elif pub==selected[t][0] and row['generation']!=selected[t][1]:
                conflicts.add(t)
    points=[]
    for h in range(24):
        t=start+timedelta(hours=h); pair=selected.get(t); b=buckets.get(t,{})
        actual=(b[0]+b[30])/2 if 0 in b and 30 in b else None
        forecast=pair[1] if pair and t not in conflicts else None
        points.append(dict(time=iso(t), actual=actual, forecast=forecast,
          publishTime=iso(pair[0]) if pair else None,
          error=forecast-actual if forecast is not None and actual is not None else None,
          conflict=t in conflicts))
    errors=[p['error'] for p in points if p['error'] is not None]
    metric=lambda f: f(errors) if errors else None
    return dict(decisionTime=iso(decision),deliveryDate=start.date().isoformat(),points=points,
       metrics=dict(n=len(errors),expected=24,
          mae=metric(lambda es: sum(abs(e) for e in es)/len(es)),
          rmse=metric(lambda es: math.sqrt(sum(e*e for e in es)/len(es))),
          bias=metric(lambda es: sum(es)/len(es)),
          maxAbsoluteError=metric(lambda es: max(map(abs,es))),
          forecastEnergyMWh=sum(p['forecast'] for p in points) if all(p['forecast'] is not None for p in points) else None),
       missingForecast=sum(p['forecast'] is None for p in points),
       missingActual=sum(p['actual'] is None for p in points),conflicts=len(conflicts))
