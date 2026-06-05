// Admin desktop dashboard — overview, charts, players, export

const { BRAND, PILLARS, GAMES, GAME_BY_ID, LEADERBOARDS, FAKE_NAMES, SFB_PAIRS,
  GameIcon, Avatar, fmt, TWLogo } = window;

// Mock — last-7-day plays per game
const DAYS = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
const TODAY_PLAYS = { tap: 412, memory: 287, catch: 358, reaction: 195, whack: 248 };
const LIVE_NOW = { tap: 28, memory: 14, catch: 19, reaction: 9, whack: 17 };

// Aggregated peer-recognition results (mock) — per SFB behavior, who was
// named "the best" by their colleagues, with vote counts and avg time.
const PEER_VOTES = (() => {
  return SFB_PAIRS.map((q, qi) => {
    const offset = qi * 3;
    const ranked = Array.from({ length: 8 }).map((_, i) => {
      const ni = (offset + i * 2) % FAKE_NAMES.length;
      const [name, id] = FAKE_NAMES[ni];
      return {
        name, id,
        votes: Math.max(1, Math.round(38 - i * 5 - Math.random() * 4)),
        avgPick: +(2 + i * 0.4 + Math.random() * 1.2).toFixed(1),
      };
    });
    return { q, total: ranked.reduce((s, r) => s + r.votes, 0) + 12, top: ranked };
  });
})();

