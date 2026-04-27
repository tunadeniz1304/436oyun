import { useContext } from 'react';
import { GameContext } from '../context/GameContext.jsx';

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used inside <GameProvider>');
  }
  return ctx;
}
