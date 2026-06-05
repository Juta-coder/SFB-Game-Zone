// ───────────────────────────────────────────────────────────────
//  ArcadeAPI — ชั้นสื่อสารกับ Google Apps Script (Google Sheet)
//  ทุกฟังก์ชันออกแบบให้ "ปลอดภัย": ถ้ายังไม่ตั้งค่า URL หรือเรียกไม่สำเร็จ
//  จะคืนค่า fallback แทนการ throw — แอปจึงเล่นได้เสมอแม้ออฟไลน์
// ───────────────────────────────────────────────────────────────

const _apiUrl = () => ((window.ARCADE_CONFIG && window.ARCADE_CONFIG.SHEET_API_URL) || '').trim();
const _isLive = () => /^https?:\/\//.test(_apiUrl());

// ── เขียนข้อมูล (fire-and-forget, ใช้ no-cors กันปัญหา CORS) ──────
async function _post(payload) {
  if (!_isLive()) return false;
  try {
    await fetch(_apiUrl(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (e) {
    console.warn('[ArcadeAPI] post failed:', e);
    return false;
  }
}

// ── อ่านข้อมูล (GET, ต้องอ่าน response ได้) ────────────────────
async function _get(params) {
  if (!_isLive()) return null;
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(_apiUrl() + '?' + qs, { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.warn('[ArcadeAPI] get failed:', e);
    return null;
  }
}

// บันทึกคะแนนหนึ่งรอบการเล่น
//   rec = { empId, name, dept, gameId, gameName, pillar, score, unit }
function saveScore(rec) {
  const ts = new Date().toISOString();  // ts เดียวกันทั้ง local + Sheet (ใช้ dedup ได้)
  _addLocalPlay({ ...rec, ts });
  return _post({ action: 'score', ...rec, ts });
}

// บันทึกผลโหวต "ใครคือที่สุด"
//   rec = { empId, name, totalSec, answers:[{behaviorId,behavior,pillar,pickedName,pickedId,timeMs}] }
function savePeer(rec) {
  const ts = new Date().toISOString();
  _addLocalPeer({ ...rec, ts });
  return _post({ action: 'peer', ...rec, ts });
}

// ดึงข้อมูลทั้งหมดสำหรับทำรายงาน Excel
//   คืน { scores:[...], peer:[...], players:[...] } หรือ null ถ้าไม่ได้
function fetchReport(range) {
  return _get({ action: 'report', range: range || 'all' });
}

// ดึง leaderboard ของเกมหนึ่ง → [{name,id,score,unit}] หรือ null
function fetchLeaderboard(gameId) {
  return _get({ action: 'leaderboard', game: gameId });
}

window.ArcadeAPI = { isLive: _isLive, apiUrl: _apiUrl, saveScore, savePeer, fetchReport, fetchLeaderboard, loadScores, loadPeer, rankScores };

// ───────────────────────────────────────────────────────────────
//  เก็บข้อมูลในเครื่อง (localStorage) + in-memory session fallback
//  — ถ้า localStorage ถูกบล็อก (Teams WebView, private mode, quota)
//    in-memory store จะรับช่วงต่อทันที ทำให้คะแนนยังแสดงได้ใน session นี้
// ───────────────────────────────────────────────────────────────
const LS_SCORES = 'sfb_scores_v1';
const LS_PEER   = 'sfb_peer_v1';

// In-memory session store — ทำงานเสมอ รีเซ็ตเมื่อโหลดหน้าใหม่เท่านั้น
const _session = { scores: [], peer: [] };

function _readLS(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
}
function _writeLS(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr.slice(-1000))); } catch (e) {}
}
function _addLocalPlay(rec) {
  // rec.ts ถูกส่งมาจาก saveScore แล้ว (ไม่ generate ใหม่ เพื่อให้ dedup กับ Sheet ได้)
  const entry = { ...rec };
  if (!entry.ts) entry.ts = new Date().toISOString();
  _session.scores.push(entry);          // บันทึก in-memory เสมอ
  const arr = _readLS(LS_SCORES);       // พยายาม persist ใน localStorage
  arr.push(entry);
  _writeLS(LS_SCORES, arr);
}
function _addLocalPeer(rec) {
  const ts = rec.ts || new Date().toISOString();
  const arr = _readLS(LS_PEER);
  (rec.answers || []).forEach(a => {
    const entry = {
      ts, empId: rec.empId || '', name: rec.name || '', totalSec: rec.totalSec || '',
      behaviorId: a.behaviorId, behavior: a.behavior, pillar: a.pillar,
      pickedName: a.pickedName, pickedId: a.pickedId || '', timeMs: a.timeMs,
    };
    _session.peer.push(entry);          // in-memory
    arr.push(entry);                    // localStorage
  });
  _writeLS(LS_PEER, arr);
}

// ── helper: รวม localStorage + in-memory session (dedup ด้วย ts) ──────
function _localAll(lsKey, sessionArr) {
  const stored = _readLS(lsKey);
  const seen = new Set(stored.map(s => s.ts).filter(Boolean));
  return [...stored, ...sessionArr.filter(s => !seen.has(s.ts))];
}

// โหลดคะแนน:
//   เสมอคำนวณ local (localStorage + session) ก่อน
//   ถ้าเชื่อม Sheet แล้วได้ข้อมูล → merge เข้าด้วยกัน (Sheet + local ที่ยังไม่ sync)
async function loadScores() {
  const local = _localAll(LS_SCORES, _session.scores);
  if (!_isLive()) return local;
  try {
    const r = await fetchReport('all');
    if (r && Array.isArray(r.scores)) {
      // รวม Sheet + รายการ local ที่ ts ไม่อยู่ใน Sheet (ยังไม่ sync)
      const sheetTs = new Set(r.scores.map(s => s.ts).filter(Boolean));
      const localOnly = local.filter(s => s.ts && !sheetTs.has(s.ts));
      return [...r.scores, ...localOnly];
    }
  } catch (e) { console.warn('[ArcadeAPI] loadScores Sheet error:', e); }
  return local; // Sheet ล้มเหลว → ใช้ local
}
async function loadPeer() {
  const local = _localAll(LS_PEER, _session.peer);
  if (!_isLive()) return local;
  try {
    const r = await fetchReport('all');
    if (r && Array.isArray(r.peer)) {
      const sheetTs = new Set(r.peer.map(s => s.ts).filter(Boolean));
      const localOnly = local.filter(s => s.ts && !sheetTs.has(s.ts));
      return [...r.peer, ...localOnly];
    }
  } catch (e) { console.warn('[ArcadeAPI] loadPeer Sheet error:', e); }
  return local;
}

// จัดอันดับคะแนนของเกมหนึ่ง (เก็บคะแนนดีที่สุดต่อคน) → [{name,id,score,unit,lowerBetter}]
function rankScores(scores, gameId) {
  const lowerBetter = gameId === 'memory' || gameId === 'reaction';
  const best = {};
  (scores || []).filter(s => s.gameId === gameId).forEach(s => {
    const key = s.empId || s.name || '?';
    const val = Number(s.score) || 0;
    if (!(key in best) || (lowerBetter ? val < best[key].score : val > best[key].score)) {
      best[key] = { name: s.name || 'ไม่ระบุชื่อ', id: s.empId || '', score: val, unit: s.unit || '', lowerBetter };
    }
  });
  return Object.values(best).sort((a, b) => lowerBetter ? a.score - b.score : b.score - a.score);
}
