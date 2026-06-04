// Shared: theme, mock data, small UI primitives, helpers

const BRAND = {
  navy: '#252478',
  navyDeep: '#1a1957',
  red: '#e5232a',
  redDeep: '#c01a21',
  teal: '#66bbb0',
  tealDeep: '#3d9a8e',
  // Playful pastels
  cream: '#fff8ef',
  blush: '#ffe1de',
  mint: '#dcf0ec',
  lavender: '#e0dffa',
  butter: '#fff1c2',
  // Neutrals
  ink: '#1f1d3d',
  inkSoft: '#5a5779',
  muted: '#9b99b8',
  hairline: '#ebe9f2',
  paper: '#fbf9f4',
};

// SFB Culture pillars (TW 2.0 Transformation: Stronger, Faster, Better)
const PILLARS = {
  stronger: { name: 'Stronger', th: 'สร้างสรรค์ก้าวหน้า', color: BRAND.navy, bg: BRAND.lavender, motto: 'Innovate to Elevate' },
  faster:   { name: 'Faster',   th: 'ไม่รอช้าเร่งลงมือ', color: BRAND.red,  bg: BRAND.blush,    motto: 'No Time to Lose' },
  better:   { name: 'Better',   th: 'ยืนหนึ่งสู่เป้าหมาย', color: BRAND.teal, bg: BRAND.mint,     motto: 'Raise the Bar' },
};

// Each game's identity — now tied to an SFB pillar + behavior
const GAMES = [
  {
    id: 'tap', name: 'เติมคำ SFB', en: 'Fill in the Blank',
    desc: 'เติมคำ SFB ในช่องว่างให้สมบูรณ์ — 9 คำใน 2 นาที',
    color: BRAND.red, bg: BRAND.blush, icon: 'tap',
    pillar: 'faster', behavior: 'คล่องตัวและรวดเร็ว',
    insight: 'จำคำสำคัญของ SFB ได้แม่นยำ ทำงานเร็วและถูกทาง',
  },
  {
    id: 'memory', name: 'จับคู่คำ SFB', en: 'Match the SFB Words',
    desc: 'พลิกการ์ดจับคู่คำ SFB ให้ครบทุกใบ',
    color: BRAND.navy, bg: BRAND.lavender, icon: 'memory',
    pillar: 'stronger', behavior: 'สร้างความไว้วางใจและความเคารพ',
    insight: 'จดจำค่านิยมร่วม ทำให้ทีมเข้าใจกัน — Build Trust and Respect',
  },
  {
    id: 'catch', name: 'SFB ลงตะกร้า', en: 'Catch the SFB',
    desc: 'รับ Stronger / Faster / Better หลบลูกระเบิด',
    color: BRAND.teal, bg: BRAND.mint, icon: 'catch',
    pillar: 'better', behavior: 'จัดลำดับความสำคัญอย่างมีประสิทธิภาพ',
    insight: 'เลือกทำสิ่งที่สำคัญก่อน ผลลัพธ์จะดีขึ้น — Prioritize Effectively',
  },
  {
    id: 'reaction', name: 'SFB : ใครคือที่สุด', en: 'Who is the Best at SFB',
    desc: 'เลือกเพื่อนร่วมงานที่ทำแต่ละพฤติกรรม SFB ได้ดีที่สุด — 9 ข้อ',
    color: '#d59a16', bg: BRAND.butter, icon: 'reaction',
    pillar: 'faster', behavior: 'ตัดสินใจอย่างมั่นใจและรวดเร็ว',
    insight: 'รู้จักเพื่อนร่วมงาน รู้ใจกัน ตัดสินใจร่วมกันได้เร็วขึ้น',
  },
  {
    id: 'whack', name: 'ตุ่นตัวดี', en: 'Pick the Good Mole',
    desc: 'เลือกตีตุ่นที่ตรงกับพฤติกรรม SFB ที่ดี',
    color: '#d96f80', bg: '#ffd9e0', icon: 'whack',
    pillar: 'better', behavior: 'มุ่งเน้นการพัฒนาอย่างต่อเนื่อง',
    insight: 'ปรับปรุงทีละนิดต่อเนื่อง = พัฒนาที่ยั่งยืน — Continuous Improvement',
  },
];

