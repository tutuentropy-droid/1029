interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-amber-50/95 to-orange-100/95 backdrop-blur-sm z-10">
      <div className="text-center">
        <div className="mb-6">
          <h1 className="text-5xl font-bold text-amber-900 mb-2 drop-shadow-md"
              style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
            😴 梦境办公楼 💼
          </h1>
          <p className="text-amber-700 text-lg">在被老板发现前，穿越诡异楼层，带着文件逃离办公楼！</p>
        </div>

        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 bg-amber-100 rounded-full border-4 border-amber-800 flex items-center justify-center animate-bounce"
               style={{ animationDuration: '2s' }}>
            <span className="text-6xl">🧑‍💼</span>
          </div>
        </div>

        <button
          onClick={onStart}
          className="px-10 py-4 bg-amber-500 hover:bg-amber-600 text-white text-xl font-bold rounded-2xl
                     border-4 border-amber-700 shadow-lg transform hover:scale-105 transition-all duration-200
                     active:scale-95"
          style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}
        >
          🎮 开始摸鱼
        </button>

        <div className="mt-10 p-5 bg-white/60 rounded-2xl border-2 border-amber-300 max-w-sm mx-auto">
          <h3 className="text-amber-800 font-bold mb-3 text-lg">📖 操作说明</h3>
          <div className="text-amber-700 text-sm space-y-2 text-left">
            <p>⬅️ ➡️ <span className="font-semibold">或</span> A D — 左右移动</p>
            <p>⬆️ <span className="font-semibold">或</span> W <span className="font-semibold">或</span> 空格 — 跳跃</p>
            <p>📄 收集所有文件后到达出口前往下一层！</p>
            <p>🏢 一共五层楼，每层规则不同！</p>
          </div>
        </div>

        <div className="mt-6 text-amber-600 text-sm italic">
          "再睡五分钟...就五分钟..."
        </div>
      </div>
    </div>
  );
}
