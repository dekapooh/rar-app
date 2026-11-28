import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('system-master-sync-career-v6.js','utf8');const patch=source.slice(source.indexOf('  function patchHorse('),source.indexOf('  function cloneHorse('));
const c=vm.createContext({});vm.runInContext('function n(v){return Number(v);}\n'+patch+'this.patch=patchHorse;',c);
function row(a,b,t=500){return {no:1,horse_id:'SILK_2026_001',name:'TEST',potential:10,pedigree:5,dream:4,investment:3,total:22,career:{},suitability:{preferred_surfaces:['turf','dirt'],distance_min_m:1400,distance_max_m:2000,growth_type:'持続成長',individual_assessment:{schema_version:'rar-cohort85-source-estimate-v3',no:1,horse_id:'SILK_2026_001',profile_count:1000,sample_counts:{surface:{turf:t,dirt:1000-t},distance:{1600:1000},distance_by_surface:{turf:{1600:t},dirt:{1600:1000-t}}},source_distance_intervals:{turf:a,dirt:b},career1000_execution:{completed_careers:1000}}}};}
let h={};c.patch(h,row({lower_m:1500,upper_m:2000},{lower_m:1100,upper_m:1700}));assert.equal(h.distance,'芝1400〜2000m／ダート〜1800m');assert.equal(h.turf,'○');assert.equal(h.dirt,'○');
h={};c.patch(h,row({lower_m:800,upper_m:1200},{lower_m:1000,upper_m:1400},1000));assert.equal(h.distance,'芝〜1200m');
h={};c.patch(h,row({lower_m:2400,upper_m:3200},{lower_m:1600,upper_m:2400},1000));assert.equal(h.distance,'芝2400m〜');assert.equal(h.total,22);
console.log('SOURCE_CAREER_V3_BOTH_SURFACES_200M_OPEN_ENDPOINTS_AND_SCORES_PASS');

h={};const original=row({lower_m:1400,upper_m:2000},{lower_m:900,upper_m:1500},0);const before=JSON.stringify(original);c.patch(h,original);assert.equal(h.distance,'ダート〜1600m');assert.equal(JSON.stringify(original),before);assert.equal(h.total,22);
h={};c.patch(h,row({lower_m:1400,upper_m:2000},{lower_m:1000,upper_m:1500},0));assert.equal(h.distance,'ダート〜1600m');
h={};c.patch(h,row({lower_m:1200,upper_m:1600},{lower_m:1400,upper_m:2000},1000));assert.equal(h.distance,'芝1200〜1600m');
console.log('JRA1000_LOWER_ENDPOINT_HIDDEN_SPRINT_DISPLAY_AND_RAW_DATA_PRESERVED_PASS');

const html=fs.readFileSync('index.html','utf8');const distribution=html.slice(html.indexOf('function renderDistanceDistribution('),html.indexOf('function renderCareerEventDetails(',html.indexOf('function renderDistanceDistribution(')));
vm.runInContext('function escapeHTML(v){return String(v);};'+distribution+'this.distribution=renderDistanceDistribution;',c);
const inputs={individualAssessment:{profile_count:1000},distanceHistogramBySurface:{turf:{800:5,900:15,1000:20,1200:30},dirt:{800:8,1000:22,1400:35}},scoringDistance:'ダート〜1600m'};const raw=JSON.stringify(inputs);const rendered=c.distribution(inputs);
assert.match(rendered,/<td>〜1000m<\/td><td>40<\/td><td>30<\/td>/);assert.doesNotMatch(rendered,/<td>(800|900)m/);assert.equal(JSON.stringify(inputs),raw);
console.log('SHORT_DISTANCE_HISTOGRAM_GROUPS_PRESERVE_COUNTS_AND_ORIGINAL_BINS_PASS');

