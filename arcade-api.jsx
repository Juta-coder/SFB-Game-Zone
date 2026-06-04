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
  return _post({ action: 'score', ...rec, ts: new Date().toISOString() });
}

// บันทึกผลโหวต "ใครคือที่สุด"
//   rec = { empId, name, totalSec, answers:[{behaviorId,behavior,pillar,pickedName,pickedId,timeMs}] }
function savePeer(rec) {
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

window.ArcadeAPI = { isLive: _isLive, apiUrl: _apiUrl, saveScore, savePeer, fetchReport, fetchLeaderboard };
