import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { OFFICE_LAYOUTS, getPlayerStart } from '../data/office-layouts.js';
import { NPC_VARIANTS } from '../data/npc-variants.js';
import { usePlayerMovement } from '../hooks/usePlayerMovement.js';
import PixelCharacter from '../components/shared/PixelCharacter.jsx';
import NpcDialog from '../components/shared/NpcDialog.jsx';
import './OfficeInterior.css';

const TILE_PX = 48;

function random(col, row, seed) {
  return Math.sin(col * 12.9898 + row * 78.233 + seed) * 43758.5453 % 1;
}

/* ── Tile components ── */

function DeskTile({ col, row }) {
  const rnd = Math.abs(random(col, row, 1));
  const isCoffee = rnd > 0.8;
  const isPaper  = rnd > 0.5 && rnd <= 0.8;
  const isPlant  = rnd <= 0.5;
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="2" y="8" width="44" height="34" rx="4" fill="rgba(15,23,42,0.08)" />
        <rect x="2" y="4" width="44" height="32" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="14" y="24" width="20" height="6" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M 22 16 L 26 16 L 28 20 L 20 20 Z" fill="#94a3b8" />
        <rect x="8" y="6" width="32" height="10" rx="2" fill="#0f172a" />
        <rect x="10" y="7" width="28" height="8" rx="1" fill="#38bdf8" opacity="0.8" />
        {isCoffee && (
          <g transform="translate(36,22)">
            <circle cx="0" cy="0" r="4" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="0" cy="0" r="2.5" fill="#78350f" />
          </g>
        )}
        {isPaper && (
          <g transform="translate(6,22) rotate(-15)">
            <rect x="0" y="0" width="8" height="10" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="2" y1="3" x2="6" y2="3" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="2" y1="5" x2="6" y2="5" stroke="#94a3b8" strokeWidth="0.5" />
          </g>
        )}
        {isPlant && (
          <g transform="translate(36,12)">
            <circle cx="0" cy="0" r="4" fill="#f59e0b" />
            <path d="M 0 0 Q -4 -4 0 -8 Q 4 -4 0 0" fill="#10b981" />
          </g>
        )}
      </svg>
    </div>
  );
}

function ChairTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <circle cx="24" cy="28" r="12" fill="rgba(15,23,42,0.08)" />
        <path d="M 24 24 L 16 28 M 24 24 L 32 28 M 24 24 L 24 34 M 24 24 L 18 18 M 24 24 L 30 18"
              stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="28" r="2" fill="#334155" />
        <circle cx="32" cy="28" r="2" fill="#334155" />
        <circle cx="24" cy="34" r="2" fill="#334155" />
        <circle cx="18" cy="18" r="2" fill="#334155" />
        <circle cx="30" cy="18" r="2" fill="#334155" />
        <rect x="14" y="20" width="20" height="14" rx="4" fill="#334155" />
        <rect x="12" y="22" width="4" height="10" rx="2" fill="#1e293b" />
        <rect x="32" y="22" width="4" height="10" rx="2" fill="#1e293b" />
        <rect x="16" y="14" width="16" height="6" rx="3" fill="#1e293b" />
      </svg>
    </div>
  );
}

function PlantTile({ col, row }) {
  const rot = (Math.abs(random(col, row, 2)) * 360).toFixed(1);
  return (
    <div className="svg-tile plant-sway">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <circle cx="24" cy="28" r="12" fill="rgba(15,23,42,0.08)" />
        <circle cx="24" cy="24" r="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="24" cy="24" r="7" fill="#334155" />
        <g transform={`rotate(${rot} 24 24)`}>
          <path d="M 24 24 C 10 10, 10 20, 24 24" fill="#10b981" />
          <path d="M 24 24 C 38 10, 38 20, 24 24" fill="#059669" />
          <path d="M 24 24 C 10 38, 20 38, 24 24" fill="#34d399" />
          <path d="M 24 24 C 38 38, 20 38, 24 24" fill="#10b981" />
          <path d="M 24 24 C 24 8, 14 14, 24 24" fill="#34d399" />
        </g>
      </svg>
    </div>
  );
}

function ShelfTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="4" y="4" width="40" height="40" rx="2" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <line x1="4" y1="24" x2="44" y2="24" stroke="#cbd5e1" strokeWidth="2" />
        <rect x="8"  y="10" width="4"  height="14" fill="#ef4444" />
        <rect x="13" y="12" width="4"  height="12" fill="#3b82f6" />
        <rect x="18" y="8"  width="5"  height="16" fill="#10b981" />
        <rect x="25" y="10" width="3"  height="14" fill="#f59e0b" />
        <rect x="30" y="10" width="4"  height="14" fill="#8b5cf6" />
        <rect x="8"  y="30" width="5"  height="14" fill="#8b5cf6" />
        <rect x="14" y="28" width="4"  height="16" fill="#f59e0b" />
        <rect x="19" y="32" width="6"  height="12" fill="#ef4444" />
        <rect x="27" y="28" width="4"  height="16" fill="#3b82f6" />
        <rect x="33" y="30" width="4"  height="14" fill="#10b981" />
      </svg>
    </div>
  );
}

function WallTile({ isOuter }) {
  return <div className={isOuter ? 'wall-tile wall-tile--outer' : 'wall-tile wall-tile--inner'} />;
}

function DoorTile() {
  return (
    <div className="svg-tile door-tile-wrap">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="4" y="0" width="40" height="12" fill="#cbd5e1" />
        <rect x="14" y="0" width="20" height="12" fill="#f1f5f9" />
        <rect x="22" y="4" width="8" height="4" rx="2" fill="#94a3b8" />
        <text x="24" y="28" fontSize="10" fontWeight="bold" fill="#ef4444" textAnchor="middle" fontFamily="sans-serif">EXIT</text>
      </svg>
    </div>
  );
}

function FloorTile({ isCarpet, accentColor }) {
  if (isCarpet) {
    return <div className="floor-tile floor-tile--carpet" style={{ '--rug-color': accentColor }} />;
  }
  return <div className="floor-tile" />;
}

/* ── NEW tile components ── */

function SofaTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="2" y="10" width="44" height="28" rx="8" fill="rgba(15,23,42,0.07)" />
        <rect x="2" y="8"  width="44" height="26" rx="8" fill="#475569" />
        <rect x="4" y="10" width="18" height="20" rx="6" fill="#64748b" />
        <rect x="26" y="10" width="18" height="20" rx="6" fill="#64748b" />
        <rect x="2"  y="8"  width="6"  height="22" rx="4" fill="#334155" />
        <rect x="40" y="8"  width="6"  height="22" rx="4" fill="#334155" />
        <rect x="4" y="28" width="40" height="5" rx="3" fill="#334155" />
      </svg>
    </div>
  );
}

function MeetingTableTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <ellipse cx="24" cy="28" rx="20" ry="8" fill="rgba(15,23,42,0.1)" />
        <circle cx="24" cy="24" r="18" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
        <circle cx="24" cy="24" r="12" fill="#f1f5f9" />
        <circle cx="24" cy="24" r="4"  fill="#94a3b8" />
        <line x1="24" y1="12" x2="24" y2="20" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="24" y1="28" x2="24" y2="36" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="12" y1="24" x2="20" y2="24" stroke="#cbd5e1" strokeWidth="1" />
        <line x1="28" y1="24" x2="36" y2="24" stroke="#cbd5e1" strokeWidth="1" />
      </svg>
    </div>
  );
}

