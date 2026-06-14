import type { PersonalityState, PersonalityTraits, MoodType, Player, Level, WorldShiftState, HiddenArea, Platform, Collectible } from './types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config';

const FLOOR_Y = CANVAS_HEIGHT - 60;

export function createPersonalityState(): PersonalityState {
  return {
    traits: {
      skipTendency: 0.3,
      exploration: 0.5,
      adventurousness: 0.5,
      caution: 0.5,
    },
    currentMood: 'neutral',
    moodTimer: 0,
    totalJumps: 0,
    totalDistance: 0,
    collectiblesFound: 0,
    shortcutsUsed: 0,
    hiddenAreasDiscovered: 0,
    timePlayed: 0,
    lastPosition: { x: 0, y: 0 },
  };
}

export function createWorldShiftState(): WorldShiftState {
  return {
    platformLooseness: 0,
    hiddenPlatformsVisible: false,
    dreamIntensity: 0.3,
    colorShift: 0,
    extraCollectibles: [],
    extraPlatforms: [],
  };
}

export function createHiddenAreas(): HiddenArea[] {
  return [
    {
      id: 'secret_attic',
      x: 600,
      y: 60,
      width: 200,
      height: 100,
      discovered: false,
      platformIds: [],
      collectibleIds: [],
    },
    {
      id: 'underground_nook',
      x: 50,
      y: FLOOR_Y - 40,
      width: 100,
      height: 40,
      discovered: false,
      platformIds: [],
      collectibleIds: [],
    },
  ];
}

function createExtraPlatforms(): Platform[] {
  return [
    { x: 620, y: 140, width: 80, height: 16, type: 'cabinet' as const, originalX: 620, originalY: 140, canVanish: false },
    { x: 720, y: 100, width: 60, height: 16, type: 'desk' as const, originalX: 720, originalY: 100, canVanish: false },
    { x: 80, y: FLOOR_Y - 40, width: 60, height: 12, type: 'chair' as const, originalX: 80, originalY: FLOOR_Y - 40, canVanish: false },
  ];
}

function createExtraCollectibles(): Collectible[] {
  return [
    { x: 660, y: 100, width: 24, height: 30, collected: false, floatOffset: 0, rotation: 0 },
    { x: 750, y: 60, width: 24, height: 30, collected: false, floatOffset: Math.PI / 2, rotation: 0 },
    { x: 110, y: FLOOR_Y - 70, width: 24, height: 30, collected: false, floatOffset: Math.PI, rotation: 0 },
  ];
}

export function updatePersonality(
  personality: PersonalityState,
  player: Player,
  level: Level,
  collectedCount: number,
  dt: number
): void {
  personality.timePlayed += dt;
  personality.moodTimer -= dt;

  const dx = player.x - personality.lastPosition.x;
  const dy = player.y - personality.lastPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  personality.totalDistance += distance;

  if (personality.collectiblesFound < collectedCount) {
    const newCollectibles = collectedCount - personality.collectiblesFound;
    personality.collectiblesFound = collectedCount;
    personality.traits.exploration = Math.min(1, personality.traits.exploration + newCollectibles * 0.08);
    setMood(personality, 'happy', 3);
  }

  personality.lastPosition = { x: player.x, y: player.y };

  const baseCollectibles = level.collectibles.length;
  const collectRatio = Math.min(1, collectedCount / baseCollectibles);

  if (collectRatio < 0.5 && personality.timePlayed > 10) {
    personality.traits.skipTendency = Math.min(1, personality.traits.skipTendency + dt * 0.01);
  } else if (collectRatio > 0.7) {
    personality.traits.skipTendency = Math.max(0, personality.traits.skipTendency - dt * 0.005);
  }

  if (player.state === 'jump') {
    personality.traits.adventurousness = Math.min(1, personality.traits.adventurousness + dt * 0.02);
    personality.traits.caution = Math.max(0, personality.traits.caution - dt * 0.01);
  } else if (player.state === 'idle') {
    personality.traits.caution = Math.min(1, personality.traits.caution + dt * 0.015);
  }

  if (player.y < FLOOR_Y - 200) {
    personality.traits.exploration = Math.min(1, personality.traits.exploration + dt * 0.01);
  }

  if (personality.moodTimer <= 0) {
    updateAmbientMood(personality, player);
  }
}

