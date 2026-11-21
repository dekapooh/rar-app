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
assert.equal(h.growth,'未判定（現行仕様は成長推定なし）');
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
assert.ok(publicHtml.includes('state.plan="standard"; // PUBLIC BETA'));
assert.ok(adminHtml.includes('state.plan="premium"; // BETA'));
assert.ok(adminHtml.includes('id="premiumSmallOfficial"'));
assert.ok(adminHtml.includes('ADMIN / INTERNAL'));
assert.ok(!adminHtml.includes('state.plan="standard"; // PUBLIC BETA'));
console.log('CAREER_UI_MAPPING_AND_EXISTING_PREMIUM_ADMIN=PASS (4 groups)');
