import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { OFFICE_LAYOUTS, getPlayerStart } from '../data/office-layouts.js';
import { usePlayerMovement } from '../hooks/usePlayerMovement.js';
import PixelCharacter from '../components/shared/PixelCharacter.jsx';
import NpcDialog from '../components/shared/NpcDialog.jsx';
import './OfficeInterior.css';

const TILE_PX = 48;

const BOOK_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#e67e22'];

// Simple deterministic random
function random(col, row, seed) {
  return Math.sin(col * 12.9898 + row * 78.233 + seed) * 43758.5453 % 1;
}

function DeskTile({ col, row }) {
  const rnd = Math.abs(random(col, row, 1));
  const hasItem = rnd > 0.3;
  const isCoffee = rnd > 0.8;
  const isPaper = rnd > 0.5 && rnd <= 0.8;
  const isPlant = rnd <= 0.5;

  return (
    <div className="svg-tile">
      <svg viewBox="0 0 48 48" width="100%" height="100%">
        {/* Desk Shadow */}
        <rect x="2" y="8" width="44" height="34" rx="4" fill="rgba(15, 23, 42, 0.08)" />
        {/* Desk Surface */}
        <rect x="2" y="4" width="44" height="32" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        
        {/* Keyboard */}
        <rect x="14" y="24" width="20" height="6" rx="1.5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
        
        {/* Monitor Stand */}
        <path d="M 22 16 L 26 16 L 28 20 L 20 20 Z" fill="#94a3b8" />
        {/* Monitor Screen */}
        <rect x="8" y="6" width="32" height="10" rx="2" fill="#0f172a" />
        <rect x="10" y="7" width="28" height="8" rx="1" fill="#38bdf8" opacity="0.8" />
        
        {/* Items */}
        {hasItem && isCoffee && (
          <g transform="translate(36, 22)">
            <circle cx="0" cy="0" r="4" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="0" cy="0" r="2.5" fill="#78350f" />
          </g>
        )}
        {hasItem && isPaper && (
          <g transform="translate(6, 22) rotate(-15)">
            <rect x="0" y="0" width="8" height="10" fill="#fff" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="2" y1="3" x2="6" y2="3" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="2" y1="5" x2="6" y2="5" stroke="#94a3b8" strokeWidth="0.5" />
            <line x1="2" y1="7" x2="4" y2="7" stroke="#94a3b8" strokeWidth="0.5" />
          </g>
        )}
        {hasItem && isPlant && (
          <g transform="translate(36, 12)">
            <circle cx="0" cy="0" r="4" fill="#f59e0b" />
            <path d="M 0 0 Q -4 -4 0 -8 Q 4 -4 0 0" fill="#10b981" />
            <path d="M 0 0 Q -6 -2 -4 -6 Q -1 -3 0 0" fill="#34d399" />
            <path d="M 0 0 Q 6 -2 4 -6 Q 1 -3 0 0" fill="#059669" />
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
        {/* Shadow */}
        <circle cx="24" cy="28" r="12" fill="rgba(15, 23, 42, 0.08)" />
        {/* Base / Wheels */}
        <path d="M 24 24 L 16 28 M 24 24 L 32 28 M 24 24 L 24 34 M 24 24 L 18 18 M 24 24 L 30 18" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="28" r="2" fill="#334155" />
        <circle cx="32" cy="28" r="2" fill="#334155" />
        <circle cx="24" cy="34" r="2" fill="#334155" />
        <circle cx="18" cy="18" r="2" fill="#334155" />
        <circle cx="30" cy="18" r="2" fill="#334155" />
        
        {/* Seat */}
        <rect x="14" y="20" width="20" height="14" rx="4" fill="#334155" />
        {/* Arm rests */}
        <rect x="12" y="22" width="4" height="10" rx="2" fill="#1e293b" />
        <rect x="32" y="22" width="4" height="10" rx="2" fill="#1e293b" />
        {/* Back */}
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
        
        {/* Books Top Row */}
        <rect x="8" y="10" width="4" height="14" fill="#ef4444" />
        <rect x="13" y="12" width="4" height="12" fill="#3b82f6" />
        <rect x="18" y="8" width="5" height="16" fill="#10b981" />
        <rect x="25" y="10" width="3" height="14" fill="#f59e0b" />
        <g transform="translate(30, 24) rotate(-20) translate(-30, -24)">
          <rect x="30" y="10" width="4" height="14" fill="#8b5cf6" />
        </g>
        
        {/* Books Bottom Row */}
        <rect x="8" y="30" width="5" height="14" fill="#8b5cf6" />
        <rect x="14" y="28" width="4" height="16" fill="#f59e0b" />
        <rect x="19" y="32" width="6" height="12" fill="#ef4444" />
        <rect x="27" y="28" width="4" height="16" fill="#3b82f6" />
        <g transform="translate(34, 44) rotate(-15) translate(-34, -44)">
          <rect x="34" y="30" width="4" height="14" fill="#10b981" />
        </g>
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

function FloorTile({ isCarpet }) {
  return <div className={isCarpet ? 'floor-tile floor-tile--carpet' : 'floor-tile'} />;
}

const CARPET_ZONES = [
  { c0: 9, c1: 15, r0: 6, r1: 11 },
];

function isCarpet(col, row) {
  return CARPET_ZONES.some(z => col >= z.c0 && col <= z.c1 && row >= z.r0 && row <= z.r1);
}

function renderTile(tile, col, row) {
  if (tile === '#') return <WallTile isOuter />;
  if (tile === 'W') return <WallTile isOuter={false} />;
  if (tile === 'D') return <DeskTile col={col} row={row} />;
  if (tile === 'C') return <ChairTile />;
  if (tile === 'P') return <PlantTile col={col} row={row} />;
  if (tile === 'B') return <ShelfTile />;
  if (tile === 'X') return <DoorTile />;
  return <FloorTile isCarpet={isCarpet(col, row)} />;
}

export default function OfficeInterior() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const layout = OFFICE_LAYOUTS[zoneId];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeNpcId, setActiveNpcId] = useState(null);

  const viewportRef = useRef(null);

  if (!layout) return <Navigate to="/" replace />;

  const rows = layout.map.length;
  const cols = layout.map[0].length;
  const mapW = cols * TILE_PX;
  const mapH = rows * TILE_PX;

  const initialPos = getPlayerStart(layout.map);

  const { playerCol, playerRow, playerFacing, nearMainNpc, nearMainNpcId } =
    usePlayerMovement({
      map: layout.map,
      npcs: layout.npcs,
      isDialogOpen: dialogOpen,
      onExitDoor: () => navigate('/'),
      onInteract: (npcId) => { setActiveNpcId(npcId); setDialogOpen(true); },
      initialPos,
    });

  const [scale, setScale] = useState(1);

  // Scale map to perfectly fit the screen 100%
  useEffect(() => {
    const updateScale = () => {
      const vp = viewportRef.current;
      if (!vp) return;
      
      // Calculate how much we need to scale down/up to fit
      // We add a tiny bit of padding (0.95) so it doesn't touch the absolute edges
      const scaleX = vp.clientWidth / mapW;
      const scaleY = vp.clientHeight / mapH;
      const bestFit = Math.min(scaleX, scaleY) * 0.98;
      
      setScale(bestFit);
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [mapW, mapH]);

  const activeNpc = dialogOpen && activeNpcId
    ? layout.npcs.find(n => n.id === activeNpcId)
    : null;

  return (
    <div className="office" style={{ '--office-accent': layout.color }}>

      <div className="office__hud">
        <button className="office__back" onClick={() => navigate('/')}>← Back to Map</button>
        <span className="office__hud-title">{layout.label}</span>
        <span className="office__hud-hint">WASD / Arrow keys · E to talk</span>
      </div>

      <div className="office__viewport" ref={viewportRef}>
        <div className="office__lighting-overlay" />
        
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="office__map" style={{ 
            width: mapW, height: mapH,
            transform: `scale(${scale})`,
            transformOrigin: 'center center'
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
              }}
            >
              <PixelCharacter
                type="player"
                facing={playerFacing}
                label="You"
                color={layout.color}
              />
            </div>

            {/* NPCs */}
            {layout.npcs.map(npc => (
              <div
                key={npc.id}
                className="office__entity"
                style={{
                  left: npc.col * TILE_PX + TILE_PX / 2,
                  top: npc.row * TILE_PX + TILE_PX,
                }}
              >
                <PixelCharacter
                  type={npc.type === 'main' ? 'npc-main' : 'npc-worker'}
                  facing={npc.facing}
                  label={npc.name}
                  color={layout.color}
                  isNear={nearMainNpcId === npc.id && nearMainNpc}
                  bubble={npc.bubble}
                />
              </div>
            ))}

          </div>
        </div>
      </div>

      {activeNpc && (
        <NpcDialog
          npc={activeNpc}
          zoneColor={layout.color}
          onClose={() => { setDialogOpen(false); setActiveNpcId(null); }}
          onEnterZone={() => navigate(layout.zoneRoute)}
        />
      )}

    </div>
  );
}
