import type { Player, Platform, Collectible, ExitDoor, DreamRuleState, Level } from './types';
import { GAME_CONFIG } from './config';
import { isPlatformSolid } from './dreamRules';

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
  const { moveSpeed, jumpForce, friction } = GAME_CONFIG;
  const gravity = GAME_CONFIG.gravity;
  const gravityDir = dreamState?.gravityDir ?? 1;

  if (input.left) {
    player.vx -= moveSpeed * dt * 8;
    player.facing = 'left';
  }
  if (input.right) {
    player.vx += moveSpeed * dt * 8;
    player.facing = 'right';
  }

  const maxSpeed = moveSpeed;
  if (player.vx > maxSpeed) player.vx = maxSpeed;
  if (player.vx < -maxSpeed) player.vx = -maxSpeed;

  if (player.isGrounded) {
    player.vx *= friction;
    if (Math.abs(player.vx) < 10) player.vx = 0;
  }

  if (input.jumpPressed && player.isGrounded) {
    player.vy = -jumpForce * gravityDir;
    player.isGrounded = false;
  }

  player.vy += gravity * gravityDir * dt;

  if (gravityDir > 0 && player.vy > 1200) player.vy = 1200;
  if (gravityDir > 0 && player.vy < -1200) player.vy = -1200;
  if (gravityDir < 0 && player.vy < -1200) player.vy = -1200;
  if (gravityDir < 0 && player.vy > 1200) player.vy = 1200;

  player.x += player.vx * dt;
  resolveHorizontalCollision(player, platforms, dreamState, level);

  player.y += player.vy * dt;
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
