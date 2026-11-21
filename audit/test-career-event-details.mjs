import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const saved=JSON.parse(fs.readFileSync('audit/silk-2026-special-career-20261122.json','utf8'));
const index=fs.readFileSync('index.html','utf8');
const source=index.slice(index.indexOf('function renderCareerEventDetails('),index.indexOf('function renderInvestmentCareerSimulation('));
const context=vm.createContext({escapeHTML:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')});
vm.runInContext(source+'this.render=renderCareerEventDetails;',context);
let count=0;
for(const row of saved.records){
 for(const mode of ['middle','high']){
  const events=row.career['events_'+mode];
  const html=context.render({...row,careerDetails:row.career},mode);
  assert.equal((html.match(/<tr>/g)||[]).length,events.length+1);
  assert.ok(html.includes(row.name)&&html.includes('No.'+row.no));
  assert.ok(html.includes('保存順')&&html.includes('開催日順ではありません'));
  assert.ok(html.includes('1000回分の全レース履歴ではありません'));
  const sum=events.reduce((v,e)=>v+e.gross_prize_yen,0);
  assert.ok(Math.abs(sum-row.career[mode+'_prize_yen'])<1e-5);
  assert.ok(html.includes(Math.round(sum).toLocaleString('ja-JP')+'円'));
  const broken=JSON.parse(JSON.stringify(row.career));broken[mode+'_prize_yen']+=1;
  assert.ok(context.render({...row,careerDetails:broken},mode).includes('一致しません'));
  count+=events.length;
 }
}
assert.equal(count,105);
const [a,b,c]=saved.records;
assert.deepEqual(a.career.events_middle,b.career.events_middle);assert.deepEqual(a.career.events_middle,c.career.events_middle);
for(let i=0;i<22;i++)if(i!==2){assert.deepEqual(a.career.events_high[i],b.career.events_high[i]);assert.deepEqual(a.career.events_high[i],c.career.events_high[i]);}
assert.equal(Math.round(a.career.high_prize_yen-b.career.high_prize_yen),9000000);
assert.equal(Math.round(c.career.high_prize_yen-a.career.high_prize_yen),45000000);
assert.ok(context.render({...a,careerDetails:a.career},'high').includes('整数着順なし（賞金補間 1.9）'));
assert.ok(context.render({...b,careerDetails:b.career},'high').includes('2着'));
assert.ok(context.render({...c,careerDetails:c.career},'high').includes('整数着順なし（賞金補間 1.4）'));
assert.equal(context.render({no:59,name:'unrecorded'},'middle'),'');
assert.equal(saved.growth_reference.status,'EXISTING_V2_REFERENCE_PREVIEW_NOT_APPLIED_TO_SCORES');
assert.ok(saved.growth_reference.target_features.length===3);
const handlers={};
vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{URL,self:{location:{origin:'https://dekapooh.github.io'},registration:{scope:'https://dekapooh.github.io/rar-app/'},addEventListener:(name,fn)=>{handlers[name]=fn;},skipWaiting:()=>{} }});
for(const path of ['career-audit-20261122.html','audit/silk-2026-special-career-20261122.csv'])handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://dekapooh.github.io/rar-app/'+path},respondWith:()=>assert.fail('audit must bypass app-shell rewriting')});
console.log('STORED_CAREER_EVENTS=105_PASS; SIX_SUMS_PASS; COMPARISON_AND_INTERPOLATION_DISCLOSURE_PASS; WRONG_TOTAL_REJECTED');
