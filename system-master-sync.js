(() => {
  'use strict';

  const API_URL = 'https://rar-project-5a27e.web.app/v1/consumer-data/current';
  const DATASET_API_BASE = 'https://rar-project-5a27e.web.app/v1/consumer-data/dataset/';
  const EXPECTED_SCHEMA = 'rar-app-data-v3';
  const EXPECTED_RELEASE = 'FROZEN_100_20260914';
  const LEGACY_DATASET = Object.freeze({
    season_year: 2026,
    club_id: 'silk',
    club_name: 'シルク',
    dataset_key: '2026:silk'
  });

  let availableDatasets = [LEGACY_DATASET];
  let activeDatasetKey = LEGACY_DATASET.dataset_key;
  let staticHorseSnapshot = null;

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

  function normalizeDatasetIdentity(data) {
    if (!data || typeof data !== 'object') throw new Error('dataset identity missing');

    const seasonYear = Number(data.season_year ?? data.recruitment_year ?? LEGACY_DATASET.season_year);
    if (!Number.isInteger(seasonYear) || seasonYear < 2000 || seasonYear > 2100) {
      throw new Error(`invalid season_year: ${seasonYear}`);
    }

    let clubId = String(data.club_id || '').trim().toLowerCase();
    const legacyClub = String(data.club || '').trim();
    if (!clubId && /silk horse club|シルク/i.test(legacyClub)) clubId = 'silk';
    if (!clubId && seasonYear === LEGACY_DATASET.season_year && !legacyClub) clubId = LEGACY_DATASET.club_id;
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(clubId)) throw new Error(`invalid club_id: ${clubId || '(missing)'}`);

    const clubName = String(data.club_name || (clubId === 'silk' ? LEGACY_DATASET.club_name : legacyClub) || '').trim();
    if (!clubName) throw new Error('club_name missing');

    const expectedKey = `${seasonYear}:${clubId}`;
    const suppliedKey = String(data.dataset_key || '').trim();
    if (suppliedKey && suppliedKey !== expectedKey) {
      throw new Error(`dataset_key mismatch: ${suppliedKey} !== ${expectedKey}`);
    }

    return {
      ...data,
      season_year: seasonYear,
      club_id: clubId,
      club_name: clubName,
      dataset_key: expectedKey
    };
  }

  function normalizeCatalogEntry(entry) {
    const normalized = normalizeDatasetIdentity(entry);
    return {
      season_year: normalized.season_year,
      club_id: normalized.club_id,
      club_name: normalized.club_name,
      dataset_key: normalized.dataset_key
    };
  }

  function catalogFromDataset(data) {
    const candidates = Array.isArray(data.available_datasets) && data.available_datasets.length
      ? data.available_datasets
      : [data];
    const byKey = new Map();
    for (const entry of candidates) {
      const normalized = normalizeCatalogEntry(entry);
      byKey.set(normalized.dataset_key, normalized);
    }
    const current = normalizeCatalogEntry(data);
    byKey.set(current.dataset_key, current);
    return [...byKey.values()].sort((a, b) => b.season_year - a.season_year || a.club_name.localeCompare(b.club_name, 'ja'));
  }

  function ensureDatasetSelectorStyle() {
    if (document.getElementById('rarDatasetSelectorStyle')) return;
    const style = document.createElement('style');
    style.id = 'rarDatasetSelectorStyle';
    style.textContent = `
      .rar-dataset-selectors{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:6px 0 10px;padding:8px 10px;border:1px solid rgba(49,93,76,.18);border-radius:10px;background:rgba(255,255,255,.72)}
      .rar-dataset-field{display:flex;align-items:center;gap:6px;min-width:0}
      .rar-dataset-field label{flex:0 0 auto;font-size:11px;font-weight:800;color:#315d4c;white-space:nowrap}
      .rar-dataset-field select{min-width:0;width:100%;height:32px;padding:0 28px 0 9px;border:1px solid rgba(49,93,76,.28);border-radius:8px;background:#fff;color:#173d30;font-size:13px;font-weight:800}
      .rar-dataset-field select:disabled{opacity:.72}
      @media(max-width:420px){.rar-dataset-selectors{gap:6px;padding:7px 8px}.rar-dataset-field{gap:4px}.rar-dataset-field label{font-size:10px}.rar-dataset-field select{font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  function ensureDatasetSelectors() {
    let root = document.getElementById('rarDatasetSelectors');
    if (root) return root;
    const rankingTop = document.querySelector('#ranking .rank-top-sticky') || document.querySelector('#ranking');
    if (!rankingTop) return null;

    ensureDatasetSelectorStyle();
    root = document.createElement('div');
    root.id = 'rarDatasetSelectors';
    root.className = 'rar-dataset-selectors';
    root.innerHTML = `
      <div class="rar-dataset-field">
        <label for="rarSeasonSelect">年代</label>
        <select id="rarSeasonSelect" aria-label="募集年代"></select>
      </div>
      <div class="rar-dataset-field">
        <label for="rarClubSelect">クラブ</label>
        <select id="rarClubSelect" aria-label="クラブ"></select>
      </div>
    `;

    const title = rankingTop.querySelector('h1,h2,h3');
    if (title && title.parentNode === rankingTop) title.insertAdjacentElement('afterend', root);
    else rankingTop.insertBefore(root, rankingTop.firstChild);

    const seasonSelect = root.querySelector('#rarSeasonSelect');
    const clubSelect = root.querySelector('#rarClubSelect');
    seasonSelect.addEventListener('change', () => {
      renderDatasetSelectorOptions(Number(seasonSelect.value), null);
      const requestedKey = clubSelect.value;
      if (requestedKey && requestedKey !== activeDatasetKey) void selectDataset(requestedKey);
    });
    clubSelect.addEventListener('change', () => {
      const requestedKey = clubSelect.value;
      if (requestedKey && requestedKey !== activeDatasetKey) void selectDataset(requestedKey);
    });
    return root;
  }

  function renderDatasetSelectorOptions(preferredYear = null, preferredKey = null) {
    const root = ensureDatasetSelectors();
    if (!root) return;
    const seasonSelect = root.querySelector('#rarSeasonSelect');
    const clubSelect = root.querySelector('#rarClubSelect');
    const years = [...new Set(availableDatasets.map(d => d.season_year))].sort((a, b) => b - a);
    const activeMeta = availableDatasets.find(d => d.dataset_key === (preferredKey || activeDatasetKey));
    const chosenYear = years.includes(Number(preferredYear))
      ? Number(preferredYear)
      : (activeMeta?.season_year ?? years[0]);

    seasonSelect.innerHTML = '';
    for (const year of years) {
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = String(year);
      option.selected = year === chosenYear;
      seasonSelect.appendChild(option);
    }

    const clubs = availableDatasets.filter(d => d.season_year === chosenYear);
    clubSelect.innerHTML = '';
    for (const d of clubs) {
      const option = document.createElement('option');
      option.value = d.dataset_key;
      option.textContent = d.club_name;
      option.selected = d.dataset_key === (preferredKey || activeDatasetKey);
      clubSelect.appendChild(option);
    }
    if (!clubSelect.value && clubs[0]) clubSelect.value = clubs[0].dataset_key;

    seasonSelect.disabled = years.length <= 1;
    clubSelect.disabled = clubs.length <= 1;
  }

  function updateDatasetCatalog(data) {
    availableDatasets = catalogFromDataset(data);
  }

  function validateDataset(rawData) {
    const data = normalizeDatasetIdentity(rawData);
    if (data.schema_version !== EXPECTED_SCHEMA) throw new Error(`schema mismatch: ${data.schema_version}`);
    if (data.release_class !== EXPECTED_RELEASE) throw new Error(`release mismatch: ${data.release_class}`);
    const count = Number(data.record_count);
    if (!Number.isInteger(count) || count <= 0 || count > 500) throw new Error(`invalid record_count: ${data.record_count}`);
    if (!Array.isArray(data.records) || data.records.length !== count) throw new Error('records length must equal record_count');

    const nos = new Set();
    const ranks = new Set();
    for (const r of data.records) {
      const no = n(r.no, 'no');
      const rank = n(r.officialRank, `No.${no}.officialRank`);
      if (!Number.isInteger(no) || no < 1 || nos.has(no)) throw new Error(`invalid/duplicate no: ${no}`);
      if (!Number.isInteger(rank) || rank < 1 || rank > count || ranks.has(rank)) throw new Error(`invalid/duplicate rank: ${rank}`);
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
    for (let i = 1; i <= count; i++) {
      if (!ranks.has(i)) throw new Error(`rank set must be 1..${count}`);
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

  function cloneHorse(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function blankHorse(no) {
    return {
      no, name: '', sex: '', sire: '', dam: '', birth: '', trainer: '', breeder: '',
      sharePrice: 0, price: 0, height: 0, chest: 0, cannon: 0, weight: 0,
      potential: 0, pedigree: 0, dream: 0, roi: 0, ivOfficial: 0, total: 0,
      officialRank: no, dreamMiddle: 0, dreamHigh: 0, dreamLower: 0, dreamUpper: 0,
      roiMiddlePct: 0, roiHighPct: 0, roiOfficialPct: 0,
      prizeMiddleYen: 0, prizeHighYen: 0, prizeOfficialYen: 0,
      expectedPrize: 0, returnRate: 0, full: false,
      turf: '', dirt: '', distance: '', category: '', growth: '', targets: '', comment: '',
      small: {}
    };
  }

  function applyDataset(data) {
    if (typeof HORSES === 'undefined' || !Array.isArray(HORSES)) {
      throw new Error('RAR HORSES base is unavailable');
    }
    if (!staticHorseSnapshot) staticHorseSnapshot = HORSES.map(cloneHorse);
    const legacyByNo = new Map(staticHorseSnapshot.map(h => [Number(h.no), h]));
    const nextHorses = data.records.map(r => {
      const no = Number(r.no);
      const base = data.dataset_key === LEGACY_DATASET.dataset_key && legacyByNo.has(no)
        ? cloneHorse(legacyByNo.get(no))
        : blankHorse(no);
      patchHorse(base, r);
      if (!base.turf && r.career?.surface === 'turf') base.turf = '◎';
      if (!base.dirt && r.career?.surface === 'dirt') base.dirt = '◎';
      return base;
    });
    HORSES.splice(0, HORSES.length, ...nextHorses);

    if (typeof CAREER_META !== 'undefined' && CAREER_META) {
      for (const key of Object.keys(CAREER_META)) delete CAREER_META[key];
      for (const r of data.records) {
        const no = Number(r.no);
        const career = r.career || {};
        CAREER_META[String(no)] = {
          middleStarts: Number(career.middle_starts || 0),
          highStarts: Number(career.high_starts || 0),
          surface: career.surface || 'turf'
        };
      }
    }

    // Publish dataset metadata before refreshing UI so every renderer sees
    // the same dataset identity/count as the HORSES array it is rendering.
    window.__RAR_SYSTEM_MASTER__ = {
      version_id: data.version_id,
      payload_sha256: data.payload_sha256,
      consumer_records_sha256: data.consumer_records_sha256,
      source_submission_id: data.source_submission_id,
      transferred_at: data.transferred_at,
      record_count: data.record_count,
      season_year: data.season_year,
      club_id: data.club_id,
      club_name: data.club_name,
      dataset_key: data.dataset_key
    };
    for (const fn of ['syncBaseControls', 'syncScenarioButtons', 'syncBaseScenarioButtons', 'renderRanking', 'renderSearch', 'updateMyPage', 'updateAppDiagnostics']) {
      try {
        if (typeof globalThis[fn] === 'function') globalThis[fn]();
        else if (typeof eval(fn) === 'function') eval(fn)();
      } catch (e) {
        console.warn(`[RAR SYSTEM MASTER] ${fn} refresh skipped`, e);
      }
    }
  }

  function formatTokyo(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(d).replaceAll('/', '/');
  }

  async function selectDataset(datasetKey) {
    const requested = String(datasetKey || '').trim();
    const selected = availableDatasets.find(d => d.dataset_key === requested);
    if (!selected) throw new Error(`unknown dataset: ${requested}`);
    const detail = { ...selected, active_dataset_key: activeDatasetKey };
    window.dispatchEvent(new CustomEvent('rar:dataset-selection-requested', { detail }));
    setStatus(`切替中 ${selected.season_year} ${selected.club_name}…`);
    try {
      const res = await fetch(`${DATASET_API_BASE}${encodeURIComponent(requested)}`, { cache: 'no-store', mode: 'cors' });
      if (!res.ok) throw new Error(`consumer dataset API HTTP ${res.status}`);
      const data = validateDataset(await res.json());
      if (data.dataset_key !== requested) throw new Error(`dataset response mismatch: ${data.dataset_key}`);
      window.dispatchEvent(new CustomEvent('rar:dataset-before-apply', { detail: {
        season_year: data.season_year,
        club_id: data.club_id,
        club_name: data.club_name,
        dataset_key: data.dataset_key,
        record_count: data.record_count
      } }));
      updateDatasetCatalog(data);
      applyDataset(data);
      activeDatasetKey = data.dataset_key;
      renderDatasetSelectorOptions(data.season_year, data.dataset_key);
      setStatus(`最終更新 ${formatTokyo(data.transferred_at)}`);
      window.dispatchEvent(new CustomEvent('rar:dataset-changed', { detail: { ...window.__RAR_SYSTEM_MASTER__ } }));
      return window.__RAR_SYSTEM_MASTER__;
    } catch (e) {
      console.error('[RAR SYSTEM MASTER] dataset switch failed; active dataset kept', e);
      window.dispatchEvent(new CustomEvent('rar:dataset-apply-failed', { detail: {
        dataset_key: activeDatasetKey,
        failed_dataset_key: requested
      } }));
      renderDatasetSelectorOptions(null, activeDatasetKey);
      setStatus('切替失敗｜現在データを継続', 'error');
      return null;
    }
  }

  async function sync() {
    ensureStatusEl();
    renderDatasetSelectorOptions(LEGACY_DATASET.season_year, LEGACY_DATASET.dataset_key);
    setStatus('最終更新 確認中…');
    try {
      const res = await fetch(API_URL, { cache: 'no-store', mode: 'cors' });
      if (!res.ok) throw new Error(`consumer API HTTP ${res.status}`);
      const data = validateDataset(await res.json());
      window.dispatchEvent(new CustomEvent('rar:dataset-before-apply', { detail: {
        season_year: data.season_year,
        club_id: data.club_id,
        club_name: data.club_name,
        dataset_key: data.dataset_key,
        record_count: data.record_count
      } }));
      updateDatasetCatalog(data);
      applyDataset(data);
      activeDatasetKey = data.dataset_key;
      renderDatasetSelectorOptions(data.season_year, data.dataset_key);
      setStatus(`最終更新 ${formatTokyo(data.transferred_at)}`);
      console.info('[RAR SYSTEM MASTER] synced', window.__RAR_SYSTEM_MASTER__);
      return window.__RAR_SYSTEM_MASTER__;
    } catch (e) {
      console.error('[RAR SYSTEM MASTER] sync failed; static fallback kept', e);
      setStatus('最終更新 取得不可｜保存データ表示', 'fallback');
      return null;
    }
  }

  window.RARDatasetSelector = {
    get activeDatasetKey() { return activeDatasetKey; },
    get availableDatasets() { return availableDatasets.map(d => ({ ...d })); },
    normalizeDatasetIdentity,
    render: renderDatasetSelectorOptions,
    select: selectDataset
  };
  window.RARSystemMasterSync = { sync, validateDataset };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => queueMicrotask(sync), { once: true });
  } else {
    queueMicrotask(sync);
  }
})();
