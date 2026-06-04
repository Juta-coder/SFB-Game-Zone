// 5 playable games. Each game:
//   props: { onFinish(score) }  — called when a round ends
//   state-managed internally; no external dependencies

const { BRAND, PILLARS, GAMES, GAME_BY_ID, FAKE_NAMES, Avatar, GameIcon, Btn, GhostBtn, PillarBadge, fmt,
  SFB_PAIRS, SFB_VALUES, CATCH_GOOD, CATCH_BAD, WHACK_PAIRS,
  FILL_WORDS, maskThaiVowels } = window;

// Shared game shell — header w/ timer/score + body
function GameShell({ title, color, children, hud, footer }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      fontFamily: 'Prompt, system-ui',
    }}>
      {hud && (
        <div style={{
          padding: '14px 20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', background: '#fff',
          boxShadow: '0 1px 0 ' + BRAND.hairline,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: BRAND.inkSoft }}>{title}</div>
          {hud}
        </div>
      )}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {children}
      </div>
      {footer && (
        <div style={{ padding: '12px 20px 18px', background: '#fff' }}>{footer}</div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. "เติมสระ" — fill-the-vowels word puzzle
//    9 SFB-themed words shown with vowels removed. 2-min total
//    timer. Player types the full word; reveal correct/wrong on
//    the summary screen.
// ─────────────────────────────────────────────────────────────
function TapSpeedGame({ onFinish, onExit }) {
  const game = GAME_BY_ID.tap;
  const TOTAL = FILL_WORDS.length; // 9
  const DURATION = 120;            // 2 minutes
  const [phase, setPhase] = React.useState('ready'); // ready | playing | done
  const [order, setOrder] = React.useState([]);
  const [qIdx, setQIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState([]); // { word, hint, pillar, guess, correct, timeMs }
  const [input, setInput] = React.useState('');
  const [time, setTime] = React.useState(DURATION);
  const [flash, setFlash] = React.useState(null); // 'correct' | 'wrong' | null
  const t0Ref = React.useRef(0);
  const qStartRef = React.useRef(0);
  const tickRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => () => clearInterval(tickRef.current), []);
  React.useEffect(() => {
    if (phase === 'playing' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [phase, qIdx]);

  const start = () => {
    // shuffle the 9 words
    const idxs = [...Array(TOTAL).keys()];
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }
    setOrder(idxs);
    setQIdx(0); setAnswers([]); setInput('');
    setTime(DURATION); setFlash(null);
    setPhase('playing');
    t0Ref.current = Date.now();
    qStartRef.current = Date.now();
    tickRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0Ref.current) / 1000;
      const rem = Math.max(0, DURATION - elapsed);
      setTime(rem);
      if (rem <= 0) finish();
    }, 100);
  };

  const finish = () => {
    clearInterval(tickRef.current);
    setPhase('done');
  };

  const submit = () => {
    if (phase !== 'playing') return;
    const guess = input.trim();
    if (!guess) return;
    const w = FILL_WORDS[order[qIdx]];
    const correct = guess === w.word;
    const timeMs = Date.now() - qStartRef.current;
    const ans = { ...w, guess, correct, timeMs };
    const next = [...answers, ans];
    setAnswers(next);
    setFlash(correct ? 'correct' : 'wrong');
    setTimeout(() => setFlash(null), 350);
    if (qIdx + 1 >= TOTAL) {
      finish();
    } else {
      setQIdx(qIdx + 1);
      setInput('');
      qStartRef.current = Date.now();
    }
  };

  const skip = () => {
    if (phase !== 'playing') return;
    const w = FILL_WORDS[order[qIdx]];
    const timeMs = Date.now() - qStartRef.current;
    const ans = { ...w, guess: '', correct: false, skipped: true, timeMs };
    const next = [...answers, ans];
    setAnswers(next);
    if (qIdx + 1 >= TOTAL) {
      finish();
    } else {
      setQIdx(qIdx + 1);
      setInput('');
      qStartRef.current = Date.now();
    }
  };

  const correctCount = answers.filter(a => a.correct).length;
  const currentW = phase === 'playing' ? FILL_WORDS[order[qIdx]] : null;
  const pillar = currentW ? PILLARS[currentW.pillar] : PILLARS.faster;
  const masked = currentW ? maskThaiVowels(currentW.word) : '';

  const hud = phase === 'playing' ? (
    <div style={{ display: 'flex', gap: 8 }}>
      <Pill label="ข้อ" value={`${qIdx + 1}/${TOTAL}`} color={game.color} />
      <Pill label="ถูก" value={correctCount} color={'#1f8a4d'} />
      <Pill label="เวลา" value={formatMMSS(time)} color={BRAND.red} />
    </div>
  ) : null;

  return (
    <GameShell title={game.name} color={game.color} hud={hud}>
      {phase === 'ready' && (
        <ReadyScreen game={game}
          body='แต่ละข้อจะแสดงคำที่หายไป "สระ" — พิมพ์คำที่ถูกต้องลงไป มีเวลาทั้งหมด 2 นาที สำหรับ 9 ข้อ'
          onStart={start} onExit={onExit} />
      )}

      {phase === 'playing' && currentW && (
        <div style={{
          position: 'absolute', inset: 0, background: game.bg,
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Prompt',
          transition: 'background 200ms',
          ...(flash === 'correct' ? { background: '#c7eed5' } :
              flash === 'wrong'   ? { background: '#ffd0d4' } : {}),
        }}>
          {/* Progress dots */}
          <div style={{ padding: '14px 18px 6px', display: 'flex', gap: 4 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 999,
                background: i < qIdx
                  ? (answers[i]?.correct ? '#1f8a4d' : '#d96f80')
                  : (i === qIdx ? game.color : '#ffffff80'),
                opacity: i <= qIdx ? 1 : 0.6,
              }} />
            ))}
          </div>

          {/* Masked-word card — the big hero */}
          <div style={{
            margin: '10px 18px 0', padding: '20px 16px 22px',
            background: '#fff', borderRadius: 22,
            boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: pillar.color,
              letterSpacing: 1, textTransform: 'uppercase',
            }}>คำใบ้ที่ {qIdx + 1} จาก {TOTAL}</div>

            <div style={{
              marginTop: 12, fontFamily: 'Prompt',
              fontSize: 56, fontWeight: 800, color: BRAND.ink,
              letterSpacing: 6, lineHeight: 1.05,
              display: 'flex', justifyContent: 'center', alignItems: 'baseline',
              gap: 2,
            }}>
              {[...masked].map((ch, i) => (
                <span key={i} style={{
                  color: ch === '_' ? pillar.color : BRAND.ink,
                  opacity: ch === '_' ? 0.55 : 1,
                  fontWeight: ch === '_' ? 500 : 800,
                  display: 'inline-block', minWidth: ch === '_' ? '0.55em' : 'auto',
                }}>{ch}</span>
              ))}
            </div>

            <div style={{
              marginTop: 14, padding: '8px 12px',
              background: pillar.color + '14', borderRadius: 12,
              fontSize: 13, color: BRAND.ink, fontWeight: 500,
              display: 'inline-block',
            }}>
              <span style={{ color: BRAND.inkSoft, marginRight: 6 }}>💡 คำใบ้:</span>
              {currentW.hint}
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: '14px 18px 0' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: BRAND.inkSoft,
              letterSpacing: 0.8, marginLeft: 4, marginBottom: 6,
            }}>พิมพ์คำที่ถูกต้อง</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff', borderRadius: 16, padding: '12px 16px',
              boxShadow: `0 0 0 2px ${pillar.color}30, 0 4px 14px rgba(0,0,0,0.04)`,
            }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="พิมพ์คำที่นี่..."
                autoComplete="off"
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  flex: 1, fontFamily: 'Prompt', fontSize: 22, fontWeight: 600,
                  color: BRAND.ink, minWidth: 0,
                }}
              />
              {input && (
                <button onClick={() => setInput('')} style={{
                  border: 'none', background: BRAND.hairline, cursor: 'pointer',
                  color: BRAND.inkSoft, fontSize: 14,
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, lineHeight: 1,
                }}>×</button>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ padding: '12px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn block color={game.color} onClick={submit}
              style={{ opacity: input.trim() ? 1 : 0.5, pointerEvents: input.trim() ? 'auto' : 'none' }}>
              {qIdx + 1 === TOTAL ? 'ส่งคำตอบสุดท้าย' : 'ส่งคำตอบ →'}
            </Btn>
            <button onClick={skip} style={{
              background: 'transparent', border: 'none',
              color: BRAND.inkSoft, padding: '6px',
              fontFamily: 'Prompt', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>ข้ามข้อนี้</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <FillWordsDone game={game} answers={answers} total={TOTAL}
          timeUsed={Math.min(DURATION, (Date.now() - t0Ref.current) / 1000)}
          onRestart={start} onExit={() => { onFinish?.(answers.filter(a => a.correct).length); onExit?.(); }} />
      )}
    </GameShell>
  );
}

