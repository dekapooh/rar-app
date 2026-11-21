"""Read-only reference calculation using the unmodified existing v2 module.

Needs RAR checkout with v2 module/teacher assets from
d0693a2c2001b23617c2c678cb5a9f150b86df2e. Does not activate the model or rescore.
"""
import argparse
from dataclasses import asdict
import json
from pathlib import Path
import sys

p=argparse.ArgumentParser()
p.add_argument('--rar-root',type=Path,required=True)
p.add_argument('--dataset',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
args=p.parse_args()
sys.path.insert(0,str(args.rar_root.resolve()))
from tools.audit_silk2026_growth_teacher_20260925 import load_teacher_rows
from builder_runtime.suitability_frozen_v2 import cohort_features,fit_growth_model,predict_growth
teacher,labels,_=load_teacher_rows()
features=cohort_features(teacher)
model,_=fit_growth_model(features,labels)
assert model.loo_exact_rate>=.5 and model.loo_within_one_rate>=.9 and model.loo_mae<=.6
by={r['no']:r for r in json.loads(args.dataset.read_text())['records']}
facts=json.loads((args.rar_root/'builder_app/web/silk_2026_special_addendum_v1.json').read_text())['records']
target=[]
for f in facts:
    r=by[f['recruitment_number']]
    assert r['name']==f['display_name']
    target.append({'no':r['no'],'sire':f['sire'],'sex':f['sex'],'birth':f['birth_date'],
        'height':r['height'],'girth':r['chest'],'cannon':r['cannon'],'weight':r['weight'],
        'subitems':{k:r['small'][k] for k in ('scale_frame','rear','trunk','front')}})
result=predict_growth(model=model,target_features=cohort_features(target),teacher_features=features,teacher_legacy_labels=labels)
report={'model':asdict(model),'target_cohort_size':3,'target_features':target,'predictions':result,
 'status':'EXISTING_V2_REFERENCE_PREVIEW_NOT_APPLIED_TO_SCORES',
 'policy_commit':'d0693a2c2001b23617c2c678cb5a9f150b86df2e'}
args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('EXISTING_V2_REFERENCE=PASS; SCORE_WRITES=0; TARGET_COHORT=3')