let female=row({lower_m:1500,upper_m:2100},{lower_m:1100,upper_m:1700},801);female.sex='牝';female.career.representative_targets=['皐月賞'];h={};c.patch(h,female);assert.equal(h.distance,'芝1400〜2200m');assert.equal(h.targets,'桜花賞・秋華賞');assert.ok(!h.targets.includes('皐月賞'));
let sprinter=row({lower_m:1400,upper_m:1900},{lower_m:1000,upper_m:1500},108);sprinter.sex='牡';sprinter.career.representative_targets=['フェブラリーS'];h={};c.patch(h,sprinter);assert.equal(h.targets,'JBCスプリント');assert.equal(h.distance,'ダート〜1600m');
const perfectFlute = {...sprinter, no:85, horse_id:'SILK_2026_085', suitability:structuredClone(sprinter.suitability)};
const perfectFluteAssessment = perfectFlute.suitability.individual_assessment;
Object.assign(perfectFluteAssessment, {no:85, horse_id:perfectFlute.horse_id});
h = {}; c.patch(h, perfectFlute);
assert.equal(h.distance, 'ダート〜1600m');
assert.equal(h.targets, 'フェブラリーS');
perfectFluteAssessment.source_distance_intervals.dirt.upper_m = 1400;
h = {}; c.patch(h, perfectFlute);
assert.equal(h.distance, 'ダート〜1400m');
assert.equal(h.targets, 'JBCスプリント');
let stayer=row({lower_m:2700,upper_m:3500},{lower_m:1700,upper_m:2500},1000);stayer.sex='牡';stayer.career.representative_targets=['菊花賞'];h={};c.patch(h,stayer);assert.equal(h.distance,'芝2400m〜');assert.equal(h.targets,'菊花賞');
for(const count of [0,333,334,399,400,500,600,601,666,667,1000]){h={};c.patch(h,row({lower_m:1400,upper_m:1800},{lower_m:1200,upper_m:1600},count));const grade=n=>n>=601?'◎':n>=334?'○':'△';assert.equal(h.turf,grade(count));assert.equal(h.dirt,grade(1000-count));assert.ok(!(h.turf==='◎'&&h.dirt==='◎'));}
let conflict=row({lower_m:2700,upper_m:3500},{lower_m:1000,upper_m:1500},1000);conflict.recorded_suitability={distance:'芝2700〜3500m',turf:'◎',dirt:'◎',targets:'フェブラリーS'};h={};c.patch(h,conflict);assert.equal(h.distance,'芝2400m〜');assert.equal(h.turf,'◎');assert.equal(h.dirt,'△');
const worker=fs.readFileSync('sw.js','utf8');const inject=worker.slice(worker.indexOf('const SYSTEM_MASTER_SCRIPT='),worker.indexOf('const RC66_BRAND_CSS='));const cache=vm.createContext({});vm.runInContext(inject+'this.inject=injectSystemMasterSync;',cache);const migrated=cache.inject('<body><script src="./system-master-sync-career-v2.js?v=old"></script></body>');assert.match(migrated,/system-master-sync-career-v6.js/);assert.doesNotMatch(migrated,/career-v2/);assert.equal((migrated.match(/system-master-sync/g)||[]).length,1);
console.log('FIVE_FIXES_FEMALE_CLASSICS_BAND_MATCH_601_BOUNDARY_LONG_DISPLAY_CACHED_HTML_UPGRADE_PASS');

const display = vm.createContext({});
const helpers = html.slice(html.indexOf('function suitabilityDistanceText('), html.indexOf('function effectiveRegisteredName('));
vm.runInContext(helpers + 'this.distanceText=suitabilityDistanceText;this.targetsText=suitabilityTargetsText;', display);
const dualSurface = row({lower_m:1400,upper_m:1800},{lower_m:1000,upper_m:1400},445);
const dualHorse = {};
c.patch(dualHorse, dualSurface);
assert.equal(display.distanceText(dualHorse), '芝1400〜1800m\nダート〜1400m');
assert.equal(display.distanceText({turf:'◯',dirt:'◎',distance:'芝・ダ1400〜1800m'}), '芝1400〜1800m\nダート1400〜1800m');
assert.equal(display.distanceText({turf:'△',dirt:'◎',distance:'ダート〜1600m'}), 'ダート〜1600m');
assert.equal(display.targetsText({sex:'牝馬',category:'牝馬クラシック～中距離',distance:'芝1500〜2100m',targets:'皐月賞'}), '桜花賞・秋華賞');
assert.equal(display.targetsText({sex:'牡',category:'クラシック～中距離',distance:'芝1500〜2100m',targets:'皐月賞'}), '皐月賞');

const longFemale = row({lower_m:2700,upper_m:3500},{lower_m:1200,upper_m:1600},1000);
longFemale.sex = '♀';
longFemale.suitability.category = '牝馬クラシック～中長距離';
longFemale.career.representative_targets = ['菊花賞'];
const longHorse = {};
c.patch(longHorse, longFemale);
assert.equal(longHorse.targets, 'オークス');
console.log('DEPLOYED_SYNC_DUAL_SURFACE_NEWLINES_AND_FEMALE_TARGETS_PASS');

const handlers = {};
const origin = 'https://rar.example';
const requests = [];
vm.runInNewContext(worker, {
  self: { location: { origin }, registration: { scope: `${origin}/` }, addEventListener(type, handler) { handlers[type] = handler; } },
  URL, Response, AbortController, setTimeout, clearTimeout,
  caches: {
    async match(_, {ignoreSearch}) { return ignoreSearch ? new Response('stale script') : undefined; },
    async open() { return { async put() {} }; },
  },
  async fetch(request, options) {
    requests.push({url:request.url, cache:options.cache});
    return new Response('updated script');
  },
});
const scriptUrl = `${origin}/system-master-sync-career-v6.js?v=february-target-20261128`;
let response;
handlers.fetch({request:{url:scriptUrl,method:'GET'},respondWith(value){response=value;}});
assert.equal(await (await response).text(), 'updated script');
assert.deepEqual(requests, [{url:scriptUrl,cache:'no-store'}]);
console.log('NEW_VERSIONED_SYNC_CANNOT_REUSE_OLD_QUERY_CACHE_PASS');
