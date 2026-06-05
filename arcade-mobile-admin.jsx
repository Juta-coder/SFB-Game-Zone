// Mobile Admin — password gate ("Admin2026") → compact admin panel that
// generates a REAL .xlsx report instantly and offers one-tap logout.
// Designed to live inside the MobileApp state machine on a phone screen.

const {
  BRAND: A_BRAND, GAMES: A_GAMES, LEADERBOARDS: A_LB, FAKE_NAMES: A_NAMES,
  PILLARS: A_PILLARS, SFB_PAIRS: A_PAIRS, Avatar: A_Avatar, fmt: A_fmt,
} = window;

const ADMIN_PASSWORD = 'Admin2026';

// ─────────────────────────────────────────────────────────────
// MobileAdmin — entry component (gate → panel)
//   props: onExit()  — return to the player app
// ─────────────────────────────────────────────────────────────
// Build report sheets from LIVE Google Sheet data (action=report)
function buildReportFromLive(data, rangeLabel) {
  const stamp = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  const scores = data.scores || [];
  const peer = data.peer || [];

  const byGame = {};
  scores.forEach(s => { const k = s.gameName || s.gameId; byGame[k] = (byGame[k] || 0) + 1; });

  const overview = [
    ['SFB Game Zone — รายงานสรุป (ข้อมูลจริงจาก Google Sheet)', ''],
    ['ช่วงข้อมูล', rangeLabel],
    ['สร้างเมื่อ', stamp],
    ['', ''],
    ['ตัวชี้วัด', 'ค่า'],
    ['จำนวนการเล่นทั้งหมด (ครั้ง)', scores.length],
    ['ผู้เล่นไม่ซ้ำ (คน)', new Set(scores.map(s => s.empId)).size],
    ['ผู้ตอบ “ใครคือที่สุด” (คน)', new Set(peer.map(p => p.empId)).size],
    ['', ''],
    ['เกม', 'จำนวนเล่น'],
    ...Object.entries(byGame).map(([g, c]) => [g, c]),
  ];

  const scoreRows = [['timestamp', 'employee_id', 'name', 'department', 'game', 'pillar', 'score', 'unit']];
  scores.forEach(s => scoreRows.push([
    s.ts || '', s.empId || '', s.name || '', s.dept || '',
    s.gameName || s.gameId || '', s.pillar || '', Number(s.score) || 0, s.unit || '',
  ]));

  const peerRows = [['timestamp', 'respondent_id', 'respondent', 'behavior', 'pillar', 'picked_name', 'time_sec']];
  peer.forEach(p => peerRows.push([
    p.ts || '', p.empId || '', p.name || '', p.behavior || '', p.pillar || '',
    p.pickedName || '', p.timeMs ? +(p.timeMs / 1000).toFixed(1) : '',
  ]));

  return [
    { name: 'สรุปภาพรวม', rows: overview },
    { name: 'คะแนนผู้เล่น', rows: scoreRows },
    { name: 'ใครคือที่สุด', rows: peerRows },
  ];
}

function MobileAdmin({ onExit }) {
  const [authed, setAuthed] = React.useState(false);
  return authed
    ? <AdminPanel onLogout={() => { setAuthed(false); onExit && onExit(); }} />
    : <AdminGate onSuccess={() => setAuthed(true)} onCancel={onExit} />;
}

// ── Password gate ──────────────────────────────────────────────
function AdminGate({ onSuccess, onCancel }) {
  const [pw, setPw] = React.useState('');
  const [err, setErr] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const inputRef = React.useRef(null);

  const submit = () => {
    if (pw === ADMIN_PASSWORD) { setErr(false); onSuccess(); }
    else { setErr(true); }
  };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      padding: '56px 26px 26px',
      background: `linear-gradient(180deg, ${A_BRAND.navy} 0%, ${A_BRAND.navyDeep} 100%)`,
    }}>
      <button onClick={onCancel} style={{
        width: 40, height: 40, borderRadius: '50%', border: 'none',
        background: 'rgba(255,255,255,0.14)', color: '#fff', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: 76, height: 76, borderRadius: 24, background: 'rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.18)',
        }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
          </svg>
        </div>
        <div style={{ marginTop: 18, fontSize: 22, fontWeight: 800, color: '#fff' }}>ผู้ดูแลระบบ</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, textAlign: 'center' }}>
          กรอกรหัสผ่านเพื่อเข้าสู่แผงควบคุม
        </div>
      </div>

      <div style={{ marginTop: 30 }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8, fontWeight: 500 }}>รหัสผ่านผู้ดูแล</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.1)', borderRadius: 16,
          border: `1.5px solid ${err ? A_BRAND.red : 'rgba(255,255,255,0.2)'}`,
          padding: '4px 8px 4px 16px',
        }}>
          <input
            ref={inputRef}
            type={show ? 'text' : 'password'}
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(false); }}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="••••••••"
            autoFocus
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontFamily: 'Prompt', fontSize: 18, fontWeight: 600,
              letterSpacing: show ? 1 : 3, padding: '12px 0',
            }}
          />
          <button onClick={() => setShow(s => !s)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 8,
            color: 'rgba(255,255,255,0.6)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {show
                ? <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>
                : <><path d="M17.94 17.94A10 10 0 0 1 12 20C5.5 20 2 13 2 13a18 18 0 0 1 5-5.94M9.9 4.24A9 9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.16 3.19M1 1l22 22"/></>}
            </svg>
          </button>
        </div>
        {err && (
          <div style={{ marginTop: 10, fontSize: 12, color: '#ffb3b7', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            รหัสผ่านไม่ถูกต้อง ลองใหม่อีกครั้ง
          </div>
        )}
      </div>

      <button onClick={submit} style={{
        marginTop: 22, width: '100%', background: '#fff', color: A_BRAND.navy,
        border: 'none', borderRadius: 16, padding: '16px',
        fontFamily: 'Prompt', fontSize: 16, fontWeight: 700, cursor: 'pointer',
      }}>เข้าสู่ระบบ</button>

      <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
        เฉพาะทีมผู้ดูแล · Thai Wah HR
      </div>
    </div>
  );
}

