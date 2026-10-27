"""Exercise the exact Vercel handler class on a local HTTP server."""
import unittest, threading, json, urllib.request, urllib.error, importlib.util
from http.server import ThreadingHTTPServer
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class HandlerTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  import sys
  sys.path.insert(0,str(ROOT))
  from api.analysis import handler
  cls.server=ThreadingHTTPServer(('127.0.0.1',0),handler)
  cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
  cls.base=f'http://127.0.0.1:{cls.server.server_port}'
 @classmethod
 def tearDownClass(cls):cls.server.shutdown();cls.server.server_close();cls.thread.join()
 def read(self,path):return urllib.request.urlopen(self.base+path)
 def test_health(self):
  with self.read('/api/health') as r:d=json.load(r)
  self.assertEqual(d['status'],'ok');self.assertEqual(d['forecastRows'],19272)
 def test_default_metrics(self):
  with self.read('/api/analysis?date=2026-01-15&cutoff=09:00') as r:d=json.load(r)
  self.assertEqual(d['metrics']['n'],24);self.assertEqual(d['metrics']['mae'],782.75)
 def test_csv(self):
  with self.read('/api/export?date=2026-01-15&cutoff=09:00') as r:text=r.read().decode()
  self.assertEqual(len(text.strip().splitlines()),25)
 def test_bad_date(self):
  with self.assertRaises(urllib.error.HTTPError) as e:self.read('/api/analysis?date=2026-02-01')
  self.assertEqual(e.exception.code,400)
 def test_bad_time(self):
  with self.assertRaises(urllib.error.HTTPError) as e:self.read('/api/analysis?date=2026-01-01&cutoff=77:00')
  self.assertEqual(e.exception.code,400)
 def test_adapter_class_consistency(self):
  from api.analysis import handler as a
  from api.health import handler as b
  from api.export import handler as c
  from backend.server import Handler
  self.assertTrue(all(issubclass(x,Handler) for x in [a,b,c]))
 def test_vercel_include_glob(self):
  d=json.loads((ROOT/'vercel.json').read_text());self.assertIsInstance(d['functions']['api/*.py']['includeFiles'],str)
if __name__=='__main__':unittest.main()
