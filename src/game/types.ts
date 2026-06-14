export type GameState = 'start' | 'announcement' | 'playing' | 'win';

export type PlayerState = 'idle' | 'walk' | 'jump';

export type Facing = 'left' | 'right';

export type MoodType = 'neutral' | 'happy' | 'surprised' | 'tired' | 'focused' | 'curious';

export interface PersonalityTraits {
  skipTendency: number;
  exploration: number;
  adventurousness: number;
  caution: number;
}

export interface PersonalityState {
  traits: PersonalityTraits;
  currentMood: MoodType;
  moodTimer: number;
  totalJumps: number;
  totalDistance: number;
  collectiblesFound: number;
  shortcutsUsed: number;
  hiddenAreasDiscovered: number;
  timePlayed: number;
  lastPosition: { x: number; y: number };
}

export interface WorldShiftState {
  platformLooseness: number;
  hiddenPlatformsVisible: boolean;
  dreamIntensity: number;
  colorShift: number;
  extraCollectibles: Collectible[];
  extraPlatforms: Platform[];
}

export interface HiddenArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  discovered: boolean;
  platformIds: number[];
  collectibleIds: number[];
}

export type DreamRuleType = 'moving_floor' | 'door_wander' | 'gravity_flip' | 'vanishing_platforms';

export interface DreamRule {
  type: DreamRuleType;
  hint: string;
  name: string;
  description: string;
}

export interface DreamRuleState {
  rule: DreamRule;
  gravityDir: number;
  floorMoveOffset: number;
  doorWanderTimer: number;
  doorWanderIndex: number;
  vanishTimers: number[];
  vanishVisible: boolean[];
  flipTimer: number;
  flipWarning: boolean;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: Facing;
  state: PlayerState;
  isGrounded: boolean;
  animTime: number;
  blinkTimer: number;
  isBlinking: boolean;
  mood: MoodType;
  moodTransition: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'desk' | 'cabinet' | 'floor' | 'chair';
  originalX: number;
  originalY: number;
  canVanish: boolean;
}

export interface Collectible {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  floatOffset: number;
  rotation: number;
}

export interface ExitDoor {
  x: number;
  y: number;
  width: number;
  height: number;
  originalX: number;
  originalY: number;
}

export interface Level {
  platforms: Platform[];
  collectibles: Collectible[];
  exit: ExitDoor;
  playerStart: { x: number; y: number };
  worldWidth: number;
  worldHeight: number;
  exitPositions: { x: number; y: number }[];
}

export interface GameConfig {
  gravity: number;
  moveSpeed: number;
  jumpForce: number;
  friction: number;
}

export type NPCBehavior = 'printer_fish' | 'ceiling_meeting' | 'backwards_boss' | 'floating_coffee' | 'typewriter_birds';

export interface NPCFish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  life: number;
}

export interface NPC {
  x: number;
  y: number;
  behavior: NPCBehavior;
  animTime: number;
  facing: Facing;
  fishes: NPCFish[];
  fishSpawnTimer: number;
  birds: NPCFish[];
  birdSpawnTimer: number;
  walkTimer: number;
  meetingBobPhase: number;
}

export interface CameraState {
  offsetX: number;
  offsetY: number;
  shakeIntensity: number;
  shakeTimer: number;
  panTargetX: number;
  panTargetY: number;
  panSpeed: number;
  isPanning: boolean;
  zoomLevel: number;
  zoomTarget: number;
  zoomSpeed: number;
  isZooming: boolean;
}

export interface CutsceneMoment {
  id: string;
  triggerTime: number;
  duration: number;
  panTo: { x: number; y: number } | null;
  zoomTo: number | null;
  shakeIntensity: number;
  message: string;
  messageDuration: number;
  triggered: boolean;
  finished: boolean;
}

export interface CutsceneState {
  moments: CutsceneMoment[];
  activeMoment: CutsceneMoment | null;
  messageText: string;
  messageTimer: number;
  messageAlpha: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}

export type CustomRuleType =
  | 'npc_float'
  | 'rain_slow'
  | 'file_run'
  | 'gravity_low'
  | 'gravity_high'
  | 'speed_up'
  | 'slow_down'
  | 'bouncy_platforms'
  | 'invisible_platforms'
  | 'flip_controls';

export interface CustomRule {
  id: string;
  type: CustomRuleType;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  intensity: number;
}

export type EditorElementType =
  | 'platform'
  | 'collectible'
  | 'npc'
  | 'exit'
  | 'player_start';

export interface EditorElement {
  id: string;
  type: EditorElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  subType?: string;
  data?: Record<string, unknown>;
}

export interface DirectorLevel {
  id: string;
  name: string;
  author: string;
  createdAt: number;
  elements: EditorElement[];
  rules: CustomRule[];
  worldWidth: number;
  worldHeight: number;
  description?: string;
}

export interface AutoTestResult {
  success: boolean;
  message: string;
  steps: string[];
  path: { x: number; y: number }[];
  time: number;
  collected: number;
  total: number;
  reachedExit: boolean;
}

export type EditorMode = 'select' | 'move' | 'delete';

export type DirectorGameState = 'editing' | 'playing' | 'testing' | 'sharing';
