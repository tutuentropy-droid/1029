import type { DreamRule } from '@/game/types';

interface HUDProps {
  collectedCount: number;
  totalCount: number;
  currentRule: DreamRule | null;
  personalityDescription: string;
  personalityTraits: { name: string; value: number; icon: string }[];
}

export default function HUD({ collectedCount, totalCount, currentRule, personalityDescription, personalityTraits }: HUDProps) {
  const allCollected = collectedCount === totalCount;

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
      <div className="flex flex-col gap-2">
        <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-amber-400 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📄</span>
            <span className={`text-xl font-bold ${allCollected ? 'text-green-600' : 'text-amber-800'}`}
                  style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
              {collectedCount} / {totalCount}
            </span>
          </div>
          <p className="text-xs text-amber-600 mt-1">
            {allCollected ? '✨ 收集完成！冲向出口！' : '收集所有文件...'}
          </p>
        </div>

        {personalityTraits.length > 0 && (
          <div className="bg-indigo-50/90 backdrop-blur-sm px-3 py-2 rounded-xl border-2 border-indigo-300 shadow-md">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-sm">🪞</span>
              <span className="text-xs font-bold text-indigo-700">
                梦境人格
              </span>
            </div>
            <p className="text-xs text-indigo-500 mb-2 italic">
              &ldquo;{personalityDescription}&rdquo;
            </p>
            <div className="space-y-1">
              {personalityTraits.map((trait, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <span className="text-xs">{trait.icon}</span>
                  <span className="text-xs text-indigo-600 w-14">{trait.name}</span>
                  <div className="flex-1 h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${trait.value * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        {currentRule && (
          <div className="bg-purple-100/90 backdrop-blur-sm px-3 py-2 rounded-xl border-2 border-purple-400 shadow-md">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌙</span>
              <span className="text-xs font-bold text-purple-700">
                {currentRule.name}
              </span>
            </div>
            <p className="text-xs text-purple-500 mt-0.5 italic">
              &ldquo;{currentRule.hint}&rdquo;
            </p>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl border-2 border-amber-300 shadow-md">
          <p className="text-xs text-amber-700">
            💡 提示：跳上平台收集文件
          </p>
          <p className="text-xs text-amber-500 mt-1">
            🌟 你的选择塑造梦境
          </p>
        </div>
      </div>
    </div>
  );
}
