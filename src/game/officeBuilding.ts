import type { FloorTheme, Level, Platform, Collectible, ExitDoor } from './types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config';

export const FLOOR_THEMES: FloorTheme[] = [
  {
    id: 'lobby',
    name: '一楼 · 大厅',
    subtitle: '一切梦开始的地方',
    bgTop: '#FFF8E7',
    bgBottom: '#FFE4C4',
    wallColor: '#F5E6D3',
    floorColor: '#D4A574',
    accentColor: '#FF6B6B',
    rule: 'none',
    ruleDescription: '',
    ruleHint: '',
    icon: '🏢',
  },
  {
    id: 'meeting',
    name: '二楼 · 无尽会议室',
    subtitle: '会议永远不会结束',
    bgTop: '#1A1A2E',
    bgBottom: '#16213E',
    wallColor: '#0F3460',
    floorColor: '#533483',
    accentColor: '#E94560',
    rule: 'no_jump',
    ruleDescription: '会议室里不许跳跃！',
    ruleHint: '坐下，安静，不要跳',
    icon: '📊',
  },
  {
    id: 'toilet',
    name: '三楼 · 诡异厕所',
    subtitle: '镜子里的你...不太对',
    bgTop: '#E8F5E9',
    bgBottom: '#A5D6A7',
    wallColor: '#81C784',
    floorColor: '#66BB6A',
    accentColor: '#43A047',
    rule: 'flip_controls',
    ruleDescription: '控制反转了！左右相反',
    ruleHint: '你以为往左，其实往右',
    icon: '🚻',
  },
  {
    id: 'printer',
    name: '四楼 · 无限打印机',
    subtitle: '打印永远不会停',
    bgTop: '#ECEFF1',
    bgBottom: '#B0BEC5',
    wallColor: '#78909C',
    floorColor: '#607D8B',
    accentColor: '#FF5722',
    rule: 'slippery',
    ruleDescription: '地面全是纸，太滑了！',
    ruleHint: '纸上走路，停不下来',
    icon: '🖨️',
  },
  {
    id: 'tea',
    name: '五楼 · 沉默茶水间',
    subtitle: '时间在这里倒着走',
    bgTop: '#3E2723',
    bgBottom: '#4E342E',
    wallColor: '#5D4037',
    floorColor: '#6D4C41',
    accentColor: '#FFB300',
    rule: 'time_reverse',
    ruleDescription: '时间持续倒退，你的位置也在回退！',
    ruleHint: '你走三步，时间推你两步',
    icon: '🍵',
  },
];

export const TOTAL_FLOORS = FLOOR_THEMES.length;

export function getFloorTheme(index: number): FloorTheme {
  return FLOOR_THEMES[Math.min(index, FLOOR_THEMES.length - 1)];
}

function makePlatform(
  x: number, y: number, w: number, h: number,
  type: Platform['type'], canVanish = false
): Platform {
  return { x, y, width: w, height: h, type, originalX: x, originalY: y, canVanish };
}

function makeCollectible(x: number, y: number, floatOffset: number): Collectible {
  return { x, y, width: 30, height: 36, collected: false, floatOffset, rotation: 0 };
}

function makeExit(x: number, y: number): ExitDoor {
  return { x, y, width: 70, height: 120, originalX: x, originalY: y };
}

function createLobbyLevel(): Level {
  const floorY = CANVAS_HEIGHT - 60;
  const platforms = [
    makePlatform(0, floorY, CANVAS_WIDTH, 60, 'floor'),
    makePlatform(100, floorY - 100, 150, 20, 'desk', true),
    makePlatform(350, floorY - 160, 120, 20, 'desk'),
    makePlatform(550, floorY - 100, 140, 20, 'cabinet', true),
    makePlatform(750, floorY - 180, 100, 20, 'cabinet'),
    makePlatform(200, floorY - 260, 100, 20, 'desk', true),
    makePlatform(450, floorY - 300, 120, 20, 'cabinet'),
  ];
  const collectibles = [
    makeCollectible(150, floorY - 140, 0),
    makeCollectible(390, floorY - 200, Math.PI / 3),
    makeCollectible(600, floorY - 140, Math.PI / 2),
    makeCollectible(780, floorY - 220, Math.PI),
    makeCollectible(230, floorY - 300, Math.PI * 1.5),
    makeCollectible(490, floorY - 340, Math.PI * 0.7),
  ];
  const exitX = CANVAS_WIDTH - 100;
  const exitY = floorY - 120;
  return {
    platforms,
    collectibles,
    exit: makeExit(exitX, exitY),
    playerStart: { x: 80, y: floorY - 80 },
    worldWidth: CANVAS_WIDTH,
    worldHeight: CANVAS_HEIGHT,
    exitPositions: [
      { x: exitX, y: exitY },
      { x: 50, y: floorY - 120 },
      { x: 400, y: floorY - 340 },
      { x: 700, y: floorY - 200 },
    ],
    floorIndex: 0,
    floorTheme: FLOOR_THEMES[0],
  };
}

