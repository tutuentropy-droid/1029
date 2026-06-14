import type { NPC, NPCBehavior, NPCFish, CameraState, CutsceneMoment, CutsceneState } from './types';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './config';

export function createNPC(x: number, y: number, behavior: NPCBehavior): NPC {
  return {
    x,
    y,
    behavior,
    animTime: Math.random() * 10,
    facing: Math.random() > 0.5 ? 'left' : 'right',
    fishes: [],
    fishSpawnTimer: Math.random() * 2,
    birds: [],
    birdSpawnTimer: Math.random() * 3,
    walkTimer: 0,
    meetingBobPhase: Math.random() * Math.PI * 2,
  };
}

export function createNPCs(): NPC[] {
  const floorY = CANVAS_HEIGHT - 60;

  return [
    createNPC(300, floorY - 20, 'printer_fish'),
    createNPC(680, 35, 'ceiling_meeting'),
    createNPC(100, floorY - 20, 'backwards_boss'),
    createNPC(820, floorY - 40, 'floating_coffee'),
    createNPC(550, floorY - 20, 'typewriter_birds'),
  ];
}

export function updateNPC(npc: NPC, dt: number): void {
  npc.animTime += dt;

  switch (npc.behavior) {
    case 'printer_fish':
      updatePrinterFish(npc, dt);
      break;
    case 'ceiling_meeting':
      updateCeilingMeeting(npc, dt);
      break;
    case 'backwards_boss':
      updateBackwardsBoss(npc, dt);
      break;
    case 'floating_coffee':
      updateFloatingCoffee(npc, dt);
      break;
    case 'typewriter_birds':
      updateTypewriterBirds(npc, dt);
      break;
  }
}

function updatePrinterFish(npc: NPC, dt: number): void {
  npc.fishSpawnTimer -= dt;
  if (npc.fishSpawnTimer <= 0) {
    npc.fishSpawnTimer = 2 + Math.random() * 3;
    const fish: NPCFish = {
      x: npc.x + 20,
      y: npc.y - 10,
      vx: 40 + Math.random() * 60,
      vy: -30 - Math.random() * 40,
      rotation: 0,
      life: 3 + Math.random() * 2,
    };
    npc.fishes.push(fish);
  }

  for (let i = npc.fishes.length - 1; i >= 0; i--) {
    const fish = npc.fishes[i];
    fish.x += fish.vx * dt;
    fish.vy += 120 * dt;
    fish.y += fish.vy * dt;
    fish.rotation += dt * 3;
    fish.life -= dt;
    if (fish.life <= 0) {
      npc.fishes.splice(i, 1);
    }
  }
}

function updateCeilingMeeting(npc: NPC, dt: number): void {
  npc.meetingBobPhase += dt * 1.5;
}

function updateBackwardsBoss(npc: NPC, dt: number): void {
  npc.walkTimer += dt;
  const speed = 30;
  const direction = npc.facing === 'left' ? 1 : -1;
  npc.x += direction * speed * dt;

  if (npc.x > CANVAS_WIDTH - 40) {
    npc.facing = 'right';
  } else if (npc.x < 20) {
    npc.facing = 'left';
  }
}

function updateFloatingCoffee(npc: NPC, dt: number): void {
  npc.y += Math.sin(npc.animTime * 2) * 0.5;
  npc.x += Math.sin(npc.animTime * 0.7) * 0.3;
}

function updateTypewriterBirds(npc: NPC, dt: number): void {
  npc.birdSpawnTimer -= dt;
  if (npc.birdSpawnTimer <= 0) {
    npc.birdSpawnTimer = 3 + Math.random() * 4;
    const bird: NPCFish = {
      x: npc.x + 15,
      y: npc.y - 25,
      vx: -20 + Math.random() * 40,
      vy: -50 - Math.random() * 30,
      rotation: 0,
      life: 4 + Math.random() * 2,
    };
    npc.birds.push(bird);
  }

  for (let i = npc.birds.length - 1; i >= 0; i--) {
    const bird = npc.birds[i];
    bird.x += bird.vx * dt;
    bird.vy += 20 * dt;
    bird.y += bird.vy * dt;
    bird.vx += Math.sin(bird.life * 5) * 100 * dt;
    bird.rotation = Math.sin(bird.life * 8) * 0.3;
    bird.life -= dt;
    if (bird.life <= 0) {
      npc.birds.splice(i, 1);
    }
  }
}

export function createCamera(): CameraState {
  return {
    offsetX: 0,
    offsetY: 0,
    shakeIntensity: 0,
    shakeTimer: 0,
    panTargetX: 0,
    panTargetY: 0,
    panSpeed: 2,
    isPanning: false,
    zoomLevel: 1,
    zoomTarget: 1,
    zoomSpeed: 1.5,
    isZooming: false,
  };
}

