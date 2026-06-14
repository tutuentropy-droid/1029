import { useEffect, useState } from 'react';
import type { DreamRule } from '@/game/types';

interface RuleAnnouncementProps {
  rule: DreamRule;
  onDismiss: () => void;
}

export default function RuleAnnouncement({ rule, onDismiss }: RuleAnnouncementProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('show'), 400);
    const exitTimer = setTimeout(() => {
      setPhase('exit');
      setTimeout(onDismiss, 500);
    }, 3200);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [onDismiss]);

  const ruleIcon: Record<string, string> = {
    moving_floor: '🌊',
    door_wander: '🚪',
    gravity_flip: '🔄',
    vanishing_platforms: '👻',
  };

  return (
    <div className={`absolute inset-0 flex items-center justify-center z-20 transition-all duration-500
      ${phase === 'enter' ? 'bg-black/0' : phase === 'show' ? 'bg-black/60' : 'bg-black/0'}`}>
      <div className={`transform transition-all duration-500
        ${phase === 'enter' ? 'scale-75 opacity-0 translate-y-8' :
          phase === 'show' ? 'scale-100 opacity-100 translate-y-0' :
          'scale-110 opacity-0 translate-y-[-20px]'}`}>

        <div className="relative px-12 py-8 bg-gradient-to-b from-purple-900/95 to-indigo-900/95
                        rounded-3xl border-2 border-purple-400/50 shadow-2xl text-center
                        backdrop-blur-md max-w-md">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2
                          bg-purple-600 px-4 py-1 rounded-full border border-purple-400">
            <span className="text-purple-200 text-xs font-bold tracking-wider">🌙 今日梦境规则</span>
          </div>

          <div className="text-5xl mb-4 animate-pulse">
            {ruleIcon[rule.type] || '✨'}
          </div>

          <h2 className="text-2xl font-bold text-purple-200 mb-3"
              style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
            {rule.name}
          </h2>

          <p className="text-purple-300 text-sm mb-5 italic">
            {rule.description}
          </p>

          <div className="relative py-4 px-6 bg-black/30 rounded-xl border border-purple-500/30">
            <p className="text-amber-300 text-lg font-bold tracking-wide"
               style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
              &ldquo;{rule.hint}&rdquo;
            </p>
          </div>

          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div key={i}
                   className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                   style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