// Sample individual responses (for the "ดูคำตอบรายคน" view)
const PEER_RESPONSES = (() => {
  const rows = [];
  for (let i = 0; i < 18; i++) {
    const [name, id] = FAKE_NAMES[i % FAKE_NAMES.length];
    rows.push({
      respondent: name, respId: id,
      submittedAt: `${String((i * 17) % 24).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
      totalSec: +(28 + Math.random() * 35).toFixed(1),
      answers: SFB_PAIRS.map((q, qi) => {
        const pick = FAKE_NAMES[(i + qi * 3 + 2) % FAKE_NAMES.length];
        return { q, name: pick[0], timeMs: Math.round(1500 + Math.random() * 5000) };
      }),
    });
  }
  return rows;
})();

function seedDaily(base) {
  return DAYS.map(d => Math.round(base * (0.55 + Math.random() * 0.9)));
}
const SERIES = Object.fromEntries(GAMES.map(g => [g.id, seedDaily(TODAY_PLAYS[g.id] / 1.5)]));

// Hourly distribution for "now" view (24h)
const HOURLY = (() => {
  return GAMES.map(g => {
    const base = TODAY_PLAYS[g.id] / 24;
    return {
      id: g.id,
      data: Array.from({ length: 24 }, (_, h) => {
        // peak around 12 and 18
        const peak = Math.exp(-Math.pow(h - 12, 2) / 16) + 0.6 * Math.exp(-Math.pow(h - 18, 2) / 12);
        return Math.max(0, Math.round(base * (0.5 + 1.4 * peak) + (Math.random() * 4 - 2)));
      }),
    };
  });
})();

const ALL_PLAYERS = (() => {
  const rows = [];
  for (let i = 0; i < 28; i++) {
    const [name, id] = FAKE_NAMES[i % FAKE_NAMES.length];
    rows.push({
      name, id: id + (i < 15 ? '' : '-A'),
      dept: ['Production', 'R&D', 'Sales', 'HR', 'Finance', 'Logistics'][i % 6],
      lastPlayed: `${1 + (i % 23)} ชม. ที่แล้ว`,
      games: 12 + ((i * 7) % 80),
      best: GAMES[i % 5].name,
      bestScore: 45 + ((i * 13) % 50),
      online: i < 6,
    });
  }
  return rows;
})();

// ─────────────────────────────────────────────────────────────
// AdminApp — main dashboard
// ─────────────────────────────────────────────────────────────
function AdminApp() {
  const [tab, setTab] = React.useState('overview');
  return (
    <div style={{
      display: 'flex', height: '100%', background: '#f6f5f0',
      fontFamily: 'Prompt, system-ui',
    }}>
      <AdminSidebar tab={tab} setTab={setTab} />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'realtime' && <RealtimeTab />}
        {tab === 'players' && <PlayersTab />}
        {tab === 'leaderboard' && <LeaderboardTab />}
        {tab === 'peer' && <PeerRecognitionTab />}
        {tab === 'export' && <ExportTab />}
      </div>
    </div>
  );
}

function AdminSidebar({ tab, setTab }) {
  const items = [
    { id: 'overview', label: 'ภาพรวม', icon: 'M3 12l9-9 9 9 M5 10v10h14V10' },
    { id: 'realtime', label: 'Real-time', icon: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z M12 7v5l3 2' },
    { id: 'players', label: 'ผู้เล่น', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M22 21v-2a4 4 0 0 0-3-3.87 M17 3.13a4 4 0 0 1 0 7.75' },
    { id: 'leaderboard', label: 'อันดับ', icon: 'M7 4h10v3a5 5 0 0 1-10 0V4z M9 13h6v3H9z M8 19h8' },
    { id: 'peer', label: 'ใครคือที่สุด', icon: 'M12 2l2.5 6.5L21 9l-5 4.5 1.5 6.5L12 16l-5.5 4L8 13.5 3 9l6.5-.5z' },
    { id: 'export', label: 'Export', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3' },
  ];
  return (
    <div style={{
      width: 220, background: '#fff',
      borderRight: `1px solid ${BRAND.hairline}`,
      padding: '20px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px 18px' }}>
        <TWLogo size={32} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: BRAND.navy, lineHeight: 1.1 }}>SFB Game Zone</div>
          <div style={{ fontSize: 10, color: BRAND.inkSoft, letterSpacing: 1 }}>ADMIN CONSOLE</div>
        </div>
      </div>

      {items.map(it => (
        <button key={it.id} onClick={() => setTab(it.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: tab === it.id ? BRAND.navy + '12' : 'transparent',
            color: tab === it.id ? BRAND.navy : BRAND.ink,
            fontFamily: 'Prompt', fontSize: 14, fontWeight: tab === it.id ? 600 : 500,
            textAlign: 'left',
          }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={it.icon}/>
          </svg>
          {it.label}
        </button>
      ))}

      <div style={{ marginTop: 'auto', padding: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name="Admin" size={32} color={BRAND.ink} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.ink }}>คุณวิภา (Admin)</div>
          <div style={{ fontSize: 10, color: BRAND.inkSoft }}>HR Team</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OVERVIEW — KPIs + 7-day trend + per-game cards
// ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const totalPlaysToday = Object.values(TODAY_PLAYS).reduce((a, b) => a + b, 0);
  const liveTotal = Object.values(LIVE_NOW).reduce((a, b) => a + b, 0);
  return (
    <div style={{ padding: '24px 28px' }}>
      <AdminHeader title="ภาพรวม" sub="สถิติการเล่นเกมโดยรวม · อัปเดตอัตโนมัติ" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 18 }}>
        <BigKpi label="ผู้เล่นออนไลน์ตอนนี้" value={fmt.num(liveTotal)} sub="คน" trend="+12% วันนี้" color={BRAND.teal} live />
        <BigKpi label="จำนวนเล่นวันนี้" value={fmt.num(totalPlaysToday)} sub="ครั้ง" trend="+8.2% เทียบเมื่อวาน" color={BRAND.navy} />
        <BigKpi label="ผู้เล่นทั้งหมด" value={fmt.num(284)} sub="พนักงาน" trend="68% ของพนักงานบริษัท" color={BRAND.red} />
        <BigKpi label="เกมที่เล่นสะสม" value={fmt.num(8742)} sub="ครั้ง 7 วัน" trend="+1,204 จากสัปดาห์ก่อน" color="#d59a16" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14, marginTop: 18 }}>
        <Panel title="แนวโน้มการเล่นแยกตามเกม (7 วันย้อนหลัง)">
          <LineChart series={GAMES.map(g => ({ id: g.id, label: g.name, color: g.color, data: SERIES[g.id] }))}
            xLabels={DAYS} height={240} />
          <Legend items={GAMES.map(g => ({ label: g.name, color: g.color }))} />
        </Panel>

        <Panel title="สัดส่วนการเล่นวันนี้">
          <DonutChart segments={GAMES.map(g => ({ label: g.name, color: g.color, value: TODAY_PLAYS[g.id] }))} />
        </Panel>
      </div>

      <div style={{ marginTop: 18 }}>
        <Panel title="ภาพรวมแต่ละเกม">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: '6px 4px' }}>
            {GAMES.map(g => (
              <GameStatCard key={g.id} game={g} playsToday={TODAY_PLAYS[g.id]} live={LIVE_NOW[g.id]} top={LEADERBOARDS[g.id][0]} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function AdminHeader({ title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: BRAND.ink, letterSpacing: -0.4 }}>{title}</div>
        <div style={{ fontSize: 13, color: BRAND.inkSoft, marginTop: 2 }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          fontSize: 12, color: BRAND.inkSoft, background: '#fff',
          padding: '8px 12px', borderRadius: 10, border: `1px solid ${BRAND.hairline}`,
        }}>27 พ.ค. 2569 · 14:32</div>
        <button style={{
          background: BRAND.navy, color: '#fff', border: 'none',
          padding: '8px 14px', borderRadius: 10, fontFamily: 'Prompt', fontWeight: 600, fontSize: 13, cursor: 'pointer',
        }}>+ สร้างรายงาน</button>
      </div>
    </div>
  );
}

function BigKpi({ label, value, sub, trend, color, live }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: 18,
      border: `1px solid ${BRAND.hairline}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: BRAND.inkSoft }}>
        {live && <span style={{
          width: 8, height: 8, borderRadius: '50%', background: '#2dc66c',
          boxShadow: '0 0 0 0 #2dc66c70', animation: 'pulse 1.6s infinite',
        }} />}
        {label}
        <style>{`@keyframes pulse { 0% { box-shadow:0 0 0 0 #2dc66c80 } 70% { box-shadow:0 0 0 8px transparent } 100% { box-shadow:0 0 0 0 transparent } }`}</style>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
        <div style={{ fontSize: 34, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5 }}>{value}</div>
        <div style={{ fontSize: 13, color: BRAND.inkSoft }}>{sub}</div>
      </div>
      <div style={{ fontSize: 11, color: BRAND.inkSoft, marginTop: 4 }}>{trend}</div>
    </div>
  );
}

function Panel({ title, children, action }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: 18,
      border: `1px solid ${BRAND.hairline}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.ink }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function GameStatCard({ game, playsToday, live, top }) {
  return (
    <div style={{
      background: game.bg, borderRadius: 14, padding: 14,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <GameIcon kind={game.icon} size={32} color="#fff" bg={game.color} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: BRAND.ink, lineHeight: 1.1 }}>{game.name}</div>
          <div style={{ fontSize: 10, color: BRAND.inkSoft }}>{game.en}</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 11, color: BRAND.inkSoft }}>เล่นวันนี้</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: game.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fmt.num(playsToday)}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <div>
          <div style={{ color: BRAND.inkSoft }}>ออนไลน์</div>
          <div style={{ color: BRAND.ink, fontWeight: 700 }}>{live} คน</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: BRAND.inkSoft }}>คะแนนสูงสุด</div>
          <div style={{ color: BRAND.ink, fontWeight: 700 }}>{fmt.score(top)}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// REAL-TIME — live activity + hourly distribution
// ─────────────────────────────────────────────────────────────
function RealtimeTab() {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 2500);
    return () => clearInterval(t);
  }, []);

  // Live feed — generate synthetic activity events
  const feed = React.useMemo(() => {
    const events = [];
    for (let i = 0; i < 14; i++) {
      const g = GAMES[Math.floor(Math.random() * GAMES.length)];
      const n = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
      events.push({
        id: tick * 100 + i,
        name: n[0], empId: n[1], game: g,
        action: ['เริ่มเล่น', 'จบเกม', 'ทำคะแนนใหม่!', 'เริ่มเล่น'][i % 4],
        score: Math.round(Math.random() * 80) + 10,
        time: ['เมื่อสักครู่', '1 นาที', '2 นาที', '3 นาที', '5 นาที', '7 นาที'][Math.min(5, Math.floor(i / 2))],
      });
    }
    return events;
  }, [tick]);

  return (
    <div style={{ padding: '24px 28px' }}>
      <AdminHeader title="Real-time" sub="ผู้เล่นที่กำลังออนไลน์และกิจกรรมในขณะนี้" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 18 }}>
        {GAMES.map(g => (
          <div key={g.id} style={{
            background: '#fff', borderRadius: 14, padding: 14,
            border: `1px solid ${BRAND.hairline}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <GameIcon kind={g.icon} size={42} color="#fff" bg={g.color} />
            <div>
              <div style={{ fontSize: 12, color: BRAND.inkSoft }}>{g.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: g.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{LIVE_NOW[g.id]}</div>
                <div style={{ fontSize: 11, color: BRAND.inkSoft }}>ออนไลน์</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginTop: 18 }}>
        <Panel title="การเล่นรายชั่วโมง (วันนี้)">
          <StackedBars series={HOURLY.map(h => ({ ...h, color: GAME_BY_ID[h.id].color, label: GAME_BY_ID[h.id].name }))}
            xLabels={Array.from({length:24}, (_,i) => i % 4 === 0 ? `${String(i).padStart(2,'0')}:00` : '')} height={220} />
          <Legend items={GAMES.map(g => ({ label: g.name, color: g.color }))} />
        </Panel>

        <Panel title="ฟีดกิจกรรมล่าสุด"
          action={<div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#2dc66c' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dc66c' }} />LIVE
          </div>}>
          <div style={{ maxHeight: 240, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {feed.map(ev => (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', background: BRAND.paper, borderRadius: 10,
              }}>
                <Avatar name={ev.name} size={28} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: BRAND.ink }}>
                    <span style={{ fontWeight: 600 }}>{ev.name}</span>
                    <span style={{ color: BRAND.inkSoft }}> · {ev.action} </span>
                    <span style={{ color: ev.game.color, fontWeight: 600 }}>{ev.game.name}</span>
                  </div>
                  <div style={{ fontSize: 10, color: BRAND.muted }}>{ev.empId} · {ev.time}</div>
                </div>
                {ev.action === 'จบเกม' && (
                  <div style={{
                    background: ev.game.color + '15', color: ev.game.color,
                    padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  }}>{ev.score}</div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PLAYERS — table with filters
// ─────────────────────────────────────────────────────────────
function PlayersTab() {
  const [search, setSearch] = React.useState('');
  const [dept, setDept] = React.useState('all');

  const filtered = ALL_PLAYERS.filter(p =>
    (dept === 'all' || p.dept === dept) &&
    (p.name.includes(search) || p.id.toLowerCase().includes(search.toLowerCase()))
  );

  const depts = ['all', ...new Set(ALL_PLAYERS.map(p => p.dept))];

  return (
    <div style={{ padding: '24px 28px' }}>
      <AdminHeader title="ผู้เล่นทั้งหมด" sub={`พบ ${fmt.num(filtered.length)} จาก ${fmt.num(ALL_PLAYERS.length)} คน`} />

      <Panel title="" action={null}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            background: BRAND.paper, padding: '8px 14px', borderRadius: 10,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={BRAND.muted} strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อหรือรหัสพนักงาน..."
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                fontFamily: 'Prompt', fontSize: 13, flex: 1, color: BRAND.ink,
              }} />
          </div>
          <select value={dept} onChange={e => setDept(e.target.value)} style={{
            border: `1px solid ${BRAND.hairline}`, borderRadius: 10,
            padding: '8px 14px', fontFamily: 'Prompt', fontSize: 13, color: BRAND.ink,
            background: '#fff',
          }}>
            {depts.map(d => <option key={d} value={d}>{d === 'all' ? 'ทุกแผนก' : d}</option>)}
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: BRAND.inkSoft, fontSize: 11, fontWeight: 500, textAlign: 'left' }}>
              <th style={th()}>พนักงาน</th>
              <th style={th()}>รหัส</th>
              <th style={th()}>แผนก</th>
              <th style={th()}>เล่นล่าสุด</th>
              <th style={th()}>จำนวนเกม</th>
              <th style={th()}>เกมที่เก่งที่สุด</th>
              <th style={th()}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 14).map((p, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${BRAND.hairline}` }}>
                <td style={td()}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={p.name} size={28} />
                    <div style={{ fontWeight: 600, color: BRAND.ink }}>{p.name}</div>
                  </div>
                </td>
                <td style={{ ...td(), color: BRAND.inkSoft, fontFamily: 'Prompt', fontVariantNumeric: 'tabular-nums' }}>{p.id}</td>
                <td style={td()}>{p.dept}</td>
                <td style={{ ...td(), color: BRAND.inkSoft }}>{p.lastPlayed}</td>
                <td style={{ ...td(), fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{p.games}</td>
                <td style={td()}>{p.best}</td>
                <td style={td()}>
                  {p.online
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2dc66c', fontWeight: 600, fontSize: 12 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2dc66c' }} />ออนไลน์
                      </span>
                    : <span style={{ color: BRAND.muted, fontSize: 12 }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function th() { return { padding: '8px 12px', textTransform: 'uppercase', letterSpacing: 0.5 }; }
function td() { return { padding: '12px', color: BRAND.ink }; }

// ─────────────────────────────────────────────────────────────
// LEADERBOARD — top players per game
// ─────────────────────────────────────────────────────────────
function LeaderboardTab() {
  return (
    <div style={{ padding: '24px 28px' }}>
      <AdminHeader title="อันดับคะแนนสูงสุด" sub="Top 5 ของแต่ละเกม · อัปเดต real-time" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 18 }}>
        {GAMES.map(g => (
          <Panel key={g.id} title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GameIcon kind={g.icon} size={26} color="#fff" bg={g.color} />
              <span style={{ color: g.color, fontWeight: 700 }}>{g.name}</span>
            </span>
          }>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {LEADERBOARDS[g.id].slice(0, 5).map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 6px', borderTop: i > 0 ? `1px solid ${BRAND.hairline}` : 'none',
                }}>
                  <div style={{
                    width: 24, fontSize: 12, fontWeight: 700,
                    color: i < 3 ? g.color : BRAND.inkSoft, textAlign: 'center',
                  }}>{['🥇','🥈','🥉'][i] || (i+1)}</div>
                  <Avatar name={r.name} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.ink }}>{r.name}</div>
                    <div style={{ fontSize: 10, color: BRAND.muted }}>{r.id}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: g.color, fontVariantNumeric: 'tabular-nums', fontSize: 16 }}>{fmt.num(r.score)}</div>
                  <div style={{ fontSize: 10, color: BRAND.muted, width: 22 }}>{r.unit}</div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PEER RECOGNITION — aggregated results of "ใครคือที่สุด" quiz
// ─────────────────────────────────────────────────────────────
function PeerRecognitionTab() {
  const [view, setView] = React.useState('summary'); // summary | responses
  const [selectedResp, setSelectedResp] = React.useState(null);

  const totalResp = PEER_RESPONSES.length;
  const avgTotalSec = +(PEER_RESPONSES.reduce((s, r) => s + r.totalSec, 0) / totalResp).toFixed(1);

  return (
    <div style={{ padding: '24px 28px' }}>
      <AdminHeader title="ใครคือที่สุด" sub="ผลลัพธ์รวมจากเกม Peer Recognition · 9 พฤติกรรม SFB" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 18 }}>
        <BigKpi label="พนักงานที่ตอบแล้ว" value={fmt.num(totalResp)} sub="คน" trend={`คิดเป็น ${Math.round(totalResp/284*100)}% ของพนักงาน`} color={BRAND.navy} />
        <BigKpi label="ตอบครบ 9 ข้อ" value={fmt.num(totalResp - 2)} sub="คน" trend="2 คนยังไม่จบ" color={BRAND.teal} />
        <BigKpi label="เวลาตอบเฉลี่ย" value={avgTotalSec.toFixed(1)} sub="วินาที" trend="≈ 5 วินาที/ข้อ" color="#d59a16" />
        <BigKpi label="พฤติกรรมรวม" value="9" sub="ข้อ" trend="Stronger·Faster·Better อย่างละ 3" color={BRAND.red} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        {[['summary','ผลรวมแยกตามพฤติกรรม'], ['responses','คำตอบรายคน']].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: view === v ? BRAND.navy : '#fff',
            color: view === v ? '#fff' : BRAND.ink,
            border: `1px solid ${view === v ? BRAND.navy : BRAND.hairline}`,
            fontFamily: 'Prompt', fontSize: 13, fontWeight: 600,
          }}>{label}</button>
        ))}
      </div>

      {view === 'summary' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 14 }}>
          {PEER_VOTES.map((pv, i) => {
            const p = PILLARS[pv.q.pillar];
            return (
              <div key={i} style={{
                background: '#fff', borderRadius: 16, padding: 16,
                border: `1px solid ${BRAND.hairline}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 20 }}>{pv.q.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: p.color, letterSpacing: 0.6, textTransform: 'uppercase' }}>{p.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.ink, lineHeight: 1.1 }}>{pv.q.concept}</div>
                    <div style={{ fontSize: 10, color: BRAND.inkSoft }}>{pv.q.desc}</div>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pv.top.slice(0, 5).map((r, j) => {
                    const pct = Math.round(r.votes / pv.top[0].votes * 100);
                    return (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', padding: '4px 0' }}>
                        <div style={{
                          width: 18, fontSize: 11, fontWeight: 700,
                          color: j < 3 ? p.color : BRAND.muted, textAlign: 'center',
                        }}>{['🥇','🥈','🥉'][j] || (j+1)}</div>
                        <Avatar name={r.name} size={24} />
                        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                          <div style={{
                            position: 'absolute', inset: 0, top: 8, height: 4,
                            background: BRAND.hairline, borderRadius: 999,
                          }} />
                          <div style={{
                            position: 'absolute', left: 0, top: 8, height: 4,
                            width: pct + '%', background: p.color, borderRadius: 999,
                          }} />
                          <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.ink, lineHeight: 1, paddingBottom: 6 }}>{r.name}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: p.color, fontVariantNumeric: 'tabular-nums', minWidth: 24, textAlign: 'right' }}>{r.votes}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{
                  marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BRAND.hairline}`,
                  fontSize: 10, color: BRAND.inkSoft,
                }}>
                  รวม {fmt.num(pv.total)} โหวต
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'responses' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedResp ? '1fr 1.4fr' : '1fr', gap: 14, marginTop: 14 }}>
          <Panel title="คำตอบรายคน">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: BRAND.inkSoft, fontSize: 11, fontWeight: 500, textAlign: 'left' }}>
                  <th style={th()}>พนักงาน</th>
                  <th style={th()}>รหัส</th>
                  <th style={th()}>เวลา</th>
                  <th style={th()}>ส่งเมื่อ</th>
                  <th style={th()}></th>
                </tr>
              </thead>
              <tbody>
                {PEER_RESPONSES.map((r, i) => (
                  <tr key={i} style={{
                    borderTop: `1px solid ${BRAND.hairline}`,
                    background: selectedResp === i ? BRAND.navy + '08' : 'transparent',
                    cursor: 'pointer',
                  }} onClick={() => setSelectedResp(i)}>
                    <td style={td()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={r.respondent} size={26} />
                        <div style={{ fontWeight: 600 }}>{r.respondent}</div>
                      </div>
                    </td>
                    <td style={{ ...td(), color: BRAND.inkSoft, fontVariantNumeric: 'tabular-nums' }}>{r.respId}</td>
                    <td style={{ ...td(), fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{r.totalSec}s</td>
                    <td style={{ ...td(), color: BRAND.inkSoft }}>{r.submittedAt}</td>
                    <td style={{ ...td(), textAlign: 'right' }}>
                      <button style={{
                        border: 'none', background: BRAND.navy + '10', color: BRAND.navy,
                        padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
                        fontFamily: 'Prompt', fontSize: 11, fontWeight: 600,
                      }}>ดูคำตอบ →</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {selectedResp !== null && (
            <Panel title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={PEER_RESPONSES[selectedResp].respondent} size={26} />
                {PEER_RESPONSES[selectedResp].respondent}
                <span style={{ color: BRAND.muted, fontWeight: 400, fontSize: 12 }}>
                  ({PEER_RESPONSES[selectedResp].respId} · เวลารวม {PEER_RESPONSES[selectedResp].totalSec}s)
                </span>
              </span>
            } action={
              <button onClick={() => setSelectedResp(null)} style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: BRAND.muted, fontSize: 18, padding: 0, lineHeight: 1,
              }}>×</button>
            }>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PEER_RESPONSES[selectedResp].answers.map((a, i) => {
                  const p = PILLARS[a.q.pillar];
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', background: BRAND.paper, borderRadius: 10,
                    }}>
                      <div style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{a.q.emoji}</div>
                      <div style={{ minWidth: 110 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: p.color, lineHeight: 1.1 }}>{a.q.concept}</div>
                        <div style={{ fontSize: 10, color: BRAND.muted, marginTop: 1 }}>{a.q.desc}</div>
                      </div>
                      <div style={{ fontSize: 16, color: BRAND.muted }}>→</div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={a.name} size={26} />
                        <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.ink, lineHeight: 1.1 }}>{a.name}</div>
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 700, color: BRAND.inkSoft,
                        fontVariantNumeric: 'tabular-nums',
                        background: '#fff', padding: '3px 8px', borderRadius: 999,
                      }}>{(a.timeMs / 1000).toFixed(1)}s</div>
                    </div>
                  );
                })}
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EXPORT — CSV/Excel preview
// ─────────────────────────────────────────────────────────────
function ExportTab() {
  const [scope, setScope] = React.useState('all');
  const [format, setFormat] = React.useState('csv');
  const [range, setRange] = React.useState('7d');
  const [done, setDone] = React.useState(false);

  const handleExport = () => {
    setDone(false);
    setTimeout(() => setDone(true), 800);
  };

  return (
    <div style={{ padding: '24px 28px' }}>
      <AdminHeader title="Export ข้อมูล" sub="ดาวน์โหลดข้อมูลผู้เล่น คะแนน และสถิติเป็น CSV หรือ Excel" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14, marginTop: 18 }}>
        <Panel title="ตั้งค่าการ Export">
          <FieldGroup label="ข้อมูลที่ต้องการ">
            {[
              ['all', 'ข้อมูลทั้งหมด'],
              ['scores', 'คะแนนแต่ละเกม'],
              ['players', 'รายชื่อผู้เล่น'],
              ['sessions', 'การเล่นแต่ละครั้ง'],
            ].map(([v, label]) => (
              <Radio key={v} checked={scope === v} onChange={() => setScope(v)} label={label} />
            ))}
          </FieldGroup>

          <FieldGroup label="ช่วงเวลา">
            <div style={{ display: 'flex', gap: 6 }}>
              {[['1d','วันนี้'],['7d','7 วัน'],['30d','30 วัน'],['all','ทั้งหมด']].map(([v, label]) => (
                <button key={v} onClick={() => setRange(v)} style={{
                  flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: range === v ? BRAND.navy : '#fff',
                  color: range === v ? '#fff' : BRAND.ink,
                  border: `1px solid ${range === v ? BRAND.navy : BRAND.hairline}`,
                  fontFamily: 'Prompt', fontSize: 12, fontWeight: 600,
                }}>{label}</button>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label="รูปแบบไฟล์">
            <div style={{ display: 'flex', gap: 8 }}>
              {[['csv','CSV (.csv)', BRAND.teal], ['xlsx','Excel (.xlsx)', '#1f8a4d']].map(([v, label, c]) => (
                <button key={v} onClick={() => setFormat(v)} style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: `1.5px solid ${format === v ? c : BRAND.hairline}`,
                  background: format === v ? c + '12' : '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 32, height: 38, borderRadius: 4, background: c,
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Prompt', fontWeight: 700, fontSize: 10,
                  }}>{v.toUpperCase()}</div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.ink }}>{label.split(' ')[0]}</div>
                    <div style={{ fontSize: 11, color: BRAND.inkSoft }}>{label.split(' ')[1]}</div>
                  </div>
                </button>
              ))}
            </div>
          </FieldGroup>

          <button onClick={handleExport} style={{
            marginTop: 16, width: '100%', background: BRAND.navy, color: '#fff',
            border: 'none', borderRadius: 12, padding: '12px',
            fontFamily: 'Prompt', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3"/></svg>
            ดาวน์โหลด
          </button>
          {done && (
            <div style={{
              marginTop: 10, padding: 10, borderRadius: 10,
              background: BRAND.mint, color: BRAND.tealDeep, fontSize: 12, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              ✓ พร้อมดาวน์โหลด: <strong>arcade_{scope}_{range}.{format}</strong>
            </div>
          )}
        </Panel>

        <Panel title="ตัวอย่างข้อมูล">
          <div style={{ overflow: 'auto', maxHeight: 380 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Prompt' }}>
              <thead>
                <tr style={{ background: BRAND.paper }}>
                  {['employee_id','name','department','game','score','played_at'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: BRAND.inkSoft, letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({length: 12}).map((_, i) => {
                  const [name, id] = FAKE_NAMES[i % FAKE_NAMES.length];
                  const g = GAMES[i % 5];
                  const sc = LEADERBOARDS[g.id][i % 8].score;
                  return (
                    <tr key={i} style={{ borderTop: `1px solid ${BRAND.hairline}` }}>
                      <td style={{ padding: '7px 10px', fontVariantNumeric: 'tabular-nums', color: BRAND.inkSoft }}>{id}</td>
                      <td style={{ padding: '7px 10px', color: BRAND.ink }}>{name}</td>
                      <td style={{ padding: '7px 10px', color: BRAND.inkSoft }}>{['Production','R&D','Sales','HR','Finance'][i%5]}</td>
                      <td style={{ padding: '7px 10px', color: g.color, fontWeight: 600 }}>{g.en}</td>
                      <td style={{ padding: '7px 10px', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{sc}</td>
                      <td style={{ padding: '7px 10px', color: BRAND.muted, fontVariantNumeric: 'tabular-nums' }}>2026-05-27 {String(8+i).padStart(2,'0')}:{String((i*7)%60).padStart(2,'0')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: BRAND.inkSoft, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function Radio({ checked, onChange, label }) {
  return (
    <label onClick={onChange} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
      borderRadius: 10, cursor: 'pointer',
      background: checked ? BRAND.navy + '10' : 'transparent',
      border: `1px solid ${checked ? BRAND.navy + '40' : 'transparent'}`,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        border: `2px solid ${checked ? BRAND.navy : BRAND.muted}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{checked && <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND.navy }} />}</div>
      <div style={{ fontSize: 13, color: BRAND.ink, fontFamily: 'Prompt' }}>{label}</div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────
