import type { GameConfig } from './types';

export const GAME_CONFIG: GameConfig = {
  gravity: 1800,
  moveSpeed: 280,
  jumpForce: 650,
  friction: 0.85,
};

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const COLORS = {
  bgTop: '#FFF8E7',
  bgBottom: '#FFE4C4',
  wall: '#F5E6D3',
  floor: '#D4A574',
  desk: '#5D4E37',
  deskTop: '#8B7355',
  cabinet: '#6B5B4F',
  chair: '#4A3728',
  paper: '#FFF8DC',
  paperEdge: '#D2B48C',
  door: '#8B4513',
  doorFrame: '#5D3A1A',
  playerSkin: '#FFDAB9',
  playerShirt: '#6B8E9F',
  playerPants: '#2F4F4F',
  playerHair: '#4A3728',
  outline: '#3D2B1F',
  text: '#3D2B1F',
  accent: '#FF6B6B',
};
