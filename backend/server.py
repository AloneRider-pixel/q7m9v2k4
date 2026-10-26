from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
from pathlib import Path
import json, os, sys, csv, io
sys.path.insert(0,str(Path(__file__).parent))
from analysis import evaluate
ROOT=Path(__file__).resolve().parents[1]
ACTUALS=json.loads((ROOT/'data/actuals.json').read_text())
FORECASTS=json.loads((ROOT/'data/forecasts.json').read_text())
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT/'frontend/dist'),**kw)
    def do_GET(self):
        u=urlparse(self.path)
        if u.path in ['/api/analysis','/api/export','/api/export.csv']:
            q=parse_qs(u.query)
            try: result=evaluate(ACTUALS,FORECASTS,q.get('date',['2026-01-15'])[0],q.get('cutoff',['09:00'])[0])
            except (ValueError,TypeError) as e: self.send_error(400,str(e)); return
            if u.path in ['/api/export','/api/export.csv']:
                s=io.StringIO(); w=csv.DictWriter(s,fieldnames=result['points'][0].keys());w.writeheader();w.writerows(result['points']);body=s.getvalue().encode();ctype='text/csv'
            else:body=json.dumps(result,allow_nan=False).encode();ctype='application/json'
            self.send_response(200);self.send_header('Content-Type',ctype);self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        elif u.path=='/api/health':
            body=json.dumps(dict(status='ok',actualRows=len(ACTUALS),forecastRows=len(FORECASTS))).encode()
            self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(body)
        else: super().do_GET()
if __name__=='__main__': ThreadingHTTPServer(('0.0.0.0',int(os.getenv('PORT','8000'))),Handler).serve_forever()
