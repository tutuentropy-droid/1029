import type { Level } from './types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config';

export function createLevel(): Level {
  const floorY = CANVAS_HEIGHT - 60;

  const platforms = [
    { x: 0, y: floorY, width: CANVAS_WIDTH, height: 60, type: 'floor' as const, originalX: 0, originalY: floorY, canVanish: false },
    { x: 100, y: floorY - 100, width: 150, height: 20, type: 'desk' as const, originalX: 100, originalY: floorY - 100, canVanish: true },
    { x: 350, y: floorY - 160, width: 120, height: 20, type: 'desk' as const, originalX: 350, originalY: floorY - 160, canVanish: false },
    { x: 550, y: floorY - 100, width: 140, height: 20, type: 'cabinet' as const, originalX: 550, originalY: floorY - 100, canVanish: true },
    { x: 750, y: floorY - 180, width: 100, height: 20, type: 'cabinet' as const, originalX: 750, originalY: floorY - 180, canVanish: false },
    { x: 200, y: floorY - 260, width: 100, height: 20, type: 'desk' as const, originalX: 200, originalY: floorY - 260, canVanish: true },
    { x: 450, y: floorY - 300, width: 120, height: 20, type: 'cabinet' as const, originalX: 450, originalY: floorY - 300, canVanish: false },
  ];

  const collectibles = [
    { x: 150, y: floorY - 140, width: 30, height: 36, collected: false, floatOffset: 0, rotation: 0 },
    { x: 390, y: floorY - 200, width: 30, height: 36, collected: false, floatOffset: Math.PI / 3, rotation: 0 },
    { x: 600, y: floorY - 140, width: 30, height: 36, collected: false, floatOffset: Math.PI / 2, rotation: 0 },
    { x: 780, y: floorY - 220, width: 30, height: 36, collected: false, floatOffset: Math.PI, rotation: 0 },
    { x: 230, y: floorY - 300, width: 30, height: 36, collected: false, floatOffset: Math.PI * 1.5, rotation: 0 },
    { x: 490, y: floorY - 340, width: 30, height: 36, collected: false, floatOffset: Math.PI * 0.7, rotation: 0 },
  ];

  const exitX = CANVAS_WIDTH - 100;
  const exitY = floorY - 120;

  const exit = {
    x: exitX,
    y: exitY,
    width: 70,
    height: 120,
    originalX: exitX,
    originalY: exitY,
  };

  return {
    platforms,
    collectibles,
    exit,
    playerStart: { x: 80, y: floorY - 80 },
    worldWidth: CANVAS_WIDTH,
    worldHeight: CANVAS_HEIGHT,
    exitPositions: [
      { x: exitX, y: exitY },
      { x: 50, y: floorY - 120 },
      { x: 400, y: floorY - 340 },
      { x: 700, y: floorY - 200 },
    ],
  };
}
