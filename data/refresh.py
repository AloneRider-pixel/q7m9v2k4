"""Explicit one-shot historical snapshot download; no automated polling."""
import urllib.request,json,hashlib
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).parent
SOURCES={
 'actuals':'https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream?settlementDateFrom=2026-01-02&settlementDateTo=2026-02-01&fuelType=WIND',
 'forecasts':'https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream?publishDateTimeFrom=2025-12-30T00%3A00%3A00Z&publishDateTimeTo=2026-02-01T00%3A00%3A00Z'}
if __name__=='__main__':
 manifest={'capturedAt':datetime.now(timezone.utc).isoformat(),'sources':{}}
 for name,url in SOURCES.items():
  with urllib.request.urlopen(url,timeout=60) as r:raw=r.read()
  data=json.loads(raw)
  if not isinstance(data,list) or not data:raise ValueError(f'Unexpected {name} payload')
  (ROOT/f'{name}.json').write_bytes(raw)
  manifest['sources'][name]={'url':url,'rows':len(data),'sha256':hashlib.sha256(raw).hexdigest()}
 (ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2))
