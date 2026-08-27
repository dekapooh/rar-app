const CACHE_NAME="rar-rc66-public-beta-v1";
const APP_SHELL=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./hero-rc65.png",
  "./brand-horse-rc65.png"
];

const RC66_BRAND_CSS=`
/* RAR RC66 PUBLIC BETA + RC65 FINAL BRANDING */
.brand{
  gap:6px!important;
}
.brand::before{
  content:""!important;
  display:inline-block!important;
  width:32px!important;
  height:28px!important;
  flex:0 0 32px!important;
  border:0!important;
  border-radius:0!important;
  transform:none!important;
  box-sizing:border-box!important;
  background:url("./brand-horse-rc65.png") center/contain no-repeat!important;
}
.home-hero-natural{
  background-image:url("./hero-rc65.png")!important;
  background-position:center!important;
  background-size:cover!important;
  background-repeat:no-repeat!important;
}
`;

function makeRC66(html){
  let out=html
    .replaceAll("β Ver.1.0 RC64","β Ver.1.0 RC66")
    .replaceAll("RAR β Ver.1.0 RC64","RAR β Ver.1.0 RC66")
    .replaceAll("β Ver.1.0 RC65","β Ver.1.0 RC66")
    .replaceAll("RAR β Ver.1.0 RC65","RAR β Ver.1.0 RC66");
  if(out.includes("</style>")){
    out=out.replace("</style>",RC66_BRAND_CSS+`\n
/* =========================================================
   RAR β Ver.1.0 RC66 — PUBLIC BETA
   Public-beta presentation only. RAR scoring/data formulas untouched.
   ========================================================= */
.rc66-about-card{
  margin-top:12px!important;border:1px solid #D7E5DD!important;
  background:linear-gradient(145deg,#FFFFFF,#F7FBF8)!important;
}
.rc66-about-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.rc66-about-head b{font-size:14px;color:#173E31}
.rc66-beta-badge{display:inline-block;padding:3px 8px;border-radius:999px;background:#0F4A35;color:#FFF;font-size:9px;font-weight:900;letter-spacing:.04em}
.rc66-about-links{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.rc66-about-link{border:1px solid #D4E1DA;border-radius:11px;background:#FFF;color:#174D37;padding:10px 8px;font-size:11px;font-weight:850;text-align:left}
.rc66-about-foot{margin-top:8px;font-size:9px;color:#829088}
.rc66-legal-overlay{position:fixed;inset:0;z-index:9999;background:rgba(7,35,25,.68);display:none;align-items:flex-end;justify-content:center}
.rc66-legal-overlay.open{display:flex}
.rc66-legal-sheet{width:min(520px,100%);max-height:88vh;background:#FFF;border-radius:20px 20px 0 0;padding:15px 15px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(0,0,0,.18);overflow:hidden}
.rc66-legal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #E2EAE5;padding-bottom:10px}
.rc66-legal-title{font-size:15px;font-weight:950;color:#103F2E}
.rc66-legal-close{width:36px;height:36px;border:1px solid #D7E2DC;border-radius:10px;background:#FFF;color:#174D37;font-size:20px}
.rc66-legal-body{white-space:pre-wrap;overflow:auto;max-height:calc(88vh - 80px);padding:13px 2px 8px;color:#344A40;font-size:12px;line-height:1.75}
`+"\n</style>");
  }else if(out.includes("</head>")){
    out=out.replace("</head>","<style>"+RC66_BRAND_CSS+`\n
/* =========================================================
   RAR β Ver.1.0 RC66 — PUBLIC BETA
   Public-beta presentation only. RAR scoring/data formulas untouched.
   ========================================================= */
.rc66-about-card{
  margin-top:12px!important;border:1px solid #D7E5DD!important;
  background:linear-gradient(145deg,#FFFFFF,#F7FBF8)!important;
}
.rc66-about-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.rc66-about-head b{font-size:14px;color:#173E31}
.rc66-beta-badge{display:inline-block;padding:3px 8px;border-radius:999px;background:#0F4A35;color:#FFF;font-size:9px;font-weight:900;letter-spacing:.04em}
.rc66-about-links{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.rc66-about-link{border:1px solid #D4E1DA;border-radius:11px;background:#FFF;color:#174D37;padding:10px 8px;font-size:11px;font-weight:850;text-align:left}
.rc66-about-foot{margin-top:8px;font-size:9px;color:#829088}
.rc66-legal-overlay{position:fixed;inset:0;z-index:9999;background:rgba(7,35,25,.68);display:none;align-items:flex-end;justify-content:center}
.rc66-legal-overlay.open{display:flex}
.rc66-legal-sheet{width:min(520px,100%);max-height:88vh;background:#FFF;border-radius:20px 20px 0 0;padding:15px 15px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(0,0,0,.18);overflow:hidden}
.rc66-legal-head{display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid #E2EAE5;padding-bottom:10px}
.rc66-legal-title{font-size:15px;font-weight:950;color:#103F2E}
.rc66-legal-close{width:36px;height:36px;border:1px solid #D7E2DC;border-radius:10px;background:#FFF;color:#174D37;font-size:20px}
.rc66-legal-body{white-space:pre-wrap;overflow:auto;max-height:calc(88vh - 80px);padding:13px 2px 8px;color:#344A40;font-size:12px;line-height:1.75}
`+"</style></head>");
  }

  if(out.includes("</body>")){
    out=out.replace("</body>",`
<script id="rarRc66PublicBeta">
(()=>{
  const DOCS={"beta": "RAR Public Betaについて\n\n現在のRARは、正式版公開に向けたPublic Beta版です。\n\nPublic Beta期間中は、STANDARD相当の機能を無料でご利用いただけます。\n\n実際の募集でRARを使っていただきながら、不具合や使い勝手、必要な機能などを検証し、正式版の改善につなげていきます。\n\nβ版のため、予告なく機能・デザイン・仕様等を変更する場合があります。\n\nPersonalデータは原則として端末内に保存されます。端末変更やブラウザデータの削除等によってデータが失われる可能性があるため、必要に応じてバックアップを行ってください。\n\nβ版の保存データについて、正式版への完全な引継ぎは現時点では保証していません。\n\nRARの評価は将来の競走成績や出資成果を保証するものではありません。最終的な出資判断は、クラブ公式情報等をご確認のうえ、ご自身の判断でお願いいたします。", "terms": "RAR 利用規約\n\n1. 本サービスについて\nRAR（Racing Analysis Rating、以下「本サービス」）は、競走馬・募集馬に関する情報や独自評価等を提供し、利用者の募集馬選びをサポートすることを目的としています。\n\n2. 利用について\n利用者は、本規約および本サービス上に掲載する注意事項に同意したうえで本サービスを利用するものとします。Public Beta期間中は無料で利用できます。\n\n3. 評価・掲載情報について\nRARによる評価、ランキング、コメント、適性その他の掲載情報は、募集時点等で確認可能な情報をもとに作成した独自評価です。将来の競走成績、獲得賞金、回収率その他の成果を保証するものではありません。\n利用者は、各一口馬主クラブ等が提供する最新の公式情報を確認したうえで、自らの判断と責任において出資判断等を行うものとします。\n\n4. Personal機能について\nPersonal Point、お気に入り、メモ、出資馬その他のPersonal機能に保存された情報は、Public Beta版では原則として利用者の端末内に保存されます。\n端末変更、アプリ・ブラウザデータの削除、不具合その他の事情によりデータが失われる可能性があります。必要に応じて利用者自身でバックアップを行ってください。\n\n5. 禁止事項\n利用者は、本サービスの運営を妨害する行為、不正アクセス、第三者の権利を侵害する行為、RARの評価データ・文章・デザイン等を無断で複製して自己のサービスとして公開・販売する行為、法令または公序良俗に反する行為、その他RAR運営者が不適切と判断する行為を行ってはなりません。\n\n6. 知的財産\n本サービス独自の評価体系、文章、デザイン、ロゴ、キャラクターその他RARが制作したコンテンツに関する権利は、RAR運営者または正当な権利者に帰属します。第三者から提供・公開される情報、名称、写真その他のコンテンツについては、それぞれの権利者に権利が帰属します。\n\n7. サービスの変更・停止\nPublic Beta期間中を含め、本サービスの内容・機能・仕様を変更、追加または停止する場合があります。\n\n8. 免責\n本サービスの利用によって生じた損害については、法令上認められる範囲においてRAR運営者は責任を負わないものとします。詳細は「RAR評価・利用に関する免責事項」に定めます。\n\n9. 規約の変更\n必要に応じて本規約を変更する場合があります。重要な変更については、本サービスまたはRARの公式発信媒体等でお知らせします。\n\n制定：2026年8月27日", "privacy": "RAR プライバシーポリシー\n\nRAR（Racing Analysis Rating、以下「本サービス」）では、利用者のプライバシーを尊重し、利用情報を適切に取り扱います。\n\n1. 端末内に保存される情報\n本サービスでは、Personal Point、お気に入り、最終候補、除外馬、出資馬、正式馬名、Personal Memo、ランキング表示設定、LOCAL IDその他の利用設定を利用者の端末内に保存する場合があります。\n\n現行のPublic Beta版では、これらのPersonalデータをRAR運営者が独自のサーバーへ送信・収集する仕組みは設けていません。\n\n2. バックアップについて\n利用者自身の操作によりPersonalデータのバックアップファイルを作成し、復元する機能を提供する場合があります。バックアップファイルの保存・管理は利用者自身で行うものとします。\n端末の故障、ブラウザデータの削除、アプリの削除、仕様変更その他の事情により、保存データが失われる可能性があります。\n\n3. 外部サービスについて\n本サービスは、Webアプリの配信等に外部サービスを利用する場合があります。これらのサービス提供者により、IPアドレスその他の通常のアクセス情報が、そのサービスの方針に基づいて処理される場合があります。\n\n4. アクセス解析等について\n現行のPublic Beta版では、RAR運営者による独自のアクセス解析・広告トラッキングを目的とした仕組みは導入していません。今後これらを導入する場合は、必要に応じて本ポリシーを改定します。\n\n5. 本ポリシーの変更\n本サービスの機能追加、正式版への移行、利用する外部サービスの変更等に伴い、本ポリシーを変更する場合があります。重要な変更がある場合は、本サービスまたはRARの公式発信媒体等を通じてお知らせします。\n\n制定：2026年8月27日", "disclaimer": "RAR評価・利用に関する免責事項\n\nRAR（Racing Analysis Rating）は、募集時点で確認できる情報等をもとに、募集馬選びの参考となる評価・情報を提供するサービスです。\n\nRARによる評価、ランキング、コメント、適性、期待値その他の情報は、将来の競走成績、勝利、重賞・GⅠ等への出走または勝利、獲得賞金、募集価格に対する回収率、その他の出資成果を保証するものではありません。\n\nまた、本サービスで提供する情報は、特定の競走馬への出資、金融商品その他の取引を勧誘または推奨することを目的としたものではありません。\n\n一口馬主クラブへの出資その他の判断は、各クラブが提供する最新の公式情報・募集条件等をご確認のうえ、利用者自身の判断と責任において行ってください。\n\nRARの評価と実際の競走結果が異なる場合があります。\n\n本サービスの情報を利用したこと、または利用できなかったことによって生じた損失等について、法令上認められる範囲においてRAR運営者は責任を負わないものとします。\n\nPublic Beta期間中は、機能・デザイン・評価表示・保存方法その他の仕様を変更する場合があります。また、不具合、表示上の問題、保存データの消失等が発生する可能性があります。Public Beta版で保存されたデータについて、正式版への完全な引継ぎは現時点では保証していません。"};

  function forceStandardBeta(){
    try{
      if(typeof state!=="undefined"){
        state.plan="standard";
        localStorage.setItem("rarBetaState",JSON.stringify(state));
      }
      const sel=document.getElementById("betaPlanSelect");
      if(sel){
        sel.value="standard";
        sel.disabled=true;
        sel.style.display="none";
      }
      const name=document.getElementById("currentPlanName");
      if(name)name.textContent="STANDARD相当｜無料開放中";

      const planCard=name?.closest(".plan-card");
      if(planCard){
        const badge=planCard.querySelector(".plan-badge");
        if(badge)badge.textContent="PUBLIC BETA";
        const notes=planCard.querySelectorAll(".note");
        if(notes[0])notes[0].textContent="Build: β Ver.1.0 RC66";
        if(notes[1])notes[1].textContent="Public Beta期間中はSTANDARD相当の機能を無料開放しています。PREMIUM機能は正式版に向けた予定機能です。";
      }

      if(typeof applyRankBase==="function")applyRankBase();
      if(typeof syncBaseControls==="function")syncBaseControls();
      if(typeof syncPlanLocks==="function")syncPlanLocks();
      if(typeof syncPriceFilterUI==="function")syncPriceFilterUI();
      if(typeof renderRanking==="function")renderRanking();
      if(typeof renderSearch==="function")renderSearch();
      if(typeof updateMyPage==="function")updateMyPage();
      if(typeof currentHorse!=="undefined" && currentHorse && typeof renderPersonalPointUI==="function")renderPersonalPointUI();
    }catch(e){console.error("RC66 standard beta setup failed",e);}
  }

  function installLegalUI(){
    if(document.getElementById("rc66AboutCard"))return;
    const mypage=document.getElementById("mypage");
    if(!mypage)return;

    const card=document.createElement("div");
    card.id="rc66AboutCard";
    card.className="card rc66-about-card";
    card.innerHTML=\`
      <div class="rc66-about-head"><b>RARについて</b><span class="rc66-beta-badge">PUBLIC BETA</span></div>
      <div class="rc66-about-links">
        <button class="rc66-about-link" data-doc="beta">Public Betaについて</button>
        <button class="rc66-about-link" data-doc="terms">利用規約</button>
        <button class="rc66-about-link" data-doc="privacy">プライバシーポリシー</button>
        <button class="rc66-about-link" data-doc="disclaimer">免責事項</button>
      </div>
      <div class="rc66-about-foot">RAR β Ver.1.0 RC66</div>\`;
    mypage.appendChild(card);

    const overlay=document.createElement("div");
    overlay.id="rc66LegalOverlay";
    overlay.className="rc66-legal-overlay";
    overlay.innerHTML=\`<div class="rc66-legal-sheet" role="dialog" aria-modal="true">
      <div class="rc66-legal-head"><div id="rc66LegalTitle" class="rc66-legal-title">RARについて</div><button id="rc66LegalClose" class="rc66-legal-close" aria-label="閉じる">×</button></div>
      <div id="rc66LegalBody" class="rc66-legal-body"></div>
    </div>\`;
    document.body.appendChild(overlay);

    const titles={beta:"Public Betaについて",terms:"利用規約",privacy:"プライバシーポリシー",disclaimer:"免責事項"};
    card.querySelectorAll("[data-doc]").forEach(btn=>btn.addEventListener("click",()=>{
      const key=btn.dataset.doc;
      document.getElementById("rc66LegalTitle").textContent=titles[key]||"RARについて";
      document.getElementById("rc66LegalBody").textContent=DOCS[key]||"";
      overlay.classList.add("open");
    }));
    const close=()=>overlay.classList.remove("open");
    document.getElementById("rc66LegalClose").addEventListener("click",close);
    overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
  }

  const init=()=>{forceStandardBeta();installLegalUI();};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
</script>
</body>`);
  }
  return out;
}

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.allSettled(APP_SHELL.map(url=>cache.add(url)));
  })());
  self.skipWaiting();
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;

  const req=event.request;
  const url=new URL(req.url);

  if(req.mode==="navigate" || url.pathname.endsWith("/index.html")){
    event.respondWith((async()=>{
      try{
        const network=await fetch(req,{cache:"no-store"});
        if(!network.ok) throw new Error("HTTP "+network.status);
        const raw=await network.text();
        const rc66=makeRC66(raw);
        const headers=new Headers(network.headers);
        headers.set("content-type","text/html; charset=utf-8");
        const response=new Response(rc66,{
          status:network.status,
          statusText:network.statusText,
          headers
        });
        const cache=await caches.open(CACHE_NAME);
        cache.put("./index.html",response.clone()).catch(()=>{});
        return response;
      }catch(e){
        return (await caches.match("./index.html")) ||
          new Response("Offline",{status:503,headers:{"content-type":"text/plain; charset=utf-8"}});
      }
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      if(cached) return cached;
      try{
        const response=await fetch(req);
        if(response && response.ok){
          const cache=await caches.open(CACHE_NAME);
          cache.put(req,response.clone()).catch(()=>{});
        }
        return response;
      }catch{
        return new Response("",{status:504});
      }
    })());
  }
});
