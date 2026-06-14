import { useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import StartScreen from '@/components/StartScreen';
import WinScreen from '@/components/WinScreen';
import HUD from '@/components/HUD';
import RuleAnnouncement from '@/components/RuleAnnouncement';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/game/config';

export default function GameCanvas() {
  const { canvasRef, gameState, collectedCount, totalCount, currentRule, startGame, restartGame, dismissAnnouncement } = useGame();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && gameState === 'win') {
        restartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, restartGame]);

  return (
    <div className="relative w-full max-w-4xl mx-auto" style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}>
      <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-800">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block"
        />

        {gameState === 'start' && <StartScreen onStart={startGame} />}

        {gameState === 'announcement' && currentRule && (
          <RuleAnnouncement rule={currentRule} onDismiss={dismissAnnouncement} />
        )}

        {gameState === 'playing' && (
          <HUD collectedCount={collectedCount} totalCount={totalCount} currentRule={currentRule} />
        )}

        {gameState === 'win' && <WinScreen onRestart={restartGame} />}
      </div>
    </div>
  );
}