function MonitorWallTile({ col }) {
  const hue = (col * 47) % 360;
  const lineColor = hue > 180 ? '#10b981' : '#f59e0b';
  return (
    <div className="svg-tile monitor-wall-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="0" y="0" width="48" height="48" fill="#0f172a" />
        <rect x="2" y="2" width="44" height="44" fill="#1e293b" />
        {/* screen glow */}
        <rect x="3" y="3" width="42" height="42" fill="#0f172a" opacity="0.6" />
        {/* graph lines */}
        <polyline
          points={`3,${30 + (col % 3) * 4} 10,${20 + (col % 5) * 3} 18,${28 - (col % 4) * 2} 26,${15 + (col % 3) * 5} 34,${22 + (col % 2) * 6} 44,${18 + (col % 4) * 3}`}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          opacity="0.9"
        />
        {/* status dot */}
        <circle cx="6" cy="6" r="2.5" fill={col % 3 === 0 ? '#ef4444' : '#22c55e'} />
        {/* text lines */}
        <rect x="10" y="4"  width="16" height="2" rx="1" fill="#334155" />
        <rect x="10" y="8"  width="10" height="2" rx="1" fill="#1e3a5f" />
        <rect x="3"  y="38" width="20" height="2" rx="1" fill="#1e3a5f" />
        <rect x="26" y="38" width="10" height="2" rx="1" fill={lineColor} opacity="0.7" />
      </svg>
    </div>
  );
}

function FilingCabinetTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="4"  y="2"  width="40" height="44" rx="3" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="4"  y="2"  width="40" height="13" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="4"  y="17" width="40" height="13" rx="0" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="4"  y="32" width="40" height="14" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
        {/* drawer handles */}
        <rect x="18" y="7"  width="12" height="3" rx="1.5" fill="#94a3b8" />
        <rect x="18" y="22" width="12" height="3" rx="1.5" fill="#94a3b8" />
        <rect x="18" y="37" width="12" height="3" rx="1.5" fill="#94a3b8" />
        {/* label slots */}
        <rect x="8"  y="4"  width="8"  height="4" rx="1" fill="#e2e8f0" />
        <rect x="8"  y="19" width="8"  height="4" rx="1" fill="#e2e8f0" />
        <rect x="8"  y="34" width="8"  height="4" rx="1" fill="#e2e8f0" />
      </svg>
    </div>
  );
}

function CoffeeStationTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="4"  y="30" width="40" height="16" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* machine body */}
        <rect x="8"  y="12" width="20" height="20" rx="3" fill="#334155" />
        <rect x="10" y="14" width="16" height="10" rx="2" fill="#1e293b" />
        {/* display */}
        <rect x="11" y="15" width="14" height="7"  rx="1" fill="#0f172a" />
        <rect x="12" y="16" width="8"  height="2"  rx="0.5" fill="#38bdf8" opacity="0.8" />
        {/* buttons */}
        <circle cx="13" cy="26" r="2" fill="#22c55e" />
        <circle cx="19" cy="26" r="2" fill="#f59e0b" />
        <circle cx="25" cy="26" r="2" fill="#ef4444" />
        {/* spout */}
        <rect x="16" y="30" width="4" height="4" rx="1" fill="#475569" />
        {/* mug */}
        <rect x="32" y="22" width="10" height="12" rx="2" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M 42 25 Q 46 25 46 28 Q 46 31 42 31" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="33" y="23" width="8"  height="6"  rx="1" fill="#78350f" opacity="0.7" />
        {/* steam */}
        <path d="M 35 20 Q 34 17 35 14" fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.6" />
        <path d="M 39 20 Q 38 16 39 13" fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
}

function LampTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <ellipse cx="24" cy="44" rx="8" ry="3" fill="rgba(15,23,42,0.12)" />
        {/* base */}
        <rect x="20" y="40" width="8" height="4" rx="2" fill="#475569" />
        {/* pole */}
        <rect x="23" y="16" width="2" height="26" fill="#64748b" />
        {/* shade */}
        <path d="M 14 16 L 18 6 L 30 6 L 34 16 Z" fill="#fbbf24" opacity="0.9" />
        <path d="M 14 16 L 34 16" stroke="#f59e0b" strokeWidth="1.5" />
        {/* glow */}
        <ellipse cx="24" cy="18" rx="10" ry="4" fill="#fef3c7" opacity="0.5" />
      </svg>
    </div>
  );
}

