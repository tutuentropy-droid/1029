import type { CustomRule, CustomRuleType, Player, Level, NPC, Collectible } from './types';
import { GAME_CONFIG } from './config';

export const CUSTOM_RULE_TEMPLATES: Omit<CustomRule, 'id' | 'enabled'>[] = [
  {
    type: 'npc_float',
    name: '所有NPC漂浮',
    description: 'NPC们都飘起来了，好像失去了重力',
    icon: '🪐',
    intensity: 1,
  },
  {
    type: 'rain_slow',
    name: '下雨会让人变慢',
    description: '天空下起了雨，移动速度减半',
    icon: '🌧️',
    intensity: 0.5,
  },
  {
    type: 'file_run',
    name: '文件会逃跑',
    description: '文件看到你就会跑开，快抓住它们！',
    icon: '🏃',
    intensity: 1,
  },
  {
    type: 'gravity_low',
    name: '低重力',
    description: '引力变小了，跳得更高！',
    icon: '🌙',
    intensity: 0.6,
  },
  {
    type: 'gravity_high',
    name: '高重力',
    description: '引力变强了，跳跃很困难',
    icon: '🪨',
    intensity: 1.5,
  },
  {
    type: 'speed_up',
    name: '加速',
    description: '奔跑速度提升50%',
    icon: '⚡',
    intensity: 1.5,
  },
  {
    type: 'slow_down',
    name: '减速',
    description: '一切都变慢了',
    icon: '🐌',
    intensity: 0.5,
  },
  {
    type: 'bouncy_platforms',
    name: '弹跳平台',
    description: '平台变得有弹性，踩上去会弹起来',
    icon: '🔵',
    intensity: 1,
  },
  {
    type: 'invisible_platforms',
    name: '隐形平台',
    description: '平台变得透明，全凭记忆了！',
    icon: '👻',
    intensity: 1,
  },
  {
    type: 'flip_controls',
    name: '反向操作',
    description: '左右键反过来了，小心别走错！',
    icon: '🔄',
    intensity: 1,
  },
];

export function createCustomRule(type: CustomRuleType): CustomRule {
  const template = CUSTOM_RULE_TEMPLATES.find(t => t.type === type)!;
  return {
    ...template,
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    enabled: true,
  };
}

