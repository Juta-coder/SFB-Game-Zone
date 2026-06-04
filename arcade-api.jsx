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
  _addLocalPlay(rec);
  return _post({ action: 'score', ...rec, ts: new Date().toISOString() });
}

// บันทึกผลโหวต "ใครคือที่สุด"
//   rec = { empId, name, totalSec, answers:[{behaviorId,behavior,pillar,pickedName,pickedId,timeMs}] }
function savePeer(rec) {
  _addLocalPeer(rec);
  return _post({ action: 'peer', ...rec, ts: new Date().toISOString() });
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
//  เก็บข้อมูลในเครื่อง (localStorage) เพื่อให้ใช้งานได้แม้ยังไม่เชื่อม Sheet
//  — ข้อมูลทั้งหมดเป็น "ของจริง" จากการเล่น ไม่มีข้อมูลปลอม
// ───────────────────────────────────────────────────────────────
const LS_SCORES = 'sfb_scores_v1';
const LS_PEER = 'sfb_peer_v1';

function _readLS(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (e) { return []; }
}
function _writeLS(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr.slice(-1000))); } catch (e) {}
}
function _addLocalPlay(rec) {
  const arr = _readLS(LS_SCORES);
  arr.push({ ...rec, ts: new Date().toISOString() });
  _writeLS(LS_SCORES, arr);
}
function _addLocalPeer(rec) {
  const arr = _readLS(LS_PEER);
  const ts = new Date().toISOString();
  (rec.answers || []).forEach(a => arr.push({
    ts, empId: rec.empId || '', name: rec.name || '', totalSec: rec.totalSec || '',
    behaviorId: a.behaviorId, behavior: a.behavior, pillar: a.pillar,
    pickedName: a.pickedName, pickedId: a.pickedId || '', timeMs: a.timeMs,
  }));
  _writeLS(LS_PEER, arr);
}

// โหลดคะแนนทั้งหมด: ใช้ข้อมูลจาก Sheet ถ้าเชื่อมแล้ว, ไม่งั้นใช้ของในเครื่อง
async function loadScores() {
  if (_isLive()) {
    const r = await fetchReport('all');
    if (r && Array.isArray(r.scores)) return r.scores;
  }
  return _readLS(LS_SCORES);
}
async function loadPeer() {
  if (_isLive()) {
    const r = await fetchReport('all');
    if (r && Array.isArray(r.peer)) return r.peer;
  }
  return _readLS(LS_PEER);
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
