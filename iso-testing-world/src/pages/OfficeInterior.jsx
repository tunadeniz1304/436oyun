import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { OFFICE_LAYOUTS, getPlayerStart } from '../data/office-layouts.js';
import { usePlayerMovement } from '../hooks/usePlayerMovement.js';
import PixelCharacter from '../components/shared/PixelCharacter.jsx';
import NpcDialog from '../components/shared/NpcDialog.jsx';
import './OfficeInterior.css';

const TILE_PX = 48;

const BOOK_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#e67e22'];

function DeskTile() {
  return (
    <div className="desk-tile">
      <div className="desk-tile__surface" />
      <div className="desk-tile__monitor">
        <div className="desk-tile__screen" />
      </div>
      <div className="desk-tile__keyboard" />
      <div className="desk-tile__item" />
    </div>
  );
}

function ChairTile() {
  return (
    <div className="chair-tile">
      <div className="chair-tile__back" />
      <div className="chair-tile__seat" />
    </div>
  );
}

function PlantTile() {
  return (
    <div className="plant-tile">
      <div className="plant-tile__leaves">
        <div className="plant-tile__leaf plant-tile__leaf--1" />
        <div className="plant-tile__leaf plant-tile__leaf--2" />
        <div className="plant-tile__leaf plant-tile__leaf--3" />
      </div>
      <div className="plant-tile__pot" />
    </div>
  );
}

function ShelfTile() {
  return (
    <div className="shelf-tile">
      <div className="shelf-tile__row">
        {[4,3,5,3,4,4,3].map((w, i) => (
          <div key={i} className="shelf-tile__book"
            style={{ width: w, background: BOOK_COLORS[i % BOOK_COLORS.length] }} />
        ))}
      </div>
      <div className="shelf-tile__divider" />
      <div className="shelf-tile__row">
        {[3,5,3,4,3,5,4].map((w, i) => (
          <div key={i} className="shelf-tile__book"
            style={{ width: w, background: BOOK_COLORS[(i + 2) % BOOK_COLORS.length] }} />
        ))}
      </div>
    </div>
  );
}

function WallTile({ isOuter }) {
  return <div className={isOuter ? 'wall-tile wall-tile--outer' : 'wall-tile wall-tile--inner'} />;
}

function DoorTile() {
  return (
    <div className="door-tile">
      <div className="door-tile__frame">
        <div className="door-tile__panel" />
        <div className="door-tile__knob" />
      </div>
      <span className="door-tile__label">EXIT</span>
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
  if (tile === 'D') return <DeskTile />;
  if (tile === 'C') return <ChairTile />;
  if (tile === 'P') return <PlantTile />;
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

  // Keep player centered in the viewport
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const px = playerCol * TILE_PX + TILE_PX / 2;
    const py = playerRow * TILE_PX + TILE_PX / 2;
    const scrollX = px - vp.clientWidth / 2;
    const scrollY = py - vp.clientHeight / 2;
    vp.scrollTo({ left: scrollX, top: scrollY, behavior: 'smooth' });
  }, [playerCol, playerRow]);

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
        <div className="office__map" style={{ width: mapW, height: mapH }}>

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