function createMeetingLevel(): Level {
  const floorY = CANVAS_HEIGHT - 60;
  const platforms = [
    makePlatform(0, floorY, CANVAS_WIDTH, 60, 'floor'),
    makePlatform(80, floorY - 50, 800, 20, 'desk'),
    makePlatform(100, floorY - 150, 200, 20, 'desk'),
    makePlatform(400, floorY - 150, 200, 20, 'desk'),
    makePlatform(700, floorY - 150, 160, 20, 'desk'),
    makePlatform(200, floorY - 250, 180, 20, 'cabinet'),
    makePlatform(500, floorY - 250, 180, 20, 'cabinet'),
    makePlatform(350, floorY - 340, 250, 20, 'desk', true),
  ];
  const collectibles = [
    makeCollectible(180, floorY - 190, 0),
    makeCollectible(480, floorY - 190, Math.PI / 4),
    makeCollectible(760, floorY - 190, Math.PI / 2),
    makeCollectible(270, floorY - 290, Math.PI),
    makeCollectible(570, floorY - 290, Math.PI * 1.5),
    makeCollectible(460, floorY - 380, Math.PI * 0.5),
  ];
  const exitX = CANVAS_WIDTH - 100;
  const exitY = floorY - 90;
  return {
    platforms,
    collectibles,
    exit: makeExit(exitX, exitY),
    playerStart: { x: 80, y: floorY - 80 },
    worldWidth: CANVAS_WIDTH,
    worldHeight: CANVAS_HEIGHT,
    exitPositions: [
      { x: exitX, y: exitY },
      { x: 50, y: floorY - 180 },
      { x: 450, y: floorY - 370 },
    ],
    floorIndex: 1,
    floorTheme: FLOOR_THEMES[1],
  };
}

function createToiletLevel(): Level {
  const floorY = CANVAS_HEIGHT - 60;
  const platforms = [
    makePlatform(0, floorY, CANVAS_WIDTH, 60, 'floor'),
    makePlatform(50, floorY - 100, 120, 20, 'cabinet'),
    makePlatform(250, floorY - 80, 100, 20, 'desk', true),
    makePlatform(430, floorY - 140, 120, 20, 'cabinet'),
    makePlatform(620, floorY - 100, 120, 20, 'desk'),
    makePlatform(790, floorY - 170, 100, 20, 'cabinet', true),
    makePlatform(150, floorY - 200, 130, 20, 'desk'),
    makePlatform(380, floorY - 260, 150, 20, 'cabinet'),
    makePlatform(600, floorY - 260, 120, 20, 'desk', true),
    makePlatform(200, floorY - 340, 100, 20, 'cabinet'),
  ];
  const collectibles = [
    makeCollectible(100, floorY - 140, 0),
    makeCollectible(290, floorY - 120, Math.PI / 3),
    makeCollectible(475, floorY - 180, Math.PI / 2),
    makeCollectible(660, floorY - 140, Math.PI),
    makeCollectible(830, floorY - 210, Math.PI * 1.2),
    makeCollectible(200, floorY - 240, Math.PI * 1.5),
    makeCollectible(440, floorY - 300, Math.PI * 0.7),
  ];
  const exitX = CANVAS_WIDTH - 100;
  const exitY = floorY - 120;
  return {
    platforms,
    collectibles,
    exit: makeExit(exitX, exitY),
    playerStart: { x: 80, y: floorY - 80 },
    worldWidth: CANVAS_WIDTH,
    worldHeight: CANVAS_HEIGHT,
    exitPositions: [
      { x: exitX, y: exitY },
      { x: 50, y: floorY - 240 },
      { x: 500, y: floorY - 300 },
    ],
    floorIndex: 2,
    floorTheme: FLOOR_THEMES[2],
  };
}

function createPrinterLevel(): Level {
  const floorY = CANVAS_HEIGHT - 60;
  const platforms = [
    makePlatform(0, floorY, CANVAS_WIDTH, 60, 'floor'),
    makePlatform(100, floorY - 80, 160, 20, 'desk'),
    makePlatform(350, floorY - 130, 140, 20, 'desk', true),
    makePlatform(580, floorY - 90, 150, 20, 'desk'),
    makePlatform(780, floorY - 160, 120, 20, 'cabinet'),
    makePlatform(200, floorY - 210, 130, 20, 'cabinet', true),
    makePlatform(450, floorY - 240, 120, 20, 'desk'),
    makePlatform(650, floorY - 280, 130, 20, 'cabinet', true),
    makePlatform(300, floorY - 330, 140, 20, 'desk'),
  ];
  const collectibles = [
    makeCollectible(160, floorY - 120, 0),
    makeCollectible(400, floorY - 170, Math.PI / 3),
    makeCollectible(630, floorY - 130, Math.PI / 2),
    makeCollectible(820, floorY - 200, Math.PI),
    makeCollectible(250, floorY - 250, Math.PI * 1.3),
    makeCollectible(500, floorY - 280, Math.PI * 0.8),
    makeCollectible(700, floorY - 320, Math.PI * 1.5),
    makeCollectible(350, floorY - 370, Math.PI * 0.4),
  ];
  const exitX = CANVAS_WIDTH - 100;
  const exitY = floorY - 120;
  return {
    platforms,
    collectibles,
    exit: makeExit(exitX, exitY),
    playerStart: { x: 80, y: floorY - 80 },
    worldWidth: CANVAS_WIDTH,
    worldHeight: CANVAS_HEIGHT,
    exitPositions: [
      { x: exitX, y: exitY },
      { x: 50, y: floorY - 250 },
      { x: 400, y: floorY - 370 },
    ],
    floorIndex: 3,
    floorTheme: FLOOR_THEMES[3],
  };
}

