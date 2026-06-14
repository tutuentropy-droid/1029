import type { Player, Platform, Collectible, ExitDoor, DreamRuleState, Level, FloorRule } from './types';
import { GAME_CONFIG } from './config';
import { isPlatformSolid } from './dreamRules';

export function applyFloorRuleToInput(rule: FloorRule, input: { left: boolean; right: boolean; jump: boolean; jumpPressed: boolean }): { left: boolean; right: boolean; jump: boolean; jumpPressed: boolean } {
  switch (rule) {
    case 'no_jump':
      return { ...input, jump: false, jumpPressed: false };
    case 'flip_controls':
      return { left: input.right, right: input.left, jump: input.jump, jumpPressed: input.jumpPressed };
    default:
      return input;
  }
}

export function applyFloorRuleToFriction(rule: FloorRule, baseFriction: number): number {
  switch (rule) {
    case 'slippery':
      return 0.97;
    default:
      return baseFriction;
  }
}

export function applyFloorRuleToSpeed(rule: FloorRule, baseSpeed: number): number {
  switch (rule) {
    case 'slow_motion':
      return baseSpeed * 0.6;
    default:
      return baseSpeed;
  }
}

export function getTimeReversePush(rule: FloorRule, player: Player, dt: number): { dx: number; dy: number } {
  if (rule !== 'time_reverse') return { dx: 0, dy: 0 };
  const pushStrength = 40;
  return {
    dx: -player.vx * dt * 0.3,
    dy: 0,
  };
}

export function checkAABB(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function updatePlayerPhysics(
  player: Player,
  platforms: Platform[],
  input: { left: boolean; right: boolean; jump: boolean; jumpPressed: boolean },
  dt: number,
  dreamState: DreamRuleState | null,
  level: Level
): void {
  const floorRule = level.floorTheme.rule;
  const effectiveInput = applyFloorRuleToInput(floorRule, input);
  const effectiveSpeed = applyFloorRuleToSpeed(floorRule, GAME_CONFIG.moveSpeed);
  const effectiveFriction = applyFloorRuleToFriction(floorRule, GAME_CONFIG.friction);
  const { jumpForce } = GAME_CONFIG;
  const gravity = GAME_CONFIG.gravity;
  const gravityDir = dreamState?.gravityDir ?? 1;

  if (effectiveInput.left) {
    player.vx -= effectiveSpeed * dt * 8;
    player.facing = 'left';
  }
  if (effectiveInput.right) {
    player.vx += effectiveSpeed * dt * 8;
    player.facing = 'right';
  }

  const maxSpeed = effectiveSpeed;
  if (player.vx > maxSpeed) player.vx = maxSpeed;
  if (player.vx < -maxSpeed) player.vx = -maxSpeed;

  if (player.isGrounded) {
    player.vx *= effectiveFriction;
    if (Math.abs(player.vx) < 10) player.vx = 0;
  }

  if (effectiveInput.jumpPressed && player.isGrounded) {
    player.vy = -jumpForce * gravityDir;
    player.isGrounded = false;
  }

  player.vy += gravity * gravityDir * dt;

  if (gravityDir > 0 && player.vy > 1200) player.vy = 1200;
  if (gravityDir > 0 && player.vy < -1200) player.vy = -1200;
  if (gravityDir < 0 && player.vy < -1200) player.vy = -1200;
  if (gravityDir < 0 && player.vy > 1200) player.vy = 1200;

  const reversePush = getTimeReversePush(floorRule, player, dt);
  player.x += player.vx * dt + reversePush.dx;
  resolveHorizontalCollision(player, platforms, dreamState, level);

  player.y += player.vy * dt + reversePush.dy;
  resolveVerticalCollision(player, platforms, dreamState, level, gravityDir);

  if (gravityDir > 0) {
    if (player.y > level.worldHeight - player.height) {
      player.y = level.worldHeight - player.height;
      player.vy = 0;
      player.isGrounded = true;
    }
    if (player.y < 0) {
      player.y = 0;
      if (player.vy < 0) player.vy = 0;
    }
  } else {
    if (player.y < 0) {
      player.y = 0;
      player.vy = 0;
      player.isGrounded = true;
    }
    if (player.y > level.worldHeight - player.height) {
      player.y = level.worldHeight - player.height;
      if (player.vy > 0) player.vy = 0;
    }
  }

  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }
  if (player.x > level.worldWidth - player.width) {
    player.x = level.worldWidth - player.width;
    player.vx = 0;
  }

  if (player.isGrounded) {
    if (Math.abs(player.vx) > 10) {
      player.state = 'walk';
    } else {
      player.state = 'idle';
    }
  } else {
    player.state = 'jump';
  }
}

function resolveHorizontalCollision(
  player: Player,
  platforms: Platform[],
  dreamState: DreamRuleState | null,
  level: Level
): void {
  for (const platform of platforms) {
    if (dreamState && !isPlatformSolid(dreamState, platform, level)) continue;
    if (checkAABB(player.x, player.y, player.width, player.height,
                  platform.x, platform.y, platform.width, platform.height)) {
      if (player.vx > 0) {
        player.x = platform.x - player.width;
      } else if (player.vx < 0) {
        player.x = platform.x + platform.width;
      }
      player.vx = 0;
    }
  }
}

function resolveVerticalCollision(
  player: Player,
  platforms: Platform[],
  dreamState: DreamRuleState | null,
  level: Level,
  gravityDir: number
): void {
  player.isGrounded = false;

  for (const platform of platforms) {
    if (dreamState && !isPlatformSolid(dreamState, platform, level)) continue;
    if (checkAABB(player.x, player.y, player.width, player.height,
                  platform.x, platform.y, platform.width, platform.height)) {
      if (gravityDir > 0) {
        if (player.vy > 0) {
          player.y = platform.y - player.height;
          player.vy = 0;
          player.isGrounded = true;
        } else if (player.vy < 0) {
          player.y = platform.y + platform.height;
          player.vy = 0;
        }
      } else {
        if (player.vy < 0) {
          player.y = platform.y + platform.height;
          player.vy = 0;
          player.isGrounded = true;
        } else if (player.vy > 0) {
          player.y = platform.y - player.height;
          player.vy = 0;
        }
      }
    }
  }
}

export function checkCollectibles(player: Player, collectibles: Collectible[]): number {
  let collected = 0;
  for (const item of collectibles) {
    if (item.collected) continue;
    if (checkAABB(
      player.x, player.y, player.width, player.height,
      item.x - item.width / 2, item.y - item.height / 2, item.width, item.height
    )) {
      item.collected = true;
      collected++;
    }
  }
  return collected;
}

export function checkExit(player: Player, exit: ExitDoor, allCollected: boolean): boolean {
  if (!allCollected) return false;
  return checkAABB(
    player.x, player.y, player.width, player.height,
    exit.x, exit.y, exit.width, exit.height
  );
}

export function updateCollectibles(collectibles: Collectible[], dt: number, time: number): void {
  for (const item of collectibles) {
    if (item.collected) continue;
    item.floatOffset += dt * 2;
    item.rotation = Math.sin(time * 2 + item.floatOffset) * 0.15;
  }
}