function RugTile({ accentColor }) {
  return <div className="floor-tile floor-tile--rug" style={{ '--rug-color': accentColor }} />;
}

/* ── Tile router ── */
function isCarpetTile(col, row, carpetZones) {
  return (carpetZones || []).some(z => col >= z.c0 && col <= z.c1 && row >= z.r0 && row <= z.r1);
}

function renderTile(tile, col, row, accentColor) {
  if (tile === '#') return <WallTile isOuter />;
  if (tile === 'W') return <WallTile isOuter={false} />;
  if (tile === 'D') return <DeskTile col={col} row={row} />;
  if (tile === 'C') return <ChairTile />;
  if (tile === 'P') return <PlantTile col={col} row={row} />;
  if (tile === 'B') return <ShelfTile />;
  if (tile === 'X') return <DoorTile />;
  if (tile === 'S') return <SofaTile />;
  if (tile === 'T') return <MeetingTableTile />;
  if (tile === 'M') return <MonitorWallTile col={col} />;
  if (tile === 'F') return <FilingCabinetTile />;
  if (tile === 'K') return <CoffeeStationTile />;
  if (tile === 'L') return <LampTile />;
  if (tile === 'R') return <RugTile accentColor={accentColor} />;
  return <FloorTile isCarpet={false} />;
}