function createTeaLevel(): Level {
  const floorY = CANVAS_HEIGHT - 60;
  const platforms = [
    makePlatform(0, floorY, CANVAS_WIDTH, 60, 'floor'),
    makePlatform(80, floorY - 90, 130, 20, 'cabinet', true),
    makePlatform(300, floorY - 140, 120, 20, 'desk'),
    makePlatform(500, floorY - 100, 140, 20, 'cabinet'),
    makePlatform(700, floorY - 180, 130, 20, 'desk', true),
    makePlatform(180, floorY - 220, 120, 20, 'cabinet'),
    makePlatform(420, floorY - 270, 140, 20, 'desk', true),
    makePlatform(620, floorY - 310, 120, 20, 'cabinet'),
    makePlatform(250, floorY - 360, 130, 20, 'desk'),
    makePlatform(500, floorY - 400, 120, 20, 'cabinet', true),
  ];
  const collectibles = [
    makeCollectible(130, floorY - 130, 0),
    makeCollectible(340, floorY - 180, Math.PI / 4),
    makeCollectible(550, floorY - 140, Math.PI / 2),
    makeCollectible(740, floorY - 220, Math.PI),
    makeCollectible(220, floorY - 260, Math.PI * 1.2),
    makeCollectible(470, floorY - 310, Math.PI * 0.6),
    makeCollectible(660, floorY - 350, Math.PI * 1.5),
    makeCollectible(300, floorY - 400, Math.PI * 0.3),
    makeCollectible(540, floorY - 440, Math.PI * 1.8),
  ];
  const exitX = CANVAS_WIDTH - 100;
  const exitY = floorY - 120;
  return {
    platforms,
    collectibles,
    exit: makeExit(exitX, exitY),
    playerStart: { x: 80, y: floorY - 80 },
    worldWidth: CANVAS_WIDTH,
    worldHeight: CANVAS_HEIGHT,
    exitPositions: [
      { x: exitX, y: exitY },
      { x: 50, y: floorY - 260 },
      { x: 400, y: floorY - 440 },
    ],
    floorIndex: 4,
    floorTheme: FLOOR_THEMES[4],
  };
}

const LEVEL_CREATORS = [
  createLobbyLevel,
  createMeetingLevel,
  createToiletLevel,
  createPrinterLevel,
  createTeaLevel,
];

export function createFloorLevel(floorIndex: number): Level {
  const idx = Math.min(floorIndex, LEVEL_CREATORS.length - 1);
  return LEVEL_CREATORS[idx]();
}

export function createLevel(): Level {
  return createFloorLevel(0);
}

export function createFloorTransition(fromFloor: number, toFloor: number): import('./types').FloorTransition {
  return {
    active: true,
    phase: 'elevator_close',
    timer: 0,
    fromFloor,
    toFloor,
    announcementAlpha: 0,
  };
}

const ELEVATOR_CLOSE_DURATION = 0.6;
const ELEVATOR_MOVE_DURATION = 1.0;
const ELEVATOR_OPEN_DURATION = 0.6;
const ANNOUNCE_DURATION = 1.8;

export function updateFloorTransition(
  transition: import('./types').FloorTransition,
  dt: number
): import('./types').FloorTransition {
  transition.timer += dt;

  switch (transition.phase) {
    case 'elevator_close':
      if (transition.timer >= ELEVATOR_CLOSE_DURATION) {
        transition.phase = 'moving';
        transition.timer = 0;
      }
      break;
    case 'moving':
      if (transition.timer >= ELEVATOR_MOVE_DURATION) {
        transition.phase = 'elevator_open';
        transition.timer = 0;
      }
      break;
    case 'elevator_open':
      if (transition.timer >= ELEVATOR_OPEN_DURATION) {
        transition.phase = 'announce';
        transition.timer = 0;
        transition.announcementAlpha = 0;
      }
      break;
    case 'announce':
      if (transition.timer < 0.5) {
        transition.announcementAlpha = transition.timer / 0.5;
      } else if (transition.timer > ANNOUNCE_DURATION - 0.5) {
        transition.announcementAlpha = Math.max(0, (ANNOUNCE_DURATION - transition.timer) / 0.5);
      } else {
        transition.announcementAlpha = 1;
      }
      if (transition.timer >= ANNOUNCE_DURATION) {
        transition.phase = 'done';
        transition.active = false;
        transition.announcementAlpha = 0;
      }
      break;
  }

  return transition;
}
