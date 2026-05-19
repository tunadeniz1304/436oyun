import { useNavigate } from 'react-router-dom';
import './UserGuide.css';

/**
 * User Guide — ISO Testing World player documentation.
 * Visual skeleton ported from User Manual.html (sidebar + 9 chapters).
 * Content rewritten against the live data files in src/data/* so every
 * concrete claim (counts, timer, controls, scoring) matches the game.
 */
function UserGuide() {
  const navigate = useNavigate();

  return (
    <div className="user-guide">
      <div className="doc">

        {/* ════════════ SIDEBAR ════════════ */}
        <aside className="toc">
          <div className="identity">
            {/* Compact skyline mark — five zone colors */}
            <svg
              className="mark"
              width="120"
              height="84"
              viewBox="0 0 200 140"
              fill="none"
              aria-hidden="true"
            >
              <rect x="14"  y="52" width="28" height="68"  fill="#993C1D" />
              <rect x="50"  y="32" width="28" height="88"  fill="#0C447C" />
              <rect x="86"  y="62" width="28" height="58"  fill="#3B6D11" />
              <rect x="122" y="42" width="28" height="78"  fill="#854F0B" />
              <rect x="158" y="20" width="28" height="100" fill="#3C3489" />
              <line x1="172" y1="20" x2="172" y2="10" stroke="#3C3489" strokeWidth="2" strokeLinecap="round" />
              <circle cx="172" cy="8" r="2.2" fill="#3C3489" />
              <g fill="#fefcf7">
                {[
                  [22,64],[30,64],[22,80],[30,80],[22,96],[30,96],
                  [58,44],[66,44],[58,60],[66,60],[58,76],[66,76],[58,92],[66,92],
                  [94,74],[102,74],[94,90],[102,90],
                  [130,54],[138,54],[130,70],[138,70],[130,86],[138,86],
                  [166,32],[174,32],[166,48],[174,48],[166,64],[174,64],[166,80],[174,80],[166,96],[174,96],
                ].map(([x, y], i) => (
                  <rect key={i} x={x} y={y} width="3" height="3" />
                ))}
              </g>
              <line x1="4" y1="122" x2="196" y2="122" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div>
              <div className="name">ISO Testing World</div>
              <div className="role">Player documentation</div>
            </div>
          </div>

          <div className="lbl">Contents</div>
          <ol>
            <li><a href="#quick-start">Quick start</a></li>
            <li><a href="#objective">Game objective</a></li>
            <li><a href="#navigation">Main navigation</a></li>
            <li><a href="#office">Inside each office</a></li>
            <li><a href="#zones">Zone-by-zone guide</a></li>
            <li><a href="#feedback">Understanding feedback</a></li>
            <li><a href="#scoring">Scoring &amp; progress</a></li>
            <li><a href="#controls">Controls</a></li>
            <li><a href="#trouble">Troubleshooting</a></li>
            <li><a href="#checklist">Completion checklist</a></li>
          </ol>

          <div className="doc-meta">
            <div><strong>Doc</strong> &nbsp; ITW-UM-01</div>
            <div><strong>Rev</strong> &nbsp; 2026.05 / r1</div>
            <div><strong>Audience</strong> &nbsp; Players · Instructors</div>
            <div><strong>Read time</strong> &nbsp; ~7 min</div>
          </div>

          <div className="toc__back-wrap">
            <span className="toc__back-caption">Learned everything to play?</span>
            <button
              type="button"
              className="back-link"
              onClick={() => navigate('/')}
              aria-label="Back to World Map — start playing"
            >
              ← Back to World Map
            </button>
          </div>
        </aside>

        {/* ════════════ MAIN ════════════ */}
        <main>

          {/* HERO */}
          <header className="hero">
            <div className="eyebrow-row">
              <span className="clause-ref">ISO/IEC/IEEE 29119-1:2022</span>
              <span className="doc-no">Part 1 · General concepts · Player guide</span>
            </div>
            <h1>User Manual</h1>
            <p className="sub">
              How to play ISO Testing World and complete the ISO incident
              investigation — from the corporate World Map through each office
              and zone, to the Final Inspection report.
            </p>

            <div className="fact-row">
              <div className="fact"><span className="k">Format</span><span className="v">Browser simulation</span></div>
              <div className="fact"><span className="k">Zones</span><span className="v">5 + Inspection</span></div>
              <div className="fact"><span className="k">Scenario</span><span className="v">Incident #047</span></div>
              <div className="fact"><span className="k">Playthrough</span><span className="v">10–15 min</span></div>
            </div>
          </header>

          {/* 01 · QUICK START */}
          <section className="chapter" id="quick-start">
            <div className="chapter-head">
              <div className="chapter-num">01</div>
              <h2>Quick start</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">
                You can be playing within a minute. The game runs entirely in
                your browser — no installation, no account, no save file.
              </p>
              <div className="quickstart">
                <div className="step">
                  <div className="num">Step 01 · Launch</div>
                  <h4>Open the application</h4>
                  <p>Open the deployed URL in any modern browser. The 3D Corporate Test Campus loads as the entry screen.</p>
                </div>
                <div className="step">
                  <div className="num">Step 02 · Begin</div>
                  <h4>Pick a department</h4>
                  <p>The Error District is unlocked from the start. Click its building to enter the office and start the investigation.</p>
                </div>
                <div className="step">
                  <div className="num">Step 03 · Progress</div>
                  <h4>Unlock the Final Inspection</h4>
                  <p>Complete the four learning zones in order. Finishing them all unlocks the Final Inspection and the ISO Incident Report.</p>
                </div>
              </div>
            </div>
          </section>

          {/* 02 · OBJECTIVE */}
          <section className="chapter" id="objective">
            <div className="chapter-head">
              <div className="chapter-num">02</div>
              <h2>Game objective</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">
                You are the senior test engineer assigned to{' '}
                <strong>production incident #047</strong>. Your job is to
                investigate the incident through the lens of
                ISO/IEC/IEEE 29119-1:2022 Part 1.
              </p>
              <p>
                The goal is <em>not</em> simply a high score. The score reflects
                how well you have internalised ISO-precise terminology — the
                difference between an Error and a Defect, when Verification
                differs from Validation, what counts as a Test Basis, and which
                cells of a Test Level × Test Type matrix actually apply.
                Every decision you make is interpreted against the standard
                and resurfaces in your final report.
              </p>
              <p className="note">
                Treat each zone as a clause from the standard rendered as a
                small, hands-on exercise. The exercises are deliberately
                designed so that informal, everyday definitions produce the
                wrong answer.
              </p>
            </div>
          </section>

          {/* 03 · NAVIGATION */}
          <section className="chapter" id="navigation">
            <div className="chapter-head">
              <div className="chapter-num">03</div>
              <h2>Main navigation</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">
                Everything starts at the <strong>Corporate Test Campus</strong> —
                a 3D city you can rotate and zoom. Each building is one zone.
              </p>

              <figure className="screenshot">
                <img
                  src="/screenshots/landing_renkli.png"
                  alt="3D corporate campus with five coloured buildings representing the five concept zones"
                  loading="lazy"
                />
                <figcaption>The 3D World Map — five buildings, one per concept area. Zone 1 (coral) is always unlocked on arrival.</figcaption>
              </figure>

              <div className="map">
                <div className="map-stage">
                  <span className="corner">Mock · World Map</span>
                  <span className="corner-r">Incident #047</span>
                  <svg viewBox="0 0 360 200" width="100%" height="auto" style={{ display: 'block', marginTop: 14 }}>
                    <line x1="20" y1="170" x2="340" y2="170" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
                    {/* Z1 unlocked (coral) */}
                    <g>
                      <rect x="34" y="98" width="44" height="72" fill="#993C1D" />
                      <g fill="#fefcf7">
                        {[[42,106],[52,106],[62,106],[42,120],[52,120],[62,120],[42,134],[52,134],[62,134],[42,148],[52,148],[62,148]].map(([x,y],i) => (
                          <rect key={i} x={x} y={y} width="4" height="4" />
                        ))}
                      </g>
                      <text x="56" y="186" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill="#1a1a1a" letterSpacing="1">ZONE 1</text>
                    </g>
                    {/* Z2 next (blue, subdued) */}
                    <g opacity="0.5">
                      <rect x="92" y="74" width="44" height="96" fill="#0C447C" />
                      <text x="114" y="186" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill="#1a1a1a" letterSpacing="1">ZONE 2</text>
                    </g>
                    {/* Hatch pattern + locked zones */}
                    <defs>
                      <pattern id="ug-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                        <line x1="0" y1="0" x2="0" y2="6" stroke="#bbb" strokeWidth="2" />
                      </pattern>
                    </defs>
                    {[
                      { x: 150, y: 110, w: 44, h: 60,  lx: 165, ly: 128, tx: 172, ty: 186, label: 'LOCKED' },
                      { x: 208, y: 92,  w: 44, h: 78,  lx: 223, ly: 118, tx: 230, ty: 186, label: 'LOCKED' },
                      { x: 266, y: 62,  w: 44, h: 108, lx: 281, ly: 108, tx: 288, ty: 186, label: 'FINAL'  },
                    ].map((r, i) => (
                      <g key={i}>
                        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="#ECE7DC" />
                        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="url(#ug-hatch)" />
                        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="none" stroke="#bbb" strokeWidth="1" strokeDasharray="3 3" />
                        <g transform={`translate(${r.lx},${r.ly})`} fill="#1a1a1a" opacity="0.55">
                          <rect x="2" y="6" width="10" height="8" rx="1" />
                          <path d="M3 6 V4 a4 4 0 0 1 8 0 V6" stroke="#1a1a1a" strokeWidth="1.4" fill="none" />
                        </g>
                        <text x={r.tx} y={r.ty} textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fill="#888" letterSpacing="1">{r.label}</text>
                      </g>
                    ))}
                    {/* path */}
                    <path d="M 56 86 C 80 60, 100 60, 114 64" stroke="#3C3489" strokeWidth="1.5" fill="none" strokeDasharray="2 4" />
                  </svg>
                </div>

                <div>
                  <p>
                    The camera starts above the central plaza. <strong>Drag</strong>{' '}
                    to rotate; <strong>scroll</strong> to zoom. Buildings light
                    up when hovered; click an unlocked building to enter its
                    office.
                  </p>
                  <div className="map-legend">
                    <div className="legend-row">
                      <span className="swatch" style={{ background: 'var(--zone1-color)' }} />
                      <span><strong>Active department.</strong> The zone is playable. Click the building to enter.</span>
                      <span className="tag-mini">Playable</span>
                    </div>
                    <div className="legend-row">
                      <span className="swatch" style={{ background: 'var(--zone2-color)', opacity: 0.5 }} />
                      <span><strong>Next up.</strong> Highlighted in the sidebar as the recommended next zone.</span>
                      <span className="tag-mini">Next</span>
                    </div>
                    <div className="legend-row">
                      <span className="swatch locked" />
                      <span><strong>Locked.</strong> Becomes available once the previous zone is completed.</span>
                      <span className="tag-mini">Locked</span>
                    </div>
                  </div>
                  <p className="note" style={{ marginTop: 18 }}>
                    The sidebar shows your Progress (zones complete · 4), Total
                    Score (out of 1000), and a “Next up” card with an Enter
                    button. The game does not persist — refreshing the page
                    resets the campus.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 04 · OFFICE WALK-AROUND */}
          <section className="chapter" id="office">
            <div className="chapter-head">
              <div className="chapter-num">04</div>
              <h2>Inside each office</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">
                Clicking a building takes you <em>into</em> that department —
                a top-down 2D office where you walk around, meet the team,
                and finally launch the zone exercise from a workstation.
              </p>

              <div className="figure-pair">
                <figure className="screenshot">
                  <img
                    src="/screenshots/ofis1.png"
                    alt="Top-down 2D office with a character sprite, NPC coworkers, and a glowing desk terminal"
                    loading="lazy"
                  />
                  <figcaption>Office interior — walk with <kbd>W A S D</kbd>, press <kbd>E</kbd> to talk to NPCs or interact with the desk.</figcaption>
                </figure>
                <figure className="screenshot">
                  <img
                    src="/screenshots/vscode.png"
                    alt="Retro pixel-art desktop with zone launch icons shown after NPC quizzes are completed"
                    loading="lazy"
                  />
                  <figcaption>Retro desktop — opens when you interact with the office computer. Launch the zone exercise from here.</figcaption>
                </figure>
              </div>

              <div className="office-grid">
                <div className="office-stage">
                  <div className="row">
                    <span className="key">W A S D</span>
                    <span className="key-desc">Move your character around the office floor.</span>
                  </div>
                  <div className="row">
                    <span className="key">E</span>
                    <span className="key-desc">Talk to the highlighted NPC, or interact with the office computer when you stand next to it.</span>
                  </div>
                  <div className="row">
                    <span className="key">← Back to Map</span>
                    <span className="key-desc">Return to the Corporate Test Campus at any time from the office HUD.</span>
                  </div>
                </div>

                <div className="office-note">
                  <h5>What happens here</h5>
                  <p>
                    Each office has a small team of NPC coworkers. Some carry
                    short quizzes that prime you for the misconception this
                    zone targets. The HUD shows your quiz progress as{' '}
                    <code>Quizzes: N/N</code>.
                  </p>
                  <p>
                    Once you have spoken with the team, walk to the office
                    computer and press <strong>E</strong>. A retro desktop
                    opens — launch the zone exercise from there to begin
                    classifying, routing, selecting, or tagging.
                  </p>
                  <p>
                    The office is the bridge between the campus map and the
                    ISO exercise. You can leave at any time without losing
                    progress on completed quizzes.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 05 · ZONE-BY-ZONE */}
          <section className="chapter" id="zones">
            <div className="chapter-head">
              <div className="chapter-num">05</div>
              <h2>Zone-by-zone guide</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">
                Five zones, played in order. Each one is built around a small
                cluster of ISO concepts and a single interaction style — sort,
                route, select, tag, review.
              </p>

              <div className="zones">

                {/* Z1 */}
                <article className="zone-card z1">
                  <div className="dot" />
                  <div className="zone-inner">
                    <div className="zone-strip" />
                    <div className="zone-head">
                      <div>
                        <div className="zone-id">Zone 01 · Sort</div>
                        <h3>Error District</h3>
                      </div>
                      <div className="clause">§3.39 · §4.7</div>
                    </div>
                    <div className="zone-body">
                      <div className="zone-cell">
                        <span className="lbl">What you learn</span>
                        <p>
                          The causal chain <strong>Error</strong> (human action)
                          → <strong>Fault / Defect</strong> (code flaw)
                          → <strong>Failure</strong> (observable deviation).
                          They are not synonyms.
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">What you do</span>
                        <p>
                          Drag each of <strong>8 incident cards</strong> into
                          one of <strong>3 columns</strong>: ERROR, FAULT/DEFECT,
                          FAILURE. Tag chips (LOG / DEV / USER) are visual cues
                          about who reported the card, not the answer.
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">Watch out for</span>
                        <p>
                          A user-reported observation is a <em>failure</em>, not
                          the fault that caused it. The act of writing buggy
                          code is an <em>error</em>; the buggy code itself is
                          the fault. Read each card for the agent and the verb.
                        </p>
                      </div>
                      <div className="zone-cell zone-cell--screenshot">
                        <figure className="screenshot">
                          <img
                            src="/screenshots/zone1.png"
                            alt="Error District drag-and-drop interface with incident cards in three columns: Error, Fault/Defect, Failure"
                            loading="lazy"
                          />
                          <figcaption>Error District — drag the 8 incident cards into the correct column.</figcaption>
                        </figure>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Z2 */}
                <article className="zone-card z2">
                  <div className="dot" />
                  <div className="zone-inner">
                    <div className="zone-strip" />
                    <div className="zone-head">
                      <div>
                        <div className="zone-id">Zone 02 · Route</div>
                        <h3>V&amp;V Headquarters</h3>
                      </div>
                      <div className="clause">§4.1.3 · §3.115</div>
                    </div>
                    <div className="zone-body">
                      <div className="zone-cell">
                        <span className="lbl">What you learn</span>
                        <p>
                          <strong>Verification</strong> (“did we build it to the
                          spec?”) versus <strong>Validation</strong> (“did we
                          build the right thing?”) — distinguished by the
                          question being asked, not the role of the person
                          asking. Plus the <strong>Test Oracle</strong> (§3.115).
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">What you do</span>
                        <p>
                          Route <strong>11 missions</strong> under a{' '}
                          <strong>30-second timer</strong> each. Three buttons:
                          VERIFICATION · VALIDATION · BOTH. Picking “Both”
                          requires a written justification of at least three
                          words. Exactly one mission surfaces the Oracle prompt.
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">Watch out for</span>
                        <p>
                          “Both” is a real answer, not a cop-out — but only when
                          a mission genuinely contains two questions. Routing
                          purely by role (devs do V&amp;V, users do Validation)
                          is the misconception this zone exposes.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Z3 */}
                <article className="zone-card z3">
                  <div className="dot" />
                  <div className="zone-inner">
                    <div className="zone-strip" />
                    <div className="zone-head">
                      <div>
                        <div className="zone-id">Zone 03 · Select</div>
                        <h3>Test Matrix Tower</h3>
                      </div>
                      <div className="clause">§3.108 · §3.130</div>
                    </div>
                    <div className="zone-body">
                      <div className="zone-cell">
                        <span className="lbl">What you learn</span>
                        <p>
                          <strong>Test Level</strong> (Unit · Integration ·
                          System · Acceptance) and <strong>Test Type</strong>{' '}
                          (Functional · Security · Performance · Usability) are
                          <em> independent axes</em>. §3.130 Note 1: a type may
                          be performed at one level or across several.
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">What you do</span>
                        <p>
                          For each of <strong>4 scenarios</strong>, select one
                          or more cells in a <strong>4 × 4 matrix</strong>.
                          Multi-select is expected. Submitting a single cell
                          opens a challenge modal — confirm or add more cells.
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">Watch out for</span>
                        <p>
                          Don’t pin a type to one level. Performance testing can
                          live at Unit (one function) <em>and</em> System (full
                          deployment) for the same brief. Read the scenario for
                          words like “in isolation” or “end-to-end”.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Z4 */}
                <article className="zone-card z4">
                  <div className="dot" />
                  <div className="zone-inner">
                    <div className="zone-strip" />
                    <div className="zone-head">
                      <div>
                        <div className="zone-id">Zone 04 · Tag</div>
                        <h3>Artefact Archive</h3>
                      </div>
                      <div className="clause">§3.84 · §3.107 · §3.78 · §3.29</div>
                    </div>
                    <div className="zone-body">
                      <div className="zone-cell">
                        <span className="lbl">What you learn</span>
                        <p>
                          <strong>Test Basis</strong> (§3.84),{' '}
                          <strong>Test Item / Test Object</strong> (§3.107 — both
                          terms always shown), and the distinction between{' '}
                          <strong>Static</strong> (review) and{' '}
                          <strong>Dynamic</strong> (execution) testing.
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">What you do</span>
                        <p>
                          Inspect <strong>6 archived artefacts</strong> (specs,
                          source code, meeting minutes, diagrams, chat
                          fragments, logs). For each, click any combination of
                          four tag pills — or leave it untagged when no role
                          fits.
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">Watch out for</span>
                        <p>
                          The trap artefact <code>verbal_agreement.txt</code> is
                          test basis even with no written document. §3.84 Note
                          1: “the test basis may also be an undocumented
                          understanding of the required behaviour.”
                        </p>
                      </div>
                      <div className="zone-cell zone-cell--screenshot">
                        <figure className="screenshot">
                          <img
                            src="/screenshots/zone4.png"
                            alt="Artefact Archive file explorer with tag pills (Test Basis, Test Item/Test Object, Static, Dynamic) on the right panel"
                            loading="lazy"
                          />
                          <figcaption>Artefact Archive — select a file on the left, apply tag pills on the right. Multiple tags per artefact are expected.</figcaption>
                        </figure>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Z5 */}
                <article className="zone-card z5">
                  <div className="dot" />
                  <div className="zone-inner">
                    <div className="zone-strip" />
                    <div className="zone-head">
                      <div>
                        <div className="zone-id">Zone 05 · Review</div>
                        <h3>Final Inspection</h3>
                      </div>
                      <div className="clause">§3.115 · §4.1.10</div>
                    </div>
                    <div className="zone-body">
                      <div className="zone-cell">
                        <span className="lbl">What you learn</span>
                        <p>
                          How findings consolidate into an ISO-style{' '}
                          <strong>Incident Report</strong>, and how individual
                          mistakes from each concept area shape the final
                          reflection. Test Oracle (§3.115) is reinforced here.
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">What you do</span>
                        <p>
                          Work through <strong>5 integrated steps</strong> — one
                          per concept area (Error/Fault/Failure · V&amp;V ·
                          Levels × Types · Artefacts · Test Oracle) — on the
                          escalated Incident #048. Then read your generated
                          report.
                        </p>
                      </div>
                      <div className="zone-cell">
                        <span className="lbl">Watch out for</span>
                        <p>
                          Earlier mistakes resurface as a{' '}
                          <em>cascading note</em> in the final report (e.g.{' '}
                          “Your Zone 3 partial answer affected oracle confidence
                          in Final step 4”). The report is the playthrough’s
                          mirror — read it before declaring victory.
                        </p>
                      </div>
                    </div>
                  </div>
                </article>

              </div>
            </div>
          </section>

          {/* 06 · FEEDBACK */}
          <section className="chapter" id="feedback">
            <div className="chapter-head">
              <div className="chapter-num">06</div>
              <h2>Understanding feedback</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">
                Every wrong answer opens an <strong>ISO feedback modal</strong>.
                It is the most important teaching surface in the game — read
                it, don’t race past it.
              </p>

              <div className="feedback-demo">
                <div className="modal-mock" aria-hidden="true">
                  <div className="bar" />
                  <div className="body">
                    <div className="row1">
                      <span className="icon">!</span>
                      <span className="clause">ISO 29119-1 · §3.39</span>
                    </div>
                    <h4>That looks like a failure, not a fault.</h4>
                    <p>
                      A <strong>failure</strong> is what the user observed. The
                      underlying <strong>fault</strong> is the defect in code
                      or data that caused it. Re-read the card for the cause,
                      not the symptom.
                    </p>
                    <span className="btn">I understand →</span>
                  </div>
                </div>

                <div className="feedback-points">
                  <div className="point">
                    <div className="glyph">A</div>
                    <div>
                      <h5>Triggered on incorrect answers</h5>
                      <p>Every misclassification, mis-routing, mis-selection or mis-tag opens the modal. Correct answers proceed silently.</p>
                    </div>
                  </div>
                  <div className="point">
                    <div className="glyph">B</div>
                    <div>
                      <h5>Names the concept and the clause</h5>
                      <p>The modal cites the ISO concept involved and the verbatim definition from the standard (e.g. <code>§3.39</code>) so you can look it up later.</p>
                    </div>
                  </div>
                  <div className="point">
                    <div className="glyph">C</div>
                    <div>
                      <h5>Must be acknowledged</h5>
                      <p>Close only via <strong>I understand →</strong>. The Esc key, outside-click, and the × button are intentionally disabled — this is reading time, not penalty time.</p>
                    </div>
                  </div>
                  <div className="point">
                    <div className="glyph">D</div>
                    <div>
                      <h5>Recorded for the report</h5>
                      <p>The mistake is logged silently. It will reappear in your Final Inspection report with the clause, your wrong answer, and the correct one.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 07 · SCORING */}
          <section className="chapter" id="scoring">
            <div className="chapter-head">
              <div className="chapter-num">07</div>
              <h2>Scoring and progress</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">
                Scoring is cumulative, transparent, and tied to ISO clauses —
                not to speed or streaks. Every concept area is worth{' '}
                <strong>200 points</strong>; the whole game totals{' '}
                <strong>1000</strong>.
              </p>

              <div className="scoring">
                <div className="score-cell">
                  <div className="k">01 · Per zone</div>
                  <h5>200 points each</h5>
                  <p>
                    Each zone contributes up to 200 points. There is no time
                    bonus — only ISO accuracy.
                  </p>
                  <ul>
                    <li>Zone 1 — 8 items × 25</li>
                    <li>Zone 2 — 11 missions × ≈18.18 (+50 Oracle bonus)</li>
                    <li>Zone 3 — 4 scenarios × 50 (half-credit 25)</li>
                    <li>Zone 4 — 6 artefacts × ≈33.33</li>
                    <li>Final — 5 steps × 40</li>
                  </ul>
                </div>
                <div className="score-cell">
                  <div className="k">02 · Gating</div>
                  <h5>Unlock the next area</h5>
                  <p>
                    Completing the current zone unlocks the next. You do
                    <em> not</em> need a perfect score to progress — partial
                    credit is enough to move forward.
                  </p>
                </div>
                <div className="score-cell">
                  <div className="k">03 · Summary</div>
                  <h5>Final Inspection report</h5>
                  <p>
                    Five score rows (Error/Fault/Failure · V&amp;V · Levels ×
                    Types · Artefacts · Test Oracle), each with a status badge
                    — CORRECT / PARTIAL / REVIEW — and a clause link.
                  </p>
                </div>
                <div className="score-cell">
                  <div className="k">04 · Reflection</div>
                  <h5>Carry-over mistakes</h5>
                  <p>
                    Earlier mistakes shape the report’s cascading note even
                    after you’ve answered correctly. State does not persist —
                    refresh resets the campus by design.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 08 · CONTROLS */}
          <section className="chapter" id="controls">
            <div className="chapter-head">
              <div className="chapter-num">08</div>
              <h2>Controls &amp; interactions</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">
                The game uses a small set of gestures, split between the 3D map,
                the 2D offices, and the zone exercises.
              </p>

              <table className="controls">
                <thead>
                  <tr>
                    <th style={{ width: '38%' }}>Interaction</th>
                    <th style={{ width: '30%' }}>Where</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="kbd">Drag</span> · <span className="kbd">Scroll</span></td>
                    <td>World Map</td>
                    <td className="outcome">Rotate the campus and zoom in or out of the 3D scene.</td>
                  </tr>
                  <tr>
                    <td><span className="kbd">Click</span> Building</td>
                    <td>World Map</td>
                    <td className="outcome">Enter the selected department’s office.</td>
                  </tr>
                  <tr>
                    <td><span className="kbd">W A S D</span></td>
                    <td>Office floor</td>
                    <td className="outcome">Move your character around the 2D office tiles.</td>
                  </tr>
                  <tr>
                    <td><span className="kbd">E</span></td>
                    <td>Office floor</td>
                    <td className="outcome">Talk to the highlighted NPC, or interact with the office computer to launch the zone.</td>
                  </tr>
                  <tr>
                    <td><span className="kbd">Drag</span> Card</td>
                    <td>Error District</td>
                    <td className="outcome">Drop an incident card into ERROR, FAULT/DEFECT, or FAILURE.</td>
                  </tr>
                  <tr>
                    <td><span className="kbd">Click</span> Routing button</td>
                    <td>V&amp;V Headquarters</td>
                    <td className="outcome">Route the mission to Verification, Validation, or Both. Type a justification when prompted.</td>
                  </tr>
                  <tr>
                    <td><span className="kbd">Click</span> Matrix cell</td>
                    <td>Test Matrix Tower</td>
                    <td className="outcome">Select a Test Level × Test Type combination. Multi-select is supported.</td>
                  </tr>
                  <tr>
                    <td><span className="kbd">Click</span> Tag pill</td>
                    <td>Artefact Archive</td>
                    <td className="outcome">Toggle one of four ISO tags for the current artefact, or leave untagged.</td>
                  </tr>
                  <tr>
                    <td><span className="kbd">Click</span> Submit</td>
                    <td>All zones</td>
                    <td className="outcome">Lock in your answer and run the ISO check against the test oracle.</td>
                  </tr>
                  <tr>
                    <td><span className="kbd">Click</span> I understand →</td>
                    <td>Feedback modal</td>
                    <td className="outcome">Close the modal after reading. The game resumes from the same prompt.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 09 · TROUBLESHOOTING */}
          <section className="chapter" id="trouble">
            <div className="chapter-head">
              <div className="chapter-num">09</div>
              <h2>Troubleshooting</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">Common things to try before reporting an issue.</p>

              <div className="trouble">
                <div className="item">
                  <div className="glyph">!</div>
                  <div>
                    <h5>Page does not load</h5>
                    <p>Refresh the browser. If you are running the project locally, restart the dev server with <code>npm run dev</code> from the <code>frontend/</code> directory and reopen the URL.</p>
                  </div>
                </div>
                <div className="item">
                  <div className="glyph">!</div>
                  <div>
                    <h5>Progress disappears</h5>
                    <p>State is held in memory only and resets on refresh. Plan to finish a playthrough in one session — there is no save file by design.</p>
                  </div>
                </div>
                <div className="item">
                  <div className="glyph">!</div>
                  <div>
                    <h5>A zone is locked</h5>
                    <p>Zones unlock strictly in order: Error District → V&amp;V HQ → Matrix Tower → Artefact Archive → Final Inspection. Finish the previous zone and the unlock is automatic.</p>
                  </div>
                </div>
                <div className="item">
                  <div className="glyph">!</div>
                  <div>
                    <h5>Feedback modal will not close</h5>
                    <p>The modal closes <strong>only</strong> via the <strong>I understand →</strong> button. Esc, outside-click, and a × button are disabled by design.</p>
                  </div>
                </div>
                <div className="item">
                  <div className="glyph">!</div>
                  <div>
                    <h5>Office computer is unresponsive</h5>
                    <p>The computer activates after you have spoken with the office NPCs. Finish the office quizzes first, then walk back to the workstation and press <strong>E</strong>.</p>
                  </div>
                </div>
                <div className="item">
                  <div className="glyph">!</div>
                  <div>
                    <h5>3D scene is slow or blank</h5>
                    <p>The campus uses WebGL. Ensure hardware acceleration is enabled in your browser and that you are on a modern Chromium-, Firefox- or WebKit-based browser.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 10 · CHECKLIST */}
          <section className="chapter" id="checklist">
            <div className="chapter-head">
              <div className="chapter-num">10</div>
              <h2>Completion checklist</h2>
            </div>
            <div className="chapter-body">
              <p className="lede">
                Use this checklist during a live demo or evaluation to confirm
                a complete playthrough.
              </p>

              <div className="checklist">
                <div className="check"><span className="box" /><span className="label">Completed Error District</span><span className="ref">Zone 01 · §3.39</span></div>
                <div className="check"><span className="box" /><span className="label">Completed V&amp;V Headquarters</span><span className="ref">Zone 02 · §4.1.3</span></div>
                <div className="check"><span className="box" /><span className="label">Completed Test Matrix Tower</span><span className="ref">Zone 03 · §3.130</span></div>
                <div className="check"><span className="box" /><span className="label">Completed Artefact Archive</span><span className="ref">Zone 04 · §3.84</span></div>
                <div className="check"><span className="box" /><span className="label">Opened Final Inspection</span><span className="ref">Zone 05 · §3.115</span></div>
                <div className="check"><span className="box" /><span className="label">Reviewed the ISO Incident Report</span><span className="ref">Report · §4.1.10</span></div>
              </div>

              <div className="footer-note">
                <p>
                  This prototype focuses on ISO/IEC/IEEE 29119-1:2022 Part 1
                  general concepts and is designed for a 10–15 minute
                  educational playthrough. It is a teaching artefact — not a
                  conformance assessment of the standard.
                </p>
                <div className="stamp">
                  <div><strong>ISO Testing World</strong></div>
                  <div>Doc · ITW-UM-01 · r1</div>
                  <div>2026.05</div>
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export default UserGuide;