export function createAllRules(): CustomRule[] {
  return CUSTOM_RULE_TEMPLATES.map(template => ({
    ...template,
    id: `${template.type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    enabled: false,
  }));
}

interface RuleEffectContext {
  player: Player;
  level: Level;
  npcs: NPC[];
  input: { left: boolean; right: boolean; jump: boolean; jumpPressed: boolean };
  time: number;
  dt: number;
}

export function applyRuleEffects(
  rules: CustomRule[],
  ctx: RuleEffectContext
): {
  gravityMultiplier: number;
  speedMultiplier: number;
  jumpMultiplier: number;
  inputModifier: { left: boolean; right: boolean };
  isRaining: boolean;
  bounceEnabled: boolean;
  platformsInvisible: boolean;
} {
  const enabledRules = rules.filter(r => r.enabled);

  let gravityMultiplier = 1;
  let speedMultiplier = 1;
  let jumpMultiplier = 1;
  let inputModifier = { left: ctx.input.left, right: ctx.input.right };
  let isRaining = false;
  let bounceEnabled = false;
  let platformsInvisible = false;

  for (const rule of enabledRules) {
    switch (rule.type) {
      case 'gravity_low':
        gravityMultiplier *= rule.intensity;
        jumpMultiplier *= (1 + (1 - rule.intensity) * 0.5);
        break;
      case 'gravity_high':
        gravityMultiplier *= rule.intensity;
        jumpMultiplier *= (1 - (rule.intensity - 1) * 0.3);
        break;
      case 'speed_up':
        speedMultiplier *= rule.intensity;
        break;
      case 'slow_down':
        speedMultiplier *= rule.intensity;
        break;
      case 'rain_slow':
        speedMultiplier *= rule.intensity;
        isRaining = true;
        break;
      case 'flip_controls':
        inputModifier = { left: ctx.input.right, right: ctx.input.left };
        break;
      case 'bouncy_platforms':
        bounceEnabled = true;
        break;
      case 'invisible_platforms':
        platformsInvisible = true;
        break;
    }
  }

  return {
    gravityMultiplier,
    speedMultiplier,
    jumpMultiplier,
    inputModifier,
    isRaining,
    bounceEnabled,
    platformsInvisible,
  };
}

export function updateRuleDynamics(
  rules: CustomRule[],
  ctx: RuleEffectContext
): void {
  const enabledRules = rules.filter(r => r.enabled);

  for (const rule of enabledRules) {
    switch (rule.type) {
      case 'npc_float':
        updateNPCFloat(ctx.npcs, ctx.time, rule.intensity);
        break;
      case 'file_run':
        updateFileRun(ctx.player, ctx.level.collectibles, ctx.time, rule.intensity, ctx.dt);
        break;
    }
  }
}

function updateNPCFloat(npcs: NPC[], time: number, intensity: number): void {
  for (const npc of npcs) {
    const floatOffset = Math.sin(time * 2 + npc.x * 0.01) * 30 * intensity;
    const targetY = (npc as unknown as { originalY?: number }).originalY ?? npc.y;
    if (!(npc as unknown as { originalY?: number }).originalY) {
      (npc as unknown as { originalY: number }).originalY = npc.y;
    }
    npc.y = targetY + floatOffset;
    npc.x += Math.sin(time * 1.5 + npc.y * 0.01) * 0.5 * intensity;
  }
}

function updateFileRun(
  player: Player,
  collectibles: Collectible[],
  time: number,
  intensity: number,
  dt: number
): void {
  for (const item of collectibles) {
    if (item.collected) continue;

    const dx = item.x - player.x;
    const dy = item.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 200 && distance > 0) {
      const runSpeed = 80 * intensity;
      const runX = (dx / distance) * runSpeed * dt;
      const runY = (dy / distance) * runSpeed * dt * 0.5;

      if (!(item as unknown as { originalX?: number }).originalX) {
        (item as unknown as { originalX: number }).originalX = item.x;
        (item as unknown as { originalY: number }).originalY = item.y;
      }

      const originalX = (item as unknown as { originalX: number }).originalX;
      const originalY = (item as unknown as { originalY: number }).originalY;

      item.x += runX;
      item.y += runY;

      const maxDist = 100;
      const currentDist = Math.sqrt(
        Math.pow(item.x - originalX, 2) + Math.pow(item.y - originalY, 2)
      );
      if (currentDist > maxDist) {
        const angle = Math.atan2(item.y - originalY, item.x - originalX);
        item.x = originalX + Math.cos(angle) * maxDist;
        item.y = originalY + Math.sin(angle) * maxDist;
      }
    }

    item.floatOffset = time * 3 + (item as unknown as { originalX?: number }).originalX * 0.01;
  }
}

export function getEffectiveGravity(rules: CustomRule[]): number {
  const effects = applyRuleEffects(rules, {
    player: {} as Player,
    level: {} as Level,
    npcs: [],
    input: { left: false, right: false, jump: false, jumpPressed: false },
    time: 0,
    dt: 0,
  });
  return GAME_CONFIG.gravity * effects.gravityMultiplier;
}

export function getEffectiveSpeed(rules: CustomRule[]): number {
  const effects = applyRuleEffects(rules, {
    player: {} as Player,
    level: {} as Level,
    npcs: [],
    input: { left: false, right: false, jump: false, jumpPressed: false },
    time: 0,
    dt: 0,
  });
  return GAME_CONFIG.moveSpeed * effects.speedMultiplier;
}

export function getEffectiveJumpForce(rules: CustomRule[]): number {
  const effects = applyRuleEffects(rules, {
    player: {} as Player,
    level: {} as Level,
    npcs: [],
    input: { left: false, right: false, jump: false, jumpPressed: false },
    time: 0,
    dt: 0,
  });
  return GAME_CONFIG.jumpForce * effects.jumpMultiplier;
}

export function isBouncyPlatformsEnabled(rules: CustomRule[]): boolean {
  return rules.some(r => r.enabled && r.type === 'bouncy_platforms');
}

export function isPlatformsInvisible(rules: CustomRule[]): boolean {
  return rules.some(r => r.enabled && r.type === 'invisible_platforms');
}

export function isRaining(rules: CustomRule[]): boolean {
  return rules.some(r => r.enabled && r.type === 'rain_slow');
}

export function getRuleDescription(rule: CustomRule): string {
  return `${rule.icon} ${rule.name}: ${rule.description}`;
}