export function updateCamera(camera: CameraState, dt: number): void {
  if (camera.shakeTimer > 0) {
    camera.shakeTimer -= dt;
    const intensity = camera.shakeIntensity * (camera.shakeTimer / 0.5);
    camera.offsetX = (Math.random() - 0.5) * intensity * 2;
    camera.offsetY = (Math.random() - 0.5) * intensity * 2;
    if (camera.shakeTimer <= 0) {
      camera.offsetX = 0;
      camera.offsetY = 0;
      camera.shakeIntensity = 0;
    }
  }

  if (camera.isPanning) {
    const dx = camera.panTargetX - camera.offsetX;
    const dy = camera.panTargetY - camera.offsetY;
    const speed = camera.panSpeed * dt;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      camera.offsetX = camera.panTargetX;
      camera.offsetY = camera.panTargetY;
      camera.isPanning = false;
    } else {
      camera.offsetX += dx * speed;
      camera.offsetY += dy * speed;
    }
  }

  if (camera.isZooming) {
    const dz = camera.zoomTarget - camera.zoomLevel;
    const speed = camera.zoomSpeed * dt;
    if (Math.abs(dz) < 0.01) {
      camera.zoomLevel = camera.zoomTarget;
      camera.isZooming = false;
    } else {
      camera.zoomLevel += dz * speed;
    }
  }
}

export function triggerCameraShake(camera: CameraState, intensity: number): void {
  camera.shakeIntensity = intensity;
  camera.shakeTimer = 0.5;
}

export function triggerCameraPan(camera: CameraState, tx: number, ty: number, speed: number): void {
  camera.panTargetX = tx;
  camera.panTargetY = ty;
  camera.panSpeed = speed;
  camera.isPanning = true;
}

export function triggerCameraZoom(camera: CameraState, target: number, speed: number): void {
  camera.zoomTarget = target;
  camera.zoomSpeed = speed;
  camera.isZooming = true;
}

export function resetCamera(camera: CameraState): void {
  camera.isPanning = false;
  camera.isZooming = false;
  camera.panTargetX = 0;
  camera.panTargetY = 0;
  camera.zoomTarget = 1;
  camera.zoomLevel = 1;
  camera.offsetX = 0;
  camera.offsetY = 0;
  camera.shakeTimer = 0;
}

export function createCutsceneMoments(): CutsceneMoment[] {
  return [
    {
      id: 'printer_intro',
      triggerTime: 5,
      duration: 3,
      panTo: { x: 80, y: 0 },
      zoomTo: 1.1,
      shakeIntensity: 0,
      message: '打印机今天吐的是鱼...',
      messageDuration: 2.5,
      triggered: false,
      finished: false,
    },
    {
      id: 'ceiling_meeting',
      triggerTime: 15,
      duration: 3.5,
      panTo: { x: -60, y: 50 },
      zoomTo: 1.15,
      shakeIntensity: 0,
      message: '今天的会议在天花板上',
      messageDuration: 2.5,
      triggered: false,
      finished: false,
    },
    {
      id: 'boss_backwards',
      triggerTime: 25,
      duration: 3,
      panTo: { x: -50, y: 0 },
      zoomTo: 1.1,
      shakeIntensity: 2,
      message: '老板只会倒着走',
      messageDuration: 2.5,
      triggered: false,
      finished: false,
    },
    {
      id: 'coffee_float',
      triggerTime: 35,
      duration: 3,
      panTo: { x: -40, y: 20 },
      zoomTo: 1.1,
      shakeIntensity: 0,
      message: '咖啡自己飘走了',
      messageDuration: 2.5,
      triggered: false,
      finished: false,
    },
    {
      id: 'typewriter_birds',
      triggerTime: 45,
      duration: 3,
      panTo: { x: -30, y: 0 },
      zoomTo: 1.1,
      shakeIntensity: 1,
      message: '打字机打出的是鸟',
      messageDuration: 2.5,
      triggered: false,
      finished: false,
    },
  ];
}

export function createCutsceneState(): CutsceneState {
  return {
    moments: createCutsceneMoments(),
    activeMoment: null,
    messageText: '',
    messageTimer: 0,
    messageAlpha: 0,
  };
}

export function updateCutscene(cutscene: CutsceneState, camera: CameraState, gameTime: number, dt: number): void {
  for (const moment of cutscene.moments) {
    if (!moment.triggered && gameTime >= moment.triggerTime) {
      moment.triggered = true;
      cutscene.activeMoment = moment;
      cutscene.messageText = moment.message;
      cutscene.messageTimer = moment.messageDuration;
      cutscene.messageAlpha = 0;

      if (moment.panTo) {
        triggerCameraPan(camera, moment.panTo.x, moment.panTo.y, 2);
      }
      if (moment.zoomTo) {
        triggerCameraZoom(camera, moment.zoomTo, 1.5);
      }
      if (moment.shakeIntensity > 0) {
        triggerCameraShake(camera, moment.shakeIntensity);
      }
    }
  }

  if (cutscene.activeMoment) {
    const moment = cutscene.activeMoment;
    const elapsed = gameTime - moment.triggerTime;

    if (elapsed < 0.5) {
      cutscene.messageAlpha = elapsed / 0.5;
    } else if (elapsed > moment.duration - 0.5) {
      cutscene.messageAlpha = Math.max(0, (moment.duration - elapsed) / 0.5);
    } else {
      cutscene.messageAlpha = 1;
    }

    if (elapsed >= moment.duration) {
      moment.finished = true;
      cutscene.activeMoment = null;
      cutscene.messageText = '';
      cutscene.messageAlpha = 0;
      resetCamera(camera);
    }
  }
}