// SFB-themed words used in the "เติมสระ" word puzzle.
// Each round shows the word with all vowels/tone-marks masked as '_'
// (consecutive marks collapse to one gap). Hint = the SFB description.
const FILL_WORDS = [
  { word: 'รวดเร็ว',   hint: 'รู้แล้ว เริ่มเลย ไม่รอ',       pillar: 'faster' },
  { word: 'ร่วมมือ',   hint: 'ทำงานกับทีมอื่นให้งานเร็วขึ้น', pillar: 'faster' },
  { word: 'นวัตกรรม',  hint: 'มีวิธีใหม่ ลองทำให้ได้งานไว',   pillar: 'faster' },
  { word: 'มุ่งมั่น',   hint: 'ลงมือ ทำให้ได้ ไม่ย่อท้อ',     pillar: 'stronger' },
  { word: 'วางใจ',     hint: 'พูด ฟัง เคารพกัน',             pillar: 'stronger' },
  { word: 'สำคัญ',     hint: 'เรียงงานก่อน-หลัง ทำสำคัญก่อน', pillar: 'stronger' },
  { word: 'ตัดสินใจ',   hint: 'ใช้ข้อมูลเลือกทางที่ดีที่สุด',    pillar: 'better' },
  { word: 'โปร่งใส',    hint: 'บอกความจริง ไม่ปิดปัญหา',       pillar: 'better' },
  { word: 'พัฒนา',     hint: 'หาวิธีทำให้ดีขึ้น และพัฒนาตัวเอง', pillar: 'better' },
];

// Mask vowels + tone marks with `_`. Consecutive marks → single `_`.
// Thai vowel/mark blocks: U+0E30..U+0E3A and U+0E40..U+0E4E.
function maskThaiVowels(word) {
  const isMark = (c) => {
    const x = c.charCodeAt(0);
    return (x >= 0x0E30 && x <= 0x0E3A) || (x >= 0x0E40 && x <= 0x0E4E);
  };
  let out = ''; let gap = false;
  for (const ch of word) {
    if (isMark(ch)) {
      if (!gap) { out += '_'; gap = true; }
    } else {
      out += ch; gap = false;
    }
  }
  return out;
}
// Source: "SFB for factory" deck — Thai Wah 2024
const SFB_PAIRS = [
  // Stronger
  { id: 's1', pillar: 'stronger', concept: 'มุ่งมั่น',        desc: 'ลงมือ ทำให้ได้',      emoji: '💪' },
  { id: 's2', pillar: 'stronger', concept: 'วางใจ',          desc: 'พูด ฟัง เคารพกัน',    emoji: '🤝' },
  { id: 's3', pillar: 'stronger', concept: 'ให้ความสำคัญ',    desc: 'ทำงานสำคัญก่อน',      emoji: '🎯' },
  // Faster
  { id: 'f1', pillar: 'faster',   concept: 'รวดเร็ว',         desc: 'รู้แล้ว เริ่มเลย',     emoji: '⚡' },
  { id: 'f2', pillar: 'faster',   concept: 'ร่วมมือ',         desc: 'ทำงานกับทีมอื่น',     emoji: '🌐' },
  { id: 'f3', pillar: 'faster',   concept: 'ลองสิ่งใหม่',     desc: 'มีวิธีใหม่ ลองทำ',     emoji: '💡' },
  // Better
  { id: 'b1', pillar: 'better',   concept: 'ส่งเสริมตัดสินใจ', desc: 'ใช้ข้อมูลตัดสิน',     emoji: '🧭' },
  { id: 'b2', pillar: 'better',   concept: 'โปร่งใส',         desc: 'บอกจริง ไม่ปิดปัญหา', emoji: '💬' },
  { id: 'b3', pillar: 'better',   concept: 'พัฒนาวิธีทำงาน',  desc: 'ทำให้ดีขึ้นเสมอ',     emoji: '📈' },
];

// Kept for backward compat (any old reference would still resolve)
const SFB_VALUES = SFB_PAIRS.map(p => ({ emoji: p.emoji, label: p.concept, pillar: p.pillar }));

// Items used in Catch game — 3 SFB pillar items (good) + bomb (bad)
const CATCH_GOOD = [
  { emoji: '💪', label: 'Stronger', color: BRAND.navy },
  { emoji: '⚡', label: 'Faster',   color: BRAND.red  },
  { emoji: '📈', label: 'Better',   color: BRAND.teal },
];
const CATCH_BAD = [
  { emoji: '💣', label: 'ระเบิด',   color: '#a04050' },
];

