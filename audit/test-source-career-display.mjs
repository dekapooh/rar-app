import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync('system-master-sync-career-v5.js','utf8');const patch=source.slice(source.indexOf('  function patchHorse('),source.indexOf('  function cloneHorse('));
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
