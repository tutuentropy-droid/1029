import type { EditorElement, DirectorLevel, Level, Platform, Collectible, ExitDoor, NPC, AutoTestResult, Player } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_CONFIG } from './config';
import { createPlayer } from './Player';
import { updatePlayerPhysics, checkCollectibles, checkExit } from './physics';
import { applyRuleEffects, updateRuleDynamics, isBouncyPlatformsEnabled } from './customRules';
import { createNPC } from './npc';
import { FLOOR_THEMES } from './officeBuilding';

export function createEmptyLevel(name: string = '我的梦境'): DirectorLevel {
  const floorY = CANVAS_HEIGHT - 60;
  return {
    id: `level_${Date.now()}`,
    name,
    author: '梦境导演',
    createdAt: Date.now(),
    elements: [
      {
        id: 'floor_1',
        type: 'platform',
        x: 0,
        y: floorY,
        width: CANVAS_WIDTH,
        height: 60,
        subType: 'floor',
      },
      {
        id: 'player_start',
        type: 'player_start',
        x: 80,
        y: floorY - 80,
        width: 40,
        height: 60,
      },
      {
        id: 'exit_1',
        type: 'exit',
        x: CANVAS_WIDTH - 120,
        y: floorY - 120,
        width: 70,
        height: 120,
      },
    ],
    rules: [],
    worldWidth: CANVAS_WIDTH,
    worldHeight: CANVAS_HEIGHT,
    description: '一个由梦境导演创建的奇妙关卡',
  };
}

export function createElement(
  type: EditorElement['type'],
  x: number,
  y: number,
  subType?: string
): EditorElement {
  const id = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const defaults: Record<EditorElement['type'], { width: number; height: number; subType?: string }> = {
    platform: { width: 100, height: 20, subType: subType || 'desk' },
    collectible: { width: 30, height: 36 },
    npc: { width: 60, height: 60, subType: subType || 'printer_fish' },
    exit: { width: 70, height: 120 },
    player_start: { width: 40, height: 60 },
  };

  const def = defaults[type];
  return {
    id,
    type,
    x,
    y,
    width: def.width,
    height: def.height,
    subType: def.subType,
  };
}

export function directorLevelToGameLevel(directorLevel: DirectorLevel): {
  level: Level;
  npcs: NPC[];
  playerStart: { x: number; y: number };
} {
  const platforms: Platform[] = [];
  const collectibles: Collectible[] = [];
  const npcs: NPC[] = [];
  let exit: ExitDoor | null = null;
  let playerStart = { x: 80, y: CANVAS_HEIGHT - 140 };

  for (const element of directorLevel.elements) {
    switch (element.type) {
      case 'platform':
        platforms.push({
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          type: (element.subType as Platform['type']) || 'desk',
          originalX: element.x,
          originalY: element.y,
          canVanish: false,
        });
        break;
      case 'collectible':
        collectibles.push({
          x: element.x + element.width / 2,
          y: element.y + element.height / 2,
          width: element.width,
          height: element.height,
          collected: false,
          floatOffset: Math.random() * Math.PI * 2,
          rotation: 0,
        });
        break;
      case 'npc':
        npcs.push(
          createNPC(
            element.x + element.width / 2,
            element.y + element.height / 2,
            (element.subType as NPC['behavior']) || 'printer_fish'
          )
        );
        break;
      case 'exit':
        exit = {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          originalX: element.x,
          originalY: element.y,
        };
        break;
      case 'player_start':
        playerStart = { x: element.x, y: element.y };
        break;
    }
  }

  if (!exit) {
    exit = {
      x: CANVAS_WIDTH - 120,
      y: CANVAS_HEIGHT - 180,
      width: 70,
      height: 120,
      originalX: CANVAS_WIDTH - 120,
      originalY: CANVAS_HEIGHT - 180,
    };
  }

  return {
    level: {
      platforms,
      collectibles,
      exit,
      playerStart,
      worldWidth: directorLevel.worldWidth,
      worldHeight: directorLevel.worldHeight,
      exitPositions: [{ x: exit.x, y: exit.y }],
      floorIndex: 0,
      floorTheme: FLOOR_THEMES[0],
    },
    npcs,
    playerStart,
  };
}

