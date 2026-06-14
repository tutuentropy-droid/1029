export type GameState = 'start' | 'announcement' | 'playing' | 'win';

export type PlayerState = 'idle' | 'walk' | 'jump';

export type Facing = 'left' | 'right';

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

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpPressed: boolean;
}
