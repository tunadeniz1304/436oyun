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

function DeskTile({ col, row }) {
  const rnd = Math.abs(random(col, row, 1));
  const isCoffee = rnd > 0.8;
  const isPaper = rnd > 0.5 && rnd <= 0.8;

  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="2" y="8" width="44" height="34" rx="4" fill="rgba(15, 23, 42, 0.08)" />
        <rect x="2" y="4" width="44" height="32" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="14" y="24" width="20" height="6" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M 22 16 L 26 16 L 28 20 L 20 20 Z" fill="#94a3b8" />
        <rect x="8" y="6" width="32" height="10" rx="2" fill="#0f172a" />
        <rect x="10" y="7" width="28" height="8" rx="1" fill="#38bdf8" opacity="0.8" />
        {isCoffee && (
          <g transform="translate(36, 22)">
            <circle cx="0" cy="0" r="4" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="0" cy="0" r="2.5" fill="#78350f" />
          </g>
        )}
        {isPaper && (
          <g transform="translate(6, 22) rotate(-15)">
            <rect x="0" y="0" width="8" height="10" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="2" y1="3" x2="6" y2="3" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="2" y1="5" x2="6" y2="5" stroke="#94a3b8" strokeWidth="0.5" />
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
        <circle cx="24" cy="28" r="12" fill="rgba(15, 23, 42, 0.08)" />
        <path d="M 24 24 L 16 28 M 24 24 L 32 28 M 24 24 L 24 34 M 24 24 L 18 18 M 24 24 L 30 18" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
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
  const rnd = Math.abs(random(col, row, 2));
  const rot = (rnd * 360).toFixed(1);
  return (
    <div className="svg-tile plant-sway">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <circle cx="24" cy="28" r="12" fill="rgba(15, 23, 42, 0.08)" />
        <circle cx="24" cy="24" r="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="24" cy="24" r="7" fill="#334155" />
        <g transform={`rotate(${rot} 24 24)`}>
          <path d="M 24 24 C 10 10, 10 20, 24 24" fill="#10b981" />
          <path d="M 24 24 C 38 10, 38 20, 24 24" fill="#059669" />
          <path d="M 24 24 C 10 38, 20 38, 24 24" fill="#34d399" />
          <path d="M 24 24 C 38 38, 20 38, 24 24" fill="#10b981" />
          <path d="M 24 24 C 24 8, 14 14, 24 24" fill="#34d399" />
          <path d="M 24 24 C 24 40, 34 34, 24 24" fill="#059669" />
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
        <rect x="8" y="10" width="4" height="14" fill="#ef4444" />
        <rect x="13" y="12" width="4" height="12" fill="#3b82f6" />
        <rect x="18" y="8" width="5" height="16" fill="#10b981" />
        <rect x="25" y="10" width="3" height="14" fill="#f59e0b" />
        <rect x="8" y="30" width="5" height="14" fill="#8b5cf6" />
        <rect x="14" y="28" width="4" height="16" fill="#f59e0b" />
        <rect x="19" y="32" width="6" height="12" fill="#ef4444" />
        <rect x="27" y="28" width="4" height="16" fill="#3b82f6" />
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

function FloorTile({ variant }) {
  if (variant === 'rug') return <div className="floor-tile floor-tile--rug" />;
  if (variant === 'carpet') return <div className="floor-tile floor-tile--carpet" />;
  return <div className="floor-tile" />;
}

/* ── New tile types ── */

function MonitorWallTile() {
  return (
    <div className="svg-tile monitor-wall-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="0" y="0" width="48" height="48" fill="#0f172a" />
        <rect x="2" y="2" width="44" height="44" rx="2" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
        {/* Screen panels */}
        <rect x="4" y="4" width="18" height="18" rx="1" fill="#0c1a2e" stroke="#1e4080" strokeWidth="0.5" />
        <rect x="26" y="4" width="18" height="18" rx="1" fill="#0c1a2e" stroke="#1e4080" strokeWidth="0.5" />
        <rect x="4" y="26" width="18" height="18" rx="1" fill="#0c1a2e" stroke="#1e4080" strokeWidth="0.5" />
        <rect x="26" y="26" width="18" height="18" rx="1" fill="#0c1a2e" stroke="#1e4080" strokeWidth="0.5" />
        {/* Graph traces */}
        <polyline points="5,18 8,14 11,16 14,10 17,13 20,8" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.9" />
        <polyline points="27,18 30,12 33,15 36,9 39,13 42,7" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.9" />
        <polyline points="5,40 8,36 11,38 14,32 17,35 20,30" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.9" />
        <polyline points="27,40 30,35 33,37 36,31 39,34 42,29" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.9" />
        {/* Status dots */}
        <circle cx="19" cy="9" r="1.5" fill="#ef4444" />
        <circle cx="41" cy="8" r="1.5" fill="#f59e0b" />
      </svg>
    </div>
  );
}

function MeetingTableTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <circle cx="24" cy="24" r="16" fill="rgba(15,23,42,0.1)" />
        <circle cx="24" cy="24" r="14" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
        <circle cx="24" cy="24" r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
        <circle cx="24" cy="24" r="3" fill="#94a3b8" />
        <line x1="24" y1="16" x2="24" y2="10" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="24" y1="32" x2="24" y2="38" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="16" y1="24" x2="10" y2="24" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
        <line x1="32" y1="24" x2="38" y2="24" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}

function SofaTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="4" y="28" width="40" height="6" rx="3" fill="rgba(15,23,42,0.1)" />
        <rect x="4" y="22" width="40" height="16" rx="4" fill="#64748b" />
        <rect x="4" y="22" width="40" height="8" rx="3" fill="#94a3b8" />
        <rect x="4" y="22" width="18" height="16" rx="3" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
        <rect x="26" y="22" width="18" height="16" rx="3" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
        <rect x="4" y="22" width="6" height="20" rx="3" fill="#64748b" />
        <rect x="38" y="22" width="6" height="20" rx="3" fill="#64748b" />
      </svg>
    </div>
  );
}

function FilingCabinetTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="8" y="4" width="32" height="42" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="10" y="8" width="28" height="10" rx="1" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="10" y="21" width="28" height="10" rx="1" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="10" y="34" width="28" height="10" rx="1" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <rect x="21" y="12" width="6" height="2" rx="1" fill="#94a3b8" />
        <rect x="21" y="25" width="6" height="2" rx="1" fill="#94a3b8" />
        <rect x="21" y="38" width="6" height="2" rx="1" fill="#94a3b8" />
      </svg>
    </div>
  );
}

function CoffeeStationTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <rect x="6" y="28" width="36" height="14" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="10" y="14" width="20" height="16" rx="3" fill="#334155" />
        <rect x="12" y="16" width="16" height="10" rx="2" fill="#1e293b" />
        <circle cx="20" cy="21" r="4" fill="#78350f" />
        <circle cx="20" cy="21" r="2" fill="#92400e" />
        <rect x="32" y="20" width="8" height="10" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <ellipse cx="36" cy="30" rx="6" ry="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
        <path d="M 34 17 Q 36 14 38 17" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" />
        <path d="M 36 15 Q 38 12 40 15" fill="none" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </svg>
    </div>
  );
}

function LampTile() {
  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        <circle cx="24" cy="44" r="6" fill="rgba(15,23,42,0.12)" />
        <rect x="22" y="18" width="4" height="26" rx="2" fill="#94a3b8" />
        <ellipse cx="24" cy="44" rx="5" ry="3" fill="#cbd5e1" />
        <path d="M 12 18 Q 24 8 36 18 Z" fill="#fef3c7" stroke="#fde68a" strokeWidth="1" />
        <circle cx="24" cy="18" r="3" fill="#fbbf24" opacity="0.8" />
        <ellipse cx="24" cy="19" rx="10" ry="4" fill="#fef9c3" opacity="0.3" />
      </svg>
    </div>
  );
}

function RugTile() {
  return <div className="floor-tile floor-tile--rug" />;
}

function renderTile(tile, col, row) {
  if (tile === '#') return <WallTile isOuter />;
  if (tile === 'W') return <WallTile isOuter={false} />;
  if (tile === 'D') return <DeskTile col={col} row={row} />;
  if (tile === 'C') return <ChairTile />;
  if (tile === 'P') return <PlantTile col={col} row={row} />;
  if (tile === 'B') return <ShelfTile />;
  if (tile === 'X') return <DoorTile />;
  if (tile === 'M') return <MonitorWallTile />;
  if (tile === 'T') return <MeetingTableTile />;
  if (tile === 'S') return <SofaTile />;
  if (tile === 'F') return <FilingCabinetTile />;
  if (tile === 'K') return <CoffeeStationTile />;
  if (tile === 'L') return <LampTile />;
  if (tile === 'R') return <RugTile />;
  return <FloorTile variant="plain" />;
}

