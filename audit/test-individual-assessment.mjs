import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const sync=fs.readFileSync('system-master-sync.js','utf8');
const patch=sync.slice(sync.indexOf('  function patchHorse('),sync.indexOf('  function cloneHorse('));
const context=vm.createContext({});
vm.runInContext('function n(x){if(!Number.isFinite(Number(x)))throw Error("numeric");return Number(x)}\n'+patch+'\nthis.patchHorse=patchHorse;',context);
const row={no:99,name:'架空テストの25',recruitment_name:'架空テストの25',registered_name:'架空テストの25',potential:17,pedigree:6.5,dream:10.5,investment:17.4,total:51.4,officialRank:1,
  small:{scale_frame:2,rear:6,trunk:5,front:4,mother:0,sibling:0,sibling_winup:0,nicks:6.5},
  suitability:{preferred_surfaces:['dirt'],distance_min_m:1400,distance_max_m:1800,growth_type:'unknown',target_races:[]},
  career:{details_version:'CAREER_CONSUMER_DETAILS_V1_20261121',growth_status:'NOT_INFERRED_OBJECTIVE_V1',category_code:'G1_JPN1',representative_targets:['テスト代表レース']}};
const h={};context.patchHorse(h,row);
assert.equal(h.registeredNameOfficial,'');
assert.equal(h.name,row.name);
assert.equal(h.distance,'ダ1400～1800m');
assert.equal(h.dirt,'◎');assert.equal(h.turf,'主適性外');
assert.equal(h.growth,'未判定（Objective v1では推定なし）');
assert.equal(h.category,'ダ・GⅠ／JpnⅠ（High）');
assert.equal(h.targets,'テスト代表レース');
assert.equal(h.total,row.total);
assert.equal(Object.values(row.small).reduce((a,b)=>a+b,0),row.potential+row.pedigree);
assert.equal(h.small.mother,0);assert.equal(h.small.nicks,6.5);
const genuine={};context.patchHorse(genuine,{...row,registered_name:'正式なテスト名'});
assert.equal(genuine.registeredNameOfficial,'正式なテスト名');
const legacy={growth:'既存の成長値',category:'既存カテゴリ',targets:'既存狙い'};
context.patchHorse(legacy,{...row,registered_name:'',career:{}});
assert.equal(legacy.growth,'既存の成長値');assert.equal(legacy.targets,'既存狙い');
const sw=fs.readFileSync('sw.js','utf8');
const transforms=sw.slice(0,sw.indexOf('self.addEventListener("install"'));
const swContext=vm.createContext({});vm.runInContext(transforms,swContext);
const index=fs.readFileSync('index.html','utf8');
const publicHtml=swContext.makeRC66(index), adminHtml=swContext.makeAdminRC66(index);
for(const html of [publicHtml,adminHtml])assert.equal((html.match(/<script\b[^>]*src=["'][^"']*system-master-sync[^"']*["']/g)||[]).length,1,'SW must not inject a second runtime');
const initContext=vm.createContext({window:{__RAR_CAREER_SYNC_STARTED__:true}});
vm.runInContext(sync,initContext); // duplicate loads must exit before DOM/fetch work
assert.ok(publicHtml.includes('state.plan="standard"; // PUBLIC BETA'));
assert.ok(adminHtml.includes('state.plan="premium"; // BETA'));
assert.ok(adminHtml.includes('id="premiumSmallOfficial"'));
assert.ok(adminHtml.includes('ADMIN / INTERNAL'));
assert.ok(!adminHtml.includes('state.plan="standard"; // PUBLIC BETA'));
assert.equal(fs.readFileSync('system-master-sync-career-v5.js','utf8'),sync,'versioned and canonical sync code must match');
const manifest=JSON.parse(fs.readFileSync('audit/silk-2026-career-display-v1.json','utf8'));
assert.deepEqual(JSON.parse(fs.readFileSync('audit/silk-2026-career-sources-v2.json','utf8')),manifest);
assert.ok(sync.includes("fetch('./audit/silk-2026-career-sources-v2.json'"),'a new sidecar pathname must bypass cached older audit data');
assert.equal(manifest.records.length,82);
const overlay=sync.slice(sync.indexOf('  function auditedDisplayRecord('),sync.indexOf('  function loadLastDatasetKey('));
const overlayContext=vm.createContext({manifest});
vm.runInContext('let auditedCareerDisplay=this.manifest;\n'+overlay+'\nthis.overlay=auditedDisplayRecord;',overlayContext);
for(const audit of manifest.records){
  const source={no:audit.no,horse_id:audit.horse_id,source_submission_id:audit.source_submission_id,
    name:audit.name,sire:audit.sire,sex:audit.sex,...audit.score_binding,scenarios:audit.scenarios_binding,career:audit.career_binding};
  const before=JSON.stringify(source);
  const display=overlayContext.overlay(source,'2026:silk');
  for(const key of ['potential','pedigree','dream','investment','total'])assert.equal(display[key],source[key]);
  assert.equal(display.display_origin,'AUDITED_CURRENT_CAREER');
  assert.equal(display.suitability.growth_type,'unknown');
  assert.equal(JSON.stringify(source),before,'overlay must not mutate published records');
  for(const changed of [{...source,total:source.total+1},{...source,horse_id:'other'},
    {...source,source_submission_id:'other'},
    {...source,scenarios:{...source.scenarios,dream:{...source.scenarios.dream,high:0}}},
    {...source,career:{...source.career,middle_starts:999}}]){
    assert.equal(overlayContext.overlay(changed,'2026:silk'),changed,'changed source cannot reuse audit');
  }
  assert.equal(overlayContext.overlay(source,'2025:silk'),source,'never cross dataset');
}
const step=manifest.records.find(r=>r.no===59);
assert.equal(step.suitability.distance_min_m,1400);assert.equal(step.suitability.distance_max_m,1800);
assert.deepEqual(step.career_details.representative_targets,['フェブラリーS']);
const stepSource={no:59,officialRank:3,horse_id:step.horse_id,source_submission_id:step.source_submission_id,name:step.name,sire:step.sire,sex:step.sex,...step.score_binding,scenarios:step.scenarios_binding,career:step.career_binding};
const restored={};context.patchHorse(restored,overlayContext.overlay(stepSource,'2026:silk'));
assert.equal(restored.targets,'羽田盃・東京ダービー・JDC・チャンピオンズC・フェブラリーS');
assert.equal(restored.growth,'持続成長');assert.equal(restored.distance,'ダ1600～2000m');
assert.equal(restored.scoringSuitability.targets,'フェブラリーS');
assert.equal(restored.recordedCareer.middle_starts,14);assert.equal(restored.recordedCareer.high_starts,23);
assert.equal(restored.total,step.score_binding.total,'recorded route cannot replace current score');
const perfect={};context.patchHorse(perfect,{...row,no:85,name:'パーフェクトフルートの25'});
assert.equal(perfect.recordedCareer,null);assert.equal(perfect.recordedSuitability,null);
assert.ok(!perfect.targets.includes('羽田盃'),'No.85 cannot inherit No.59 route');
const renderSource=index.slice(index.indexOf('function renderInvestmentCareerSimulation('),index.indexOf('const fmt1=',index.indexOf('function renderInvestmentCareerSimulation(')));
const renderContext=vm.createContext({CAREER_META:{59:{surface:'dirt',middleStarts:13,highStarts:22},85:{surface:'dirt',middleStarts:13,highStarts:22}},careerSurfaceLabel:()=> 'ダート',fmtPrizeYen:v=>String(v),fmt1:v=>Number(v).toFixed(1),ivFromRoiPct:v=>v,escapeHTML:s=>s,renderCareerEventDetails:()=>''});
vm.runInContext(renderSource+'this.render=renderInvestmentCareerSimulation;',renderContext);
const renderedStep=renderContext.render({...restored,no:59});const renderedPerfect=renderContext.render({...perfect,no:85});
assert.ok(renderedStep.includes('原記録のCareer：No.59 ステップオブダンスの25'));
assert.ok(renderedStep.includes('Middle：14戦')&&renderedStep.includes('High：23戦'));
assert.ok(renderedStep.includes('13戦想定')&&renderedStep.includes('22戦想定'));
assert.ok(!renderedPerfect.includes('原記録のCareer')&&!renderedPerfect.includes('羽田盃'));
// Preserve the original static reference across dataset switches/repeated apply.
const applySource=sync.slice(sync.indexOf('  function applyDataset('),sync.indexOf('    HORSES.splice(',sync.indexOf('  function applyDataset(')));
const staticStep=JSON.parse(index.match(/const HORSES=(\[.*?\]);\n/s)[1]).find(h=>h.no===59);
const applyContext=vm.createContext({HORSES:[staticStep],staticHorseSnapshot:null,LEGACY_DATASET:{dataset_key:'2026:silk'},cloneHorse:v=>JSON.parse(JSON.stringify(v)),blankHorse:()=>({}),patchHorse:(h)=>Object.assign(h,{growth:'unknown',distance:'ダ1400～1800m'}),auditedDisplayRecord:r=>r,applyRegisteredNameOverride:()=>{},applyRecruitmentSnapshot:()=>{}});
vm.runInContext(applySource+'return nextHorses;} this.apply=applyDataset;',applyContext);
const once=applyContext.apply({dataset_key:'2026:silk',records:[{no:59}]});
assert.equal(once[0].legacySuitability.growth,'持続成長');
applyContext.staticHorseSnapshot=once;
const twice=applyContext.apply({dataset_key:'2026:silk',records:[{no:59}]});
assert.equal(twice[0].legacySuitability.growth,'持続成長');
assert.equal(twice[0].legacySuitability.distance,'ダ1600～2000m');
console.log('CAREER_UI_MAPPING_AND_EXISTING_PREMIUM_ADMIN=PASS (10 groups, 82 audited records, separate No.59/85 sources and current/recorded Career rendering)');

const actualTrace=JSON.parse(fs.readFileSync("audit/silk-2026-special-career-20261122.json","utf8")).records.find(r=>r.no===85);
const actualTraceHtml=renderContext.render({...perfect,...actualTrace,careerDetails:actualTrace.career});
assert.ok(actualTraceHtml.includes("career1000-review.html?no=85"));
assert.ok(!renderContext.render({...perfect,...actualTrace,careerDetails:{...actualTrace.career,evidence_hash:"other"}}).includes("career1000-review.html"));
assert.ok(!renderedStep.includes("career1000-review.html"));
console.log("CAREER1000_LINK_SOURCE_BINDING_PASS");

const estimated=JSON.parse(JSON.stringify(row));
estimated.horse_id='TEST_ONLY_99';
estimated.suitability.growth_display='持続成長（参照推定）';
estimated.suitability.individual_assessment={
  schema_version:'rar-reference82-individual-input-estimate-v1',no:99,horse_id:estimated.horse_id,
  profile_count:1000,sample_counts:{surface:{turf:421,dirt:579}}
};
const individual={};context.patchHorse(individual,estimated);
assert.equal(individual.turf,'○');
assert.equal(individual.dirt,'○');
assert.equal(individual.growth,'持続成長（参照推定）');
assert.equal(individual.total,row.total);
estimated.suitability.individual_assessment.no=83;
const swapped={};context.patchHorse(swapped,estimated);
assert.equal(swapped.individualAssessment,null);
assert.equal(swapped.turf,'主適性外');
assert.ok(index.includes('renderHorseSuitability(currentHorse)'));
assert.ok(index.includes('分布は勝率ではありません'));
assert.ok(index.includes('system-master-sync-career-v6.js?v=suitability-labels-20261128'));
assert.ok(fs.readFileSync('sw.js','utf8').includes('rar-rc71-suitability-labels-20261128-v68'));
console.log('INDIVIDUAL_ESTIMATE_RENDER_AND_LEGACY_PRESERVATION_PASS');
