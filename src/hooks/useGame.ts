import { useEffect, useRef, useState } from 'react';
import type { GameState, InputState, Level, Player } from '@/game/types';
import { createLevel } from '@/game/level';
import { createPlayer, updatePlayerAnimation } from '@/game/Player';
import { checkCollectibles, checkExit, updateCollectibles, updatePlayerPhysics } from '@/game/physics';
import { GameRenderer } from '@/game/renderer';

interface UseGameReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gameState: GameState;
  collectedCount: number;
  totalCount: number;
  startGame: () => void;
  restartGame: () => void;
}

export function useGame(): UseGameReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');
  const [collectedCount, setCollectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const gameStateRef = useRef<GameState>('start');
  const playerRef = useRef<Player | null>(null);
  const levelRef = useRef<Level | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    jump: false,
    jumpPressed: false,
  });
  const collectedRef = useRef(0);
  const totalRef = useRef(0);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameTimeRef = useRef<number>(0);

  const initGame = () => {
    const level = createLevel();
    levelRef.current = level;
    playerRef.current = createPlayer(level.playerStart.x, level.playerStart.y);
    collectedRef.current = 0;
    totalRef.current = level.collectibles.length;
    setCollectedCount(0);
    setTotalCount(level.collectibles.length);
    gameTimeRef.current = 0;
  };

  const startGame = () => {
    initGame();
    gameStateRef.current = 'playing';
    setGameState('playing');
  };

  const restartGame = () => {
    initGame();
    gameStateRef.current = 'playing';
    setGameState('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx);
    initGame();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          inputRef.current.left = true;
          break;
        case 'arrowright':
        case 'd':
          inputRef.current.right = true;
          break;
        case 'arrowup':
        case 'w':
        case ' ':
          if (!inputRef.current.jump) {
            inputRef.current.jumpPressed = true;
          }
          inputRef.current.jump = true;
          e.preventDefault();
          break;
        case 'r':
          if (gameStateRef.current === 'win') {
            restartGame();
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          inputRef.current.left = false;
          break;
        case 'arrowright':
        case 'd':
          inputRef.current.right = false;
          break;
        case 'arrowup':
        case 'w':
        case ' ':
          inputRef.current.jump = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      let dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (dt > 0.05) dt = 0.05;

      const player = playerRef.current;
      const level = levelRef.current;
      const renderer = rendererRef.current;

      if (player && level && renderer) {
        if (gameStateRef.current === 'playing') {
          gameTimeRef.current += dt;

          updatePlayerPhysics(player, level.platforms, inputRef.current, dt);
          updatePlayerAnimation(player, dt);
          updateCollectibles(level.collectibles, dt, gameTimeRef.current);

          const collected = checkCollectibles(player, level.collectibles);
          if (collected > 0) {
            collectedRef.current += collected;
            setCollectedCount(collectedRef.current);
          }

          const allCollected = collectedRef.current === totalRef.current;
          if (checkExit(player, level.exit, allCollected)) {
            gameStateRef.current = 'win';
            setGameState('win');
          }

          inputRef.current.jumpPressed = false;
        }

        renderer.render(level, player, collectedRef.current, totalRef.current, gameTimeRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return {
    canvasRef,
    gameState,
    collectedCount,
    totalCount,
    startGame,
    restartGame,
  };
}