// ── Admin panel (compact, mobile) ──────────────────────────────
function AdminPanel({ onLogout }) {
  const [range, setRange] = React.useState('7d');
  const [busy, setBusy] = React.useState(false);
  const [lastFile, setLastFile] = React.useState(null);
  const [source, setSource] = React.useState(null); // 'live' | 'demo'
  const connected = !!(window.ArcadeAPI && window.ArcadeAPI.isLive());

  const RANGES = [['1d', 'วันนี้'], ['7d', '7 วัน'], ['30d', '30 วัน'], ['all', 'ทั้งหมด']];
  const rangeLabel = RANGES.find(r => r[0] === range)[1];

  const [data, setData] = React.useState(null); // { scores, peer }
  React.useEffect(() => {
    let alive = true;
    Promise.all([
      window.ArcadeAPI ? window.ArcadeAPI.loadScores() : Promise.resolve([]),
      window.ArcadeAPI ? window.ArcadeAPI.loadPeer() : Promise.resolve([]),
    ]).then(([s, p]) => { if (alive) setData({ scores: s || [], peer: p || [] }); });
    return () => { alive = false; };
  }, []);
  const totalPlays = data ? data.scores.length : null;
  const uniquePlayers = data ? new Set(data.scores.map(s => s.empId || s.name)).size : null;
  const peerResp = data ? new Set(data.peer.map(p => p.empId || p.name)).size : null;
  const show = (v) => data === null ? '…' : A_fmt.num(v);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setLastFile(null);
    try {
      // โหลดข้อมูลใหม่ทุกครั้งที่กด — ป้องกัน stale data
      const [freshScores, freshPeer] = await Promise.all([
        window.ArcadeAPI ? window.ArcadeAPI.loadScores() : Promise.resolve([]),
        window.ArcadeAPI ? window.ArcadeAPI.loadPeer()   : Promise.resolve([]),
      ]);
      const src = { scores: freshScores || [], peer: freshPeer || [] };
      setData(src); // อัปเดต stats ด้วย
      const sheets = buildReportFromLive(src, rangeLabel);
      const blob = window.buildXLSX(sheets);
      const tag = connected ? 'live' : 'local';
      const today = new Date().toISOString().slice(0, 10);
      const fname = `SFB_Arcade_report_${range}_${tag}_${today}.xlsx`;
      window.downloadBlob(blob, fname);
      setLastFile(fname);
      setSource(connected ? 'live' : 'local');
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: A_BRAND.paper, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '52px 22px 18px',
        background: `linear-gradient(160deg, ${A_BRAND.navy} 0%, ${A_BRAND.navyDeep} 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,0.14)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>SFB Game Zone · ผู้ดูแล</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginTop: -1 }}>แผงควบคุม</div>
          </div>
          <button onClick={onLogout} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.14)', color: '#fff', border: 'none',
            padding: '9px 14px', borderRadius: 999, cursor: 'pointer',
            fontFamily: 'Prompt', fontSize: 13, fontWeight: 600,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            ออก
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 32px' }}>
        {/* Connection status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 9,
          background: connected ? A_BRAND.mint : A_BRAND.butter,
          borderRadius: 12, padding: '10px 13px', marginBottom: 14,
        }}>
          <span style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: connected ? '#2dc66c' : '#d59a16',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: A_BRAND.ink }}>
              {connected ? 'เชื่อมต่อ Google Sheet แล้ว' : 'โหมดตัวอย่าง (ยังไม่เชื่อม Sheet)'}
            </div>
            <div style={{ fontSize: 11, color: A_BRAND.inkSoft }}>
              {connected ? 'รายงานจะใช้ข้อมูลจริงจากชีต' : 'รายงานจะใช้ข้อมูลตัวอย่าง — ตั้งค่าใน arcade-config.jsx'}
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <AdminStat label="เล่นทั้งหมด" value={show(totalPlays)} sub="ครั้ง" color={A_BRAND.navy} />
          <AdminStat label="ผู้เล่น" value={show(uniquePlayers)} sub="คน" color={A_BRAND.teal} />
          <AdminStat label="ตอบ ‘ใครคือที่สุด’" value={show(peerResp)} sub="คน" color="#d59a16" />
          <AdminStat label="เกมทั้งหมด" value={A_fmt.num(A_GAMES.length)} sub="เกม" color={A_BRAND.red} />
        </div>

        {/* Report card */}
        <div style={{
          marginTop: 16, background: '#fff', borderRadius: 22, padding: 20,
          boxShadow: '0 4px 16px rgba(37,36,120,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 52, borderRadius: 8, background: '#1f8a4d',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Prompt', fontWeight: 800, fontSize: 13, flexShrink: 0,
            }}>XLS</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: A_BRAND.ink }}>รายงาน Excel</div>
              <div style={{ fontSize: 12, color: A_BRAND.inkSoft, marginTop: 1 }}>3 ชีต · สรุป · คะแนนผู้เล่น · ใครคือที่สุด</div>
            </div>
          </div>

          {/* range chips */}
          <div style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: A_BRAND.inkSoft }}>ช่วงเวลา</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {RANGES.map(([v, label]) => (
              <button key={v} onClick={() => setRange(v)} style={{
                flex: 1, padding: '9px 4px', borderRadius: 10, cursor: 'pointer',
                background: range === v ? A_BRAND.navy : A_BRAND.paper,
                color: range === v ? '#fff' : A_BRAND.ink,
                border: `1.5px solid ${range === v ? A_BRAND.navy : A_BRAND.hairline}`,
                fontFamily: 'Prompt', fontSize: 12, fontWeight: 600,
              }}>{label}</button>
            ))}
          </div>

          {/* generate button */}
          <button onClick={generate} disabled={busy} style={{
            marginTop: 16, width: '100%', background: busy ? A_BRAND.muted : '#1f8a4d',
            color: '#fff', border: 'none', borderRadius: 14, padding: '15px',
            fontFamily: 'Prompt', fontSize: 15, fontWeight: 700,
            cursor: busy ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          }}>
            {busy ? (
              <>
                <span style={{
                  width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)',
                  borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                  animation: 'aspin 0.7s linear infinite',
                }} />
                กำลังสร้าง...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                สร้างรายงาน Excel
              </>
            )}
          </button>
          <style>{`@keyframes aspin { to { transform: rotate(360deg) } }`}</style>

          {lastFile && (
            <div style={{
              marginTop: 12, padding: '11px 12px', borderRadius: 12,
              background: A_BRAND.mint, display: 'flex', alignItems: 'center', gap: 9,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={A_BRAND.tealDeep} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: A_BRAND.tealDeep }}>
                  ดาวน์โหลดแล้ว{source === 'live' ? ' · ข้อมูลจริงจาก Sheet' : source === 'local' ? ' · ข้อมูลในเครื่อง' : ''}
                </div>
                <div style={{ fontSize: 11, color: A_BRAND.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastFile}</div>
              </div>
            </div>
          )}
        </div>

        {/* contents preview */}
        <div style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: A_BRAND.inkSoft, marginBottom: 8 }}>ในไฟล์รายงานประกอบด้วย</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SheetRow n="1" title="สรุปภาพรวม" desc="ตัวชี้วัดรวม + สถิติแต่ละเกม" color={A_BRAND.navy} />
          <SheetRow n="2" title="คะแนนผู้เล่น" desc={`${A_GAMES.length * 12} แถว · ทุกเกม ทุกคน`} color={A_BRAND.teal} />
          <SheetRow n="3" title="ใครคือที่สุด" desc="ผลโหวต 9 พฤติกรรม SFB" color={A_BRAND.red} />
        </div>

        {/* logout (secondary, bottom) */}
        <button onClick={onLogout} style={{
          marginTop: 22, width: '100%', background: 'transparent', color: A_BRAND.inkSoft,
          border: `1.5px solid ${A_BRAND.hairline}`, borderRadius: 999, padding: '13px',
          fontFamily: 'Prompt', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          ออกจากระบบผู้ดูแล
        </button>
      </div>
    </div>
  );
}

function AdminStat({ label, value, sub, color, live }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '13px 15px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: A_BRAND.inkSoft }}>
        {live && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2dc66c' }} />}
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 3 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div style={{ fontSize: 11, color: A_BRAND.inkSoft }}>{sub}</div>
      </div>
    </div>
  );
}

function SheetRow({ n, title, desc, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, padding: '11px 13px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8, background: color + '18', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Prompt', fontWeight: 800, fontSize: 13, flexShrink: 0,
      }}>{n}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: A_BRAND.ink }}>{title}</div>
        <div style={{ fontSize: 11, color: A_BRAND.inkSoft }}>{desc}</div>
      </div>
    </div>
  );
}

Object.assign(window, { MobileAdmin });