// Whack pairs — each round shows one BAD mole + its GOOD opposite.
// Player must whack the BAD one to "ปรับปรุง" the work. Whacking the
// GOOD one is wrong (you don't smash a good practice!).
const WHACK_PAIRS = [
  { bad: 'ทำแบบเดิม',  good: 'ลองวิธีใหม่' },
  { bad: 'ปกปิดปัญหา', good: 'บอกตรง ๆ' },
  { bad: 'เดาสุ่ม',     good: 'ดูข้อมูล' },
  { bad: 'ทำคนเดียว',  good: 'ขอช่วย' },
  { bad: 'ผัดวัน',      good: 'ลงมือเลย' },
  { bad: 'อยู่เฉย ๆ',   good: 'พัฒนาเสมอ' },
  { bad: 'เก็บเงียบ',   good: 'เปิดสื่อสาร' },
  { bad: 'โยนผิด',      good: 'รับผิดชอบ' },
  { bad: 'งานซ้ำซ้อน', good: 'ใช้ดิจิทัล' },
  { bad: 'ทำไม่จบ',     good: 'ทำให้จบ' },
];

const GAME_BY_ID = Object.fromEntries(GAMES.map(g => [g.id, g]));

// ─────────────────────────────────────────────────────────────
// Mock leaderboards + employee data
// ─────────────────────────────────────────────────────────────
const FAKE_NAMES = [
  ['สมชาย ใจดี', 'TW-1042'],
  ['ปรียา รักงาน', 'TW-2018'],
  ['ณัฐพล ขยัน', 'TW-3271'],
  ['อรนุช สดใส', 'TW-1199'],
  ['ธีรภัทร เก่งกาจ', 'TW-2876'],
  ['มาลี ยิ้มแย้ม', 'TW-4012'],
  ['ภานุวัฒน์ มั่นคง', 'TW-2233'],
  ['ศิริพร พิทักษ์', 'TW-3340'],
  ['กิตติศักดิ์ มาสาย', 'TW-1567'],
  ['วรรณดี ใสซื่อ', 'TW-2911'],
  ['เอกชัย ผ่านศึก', 'TW-1810'],
  ['จิราภรณ์ มีสุข', 'TW-4488'],
  ['พงศกร แสนดี', 'TW-3055'],
  ['อภิสิทธิ์ เจริญ', 'TW-2664'],
  ['ดวงใจ ภาพงาม', 'TW-1325'],
];

function seedScores(gameId, count = 12) {
  const ranges = {
    tap: { unit: 'คำ', top: 92, base: 38 },
    memory: { unit: 'วิ', top: 24, base: 58 },  // lower = better
    catch: { unit: 'ชิ้น', top: 48, base: 12 },
    reaction: { unit: 'ms', top: 198, base: 412 }, // lower = better
    whack: { unit: 'ตัว', top: 38, base: 9 },
  };
  const r = ranges[gameId];
  const lowerBetter = gameId === 'memory' || gameId === 'reaction';
  const rows = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    // top is best; spread linearly with jitter
    const v = lowerBetter
      ? Math.round(r.top + (r.base - r.top) * t + (Math.random() * 6 - 3))
      : Math.round(r.top - (r.top - r.base) * t + (Math.random() * 6 - 3));
    rows.push({
      name: FAKE_NAMES[i % FAKE_NAMES.length][0],
      id: FAKE_NAMES[i % FAKE_NAMES.length][1],
      score: v,
      unit: r.unit,
      lowerBetter,
    });
  }
  // sort
  rows.sort((a, b) => lowerBetter ? a.score - b.score : b.score - a.score);
  return rows;
}

const LEADERBOARDS = Object.fromEntries(GAMES.map(g => [g.id, seedScores(g.id, 12)]));

