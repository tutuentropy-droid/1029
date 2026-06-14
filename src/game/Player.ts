import type { Player, Facing } from './types';

export function createPlayer(x: number, y: number): Player {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    width: 40,
    height: 60,
    facing: 'right',
    state: 'idle',
    isGrounded: false,
    animTime: 0,
    blinkTimer: 2,
    isBlinking: false,
  };
}

export function updatePlayerAnimation(player: Player, dt: number): void {
  player.animTime += dt;

  player.blinkTimer -= dt;
  if (player.blinkTimer <= 0) {
    player.isBlinking = !player.isBlinking;
    if (player.isBlinking) {
      player.blinkTimer = 0.15;
    } else {
      player.blinkTimer = 2 + Math.random() * 2;
    }
  }
}

export function getWalkPhase(player: Player): number {
  return (player.animTime * 8) % (Math.PI * 2);
}

export function getIdleBob(player: Player): number {
  return Math.sin(player.animTime * 2) * 2;
}

export function getWalkBob(player: Player): number {
  return Math.abs(Math.sin(getWalkPhase(player))) * 4;
}