// CHARTS — simple SVG (no library)
// ─────────────────────────────────────────────────────────────
function LineChart({ series, xLabels, height = 200 }) {
  const W = 700, H = height;
  const PAD = { l: 36, r: 16, t: 14, b: 28 };
  const maxY = Math.max(...series.flatMap(s => s.data)) * 1.15 || 1;
  const xStep = (W - PAD.l - PAD.r) / (xLabels.length - 1);
  const yScale = (v) => H - PAD.b - (v / maxY) * (H - PAD.t - PAD.b);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PAD.t + t * (H - PAD.t - PAD.b);
        return <g key={i}>
          <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke={BRAND.hairline} strokeWidth="1" />
          <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill={BRAND.muted} fontFamily="Prompt">
            {Math.round((1 - t) * maxY)}
          </text>
        </g>;
      })}
      {/* x labels */}
      {xLabels.map((lbl, i) => (
        <text key={i} x={PAD.l + i * xStep} y={H - 10} textAnchor="middle" fontSize="10" fill={BRAND.inkSoft} fontFamily="Prompt">{lbl}</text>
      ))}
      {/* lines */}
      {series.map(s => {
        const pts = s.data.map((v, i) => `${PAD.l + i * xStep},${yScale(v)}`).join(' ');
        return <g key={s.id}>
          <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {s.data.map((v, i) => (
            <circle key={i} cx={PAD.l + i * xStep} cy={yScale(v)} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />
          ))}
        </g>;
      })}
    </svg>
  );
}