export function recordJump(personality: PersonalityState): void {
  personality.totalJumps++;
  setMood(personality, 'curious', 1.5);
}

function setMood(personality: PersonalityState, mood: MoodType, duration: number): void {
  if (moodPriority(mood) >= moodPriority(personality.currentMood)) {
    personality.currentMood = mood;
    personality.moodTimer = duration;
  }
}

function moodPriority(mood: MoodType): number {
  const priorities: Record<MoodType, number> = {
    surprised: 10,
    happy: 8,
    curious: 6,
    focused: 5,
    tired: 4,
    neutral: 0,
  };
  return priorities[mood];
}

function updateAmbientMood(personality: PersonalityState, player: Player): void {
  if (player.state === 'idle') {
    personality.currentMood = 'tired';
    personality.moodTimer = 2;
  } else if (player.state === 'walk') {
    personality.currentMood = 'focused';
    personality.moodTimer = 2;
  } else {
    personality.currentMood = 'neutral';
    personality.moodTimer = 3;
  }
}

export function updateWorldShift(
  worldShift: WorldShiftState,
  personality: PersonalityState,
  level: Level,
  hiddenAreas: HiddenArea[],
  dt: number
): void {
  const targetLooseness = personality.traits.skipTendency * 0.8;
  worldShift.platformLooseness += (targetLooseness - worldShift.platformLooseness) * dt * 0.5;

  const targetIntensity = 0.3 + (personality.traits.exploration + personality.traits.adventurousness) * 0.35;
  worldShift.dreamIntensity += (targetIntensity - worldShift.dreamIntensity) * dt * 0.3;

  worldShift.colorShift = personality.traits.exploration * 0.5 + personality.traits.adventurousness * 0.3;

  const shouldShowHidden = personality.traits.exploration > 0.65;
  if (shouldShowHidden && !worldShift.hiddenPlatformsVisible) {
    worldShift.hiddenPlatformsVisible = true;
    if (worldShift.extraPlatforms.length === 0) {
      worldShift.extraPlatforms = createExtraPlatforms();
      worldShift.extraCollectibles = createExtraCollectibles();
    }
  } else if (!shouldShowHidden && worldShift.hiddenPlatformsVisible) {
    worldShift.hiddenPlatformsVisible = false;
  }

  for (const area of hiddenAreas) {
    if (!area.discovered) {
      const player = personality.lastPosition;
      const inArea =
        player.x > area.x &&
        player.x < area.x + area.width &&
        player.y > area.y &&
        player.y < area.y + area.height;
      if (inArea && personality.traits.exploration > 0.5) {
        area.discovered = true;
        personality.hiddenAreasDiscovered++;
        setMood(personality, 'surprised', 4);
      }
    }
  }
}

export function applyPlatformLooseness(platforms: Platform[], looseness: number, time: number): void {
  if (looseness <= 0) return;

  for (const platform of platforms) {
    if (platform.type === 'floor') continue;

    const driftAmount = looseness * 30;
    const wobbleSpeed = 0.5 + looseness * 2;

    platform.x = platform.originalX + Math.sin(time * wobbleSpeed + platform.originalY * 0.01) * driftAmount;
    platform.y = platform.originalY + Math.cos(time * wobbleSpeed * 0.7 + platform.originalX * 0.01) * driftAmount * 0.3;
  }
}

export function getPersonalityDescription(personality: PersonalityState): string {
  const { traits } = personality;

  if (traits.skipTendency > 0.7) {
    return '你是个效率至上的梦想家';
  }
  if (traits.exploration > 0.7) {
    return '你的梦境充满了秘密角落';
  }
  if (traits.adventurousness > 0.7) {
    return '你在梦中也在不断攀登';
  }
  if (traits.caution > 0.7) {
    return '你的梦境安稳又踏实';
  }

  return '你的梦境反映着真实的你';
}

export function getPersonalityTraitsList(personality: PersonalityState): { name: string; value: number; icon: string }[] {
  return [
    { name: '逃课倾向', value: personality.traits.skipTendency, icon: '🏃' },
    { name: '探索欲', value: personality.traits.exploration, icon: '🔍' },
    { name: '冒险精神', value: personality.traits.adventurousness, icon: '⛰️' },
    { name: '谨慎度', value: personality.traits.caution, icon: '🛡️' },
  ];
}