// ─────────────────────────────────────────────────────────────
// Game icon — simple cute SVG glyphs (no external assets)
// ─────────────────────────────────────────────────────────────
function GameIcon({ kind, size = 56, color = '#fff', bg = null }) {
  const s = size;
  const wrap = (children) => (
    <div style={{
      width: s, height: s, borderRadius: s * 0.32,
      background: bg || 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, overflow: 'hidden',
    }}>{children}</div>
  );

  if (kind === 'tap') {
    // เติมคำ SFB — show "A B _ D" style logo with the underscore highlighted
    return wrap(
      <svg width={s * 0.78} height={s * 0.5} viewBox="0 0 56 36">
        <text x="6"  y="22" fontSize="14" fontWeight="800" fill={color} fontFamily="Prompt, system-ui">S</text>
        <text x="18" y="22" fontSize="14" fontWeight="800" fill={color} fontFamily="Prompt, system-ui">F</text>
        {/* blank slot */}
        <rect x="28" y="20" width="10" height="2.5" rx="1.2" fill={color} />
        <text x="42" y="22" fontSize="14" fontWeight="800" fill={color} fontFamily="Prompt, system-ui" opacity="0.65">?</text>
        {/* baseline underscores */}
        <g stroke={color} strokeWidth="1.6" strokeLinecap="round" opacity="0.65">
          <line x1="6"  y1="30" x2="14" y2="30" />
          <line x1="18" y1="30" x2="26" y2="30" />
          <line x1="42" y1="30" x2="50" y2="30" />
        </g>
        <line x1="28" y1="30" x2="38" y2="30" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'memory') {
    return wrap(
      <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="8" height="11" rx="1.5" fill={color} opacity="0.95" />
        <rect x="12" y="6" width="8" height="11" rx="1.5" fill={color} opacity="0.6" transform="rotate(8 16 11.5)" />
      </svg>
    );
  }

  if (kind === 'catch') {
    // SFB ลงตะกร้า — three letters falling toward a teal basket
    return wrap(
      <svg width={s * 0.78} height={s * 0.78} viewBox="0 0 32 32">
        {/* falling letters */}
        <text x="6"  y="11" fontSize="6.5" fontWeight="800" fill={color} fontFamily="Prompt">S</text>
        <text x="14" y="9"  fontSize="6.5" fontWeight="800" fill={color} fontFamily="Prompt">F</text>
        <text x="22" y="13" fontSize="6.5" fontWeight="800" fill={color} fontFamily="Prompt">B</text>
        {/* basket — rounded trapezoid + handle */}
        <path d="M 4 18 L 28 18 L 25 28 L 7 28 Z" fill={color} />
        <path d="M 4 18 L 28 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        {/* weave lines */}
        <g stroke="#fff" strokeWidth="0.8" opacity="0.55">
          <line x1="10" y1="20" x2="11" y2="27" />
          <line x1="16" y1="20" x2="16" y2="27" />
          <line x1="22" y1="20" x2="21" y2="27" />
          <line x1="5"  y1="22" x2="27" y2="22" />
          <line x1="6"  y1="25" x2="26" y2="25" />
        </g>
        {/* handle */}
        <path d="M 8 18 Q 16 10 24 18" stroke={color} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'reaction') {
    // SFB: ใครคือที่สุด — 3D-ish crown with gems
    return wrap(
      <svg width={s * 0.72} height={s * 0.62} viewBox="0 0 32 28">
        {/* base band */}
        <rect x="3" y="20" width="26" height="5" rx="1.2" fill={color} />
        {/* crown body (zigzag) */}
        <path d="M 3 22 L 6 8 L 11 15 L 16 4 L 21 15 L 26 8 L 29 22 Z" fill={color} />
        {/* shading line for 3D feel */}
        <path d="M 3 22 L 6 8 L 11 15 L 16 4 L 21 15 L 26 8 L 29 22"
          stroke={color} strokeOpacity="0.4" strokeWidth="1" fill="none" />
        {/* gems on top */}
        <circle cx="6"  cy="8"  r="1.6" fill="#fff" opacity="0.85" />
        <circle cx="16" cy="4"  r="2"   fill="#fff" />
        <circle cx="26" cy="8"  r="1.6" fill="#fff" opacity="0.85" />
        {/* gems on band */}
        <circle cx="10" cy="22.5" r="1.1" fill="#fff" opacity="0.7" />
        <circle cx="16" cy="22.5" r="1.3" fill="#fff" />
        <circle cx="22" cy="22.5" r="1.1" fill="#fff" opacity="0.7" />
      </svg>
    );
  }

  if (kind === 'whack') {
    // ตุ่นตัวดี — uses the full CuteMole illustration if available
    if (window.CuteMole) {
      return (
        <div style={{
          width: s, height: s, borderRadius: s * 0.32,
          background: bg || 'transparent',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          flexShrink: 0, overflow: 'hidden', padding: s * 0.05,
        }}>
          <div style={{ width: s * 0.92, height: s * 0.92 }}>
            <window.CuteMole color="#b07a4a" accent="#5a3a22" face="happy" />
          </div>
        </div>
      );
    }
    return wrap(
      <svg width={s * 0.82} height={s * 0.82} viewBox="0 0 32 32">
        <ellipse cx="16" cy="21" rx="11" ry="9" fill={color} />
        <ellipse cx="16" cy="11" rx="13" ry="2.2" fill="#ffd84a" />
        <path d="M 6.5 10.5 Q 16 2 25.5 10.5 Z" fill="#ffd84a" />
        <ellipse cx="12" cy="18" rx="1.4" ry="1.8" fill="#2a1810" />
        <ellipse cx="20" cy="18" rx="1.4" ry="1.8" fill="#2a1810" />
        <ellipse cx="16" cy="22.5" rx="1.2" ry="1" fill="#ff8a9a" />
      </svg>
    );
  }

  return wrap(null);
}

// ─────────────────────────────────────────────────────────────
// Tiny UI primitives
// ─────────────────────────────────────────────────────────────
function Btn({ children, onClick, color = BRAND.navy, fg = '#fff', block, style }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: color, color: fg, border: 'none',
        padding: '14px 20px', borderRadius: 999,
        fontFamily: 'Prompt, system-ui', fontSize: 16, fontWeight: 600,
        cursor: 'pointer', width: block ? '100%' : undefined,
        boxShadow: pressed ? `0 1px 0 ${color}55` : `0 4px 0 ${color}55, 0 8px 20px ${color}30`,
        transform: pressed ? 'translateY(3px)' : 'translateY(0)',
        transition: 'transform 80ms, box-shadow 80ms',
        ...style,
      }}
    >{children}</button>
  );
}

