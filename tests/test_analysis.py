import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from analysis import evaluate
class EvaluationTests(unittest.TestCase):
 def actuals(self):return [dict(startTime='2026-01-02T00:00:00Z',generation=100,fuelType='WIND'),dict(startTime='2026-01-02T00:30:00Z',generation=200,fuelType='WIND')]
 def f(self,pub,value):return dict(startTime='2026-01-02T00:00:00Z',publishTime=pub,generation=value)
 def test_no_hindsight(self):
  r=evaluate(self.actuals(),[self.f('2026-01-01T08:00:00Z',120),self.f('2026-01-01T10:00:00Z',150)],'2026-01-01');self.assertEqual(r['points'][0]['forecast'],120);self.assertEqual(r['metrics']['mae'],30)
 def test_at_cutoff_inclusive(self):
  r=evaluate(self.actuals(),[self.f('2026-01-01T09:00:00Z',160)],'2026-01-01');self.assertEqual(r['metrics']['bias'],10)
 def test_missing_actual_not_zero(self):
  r=evaluate(self.actuals()[:1],[self.f('2026-01-01T08:00:00Z',120)],'2026-01-01');self.assertIsNone(r['metrics']['mae']);self.assertEqual(r['metrics']['n'],0)
 def test_conflict_not_silently_chosen(self):
  r=evaluate(self.actuals(),[self.f('2026-01-01T08:00:00Z',120),self.f('2026-01-01T08:00:00Z',130)],'2026-01-01');self.assertTrue(r['points'][0]['conflict']);self.assertEqual(r['metrics']['n'],0)
 def test_latest_revision(self):
  r=evaluate(self.actuals(),[self.f('2026-01-01T07:00:00Z',100),self.f('2026-01-01T08:00:00Z',140)],'2026-01-01');self.assertEqual(r['metrics']['mae'],10)
 def test_empty_forecasts(self):self.assertEqual(evaluate(self.actuals(),[],'2026-01-01')['missingForecast'],24)
 def test_february_delivery(self):self.assertEqual(evaluate([],[],'2026-01-31')['deliveryDate'],'2026-02-01')
 def test_reject_outside_scope(self):
  with self.assertRaises(ValueError):evaluate([],[],'2026-02-01')
 def test_zero_actual_valid(self):
  a=self.actuals()
  for row in a:row['generation']=0
  self.assertEqual(evaluate(a,[self.f('2026-01-01T08:00:00Z',20)],'2026-01-01')['metrics']['mae'],20)
if __name__=='__main__':unittest.main()
