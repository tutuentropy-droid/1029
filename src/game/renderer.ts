import type { Player, Platform, Collectible, ExitDoor, Level, DreamRuleState, NPC, CameraState, CutsceneState } from './types';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './config';
import { getWalkPhase, getIdleBob, getWalkBob } from './Player';
import { isPlatformVisible } from './dreamRules';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private time: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  render(level: Level, player: Player, collectedCount: number, totalCount: number, time: number, dreamState: DreamRuleState | null, npcs: NPC[], camera: CameraState, cutscene: CutsceneState | null): void {
    this.time = time;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (dreamState && dreamState.rule.type === 'gravity_flip' && dreamState.gravityDir < 0) {
      ctx.save();
      ctx.translate(0, CANVAS_HEIGHT);
      ctx.scale(1, -1);
    }

    this.drawBackground();
    this.drawWallDecorations();

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
        this.drawPlatform(platform);
      }
    }

    this.drawExit(level.exit, collectedCount === totalCount, dreamState);

    for (const item of level.collectibles) {
      if (!item.collected) {
        this.drawCollectible(item, time);
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

  private drawBackground(): void {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, COLORS.bgTop);
    gradient.addColorStop(1, COLORS.bgBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = 'rgba(210, 180, 140, 0.3)';
    ctx.lineWidth = 1;
    for (let y = 0; y < CANVAS_HEIGHT; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y * 0.1) * 2);
      ctx.lineTo(CANVAS_WIDTH, y + Math.sin(y * 0.1 + 1) * 2);
      ctx.stroke();
    }
  }

  private drawWallDecorations(): void {
    const ctx = this.ctx;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 2;

    const frames = [
      { x: 80, y: 60, w: 80, h: 60 },
      { x: 420, y: 40, w: 100, h: 70 },
      { x: 720, y: 55, w: 70, h: 55 },
    ];

    for (const frame of frames) {
      ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
      ctx.strokeRect(frame.x, frame.y, frame.w, frame.h);

      ctx.strokeStyle = 'rgba(100, 149, 237, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(frame.x + frame.w / 2, frame.y);
      ctx.lineTo(frame.x + frame.w / 2, frame.y + frame.h);
      ctx.moveTo(frame.x, frame.y + frame.h / 2);
      ctx.lineTo(frame.x + frame.w, frame.y + frame.h / 2);
      ctx.stroke();

      ctx.strokeStyle = COLORS.outline;
      ctx.lineWidth = 2;
    }

    ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
    const cloudY = 90 + Math.sin(this.time * 0.5) * 3;
    this.drawCloud(300, cloudY, 40);
    this.drawCloud(600, cloudY + 20, 30);
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

  private drawPlatform(platform: Platform): void {
    const ctx = this.ctx;
    const { x, y, width, height, type } = platform;

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
    }
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
      this.drawJumpingPlayer(width, height);
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

    const eyeY = headY - 2;
    const eyeSpacing = headR * 0.45;
    const eyeSize = player.isBlinking ? 1 : 5;

    ctx.fillStyle = COLORS.outline;

    if (player.isBlinking) {
      ctx.fillRect(-eyeSpacing - 3, eyeY, 7, 2);
      ctx.fillRect(eyeSpacing - 4, eyeY, 7, 2);
    } else {
      const sleepyOffset = 1.5;

      ctx.beginPath();
      ctx.ellipse(-eyeSpacing, eyeY + sleepyOffset, 4, 5 - sleepyOffset, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(eyeSpacing, eyeY + sleepyOffset, 4, 5 - sleepyOffset, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(-eyeSpacing + 1.5, eyeY + sleepyOffset - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(eyeSpacing + 1.5, eyeY + sleepyOffset - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-eyeSpacing - 4, eyeY - 6);
    ctx.quadraticCurveTo(-eyeSpacing, eyeY - 7, -eyeSpacing + 4, eyeY - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeSpacing - 4, eyeY - 6);
    ctx.quadraticCurveTo(eyeSpacing, eyeY - 7, eyeSpacing + 4, eyeY - 6);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 182, 193, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-headR * 0.55, headY + 5, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headR * 0.55, headY + 5, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (player.state === 'idle') {
      ctx.arc(0, headY + 10, 3, 0, Math.PI);
    } else {
      ctx.arc(0, headY + 9, 4, 0.1, Math.PI - 0.1);
    }
    ctx.stroke();

    if (player.state === 'idle' && player.animTime % 4 > 3) {
      ctx.fillStyle = 'rgba(100, 149, 237, 0.6)';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Z', headR * 0.6, headY - headR - 5);
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('z', headR * 0.9, headY - headR + 3);
    }
  }

  private drawJumpingPlayer(width: number, height: number): void {
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

    ctx.fillStyle = COLORS.outline;
    const eyeY = headY - 2;
    const eyeSpacing = headR * 0.45;

    ctx.beginPath();
    ctx.arc(-eyeSpacing, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing, eyeY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-eyeSpacing + 1, eyeY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeSpacing + 1, eyeY - 1, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = COLORS.outline;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, headY + 10, 5, 0.1, Math.PI - 0.1);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 182, 193, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-headR * 0.55, headY + 4, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(headR * 0.55, headY + 4, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#87CEEB';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('!', -headR * 0.7, headY - headR - 5);
    ctx.fillText('!', headR * 0.5, headY - headR - 8);
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
