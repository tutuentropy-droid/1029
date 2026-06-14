import type { DreamRule, FloorTheme } from '@/game/types';

interface HUDProps {
  collectedCount: number;
  totalCount: number;
  currentRule: DreamRule | null;
  personalityDescription: string;
  personalityTraits: { name: string; value: number; icon: string }[];
  currentFloor: number;
  totalFloors: number;
  floorTheme: FloorTheme | null;
}

export default function HUD({ collectedCount, totalCount, currentRule, personalityDescription, personalityTraits, currentFloor, totalFloors, floorTheme }: HUDProps) {
  const allCollected = collectedCount === totalCount;

  const getHintText = () => {
    if (!floorTheme) return { hint: '跳上平台收集文件', subHint: '你的选择塑造梦境' };
    switch (floorTheme.rule) {
      case 'no_jump':
        return { hint: '走上阶梯收集文件', subHint: '保持安静，不要跳跃' };
      case 'flip_controls':
        return { hint: '注意：左右方向相反', subHint: '镜子里的世界是反的' };
      case 'slippery':
        return { hint: '地面打滑，小心控制', subHint: '纸上走路，停不下来' };
      case 'time_reverse':
        return { hint: '快走！时间在倒退', subHint: '走三步，时间推两步' };
      case 'slow_motion':
        return { hint: '时间变慢了，慢慢走', subHint: '一切都慢了下来' };
      default:
        return { hint: '跳上平台收集文件', subHint: '你的选择塑造梦境' };
    }
  };

  const hintText = getHintText();

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

        {floorTheme && (
          <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl border-2 shadow-md"
               style={{ borderColor: floorTheme.accentColor }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">🏢</span>
              <span className="text-xs font-bold" style={{ color: floorTheme.accentColor }}>
                {currentFloor + 1}F / {totalFloors}F — {floorTheme.name}
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((currentFloor + 1) / totalFloors) * 100}%`,
                  backgroundColor: floorTheme.accentColor,
                }}
              />
            </div>
            {floorTheme.rule !== 'none' && (
              <p className="text-xs mt-1 font-bold" style={{ color: floorTheme.accentColor }}>
                ⚠️ {floorTheme.ruleDescription}
              </p>
            )}
          </div>
        )}

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
            💡 {hintText.hint}
          </p>
          <p className="text-xs text-amber-500 mt-1">
            🌟 {hintText.subHint}
          </p>
        </div>
      </div>
    </div>
  );
}
