const CACHE_NAME="rar-rc66-public-beta-v6";
const APP_SHELL=[
  "./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./hero-rc65.png","./brand-horse-rc65.png"
];
const RC66_BRAND_CSS=`
/* RAR RC66 PUBLIC BETA FINAL */
.brand{gap:6px!important;}
.brand::before{content:""!important;display:inline-block!important;width:32px!important;height:28px!important;flex:0 0 32px!important;border:0!important;border-radius:0!important;transform:none!important;box-sizing:border-box!important;background:url("./brand-horse-rc65.png") center/contain no-repeat!important;}
.home-hero-natural{background-image:url("./hero-rc65.png")!important;background-position:center!important;background-size:cover!important;background-repeat:no-repeat!important;}
.feedback-card{background:linear-gradient(145deg,#fff,#f9fcfa)!important;border-color:#d9e6df!important;}
.feedback-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.feedback-card-copy{margin-top:7px;font-size:10px;line-height:1.65;color:#6f7f77;}
.feedback-form-btn{display:flex;align-items:center;justify-content:center;width:100%;margin-top:10px;padding:11px 12px;border-radius:12px;background:#0f4a35;color:#fff!important;text-decoration:none!important;font-size:11px;font-weight:900;letter-spacing:.01em;box-shadow:0 3px 8px rgba(15,74,53,.14);}
.feedback-form-btn:active{transform:translateY(1px)}
`;
function makeRC66(html){
  let out=html
    .replaceAll("β Ver.1.0 RC64","β Ver.1.0 RC66")
    .replaceAll("RAR β Ver.1.0 RC64","RAR β Ver.1.0 RC66")
    .replaceAll("β Ver.1.0 RC65","β Ver.1.0 RC66")
    .replaceAll("RAR β Ver.1.0 RC65","RAR β Ver.1.0 RC66");

  // Public Beta: STANDARD相当を固定して無料開放。
  out=out
    .replace('<div class="plan-card"><span class="plan-badge">BETA ACCESS</span> <b id="currentPlanName">PREMIUM</b>','<div class="plan-card"><span class="plan-badge">PUBLIC BETA</span> <b id="currentPlanName">STANDARD</b>')
    .replace('<select id="betaPlanSelect" class="search-filter" style="margin-left:8px;max-width:135px">','<select id="betaPlanSelect" class="search-filter" style="display:none;margin-left:8px;max-width:135px" aria-hidden="true">')
    .replace('β版は全機能開放。正式版はFREE＝Official TOP10内、LIGHT＝Official TOP30内でカスタム、STANDARD以上＝全82頭','Public Beta期間中はSTANDARD相当の機能を無料開放しています。PREMIUM機能は正式版に向けた予定機能です。')
    .replace('if(!state.points || typeof state.points!=="object") state.points={};','state.plan="standard";\nif(!state.points || typeof state.points!=="object") state.points={};')
    .replace('state.plan="premium"; // BETA: 全機能確認用。正式リリース時は契約プラン判定へ戻す','state.plan="standard"; // PUBLIC BETA: STANDARD相当を無料開放');

  // 2026-08-28 募集状況: No.13/22/38/51のみ募集中、その他78頭は満口。
  // HORSES配列のOfficial採点・順位・Personalデータ構造には触れず、fullフラグだけを更新。
  out=out.replace(/"full":false/g,'"full":true');
  out=out.replace(/("no":(?:13|22|38|51),(?:(?!\},\{"no":).)*?"full":)true/g,'$1false');

  // Public Beta利用条件・問い合わせ先を確定。
  out=out.replace(
    '<details class="public-info-details" style="margin-top:10px">\n    <summary><b>利用規約・お問い合わせ</b></summary>\n    <div class="note" style="margin-top:8px">正式公開前に運営者情報・問い合わせ先・利用規約・料金条件を確定し、この画面から確認できるようにします。</div>\n  </details>',
    `<details class="public-info-details" style="margin-top:10px">
    <summary><b>RAR Public Beta 利用条件</b></summary>
    <div class="note" style="margin-top:8px;line-height:1.7">
      RAR Public Betaは正式公開前の試用版です。Public Beta期間中は無料で利用でき、アカウント登録・ログイン・招待コードは不要です。<br><br>
      β版のため、不具合・表示崩れ・予期しない動作が発生する場合があります。機能・仕様・表示内容は予告なく変更される場合があります。<br><br>
      RARの評価・順位・分析内容は、将来の競走成績、賞金、出資成果を保証するものではありません。最終的な出資判断は利用者ご自身で行ってください。<br><br>
      Personal Point・お気に入り・メモ等のPersonalデータは現在この端末内に保存されます。端末変更、ブラウザデータ削除、アプリ削除等によりデータが失われる可能性があります。必要に応じてバックアップ機能をご利用ください。<br><br>
      正式版へのデータ引き継ぎは現時点では保証していません。Public Betaの終了時期および正式版の公開時期は未定です。
    </div>
  </details>
  <details class="public-info-details" style="margin-top:10px">
    <summary><b>お問い合わせ</b></summary>
    <div class="note" style="margin-top:8px;line-height:1.7">不具合・表示の問題・使いにくい点・改善要望・その他Public Betaに関するお問い合わせは、下の「お問い合わせ・不具合・改善要望」から専用フォームへお送りください。</div>
  </details>`
  );

  if(!out.includes('id="publicBetaFeedbackCard"')){
    out=out.replace('<div class="card" id="recoveryGuideCard">',`<div class="card feedback-card" id="publicBetaFeedbackCard">
  <div class="feedback-card-head"><div><h3 style="margin:0">お問い合わせ・不具合・改善要望</h3><div class="note" style="margin-top:3px">RAR Public Beta フィードバック</div></div><span class="local-save-badge">FEEDBACK</span></div>
  <div class="feedback-card-copy">不具合・表示の問題・使いにくい点・改善してほしい点・その他Public Betaに関するお問い合わせがありましたら、専用フォームからお知らせください。</div>
  <a class="feedback-form-btn" href="https://forms.gle/hPBRuoabfCfbDczq5" target="_blank" rel="noopener noreferrer">お問い合わせ・不具合・改善要望を送る</a>
</div>
<div class="card" id="recoveryGuideCard">`);
  }else{
    out=out
      .replace('<h3 style="margin:0">不具合・改善要望</h3>','<h3 style="margin:0">お問い合わせ・不具合・改善要望</h3>')
      .replace('不具合・表示の問題・使いにくい点・改善してほしい点がありましたら、専用フォームからお知らせください。','不具合・表示の問題・使いにくい点・改善してほしい点・その他Public Betaに関するお問い合わせがありましたら、専用フォームからお知らせください。')
      .replace('>不具合・改善要望を送る</a>','>お問い合わせ・不具合・改善要望を送る</a>');
  }

  const cleanup=`
/* RC66 Public Beta user-facing cleanup */
#betaTestCard,#betaStatusCard,#planSpecCard{display:none!important;}
#betaPlanSelect{display:none!important;}
`;
  if(out.includes("</style>")) out=out.replace("</style>",RC66_BRAND_CSS+cleanup+"\n</style>");
  else if(out.includes("</head>")) out=out.replace("</head>","<style>"+RC66_BRAND_CSS+cleanup+"</style></head>");
  return out;
}
self.addEventListener("install",event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE_NAME);await Promise.allSettled(APP_SHELL.map(url=>cache.add(url)));})());self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const req=event.request; const url=new URL(req.url);
  if(req.mode==="navigate" || url.pathname.endsWith("/index.html")){
    event.respondWith((async()=>{try{const network=await fetch(req,{cache:"no-store"});if(!network.ok) throw new Error("HTTP "+network.status);const raw=await network.text();const rc66=makeRC66(raw);const headers=new Headers(network.headers);headers.set("content-type","text/html; charset=utf-8");const response=new Response(rc66,{status:network.status,statusText:network.statusText,headers});const cache=await caches.open(CACHE_NAME);cache.put("./index.html",response.clone()).catch(()=>{});return response;}catch(e){return (await caches.match("./index.html")) || new Response("Offline",{status:503,headers:{"content-type":"text/plain; charset=utf-8"}});}})());return;
  }
  if(url.origin===self.location.origin){event.respondWith((async()=>{const cached=await caches.match(req);if(cached) return cached;try{const response=await fetch(req);if(response && response.ok){const cache=await caches.open(CACHE_NAME);cache.put(req,response.clone()).catch(()=>{});}return response;}catch{return new Response("",{status:504});}})());}
});
