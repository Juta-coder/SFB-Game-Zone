// ───────────────────────────────────────────────────────────────
//  SFB Arcade — การตั้งค่าเชื่อมต่อ Google Sheet
// ───────────────────────────────────────────────────────────────
//  วิธีใช้:
//   1. ทำตามขั้นตอนในไฟล์ google-apps-script/SETUP.md
//   2. คัดลอก URL ของ Web App (ลงท้ายด้วย /exec) มาวางที่ SHEET_API_URL
//   3. เว้นว่าง ('') = โหมด offline ใช้ข้อมูลตัวอย่าง (mock) — แอปยังเล่นได้ปกติ
//
//  เมื่อใส่ URL แล้ว แอปจะ:
//   • บันทึกคะแนนทุกครั้งที่เล่นจบ ลงชีต Scores
//   • บันทึกผลโหวต "ใครคือที่สุด" ลงชีต PeerVotes
//   • ดึงข้อมูลจริงมาทำ Leaderboard และรายงาน Excel
// ───────────────────────────────────────────────────────────────

window.ARCADE_CONFIG = {
  SHEET_API_URL: 'https://script.google.com/macros/s/AKfycbySiXvY-KePYqqKhNXDPSXxGoOjZkiIUkZWTSpjQbl1vpZ9k9H95DDqKnxUQNCgT_KWCg/exec',   // ← วาง URL Apps Script ที่นี่ เช่น 'https://script.google.com/macros/s/AKfy.../exec'
};