export async function autoTestLevel(
  directorLevel: DirectorLevel,
  maxSteps: number = 2000,
  maxTime: number = 60
): Promise<AutoTestResult> {
  const { level, npcs, playerStart } = directorLevelToGameLevel(directorLevel);
  const player = createPlayer(playerStart.x, playerStart.y);
  const rules = directorLevel.rules;

  const steps: string[] = ['🎯 开始自动测试...'];
  const path: { x: number; y: number }[] = [{ x: player.x, y: player.y }];

  let collected = 0;
  const total = level.collectibles.length;
  let reachedExit = false;
  let time = 0;
  const dt = 1 / 60;

  const inputState = { left: false, right: false, jump: false, jumpPressed: false };

  const collectibleOrder = [...level.collectibles].sort((a, b) => a.x - b.x);
  let currentTarget = collectibleOrder.length > 0 ? 0 : -1;

  steps.push(`📍 发现 ${total} 个文件需要收集`);
  steps.push(`🚪 出口位于 (${level.exit.x.toFixed(0)}, ${level.exit.y.toFixed(0)})`);

  if (total === 0) {
    steps.push('⚠️  警告：关卡没有可收集的文件！');
  }

  for (let step = 0; step < maxSteps; step++) {
    time += dt;

    if (time > maxTime) {
      steps.push(`⏰ 超时：${maxTime}秒内未能完成`);
      break;
    }

    const effects = applyRuleEffects(rules, {
      player,
      level,
      npcs,
      input: inputState,
      time,
      dt,
    });

    updateRuleDynamics(rules, { player, level, npcs, input: inputState, time, dt });

    let targetX: number;
    let targetY: number;

    if (currentTarget >= 0 && currentTarget < collectibleOrder.length) {
      const item = collectibleOrder[currentTarget];
      if (item.collected) {
        currentTarget++;
        continue;
      }
      targetX = item.x;
      targetY = item.y;
    } else {
      targetX = level.exit.x + level.exit.width / 2;
      targetY = level.exit.y + level.exit.height / 2;
    }

    const dx = targetX - (player.x + player.width / 2);
    const dy = targetY - (player.y + player.height / 2);

    inputState.left = false;
    inputState.right = false;
    inputState.jump = false;
    inputState.jumpPressed = false;

    if (Math.abs(dx) > 15) {
      if (dx > 0) {
        inputState.right = true;
      } else {
        inputState.left = true;
      }
    }

    if (player.isGrounded && (dy < -80 || shouldJumpToReach(player, level, targetX, targetY))) {
      inputState.jumpPressed = true;
      inputState.jump = true;
    }

    const modifiedInput = {
      ...inputState,
      left: effects.inputModifier.left,
      right: effects.inputModifier.right,
    };

    if (isBouncyPlatformsEnabled(rules) && player.isGrounded && Math.random() < 0.1) {
      inputState.jumpPressed = true;
    }

    updatePlayerPhysics(player, level.platforms, modifiedInput, dt, null, level);

    if (isBouncyPlatformsEnabled(rules) && player.isGrounded && inputState.jumpPressed) {
      player.vy = -GAME_CONFIG.jumpForce * 1.5;
      player.isGrounded = false;
    }

    const newCollected = checkCollectibles(player, level.collectibles);
    if (newCollected > 0) {
      collected += newCollected;
      steps.push(`📄 收集了文件 (${collected}/${total})`);
    }

    if (step % 5 === 0) {
      path.push({ x: player.x, y: player.y });
    }

    const allCollected = collected >= total;
    if (checkExit(player, level.exit, allCollected)) {
      reachedExit = true;
      steps.push('🎉 成功到达出口！');
      break;
    }

    inputState.jumpPressed = false;
  }

  const success = reachedExit && collected >= total;

  if (!success) {
    if (collected < total) {
      steps.push(`❌ 只收集了 ${collected}/${total} 个文件`);
    }
    if (!reachedExit) {
      steps.push('❌ 未能到达出口');
    }
  } else {
    steps.push('✅ 关卡测试通过！可以正常通关');
  }

  return {
    success,
    message: success
      ? `🎉 太棒了！你的关卡可以在 ${time.toFixed(1)} 秒内通关`
      : `⚠️  关卡可能存在问题：${collected < total ? '有文件无法收集' : '无法到达出口'}`,
    steps,
    path,
    time,
    collected,
    total,
    reachedExit,
  };
}

