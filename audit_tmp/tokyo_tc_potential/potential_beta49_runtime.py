"""CLPP Beta4.9 scoring runtime for a canonical horse image/mask route.

Recovered from CLPP_BETA49_ENGINE_RECOVERY_PACKAGE. Frozen thresholds and model
identity are unchanged. Mask R-CNN weight is SHA256-verified before use.
Arbitrary crops never become Official unless caller supplies validated Q8 status.
"""
from __future__ import annotations
import hashlib,json
from pathlib import Path
from typing import Any
import numpy as np
from clpp_beta4_metric_engine_v02 import compute_metrics,derive_frame

WEIGHT_FILENAME='maskrcnn_resnet50_fpn_v2_coco-73cbd019.pth'
WEIGHT_SHA256='73cbd0190fcbe3ba339921fbce2c3a0b6bb9126c9a133c85e43a2a8e060a109e'
WEIGHT_URL='https://download.pytorch.org/models/maskrcnn_resnet50_fpn_v2_coco-73cbd019.pth'
MASK_THRESHOLD=.5
HERE=Path(__file__).resolve().parent; BOUNDARY_PATH=HERE/'clpp_beta49_boundaries.json'

def sha256_file(path):
 h=hashlib.sha256()
 with open(path,'rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
 return h.hexdigest()

def verify_weight(path):
 path=Path(path)
 if not path.exists(): raise FileNotFoundError(f'Mask R-CNN weight missing: {path}')
 if sha256_file(path)!=WEIGHT_SHA256: raise ValueError('Mask R-CNN weight SHA256 mismatch')

def build_model(weight_path):
 verify_weight(weight_path)
 import torch
 from torchvision.models.detection import maskrcnn_resnet50_fpn_v2,MaskRCNN_ResNet50_FPN_V2_Weights
 weights=MaskRCNN_ResNet50_FPN_V2_Weights.COCO_V1; horse_idx=weights.meta['categories'].index('horse')
 model=maskrcnn_resnet50_fpn_v2(weights=None,weights_backbone=None)
 model.load_state_dict(torch.load(weight_path,map_location='cpu',weights_only=True)); model.eval(); torch.set_num_threads(1)
 return model,horse_idx

def infer_horse_mask(model,horse_idx,image):
 import torch
 from torchvision.transforms.functional import pil_to_tensor
 t=pil_to_tensor(image).float()/255
 with torch.inference_mode(): out=model([t])[0]
 labels=out['labels'].numpy(); scores=out['scores'].numpy(); idx=np.where(labels==horse_idx)[0]
 if not len(idx): return None,None
 i=idx[np.argmax(scores[idx])]; return out['masks'][i,0].numpy()>=MASK_THRESHOLD,float(scores[i])

def _repaired(mask,height):
 f=derive_frame(mask,height);m=mask.astype(bool);t,z,u=f['t'],f['z'],f['u'];s=f['scale_cm_px'];bins=np.linspace(-.05,1.15,241);rows=[]
 for a,b in zip(bins[:-1],bins[1:]):
  q=m&(t>=a)&(t<b)&(z>=.40)&(z<=1.10)
  if q.any(): rows.append(((a+b)/2,float(np.quantile(z[q],.995))))
 arr=np.array(rows);rear=arr[(arr[:,0]>=.52)&(arr[:,0]<=.90)];zz=rear[:,1];sm=np.array([np.median(zz[max(0,i-2):min(len(zz),i+3)]) for i in range(len(zz))]);mx=sm.max();cand=np.where(sm>=mx-.006)[0];ci=int(round(cand.mean()));ct=float(rear[ci,0]);posts=[]
 for a,b in zip(np.linspace(.46,.72,14)[:-1],np.linspace(.46,.72,14)[1:]):
  q=m&(z>=a)&(z<b)&(t>=.72)&(t<=1.18)
  if q.any(): posts.append(float(np.quantile(t[q],.985)))
 bt=float(np.median(posts));wt=float(t[int(round(f['withers_y'])),int(round(f['withers_x']))]);vals=m&(z>=0)&(z<=1.2);coef=np.polyfit(t[vals].ravel(),u[vals].ravel(),1)
 return {'R3_rear_AP_span_cm_eq':abs(np.polyval(coef,bt)-np.polyval(coef,ct))*s,'T2_visible_dorsal_span_cm_eq':abs(np.polyval(coef,ct)-np.polyval(coef,wt))*s,'croup_t':ct,'buttock_t':bt,'withers_t':wt}

def _r4_widths(mask,height):
 f=derive_frame(mask,height);m=mask.astype(bool);t,z=f['t'],f['z'];s=f['scale_cm_px'];hp=f['height_px'];out=[]
 for z0,z1 in [(.22,.26),(.26,.30),(.30,.34),(.34,.38),(.38,.42)]:
  q=m&(t>=.72)&(t<=1.10)&(z>=z0)&(z<z1);out.append(float(q.sum()/((z1-z0)*hp)*s))
 return out

def _t2_residual(mask,height):
 f=derive_frame(mask,height);m=mask.astype(bool);t,z=f['t'],f['z'];vals=[]
 for a,b in zip([.20,.28,.37,.46,.55],[.28,.37,.46,.55,.65]):
  q=m&(t>=a)&(t<b)&(z>=.45)&(z<=1.05);vals.append(float(np.median(z[q])) if q.any() else np.nan)
 chord=np.linspace(vals[0],vals[-1],5);return float(np.nanmax(np.abs(np.array(vals)-chord)))

def _p3(x,c): return 0 if x<c[0] else 1 if x<c[1] else 2 if x<c[2] else 3
def sc1(h): return 0 if h<152 else .5 if h<154 else 1 if h<156 else 1.5 if h<158 else 2 if h<160 else 2.5 if h<162 else 3
def sc2(c): return 0 if c<19.5 else 1 if c<20 else 1.5 if c<20.5 else 2 if c<21 else 3

def score_mask(mask:np.ndarray,*,height_cm:float,girth_cm:float,cannon_cm:float,detection_score:float|None=None,q8_status:str='REVIEW')->dict[str,Any]:
 B=json.loads(BOUNDARY_PATH.read_text(encoding='utf-8'))['boundaries'];met,_=compute_metrics(mask,height_cm);rep=_repaired(mask,height_cm);widths=_r4_widths(mask,height_cm);resid=_t2_residual(mask,height_cm);hp=met['height_px'];q7='PASS' if hp>=280 else 'REVIEW' if hp>=250 else 'FAIL';pts={}
 for k in ['R1','R2','T3','F1','F2']:
  s=_p3(float(met[f'{k}_area_cm2eq']),B[k]['cuts']);sol=float(met[f'{k}_solidity'])
  if sol<.70:s=min(s,0)
  elif sol<.80:s=min(s,1)
  pts[k]=s
 r3=0 if rep['R3_rear_AP_span_cm_eq']<32 else 1 if rep['R3_rear_AP_span_cm_eq']<38 else 2;minw=min(widths);step=max(abs(widths[i+1]-widths[i]) for i in range(4));r4=2 if minw>=18 and step<=4.5 else 1 if minw>=15 and step<=6 else 0;t1=0 if girth_cm<170 else 1 if girth_cm<175 else 2 if girth_cm<180 else 3;t2=0 if resid>.030 else 2 if resid<=.020 and rep['T2_visible_dorsal_span_cm_eq']<=98 else 1;rear=pts['R1']+pts['R2']+r3+r4;trunk=t1+t2+pts['T3'];front=pts['F1']+pts['F2'];scale=sc1(height_cm)+sc2(cannon_cm);route='BETA_OFFICIAL' if q7=='PASS' and q8_status=='PASS' else 'REVIEW'
 return {'spec_version':'RAR Potential Ver.4.4 Beta / CLPP Beta4.9','status':'CONFIRMED' if route=='BETA_OFFICIAL' else 'REVIEW','total':scale+rear+trunk+front,'subitems':{'scale_frame':scale,'rear':rear,'trunk':trunk,'front':front},'terminal':{'SC1':sc1(height_cm),'SC2':sc2(cannon_cm),'R1-G':pts['R1'],'R2-G':pts['R2'],'R3':r3,'R4':r4,'T1':t1,'T2':t2,'T3-G':pts['T3'],'F1-G':pts['F1'],'F2-G':pts['F2']},'qa':{'Q7':q7,'Q8':q8_status,'route':route,'detection_score':detection_score},'geometry':{**{k:v for k,v in met.items() if not isinstance(v,np.ndarray)},**rep,'T2_profile_max_abs_residual':resid,**{f'R4P_W{i+1}_cm_eq':v for i,v in enumerate(widths)}}}

def score_image(image,*,height_cm,girth_cm,cannon_cm,model,horse_idx,q8_status='REVIEW'):
 mask,det=infer_horse_mask(model,horse_idx,image)
 if mask is None:return {'spec_version':'RAR Potential Ver.4.4 Beta / CLPP Beta4.9','status':'REVIEW','total':None,'qa':{'route':'FAIL_NO_HORSE','Q8':q8_status}}
 return score_mask(mask,height_cm=height_cm,girth_cm=girth_cm,cannon_cm=cannon_cm,detection_score=det,q8_status=q8_status)