/* ── Main component ── */
export default function OfficeInterior() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const layout = OFFICE_LAYOUTS[zoneId];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeNpcId, setActiveNpcId] = useState(null);
  const [completedQuests, setCompletedQuests] = useState(() => new Set());

  const viewportRef = useRef(null);

  if (!layout) return <Navigate to="/" replace />;

  const rows = layout.map.length;
  const cols = layout.map[0].length;
  const mapW = cols * TILE_PX;
  const mapH = rows * TILE_PX;

  const initialPos = getPlayerStart(layout.map);

  const { playerCol, playerRow, playerFacing, nearMainNpc, nearMainNpcId, isMoving } =
    usePlayerMovement({
      map: layout.map,
      npcs: layout.npcs,
      isDialogOpen: dialogOpen,
      onExitDoor: () => navigate('/'),
      onInteract: (npcId) => { setActiveNpcId(npcId); setDialogOpen(true); },
      initialPos,
    });

  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const vp = viewportRef.current;
      if (!vp) return;
      const scaleX = vp.clientWidth / mapW;
      const scaleY = vp.clientHeight / mapH;
      setScale(Math.max(scaleX, scaleY));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [mapW, mapH]);

  useEffect(() => {
    let raf;
    const updateScroll = () => {
      const vp = viewportRef.current;
      if (!vp) return;
      const px = (playerCol * TILE_PX + TILE_PX / 2) * scale;
      const py = (playerRow * TILE_PX + TILE_PX / 2) * scale;
      vp.scrollLeft += (px - vp.clientWidth / 2 - vp.scrollLeft) * 0.15;
      vp.scrollTop  += (py - vp.clientHeight / 2 - vp.scrollTop) * 0.15;
      raf = requestAnimationFrame(updateScroll);
    };
    updateScroll();
    return () => cancelAnimationFrame(raf);
  }, [playerCol, playerRow, scale]);

  const activeNpc = dialogOpen && activeNpcId
    ? layout.npcs.find(n => n.id === activeNpcId)
    : null;

  const activeVariant = activeNpc ? NPC_VARIANTS[activeNpc.variantId] : null;

  const quizWorkers = layout.npcs.filter(n => !!n.quiz);
  const completedCount = quizWorkers.filter(n => completedQuests.has(n.id)).length;

  // resolve CSS var color for rug tiles
  const accentColor = layout.color;

  return (
    <div className="office" style={{ '--office-accent': layout.color }}>

      <div className="office__hud">
        <button className="office__back" onClick={() => navigate('/')}>← Back to Map</button>
        <span className="office__hud-title">{layout.label}</span>
        {quizWorkers.length > 0 && (
          <span className="office__hud-quizzes">
            <span className="office__hud-quiz-icon">📋</span>
            Quizzes: {completedCount}/{quizWorkers.length}
          </span>
        )}
        <span className="office__hud-hint">WASD / Arrow keys · E to talk</span>
      </div>

      <div className="office__viewport" ref={viewportRef}>
        <div className="office__lighting-overlay" />

        <div style={{ width: mapW * scale, height: mapH * scale, position: 'relative' }}>
          <div
            className="office__map"
            style={{ width: mapW, height: mapH, transform: `scale(${scale})`, transformOrigin: '0 0' }}
          >
            {/* Tile layer */}
            {layout.map.flatMap((row, rIdx) =>
              [...row].map((tile, cIdx) => {
                const isCarpet = isCarpetTile(cIdx, rIdx, layout.carpetZones);
                const renderedTile = tile === '.'
                  ? <FloorTile isCarpet={isCarpet} accentColor={accentColor} />
                  : renderTile(tile, cIdx, rIdx, accentColor);
                return (
                  <div
                    key={`t-${rIdx}-${cIdx}`}
                    className="office__tile"
                    style={{ left: cIdx * TILE_PX, top: rIdx * TILE_PX, width: TILE_PX, height: TILE_PX, zIndex: rIdx * 10 }}
                  >
                    {renderedTile}
                  </div>
                );
              })
            )}

            {/* Player */}
            <div
              className="office__entity"
              style={{ left: playerCol * TILE_PX + TILE_PX / 2, top: playerRow * TILE_PX + TILE_PX, zIndex: playerRow * 10 + 5 }}
            >
              <PixelCharacter
                type="player"
                facing={playerFacing}
                label="You"
                color={layout.color}
                isMoving={isMoving}
              />
            </div>

            {/* NPCs */}
            {layout.npcs.map(npc => {
              const variant = NPC_VARIANTS[npc.variantId] || {};
              const isSitting = layout.map[npc.row]?.[npc.col] === 'C';
              const isDone = completedQuests.has(npc.id);
              const hasActiveQuest = !isDone && (npc.type === 'main' || !!npc.quiz);
              const isNearThis = nearMainNpcId === npc.id && nearMainNpc;

              return (
                <div
                  key={npc.id}
                  className="office__entity"
                  style={{ left: npc.col * TILE_PX + TILE_PX / 2, top: npc.row * TILE_PX + TILE_PX, zIndex: npc.row * 10 + 5 }}
                >
                  <PixelCharacter
                    type={npc.type === 'main' ? 'npc-main' : 'npc-worker'}
                    facing={npc.facing}
                    label={npc.name}
                    color={layout.color}
                    isNear={isNearThis}
                    bubble={npc.bubble}
                    sitting={isSitting}
                    hasQuest={hasActiveQuest}
                    questDone={isDone}
                    outfit={variant.outfit}
                    gender={variant.gender}
                    hair={variant.hair}
                    skin={variant.skin}
                    accessory={npc.accessory}
                  />
                </div>
              );
            })}

          </div>
        </div>
      </div>

      {activeNpc && (
        <NpcDialog
          npc={activeNpc}
          zoneColor={layout.color}
          npcVariant={activeVariant}
          onClose={() => { setDialogOpen(false); setActiveNpcId(null); }}
          onEnterZone={() => navigate(layout.zoneRoute)}
          onQuestComplete={(npcId) => {
            setCompletedQuests(prev => new Set([...prev, npcId]));
            setDialogOpen(false);
            setActiveNpcId(null);
          }}
        />
      )}

    </div>
  );
}
