import { useState, useEffect, useRef, useCallback } from 'react';

const PASSABLE = new Set(['.', 'C', 'X']);

/**
 * @param {Object} params
 * @param {string[]} params.map
 * @param {Array}   params.npcs
 * @param {boolean} params.isDialogOpen
 * @param {()=>void} params.onExitDoor
 * @param {(npcId:string)=>void} params.onInteract
 * @param {{col:number,row:number}} params.initialPos
 */
export function usePlayerMovement({ map, npcs, isDialogOpen, onExitDoor, onInteract, initialPos }) {
  const [playerCol, setPlayerCol] = useState(initialPos.col);
  const [playerRow, setPlayerRow] = useState(initialPos.row);
  const [playerFacing, setPlayerFacing] = useState('down');
  const [nearMainNpc, setNearMainNpc] = useState(false);
  const [nearMainNpcId, setNearMainNpcId] = useState(null);

  // Keep a stable ref to always-current values so the keydown handler
  // never goes stale without needing to re-register itself.
  const stateRef = useRef({});
  stateRef.current = { playerCol, playerRow, playerFacing, nearMainNpc, nearMainNpcId, isDialogOpen };

  // Throttle movement speed
  const lastMoveRef = useRef(0);

  // Stable ref to npcs so we don't recreate npcBlocked on every render
  const npcsRef = useRef(npcs);
  npcsRef.current = npcs;

  const checkNearby = useCallback((col, row) => {
    const mainNpcs = npcsRef.current.filter(n => n.type === 'main');
    for (const npc of mainNpcs) {
      const dist = Math.max(Math.abs(col - npc.col), Math.abs(row - npc.row));
      if (dist <= 1) {
        setNearMainNpc(true);
        setNearMainNpcId(npc.id);
        return;
      }
    }
    setNearMainNpc(false);
    setNearMainNpcId(null);
  }, []); // stable — reads from ref

  // Stable callbacks
  const onExitDoorRef = useRef(onExitDoor);
  onExitDoorRef.current = onExitDoor;
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;

  useEffect(() => {
    const handleKeyDown = (e) => {
      const { playerCol, playerRow, playerFacing, nearMainNpc, nearMainNpcId, isDialogOpen } = stateRef.current;

      if (isDialogOpen) return;

      if (e.key === 'e' || e.key === 'E') {
        if (nearMainNpc && nearMainNpcId) {
          onInteractRef.current(nearMainNpcId);
        }
        return;
      }

      let dCol = 0;
      let dRow = 0;
      let facing = playerFacing;

      if (e.key === 'w' || e.key === 'ArrowUp')    { dRow = -1; facing = 'up'; }
      if (e.key === 's' || e.key === 'ArrowDown')  { dRow =  1; facing = 'down'; }
      if (e.key === 'a' || e.key === 'ArrowLeft')  { dCol = -1; facing = 'left'; }
      if (e.key === 'd' || e.key === 'ArrowRight') { dCol =  1; facing = 'right'; }

      if (dCol === 0 && dRow === 0) return;

      e.preventDefault();

      const now = Date.now();
      if (now - lastMoveRef.current < 120) return; // Speed limit (120ms per step)
      lastMoveRef.current = now;

      const newCol = playerCol + dCol;
      const newRow = playerRow + dRow;

      const currentMap = map; // map is stable (from layout data)

      if (newRow < 0 || newRow >= currentMap.length) return;
      if (newCol < 0 || newCol >= currentMap[newRow].length) return;

      const tile = currentMap[newRow][newCol];

      setPlayerFacing(facing);

      if (tile === 'X') {
        onExitDoorRef.current();
        return;
      }

      if (!PASSABLE.has(tile)) return;

      // Block movement into any NPC's tile
      const blocked = npcsRef.current.some(n => n.col === newCol && n.row === newRow);
      if (blocked) return;

      setPlayerCol(newCol);
      setPlayerRow(newRow);
      checkNearby(newCol, newRow);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // Register once — reads all mutable values through refs
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, checkNearby]);

  useEffect(() => {
    checkNearby(initialPos.col, initialPos.row);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { playerCol, playerRow, playerFacing, nearMainNpc, nearMainNpcId };
}