function StackedBars({ series, xLabels, height = 200 }) {
  const W = 600, H = height;
  const PAD = { l: 30, r: 12, t: 12, b: 28 };
  const len = series[0].data.length;
  const totals = Array.from({ length: len }, (_, i) =>
    series.reduce((sum, s) => sum + s.data[i], 0)
  );
  const maxY = Math.max(...totals) * 1.1 || 1;
  const barW = (W - PAD.l - PAD.r) / len * 0.78;
  const xStep = (W - PAD.l - PAD.r) / len;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {[0, 0.5, 1].map((t, i) => {
        const y = PAD.t + t * (H - PAD.t - PAD.b);
        return <line key={i} x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke={BRAND.hairline} />;
      })}
      {Array.from({length: len}).map((_, i) => {
        let yAcc = H - PAD.b;
        return series.map(s => {
          const v = s.data[i];
          const h = (v / maxY) * (H - PAD.t - PAD.b);
          yAcc -= h;
          return <rect key={s.id + i} x={PAD.l + i * xStep + (xStep - barW) / 2} y={yAcc}
            width={barW} height={h} fill={s.color} opacity="0.92" />;
        });
      })}
      {xLabels.map((lbl, i) => lbl && (
        <text key={i} x={PAD.l + i * xStep + xStep / 2} y={H - 10}
          textAnchor="middle" fontSize="9" fill={BRAND.inkSoft} fontFamily="Prompt">{lbl}</text>
      ))}
    </svg>
  );
}

