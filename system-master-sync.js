(() => {
  'use strict';

  const API_URL = 'https://rar-project-5a27e.web.app/v1/consumer-data/current';
  const EXPECTED_SCHEMA = 'rar-app-data-v3';
  const EXPECTED_RELEASE = 'FROZEN_100_20260914';
  const EXPECTED_COUNT = 82;

  function ensureStatusEl() {
    let el = document.getElementById('rarSystemMasterUpdatedAt');
    if (el) return el;
    const header = document.querySelector('header');
    if (!header) return null;
    if (getComputedStyle(header).position === 'static') header.style.position = 'relative';
    el = document.createElement('div');
    el.id = 'rarSystemMasterUpdatedAt';
    el.setAttribute('aria-live', 'polite');
    Object.assign(el.style, {
      position: 'absolute',
      right: '12px',
      top: '11px',
      maxWidth: '46%',
      textAlign: 'right',
      fontSize: '9px',
      lineHeight: '1.35',
      fontWeight: '800',
      color: '#315d4c',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    });
    el.textContent = '最終更新 確認中…';
    header.appendChild(el);
    return el;
  }

  function setStatus(text, state = 'ok') {
    const el = ensureStatusEl();
    if (!el) return;
    el.textContent = text;
    el.dataset.state = state;
    el.style.color = state === 'error' ? '#9b2c2c' : state === 'fallback' ? '#7c5b00' : '#315d4c';
  }

  function n(value, name) {
    const x = Number(value);
    if (!Number.isFinite(x)) throw new Error(`${name} must be finite`);
    return x;
  }

  function validateDataset(data) {
    if (!data || typeof data !== 'object') throw new Error('dataset missing');
    if (data.schema_version !== EXPECTED_SCHEMA) throw new Error(`schema mismatch: ${data.schema_version}`);
    if (data.release_class !== EXPECTED_RELEASE) throw new Error(`release mismatch: ${data.release_class}`);
    if (Number(data.record_count) !== EXPECTED_COUNT) throw new Error('record_count must be 82');
    if (!Array.isArray(data.records) || data.records.length !== EXPECTED_COUNT) throw new Error('records must be 82');

    const nos = new Set();
    const ranks = new Set();
    for (const r of data.records) {
      const no = n(r.no, 'no');
      const rank = n(r.officialRank, `No.${no}.officialRank`);
      if (!Number.isInteger(no) || no < 1 || no > 82 || nos.has(no)) throw new Error(`invalid/duplicate no: ${no}`);
      if (!Number.isInteger(rank) || rank < 1 || rank > 82 || ranks.has(rank)) throw new Error(`invalid/duplicate rank: ${rank}`);
      nos.add(no); ranks.add(rank);
      const potential = n(r.potential, `No.${no}.potential`);
      const pedigree = n(r.pedigree, `No.${no}.pedigree`);
      const dream = n(r.dream, `No.${no}.dream`);
      const investment = n(r.investment, `No.${no}.investment`);
      const total = n(r.total, `No.${no}.total`);
      if (Math.abs((potential + pedigree + dream + investment) - total) > 1e-6) {
        throw new Error(`No.${no} total identity mismatch`);
      }
      if (r.manager_status !== 'FROZEN_FINAL') throw new Error(`No.${no} is not FROZEN_FINAL`);
    }
    for (let i = 1; i <= 82; i++) {
      if (!nos.has(i) || !ranks.has(i)) throw new Error('No/rank set must be 1..82');
    }
    if (!data.transferred_at) throw new Error('transferred_at missing');
    return data;
  }

  function patchHorse(h, r) {
    const career = r.career || {};
    const scenarios = r.scenarios || {};
    const dreamSc = scenarios.dream || {};
    const invSc = scenarios.investment || {};
    const small = r.small || {};

    Object.assign(h, {
      name: r.name ?? h.name,
      sex: r.sex ?? h.sex,
      sire: r.sire ?? h.sire,
      dam: r.dam ?? h.dam,
      birth: r.birth ?? h.birth,
      trainer: r.trainer ?? h.trainer,
      breeder: r.breeder ?? h.breeder,
      sharePrice: Number.isFinite(Number(r.sharePrice)) ? Number(r.sharePrice) : h.sharePrice,
      price: Number.isFinite(Number(r.price)) ? Number(r.price) : h.price,
      height: Number.isFinite(Number(r.height)) ? Number(r.height) : h.height,
      cannon: Number.isFinite(Number(r.cannon)) ? Number(r.cannon) : h.cannon,
      potential: n(r.potential, `No.${r.no}.potential`),
      pedigree: n(r.pedigree, `No.${r.no}.pedigree`),
      dream: n(r.dream, `No.${r.no}.dream`),
      roi: n(r.investment, `No.${r.no}.investment`),
      ivOfficial: n(r.investment, `No.${r.no}.investment`),
      total: n(r.total, `No.${r.no}.total`),
      officialRank: n(r.officialRank, `No.${r.no}.officialRank`),
      dreamMiddle: Number.isFinite(Number(dreamSc.middle)) ? Number(dreamSc.middle) : h.dreamMiddle,
      dreamHigh: Number.isFinite(Number(dreamSc.high)) ? Number(dreamSc.high) : h.dreamHigh,
      dreamLower: Number.isFinite(Number(dreamSc.middle)) ? Number(dreamSc.middle) : h.dreamLower,
      dreamUpper: Number.isFinite(Number(dreamSc.high)) ? Number(dreamSc.high) : h.dreamUpper,
      roiMiddlePct: Number.isFinite(Number(career.roi_middle_pct)) ? Number(career.roi_middle_pct) : h.roiMiddlePct,
      roiHighPct: Number.isFinite(Number(career.roi_high_pct)) ? Number(career.roi_high_pct) : h.roiHighPct,
      roiOfficialPct: Number.isFinite(Number(career.roi_official_pct)) ? Number(career.roi_official_pct) : h.roiOfficialPct,
      prizeMiddleYen: Number.isFinite(Number(career.middle_prize_yen)) ? Number(career.middle_prize_yen) : h.prizeMiddleYen,
      prizeHighYen: Number.isFinite(Number(career.high_prize_yen)) ? Number(career.high_prize_yen) : h.prizeHighYen,
      prizeOfficialYen: Number.isFinite(Number(career.official_prize_yen)) ? Number(career.official_prize_yen) : h.prizeOfficialYen,
      expectedPrize: Number.isFinite(Number(career.official_prize_yen)) ? Number(career.official_prize_yen) / 10000 : h.expectedPrize,
      returnRate: Number.isFinite(Number(career.roi_official_pct)) ? Number(career.roi_official_pct) / 100 : h.returnRate,
      rarStatus: r.manager_status || h.rarStatus,
      growth: career.growth || h.growth,
      targets: Array.isArray(career.target_races) && career.target_races.length ? career.target_races.join('・') : h.targets
    });

    h.small = h.small || {};
    for (const key of ['scale_frame', 'rear', 'trunk', 'front', 'mother', 'sibling', 'sibling_winup', 'nicks']) {
      if (Number.isFinite(Number(small[key]))) h.small[key] = Number(small[key]);
    }
    if (Number.isFinite(Number(dreamSc.middle))) h.small.dream_middle = Number(dreamSc.middle);
    if (Number.isFinite(Number(dreamSc.high))) h.small.dream_high = Number(dreamSc.high);
    if (Number.isFinite(Number(invSc.official))) h.ivOfficial = Number(invSc.official);
  }

  function applyDataset(data) {
    if (typeof HORSES === 'undefined' || !Array.isArray(HORSES) || HORSES.length !== 82) {
      throw new Error('RAR HORSES base is unavailable');
    }
    const byNo = new Map(data.records.map(r => [Number(r.no), r]));
    for (const h of HORSES) {
      const r = byNo.get(Number(h.no));
      if (!r) throw new Error(`SYSTEM MASTER missing No.${h.no}`);
      patchHorse(h, r);
      if (typeof CAREER_META !== 'undefined' && CAREER_META && r.career) {
        CAREER_META[String(h.no)] = {
          middleStarts: Number(r.career.middle_starts || 0),
          highStarts: Number(r.career.high_starts || 0),
          surface: r.career.surface || CAREER_META[String(h.no)]?.surface || 'turf'
        };
      }
    }

    for (const fn of ['syncBaseControls', 'syncScenarioButtons', 'syncBaseScenarioButtons', 'renderRanking', 'renderSearch', 'updateMyPage', 'updateAppDiagnostics']) {
      try {
        if (typeof globalThis[fn] === 'function') globalThis[fn]();
        else if (typeof eval(fn) === 'function') eval(fn)();
      } catch (e) {
        console.warn(`[RAR SYSTEM MASTER] ${fn} refresh skipped`, e);
      }
    }
    window.__RAR_SYSTEM_MASTER__ = {
      version_id: data.version_id,
      payload_sha256: data.payload_sha256,
      consumer_records_sha256: data.consumer_records_sha256,
      source_submission_id: data.source_submission_id,
      transferred_at: data.transferred_at,
      record_count: data.record_count
    };
  }

  function formatTokyo(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(d).replaceAll('/', '/');
  }

  async function sync() {
    ensureStatusEl();
    setStatus('最終更新 確認中…');
    try {
      const res = await fetch(API_URL, { cache: 'no-store', mode: 'cors' });
      if (!res.ok) throw new Error(`consumer API HTTP ${res.status}`);
      const data = validateDataset(await res.json());
      applyDataset(data);
      setStatus(`最終更新 ${formatTokyo(data.transferred_at)}`);
      console.info('[RAR SYSTEM MASTER] synced', window.__RAR_SYSTEM_MASTER__);
      return window.__RAR_SYSTEM_MASTER__;
    } catch (e) {
      console.error('[RAR SYSTEM MASTER] sync failed; static fallback kept', e);
      setStatus('最終更新 取得不可｜保存データ表示', 'fallback');
      return null;
    }
  }

  window.RARSystemMasterSync = { sync, validateDataset };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => queueMicrotask(sync), { once: true });
  } else {
    queueMicrotask(sync);
  }
})();
