import type { DreamRule, DreamRuleState, Level, Platform } from './types';

interface DreamRuleTemplate {
  type: DreamRule['type'];
  name: string;
  description: string;
  hints: string[];
}

const DREAM_RULE_TEMPLATES: DreamRuleTemplate[] = [
  {
    type: 'moving_floor',
    name: '移动地板',
    description: '地板在悄悄滑动...',
    hints: [
      '今天不要相信影子',
      '地面在偷偷溜走',
      '脚踏实地？未必',
      '跟着地板一起摇摆',
      '影子也在动',
    ],
  },
  {
    type: 'door_wander',
    name: '流浪之门',
    description: '门会突然换位置...',
    hints: [
      '出口并不总是出口',
      '门有自己的想法',
      '那扇门...刚才在这吗',
      '找门比下班更难',
      '出口是个流浪诗人',
    ],
  },
  {
    type: 'gravity_flip',
    name: '重力反转',
    description: '重力偶尔会反转...',
    hints: [
      '天花板才是地板',
      '上下只是一种习惯',
      '掉下去...还是飞起来',
      '换个角度看世界',
      '天花板上上下下的享受',
    ],
  },
  {
    type: 'vanishing_platforms',
    name: '消失的平台',
    description: '某些平台会凭空消失...',
    hints: [
      '脚下之物未必牢靠',
      '有些东西转瞬即逝',
      '平台也会请假',
      '看得见，踩得着吗',
      '虚实之间',
    ],
  },
];

export function selectDailyDreamRule(): DreamRule {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const typeIndex = seed % DREAM_RULE_TEMPLATES.length;
  const template = DREAM_RULE_TEMPLATES[typeIndex];
  const hintIndex = Math.floor(seed / 10) % template.hints.length;
  return {
    type: template.type,
    name: template.name,
    description: template.description,
    hint: template.hints[hintIndex],
  };
}

export function selectRandomDreamRule(): DreamRule {
  const typeIndex = Math.floor(Math.random() * DREAM_RULE_TEMPLATES.length);
  const template = DREAM_RULE_TEMPLATES[typeIndex];
  const hintIndex = Math.floor(Math.random() * template.hints.length);
  return {
    type: template.type,
    name: template.name,
    description: template.description,
    hint: template.hints[hintIndex],
  };
}

export function createDreamRuleState(rule: DreamRule, level: Level): DreamRuleState {
  const vanishingCount = rule.type === 'vanishing_platforms'
    ? level.platforms.filter(p => p.canVanish).length
    : 0;

  const vanishTimers = new Array(vanishingCount).fill(0).map(() => Math.random() * VANISH_CYCLE);

  return {
    rule,
    gravityDir: 1,
    floorMoveOffset: 0,
    doorWanderTimer: 0,
    doorWanderIndex: 0,
    vanishTimers,
    vanishVisible: new Array(vanishingCount).fill(true),
    flipTimer: Math.random() * GRAVITY_FLIP_INTERVAL,
    flipWarning: false,
  };
}

const GRAVITY_FLIP_INTERVAL = 8;
const GRAVITY_FLIP_WARNING_TIME = 1.5;
const DOOR_WANDER_INTERVAL = 6;
const VANISH_CYCLE = 4;
const VANISH_INVISIBLE_TIME = 2;

export function updateDreamRule(state: DreamRuleState, level: Level, dt: number): void {
  switch (state.rule.type) {
    case 'moving_floor':
      updateMovingFloor(state, level, dt);
      break;
    case 'door_wander':
      updateDoorWander(state, level, dt);
      break;
    case 'gravity_flip':
      updateGravityFlip(state, dt);
      break;
    case 'vanishing_platforms':
      updateVanishingPlatforms(state, level, dt);
      break;
  }
}

function updateMovingFloor(state: DreamRuleState, level: Level, dt: number): void {
  state.floorMoveOffset += dt * 40;
  for (const platform of level.platforms) {
    if (platform.type === 'floor') {
      platform.x = platform.originalX + Math.sin(state.floorMoveOffset * 0.5) * 60;
    }
  }
}

function updateDoorWander(state: DreamRuleState, level: Level, dt: number): void {
  state.doorWanderTimer += dt;
  if (state.doorWanderTimer >= DOOR_WANDER_INTERVAL) {
    state.doorWanderTimer = 0;
    state.doorWanderIndex = (state.doorWanderIndex + 1) % level.exitPositions.length;
    const pos = level.exitPositions[state.doorWanderIndex];
    level.exit.x = pos.x;
    level.exit.y = pos.y;
  }
}

function updateGravityFlip(state: DreamRuleState, dt: number): void {
  state.flipTimer += dt;
  const cycleProgress = state.flipTimer % GRAVITY_FLIP_INTERVAL;
  state.flipWarning = cycleProgress >= (GRAVITY_FLIP_INTERVAL - GRAVITY_FLIP_WARNING_TIME);

  if (state.flipTimer >= GRAVITY_FLIP_INTERVAL) {
    state.flipTimer = 0;
    state.gravityDir *= -1;
    state.flipWarning = false;
  }
}

function updateVanishingPlatforms(state: DreamRuleState, level: Level, dt: number): void {
  const vanishingPlatforms = level.platforms.filter(p => p.canVanish);
  for (let i = 0; i < vanishingPlatforms.length; i++) {
    state.vanishTimers[i] += dt;
    const cycle = state.vanishTimers[i] % VANISH_CYCLE;
    state.vanishVisible[i] = cycle < (VANISH_CYCLE - VANISH_INVISIBLE_TIME);
  }
}

export function isPlatformVisible(state: DreamRuleState, platformIndex: number, level: Level): boolean {
  if (state.rule.type !== 'vanishing_platforms') return true;
  const vanishingPlatforms = level.platforms.filter(p => p.canVanish);
  const vanishingIdx = vanishingPlatforms.indexOf(level.platforms[platformIndex]);
  if (vanishingIdx === -1) return true;
  return state.vanishVisible[vanishingIdx];
}

export function isPlatformSolid(state: DreamRuleState, platform: Platform, level: Level): boolean {
  if (state.rule.type !== 'vanishing_platforms' || !platform.canVanish) return true;
  const vanishingPlatforms = level.platforms.filter(p => p.canVanish);
  const idx = vanishingPlatforms.indexOf(platform);
  if (idx === -1) return true;
  return state.vanishVisible[idx];
}
