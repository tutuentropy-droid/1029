interface WinScreenProps {
  onRestart: () => void;
}

export default function WinScreen({ onRestart }: WinScreenProps) {
  const confetti = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'][Math.floor(Math.random() * 6)],
    size: 8 + Math.random() * 8,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/30 backdrop-blur-sm">
      <div className="relative">
        {confetti.map((c) => (
          <div
            key={c.id}
            className="absolute rounded-sm"
            style={{
              left: `${c.left}%`,
              top: '-20px',
              width: `${c.size}px`,
              height: `${c.size * 1.5}px`,
              backgroundColor: c.color,
              animation: `fall ${c.duration}s linear ${c.delay}s infinite`,
            }}
          />
        ))}

        <div className="bg-gradient-to-b from-amber-50 to-orange-100 p-10 rounded-3xl border-4 border-amber-600
                        shadow-2xl text-center transform animate-bounce"
             style={{ animationDuration: '0.5s', animationIterationCount: 1 }}>
          <div className="text-6xl mb-4">�</div>
          <h2 className="text-4xl font-bold text-amber-800 mb-3"
              style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
            逃离办公楼！
          </h2>
          <p className="text-amber-700 text-lg mb-2">你穿越了所有楼层，终于逃出了梦境办公楼~</p>
          <p className="text-amber-600 text-sm mb-6 italic">老板：整栋楼的人呢？？？</p>

          <div className="text-5xl mb-6 space-x-2">
            <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>🥳</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>🎊</span>
            <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>🎈</span>
          </div>

          <button
            onClick={onRestart}
            className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-2xl
                       border-4 border-green-700 shadow-lg transform hover:scale-105 transition-all duration-200
                       active:scale-95"
            style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}
          >
            🔄 再来一局
          </button>

          <p className="mt-4 text-amber-500 text-xs">
            按 R 键也可以重新开始哦~
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
