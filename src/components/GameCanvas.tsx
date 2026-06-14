import { useEffect } from 'react';
import { useGame } from '@/hooks/useGame';
import StartScreen from '@/components/StartScreen';
import WinScreen from '@/components/WinScreen';
import HUD from '@/components/HUD';
import RuleAnnouncement from '@/components/RuleAnnouncement';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/game/config';
import { BACKDOOR_ENABLED, isSkipNextFloorUrl } from '@/game/backdoor';

export default function GameCanvas() {
  const { canvasRef, gameState, collectedCount, totalCount, currentRule, personalityDescription, personalityTraits, currentFloor, totalFloors, floorTheme, startGame, restartGame, dismissAnnouncement, skipNextFloor } = useGame();

  useEffect(() => {
    if (isSkipNextFloorUrl()) {
      skipNextFloor();
    }
  }, [skipNextFloor]);

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

        {gameState === 'start' && (
          <StartScreen
            onStart={startGame}
            onSkipNextFloor={BACKDOOR_ENABLED ? skipNextFloor : undefined}
          />
        )}

        {gameState === 'announcement' && currentRule && (
          <RuleAnnouncement rule={currentRule} onDismiss={dismissAnnouncement} />
        )}

        {gameState === 'playing' && (
          <>
            <HUD
              collectedCount={collectedCount}
              totalCount={totalCount}
              currentRule={currentRule}
              personalityDescription={personalityDescription}
              personalityTraits={personalityTraits}
              currentFloor={currentFloor}
              totalFloors={totalFloors}
              floorTheme={floorTheme}
            />
            {BACKDOOR_ENABLED && (
              <button
                type="button"
                onClick={skipNextFloor}
                title="Ctrl+Shift+N"
                className="absolute bottom-3 right-3 z-10 px-2 py-1 text-[10px] rounded-lg
                           bg-black/20 text-white/50 hover:bg-black/40 hover:text-white/90 transition-colors"
              >
                ⏭ 下一关
              </button>
            )}
          </>
        )}

        {gameState === 'win' && <WinScreen onRestart={restartGame} />}
      </div>
    </div>
  );
}