function formatMMSS(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function FillWordsDone({ game, answers, total, timeUsed, onRestart, onExit }) {
  const correct = answers.filter(a => a.correct).length;
  const wrong   = answers.filter(a => !a.correct && !a.skipped).length;
  const skipped = answers.filter(a => a.skipped).length;
  const unanswered = total - answers.length;

  return (
    <div style={{
      position: 'absolute', inset: 0, background: game.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Prompt',
    }}>
      <div style={{
        padding: '18px 24px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontSize: 32 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: BRAND.ink, marginTop: 2 }}>จบเกม!</div>

        <div style={{
          marginTop: 10, background: '#fff', borderRadius: 18,
          padding: '14px 22px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: BRAND.inkSoft, letterSpacing: 1 }}>คะแนน</div>
            <div style={{
              fontSize: 42, fontWeight: 800, color: game.color, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>{correct}<span style={{ fontSize: 18, color: BRAND.inkSoft, fontWeight: 500 }}>/{total}</span></div>
          </div>
          <div style={{ width: 1, height: 38, background: BRAND.hairline }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: BRAND.inkSoft, letterSpacing: 1 }}>เวลาใช้</div>
            <div style={{
              fontSize: 26, fontWeight: 800, color: BRAND.ink, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums', marginTop: 6,
            }}>{formatMMSS(timeUsed)}</div>
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 11, color: BRAND.inkSoft }}>
          ถูก {correct} · ผิด {wrong} · ข้าม {skipped}{unanswered ? ` · ไม่ทัน ${unanswered}` : ''}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 12px' }}>
        <div style={{ fontSize: 11, color: BRAND.inkSoft, letterSpacing: 1, fontWeight: 600, padding: '4px 4px 8px' }}>
          เฉลย
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {answers.map((a, i) => {
            const p = PILLARS[a.pillar];
            return (
              <div key={i} style={{
                background: '#fff', borderRadius: 12, padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                borderLeft: `4px solid ${a.correct ? '#1f8a4d' : (a.skipped ? BRAND.muted : '#d96f80')}`,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: a.correct ? '#1f8a4d' : (a.skipped ? BRAND.muted : '#d96f80'),
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{a.correct ? '✓' : (a.skipped ? '–' : '✕')}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: BRAND.ink }}>{a.word}</div>
                    <div style={{ fontSize: 10, color: p.color, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>{p.name}</div>
                  </div>
                  <div style={{ fontSize: 11, color: BRAND.inkSoft, marginTop: 1 }}>
                    {a.skipped
                      ? <span style={{ fontStyle: 'italic' }}>ข้ามข้อนี้</span>
                      : <>คุณตอบ: <strong style={{ color: a.correct ? '#1f8a4d' : '#a04050' }}>{a.guess}</strong></>}
                  </div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: BRAND.inkSoft,
                  fontVariantNumeric: 'tabular-nums',
                  background: BRAND.hairline, padding: '2px 7px', borderRadius: 999,
                }}>{(a.timeMs / 1000).toFixed(1)}s</div>
              </div>
            );
          })}
          {answers.length < total && Array.from({ length: total - answers.length }).map((_, i) => {
            const w = FILL_WORDS[i + answers.length] || { word: '?', pillar: 'faster' };
            return (
              <div key={'u' + i} style={{
                background: '#fff', borderRadius: 12, padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: 0.5,
                borderLeft: `4px solid ${BRAND.muted}`,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: BRAND.muted, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⏱</div>
                <div style={{ flex: 1, fontSize: 12, color: BRAND.muted }}>หมดเวลา ก่อนได้ตอบ</div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 14, padding: '12px 14px',
          background: '#fff', borderRadius: 14,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 10, color: BRAND.inkSoft, letterSpacing: 1, fontWeight: 600 }}>SFB CULTURE</div>
          <SFBLine pillar="stronger" tagline="ทำให้ได้" />
          <SFBLine pillar="faster"   tagline="ทำให้ไว" />
          <SFBLine pillar="better"   tagline="ทำให้ดีขึ้น" />
        </div>
      </div>

      <div style={{ padding: '8px 24px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Btn block color={game.color} onClick={onRestart}>เล่นอีกครั้ง</Btn>
        <GhostBtn block color={BRAND.inkSoft} onClick={onExit}>กลับหน้าหลัก</GhostBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. MEMORY MATCH — 4x4 grid, 8 pairs
// ─────────────────────────────────────────────────────────────
function MemoryGame({ onFinish, onExit }) {
  const game = GAME_BY_ID.memory;
  // Pick 6 random pairs from the 9 SFB behaviors → 12 cards (3 cols × 4 rows)
  const PAIRS_PER_ROUND = 6;
  const DURATION = 120; // 2 minutes
  const [phase, setPhase] = React.useState('ready');
  const [deck, setDeck] = React.useState([]);
  const [flipped, setFlipped] = React.useState([]);
  const [matched, setMatched] = React.useState([]);
  const [moves, setMoves] = React.useState(0);
  const [time, setTime] = React.useState(DURATION);
  const tRef = React.useRef(null);
  const t0Ref = React.useRef(0);

  React.useEffect(() => () => clearInterval(tRef.current), []);

  const start = () => {
    const shuffled = [...SFB_PAIRS].sort(() => Math.random() - 0.5).slice(0, PAIRS_PER_ROUND);
    const cards = [];
    shuffled.forEach((p, i) => {
      cards.push({ id: `${p.id}-c`, pairId: p.id, side: 'concept', pair: p });
      cards.push({ id: `${p.id}-d`, pairId: p.id, side: 'desc',    pair: p });
    });
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    setDeck(cards); setFlipped([]); setMatched([]); setMoves(0); setTime(DURATION);
    setPhase('playing');
    t0Ref.current = Date.now();
    tRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0Ref.current) / 1000;
      const rem = Math.max(0, DURATION - elapsed);
      setTime(rem);
      if (rem <= 0) {
        clearInterval(tRef.current);
        setPhase('done');
      }
    }, 100);
  };

  const flip = (idx) => {
    if (phase !== 'playing') return;
    if (flipped.includes(idx) || matched.includes(idx)) return;
    if (flipped.length === 2) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves(m => m + 1);
      const [a, b] = next;
      // Match = same pairId, opposite sides
      const isMatch = deck[a].pairId === deck[b].pairId && deck[a].side !== deck[b].side;
      if (isMatch) {
        setTimeout(() => {
          setMatched(m => {
            const nm = [...m, a, b];
            if (nm.length === deck.length) {
              clearInterval(tRef.current);
              setPhase('done');
            }
            return nm;
          });
          setFlipped([]);
        }, 450);
      } else {
        setTimeout(() => setFlipped([]), 900);
      }
    }
  };

  const matchedPairs = matched.length / 2;
  const timeUsed = Math.max(0, DURATION - time);
  const hud = phase === 'playing' ? (
    <div style={{ display: 'flex', gap: 8 }}>
      <Pill label="คู่" value={`${matchedPairs}/${PAIRS_PER_ROUND}`} color={game.color} />
      <Pill label="ตา" value={moves} color={game.color} />
      <Pill label="เวลา" value={formatMMSS(time)} color={time < 30 ? BRAND.red : game.color} />
    </div>
  ) : null;

  return (
    <GameShell title={game.name} color={game.color} hud={hud}>
      {phase === 'ready' && (
        <ReadyScreen game={game} body="พลิกการ์ดทีละ 2 ใบ จับคู่ “คำสั้น” กับ “ความหมาย” ของพฤติกรรม SFB ให้ครบ 6 คู่"
          onStart={start} onExit={onExit} />
      )}
      {phase === 'playing' && (
        <div style={{
          position: 'absolute', inset: 0, background: game.bg,
          padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            width: '100%', maxWidth: 360,
          }}>
            {deck.map((c, idx) => {
              const isFlip = flipped.includes(idx) || matched.includes(idx);
              const isMatched = matched.includes(idx);
              const pillarColor = PILLARS[c.pair.pillar].color;
              return (
                <div key={idx} onClick={() => flip(idx)} style={{
                  aspectRatio: '4/5', position: 'relative', cursor: 'pointer',
                  perspective: 800,
                }}>
                  <div style={{
                    position: 'absolute', inset: 0, transformStyle: 'preserve-3d',
                    transition: 'transform 320ms',
                    transform: isFlip ? 'rotateY(180deg)' : 'rotateY(0)',
                  }}>
                    {/* back */}
                    <div style={{
                      position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                      borderRadius: 12, background: game.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Prompt', fontSize: 18, fontWeight: 800, letterSpacing: 1,
                      boxShadow: '0 4px 0 rgba(0,0,0,0.12)',
                    }}>SFB</div>
                    {/* face */}
                    <div style={{
                      position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      borderRadius: 12, background: '#fff',
                      display: 'flex', flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '8px 8px',
                      opacity: isMatched ? 0.55 : 1,
                      boxShadow: '0 4px 0 rgba(0,0,0,0.08)',
                      border: `2px solid ${pillarColor}40`,
                    }}>
                      <div style={{
                        fontSize: 8, fontWeight: 800, color: '#fff',
                        background: pillarColor, padding: '2px 6px', borderRadius: 999,
                        alignSelf: 'flex-start', letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}>{PILLARS[c.pair.pillar].name}</div>

                      <div style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                        gap: 4, padding: '4px 2px',
                      }}>
                        {c.side === 'concept' ? (
                          <>
                            <div style={{ fontSize: 20 }}>{c.pair.emoji}</div>
                            <div style={{
                              fontFamily: 'Prompt', fontSize: 12, fontWeight: 700,
                              color: pillarColor, lineHeight: 1.15,
                            }}>{c.pair.concept}</div>
                          </>
                        ) : (
                          <div style={{
                            fontFamily: 'Prompt', fontSize: 11, fontWeight: 500,
                            color: BRAND.ink, lineHeight: 1.3,
                            textWrap: 'balance',
                          }}>“{c.pair.desc}”</div>
                        )}
                      </div>

                      <div style={{
                        fontSize: 8, color: BRAND.muted, textAlign: 'center',
                        letterSpacing: 0.5,
                      }}>{c.side === 'concept' ? 'คำสั้น' : 'ความหมาย'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {phase === 'done' && (
        <DoneScreen game={game} score={formatMMSS(timeUsed)} unit={matchedPairs === PAIRS_PER_ROUND ? 'ครบทุกคู่!' : `จับคู่ได้ ${matchedPairs}/${PAIRS_PER_ROUND}`}
          subline={`ใช้ ${moves} ตา`}
          onRestart={start} onExit={() => { onFinish?.(matchedPairs); onExit?.(); }} />
      )}
    </GameShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. CATCH THE FALLING — paddle catches items
// ─────────────────────────────────────────────────────────────
function CatchGame({ onFinish, onExit }) {
  const game = GAME_BY_ID.catch;
  const DURATION = 25;
  const W = 360, H = 480;
  const [phase, setPhase] = React.useState('ready');
  const [paddleX, setPaddleX] = React.useState(W/2);
  const [items, setItems] = React.useState([]);
  const [score, setScore] = React.useState(0);
  const [time, setTime] = React.useState(DURATION);
  const fieldRef = React.useRef(null);
  const tRef = React.useRef(null);
  const itemIdRef = React.useRef(0);

  React.useEffect(() => () => clearInterval(tRef.current), []);

  const start = () => {
    setScore(0); setItems([]); setTime(DURATION); setPaddleX(W/2);
    setPhase('playing');
    const t0 = Date.now();
    let lastSpawn = 0;
    tRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      const rem = Math.max(0, DURATION - elapsed);
      setTime(rem);
      if (rem <= 0) {
        clearInterval(tRef.current);
        setPhase('done');
        return;
      }
      // spawn — items appear more frequently (every ~300–500ms)
      if (Date.now() - lastSpawn > 300 + Math.random()*200) {
        lastSpawn = Date.now();
        itemIdRef.current++;
        const isGood = Math.random() < 0.72;
        const pool = isGood ? CATCH_GOOD : CATCH_BAD;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setItems(it => [...it, {
          id: itemIdRef.current,
          x: 30 + Math.random() * (W - 60),
          y: -30,
          kind: isGood ? 'good' : 'bad',
          sym: pick.emoji,
          label: pick.label,
          labelColor: pick.color,
        }]);
      }
      // move
      setItems(it => {
        const dt = 0.05;
        const fall = 200 + (DURATION - rem) * 8; // speeds up
        return it.map(o => ({...o, y: o.y + fall * dt})).filter(o => o.y < H + 40);
      });
    }, 50);
  };

  // collision detection
  React.useEffect(() => {
    if (phase !== 'playing') return;
    setItems(it => {
      const remaining = [];
      let s = score;
      for (const o of it) {
        if (o.y > H - 70 && o.y < H - 30 && Math.abs(o.x - paddleX) < 45) {
          // caught
          if (o.kind === 'good') s += 1; else s -= 2;
          if (s < 0) s = 0;
        } else {
          remaining.push(o);
        }
      }
      if (s !== score) setScore(s);
      return remaining;
    });
  }, [items, paddleX, phase]);

  const handleMove = (e) => {
    if (!fieldRef.current) return;
    const rect = fieldRef.current.getBoundingClientRect();
    const cx = e.touches?.[0]?.clientX ?? e.clientX;
    const x = ((cx - rect.left) / rect.width) * W;
    setPaddleX(Math.max(40, Math.min(W - 40, x)));
  };

  const hud = phase === 'playing' ? (
    <div style={{ display: 'flex', gap: 10 }}>
      <Pill label="เวลา" value={Math.ceil(time) + 's'} color={BRAND.red} />
      <Pill label="คะแนน" value={score} color={game.color} />
    </div>
  ) : null;

  return (
    <GameShell title={game.name} color={game.color} hud={hud}>
      {phase === 'ready' && (
        <ReadyScreen game={game} body='เลื่อนนิ้วเพื่อขยับตะกร้า เก็บค่านิยม "Stronger 💪", "Faster ⚡", "Better 📈" และหลบ "ระเบิด 💣"' onStart={start} onExit={onExit} />
      )}
      {phase === 'playing' && (
        <div ref={fieldRef}
          onMouseMove={handleMove} onTouchMove={handleMove}
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, ${game.bg} 0%, #fff 100%)`,
            overflow: 'hidden', cursor: 'pointer',
          }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%', display: 'block' }}>
            {items.map(o => (
              <g key={o.id}>
                <text x={o.x} y={o.y}
                  fontSize="36" textAnchor="middle" dominantBaseline="middle">{o.sym}</text>
                <text x={o.x} y={o.y + 24}
                  fontSize="11" textAnchor="middle" fontFamily="Prompt"
                  fill={o.labelColor || (o.kind === 'good' ? game.color : '#a04050')}
                  fontWeight="700">{o.label}</text>
              </g>
            ))}
            {/* paddle */}
            <g transform={`translate(${paddleX}, ${H - 50})`}>
              <path d="M -45 -10 L 45 -10 L 38 20 L -38 20 Z" fill={game.color} />
              <rect x="-46" y="-14" width="92" height="6" rx="3" fill={game.color} />
            </g>
          </svg>
        </div>
      )}
      {phase === 'done' && (
        <DoneScreen game={game} score={score} unit="ชิ้น" onRestart={start} onExit={() => { onFinish?.(score); onExit?.(); }} />
      )}
    </GameShell>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. "ใครคือที่สุด" — 9-question SFB peer-recognition quiz
//    Answer: TYPE the coworker who best embodies each SFB behavior.
//    Tracks: typed name per question + time taken per question + total.
// ─────────────────────────────────────────────────────────────
function ReactionGame({ onFinish, onExit }) {
  const game = GAME_BY_ID.reaction;
  const QUESTIONS = SFB_PAIRS; // 9 SFB behaviors
  const TOTAL_Q = QUESTIONS.length;
  const [phase, setPhase] = React.useState('ready'); // ready | quiz | done
  const [qIdx, setQIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [elapsed, setElapsed] = React.useState(0);
  const qStartRef = React.useRef(0);
  const totalStartRef = React.useRef(0);
  const tickRef = React.useRef(null);
  const inputRef = React.useRef(null);

  React.useEffect(() => () => clearInterval(tickRef.current), []);

  React.useEffect(() => {
    if (phase === 'quiz' && inputRef.current) {
      // small delay so the input is mounted/visible
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [phase, qIdx]);

  const start = () => {
    setQIdx(0); setAnswers([]); setInput(''); setElapsed(0);
    setPhase('quiz');
    totalStartRef.current = Date.now();
    qStartRef.current = Date.now();
    tickRef.current = setInterval(() => {
      setElapsed((Date.now() - totalStartRef.current) / 1000);
    }, 100);
  };

  const submit = () => {
    const name = input.trim();
    if (!name) return;
    const timeMs = Date.now() - qStartRef.current;
    const ans = { q: QUESTIONS[qIdx], name, timeMs };
    const next = [...answers, ans];
    setAnswers(next);
    if (qIdx + 1 >= TOTAL_Q) {
      clearInterval(tickRef.current);
      setPhase('done');
    } else {
      setQIdx(qIdx + 1);
      setInput('');
      qStartRef.current = Date.now();
    }
  };

  const skip = () => {
    const timeMs = Date.now() - qStartRef.current;
    const ans = { q: QUESTIONS[qIdx], name: '—', timeMs, skipped: true };
    const next = [...answers, ans];
    setAnswers(next);
    if (qIdx + 1 >= TOTAL_Q) {
      clearInterval(tickRef.current);
      setPhase('done');
    } else {
      setQIdx(qIdx + 1);
      setInput('');
      qStartRef.current = Date.now();
    }
  };

  const totalSec = answers.reduce((s, a) => s + a.timeMs, 0) / 1000;
  const currentQ = QUESTIONS[qIdx];
  const pillar = currentQ ? PILLARS[currentQ.pillar] : null;

  const hud = phase === 'quiz' ? (
    <div style={{ display: 'flex', gap: 8 }}>
      <Pill label="ข้อ" value={`${qIdx + 1}/${TOTAL_Q}`} color={game.color} />
      <Pill label="เวลา" value={elapsed.toFixed(1) + 's'} color={BRAND.red} />
    </div>
  ) : null;

  return (
    <GameShell title={game.name} color={game.color} hud={hud}>
      {phase === 'ready' && (
        <ReadyScreen game={game}
          body="ในแต่ละข้อ พิมพ์ชื่อเพื่อนร่วมงานที่คุณคิดว่าทำพฤติกรรมนั้นได้ดีที่สุด — ตอบให้ครบ 9 ข้อ"
          onStart={start} onExit={onExit} />
      )}

      {phase === 'quiz' && currentQ && (
        <div style={{
          position: 'absolute', inset: 0, background: game.bg,
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Prompt',
        }}>
          {/* Progress dots */}
          <div style={{ padding: '14px 18px 8px', display: 'flex', gap: 4 }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 999,
                background: i <= qIdx ? pillar.color : '#ffffff80',
                opacity: i <= qIdx ? 1 : 0.6,
              }} />
            ))}
          </div>

          {/* Question card */}
          <div style={{
            margin: '8px 18px', padding: '18px 20px',
            background: '#fff', borderRadius: 20,
            boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: pillar.color,
              letterSpacing: 1, textTransform: 'uppercase',
            }}>คำถามที่ {qIdx + 1} จาก {TOTAL_Q}</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 8 }}>
              <div style={{ fontSize: 32, lineHeight: 1 }}>{currentQ.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: pillar.color, lineHeight: 1.15 }}>{currentQ.concept}</div>
                <div style={{ fontSize: 13, color: BRAND.inkSoft, marginTop: 2, lineHeight: 1.35 }}>“{currentQ.desc}”</div>
              </div>
            </div>
            <div style={{
              marginTop: 12, padding: '10px 12px', background: pillar.color + '12',
              borderRadius: 12, fontSize: 13, color: BRAND.ink, fontWeight: 500,
            }}>
              ใครคือเพื่อนร่วมงานที่ทำสิ่งนี้ได้ <strong style={{ color: pillar.color }}>ดีที่สุด</strong>?
            </div>
          </div>

          {/* Input field */}
          <div style={{ padding: '8px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: BRAND.inkSoft,
              letterSpacing: 0.8, marginLeft: 4, marginBottom: 6,
            }}>พิมพ์ชื่อเพื่อนร่วมงาน</div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fff', borderRadius: 16, padding: '14px 16px',
              boxShadow: `0 0 0 2px ${pillar.color}30, 0 4px 14px rgba(0,0,0,0.04)`,
            }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                placeholder="เช่น สมชาย ใจดี"
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  flex: 1, fontFamily: 'Prompt', fontSize: 18, fontWeight: 600,
                  color: BRAND.ink, minWidth: 0,
                }}
              />
              {input && (
                <button onClick={() => setInput('')} style={{
                  border: 'none', background: BRAND.hairline, cursor: 'pointer',
                  color: BRAND.inkSoft, fontSize: 14,
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, lineHeight: 1,
                }}>×</button>
              )}
            </div>
            <div style={{
              fontSize: 11, color: BRAND.muted, marginLeft: 4, marginTop: 8,
            }}>กด Enter หรือปุ่ม "ส่งคำตอบ" ด้านล่าง</div>
          </div>

          {/* Actions */}
          <div style={{ padding: '12px 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn block color={game.color} onClick={submit}
              style={{ opacity: input.trim() ? 1 : 0.5, pointerEvents: input.trim() ? 'auto' : 'none' }}>
              {qIdx + 1 === TOTAL_Q ? 'ส่งคำตอบสุดท้าย' : 'ส่งคำตอบ →'}
            </Btn>
            <button onClick={skip} style={{
              background: 'transparent', border: 'none',
              color: BRAND.inkSoft, padding: '8px',
              fontFamily: 'Prompt', fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
            }}>ข้ามข้อนี้</button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <PeerQuizDone game={game} answers={answers} totalSec={totalSec}
          onRestart={start} onExit={() => { onFinish?.(Math.round(totalSec), { answers, totalSec }); onExit?.(); }} />
      )}
    </GameShell>
  );
}

function PeerQuizDone({ game, answers, totalSec, onRestart, onExit }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: game.bg,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Prompt',
    }}>
      <div style={{
        padding: '20px 24px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontSize: 32 }}>🎉</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: BRAND.ink, marginTop: 2 }}>ส่งคำตอบครบ 9 ข้อ!</div>
        <div style={{
          marginTop: 10, background: '#fff', borderRadius: 18,
          padding: '10px 20px', display: 'flex', gap: 18, alignItems: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: BRAND.inkSoft, letterSpacing: 1 }}>เวลารวม</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: game.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{totalSec.toFixed(1)}<span style={{ fontSize: 13, color: BRAND.inkSoft, fontWeight: 500 }}>s</span></div>
          </div>
          <div style={{ width: 1, height: 28, background: BRAND.hairline }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: BRAND.inkSoft, letterSpacing: 1 }}>เฉลี่ย/ข้อ</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: BRAND.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{(totalSec / answers.length).toFixed(1)}<span style={{ fontSize: 13, color: BRAND.inkSoft, fontWeight: 500 }}>s</span></div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 12px' }}>
        <div style={{ fontSize: 11, color: BRAND.inkSoft, letterSpacing: 1, fontWeight: 600, padding: '4px 4px 8px' }}>
          คำตอบของคุณ
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {answers.map((a, i) => {
            const p = PILLARS[a.q.pillar];
            const isSkipped = a.skipped;
            return (
              <div key={i} style={{
                background: '#fff', borderRadius: 12, padding: '8px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{a.q.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.color, lineHeight: 1.1 }}>{a.q.concept}</div>
                  <div style={{ fontSize: 11, color: BRAND.muted, marginTop: 1 }}>
                    {isSkipped
                      ? <span style={{ color: BRAND.muted, fontStyle: 'italic' }}>ข้ามข้อนี้</span>
                      : <strong style={{ color: BRAND.ink }}>{a.name}</strong>}
                  </div>
                </div>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: BRAND.inkSoft,
                  fontVariantNumeric: 'tabular-nums',
                  background: BRAND.hairline, padding: '2px 7px', borderRadius: 999,
                }}>{(a.timeMs / 1000).toFixed(1)}s</div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: 14, padding: '12px 14px',
          background: '#fff', borderRadius: 14,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 10, color: BRAND.inkSoft, letterSpacing: 1, fontWeight: 600 }}>SFB CULTURE</div>
          <SFBLine pillar="stronger" tagline="ทำให้ได้" />
          <SFBLine pillar="faster"   tagline="ทำให้ไว" />
          <SFBLine pillar="better"   tagline="ทำให้ดีขึ้น" />
        </div>
      </div>

      <div style={{ padding: '8px 24px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Btn block color={game.color} onClick={onRestart}>เล่นอีกครั้ง</Btn>
        <GhostBtn block color={BRAND.inkSoft} onClick={onExit}>กลับหน้าหลัก</GhostBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 5. WHACK-A-MOLE — 3x3 grid, moles pop up
// ─────────────────────────────────────────────────────────────

// Cute groundhog/mole — bold-outline cartoon: round ears, dot eyes,
// big buck teeth, paws gripping the hole rim. Expression by `face`.
function CuteMole({ color = '#b07a4a', accent = '#5a3a22', face = 'neutral' }) {
  const OUT = accent;           // bold outline
  const INNER = accent;         // inner-ear / paw detail
  const SW = 3;                 // outline width

  // Eyes — solid dots for neutral/sad; happy curves up; sleepy droops
  const eye = (cx, cy) => {
    if (face === 'sleepy') return <path d={`M ${cx-5} ${cy} q 5 4 10 0`} stroke={OUT} strokeWidth="2.8" fill="none" strokeLinecap="round" />;
    if (face === 'happy')  return <path d={`M ${cx-5.5} ${cy+1.5} q 5.5 -7 11 0`} stroke="#23150c" strokeWidth="3" fill="none" strokeLinecap="round" />;
    return (
      <g>
        <circle cx={cx} cy={cy} r="4.6" fill="#23150c" />
        <circle cx={cx + 1.5} cy={cy - 1.6} r="1.5" fill="#fff" />
      </g>
    );
  };

  return (
    <svg viewBox="0 0 100 104" width="100%" height="100%" style={{ display: 'block' }}>
      {/* ── ears (behind head) ── */}
      <g stroke={OUT} strokeWidth={SW}>
        <circle cx="27" cy="24" r="14" fill={color} />
        <circle cx="73" cy="24" r="14" fill={color} />
      </g>
      <circle cx="27" cy="25" r="6.5" fill={INNER} />
      <circle cx="73" cy="25" r="6.5" fill={INNER} />

      {/* ── head / body ── */}
      <ellipse cx="50" cy="56" rx="37" ry="36" fill={color} stroke={OUT} strokeWidth={SW} />

      {/* lighter muzzle patch (works on any body color) */}
      <ellipse cx="50" cy="66" rx="23" ry="18" fill="#fff" opacity="0.22" />

      {/* eyes */}
      {eye(37, 50)}
      {eye(63, 50)}

      {/* wide friendly grin (or frown when sad) */}
      {face !== 'sad' ? (
        <g stroke={OUT} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 30 62 Q 40 79 50 76" />
          <path d="M 70 62 Q 60 79 50 76" />
        </g>
      ) : (
        <g stroke={OUT} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 34 76 Q 42 68 50 70" />
          <path d="M 66 76 Q 58 68 50 70" />
        </g>
      )}

      {/* nose — dark rounded triangle */}
      <path d="M 50 56 Q 42 56 44.5 62 Q 50 69 55.5 62 Q 58 56 50 56 Z" fill="#23150c" />

      {/* buck teeth — two big white front teeth */}
      <g>
        <path d="M 44.3 66 h 5.2 a 1.5 1.5 0 0 1 1.5 1.5 v 7.5 a 2.6 2.6 0 0 1 -8.2 0 v -7.5 a 1.5 1.5 0 0 1 1.5 -1.5 Z"
          fill="#fff" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
        <path d="M 50.5 66 h 5.2 a 1.5 1.5 0 0 1 1.5 1.5 v 7.5 a 2.6 2.6 0 0 1 -8.2 0 v -7.5 a 1.5 1.5 0 0 1 1.5 -1.5 Z"
          fill="#fff" stroke={OUT} strokeWidth="2" strokeLinejoin="round" />
      </g>

      {/* ── paws gripping the rim ── */}
      <g stroke={OUT} strokeWidth={SW} fill={color}>
        <path d="M 24 90 q 0 -9 9 -9 q 9 0 9 9 Z" />
        <path d="M 58 90 q 0 -9 9 -9 q 9 0 9 9 Z" />
      </g>
      {/* little claw lines on paws */}
      <g stroke={OUT} strokeWidth="1.6" strokeLinecap="round">
        <line x1="30" y1="86" x2="30" y2="90" />
        <line x1="33" y1="85" x2="33" y2="90" />
        <line x1="36" y1="86" x2="36" y2="90" />
        <line x1="64" y1="86" x2="64" y2="90" />
        <line x1="67" y1="85" x2="67" y2="90" />
        <line x1="70" y1="86" x2="70" y2="90" />
      </g>
    </svg>
  );
}

function WhackGame({ onFinish, onExit }) {
  const game = GAME_BY_ID.whack;
  const DURATION = 120; // 2 นาที
  const [phase, setPhase] = React.useState('ready');
  const [active, setActive] = React.useState(null);
  const [score, setScore] = React.useState(0);
  const [misses, setMisses] = React.useState(0);
  const [time, setTime] = React.useState(DURATION);
  const tRef = React.useRef(null);
  const missTimeoutRef = React.useRef(null);
  const t0Ref = React.useRef(0);
  // Shuffled queue of pairs — when exhausted, reshuffle (so within a round
  // we cycle through all pairs before any repeats).
  const queueRef = React.useRef([]);

  React.useEffect(() => () => {
    clearInterval(tRef.current);
    clearTimeout(missTimeoutRef.current);
  }, []);

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const spawnPair = () => {
    // If the queue is empty, reshuffle the full pair list (but keep the
    // last-shown pair out of the front slot so the boundary feels random too).
    if (queueRef.current.length === 0) {
      const last = active?._idx;
      let next = shuffle(WHACK_PAIRS.map((_, i) => i));
      if (typeof last === 'number' && next[0] === last && next.length > 1) {
        [next[0], next[1]] = [next[1], next[0]];
      }
      queueRef.current = next;
    }
    const pairIdx = queueRef.current.shift();
    const pair = WHACK_PAIRS[pairIdx];

    // pick two distinct holes
    const a = Math.floor(Math.random() * 9);
    let b = Math.floor(Math.random() * 9);
    while (b === a) b = Math.floor(Math.random() * 9);
    const badIdx = Math.random() < 0.5 ? a : b;
    const goodIdx = badIdx === a ? b : a;
    setActive({ _idx: pairIdx, badIdx, goodIdx, badText: pair.bad, goodText: pair.good, result: null });

    clearTimeout(missTimeoutRef.current);
    missTimeoutRef.current = setTimeout(() => {
      setActive(a => a ? { ...a, result: 'miss' } : a);
      setMisses(m => m + 1);
      setTimeout(() => {
        if (Date.now() - t0Ref.current < DURATION * 1000) spawnPair();
      }, 350);
    }, 4500);
  };

  const start = () => {
    setScore(0); setMisses(0); setTime(DURATION); setActive(null);
    queueRef.current = [];
    setPhase('playing');
    t0Ref.current = Date.now();
    tRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0Ref.current) / 1000;
      const rem = Math.max(0, DURATION - elapsed);
      setTime(rem);
      if (rem <= 0) {
        clearInterval(tRef.current);
        clearTimeout(missTimeoutRef.current);
        setActive(null);
        setPhase('done');
      }
    }, 100);
    spawnPair();
  };

  const onWhack = (i) => {
    if (phase !== 'playing' || !active || active.result) return;
    clearTimeout(missTimeoutRef.current);
    if (i === active.goodIdx) {
      // Correct — whacked the Better behavior ("เลือกสิ่งดี")
      setActive(a => ({ ...a, result: 'correct' }));
      setScore(s => s + 1);
    } else if (i === active.badIdx) {
      // Wrong — whacked the bad/opposite behavior
      setActive(a => ({ ...a, result: 'wrong' }));
      setMisses(m => m + 1);
    } else {
      return; // empty hole click — ignore
    }
    setTimeout(() => {
      if (Date.now() - t0Ref.current < DURATION * 1000) spawnPair();
    }, 450);
  };

  const hud = phase === 'playing' ? (
    <div style={{ display: 'flex', gap: 8 }}>
      <Pill label="เวลา"  value={formatMMSS(time)} color={BRAND.red} />
      <Pill label="✓"     value={score}  color={'#1f8a4d'} />
      <Pill label="✕"     value={misses} color={'#c63838'} />
    </div>
  ) : null;

  return (
    <GameShell title={game.name} color={game.color} hud={hud}>
      {phase === 'ready' && (
        <ReadyScreen game={game}
          body='ตุ่น 2 ตัวจะโผล่พร้อมกัน — ตัวหนึ่งเป็นพฤติกรรม "SFB" อีกตัวเป็น "ตรงข้าม" รีบเลือก "ตุ่นตัวดี" ที่ทำพฤติกรรม SFB! เล่นได้ 2 นาที'
          onStart={start} onExit={onExit} />
      )}
      {phase === 'playing' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(180deg, #b9e3c2 0%, #92ccaa 100%)`,
          padding: '14px 18px', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          {/* Instruction strip */}
          <div style={{
            background: '#fff', borderRadius: 14, padding: '8px 14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontFamily: 'Prompt', fontSize: 12, color: BRAND.ink,
            textAlign: 'center', maxWidth: 320,
          }}>
            <strong style={{ color: '#1f8a4d' }}>เลือก "ตุ่นตัวดี"</strong> ที่ทำพฤติกรรม
            <strong style={{ color: BRAND.teal }}> SFB</strong>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            columnGap: 14, rowGap: 24,
            width: '100%', maxWidth: 320,
          }}>
            {Array.from({length: 9}).map((_, i) => {
              const isBad = active && active.badIdx === i;
              const isGood = active && active.goodIdx === i;
              const isActive = isBad || isGood;
              const result = active?.result;

              // Default look while pending: same warm brown groundhog
              // (cute, buck-toothed) for BOTH so the player reads labels.
              let moleBg = '#b07a4a';        // body
              let moleAccent = '#5a3a22';    // outline / inner-ear
              let label = '';
              let labelColor = BRAND.ink;
              let face = 'neutral';          // neutral | happy | sad | sleepy

              if (isGood) {
                label = active.goodText;
                if (result === 'correct')      { moleBg = '#5ec88a'; moleAccent = '#2f7d4f'; label = '✓ ใช่เลย!'; labelColor = '#1f8a4d'; face = 'happy'; }
                else if (result === 'wrong')   { moleBg = '#b07a4a'; moleAccent = '#5a3a22'; face = 'happy'; }
                else if (result === 'miss')    { moleBg = '#c9c9c9'; moleAccent = '#8f8f8f'; label = '— หายแล้ว —'; labelColor = '#777'; face = 'sleepy'; }
              }
              if (isBad) {
                label = active.badText;
                if (result === 'wrong')        { moleBg = '#e39197'; moleAccent = '#b0545c'; label = '✕ ไม่ใช่!'; labelColor = '#a04050'; face = 'sad'; }
                else if (result === 'correct') { moleBg = '#c9c9c9'; moleAccent = '#8f8f8f'; face = 'sad'; }
                else if (result === 'miss')    { moleBg = '#c9c9c9'; moleAccent = '#8f8f8f'; labelColor = '#777'; face = 'sleepy'; }
              }

              return (
                <div key={i} onMouseDown={() => onWhack(i)} onTouchStart={() => onWhack(i)}
                  style={{
                    aspectRatio: '1/1', position: 'relative',
                    cursor: isActive ? 'pointer' : 'default',
                  }}>
                  {/* Dirt hole — clipped so the mole appears to emerge */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    background: 'radial-gradient(circle at 50% 35%, #6b4528 0%, #4a2f1a 80%)',
                    boxShadow: 'inset 0 8px 16px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', left: 0, right: 0,
                      bottom: isActive ? '0%' : '-95%',
                      height: '100%',
                      transition: 'bottom 240ms cubic-bezier(0.3, 1.4, 0.5, 1)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}>
                      <CuteMole color={moleBg} accent={moleAccent} face={face} />
                    </div>
                  </div>

                  {/* Label — OUTSIDE the round clip, allowed to extend
                      beyond the cell so long words stay readable. */}
                  {label && isActive && (
                    <div style={{
                      position: 'absolute',
                      bottom: -6, left: '50%', transform: 'translateX(-50%)',
                      background: '#fff',
                      color: labelColor,
                      padding: '4px 10px', borderRadius: 10,
                      fontFamily: 'Prompt', fontSize: 11, fontWeight: 700,
                      whiteSpace: 'nowrap',
                      lineHeight: 1.1,
                      boxShadow: '0 3px 10px rgba(0,0,0,0.22)',
                      zIndex: 5, pointerEvents: 'none',
                    }}>{label}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ height: 32 }} />
        </div>
      )}
      {phase === 'done' && (
        <DoneScreen game={game} score={score} unit="ครั้ง"
          subline={`พลาด ${misses} ครั้ง · ความแม่นยำ ${score + misses ? Math.round(score / (score + misses) * 100) : 0}%`}
          onRestart={start} onExit={() => { onFinish?.(score); onExit?.(); }} />
      )}
    </GameShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared sub-screens
// ─────────────────────────────────────────────────────────────
function ReadyScreen({ game, body, onStart, onExit }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: game.bg,
      padding: '32px 28px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      fontFamily: 'Prompt',
    }}>
      <GameIcon kind={game.icon} size={88} color="#fff" bg={game.color} />
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 18, color: BRAND.ink }}>{game.name}</div>
      <div style={{ fontSize: 12, color: BRAND.inkSoft, marginTop: 2, letterSpacing: 1 }}>{game.en.toUpperCase()}</div>
      <div style={{
        marginTop: 20, fontSize: 15, color: BRAND.ink, opacity: 0.85,
        maxWidth: 290, lineHeight: 1.55,
      }}>{body}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32, width: '100%', maxWidth: 260 }}>
        <Btn block color={game.color} onClick={onStart}>เริ่มเล่น</Btn>
        {onExit && <GhostBtn block color={BRAND.inkSoft} onClick={onExit}>กลับ</GhostBtn>}
      </div>
    </div>
  );
}

function DoneScreen({ game, score, unit, subline, lowerBetter, onRestart, onExit }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: game.bg,
      padding: '20px 28px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      fontFamily: 'Prompt', overflow: 'auto',
    }}>
      <div style={{ fontSize: 34 }}>🎉</div>
      <div style={{ fontSize: 20, fontWeight: 600, marginTop: 2, color: BRAND.ink }}>จบเกม!</div>
      <div style={{
        marginTop: 12, padding: '14px 32px',
        background: '#fff', borderRadius: 22,
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
        minWidth: 200,
      }}>
        <div style={{ fontSize: 11, color: BRAND.inkSoft, letterSpacing: 1.4 }}>{lowerBetter ? 'เวลาเฉลี่ย' : 'คะแนนของคุณ'}</div>
        <div style={{ fontFamily: 'Prompt', fontSize: 44, fontWeight: 800, color: game.color, lineHeight: 1.1, marginTop: 2 }}>
          {score}
        </div>
        <div style={{ fontSize: 13, color: BRAND.inkSoft }}>{unit}</div>
      </div>
      {subline && <div style={{ marginTop: 8, fontSize: 11, color: BRAND.inkSoft }}>{subline}</div>}

      {/* SFB tagline — appears on every game's done screen */}
      <div style={{
        marginTop: 14, padding: '14px 16px',
        background: '#fff', borderRadius: 18, maxWidth: 320, width: '100%',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ fontSize: 10, color: BRAND.inkSoft, letterSpacing: 1, fontWeight: 600 }}>SFB CULTURE</div>
        <SFBLine pillar="stronger" tagline="ทำให้ได้" />
        <SFBLine pillar="faster"   tagline="ทำให้ไว" />
        <SFBLine pillar="better"   tagline="ทำให้ดีขึ้น" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, width: '100%', maxWidth: 260 }}>
        <Btn block color={game.color} onClick={onRestart}>เล่นอีกครั้ง</Btn>
        <GhostBtn block color={BRAND.inkSoft} onClick={onExit}>กลับหน้าหลัก</GhostBtn>
      </div>
    </div>
  );
}

function SFBLine({ pillar, tagline }) {
  const p = PILLARS[pillar];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      textAlign: 'left',
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0,
      }} />
      <div style={{
        fontFamily: 'Prompt', fontSize: 14, fontWeight: 700, color: p.color, width: 78,
      }}>{p.name}</div>
      <div style={{ color: BRAND.muted, fontSize: 13 }}>:</div>
      <div style={{ fontFamily: 'Prompt', fontSize: 14, color: BRAND.ink, fontWeight: 500 }}>{tagline}</div>
    </div>
  );
}

function Pill({ label, value, color = BRAND.navy }) {
  return (
    <div style={{
      background: color + '15', color, padding: '6px 12px', borderRadius: 999,
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: 'Prompt', fontSize: 13, fontWeight: 600,
    }}>
      <span style={{ opacity: 0.75 }}>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

Object.assign(window, {
  TapSpeedGame, MemoryGame, CatchGame, ReactionGame, WhackGame, Pill, CuteMole,
});
