from __future__ import annotations
import math, hashlib
from pathlib import Path
import numpy as np
import cv2

ZONE_SPEC={
 'F1': {'t':(-0.05,0.28),'z':(0.58,0.95)},
 'F2': {'t':(-0.05,0.32),'z':(0.32,0.58)},
 'T3': {'t':(0.40,0.68),'z':(0.38,0.82)},
 'R1': {'t':(0.68,1.12),'z':(0.62,0.98)},
 'R2': {'t':(0.68,1.12),'z':(0.42,0.62)},
 'R4': {'t':(0.72,1.10),'z':(0.22,0.42)},
}

def _runs(xs):
    if len(xs)==0:return []
    out=[]; st=pr=int(xs[0])
    for x in xs[1:]:
        x=int(x)
        if x>pr+1: out.append((st,pr)); st=x
        pr=x
    out.append((st,pr)); return out

def derive_frame(mask:np.ndarray, official_height_cm:float):
    m=mask.astype(bool); h,w=m.shape; ys,xs=np.where(m)
    xmin,xmax=int(xs.min()),int(xs.max()); ymin,ymax=int(ys.min()),int(ys.max()); bh=ymax-ymin+1
    top=np.full(w,np.nan); bottom=np.full(w,np.nan)
    for x in range(w):
        yy=np.where(m[:,x])[0]
        if len(yy): top[x]=yy.min(); bottom[x]=yy.max()
    sx=np.where(bottom>=ymax-0.035*bh)[0]
    groups=[g for g in _runs(sx) if g[1]-g[0]+1>=2]
    centers=np.array([(a+b)/2 for a,b in groups],float)
    if len(centers)<2: raise ValueError('insufficient hoof-support groups')
    order=np.argsort(centers); cs=centers[order]; cut=int(np.argmax(np.diff(cs)))
    left=[groups[order[i]] for i in range(cut+1)]; right=[groups[order[i]] for i in range(cut+1,len(order))]
    upper=ys<ymin+0.38*bh; facing='LEFT' if xs[upper].mean()<xs.mean() else 'RIGHT'
    fore=left if facing=='LEFT' else right; hind=right if facing=='LEFT' else left
    def ctr(gs):
        vals=[]
        for a,b in gs: vals.extend(range(a,b+1))
        return float(np.mean(vals))
    fx,hx=ctr(fore),ctr(hind)
    pts=[]
    for a,b in groups:
        for x in range(a,b+1): pts.append((x,bottom[x]))
    pts=np.asarray(pts,float); slope,inter=np.polyfit(pts[:,0],pts[:,1],1)
    body_len=abs(hx-fx)
    if facing=='LEFT': lo=int(fx-0.05*body_len); hi=int(fx+0.20*body_len)
    else: lo=int(fx-0.20*body_len); hi=int(fx+0.05*body_len)
    lo=max(xmin,lo); hi=min(xmax,hi); vr=np.arange(lo,hi+1); vr=vr[~np.isnan(top[vr])]
    sm=[]
    for x in vr:
        v=top[max(0,x-4):min(w,x+5)]; v=v[~np.isnan(v)]; sm.append(np.median(v))
    wx=int(vr[np.argmin(sm)]); wy=float(top[wx])
    d=abs(slope*wx-wy+inter)/math.sqrt(1+slope*slope)
    scale=float(official_height_cm/d)
    theta=math.atan(slope); cu,su=math.cos(theta),math.sin(theta)
    yy2,xx2=np.mgrid[0:h,0:w]
    u=xx2*cu+yy2*su
    v=(slope*xx2-yy2+inter)/math.sqrt(1+slope*slope)
    fy=slope*fx+inter; hy=slope*hx+inter
    uf=fx*cu+fy*su; uh=hx*cu+hy*su
    t=(u-uf)/(uh-uf); z=v/d
    return {'facing':facing,'fore_x':fx,'hind_x':hx,'ground_slope':float(slope),'ground_intercept':float(inter),'withers_x':wx,'withers_y':wy,'height_px':float(d),'scale_cm_px':scale,'t':t,'z':z,'u':u,'v':v}

def _solidity(sel):
    q=(sel.astype(np.uint8)*255)
    cs,_=cv2.findContours(q,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
    if not cs:return float('nan')
    area=sum(cv2.contourArea(c) for c in cs)
    pts=np.vstack(cs); hull=cv2.convexHull(pts); ha=cv2.contourArea(hull)
    return float(area/ha) if ha>0 else float('nan')

def _zone(mask,t,z,spec):
    (t0,t1),(z0,z1)=spec['t'],spec['z']
    return mask&(t>=t0)&(t<t1)&(z>=z0)&(z<z1)

def compute_metrics(mask:np.ndarray, official_height_cm:float):
    m=mask.astype(bool); f=derive_frame(m,official_height_cm); t,z,u=f['t'],f['z'],f['u']; s=f['scale_cm_px']
    out={k:v for k,v in f.items() if k not in ('t','z','u','v')}
    zones={name:_zone(m,t,z,spec) for name,spec in ZONE_SPEC.items()}
    for name,sel in zones.items():
        out[f'{name}_area_cm2eq']=float(sel.sum()*s*s)
        out[f'{name}_solidity']=_solidity(sel)
    sel=m&(t>=0.65)&(t<=1.12)&(z>=0.62)&(z<=0.85)
    vals=u[sel]
    out['R3_span_cm_eq']=float((vals.max()-vals.min())*s) if vals.size else float('nan')
    out['R3_outline_solidity']=_solidity(sel)
    def eff_width(z0,z1):
        sl=m&(t>=0.72)&(t<=1.10)&(z>=z0)&(z<z1)
        hp=(z1-z0)*f['height_px']
        return float(sl.sum()/hp) if hp>0 else float('nan')
    prox=eff_width(0.36,0.42); dist=eff_width(0.24,0.30)
    out['R4_prox_width_px_eq']=prox; out['R4_dist_width_px_eq']=dist; out['R4_taper_ratio']=float(dist/prox) if prox>0 else float('nan')
    band=m&(t>=0.34)&(t<=0.36)&(z>=0.28)&(z<=1.02)
    zv=z[band]
    out['T1_depth_cm_eq']=float((zv.max()-zv.min())*f['height_px']*s) if zv.size else float('nan')
    tb=np.linspace(.20,.65,61); pts=[]
    for a,b in zip(tb[:-1],tb[1:]):
        q=m&(t>=a)&(t<b)&(z>=.45)&(z<=1.05)
        if q.any(): pts.append(((a+b)/2,float(z[q].max())))
    if len(pts)>=10:
        pts=np.asarray(pts); coef=np.polyfit(pts[:,0],pts[:,1],1); pred=np.polyval(coef,pts[:,0]); rms=float(np.sqrt(np.mean((pts[:,1]-pred)**2)))
        out['T2_dorsal_rms_norm']=rms; out['T2_back_span_cm_eq']=float((.65-.20)*abs(f['hind_x']-f['fore_x'])*s)
    else:
        out['T2_dorsal_rms_norm']=float('nan'); out['T2_back_span_cm_eq']=float('nan')
    return out,zones
