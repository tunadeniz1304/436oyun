import { useState, useEffect, useRef, useCallback } from 'react';

const PASSABLE = new Set(['.', 'C', 'X', 'R']);

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
  const [nearNpc, setNearNpc] = useState(false);
  const [nearNpcId, setNearNpcId] = useState(null);
  const [isMoving, setIsMoving] = useState(false);

  const stateRef = useRef({});
  stateRef.current = { playerCol, playerRow, playerFacing, nearNpc, nearNpcId, isDialogOpen };

  const lastMoveRef = useRef(0);
  const moveTimeoutRef = useRef(null);

  const npcsRef = useRef(npcs);
  npcsRef.current = npcs;

  const checkNearby = useCallback((col, row) => {
    const interactable = npcsRef.current.filter(n => n.interactable === true);
    for (const npc of interactable) {
      const dist = Math.max(Math.abs(col - npc.col), Math.abs(row - npc.row));
      if (dist <= 1) {
        setNearNpc(true);
        setNearNpcId(npc.id);
        return;
      }
    }
    setNearNpc(false);
    setNearNpcId(null);
  }, []);

  const onExitDoorRef = useRef(onExitDoor);
  onExitDoorRef.current = onExitDoor;
  const onInteractRef = useRef(onInteract);
  onInteractRef.current = onInteract;

  useEffect(() => {
    const handleKeyDown = (e) => {
      const { playerCol, playerRow, playerFacing, nearNpc, nearNpcId, isDialogOpen } = stateRef.current;

      if (isDialogOpen) return;

      if (e.key === 'e' || e.key === 'E') {
        if (nearNpc && nearNpcId) {
          onInteractRef.current(nearNpcId);
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
      if (now - lastMoveRef.current < 120) return;
      lastMoveRef.current = now;

      const newCol = playerCol + dCol;
      const newRow = playerRow + dRow;

      if (newRow < 0 || newRow >= map.length) return;
      if (newCol < 0 || newCol >= map[newRow].length) return;

      const tile = map[newRow][newCol];

      setPlayerFacing(facing);

      setIsMoving(true);
      clearTimeout(moveTimeoutRef.current);
      moveTimeoutRef.current = setTimeout(() => setIsMoving(false), 150);

      if (tile === 'X') {
        onExitDoorRef.current();
        return;
      }

      if (!PASSABLE.has(tile)) return;

      const blocked = npcsRef.current.some(n => n.col === newCol && n.row === newRow);
      if (blocked) return;

      setPlayerCol(newCol);
      setPlayerRow(newRow);
      checkNearby(newCol, newRow);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, checkNearby]);

  useEffect(() => {
    checkNearby(initialPos.col, initialPos.row);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backwards-compat aliases so existing consumers still work
  return { playerCol, playerRow, playerFacing, nearMainNpc: nearNpc, nearMainNpcId: nearNpcId, nearNpc, nearNpcId, isMoving };
}
