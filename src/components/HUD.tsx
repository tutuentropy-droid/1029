interface HUDProps {
  collectedCount: number;
  totalCount: number;
}

export default function HUD({ collectedCount, totalCount }: HUDProps) {
  const allCollected = collectedCount === totalCount;

  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
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

      <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl border-2 border-amber-300 shadow-md">
        <p className="text-xs text-amber-700">
          💡 提示：跳上平台收集文件
        </p>
      </div>
    </div>
  );
}
