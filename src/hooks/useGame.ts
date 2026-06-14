import { useEffect, useRef, useState } from 'react';
import type { GameState, InputState, Level, Player, DreamRule, DreamRuleState, NPC, CameraState, CutsceneState, PersonalityState, WorldShiftState, HiddenArea, FloorTransition, FloorTheme } from '@/game/types';
import { createLevel } from '@/game/level';
import { createPlayer, updatePlayerAnimation, setPlayerMood, updatePlayerMood } from '@/game/Player';
import { checkCollectibles, checkExit, updateCollectibles, updatePlayerPhysics } from '@/game/physics';
import { GameRenderer } from '@/game/renderer';
import { selectRandomDreamRule, createDreamRuleState, updateDreamRule } from '@/game/dreamRules';
import { createNPCs, updateNPC, createCamera, updateCamera, createCutsceneState, updateCutscene } from '@/game/npc';
import { createPersonalityState, createWorldShiftState, createHiddenAreas, updatePersonality, updateWorldShift, applyPlatformLooseness, recordJump, getPersonalityDescription, getPersonalityTraitsList } from '@/game/personality';
import { createFloorLevel, createFloorTransition, updateFloorTransition, TOTAL_FLOORS, FLOOR_THEMES } from '@/game/officeBuilding';

interface UseGameReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gameState: GameState;
  collectedCount: number;
  totalCount: number;
  currentRule: DreamRule | null;
  personality: PersonalityState | null;
  personalityDescription: string;
  personalityTraits: { name: string; value: number; icon: string }[];
  currentFloor: number;
  totalFloors: number;
  floorTheme: FloorTheme | null;
  startGame: () => void;
  restartGame: () => void;
  dismissAnnouncement: () => void;
}

