(function(){
  "use strict";

  const DATA_URL="./rar-v2-summaries.json?v=20260914";

  function updateCategoryLabels(){
    if(typeof MAX==="object" && MAX){
      MAX.potential=30;
      MAX.pedigree=20;
      MAX.dream=20;
      MAX.roi=30; // legacy key retained; displayed as IV
    }
    document.querySelectorAll(".cat").forEach(input=>{
      const label=input.closest(".toggle");
      if(!label)return;
      const max=label.querySelector(".toggle-max");
      const name=label.querySelector(".toggle-main span");
      if(input.value==="dream" && max)max.textContent="/20";
      if(input.value==="roi"){
        if(max)max.textContent="/30";
        if(name)name.textContent="IV";
      }
    });
  }

  function overlayHorse(h,row){
    h.potential=Number(row.potential_official);
    h.pedigree=Number(row.pedigree_official);
    h.dream=Number(row.dream_official);
    h.roi=Number(row.investment_value_official);
    h.total=Number(row.rar_total_official);

    h.dreamMiddle=Number(row.dream_middle);
    h.dreamHighCareer=Number(row.dream_high_career);

    h.roiMiddle=Number(row.roi_middle);
    h.roiHighCareer=Number(row.roi_high_career);
    h.roiOfficial=Number(row.roi_official);

    h.roiMiddlePrizeYen=Number(row.roi_middle_prize_yen);
    h.roiHighCareerPrizeYen=Number(row.roi_high_career_prize_yen);
    h.roiOfficialPrizeYen=Number(row.roi_official_prize_yen);

    h.expectedPrize=h.roiOfficialPrizeYen/10000;
    h.returnRate=h.roiOfficial/100;

    h.rarScoreSpecId=row.rar_score_spec_id;
    h.investmentValueSpecId=row.investment_value_spec_id;
    h.investmentValueSpecRevision=row.investment_value_spec_revision;
    h.roiScenarioSwitchable=!!row.roi_scenario_switchable;
  }

  async function applyRarV2(){
    let response;
    try{
      response=await fetch(DATA_URL,{cache:"no-store"});
    }catch(err){
      console.info("RAR v2 overlay unavailable",err);
      return;
    }
    if(!response.ok)return;

    const rows=await response.json();
    if(!Array.isArray(rows)||rows.length===0)return;
    if(typeof HORSES==="undefined"||!Array.isArray(HORSES))return;

    const byNo=new Map(
      rows
        .filter(row=>Number.isInteger(Number(row.no)))
        .map(row=>[Number(row.no),row])
    );

    let applied=0;
    HORSES.forEach(h=>{
      const row=byNo.get(Number(h.no));
      if(!row)return;
      overlayHorse(h,row);
      applied++;
    });

    if(!applied)return;
    updateCategoryLabels();

    window.RAR_V2_OVERLAY={
      active:true,
      applied,
      total:HORSES.length,
      scoreArchitecture:"30+20+20+30",
      roiScenarios:["MIDDLE","HIGH_CAREER"]
    };

    if(typeof renderRanking==="function")renderRanking();
    if(typeof updateMyPage==="function")updateMyPage();
    if(currentHorse && typeof openDetail==="function"){
      const no=currentHorse.no;
      openDetail(no);
    }
  }

  window.applyRarV2=applyRarV2;
  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",applyRarV2,{once:true});
  }else{
    applyRarV2();
  }
})();
