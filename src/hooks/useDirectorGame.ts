import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  DirectorLevel,
  EditorElement,
  EditorMode,
  DirectorGameState,
  CustomRule,
  AutoTestResult,
  Player,
  Level,
  NPC,
  CameraState,
  CutsceneState,
  PersonalityState,
  WorldShiftState,
  HiddenArea,
  InputState,
} from '@/game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONFIG } from '@/game/config';
import { GameRenderer } from '@/game/renderer';
import { createPlayer, updatePlayerAnimation, updatePlayerMood } from '@/game/Player';
import { updatePlayerPhysics, checkCollectibles, checkExit, updateCollectibles } from '@/game/physics';
import { createCamera, createCutsceneState, updateNPC, updateCamera, updateCutscene } from '@/game/npc';
import { createPersonalityState, createWorldShiftState, createHiddenAreas, updatePersonality, updateWorldShift, applyPlatformLooseness, recordJump } from '@/game/personality';
import {
  createEmptyLevel,
  createElement,
  directorLevelToGameLevel,
  autoTestLevel,
  validateLevel,
  deserializeLevel,
  shareLevel,
  getLevelStats,
} from '@/game/directorLevel';
import {
  createAllRules,
  applyRuleEffects,
  updateRuleDynamics,
  isBouncyPlatformsEnabled,
} from '@/game/customRules';

interface UseDirectorGameReturn {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  editorCanvasRef: React.RefObject<HTMLCanvasElement>;
  directorState: DirectorGameState;
  currentLevel: DirectorLevel;
  editorMode: EditorMode;
  selectedElement: EditorElement | null;
  rules: CustomRule[];
  testResult: AutoTestResult | null;
  isTesting: boolean;
  collectedCount: number;
  totalCount: number;
  setEditorMode: (mode: EditorMode) => void;
  addElement: (type: EditorElement['type'], subType?: string) => void;
  selectElement: (id: string | null) => void;
  deleteElement: (id: string) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  toggleRule: (ruleId: string) => void;
  updateRuleIntensity: (ruleId: string, intensity: number) => void;
  startPlaying: () => void;
  stopPlaying: () => void;
  startTesting: () => Promise<void>;
  clearTestResult: () => void;
  shareCurrentLevel: () => string;
  importLevel: (encoded: string) => boolean;
  newLevel: () => void;
  saveLevel: () => void;
  loadLevel: (level: DirectorLevel) => void;
  validateCurrentLevel: () => { valid: boolean; errors: string[] };
  getCurrentLevelStats: () => ReturnType<typeof getLevelStats>;
  setLevelName: (name: string) => void;
  setLevelDescription: (description: string) => void;
  setAuthorName: (author: string) => void;
}

