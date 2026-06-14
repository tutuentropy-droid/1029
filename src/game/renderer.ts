import type { Player, Platform, Collectible, ExitDoor, Level, DreamRuleState, NPC, CameraState, CutsceneState, WorldShiftState, PersonalityState, HiddenArea } from './types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './config';
import { getWalkPhase, getIdleBob, getWalkBob } from './Player';
import { isPlatformVisible } from './dreamRules';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private time: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(level: Level, player: Player, collectedCount: number, totalCount: number, time: number, dreamState: DreamRuleState | null, npcs: NPC[], camera: CameraState, cutscene: CutsceneState | null, worldShift: WorldShiftState | null, personality: PersonalityState | null, hiddenAreas: HiddenArea[]): void {
    this.time = time;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (dreamState && dreamState.rule.type === 'gravity_flip' && dreamState.gravityDir < 0) {
      ctx.save();
      ctx.translate(0, CANVAS_HEIGHT);
      ctx.scale(1, -1);
    }

    this.drawBackground(worldShift);
    this.drawWallDecorations(worldShift);

    ctx.save();
    this.applyCameraTransform(camera);

    for (const npc of npcs) {
      this.drawNPC(npc);
    }

    for (let i = 0; i < level.platforms.length; i++) {
      const platform = level.platforms[i];
      if (dreamState && !isPlatformVisible(dreamState, i, level)) {
        this.drawVanishingPlatform(platform);
      } else {
        this.drawPlatform(platform, worldShift);
      }
    }

    if (worldShift && worldShift.hiddenPlatformsVisible) {
      for (const platform of worldShift.extraPlatforms) {
        this.drawHiddenPlatform(platform, worldShift);
      }
    }

    this.drawExit(level.exit, collectedCount === totalCount, dreamState);

    for (const item of level.collectibles) {
      if (!item.collected) {
        this.drawCollectible(item, time);
      }
    }

    if (worldShift && worldShift.hiddenPlatformsVisible) {
      for (const item of worldShift.extraCollectibles) {
        if (!item.collected) {
          this.drawHiddenCollectible(item, time);
        }
      }
    }

    if (hiddenAreas && hiddenAreas.length > 0) {
      for (const area of hiddenAreas) {
        if (area.discovered) {
          this.drawDiscoveredArea(area);
        }
      }
    }

    this.drawPlayer(player);

    ctx.restore();

    if (dreamState && dreamState.rule.type === 'gravity_flip' && dreamState.gravityDir < 0) {
      ctx.restore();
    }

    if (dreamState) {
      this.drawDreamRuleOverlay(dreamState);
    }

    if (cutscene) {
      this.drawCutsceneMessage(cutscene);
    }
  }

  private applyCameraTransform(camera: CameraState): void {
    const ctx = this.ctx;
    ctx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.scale(camera.zoomLevel, camera.zoomLevel);
    ctx.translate(-CANVAS_WIDTH / 2 + camera.offsetX, -CANVAS_HEIGHT / 2 + camera.offsetY);
  }

  private drawBackground(worldShift: WorldShiftState | null): void {
    const ctx = this.ctx;
    const intensity = worldShift ? worldShift.dreamIntensity : 0.3;
    const colorShift = worldShift ? worldShift.colorShift : 0;

    const topColor = this.shiftColor(COLORS.bgTop, colorShift * 20, intensity * 0.3);
    const bottomColor = this.shiftColor(COLORS.bgBottom, colorShift * 15, intensity * 0.2);

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const waveAmplitude = 2 + intensity * 5;
    const waveSpeed = 0.1 + intensity * 0.1;
    ctx.strokeStyle = `rgba(210, 180, 140, ${0.2 + intensity * 0.2})`;
    ctx.lineWidth = 1;
    for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y * waveSpeed + this.time * 0.5) * waveAmplitude);
      ctx.lineTo(CANVAS_WIDTH, y + Math.sin(y * waveSpeed + 1 + this.time * 0.5) * waveAmplitude);
      ctx.stroke();
    }

    if (intensity > 0.5) {
      this.drawDreamParticles(intensity);
    }
  }

  private shiftColor(hex: string, shift: number, saturationBoost: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const hueShift = shift;
    const [h, s, l] = this.rgbToHsl(r, g, b);
    const newH = (h + hueShift / 360) % 1;
    const newS = Math.min(1, s + saturationBoost);
    const [nr, ng, nb] = this.hslToRgb(newH, newS, l);

    return `rgb(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)})`;
  }

  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [h, s, l];
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [r * 255, g * 255, b * 255];
  }

  private drawDreamParticles(intensity: number): void {
    const ctx = this.ctx;
    const count = Math.floor(intensity * 15);
    for (let i = 0; i < count; i++) {
      const x = (i * 73 + this.time * 20) % CANVAS_WIDTH;
      const y = (i * 47 + Math.sin(this.time + i) * 30) % CANVAS_HEIGHT;
      const size = 2 + (i % 3) * 1.5;
      const alpha = 0.2 + (Math.sin(this.time * 2 + i) * 0.5 + 0.5) * 0.3;

      ctx.fillStyle = `rgba(200, 180, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawWallDecorations(worldShift: WorldShiftState | null): void {
    const ctx = this.ctx;
    const intensity = worldShift ? worldShift.dreamIntensity : 0.3;

    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + intensity * 0.2})`;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;

    const frames = [
      { x: 80, y: 60, w: 80, h: 60 },
      { x: 420, y: 40, w: 100, h: 70 },
      { x: 720, y: 55, w: 70, h: 55 },
    ];

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const wobble = Math.sin(this.time * 0.8 + i) * intensity * 3;
      const fx = frame.x + wobble;
      const fy = frame.y + wobble * 0.5;

      ctx.fillRect(fx, fy, frame.w, frame.h);
      ctx.strokeRect(fx, fy, frame.w, frame.h);

      ctx.strokeStyle = 'rgba(100, 149, 237, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx + frame.w / 2, fy);
      ctx.lineTo(fx + frame.w / 2, fy + frame.h);
      ctx.moveTo(fx, fy + frame.h / 2);
      ctx.lineTo(fx + frame.w, fy + frame.h / 2);
      ctx.stroke();

      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 2;
    }

    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    const cloudY = 90 + Math.sin(this.time * 0.5) * 3;
    const cloudDrift = intensity * 20;
    this.drawCloud(300 + Math.sin(this.time * 0.2) * cloudDrift, cloudY, 40);
    this.drawCloud(600 + Math.cos(this.time * 0.15) * cloudDrift, cloudY + 20, 30);
  }

  private drawCloud(x: number, y: number, size: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size, y, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y + size * 0.1, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawPlatform(platform: Platform, worldShift: WorldShiftState | null): void {
    const ctx = this.ctx;
    const { x, y, width, height, type } = platform;
    const looseness = worldShift ? worldShift.platformLooseness : 0;

    ctx.save();
    if (looseness > 0) {
      ctx.globalAlpha = 1 - looseness * 0.15;
    }

    if (type === 'floor') {
      ctx.fillStyle = COLORS.floor;
      ctx.fillRect(x, y, width, height);

      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 0; i <= width; i += 20) {
        ctx.lineTo(x + i, y + Math.sin(i * 0.3) * 1.5);
      }
      ctx.stroke();

      ctx.strokeStyle = 'rgba(93, 43, 31, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 30; i < width; i += 60) {
        ctx.beginPath();
        ctx.moveTo(x + i, y + 10);
        ctx.lineTo(x + i + 10, y + height - 5);
        ctx.stroke();
      }
    } else if (type === 'desk') {
      ctx.fillStyle = COLORS.deskTop;
      ctx.fillRect(x, y, width, height);

      ctx.fillStyle = COLORS.desk;
      ctx.fillRect(x + 5, y + height, 8, 50);
      ctx.fillRect(x + width - 13, y + height, 8, 50);

      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
      ctx.strokeRect(x + 5, y + height, 8, 50);
      ctx.strokeRect(x + width - 13, y + height, 8, 50);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + 3, y + 2, width - 6, 4);

      ctx.fillStyle = '#FFE4B5';
      ctx.fillRect(x + width * 0.3, y - 20, 25, 18);
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + width * 0.3, y - 20, 25, 18);
      ctx.fillStyle = COLORS.outline;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('💼', x + width * 0.3 + 5, y - 6);
    } else if (type === 'cabinet') {
      ctx.fillStyle = COLORS.cabinet;
      ctx.fillRect(x, y, width, 150);

      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, 150);

      ctx.strokeStyle = 'rgba(93, 43, 31, 0.5)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const drawerY = y + 10 + i * 35;
        ctx.strokeRect(x + 5, drawerY, width - 10, 28);

        ctx.fillStyle = '#D4AF37';
        ctx.beginPath();
        ctx.arc(x + width / 2, drawerY + 14, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = COLORS.cabinet;
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    } else if (type === 'chair') {
      ctx.fillStyle = COLORS.chair;
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, width, height);
    }

    ctx.restore();
  }

  private drawHiddenPlatform(platform: Platform, worldShift: WorldShiftState): void {
    const ctx = this.ctx;
    const { x, y, width, height, type } = platform;

    ctx.save();
    const pulse = Math.sin(this.time * 3) * 0.2 + 0.6;
    ctx.globalAlpha = pulse;

    ctx.shadowColor = 'rgba(147, 112, 219, 0.8)';
    ctx.shadowBlur = 15;

    if (type === 'chair' || type === 'desk' || type === 'cabinet') {
      ctx.fillStyle = '#9370DB';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = '#4B0082';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, width, height);
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawHiddenCollectible(item: Collectible, time: number): void {
    const ctx = this.ctx;
    const floatY = Math.sin(time * 3 + item.floatOffset) * 5;
    const y = item.y + floatY;

    ctx.save();
    ctx.translate(item.x, y);
    ctx.rotate(item.rotation);

    const pulse = Math.sin(time * 4) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;

    ctx.shadowColor = 'rgba(186, 85, 211, 0.9)';
    ctx.shadowBlur = 20;

    ctx.fillStyle = '#DDA0DD';
    ctx.strokeStyle = '#8B008B';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-item.width / 2, -item.height / 2);
    ctx.lineTo(item.width / 2 - 5, -item.height / 2);
    ctx.lineTo(item.width / 2, -item.height / 2 + 5);
    ctx.lineTo(item.width / 2, item.height / 2);
    ctx.lineTo(-item.width / 2, item.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawDiscoveredArea(area: HiddenArea): void {
    const ctx = this.ctx;

    ctx.save();
    const pulse = Math.sin(this.time * 2) * 0.1 + 0.2;
    ctx.fillStyle = `rgba(147, 112, 219, ${pulse})`;
    ctx.fillRect(area.x, area.y, area.width, area.height);

    ctx.strokeStyle = 'rgba(186, 85, 211, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(area.x, area.y, area.width, area.height);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(147, 112, 219, 0.9)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ 发现区域 ✨', area.x + area.width / 2, area.y - 5);

    ctx.restore();
  }

  private drawCollectible(item: Collectible, time: number): void {
    const ctx = this.ctx;
    const floatY = Math.sin(time * 3 + item.floatOffset) * 5;
    const y = item.y + floatY;

    ctx.save();
    ctx.translate(item.x, y);
    ctx.rotate(item.rotation);

    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 15;

    ctx.fillStyle = COLORS.paper;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-item.width / 2, -item.height / 2);
    ctx.lineTo(item.width / 2 - 5, -item.height / 2);
    ctx.lineTo(item.width / 2, -item.height / 2 + 5);
    ctx.lineTo(item.width / 2, item.height / 2);
    ctx.lineTo(-item.width / 2, item.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLORS.paperEdge;
    ctx.beginPath();
    ctx.moveTo(item.width / 2 - 5, -item.height / 2);
    ctx.lineTo(item.width / 2 - 5, -item.height / 2 + 5);
    ctx.lineTo(item.width / 2, -item.height / 2 + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(93, 43, 31, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const lineY = -item.height / 2 + 8 + i * 7;
      ctx.beginPath();
      ctx.moveTo(-item.width / 2 + 4, lineY);
      ctx.lineTo(item.width / 2 - 6, lineY);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawExit(exit: ExitDoor, isActive: boolean, dreamState: DreamRuleState | null): void {
    const ctx = this.ctx;
    const { x, y, width, height } = exit;

    ctx.fillStyle = COLORS.doorFrame;
    ctx.fillRect(x - 5, y - 5, width + 10, height + 5);

    if (isActive) {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, '#90EE90');
      gradient.addColorStop(1, '#32CD32');
      ctx.fillStyle = gradient;

      ctx.shadowColor = 'rgba(50, 205, 50, 0.8)';
      ctx.shadowBlur = 20;
    } else {
      ctx.fillStyle = COLORS.door;
    }
    ctx.fillRect(x, y, width, height);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(x + width - 12, y + height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (isActive) {
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('出口', x + width / 2, y + height / 2 - 10);
      ctx.fillText('→', x + width / 2, y + height / 2 + 12);
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔒', x + width / 2, y + height / 2 + 5);
    }

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    if (isActive) {
      const bounce = Math.sin(this.time * 5) * 3;
      ctx.fillText('✨ 下班 ✨', x + width / 2, y - 15 + bounce);
    }
  }

  private drawPlayer(player: Player): void {
    const ctx = this.ctx;
    const { x, y, width, height, facing, state } = player;

    let bobY = 0;
    if (state === 'idle') {
      bobY = getIdleBob(player);
    } else if (state === 'walk') {
      bobY = getWalkBob(player);
    }

    ctx.save();
    ctx.translate(x + width / 2, y + height + bobY);
    if (facing === 'left') {
      ctx.scale(-1, 1);
    }

    const leanAngle = state === 'walk' ? Math.sin(getWalkPhase(player)) * 0.08 : 0;
    ctx.rotate(leanAngle);

    if (state === 'jump') {
      this.drawJumpingPlayer(player, width, height);
    } else {
      this.drawStandingPlayer(player, width, height);
    }

    ctx.restore();
  }

  private drawStandingPlayer(player: Player, width: number, height: number): void {
    const ctx = this.ctx;
    const walkPhase = getWalkPhase(player);
    const isWalking = player.state === 'walk';

    const bodyH = height * 0.45;
    const headR = width * 0.42;
    const headY = -height + headR + 5;
    const bodyY = -height + headR * 2 + 2;

    const legH = height * 0.35;
    const legW = width * 0.22;
    let leftLegAngle = 0;
    let rightLegAngle = 0;

    if (isWalking) {
      leftLegAngle = Math.sin(walkPhase) * 0.4;
      rightLegAngle = Math.sin(walkPhase + Math.PI) * 0.4;
    }

    ctx.save();
    ctx.translate(-width * 0.25, -legH);
    ctx.rotate(leftLegAngle);
    ctx.fillStyle = COLORS.playerPants;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.strokeRect(-legW / 2, 0, legW, legH);

    ctx.fillStyle = '#2F1810';
    ctx.fillRect(-legW / 2 - 2, legH - 6, legW + 4, 6);
    ctx.strokeRect(-legW / 2 - 2, legH - 6, legW + 4, 6);
    ctx.restore();

    ctx.save();
    ctx.translate(width * 0.25, -legH);
    ctx.rotate(rightLegAngle);
    ctx.fillStyle = COLORS.playerPants;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.strokeRect(-legW / 2, 0, legW, legH);

    ctx.fillStyle = '#2F1810';
    ctx.fillRect(-legW / 2 - 2, legH - 6, legW + 4, 6);
    ctx.strokeRect(-legW / 2 - 2, legH - 6, legW + 4, 6);
    ctx.restore();

    ctx.fillStyle = COLORS.playerShirt;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(-width / 2 + 2, bodyY);
    ctx.lineTo(width / 2 - 2, bodyY);
    ctx.lineTo(width / 2 - 4, bodyY + bodyH);
    ctx.lineTo(-width / 2 + 4, bodyY + bodyH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const armW = width * 0.18;
    const armH = bodyH * 0.7;
    let leftArmAngle = 0;
    let rightArmAngle = 0;

    if (isWalking) {
      leftArmAngle = Math.sin(walkPhase + Math.PI) * 0.35;
      rightArmAngle = Math.sin(walkPhase) * 0.35;
    } else {
      leftArmAngle = -0.15;
      rightArmAngle = 0.15;
    }

    ctx.save();
    ctx.translate(-width / 2 + 3, bodyY + 5);
    ctx.rotate(leftArmAngle);
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(-armW / 2, 0, armW, armH);
    ctx.strokeRect(-armW / 2, 0, armW, armH);

    ctx.fillStyle = COLORS.playerSkin;
    ctx.beginPath();
    ctx.arc(0, armH + 3, armW * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(width / 2 - 3, bodyY + 5);
    ctx.rotate(rightArmAngle);
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(-armW / 2, 0, armW, armH);
    ctx.strokeRect(-armW / 2, 0, armW, armH);

    ctx.fillStyle = COLORS.playerSkin;
    ctx.beginPath();
    ctx.arc(0, armH + 3, armW * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = COLORS.playerSkin;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = COLORS.playerHair;
    ctx.beginPath();
    ctx.arc(0, headY - headR * 0.2, headR, Math.PI, 0);
    ctx.lineTo(headR * 0.9, headY - headR * 0.1);
    ctx.quadraticCurveTo(headR * 0.7, headY - headR * 0.5, headR * 0.3, headY - headR * 0.3);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-headR * 0.6, headY - headR * 0.3);
    ctx.quadraticCurveTo(-headR * 0.8, headY - headR * 0.1, -headR * 0.7, headY + headR * 0.1);
    ctx.lineTo(-headR * 0.5, headY);
    ctx.closePath();
    ctx.fill();

    this.drawFace(player, headY, headR);

    if (player.mood === 'tired' && player.state === 'idle') {
      const zBob = Math.sin(this.time * 3) * 2;
      ctx.fillStyle = 'rgba(100, 149, 237, 0.7)';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Z', headR * 0.6, headY - headR - 5 + zBob);
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('z', headR * 0.9, headY - headR + 3 + zBob * 0.5);
    }

    if (player.mood === 'happy') {
      const sparkleY = headY - headR - 8 + Math.sin(this.time * 5) * 2;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('✨', -headR * 0.7, sparkleY);
      ctx.fillText('✨', headR * 0.3, sparkleY - 3);
    }

    if (player.mood === 'surprised') {
      const exclaimBob = Math.sin(this.time * 8) * 3;
      ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('!', -headR * 0.3, headY - headR - 8 + exclaimBob);
      ctx.fillText('!', headR * 0.1, headY - headR - 10 + exclaimBob * 0.8);
    }

    if (player.mood === 'curious') {
      const questionBob = Math.sin(this.time * 4) * 2;
      ctx.fillStyle = 'rgba(100, 149, 237, 0.8)';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('?', headR * 0.5, headY - headR - 5 + questionBob);
    }
  }

  private drawFace(player: Player, headY: number, headR: number): void {
    const ctx = this.ctx;
    const mood = player.mood;
    const eyeY = headY - 2;
    const eyeSpacing = headR * 0.45;

    ctx.fillStyle = COLORS.outline;

    if (player.isBlinking) {
      ctx.fillRect(-eyeSpacing - 3, eyeY, 7, 2);
      ctx.fillRect(eyeSpacing - 4, eyeY, 7, 2);
    } else {
      this.drawEyes(mood, eyeY, eyeSpacing);
    }

    this.drawEyebrows(mood, eyeY, eyeSpacing);
    this.drawBlush(mood, headY, headR);
    this.drawMouth(mood, headY);
  }

  private drawEyes(mood: string, eyeY: number, eyeSpacing: number): void {
    const ctx = this.ctx;

    let eyeWidth = 4;
    let eyeHeight = 5;
    let eyeOffsetY = 0;

    switch (mood) {
      case 'happy':
        eyeWidth = 5;
        eyeHeight = 3;
        eyeOffsetY = 1;
        break;
      case 'surprised':
        eyeWidth = 5;
        eyeHeight = 6;
        eyeOffsetY = -1;
        break;
      case 'tired':
        eyeWidth = 4;
        eyeHeight = 3;
        eyeOffsetY = 1.5;
        break;
      case 'focused':
        eyeWidth = 3.5;
        eyeHeight = 4.5;
        break;
      case 'curious':
        eyeWidth = 4.5;
        eyeHeight = 5;
        break;
      default:
        eyeOffsetY = 1.5;
    }

    ctx.fillStyle = COLORS.outline;
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing, eyeY + eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(eyeSpacing, eyeY + eyeOffsetY, eyeWidth, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    if (mood !== 'tired') {
      ctx.fillStyle = 'white';
      const highlightOffsetX = mood === 'surprised' ? 0 : 1.5;
      const highlightOffsetY = mood === 'surprised' ? -1.5 : -1;
      ctx.beginPath();
      ctx.arc(-eyeSpacing + highlightOffsetX, eyeY + eyeOffsetY + highlightOffsetY, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeSpacing + highlightOffsetX, eyeY + eyeOffsetY + highlightOffsetY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawEyebrows(mood: string, eyeY: number, eyeSpacing: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;

    let leftBrowAngle = 0;
    let rightBrowAngle = 0;
    let browY = eyeY - 6;

    switch (mood) {
      case 'happy':
        leftBrowAngle = 0.1;
        rightBrowAngle = -0.1;
        browY = eyeY - 7;
        break;
      case 'surprised':
        leftBrowAngle = -0.3;
        rightBrowAngle = 0.3;
        browY = eyeY - 9;
        break;
      case 'tired':
        leftBrowAngle = 0.2;
        rightBrowAngle = -0.2;
        browY = eyeY - 4;
        break;
      case 'focused':
        leftBrowAngle = 0.15;
        rightBrowAngle = -0.15;
        browY = eyeY - 7;
        break;
      case 'curious':
        leftBrowAngle = -0.2;
        rightBrowAngle = 0;
        browY = eyeY - 8;
        break;
      default:
        break;
    }

    ctx.save();
    ctx.translate(-eyeSpacing, browY);
    ctx.rotate(leftBrowAngle);
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(0, -1, 4, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(eyeSpacing, browY);
    ctx.rotate(rightBrowAngle);
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(0, -1, 4, 0);
    ctx.stroke();
    ctx.restore();
  }

  private drawBlush(mood: string, headY: number, headR: number): void {
    const ctx = this.ctx;
    let alpha = 0.5;

    switch (mood) {
      case 'happy':
        alpha = 0.7;
        break;
      case 'surprised':
        alpha = 0.8;
        break;
      case 'tired':
        alpha = 0.3;
        break;
      default:
        alpha = 0.5;
    }

    ctx.fillStyle = `rgba(255, 182, 193, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(-headR * 0.55, headY + 5, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headR * 0.55, headY + 5, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMouth(mood: string, headY: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;

    ctx.beginPath();

    switch (mood) {
      case 'happy':
        ctx.arc(0, headY + 8, 5, 0.1, Math.PI - 0.1);
        break;
      case 'surprised':
        ctx.ellipse(0, headY + 11, 3, 4, 0, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.outline;
        ctx.fill();
        return;
      case 'tired':
        ctx.moveTo(-4, headY + 11);
        ctx.quadraticCurveTo(0, headY + 9, 4, headY + 11);
        break;
      case 'focused':
        ctx.moveTo(-3, headY + 10);
        ctx.lineTo(3, headY + 10);
        break;
      case 'curious':
        ctx.moveTo(-3, headY + 10);
        ctx.quadraticCurveTo(0, headY + 12, 3, headY + 9);
        break;
      default:
        ctx.arc(0, headY + 10, 3, 0, Math.PI);
    }

    ctx.stroke();
  }

  private drawJumpingPlayer(player: Player, width: number, height: number): void {
    const ctx = this.ctx;

    const bodyH = height * 0.45;
    const headR = width * 0.42;
    const headY = -height + headR + 5;
    const bodyY = -height + headR * 2 + 2;

    const legH = height * 0.3;
    const legW = width * 0.22;

    ctx.save();
    ctx.translate(-width * 0.2, -legH - 5);
    ctx.rotate(-0.5);
    ctx.fillStyle = COLORS.playerPants;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.strokeRect(-legW / 2, 0, legW, legH);
    ctx.restore();

    ctx.save();
    ctx.translate(width * 0.2, -legH - 5);
    ctx.rotate(0.5);
    ctx.fillStyle = COLORS.playerPants;
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.strokeRect(-legW / 2, 0, legW, legH);
    ctx.restore();

    ctx.fillStyle = COLORS.playerShirt;
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-width / 2 + 2, bodyY);
    ctx.lineTo(width / 2 - 2, bodyY);
    ctx.lineTo(width / 2 - 4, bodyY + bodyH);
    ctx.lineTo(-width / 2 + 4, bodyY + bodyH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const armW = width * 0.18;
    const armH = bodyH * 0.7;

    ctx.save();
    ctx.translate(-width / 2 + 2, bodyY + 3);
    ctx.rotate(-0.8);
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(-armW / 2, 0, armW, armH);
    ctx.strokeRect(-armW / 2, 0, armW, armH);
    ctx.fillStyle = COLORS.playerSkin;
    ctx.beginPath();
    ctx.arc(0, armH + 3, armW * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(width / 2 - 2, bodyY + 3);
    ctx.rotate(0.8);
    ctx.fillStyle = COLORS.playerShirt;
    ctx.fillRect(-armW / 2, 0, armW, armH);
    ctx.strokeRect(-armW / 2, 0, armW, armH);
    ctx.fillStyle = COLORS.playerSkin;
    ctx.beginPath();
    ctx.arc(0, armH + 3, armW * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = COLORS.playerSkin;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = COLORS.playerHair;
    ctx.beginPath();
    ctx.arc(0, headY - headR * 0.2, headR, Math.PI, 0);
    ctx.fill();

    this.drawFace(player, headY, headR);

    if (player.mood === 'surprised' || player.mood === 'curious') {
      const exclaimBob = Math.sin(this.time * 8) * 3;
      ctx.fillStyle = 'rgba(135, 206, 235, 0.9)';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('!', -headR * 0.7, headY - headR - 5 + exclaimBob);
      ctx.fillText('!', headR * 0.5, headY - headR - 8 + exclaimBob * 0.8);
    }
  }

  private drawVanishingPlatform(platform: Platform): void {
    const ctx = this.ctx;
    const { x, y, width, height } = platform;

    ctx.save();
    ctx.globalAlpha = 0.2 + Math.sin(this.time * 4) * 0.1;

    ctx.strokeStyle = 'rgba(255, 100, 100, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(255, 100, 100, 0.1)';
    ctx.fillRect(x, y, width, height);

    ctx.restore();
  }

  private drawDreamRuleOverlay(state: DreamRuleState): void {
    const ctx = this.ctx;

    switch (state.rule.type) {
      case 'gravity_flip':
        this.drawGravityFlipOverlay(state);
        break;
      case 'door_wander':
        this.drawDoorWanderOverlay(state);
        break;
      case 'moving_floor':
        this.drawMovingFloorOverlay(state);
        break;
      case 'vanishing_platforms':
        break;
    }
  }

  private drawGravityFlipOverlay(state: DreamRuleState): void {
    const ctx = this.ctx;

    if (state.flipWarning) {
      const flash = Math.sin(this.time * 12) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(147, 51, 234, ${flash * 0.15})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.fillStyle = `rgba(147, 51, 234, ${0.6 + flash * 0.4})`;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const arrowY = state.gravityDir > 0 ? 50 : CANVAS_HEIGHT - 50;
      const arrow = state.gravityDir > 0 ? '⬆ 重力即将反转！ ⬆' : '⬇ 重力即将反转！ ⬇';
      ctx.fillText(arrow, CANVAS_WIDTH / 2, arrowY);
      ctx.restore();
    }

    if (state.gravityDir < 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(147, 51, 234, 0.8)';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔄 重力反转中', CANVAS_WIDTH / 2, 25);
      ctx.restore();
    }
  }

  private drawDoorWanderOverlay(state: DreamRuleState): void {
    const ctx = this.ctx;
    const timeLeft = 6 - state.doorWanderTimer;
    if (timeLeft < 2) {
      const flash = Math.sin(this.time * 8) * 0.5 + 0.5;
      ctx.save();
      ctx.fillStyle = `rgba(255, 165, 0, ${flash * 0.15})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.restore();
    }
  }

  private drawMovingFloorOverlay(_state: DreamRuleState): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(139, 69, 19, 0.6)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🌊 地板在移动...', CANVAS_WIDTH - 15, 25);
    ctx.restore();
  }

  private drawCutsceneMessage(cutscene: CutsceneState): void {
    if (!cutscene.messageText || cutscene.messageAlpha <= 0) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = cutscene.messageAlpha;

    const msgY = CANVAS_HEIGHT - 80;
    const padding = 20;
    ctx.font = 'bold 18px "Comic Sans MS", cursive, sans-serif';
    ctx.textAlign = 'center';
    const textWidth = ctx.measureText(cutscene.messageText).width;

    ctx.fillStyle = 'rgba(30, 10, 60, 0.75)';
    const rx = CANVAS_WIDTH / 2 - textWidth / 2 - padding;
    const ry = msgY - 16;
    const rw = textWidth + padding * 2;
    const rh = 40;
    ctx.beginPath();
    ctx.moveTo(rx + 8, ry);
    ctx.lineTo(rx + rw - 8, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + 8);
    ctx.lineTo(rx + rw, ry + rh - 8);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - 8, ry + rh);
    ctx.lineTo(rx + 8, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - 8);
    ctx.lineTo(rx, ry + 8);
    ctx.quadraticCurveTo(rx, ry, rx + 8, ry);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(200, 150, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#E8D5FF';
    ctx.fillText(cutscene.messageText, CANVAS_WIDTH / 2, msgY + 6);

    ctx.restore();
  }

  private drawNPC(npc: NPC): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.7;

    switch (npc.behavior) {
      case 'printer_fish':
        this.drawPrinterFishNPC(npc);
        break;
      case 'ceiling_meeting':
        this.drawCeilingMeetingNPC(npc);
        break;
      case 'backwards_boss':
        this.drawBackwardsBossNPC(npc);
        break;
      case 'floating_coffee':
        this.drawFloatingCoffeeNPC(npc);
        break;
      case 'typewriter_birds':
        this.drawTypewriterBirdsNPC(npc);
        break;
    }

    ctx.restore();
  }

  private drawPrinterFishNPC(npc: NPC): void {
    const ctx = this.ctx;
    const px = npc.x;
    const py = npc.y;

    ctx.fillStyle = '#7A7A7A';
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;
    ctx.fillRect(px - 15, py - 25, 30, 20);
    ctx.strokeRect(px - 15, py - 25, 30, 20);

    ctx.fillStyle = '#999';
    ctx.fillRect(px - 12, py - 5, 24, 8);
    ctx.strokeRect(px - 12, py - 5, 24, 8);

    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(px - 10, py - 22, 20, 3);

    ctx.fillStyle = '#E0E0E0';
    const paperWiggle = Math.sin(this.time * 6) * 2;
    ctx.fillRect(px - 8 + paperWiggle, py - 38, 16, 14);
    ctx.strokeRect(px - 8 + paperWiggle, py - 38, 16, 14);

    ctx.strokeStyle = 'rgba(100,100,100,0.5)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(px - 6 + paperWiggle, py - 34 + i * 4);
      ctx.lineTo(px + 4 + paperWiggle, py - 34 + i * 4);
      ctx.stroke();
    }

    for (const fish of npc.fishes) {
      this.drawFish(fish.x, fish.y, fish.rotation, fish.life);
    }
  }

  private drawFish(x: number, y: number, rotation: number, life: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = Math.min(1, life);

    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(13, -5);
    ctx.lineTo(13, 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#039BE5';
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-3, -1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(-2.5, -1, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawCeilingMeetingNPC(npc: NPC): void {
    const ctx = this.ctx;
    const cx = npc.x;
    const cy = npc.y;
    const bob = Math.sin(npc.meetingBobPhase) * 3;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, -1);

    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 30;
      const personBob = Math.sin(npc.meetingBobPhase + i * 1.2) * 2;

      ctx.save();
      ctx.translate(ox, personBob + bob);

      ctx.fillStyle = '#5D4E37';
      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 1;

      ctx.fillRect(-6, 0, 12, 14);
      ctx.strokeRect(-6, 0, 12, 14);

      ctx.fillStyle = COLORS.playerSkin;
      ctx.beginPath();
      ctx.arc(0, -4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(0, -6, 5, Math.PI, 0);
      ctx.fill();

      ctx.save();
      ctx.translate(-7, 2);
      ctx.rotate(-0.3 + Math.sin(npc.animTime * 2 + i) * 0.2);
      ctx.fillStyle = '#5D4E37';
      ctx.fillRect(-2, 0, 4, 10);
      ctx.restore();

      ctx.save();
      ctx.translate(7, 2);
      ctx.rotate(0.3 + Math.sin(npc.animTime * 2 + i + 1) * 0.2);
      ctx.fillStyle = '#5D4E37';
      ctx.fillRect(-2, 0, 4, 10);
      ctx.restore();

      ctx.fillStyle = COLORS.outline;
      ctx.beginPath();
      ctx.arc(-2, -4, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(2, -4, 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;
    ctx.fillRect(-22, 18, 44, 5);
    ctx.strokeRect(-22, 18, 44, 5);

    const speechBob = Math.sin(npc.animTime * 3) * 1;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💬', 0, -20 + speechBob);

    ctx.restore();
  }

  private drawBackwardsBossNPC(npc: NPC): void {
    const ctx = this.ctx;
    const bx = npc.x;
    const by = npc.y;
    const walkPhase = (npc.animTime * 5) % (Math.PI * 2);

    ctx.save();
    ctx.translate(bx, by);

    const facingDir = npc.facing === 'left' ? 1 : -1;
    ctx.scale(facingDir, 1);

    const bodyH = 18;
    const headR = 7;
    const headY = -bodyH - headR - 2;

    const legH = 10;
    const legW = 4;
    const leftLegAngle = Math.sin(walkPhase) * 0.4;
    const rightLegAngle = Math.sin(walkPhase + Math.PI) * 0.4;

    ctx.save();
    ctx.translate(-3, 0);
    ctx.rotate(leftLegAngle);
    ctx.fillStyle = '#1A1A1A';
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1;
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.strokeRect(-legW / 2, 0, legW, legH);
    ctx.restore();

    ctx.save();
    ctx.translate(3, 0);
    ctx.rotate(rightLegAngle);
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(-legW / 2, 0, legW, legH);
    ctx.strokeRect(-legW / 2, 0, legW, legH);
    ctx.restore();

    ctx.fillStyle = '#2C2C2C';
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-8, -bodyH);
    ctx.lineTo(8, -bodyH);
    ctx.lineTo(7, 0);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-4, -bodyH + 2, 8, 2);

    ctx.save();
    ctx.translate(-8, -bodyH + 3);
    ctx.rotate(Math.sin(walkPhase + Math.PI) * 0.3);
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(-2, 0, 4, 8);
    ctx.restore();

    ctx.save();
    ctx.translate(8, -bodyH + 3);
    ctx.rotate(Math.sin(walkPhase) * 0.3);
    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(-2, 0, 4, 8);
    ctx.restore();

    ctx.fillStyle = COLORS.playerSkin;
    ctx.beginPath();
    ctx.arc(0, headY, headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.ellipse(0, headY - headR + 1, headR + 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = COLORS.outline;
    const eyeY = headY - 1;
    ctx.fillRect(-4, eyeY - 1, 2, 2);
    ctx.fillRect(2, eyeY - 1, 2, 2);

    ctx.strokeStyle = '#888';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-5, eyeY - 3);
    ctx.lineTo(-2, eyeY - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, eyeY - 3);
    ctx.lineTo(2, eyeY - 2);
    ctx.stroke();

    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, headY + 4, 2, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,215,0,0.6)';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑', 0, headY - headR - 6);

    ctx.restore();
  }

  private drawFloatingCoffeeNPC(npc: NPC): void {
    const ctx = this.ctx;
    const cx = npc.x;
    const cy = npc.y;
    const floatPhase = Math.sin(npc.animTime * 2) * 3;

    ctx.save();
    ctx.translate(cx, cy + floatPhase);

    ctx.fillStyle = '#FFF8DC';
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(-7, -6);
    ctx.lineTo(-5, 8);
    ctx.lineTo(5, 8);
    ctx.lineTo(7, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(10, 0, 4, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();

    ctx.fillStyle = '#6F4E37';
    ctx.beginPath();
    ctx.ellipse(0, -6, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const steamOffset = Math.sin(npc.animTime * 4) * 3;
    ctx.strokeStyle = 'rgba(200,200,200,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const sx = (i - 1) * 4;
      const sy = -10 - i * 4 + steamOffset;
      ctx.beginPath();
      ctx.moveTo(sx, -8);
      ctx.quadraticCurveTo(sx + 2, sy + 2, sx - 1, sy);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,215,0,0.4)';
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const sparkleAngle = npc.animTime * 2 + i * Math.PI / 2;
      const sparkleR = 14;
      const sparkX = Math.cos(sparkleAngle) * sparkleR;
      const sparkY = Math.sin(sparkleAngle) * sparkleR - 4;
      ctx.moveTo(sparkX + 2, sparkY);
      ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.restore();
  }

  private drawTypewriterBirdsNPC(npc: NPC): void {
    const ctx = this.ctx;
    const tx = npc.x;
    const ty = npc.y;

    ctx.fillStyle = '#4A3728';
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;

    ctx.fillRect(tx - 18, ty - 18, 36, 16);
    ctx.strokeRect(tx - 18, ty - 18, 36, 16);

    ctx.fillStyle = '#2A1A08';
    ctx.fillRect(tx - 15, ty - 4, 30, 4);

    ctx.fillStyle = '#333';
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 8; c++) {
        const keyX = tx - 13 + c * 3.5;
        const keyY = ty - 15 + r * 5;
        const press = (Math.sin(this.time * 8 + c * 0.5 + r * 3) > 0.7) ? 1 : 0;
        ctx.fillRect(keyX, keyY + press, 3, 3);
      }
    }

    ctx.fillStyle = '#5D3A1A';
    ctx.fillRect(tx - 5, ty - 2, 10, 10);
    ctx.strokeRect(tx - 5, ty - 2, 10, 10);

    const paperUp = Math.sin(this.time * 3) * 1;
    ctx.fillStyle = '#FFF8DC';
    ctx.fillRect(tx - 4, ty - 24 + paperUp, 8, 22);
    ctx.strokeStyle = 'rgba(100,100,100,0.3)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(tx - 4, ty - 24 + paperUp, 8, 22);

    for (const bird of npc.birds) {
      this.drawBird(bird.x, bird.y, bird.rotation, bird.life);
    }
  }

  private drawBird(x: number, y: number, rotation: number, life: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = Math.min(1, life) * 0.7;

    const flapPhase = Math.sin(this.time * 12 + life * 5) * 0.4;

    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.ellipse(0, 0, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(0, -2);
    ctx.rotate(flapPhase);
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.ellipse(-2, -3, 6, 2, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(0, -2);
    ctx.rotate(-flapPhase);
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.ellipse(2, -3, 6, 2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#FF8F00';
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(-8, -1);
    ctx.lineTo(-8, 1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-2, -1, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1A1A1A';
    ctx.beginPath();
    ctx.arc(-2, -1, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