function GhostBtn({ children, onClick, color = BRAND.navy, block, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent', color, border: `1.5px solid ${color}30`,
        padding: '12px 18px', borderRadius: 999,
        fontFamily: 'Prompt, system-ui', fontSize: 15, fontWeight: 500,
        cursor: 'pointer', width: block ? '100%' : undefined,
        ...style,
      }}
    >{children}</button>
  );
}

function Avatar({ name, size = 36, color }) {
  const initial = (name || '?').trim().slice(0, 1);
  const palette = [BRAND.navy, BRAND.red, BRAND.teal, '#d59a16', '#d96f80'];
  const c = color || palette[(name?.charCodeAt(0) || 0) % palette.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Prompt', fontWeight: 600, fontSize: size * 0.42,
      flexShrink: 0,
    }}>{initial}</div>
  );
}

// Format helpers
const fmt = {
  num: (n) => new Intl.NumberFormat('th-TH').format(n),
  score: (row) => `${new Intl.NumberFormat('th-TH').format(row.score)} ${row.unit}`,
};

// SFB pillar badge — small label that goes on game cards / ready screens
function PillarBadge({ pillar, size = 'sm' }) {
  const p = PILLARS[pillar];
  if (!p) return null;
  const small = size === 'sm';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: p.color, color: '#fff',
      padding: small ? '3px 8px' : '5px 12px',
      borderRadius: 999,
      fontFamily: 'Prompt', fontWeight: 700,
      fontSize: small ? 10 : 12,
      letterSpacing: 0.6, textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: small ? 5 : 7, height: small ? 5 : 7, borderRadius: '50%',
        background: '#fff', opacity: 0.85,
      }} />
      {p.name}
    </div>
  );
}

Object.assign(window, {
  BRAND, PILLARS, GAMES, GAME_BY_ID, LEADERBOARDS, FAKE_NAMES,
  SFB_PAIRS, SFB_VALUES, CATCH_GOOD, CATCH_BAD, WHACK_PAIRS,
  FILL_WORDS, maskThaiVowels,
  GameIcon, Btn, GhostBtn, Avatar, fmt, PillarBadge,
});