export default function OfficeInterior() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const layout = OFFICE_LAYOUTS[zoneId];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeNpcId, setActiveNpcId] = useState(null);
  const [completedQuests, setCompletedQuests] = useState(new Set());

  const viewportRef = useRef(null);

  if (!layout) return <Navigate to="/" replace />;

  const rows = layout.map.length;
  const cols = layout.map[0].length;
  const mapW = cols * TILE_PX;
  const mapH = rows * TILE_PX;

  const initialPos = getPlayerStart(layout.map);

  const { playerCol, playerRow, playerFacing, nearMainNpcId, nearMainNpc, isMoving } =
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
    let animationFrameId;
    const updateScroll = () => {
      const vp = viewportRef.current;
      if (!vp) return;
      const px = (playerCol * TILE_PX + TILE_PX / 2) * scale;
      const py = (playerRow * TILE_PX + TILE_PX / 2) * scale;
      vp.scrollLeft += (px - vp.clientWidth / 2 - vp.scrollLeft) * 0.15;
      vp.scrollTop  += (py - vp.clientHeight / 2 - vp.scrollTop) * 0.15;
      animationFrameId = requestAnimationFrame(updateScroll);
    };
    updateScroll();
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerCol, playerRow, scale]);

  const activeNpc = dialogOpen && activeNpcId
    ? layout.npcs.find(n => n.id === activeNpcId)
    : null;

  // Count available quizzes for HUD chip
  const quizNpcs = layout.npcs.filter(n => n.quiz);
  const doneCount = quizNpcs.filter(n => completedQuests.has(n.id)).length;

  const handleQuestComplete = (npcId) => {
    setCompletedQuests(prev => new Set([...prev, npcId]));
  };

  return (
    <div className="office" style={{ '--office-accent': layout.color, '--rug-color': layout.color }}>

      <div className="office__hud">
        <button className="office__back" onClick={() => navigate('/')}>← Back to Map</button>
        <span className="office__hud-title">{layout.label}</span>
        {quizNpcs.length > 0 && (
          <div className="office__hud-quizzes">
            <span className="office__hud-quiz-icon">📋</span>
            Quizzes: {doneCount}/{quizNpcs.length}
          </div>
        )}
        <span className="office__hud-hint">WASD / Arrow keys · E to talk</span>
      </div>

      <div className="office__viewport" ref={viewportRef}>
        <div className="office__lighting-overlay" />

        <div style={{ width: mapW * scale, height: mapH * scale, position: 'relative' }}>
          <div className="office__map" style={{
            width: mapW, height: mapH,
            transform: `scale(${scale})`,
            transformOrigin: '0 0',
          }}>

            {/* Tile layer */}
            {layout.map.flatMap((row, rIdx) =>
              [...row].map((tile, cIdx) => (
                <div
                  key={`t-${rIdx}-${cIdx}`}
                  className="office__tile"
                  style={{
                    left: cIdx * TILE_PX,
                    top: rIdx * TILE_PX,
                    width: TILE_PX,
                    height: TILE_PX,
                    zIndex: rIdx * 10 + (['#','W','B','M','F'].includes(tile) ? 8 : 0),
                  }}
                >
                  {renderTile(tile, cIdx, rIdx)}
                </div>
              ))
            )}

            {/* Player */}
            <div
              className="office__entity"
              style={{
                left: playerCol * TILE_PX + TILE_PX / 2,
                top: playerRow * TILE_PX + TILE_PX,
                zIndex: playerRow * 10 + 5,
              }}
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
              const isSitting = layout.map[npc.row]?.[npc.col] === 'C';
              const variant = npc.variantId ? NPC_VARIANTS[npc.variantId] : null;
              const isNear = nearMainNpcId === npc.id && nearMainNpc;
              const hasQuest = npc.type === 'main' || !!npc.quiz;
              const questDone = completedQuests.has(npc.id);

              return (
                <div
                  key={npc.id}
                  className="office__entity"
                  style={{
                    left: npc.col * TILE_PX + TILE_PX / 2,
                    top: npc.row * TILE_PX + TILE_PX,
                    zIndex: npc.row * 10 + 5,
                  }}
                >
                  <PixelCharacter
                    type={npc.type === 'main' ? 'npc-main' : 'npc-worker'}
                    facing={npc.facing}
                    label={npc.name}
                    color={layout.color}
                    isNear={isNear}
                    bubble={npc.bubble}
                    sitting={isSitting}
                    hair={variant?.hair}
                    skin={variant?.skin}
                    outfit={variant?.outfit || 'default'}
                    gender={variant?.gender || 'm'}
                    accessory={npc.accessory}
                    hasQuest={hasQuest && !questDone}
                    questDone={questDone}
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
          onClose={() => { setDialogOpen(false); setActiveNpcId(null); }}
          onEnterZone={() => navigate(layout.zoneRoute)}
          onQuestComplete={handleQuestComplete}
        />
      )}

    </div>
  );
}