function DonutChart({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = 70, r = 44, cx = 100, cy = 100;
  let acc = 0;
  const arcs = segments.map(s => {
    const start = acc / total * Math.PI * 2 - Math.PI / 2;
    acc += s.value;
    const end = acc / total * Math.PI * 2 - Math.PI / 2;
    const large = end - start > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
    const xi2 = cx + r * Math.cos(end), yi2 = cy + r * Math.sin(end);
    const xi1 = cx + r * Math.cos(start), yi1 = cy + r * Math.sin(start);
    return { d: `M${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} L${xi2} ${yi2} A${r} ${r} 0 ${large} 0 ${xi1} ${yi1} Z`, color: s.color, label: s.label, value: s.value };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg viewBox="0 0 200 200" style={{ width: 180, height: 180 }}>
        {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
        <text x="100" y="96" textAnchor="middle" fontSize="11" fill={BRAND.inkSoft} fontFamily="Prompt">รวม</text>
        <text x="100" y="118" textAnchor="middle" fontSize="22" fontWeight="800" fill={BRAND.ink} fontFamily="Prompt">{fmt.num(total)}</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
            <div style={{ flex: 1, color: BRAND.ink }}>{s.label}</div>
            <div style={{ color: BRAND.inkSoft, fontVariantNumeric: 'tabular-nums' }}>{fmt.num(s.value)}</div>
            <div style={{ color: BRAND.muted, width: 36, textAlign: 'right', fontSize: 11 }}>{Math.round(s.value/total*100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ items }) {
  return (
    <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: BRAND.inkSoft }}>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: it.color }} />
          {it.label}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { AdminApp });
