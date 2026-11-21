"""Reproduce current Career metadata using the existing RAR checkout, read-only.

Needs canonical RAR engine and Objective v1 sire evidence from recovery commit
496727e589d571b9232f29316857d4c9b9c50f27. Never uses legacy display as model input.
No Potential/image inference, Firebase calls, score updates or consumer transfers.
"""
import argparse
import json
from pathlib import Path
import sys

parser=argparse.ArgumentParser()
parser.add_argument('--rar-root',type=Path,required=True)
parser.add_argument('--dataset-json',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
sys.path.insert(0,str(args.rar_root.resolve()))
from engine.calibration.suitability_sire_year_reference import score_sire_for_dataset
from builder_app.python.auto_score import auto_score_horse
from builder_runtime.career_consumer_details import from_auto_score
from builder_runtime.incremental_frozen_record_builder import _SIRE_ALIASES,_canonical_digest

live=json.loads(args.dataset_json.read_text())
assert live['dataset_key']=='2026:silk'
rows=[]
for r in live['records']:
    if r['no']>82: continue
    suit=score_sire_for_dataset(sire=_SIRE_ALIASES.get(r['sire'],r['sire']),dataset_key='2026:silk')
    score=auto_score_horse({'horse_id':r['horse_id'],'name':r['name'],
        'potential':r['potential'],'pedigree':r['pedigree'],
        'recruitment_total_yen':r['total_price_yen'],'suitability':{**suit,'sex':r['sex']}})
    pairs=[(r['total'],score['official']['rar_total']),
           (r['dream'],score['dream_official']),
           (r['investment'],score['official']['investment_value'])]
    for mode in ('middle','high'):
        pairs.extend([(r['career'][mode+'_starts'],score[mode]['starts']),
            (r['career'][mode+'_prize_yen'],score[mode]['prize_yen']),
            (r['career']['roi_'+mode+'_pct'],score[mode]['roi']),
            (r['scenarios']['dream'][mode],score['dream_'+mode]),
            (r['scenarios']['investment'][mode],score[mode]['investment_value'])])
    assert all(abs(a-b)<1e-6 for a,b in pairs),r['no']
    details=from_auto_score(score,suit)
    details['replayed_event_sha256']=_canonical_digest({
        'middle':details.pop('events_middle'),'high':details.pop('events_high')})
    rows.append({'no':r['no'],'horse_id':r['horse_id'],
        'source_submission_id':r['source_submission_id'],'name':r['name'],
        'sire':r['sire'],'sex':r['sex'],
        'score_binding':{k:r[k] for k in ('potential','pedigree','dream','investment','total')},
        'scenarios_binding':r['scenarios'],'career_binding':r['career'],
        'suitability':suit,'career_details':details})
assert len(rows)==82 and {r['no'] for r in rows}==set(range(1,83))
manifest={'schema_version':'rar-audited-career-display-v1','dataset_key':'2026:silk',
    'status':'REPLAY_MATCHED_DISPLAY_ONLY',
    'source_baseline_version_id':'977cd338fa5585bb2c9332af45eb0683627ce140323a4d1412d509d00e850e3b',
    'score_data_changed':False,'replay_code_commit':'dd9ccde140472775e0633ddd17a8c91c6cc923fd',
    'objective_policy_commit':'496727e589d571b9232f29316857d4c9b9c50f27','records':rows}
args.output.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('CURRENT_SCORE_AND_CAREER_REPLAY=82/82_PASS; consumer writes=0')