export function useGame(): UseGameReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');
  const [collectedCount, setCollectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [currentRule, setCurrentRule] = useState<DreamRule | null>(null);
  const [personalityState, setPersonalityState] = useState<PersonalityState | null>(null);
  const [personalityDescription, setPersonalityDescription] = useState('');
  const [personalityTraits, setPersonalityTraits] = useState<{ name: string; value: number; icon: string }[]>([]);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [floorTheme, setFloorTheme] = useState<FloorTheme | null>(null);

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
  const dreamStateRef = useRef<DreamRuleState | null>(null);
  const npcsRef = useRef<NPC[]>([]);
  const cameraRef = useRef<CameraState>(createCamera());
  const cutsceneRef = useRef<CutsceneState | null>(null);
  const personalityRef = useRef<PersonalityState | null>(null);
  const worldShiftRef = useRef<WorldShiftState | null>(null);
  const hiddenAreasRef = useRef<HiddenArea[]>([]);
  const floorTransitionRef = useRef<FloorTransition | null>(null);
  const currentFloorRef = useRef(0);

  const initFloor = (floorIndex: number) => {
    const level = createFloorLevel(floorIndex);
    levelRef.current = level;
    const player = createPlayer(level.playerStart.x, level.playerStart.y);
    playerRef.current = player;
    collectedRef.current = 0;
    totalRef.current = level.collectibles.length;
    setCollectedCount(0);
    setTotalCount(level.collectibles.length);
    gameTimeRef.current = 0;

    const rule = selectRandomDreamRule();
    setCurrentRule(rule);
    dreamStateRef.current = createDreamRuleState(rule, level);

    npcsRef.current = createNPCs();
    cameraRef.current = createCamera();
    cutsceneRef.current = createCutsceneState();

    const personality = personalityRef.current ?? createPersonalityState();
    personality.lastPosition = { x: player.x, y: player.y };
    personalityRef.current = personality;
    worldShiftRef.current = createWorldShiftState();
    hiddenAreasRef.current = createHiddenAreas();

    currentFloorRef.current = floorIndex;
    setCurrentFloor(floorIndex);
    setFloorTheme(level.floorTheme);

    setPersonalityState(personality);
    setPersonalityDescription(getPersonalityDescription(personality));
    setPersonalityTraits(getPersonalityTraitsList(personality));
  };

  const initGame = () => {
    initFloor(0);
  };

  const startGame = () => {
    initGame();
    gameStateRef.current = 'announcement';
    setGameState('announcement');
  };

  const dismissAnnouncement = () => {
    gameStateRef.current = 'playing';
    setGameState('playing');
  };

  const restartGame = () => {
    initGame();
    gameStateRef.current = 'announcement';
    setGameState('announcement');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rendererRef.current = new GameRenderer(ctx);

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
      const dreamState = dreamStateRef.current;
      const npcs = npcsRef.current;
      const camera = cameraRef.current;
      const cutscene = cutsceneRef.current;
      const personality = personalityRef.current;
      const worldShift = worldShiftRef.current;
      const hiddenAreas = hiddenAreasRef.current;
      const floorTransition = floorTransitionRef.current;

      if (player && level && renderer && personality && worldShift) {
        const inTransition = floorTransition && floorTransition.active;

        if (inTransition) {
          updateFloorTransition(floorTransition, dt);

          if (floorTransition.phase === 'moving' && floorTransition.timer < dt * 2) {
            const nextFloor = floorTransition.toFloor;
            initFloor(nextFloor);
          }

          if (floorTransition.phase === 'done') {
            floorTransitionRef.current = null;
          }
        }

        if (gameStateRef.current === 'playing' && !inTransition) {
          gameTimeRef.current += dt;

          if (inputRef.current.jumpPressed && player.isGrounded) {
            recordJump(personality);
          }

          if (dreamState) {
            updateDreamRule(dreamState, level, dt);
          }

          let allPlatforms = [...level.platforms];
          if (worldShift.hiddenPlatformsVisible) {
            allPlatforms = [...allPlatforms, ...worldShift.extraPlatforms];
          }

          updatePlayerPhysics(player, allPlatforms, inputRef.current, dt, dreamState, level);
          updatePlayerAnimation(player, dt);
          updatePlayerMood(player, dt);
          updateCollectibles(level.collectibles, dt, gameTimeRef.current);

          if (worldShift.hiddenPlatformsVisible) {
            updateCollectibles(worldShift.extraCollectibles, dt, gameTimeRef.current);
          }

          for (const npc of npcs) {
            updateNPC(npc, dt);
          }

          updateCamera(camera, dt);

          if (cutscene) {
            updateCutscene(cutscene, camera, gameTimeRef.current, dt);
          }

          const collected = checkCollectibles(player, level.collectibles);
          let extraCollected = 0;
          if (worldShift.hiddenPlatformsVisible) {
            extraCollected = checkCollectibles(player, worldShift.extraCollectibles);
          }
          const totalCollected = collected + extraCollected;
          if (totalCollected > 0) {
            collectedRef.current += totalCollected;
            totalRef.current = level.collectibles.length + (worldShift.hiddenPlatformsVisible ? worldShift.extraCollectibles.length : 0);
            setCollectedCount(collectedRef.current);
            setTotalCount(totalRef.current);
          }

          updatePersonality(personality, player, level, collectedRef.current, dt);
          updateWorldShift(worldShift, personality, level, hiddenAreas, dt);
          applyPlatformLooseness(level.platforms, worldShift.platformLooseness, gameTimeRef.current);

          setPlayerMood(player, personality.currentMood);

          if (Math.random() < 0.02) {
            setPersonalityState({ ...personality });
            setPersonalityDescription(getPersonalityDescription(personality));
            setPersonalityTraits(getPersonalityTraitsList(personality));
          }

          const allCollected = collectedRef.current >= totalRef.current;
          if (checkExit(player, level.exit, allCollected)) {
            const currentFloorIdx = currentFloorRef.current;
            if (currentFloorIdx < TOTAL_FLOORS - 1) {
              const transition = createFloorTransition(currentFloorIdx, currentFloorIdx + 1);
              floorTransitionRef.current = transition;
            } else {
              gameStateRef.current = 'win';
              setGameState('win');
            }
          }

          inputRef.current.jumpPressed = false;
        }

        renderer.render(level, player, collectedRef.current, totalRef.current, gameTimeRef.current, dreamState, npcs, camera, cutscene, worldShift, personality, hiddenAreas, [], floorTransitionRef.current);
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
    currentRule,
    personality: personalityState,
    personalityDescription,
    personalityTraits,
    currentFloor,
    totalFloors: TOTAL_FLOORS,
    floorTheme,
    startGame,
    restartGame,
    dismissAnnouncement,
  };
}