function shouldJumpToReach(
  player: Player,
  level: Level,
  targetX: number,
  targetY: number
): boolean {
  const dx = targetX - (player.x + player.width / 2);
  const dy = targetY - (player.y + player.height / 2);

  if (dy < -100 && Math.abs(dx) < 150) {
    return true;
  }

  let platformAhead = false;
  let gapAhead = true;

  const lookAheadX = dx > 0 ? player.x + player.width + 10 : player.x - 10;
  const floorY = player.y + player.height + 5;

  for (const platform of level.platforms) {
    if (
      lookAheadX > platform.x &&
      lookAheadX < platform.x + platform.width &&
      Math.abs(floorY - platform.y) < 30
    ) {
      gapAhead = false;
    }

    if (
      Math.abs(targetX - (platform.x + platform.width / 2)) < 50 &&
      targetY < platform.y &&
      targetY > platform.y - 200
    ) {
      platformAhead = true;
    }
  }

  if (gapAhead && Math.abs(dx) < 100 && dy < 0) {
    return true;
  }

  return platformAhead && Math.abs(dx) < 100;
}

export function serializeLevel(level: DirectorLevel): string {
  const json = JSON.stringify(level);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  return encoded;
}

export function deserializeLevel(encoded: string): DirectorLevel | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const level = JSON.parse(json) as DirectorLevel;
    if (!level.id || !level.elements || !level.rules) {
      return null;
    }
    return level;
  } catch {
    return null;
  }
}

export function shareLevel(level: DirectorLevel): string {
  const encoded = serializeLevel(level);
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?level=${encoded}`;
}

export function importLevelFromUrl(): DirectorLevel | null {
  const params = new URLSearchParams(window.location.search);
  const levelParam = params.get('level');
  if (levelParam) {
    return deserializeLevel(levelParam);
  }
  return null;
}

export function validateLevel(level: DirectorLevel): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const hasPlayerStart = level.elements.some(e => e.type === 'player_start');
  const hasExit = level.elements.some(e => e.type === 'exit');
  const collectibles = level.elements.filter(e => e.type === 'collectible');

  if (!hasPlayerStart) {
    errors.push('❌ 关卡缺少玩家起点');
  }

  if (!hasExit) {
    errors.push('❌ 关卡缺少出口');
  }

  if (collectibles.length === 0) {
    errors.push('⚠️  关卡没有可收集的文件（可选，但建议添加）');
  }

  const playerStart = level.elements.find(e => e.type === 'player_start');
  const exit = level.elements.find(e => e.type === 'exit');

  if (playerStart && exit) {
    const dx = exit.x - playerStart.x;
    if (Math.abs(dx) < 100) {
      errors.push('⚠️  玩家起点距离出口太近');
    }
  }

  if (collectibles.length > 0 && playerStart) {
    let allReachable = true;
    for (const item of collectibles) {
      const dy = item.y - playerStart.y;
      if (dy < -300) {
        allReachable = false;
        errors.push(`⚠️  文件 (${item.x.toFixed(0)}, ${item.y.toFixed(0)}) 可能太高了`);
      }
    }
    if (!allReachable) {
      errors.push('💡 建议添加平台帮助玩家到达高处的文件');
    }
  }

  return {
    valid: errors.filter(e => e.startsWith('❌')).length === 0,
    errors,
  };
}

export function getLevelStats(level: DirectorLevel): {
  platformCount: number;
  collectibleCount: number;
  npcCount: number;
  ruleCount: number;
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
} {
  const platformCount = level.elements.filter(e => e.type === 'platform').length;
  const collectibleCount = level.elements.filter(e => e.type === 'collectible').length;
  const npcCount = level.elements.filter(e => e.type === 'npc').length;
  const ruleCount = level.rules.filter(r => r.enabled).length;

  let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  let score = collectibleCount * 2 + ruleCount * 5 + npcCount * 3;

  if (level.rules.some(r => r.enabled && r.type === 'gravity_high')) score += 5;
  if (level.rules.some(r => r.enabled && r.type === 'invisible_platforms')) score += 8;
  if (level.rules.some(r => r.enabled && r.type === 'flip_controls')) score += 6;
  if (level.rules.some(r => r.enabled && r.type === 'file_run')) score += 4;

  if (score > 30) difficulty = 'hard';
  else if (score > 15) difficulty = 'medium';

  return {
    platformCount,
    collectibleCount,
    npcCount,
    ruleCount,
    estimatedDifficulty: difficulty,
  };
}
