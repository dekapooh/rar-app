(function(){
  "use strict";

  const SUMMARY_URL="./rar-v2-summaries.json";
  const POTENTIAL_URL="./silk_2026_potential_beta49_recovered_v1.json";
  const PEDIGREE_URL="./silk_2026_pedigree_v1.json";
  const FACTS_URL="./silk_2026_facts_v1.json";

  const RAR_SCORE_SPEC_ID="RAR_SCORE_ARCHITECTURE_FROZEN_20260914";
  const DREAM_SPEC_ID="RAR_DREAM_FROZEN_FINAL_20260914";
  const IV_SPEC_ID="RAR_INVESTMENT_VALUE_FROZEN_20260914";
  const ROI_HOLD_SPEC_ID="RAR_ROI_PRIZE_GENERATOR_CONFIG_20260914";

  const MIDDLE_Q=[45,47.5,52.5,55,57.5,60,62.5,65,67.5,70];
  const HIGH_Q=[99,99.1,99.2,99.3,99.4,99.5,99.6,99.7,99.8,99.9];
  const BASELINE=[
    [0,48],
    [3,22],
    [6,15],
    [9,10],
    [12,1.7503],
    [14,1.2497],
    [15,0.8923],
    [16,0.5077],
    [17,0.2889],
    [18,0.1644],
    [19,0.0935],
    [20,0.0532]
  ];

  function isFiniteNumber(v){
    return v!==null && v!=="" && Number.isFinite(Number(v));
  }

  function fieldIndex(fields){
    return Object.fromEntries(fields.map((name,index)=>[name,index]));
  }

  function baselineBands(){
    let low=0;
    const bands=BASELINE.map(([anchor,share])=>{
      const high=low+share;
      const out={anchor,low,high};
      low=high;
      return out;
    });
    if(Math.abs(low-100)>1e-6){
      throw new Error("RAR Career baseline must sum to 100");
    }
    return bands;
  }

  const BANDS=baselineBands();

  function adjustedCareerPercentile(rawQ,potential,pedigree){
    const p=Math.max(0,Math.min(30,Number(potential)));
    const d=Math.max(0,Math.min(20,Number(pedigree)));
    const q=Math.max(0,Math.min(100,Number(rawQ)));
    const C=20+2*p;
    const warped=q<=50
      ? q*(C/50)
      : C+(q-50)*((100-C)/50);
    const L=(C/2)*(d/20);
    return L+(100-L)*(warped/100);
  }

  function resolveAnchor(percentile){
    const p=Math.max(0,Math.min(100,Number(percentile)));
    for(let i=0;i<BANDS.length;i++){
      const b=BANDS[i];
      const last=i===BANDS.length-1;
      if((b.low<=p && p<b.high)||(last && p===100)) return b.anchor;
    }
    return BANDS[BANDS.length-1].anchor;
  }

  function mean(values){
    return values.reduce((a,b)=>a+b,0)/values.length;
  }

  function buildDreamRows(potentialDoc,pedigreeDoc,factsDoc){
    const pI=fieldIndex(potentialDoc.fields||[]);
    const dI=fieldIndex(pedigreeDoc.fields||[]);
    const fI=fieldIndex(factsDoc.fields||[]);
    const potentialRows=potentialDoc.records||[];
    const pedigreeRows=pedigreeDoc.records||[];
    const factRows=factsDoc.records||[];

    if(potentialRows.length!==82 || pedigreeRows.length!==82 || factRows.length!==82){
      throw new Error("RAR v2 runtime join requires exactly 82 rows in all three sources");
    }

    const pMap=new Map(potentialRows.map(row=>[Number(row[pI.horse_no]),row]));
    const dMap=new Map(pedigreeRows.map(row=>[Number(row[dI.recruitment_no]),row]));
    const fMap=new Map(factRows.map(row=>[Number(row[fI.recruitment_number]),row]));

    return Array.from({length:82},(_,i)=>i+1).map(no=>{
      const pRow=pMap.get(no);
      const dRow=dMap.get(no);
      const fRow=fMap.get(no);
      if(!pRow || !dRow || !fRow) throw new Error("RAR v2 join missing recruitment no "+no);

      const potential=Number(pRow[pI.Potential_30_Beta48]);
      const pedigree=Number(dRow[dI.pedigree_20]);
      if(!Number.isFinite(potential) || potential<0 || potential>30){
        throw new Error("Invalid Potential for recruitment no "+no);
      }
      if(!Number.isFinite(pedigree) || pedigree<0 || pedigree>20){
        throw new Error("Invalid Pedigree for recruitment no "+no);
      }

      const middleAnchors=MIDDLE_Q.map(q=>resolveAnchor(adjustedCareerPercentile(q,potential,pedigree)));
      const highAnchors=HIGH_Q.map(q=>resolveAnchor(adjustedCareerPercentile(q,potential,pedigree)));
      const dreamMiddle=mean(middleAnchors);
      const dreamHigh=mean(highAnchors);
      const dreamOfficial=(dreamMiddle+dreamHigh)/2;

      return {
        no,
        horse_id:null,
        horse_id_status:"UNASSIGNED_NO_CANONICAL_ID_IN_CURRENT_SOURCE",
        display_name:fRow[fI.display_name],
        recruitment_total_yen:Number(fRow[fI.total_price_yen]),
        potential_official:potential,
        pedigree_official:pedigree,
        dream_middle:dreamMiddle,
        dream_high_career:dreamHigh,
        dream_official:dreamOfficial,
        dream_middle_anchors:middleAnchors,
        dream_high_career_anchors:highAnchors,
        roi_middle_prize_yen:null,
        roi_high_career_prize_yen:null,
        roi_official_prize_yen:null,
        roi_middle:null,
        roi_high_career:null,
        roi_official:null,
        investment_value_official:null,
        rar_subtotal_70:potential+pedigree+dreamOfficial,
        rar_total_official:null,
        roi_iv_status:"HOLD",
        rar_total_status:"HOLD_DEPENDENCY_IV",
        roi_hold_spec_id:ROI_HOLD_SPEC_ID,
        rar_score_spec_id:RAR_SCORE_SPEC_ID,
        dream_spec_id:DREAM_SPEC_ID,
        investment_value_spec_id:IV_SPEC_ID,
        investment_value_spec_revision:2,
        roi_scenario_architecture_switchable:true,
        roi_scenario_switchable:false
      };
    });
  }

  async function fetchJson(url){
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok) throw new Error(url+" -> HTTP "+response.status);
    return response.json();
  }

  function validateSummaryRows(rows){
    if(!Array.isArray(rows) || rows.length!==82) return false;
    const nos=rows.map(row=>Number(row.no));
    if(new Set(nos).size!==82) return false;
    for(let no=1;no<=82;no++) if(!nos.includes(no)) return false;
    return rows.every(row=>
      isFiniteNumber(row.potential_official)
      && Number(row.potential_official)>=0
      && Number(row.potential_official)<=30
      && isFiniteNumber(row.pedigree_official)
      && Number(row.pedigree_official)>=0
      && Number(row.pedigree_official)<=20
      && isFiniteNumber(row.dream_middle)
      && isFiniteNumber(row.dream_high_career)
      && isFiniteNumber(row.dream_official)
      && Math.abs(Number(row.dream_official)-((Number(row.dream_middle)+Number(row.dream_high_career))/2))<1e-9
    );
  }

  async function loadRows(){
    try{
      const rows=await fetchJson(SUMMARY_URL);
      if(validateSummaryRows(rows)) return {rows,source:"rar-v2-summaries.json"};
      console.warn("RAR v2 static summary failed contract validation; using deterministic fallback");
    }catch(err){
      console.info("RAR v2 static summary unavailable; using deterministic fallback",err);
    }

    const [potentialDoc,pedigreeDoc,factsDoc]=await Promise.all([
      fetchJson(POTENTIAL_URL),
      fetchJson(PEDIGREE_URL),
      fetchJson(FACTS_URL)
    ]);
    const rows=buildDreamRows(potentialDoc,pedigreeDoc,factsDoc);
    if(!validateSummaryRows(rows)) throw new Error("RAR v2 deterministic fallback failed validation");
    return {rows,source:"runtime_fallback"};
  }

  function setMetricTitle(id,title){
    const metric=document.getElementById(id)?.closest(".metric");
    const el=metric?.querySelector(".std-title");
    if(el) el.textContent=title;
  }

  function updateCategoryLabels(ivHold){
    if(typeof MAX==="object" && MAX){
      MAX.potential=30;
      MAX.pedigree=20;
      MAX.dream=20;
      MAX.roi=30;
    }

    document.querySelectorAll(".cat").forEach(input=>{
      const label=input.closest(".toggle");
      if(!label) return;
      const max=label.querySelector(".toggle-max");
      const name=label.querySelector(".toggle-main span");
      if(input.value==="dream" && max) max.textContent="/20";
      if(input.value==="roi"){
        if(max) max.textContent="/30";
        if(name) name.textContent="IV";
        if(ivHold){
          input.checked=false;
          input.disabled=true;
          label.classList.remove("selected");
          label.classList.add("rar-v2-iv-hold");
          label.title="ROI Prize Generator数値Config HOLD中";
        }
      }
    });

    setMetricTitle("dRoi","IV");
  }

  function ensureStyles(){
    if(document.getElementById("rarV2OverlayStyle")) return;
    const style=document.createElement("style");
    style.id="rarV2OverlayStyle";
    style.textContent=`
      .rar-v2-status{margin:0 0 12px;padding:9px 11px;border:1px solid #d9e2ec;border-radius:12px;background:#f8fafc;font-size:10px;line-height:1.55;color:#526173}
      .rar-v2-status b{color:#172033}
      .rar-v2-iv-hold{opacity:.55;cursor:not-allowed!important}
      .rar-v2-scenario-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0}
      .rar-v2-scenario-tabs button{border:1px solid #dbe4ee;background:#fff;border-radius:9px;padding:8px;font-size:11px;font-weight:800;color:#526173}
      .rar-v2-scenario-tabs button.active{background:#0f2f57;color:#fff;border-color:#0f2f57}
      .rar-v2-scenario-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      .rar-v2-scenario-grid .metric b{font-size:15px}
      .rar-v2-hold-value{color:#8a6500!important}
    `;
    document.head.appendChild(style);
  }

  function ensureStatusBanner(ivHold){
    ensureStyles();
    let el=document.getElementById("rarV2Status");
    if(!el){
      el=document.createElement("div");
      el.id="rarV2Status";
      el.className="rar-v2-status";
      const main=document.querySelector("main");
      if(main) main.prepend(el);
    }
    if(!el) return;
    el.innerHTML=ivHold
      ? "<b>RAR v2統合中：</b> Potential /30・Pedigree /20・Dream /20は新仕様。IV /30はPrize Generator数値Config HOLDのため未算出。総合表示は暫定 /70。"
      : "<b>RAR v2：</b> Potential /30・Pedigree /20・Dream /20・IV /30。";
  }

  function overlayHorse(h,row){
    h.potential=Number(row.potential_official);
    h.pedigree=Number(row.pedigree_official);
    h.dream=Number(row.dream_official);
    h.dreamMiddle=Number(row.dream_middle);
    h.dreamHighCareer=Number(row.dream_high_career);
    h.rarSubtotal70=Number(row.rar_subtotal_70);
    h.rarScoreSpecId=row.rar_score_spec_id;
    h.dreamSpecId=row.dream_spec_id;
    h.investmentValueSpecId=row.investment_value_spec_id;
    h.investmentValueSpecRevision=row.investment_value_spec_revision;

    const ivReady=row.roi_iv_status==="FROZEN_FINAL"
      && isFiniteNumber(row.investment_value_official)
      && isFiniteNumber(row.rar_total_official)
      && isFiniteNumber(row.roi_middle)
      && isFiniteNumber(row.roi_high_career)
      && isFiniteNumber(row.roi_official);

    if(ivReady){
      h.roi=Number(row.investment_value_official);
      h.total=Number(row.rar_total_official);
      h.roiMiddle=Number(row.roi_middle);
      h.roiHighCareer=Number(row.roi_high_career);
      h.roiOfficial=Number(row.roi_official);
      h.roiMiddlePrizeYen=Number(row.roi_middle_prize_yen);
      h.roiHighCareerPrizeYen=Number(row.roi_high_career_prize_yen);
      h.roiOfficialPrizeYen=Number(row.roi_official_prize_yen);
      h.expectedPrize=h.roiOfficialPrizeYen/10000;
      h.returnRate=h.roiOfficial/100;
      h.ivHold=false;
      h.rarTotalStatus="FROZEN_FINAL";
    }else{
      h.legacyRoi=h.roi;
      h.legacyTotal=h.total;
      h.roi=0;
      h.total=h.rarSubtotal70;
      h.roiMiddle=null;
      h.roiHighCareer=null;
      h.roiOfficial=null;
      h.roiMiddlePrizeYen=null;
      h.roiHighCareerPrizeYen=null;
      h.roiOfficialPrizeYen=null;
      h.expectedPrize=null;
      h.returnRate=null;
      h.ivHold=true;
      h.rarTotalStatus="HOLD_DEPENDENCY_IV";
    }
  }

  let activeScenario="middle";

  function formatDream(v){
    return isFiniteNumber(v)?Number(v).toFixed(1):"—";
  }

  function formatPrize(v){
    return isFiniteNumber(v)?Math.round(Number(v)).toLocaleString()+"円":"HOLD";
  }

  function formatRoi(v){
    return isFiniteNumber(v)?Number(v).toFixed(1)+"%":"HOLD";
  }

  function ensureScenarioCard(){
    let card=document.getElementById("rarV2ScenarioCard");
    if(card) return card;
    const official=document.getElementById("officialCard");
    if(!official) return null;

    card=document.createElement("div");
    card.id="rarV2ScenarioCard";
    card.className="card";
    card.innerHTML=`
      <h3>Dream / ROI Scenario <span class="plan-badge">RAR v2</span></h3>
      <div class="rar-v2-scenario-tabs">
        <button id="rarV2MiddleBtn" type="button">Middle</button>
        <button id="rarV2HighBtn" type="button">High Career</button>
      </div>
      <div class="rar-v2-scenario-grid">
        <div class="metric"><span>Dream</span><b id="rarV2ScenarioDream">—</b></div>
        <div class="metric"><span>生涯獲得賞金</span><b id="rarV2ScenarioPrize">—</b></div>
        <div class="metric"><span>ROI</span><b id="rarV2ScenarioRoi">—</b></div>
        <div class="metric"><span>Official賞金</span><b id="rarV2OfficialPrize">—</b></div>
      </div>
      <div id="rarV2ScenarioNote" class="note" style="margin-top:8px"></div>
    `;
    official.insertAdjacentElement("afterend",card);
    card.querySelector("#rarV2MiddleBtn")?.addEventListener("click",()=>{
      activeScenario="middle";
      decorateDetail(typeof currentHorse!=="undefined"?currentHorse:null);
    });
    card.querySelector("#rarV2HighBtn")?.addEventListener("click",()=>{
      activeScenario="high";
      decorateDetail(typeof currentHorse!=="undefined"?currentHorse:null);
    });
    return card;
  }

  function decorateDetail(h){
    if(!h) return;
    setMetricTitle("dRoi","IV");

    const dreamEl=document.getElementById("dDream");
    if(dreamEl && !dreamEl.textContent.includes("🔒")) dreamEl.textContent=formatDream(h.dream)+"/20";

    const roiEl=document.getElementById("dRoi");
    if(roiEl && !roiEl.textContent.includes("🔒")){
      roiEl.textContent=h.ivHold?"HOLD":Number(h.roi).toFixed(1)+"/30";
      roiEl.classList.toggle("rar-v2-hold-value",!!h.ivHold);
    }

    const totalEl=document.getElementById("dTotal");
    if(totalEl && !totalEl.textContent.includes("🔒")){
      totalEl.textContent=h.ivHold
        ? Number(h.rarSubtotal70).toFixed(1)+" /70（IV HOLD）"
        : Number(h.total).toFixed(1)+" /100";
    }

    const roiTools=document.getElementById("stdRoiTools");
    if(roiTools && h.ivHold) roiTools.style.display="none";
    const roiAfter=document.getElementById("dRoiAfter");
    if(roiAfter && h.ivHold) roiAfter.textContent="—";
    const roiAdj=document.getElementById("dRoiAdj");
    if(roiAdj && h.ivHold) roiAdj.textContent="";

    const card=ensureScenarioCard();
    if(!card) return;
    const middle=activeScenario==="middle";
    card.querySelector("#rarV2MiddleBtn")?.classList.toggle("active",middle);
    card.querySelector("#rarV2HighBtn")?.classList.toggle("active",!middle);

    const dream=middle?h.dreamMiddle:h.dreamHighCareer;
    const prize=middle?h.roiMiddlePrizeYen:h.roiHighCareerPrizeYen;
    const roi=middle?h.roiMiddle:h.roiHighCareer;

    const d=card.querySelector("#rarV2ScenarioDream");
    const p=card.querySelector("#rarV2ScenarioPrize");
    const r=card.querySelector("#rarV2ScenarioRoi");
    const o=card.querySelector("#rarV2OfficialPrize");
    const n=card.querySelector("#rarV2ScenarioNote");
    if(d) d.textContent=formatDream(dream)+"/20";
    if(p){p.textContent=formatPrize(prize);p.classList.toggle("rar-v2-hold-value",h.ivHold);}
    if(r){r.textContent=formatRoi(roi);r.classList.toggle("rar-v2-hold-value",h.ivHold);}
    if(o){o.textContent=formatPrize(h.roiOfficialPrizeYen);o.classList.toggle("rar-v2-hold-value",h.ivHold);}
    if(n) n.textContent=h.ivHold
      ? "DreamはFROZEN値。賞金・ROI・IVは数値ConfigがFROZEN_FINALになるまでfail-closed。"
      : "Official ROI = Middle / High Careerの2値中央値。";
  }

  function decorateRanking(){
    document.querySelectorAll(".rankrow").forEach(row=>{
      const noText=row.querySelector(".rank-info-no")?.textContent||"";
      const no=Number(noText.replace(/\D/g,""));
      const h=typeof HORSES!=="undefined"?HORSES.find(x=>Number(x.no)===no):null;
      const el=row.querySelector(".rank-info-official");
      if(!h || !el) return;
      el.textContent=h.ivHold
        ? "暫定 "+Number(h.rarSubtotal70).toFixed(1)+"/70"
        : "Official "+Number(h.total).toFixed(1)+"/100";
    });
  }

  function currentHorseForNo(no){
    if(typeof HORSES==="undefined" || !Array.isArray(HORSES)) return null;
    return HORSES.find(h=>Number(h.no)===Number(no))||null;
  }

  function enforceIvHoldControls(){
    const hold=typeof HORSES!=="undefined" && Array.isArray(HORSES) && HORSES.some(h=>h.ivHold);
    if(!hold) return;
    document.querySelectorAll('.cat[value="roi"],.base-cat[value="roi"]').forEach(input=>{
      input.checked=false;
      input.disabled=true;
      input.closest(".toggle,.base-toggle")?.classList.add("rar-v2-iv-hold");
    });
  }

  function decoratePremiumSmallOfficial(){
    const h=typeof currentHorse!=="undefined"?currentHorse:null;
    const list=document.getElementById("premiumSmallList");
    if(!h || !list) return;

    const titles=[...list.querySelectorAll(".small-group-title")];
    const roiTitle=titles.find(el=>el.textContent.trim()==="ROI" || el.textContent.trim()==="IV");
    if(roiTitle){
      let node=roiTitle;
      while(node){
        const next=node.nextSibling;
        node.remove();
        node=next;
      }
    }

    const title=document.createElement("div");
    title.className="small-group-title";
    title.textContent="IV";
    list.appendChild(title);

    const note=document.createElement("div");
    note.className="note";
    if(h.ivHold){
      note.textContent="IV /30：数値Config HOLD中。旧ROI Personal Pointは保存したまま、ランキング・Personal合計・操作から除外しています。";
      note.classList.add("rar-v2-hold-value");
    }else{
      note.textContent="IVは採点小項目を持たないため、大項目単位でPersonal調整。";
    }
    list.appendChild(note);
  }

  function decoratePersonalUi(){
    const h=typeof currentHorse!=="undefined"?currentHorse:null;
    if(!h) return;

    const dreamAfter=document.getElementById("dDreamAfter");
    if(dreamAfter && dreamAfter.textContent) dreamAfter.textContent=dreamAfter.textContent.replace(/\/25$/,"/20");

    if(h.ivHold){
      const roiSlot=document.getElementById("dRoiRankSlot");
      if(roiSlot) roiSlot.innerHTML="";
      const roiAfter=document.getElementById("dRoiAfter");
      if(roiAfter){roiAfter.style.display="none";roiAfter.textContent="";}
      const roiAdj=document.getElementById("dRoiAdj");
      if(roiAdj) roiAdj.textContent="";
      const roiTools=document.getElementById("stdRoiTools");
      if(roiTools) roiTools.style.display="none";
    }
    decoratePremiumSmallOfficial();
  }

  function wrapPersonalFunctions(){
    if(typeof window.effectivePersonalPoint==="function" && !window.effectivePersonalPoint.__rarV2Wrapped){
      const original=window.effectivePersonalPoint;
      const wrapped=function(no){
        let value=Number(original.apply(this,arguments)||0);
        const h=currentHorseForNo(no);
        if(h?.ivHold && (state?.plan==="standard" || state?.plan==="premium")){
          value-=Number((state?.categoryPoints?.[no]||{}).roi||0);
        }
        return value;
      };
      wrapped.__rarV2Wrapped=true;
      window.effectivePersonalPoint=wrapped;
    }

    if(typeof window.categoryPersonalPoint==="function" && !window.categoryPersonalPoint.__rarV2Wrapped){
      const original=window.categoryPersonalPoint;
      const wrapped=function(no,key){
        const h=currentHorseForNo(no);
        if(key==="roi" && h?.ivHold) return 0;
        return original.apply(this,arguments);
      };
      wrapped.__rarV2Wrapped=true;
      window.categoryPersonalPoint=wrapped;
    }

    if(typeof window.adjustCategoryPoint==="function" && !window.adjustCategoryPoint.__rarV2Wrapped){
      const original=window.adjustCategoryPoint;
      const wrapped=function(key){
        const h=typeof currentHorse!=="undefined"?currentHorse:null;
        if(key==="roi" && h?.ivHold) return;
        return original.apply(this,arguments);
      };
      wrapped.__rarV2Wrapped=true;
      window.adjustCategoryPoint=wrapped;
    }

    if(typeof window.renderPremiumSmallOfficial==="function" && !window.renderPremiumSmallOfficial.__rarV2Wrapped){
      const original=window.renderPremiumSmallOfficial;
      const wrapped=function(){
        const result=original.apply(this,arguments);
        decoratePremiumSmallOfficial();
        return result;
      };
      wrapped.__rarV2Wrapped=true;
      window.renderPremiumSmallOfficial=wrapped;
    }

    if(typeof window.renderPersonalPointUI==="function" && !window.renderPersonalPointUI.__rarV2Wrapped){
      const original=window.renderPersonalPointUI;
      const wrapped=function(){
        const result=original.apply(this,arguments);
        decoratePersonalUi();
        return result;
      };
      wrapped.__rarV2Wrapped=true;
      window.renderPersonalPointUI=wrapped;
    }

    for(const fnName of ["syncPlanLocks","applyRankBase"]){
      const fn=window[fnName];
      if(typeof fn==="function" && !fn.__rarV2Wrapped){
        const wrapped=function(){
          const result=fn.apply(this,arguments);
          enforceIvHoldControls();
          return result;
        };
        wrapped.__rarV2Wrapped=true;
        window[fnName]=wrapped;
      }
    }
  }

  function wrapRenderers(){
    if(typeof window.renderRanking==="function" && !window.renderRanking.__rarV2Wrapped){
      const original=window.renderRanking;
      const wrapped=function(){
        const result=original.apply(this,arguments);
        decorateRanking();
        return result;
      };
      wrapped.__rarV2Wrapped=true;
      window.renderRanking=wrapped;
    }

    if(typeof window.openHorse==="function" && !window.openHorse.__rarV2Wrapped){
      const original=window.openHorse;
      const wrapped=function(){
        const result=original.apply(this,arguments);
        decorateDetail(typeof currentHorse!=="undefined"?currentHorse:null);
        return result;
      };
      wrapped.__rarV2Wrapped=true;
      window.openHorse=wrapped;
    }
  }

  async function applyRarV2(){
    let rows;
    let source;
    try{
      const loaded=await loadRows();
      rows=loaded.rows;
      source=loaded.source;
    }catch(err){
      console.error("RAR v2 runtime source load failed",err);
      window.RAR_V2_OVERLAY={active:false,error:String(err)};
      return;
    }

    if(typeof HORSES==="undefined" || !Array.isArray(HORSES) || HORSES.length!==82){
      window.RAR_V2_OVERLAY={active:false,error:"HORSES must contain exactly 82 rows"};
      return;
    }

    const byNo=new Map(rows.map(row=>[Number(row.no),row]));
    let applied=0;
    HORSES.forEach(h=>{
      const row=byNo.get(Number(h.no));
      if(!row) return;
      overlayHorse(h,row);
      applied++;
    });

    if(applied!==82){
      window.RAR_V2_OVERLAY={active:false,error:"RAR v2 applied row count was "+applied};
      return;
    }

    const ivHold=HORSES.some(h=>h.ivHold);
    updateCategoryLabels(ivHold);
    ensureStatusBanner(ivHold);
    wrapPersonalFunctions();
    wrapRenderers();
    enforceIvHoldControls();

    window.RAR_V2_SUMMARIES=rows;
    window.RAR_V2_OVERLAY={
      active:true,
      applied,
      total:HORSES.length,
      scoreArchitecture:"30+20+20+30",
      currentRankingMax:ivHold?70:100,
      ivStatus:ivHold?"HOLD":"FROZEN_FINAL",
      dreamSpecId:DREAM_SPEC_ID,
      scoreSpecId:RAR_SCORE_SPEC_ID,
      roiHoldSpecId:ivHold?ROI_HOLD_SPEC_ID:null,
      roiScenarios:["MIDDLE","HIGH_CAREER"],
      source
    };

    if(typeof window.renderRanking==="function") window.renderRanking();
    if(typeof window.renderSearch==="function") window.renderSearch();
    if(typeof window.updateMyPage==="function") window.updateMyPage();
    if(typeof currentHorse!=="undefined" && currentHorse){
      if(typeof window.renderPersonalPointUI==="function") window.renderPersonalPointUI();
      decorateDetail(currentHorse);
    }
  }

  window.applyRarV2=applyRarV2;
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",applyRarV2,{once:true});
  }else{
    applyRarV2();
  }
})();