export function useDirectorGame(): UseDirectorGameReturn {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorCanvasRef = useRef<HTMLCanvasElement>(null);
  const [directorState, setDirectorState] = useState<DirectorGameState>('editing');
  const [currentLevel, setCurrentLevel] = useState<DirectorLevel>(() => createEmptyLevel());
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [selectedElement, setSelectedElement] = useState<EditorElement | null>(null);
  const [rules, setRules] = useState<CustomRule[]>(() => createAllRules());
  const [testResult, setTestResult] = useState<AutoTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [collectedCount, setCollectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const gameStateRef = useRef<DirectorGameState>('editing');
  const playerRef = useRef<Player | null>(null);
  const levelRef = useRef<Level | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const editorRendererRef = useRef<GameRenderer | null>(null);
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
  const npcsRef = useRef<NPC[]>([]);
  const cameraRef = useRef<CameraState>(createCamera());
  const cutsceneRef = useRef<CutsceneState | null>(null);
  const personalityRef = useRef<PersonalityState | null>(null);
  const worldShiftRef = useRef<WorldShiftState | null>(null);
  const hiddenAreasRef = useRef<HiddenArea[]>([]);
  const rulesRef = useRef<CustomRule[]>([]);
  const currentLevelRef = useRef<DirectorLevel>(currentLevel);
  const selectedElementRef = useRef<EditorElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  useEffect(() => {
    gameStateRef.current = directorState;
  }, [directorState]);

  const initGameFromLevel = useCallback(() => {
    const directorLevel = currentLevelRef.current;
    const { level, npcs, playerStart } = directorLevelToGameLevel(directorLevel);
    levelRef.current = level;
    const player = createPlayer(playerStart.x, playerStart.y);
    playerRef.current = player;
    collectedRef.current = 0;
    totalRef.current = level.collectibles.length;
    setCollectedCount(0);
    setTotalCount(level.collectibles.length);
    gameTimeRef.current = 0;

    npcsRef.current = npcs;
    cameraRef.current = createCamera();
    cutsceneRef.current = createCutsceneState();

    const personality = createPersonalityState();
    personality.lastPosition = { x: player.x, y: player.y };
    personalityRef.current = personality;
    worldShiftRef.current = createWorldShiftState();
    hiddenAreasRef.current = createHiddenAreas();
  }, []);

  const startPlaying = useCallback(() => {
    initGameFromLevel();
    gameStateRef.current = 'playing';
    setDirectorState('playing');
    setTestResult(null);
  }, [initGameFromLevel]);

  const stopPlaying = useCallback(() => {
    gameStateRef.current = 'editing';
    setDirectorState('editing');
  }, []);

  const startTesting = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    gameStateRef.current = 'testing';
    setDirectorState('testing');

    try {
      const result = await autoTestLevel(currentLevelRef.current);
      setTestResult(result);
    } finally {
      setIsTesting(false);
      gameStateRef.current = 'editing';
      setDirectorState('editing');
    }
  }, []);

  const clearTestResult = useCallback(() => {
    setTestResult(null);
  }, []);

  const addElement = useCallback((type: EditorElement['type'], subType?: string) => {
    const x = CANVAS_WIDTH / 2;
    const y = CANVAS_HEIGHT / 2;
    const newElement = createElement(type, x, y, subType);
    setCurrentLevel(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedElement(newElement);
  }, []);

  const selectElement = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedElement(null);
      return;
    }
    const element = currentLevelRef.current.elements.find(e => e.id === id);
    setSelectedElement(element || null);
  }, []);

  const deleteElement = useCallback((id: string) => {
    setCurrentLevel(prev => ({
      ...prev,
      elements: prev.elements.filter(e => e.id !== id),
    }));
    if (selectedElementRef.current?.id === id) {
      setSelectedElement(null);
    }
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<EditorElement>) => {
    setCurrentLevel(prev => ({
      ...prev,
      elements: prev.elements.map(e =>
        e.id === id ? { ...e, ...updates } : e
      ),
    }));
    if (selectedElementRef.current?.id === id) {
      setSelectedElement(prev => prev ? { ...prev, ...updates } : null);
    }
  }, []);

  const toggleRule = useCallback((ruleId: string) => {
    setRules(prev =>
      prev.map(r =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      )
    );
  }, []);

  const updateRuleIntensity = useCallback((ruleId: string, intensity: number) => {
    setRules(prev =>
      prev.map(r =>
        r.id === ruleId ? { ...r, intensity: Math.max(0.1, Math.min(2, intensity)) } : r
      )
    );
  }, []);

  const shareCurrentLevel = useCallback(() => {
    const levelToShare = {
      ...currentLevelRef.current,
      rules: rulesRef.current.filter(r => r.enabled),
    };
    return shareLevel(levelToShare);
  }, []);

  const importLevel = useCallback((encoded: string): boolean => {
    const level = deserializeLevel(encoded);
    if (level) {
      setCurrentLevel(level);
      const newRules = createAllRules();
      if (level.rules && level.rules.length > 0) {
        for (const importedRule of level.rules) {
          const idx = newRules.findIndex(r => r.type === importedRule.type);
          if (idx >= 0) {
            newRules[idx] = { ...importedRule, id: newRules[idx].id };
          }
        }
      }
      setRules(newRules);
      return true;
    }
    return false;
  }, []);

  const newLevel = useCallback(() => {
    const newLvl = createEmptyLevel();
    setCurrentLevel(newLvl);
    setRules(createAllRules());
    setSelectedElement(null);
    setTestResult(null);
  }, []);

  const saveLevel = useCallback(() => {
    const levelToSave = {
      ...currentLevelRef.current,
      rules: rulesRef.current,
    };
    const saved = JSON.stringify(levelToSave);
    localStorage.setItem('dream_director_level', saved);
  }, []);

  const loadLevel = useCallback((level: DirectorLevel) => {
    setCurrentLevel(level);
    const newRules = createAllRules();
    if (level.rules && level.rules.length > 0) {
      for (const importedRule of level.rules) {
        const idx = newRules.findIndex(r => r.type === importedRule.type);
        if (idx >= 0) {
          newRules[idx] = { ...importedRule, id: newRules[idx].id };
        }
      }
    }
    setRules(newRules);
  }, []);

  const validateCurrentLevel = useCallback(() => {
    return validateLevel(currentLevelRef.current);
  }, []);

  const getCurrentLevelStats = useCallback(() => {
    return getLevelStats(currentLevelRef.current);
  }, []);

  const setLevelName = useCallback((name: string) => {
    setCurrentLevel(prev => ({ ...prev, name }));
  }, []);

  const setLevelDescription = useCallback((description: string) => {
    setCurrentLevel(prev => ({ ...prev, description }));
  }, []);

  const setAuthorName = useCallback((author: string) => {
    setCurrentLevel(prev => ({ ...prev, author }));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('dream_director_level');
    if (saved) {
      try {
        const level = JSON.parse(saved) as DirectorLevel;
        loadLevel(level);
      } catch {
        // ignore
      }
    }
  }, [loadLevel]);

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
        case 'escape':
          if (gameStateRef.current === 'playing') {
            stopPlaying();
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
      const npcs = npcsRef.current;
      const camera = cameraRef.current;
      const cutscene = cutsceneRef.current;
      const personality = personalityRef.current;
      const worldShift = worldShiftRef.current;
      const hiddenAreas = hiddenAreasRef.current;
      const currentRules = rulesRef.current;

      if (gameStateRef.current === 'playing' && player && level && renderer && personality && worldShift) {
        gameTimeRef.current += dt;

        if (inputRef.current.jumpPressed && player.isGrounded) {
          recordJump(personality);
        }

        const effects = applyRuleEffects(currentRules, {
          player,
          level,
          npcs,
          input: inputRef.current,
          time: gameTimeRef.current,
          dt,
        });

        updateRuleDynamics(currentRules, {
          player,
          level,
          npcs,
          input: inputRef.current,
          time: gameTimeRef.current,
          dt,
        });

        const modifiedInput = {
          ...inputRef.current,
          left: effects.inputModifier.left,
          right: effects.inputModifier.right,
        };

        const originalGravity = GAME_CONFIG.gravity;
        const originalSpeed = GAME_CONFIG.moveSpeed;
        const originalJump = GAME_CONFIG.jumpForce;
        GAME_CONFIG.gravity = originalGravity * effects.gravityMultiplier;
        GAME_CONFIG.moveSpeed = originalSpeed * effects.speedMultiplier;
        GAME_CONFIG.jumpForce = originalJump * effects.jumpMultiplier;

        updatePlayerPhysics(player, level.platforms, modifiedInput, dt, null, level);

        GAME_CONFIG.gravity = originalGravity;
        GAME_CONFIG.moveSpeed = originalSpeed;
        GAME_CONFIG.jumpForce = originalJump;

        if (isBouncyPlatformsEnabled(currentRules) && player.isGrounded && inputRef.current.jumpPressed) {
          player.vy = -GAME_CONFIG.jumpForce * 1.5 * effects.jumpMultiplier;
          player.isGrounded = false;
        }

        updatePlayerAnimation(player, dt);
        updatePlayerMood(player, dt);
        updateCollectibles(level.collectibles, dt, gameTimeRef.current);

        for (const npc of npcs) {
          updateNPC(npc, dt);
        }

        updateCamera(camera, dt);

        if (cutscene) {
          updateCutscene(cutscene, camera, gameTimeRef.current, dt);
        }

        const collected = checkCollectibles(player, level.collectibles);
        if (collected > 0) {
          collectedRef.current += collected;
          setCollectedCount(collectedRef.current);
        }

        updatePersonality(personality, player, level, collectedRef.current, dt);
        updateWorldShift(worldShift, personality, level, hiddenAreas, dt);
        applyPlatformLooseness(level.platforms, worldShift.platformLooseness, gameTimeRef.current);

        const allCollected = collectedRef.current >= totalRef.current;
        if (checkExit(player, level.exit, allCollected)) {
          stopPlaying();
        }

        inputRef.current.jumpPressed = false;
      }

      if (player && level && renderer) {
        renderer.render(level, player, collectedRef.current, totalRef.current, gameTimeRef.current, null, npcs, camera, cutscene, worldShift, personality, hiddenAreas, currentRules);
      } else if (renderer) {
        const ctx = renderer['ctx'];
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#FFF8E7';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [stopPlaying]);

  useEffect(() => {
    const canvas = editorCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    editorRendererRef.current = new GameRenderer(ctx);

    const handleMouseDown = (e: MouseEvent) => {
      if (gameStateRef.current !== 'editing') return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const elements = [...currentLevelRef.current.elements].reverse();
      let clickedElement: EditorElement | null = null;

      for (const element of elements) {
        if (
          x >= element.x &&
          x <= element.x + element.width &&
          y >= element.y &&
          y <= element.y + element.height
        ) {
          clickedElement = element;
          break;
        }
      }

      if (editorMode === 'delete') {
        if (clickedElement) {
          deleteElement(clickedElement.id);
        }
        return;
      }

      if (editorMode === 'select' || editorMode === 'move') {
        if (clickedElement) {
          selectElement(clickedElement.id);
          if (editorMode === 'move') {
            isDraggingRef.current = true;
            dragOffsetRef.current = {
              x: x - clickedElement.x,
              y: y - clickedElement.y,
            };
          }
        } else {
          selectElement(null);
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !selectedElementRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      let newX = x - dragOffsetRef.current.x;
      let newY = y - dragOffsetRef.current.y;

      newX = Math.max(0, Math.min(CANVAS_WIDTH - selectedElementRef.current.width, newX));
      newY = Math.max(0, Math.min(CANVAS_HEIGHT - selectedElementRef.current.height, newY));

      updateElement(selectedElementRef.current.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const editorLoop = () => {
      const renderer = editorRendererRef.current;
      if (!renderer) return;

      const directorLevel = currentLevelRef.current;
      const selected = selectedElementRef.current;

      try {
        const { level, npcs } = directorLevelToGameLevel(directorLevel);

        const dummyPlayer = createPlayer(80, CANVAS_HEIGHT - 140);

        renderer.render(
          level,
          dummyPlayer,
          0,
          level.collectibles.length,
          performance.now() / 1000,
          null,
          npcs,
          createCamera(),
          null,
          createWorldShiftState(),
          createPersonalityState(),
          [],
          rulesRef.current
        );

        if (selected) {
          const ctx = renderer['ctx'];
          ctx.save();
          ctx.strokeStyle = '#FF6B6B';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(selected.x - 2, selected.y - 2, selected.width + 4, selected.height + 4);
          ctx.setLineDash([]);

          ctx.fillStyle = 'rgba(255, 107, 107, 0.1)';
          ctx.fillRect(selected.x, selected.y, selected.width, selected.height);

          ctx.fillStyle = '#FF6B6B';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText(`${selected.type}`, selected.x, selected.y - 5);
          ctx.restore();
        }

        const ctx = renderer['ctx'];
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
        ctx.lineWidth = 1;
        for (let x = 0; x < CANVAS_WIDTH; x += 50) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, CANVAS_HEIGHT);
          ctx.stroke();
        }
        for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_WIDTH, y);
          ctx.stroke();
        }
        ctx.restore();
      } catch {
        // ignore
      }

      requestAnimationFrame(editorLoop);
    };

    const frameId = requestAnimationFrame(editorLoop);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(frameId);
    };
  }, [editorMode, deleteElement, selectElement, updateElement]);

  return {
    canvasRef,
    editorCanvasRef,
    directorState,
    currentLevel,
    editorMode,
    selectedElement,
    rules,
    testResult,
    isTesting,
    collectedCount,
    totalCount,
    setEditorMode,
    addElement,
    selectElement,
    deleteElement,
    updateElement,
    toggleRule,
    updateRuleIntensity,
    startPlaying,
    stopPlaying,
    startTesting,
    clearTestResult,
    shareCurrentLevel,
    importLevel,
    newLevel,
    saveLevel,
    loadLevel,
    validateCurrentLevel,
    getCurrentLevelStats,
    setLevelName,
    setLevelDescription,
    setAuthorName,
  };
}
