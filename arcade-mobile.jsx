// Mobile player app: login → home → game → leaderboard
// Each MobileApp instance is its own state machine; an artboard hosts it
// with a configurable startScreen so we can show several states side-by-side.

const {
  BRAND, PILLARS, GAMES, GAME_BY_ID, LEADERBOARDS, FAKE_NAMES,
  GameIcon, Btn, GhostBtn, Avatar, fmt, PillarBadge,
  TapSpeedGame, MemoryGame, CatchGame, ReactionGame, WhackGame, Pill,
} = window;

const GAME_COMPONENT = {
  tap: TapSpeedGame,
  memory: MemoryGame,
  catch: CatchGame,
  reaction: ReactionGame,
  whack: WhackGame,
};

const ME = { name: 'คุณนรินทร์', empId: 'TW-2199' };

// ─────────────────────────────────────────────────────────────
// MobileApp — full state machine
//   props: startScreen ('login'|'home'|'leaderboard'|'profile')
//          homeStyle ('grid'|'list'|'mosaic')
// ─────────────────────────────────────────────────────────────
function MobileApp({ startScreen = 'login', homeStyle = 'grid' }) {
  const [screen, setScreen] = React.useState(startScreen);
  const [activeGame, setActiveGame] = React.useState(null);
  const [user, setUser] = React.useState(startScreen === 'login' ? null : ME);
  const [recentScore, setRecentScore] = React.useState(null);

  const goHome = () => setScreen('home');

  return (
    <div style={{
      width: '100%', height: '100%', background: BRAND.paper,
      fontFamily: 'Prompt, system-ui',
      display: 'flex', flexDirection: 'column', position: 'relative',
      overflow: 'hidden',
    }}>
      {screen === 'login' && (
        <LoginScreen onLogin={(u) => { setUser(u); setScreen('home'); }}
          onAdmin={() => setScreen('admin')} />
      )}
      {screen === 'home' && (
        <HomeScreen
          user={user || ME} style={homeStyle}
          onPickGame={(g) => { setActiveGame(g); setScreen('game'); }}
          onLeaderboard={() => setScreen('leaderboard')}
          onProfile={() => setScreen('profile')}
        />
      )}
      {screen === 'game' && activeGame && (
        (() => {
          const G = GAME_COMPONENT[activeGame.id];
          return <G
            onFinish={(score, detail) => {
              setRecentScore({ game: activeGame, score });
              const u = user || ME;
              const lb = LEADERBOARDS[activeGame.id];
              const unit = (lb && lb[0] && lb[0].unit) || '';
              window.ArcadeAPI && window.ArcadeAPI.saveScore({
                empId: u.empId, name: u.name, dept: '',
                gameId: activeGame.id, gameName: activeGame.name,
                pillar: activeGame.pillar, score, unit,
              });
              if (activeGame.id === 'reaction' && detail && detail.answers) {
                window.ArcadeAPI && window.ArcadeAPI.savePeer({
                  empId: u.empId, name: u.name, totalSec: detail.totalSec,
                  answers: detail.answers.map(a => ({
                    behaviorId: a.q.id, behavior: a.q.concept, pillar: a.q.pillar,
                    pickedName: a.name, pickedId: '', timeMs: a.timeMs,
                  })),
                });
              }
            }}
            onExit={goHome}
          />;
        })()
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen user={user || ME} onBack={goHome} />
      )}
      {screen === 'profile' && (
        <ProfileScreen user={user || ME} onBack={goHome}
          onLogout={() => { setUser(null); setScreen('login'); }}
          onAdmin={() => setScreen('admin')} />
      )}
      {screen === 'admin' && (() => {
        const MA = window.MobileAdmin;
        return <MA onExit={() => setScreen(user ? 'home' : 'login')} />;
      })()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LOGIN — employee ID
// ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, onAdmin }) {
  const [empId, setEmpId] = React.useState('');
  const [pressed, setPressed] = React.useState(false);

  const submit = () => {
    if (!empId.trim()) return;
    onLogin({ name: lookupName(empId) || 'พนักงานใหม่', empId: empId.toUpperCase() });
  };

  const pad = (key) => {
    if (key === 'del') setEmpId(s => s.slice(0, -1));
    else if (key === 'go') submit();
    else if (empId.length < 8) setEmpId(s => s + key);
  };

  return (
    <div style={{
      flex: 1, padding: '60px 28px 24px', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(180deg, ${BRAND.lavender} 0%, ${BRAND.paper} 50%)`,
    }}>
      {/* Logo / branding */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[['S', BRAND.navy], ['F', BRAND.red], ['B', BRAND.teal]].map(([ch, c]) => (
            <div key={ch} style={{
              width: 56, height: 56, borderRadius: 18, background: c, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Prompt', fontWeight: 800, fontSize: 30,
              boxShadow: `0 6px 14px ${c}45`,
            }}>{ch}</div>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 26, fontWeight: 800, color: BRAND.navy, letterSpacing: -0.3 }}>SFB Arcade</div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
          <span style={{ color: BRAND.navy }}>Stronger</span>
          <span style={{ color: BRAND.inkSoft }}> · </span>
          <span style={{ color: BRAND.red }}>Faster</span>
          <span style={{ color: BRAND.inkSoft }}> · </span>
          <span style={{ color: BRAND.teal }}>Better</span>
        </div>
      </div>

      {/* card */}
      <div style={{
        marginTop: 38, background: '#fff', borderRadius: 28,
        padding: 24, boxShadow: '0 12px 32px rgba(37, 36, 120, 0.08)',
      }}>
        <div style={{ fontSize: 14, color: BRAND.inkSoft, fontWeight: 500 }}>รหัสพนักงาน</div>
        <div style={{
          marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'Prompt', fontSize: 28, fontWeight: 700,
          color: empId ? BRAND.navy : BRAND.muted, height: 40,
          letterSpacing: 2,
        }}>
          {empId || 'TW-XXXX'}
          <span style={{
            display: 'inline-block', width: 2, height: 28, marginLeft: 4,
            background: BRAND.navy, animation: 'blink 1s steps(2) infinite',
          }} />
        </div>
        <div style={{ height: 1.5, background: BRAND.hairline, marginTop: 8 }} />
        <style>{`@keyframes blink { 50% { opacity: 0 } }`}</style>

        {/* numpad */}
        <div style={{
          marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
        }}>
          {['1','2','3','4','5','6','7','8','9','del','0','go'].map(k => {
            const isAction = k === 'del' || k === 'go';
            return (
              <button key={k} onClick={() => pad(k)}
                onMouseDown={() => setPressed(k)} onMouseUp={() => setPressed(null)} onMouseLeave={() => setPressed(null)}
                style={{
                  height: 52, borderRadius: 14, border: 'none',
                  background: k === 'go' ? BRAND.navy : (k === 'del' ? BRAND.hairline : '#fff'),
                  color: k === 'go' ? '#fff' : BRAND.ink,
                  fontFamily: 'Prompt', fontSize: 22, fontWeight: 600,
                  boxShadow: k === 'go' ? '0 3px 0 ' + BRAND.navyDeep : '0 2px 0 ' + BRAND.hairline,
                  cursor: 'pointer',
                  transform: pressed === k ? 'translateY(1px)' : 'none',
                }}>
                {k === 'del' ? '⌫' : k === 'go' ? '→' : k}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <button onClick={onAdmin} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'transparent', border: `1.5px solid ${BRAND.hairline}`,
          color: BRAND.inkSoft, borderRadius: 999, padding: '9px 16px',
          fontFamily: 'Prompt', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
          </svg>
          ผู้ดูแลระบบ (Admin)
        </button>
        <div style={{ textAlign: 'center', fontSize: 11, color: BRAND.muted }}>
          Thai Wah · พ.ศ. 2569
        </div>
      </div>
    </div>
  );
}

function lookupName(id) {
  const idx = (id.charCodeAt(0) + id.length) % FAKE_NAMES.length;
  return FAKE_NAMES[idx][0];
}

// ─────────────────────────────────────────────────────────────
// HOME — 3 variations: grid, list, mosaic
// ─────────────────────────────────────────────────────────────
function HomeScreen({ user, style, onPickGame, onLeaderboard, onProfile }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Greeting header */}
      <div style={{
        padding: '52px 22px 16px',
        background: BRAND.paper,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={user.name} size={42} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: BRAND.inkSoft }}>สวัสดี ✨</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: BRAND.ink, marginTop: -2 }}>{user.name}</div>
          </div>
          <button onClick={onProfile} style={{
            border: 'none', background: '#fff', width: 38, height: 38,
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.ink} strokeWidth="2">
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        <div style={{
          marginTop: 16,
          background: `linear-gradient(135deg, ${BRAND.lavender} 0%, ${BRAND.blush} 100%)`,
          borderRadius: 22, padding: '18px 22px',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: BRAND.ink, lineHeight: 1.2, letterSpacing: -0.3 }}>
            เล่นสนุก เรียนรู้
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
            <span style={{ color: BRAND.navy }}>Stronger</span>
            <span style={{ color: BRAND.inkSoft }}> · </span>
            <span style={{ color: BRAND.red }}>Faster</span>
            <span style={{ color: BRAND.inkSoft }}> · </span>
            <span style={{ color: BRAND.teal }}>Better</span>
          </div>
        </div>
      </div>

      {/* SFB pillar legend strip */}
      <div style={{ padding: '0 22px 10px', background: BRAND.paper, display: 'flex', gap: 6 }}>
        {Object.entries(PILLARS).map(([key, p]) => (
          <div key={key} style={{
            flex: 1, background: '#fff', borderRadius: 12,
            padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}>
            <div style={{
              width: 6, height: 28, borderRadius: 999, background: p.color,
            }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: 0.5 }}>{p.name}</div>
              <div style={{ fontSize: 9, color: BRAND.inkSoft }}>{p.motto}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick stat strip */}
      <div style={{ padding: '0 22px 12px', background: BRAND.paper, display: 'flex', gap: 10 }}>
        <QuickStat label="วันนี้" value="218" sub="ผู้เล่นออนไลน์" color={BRAND.teal} />
        <QuickStat label="อันดับฉัน" value="#7" sub="ใน Top 10" color={BRAND.navy} />
      </div>

      {/* Game list scroll area */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px 22px 100px',
        background: BRAND.paper,
      }}>
        {style === 'grid' && <HomeGrid onPick={onPickGame} />}
        {style === 'list' && <HomeList onPick={onPickGame} />}
        {style === 'mosaic' && <HomeMosaic onPick={onPickGame} />}

        <div style={{ marginTop: 22, marginBottom: 8, fontSize: 13, fontWeight: 600, color: BRAND.inkSoft }}>คะแนนสูงสุดวันนี้</div>
        <TopScoreStrip />
      </div>

      {/* Bottom tab bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${BRAND.hairline}`,
        padding: '12px 22px 28px',
        display: 'flex', justifyContent: 'space-around',
      }}>
        <TabIcon label="เล่น" active icon="play" color={BRAND.navy} />
        <TabIcon label="อันดับ" icon="trophy" color={BRAND.inkSoft} onClick={onLeaderboard} />
        <TabIcon label="โปรไฟล์" icon="user" color={BRAND.inkSoft} onClick={onProfile} />
      </div>
    </div>
  );
}

function QuickStat({ label, value, sub, color }) {
  return (
    <div style={{
      flex: 1, background: '#fff', borderRadius: 18, padding: '10px 14px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: 11, color: BRAND.inkSoft }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 11, color: BRAND.inkSoft }}>{sub}</div>
      </div>
    </div>
  );
}

function HomeGrid({ onPick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {GAMES.map((g, i) => {
        const isWide = i === 4;
        return (
          <div key={g.id} onClick={() => onPick(g)}
            style={{
              background: g.bg, borderRadius: 22, padding: 14,
              cursor: 'pointer', position: 'relative',
              minHeight: 144, display: 'flex',
              gridColumn: isWide ? 'span 2' : 'span 1',
              flexDirection: isWide ? 'row' : 'column',
              alignItems: isWide ? 'center' : 'flex-start',
              gap: isWide ? 14 : 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>
            <GameIcon kind={g.icon} size={isWide ? 56 : 44} color="#fff" bg={g.color} />
            <div style={{ marginTop: isWide ? 0 : 'auto', flex: isWide ? 1 : undefined }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.ink, lineHeight: 1.15 }}>{g.name}</div>
              <div style={{ fontSize: 11, color: BRAND.inkSoft, marginTop: 4, lineHeight: 1.35 }}>{g.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HomeList({ onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {GAMES.map(g => (
        <div key={g.id} onClick={() => onPick(g)} style={{
          background: '#fff', borderRadius: 20, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 14,
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          borderLeft: `5px solid ${g.color}`,
        }}>
          <GameIcon kind={g.icon} size={52} color="#fff" bg={g.color} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: BRAND.ink }}>{g.name}</div>
            <div style={{ fontSize: 11, color: BRAND.inkSoft, marginTop: 3 }}>{g.desc}</div>
          </div>
          <div style={{
            background: g.color, color: '#fff', borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>▶</div>
        </div>
      ))}
    </div>
  );
}

function HomeMosaic({ onPick }) {
  const cells = [
    { g: GAMES[0], style: { gridColumn: '1 / 3', gridRow: '1 / 3' } },
    { g: GAMES[1], style: { gridColumn: '3 / 5', gridRow: '1 / 2' } },
    { g: GAMES[2], style: { gridColumn: '3 / 5', gridRow: '2 / 3' } },
    { g: GAMES[3], style: { gridColumn: '1 / 3', gridRow: '3 / 4' } },
    { g: GAMES[4], style: { gridColumn: '3 / 5', gridRow: '3 / 4' } },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '92px', gap: 8,
    }}>
      {cells.map(({g, style: cs}) => {
        const isBig = cs.gridColumn === '1 / 3' && cs.gridRow === '1 / 3';
        return (
          <div key={g.id} onClick={() => onPick(g)} style={{
            ...cs,
            background: g.color, color: '#fff', borderRadius: 20,
            padding: 14, cursor: 'pointer', position: 'relative',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            overflow: 'hidden',
            boxShadow: `0 6px 18px ${g.color}40`,
          }}>
            <GameIcon kind={g.icon} size={isBig ? 56 : 32} color="#fff" bg={'rgba(255,255,255,0.18)'} />
            <div>
              <div style={{ fontSize: isBig ? 18 : 13, fontWeight: 700, lineHeight: 1.15 }}>{g.name}</div>
              <div style={{ fontSize: isBig ? 11 : 9, opacity: 0.85, marginTop: 2, lineHeight: 1.3 }}>
                {isBig ? g.desc : g.en}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopScoreStrip() {
  // Show top scorer for each game
  return (
    <div style={{
      display: 'flex', gap: 10, overflowX: 'auto', marginLeft: -22, marginRight: -22, padding: '0 22px',
    }}>
      {GAMES.map(g => {
        const top = LEADERBOARDS[g.id][0];
        return (
          <div key={g.id} style={{
            background: '#fff', borderRadius: 16, padding: 12,
            flex: '0 0 auto', width: 160, display: 'flex', flexDirection: 'column',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <GameIcon kind={g.icon} size={28} color="#fff" bg={g.color} />
              <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.ink }}>{g.name}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <Avatar name={top.name} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: BRAND.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{top.name}</div>
                <div style={{ fontSize: 11, color: g.color, fontWeight: 700 }}>{fmt.score(top)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabIcon({ label, icon, active, color, onClick }) {
  const path = {
    play: 'M5 4l14 8-14 8 V4z',
    trophy: 'M7 4h10v3a5 5 0 0 1-10 0V4z M9 13h6v3H9z M8 19h8',
    user: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  }[icon];
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      color: active ? BRAND.navy : color,
      padding: 4,
    }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill={icon === 'play' ? color : 'none'}
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path}/>
      </svg>
      <div style={{ fontSize: 11, fontFamily: 'Prompt', fontWeight: active ? 600 : 500 }}>{label}</div>
    </button>
  );
}

function TWLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M16 14 L48 14 L48 28 L40 28 L40 50 L24 50 L24 28 L16 28 Z" fill={BRAND.navy} />
      <path d="M28 28 L36 28 L36 50 L28 50 Z" fill="#5a93d1" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// LEADERBOARD — tabs per game, global + me
// ─────────────────────────────────────────────────────────────
function LeaderboardScreen({ user, onBack }) {
  const [gameId, setGameId] = React.useState('tap');
  const [mode, setMode] = React.useState('global'); // global | me
  const game = GAME_BY_ID[gameId];
  const rows = LEADERBOARDS[gameId];

  // Inject the user into the table at a plausible position
  const myRank = 7;
  const myRow = { name: user.name, id: user.empId, score: rows[myRank].score, unit: rows[myRank].unit, lowerBetter: rows[myRank].lowerBetter, isMe: true };
  const display = mode === 'me'
    ? [...rows.slice(0, 3), { isDivider: true }, ...rows.slice(myRank - 1, myRank), myRow, ...rows.slice(myRank, myRank + 1)]
    : rows.slice(0, 10);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BRAND.paper, overflow: 'hidden' }}>
      <div style={{
        padding: '52px 22px 12px', background: `linear-gradient(180deg, ${game.bg} 0%, ${BRAND.paper} 100%)`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: BRAND.inkSoft }}>Leaderboard</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.ink }}>คะแนนสูงสุด</div>
        </div>
      </div>

      {/* game tabs */}
      <div style={{ padding: '8px 14px 4px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {GAMES.map(g => (
          <button key={g.id} onClick={() => setGameId(g.id)} style={{
            border: 'none', borderRadius: 999,
            padding: '8px 14px', flex: '0 0 auto', cursor: 'pointer',
            background: gameId === g.id ? g.color : '#fff',
            color: gameId === g.id ? '#fff' : BRAND.ink,
            fontFamily: 'Prompt', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: gameId === g.id ? `0 4px 12px ${g.color}50` : '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <GameIcon kind={g.icon} size={20} color={gameId === g.id ? '#fff' : g.color}
              bg={gameId === g.id ? 'rgba(255,255,255,0.2)' : g.color + '20'} />
            {g.name}
          </button>
        ))}
      </div>

      {/* mode toggle */}
      <div style={{ padding: '10px 22px 8px', display: 'flex', gap: 6 }}>
        {['global', 'me'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: mode === m ? BRAND.ink : '#fff',
            color: mode === m ? '#fff' : BRAND.inkSoft,
            fontFamily: 'Prompt', fontSize: 13, fontWeight: 600,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>{m === 'global' ? 'Top 10 ทั้งหมด' : 'ใกล้กับฉัน'}</button>
        ))}
      </div>

      {/* podium for global */}
      {mode === 'global' && (
        <div style={{ padding: '4px 22px 8px', display: 'flex', alignItems: 'flex-end', gap: 8, justifyContent: 'center' }}>
          <PodiumCard rank={2} row={rows[1]} color={game.color} />
          <PodiumCard rank={1} row={rows[0]} color={game.color} big />
          <PodiumCard rank={3} row={rows[2]} color={game.color} />
        </div>
      )}

      {/* table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 24px' }}>
        <div style={{
          background: '#fff', borderRadius: 20, padding: '6px 8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          {display.map((r, i) => {
            if (r.isDivider) return <div key={i} style={{ height: 1, background: BRAND.hairline, margin: '6px 12px' }} />;
            const rank = mode === 'global' ? i + 1 : (r.isMe ? myRank + 1 : (i < 3 ? i + 1 : (i === 4 ? myRank : (i === 5 ? myRank + 1 : myRank + 2))));
            return <LeaderRow key={i} rank={rank} row={r} color={game.color} isMe={r.isMe} />;
          })}
        </div>
      </div>
    </div>
  );
}

function PodiumCard({ rank, row, color, big }) {
  const medal = ['🥇','🥈','🥉'][rank - 1];
  return (
    <div style={{
      flex: big ? 1.1 : 1, background: '#fff', borderRadius: 18,
      padding: big ? '14px 8px 12px' : '10px 6px 10px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      boxShadow: big ? `0 8px 22px ${color}30` : '0 3px 10px rgba(0,0,0,0.06)',
      transform: big ? 'translateY(-6px)' : 'none',
      border: big ? `2px solid ${color}` : 'none',
    }}>
      <div style={{ fontSize: big ? 26 : 22 }}>{medal}</div>
      <Avatar name={row.name} size={big ? 38 : 30} />
      <div style={{
        fontSize: big ? 13 : 11, fontWeight: 600, color: BRAND.ink, marginTop: 6,
        textAlign: 'center', lineHeight: 1.2,
        maxWidth: '95%', overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{row.name.split(' ')[0]}</div>
      <div style={{ fontSize: big ? 16 : 13, fontWeight: 800, color, marginTop: 2 }}>
        {fmt.num(row.score)}
      </div>
      <div style={{ fontSize: 10, color: BRAND.muted }}>{row.unit}</div>
    </div>
  );
}

function LeaderRow({ rank, row, color, isMe }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      borderRadius: 14, background: isMe ? color + '10' : 'transparent',
      border: isMe ? `1.5px solid ${color}40` : '1.5px solid transparent',
    }}>
      <div style={{
        width: 26, fontFamily: 'Prompt', fontSize: 14, fontWeight: 700,
        color: rank <= 3 ? color : BRAND.inkSoft, textAlign: 'center',
      }}>{rank}</div>
      <Avatar name={row.name} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: BRAND.ink }}>
          {row.name} {isMe && <span style={{ color, fontSize: 11, marginLeft: 4 }}>· คุณ</span>}
        </div>
        <div style={{ fontSize: 11, color: BRAND.muted }}>{row.id}</div>
      </div>
      <div style={{
        fontFamily: 'Prompt', fontSize: 16, fontWeight: 800, color,
        fontVariantNumeric: 'tabular-nums',
      }}>{fmt.num(row.score)}</div>
      <div style={{ fontSize: 11, color: BRAND.muted, width: 28, textAlign: 'left' }}>{row.unit}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PROFILE — personal stats summary
// ─────────────────────────────────────────────────────────────
function ProfileScreen({ user, onBack, onLogout, onAdmin }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BRAND.paper, overflow: 'auto' }}>
      <div style={{ padding: '52px 22px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.ink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: BRAND.inkSoft }}>โปรไฟล์</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: BRAND.ink }}>สถิติของฉัน</div>
        </div>
      </div>

      <div style={{ padding: '0 22px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 32 }}>
        <div style={{
          background: '#fff', borderRadius: 22, padding: 18,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 3px 12px rgba(0,0,0,0.04)',
        }}>
          <Avatar name={user.name} size={56} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.ink }}>{user.name}</div>
            <div style={{ fontSize: 12, color: BRAND.inkSoft }}>{user.empId}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <Kpi label="เกมทั้งหมด" value="142" color={BRAND.navy} />
          <Kpi label="วันต่อเนื่อง" value="6" color={BRAND.teal} />
          <Kpi label="อันดับสูงสุด" value="#3" color={BRAND.red} />
        </div>

        <div style={{ marginTop: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.inkSoft, marginBottom: 8 }}>คะแนนของคุณในแต่ละเกม</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GAMES.map((g, i) => {
              const myScore = LEADERBOARDS[g.id][7].score;
              const top = LEADERBOARDS[g.id][0].score;
              const pct = g.id === 'memory' || g.id === 'reaction'
                ? Math.max(20, (top / myScore) * 100)
                : Math.max(20, (myScore / top) * 100);
              return (
                <div key={g.id} style={{
                  background: '#fff', borderRadius: 16, padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <GameIcon kind={g.icon} size={36} color="#fff" bg={g.color} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.ink }}>{g.name}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{fmt.num(myScore)} <span style={{ fontSize: 10, color: BRAND.muted }}>{LEADERBOARDS[g.id][7].unit}</span></div>
                    </div>
                    <div style={{ height: 5, background: BRAND.hairline, borderRadius: 999, marginTop: 6, overflow: 'hidden' }}>
                      <div style={{ width: pct + '%', height: '100%', background: g.color, borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={onAdmin} style={{
          marginTop: 4, background: BRAND.navy + '0d', color: BRAND.navy,
          border: `1.5px solid ${BRAND.navy}22`,
          padding: '13px', borderRadius: 16, fontFamily: 'Prompt', fontWeight: 700,
          fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>
          </svg>
          แผงควบคุมผู้ดูแล (Admin)
        </button>

        <button onClick={onLogout} style={{
          marginTop: 4, background: 'transparent', color: BRAND.inkSoft,
          border: `1.5px solid ${BRAND.hairline}`,
          padding: '12px', borderRadius: 999, fontFamily: 'Prompt', fontWeight: 500,
          fontSize: 14, cursor: 'pointer',
        }}>ออกจากระบบ</button>
      </div>
    </div>
  );
}

function Kpi({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: 14,
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', textAlign: 'left',
    }}>
      <div style={{ fontSize: 11, color: BRAND.inkSoft }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
    </div>
  );
}

Object.assign(window, { MobileApp, LoginScreen, HomeScreen, LeaderboardScreen, ProfileScreen, TWLogo });
