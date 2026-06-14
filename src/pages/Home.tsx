import { useState, useEffect } from 'react';
import GameCanvas from '@/components/GameCanvas';
import DirectorMode from '@/components/DirectorMode';
import { importLevelFromUrl } from '@/game/directorLevel';

type GameMode = 'normal' | 'director';

export default function Home() {
  const [mode, setMode] = useState<GameMode>('normal');
  const [hasImportedLevel, setHasImportedLevel] = useState(false);

  useEffect(() => {
    const imported = importLevelFromUrl();
    if (imported) {
      setHasImportedLevel(true);
      setMode('director');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100">
      {mode === 'normal' && (
        <div className="py-8 px-4">
          <div className="max-w-5xl mx-auto">
            <header className="text-center mb-6">
              <h1 className="text-3xl font-bold text-amber-900 mb-1"
                  style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
                😴 梦境打工人 💼
              </h1>
              <p className="text-amber-700 text-sm">一款手绘风格的摸鱼小游戏</p>
            </header>

            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => setMode('normal')}
                className="px-6 py-2 bg-amber-500 text-white rounded-xl font-bold border-2 border-amber-600 shadow-lg transition-all"
              >
                🎮 正常模式
              </button>
              <button
                onClick={() => setMode('director')}
                className="px-6 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-bold border-2 border-purple-300 shadow-lg transition-all"
              >
                🎬 梦境导演模式
              </button>
            </div>

            {hasImportedLevel && (
              <div className="max-w-2xl mx-auto mb-4 p-3 bg-purple-100 rounded-xl border-2 border-purple-300 text-center">
                <p className="text-purple-700 font-medium">
                  📥 检测到分享的关卡！已切换到导演模式
                </p>
                <button
                  onClick={() => setHasImportedLevel(false)}
                  className="mt-2 text-sm text-purple-600 hover:text-purple-800 underline"
                >
                  知道了
                </button>
              </div>
            )}

            <GameCanvas />

            <footer className="text-center mt-6 text-amber-600 text-sm">
              <p>⬅️ ➡️ / A D 移动 &nbsp;&nbsp;|&nbsp;&nbsp; ⬆️ / W / 空格 跳跃</p>
              <p className="mt-1 text-xs text-amber-500">
                收集所有 📄 文件，冲向 🚪 出口，下班万岁！
              </p>
            </footer>
          </div>
        </div>
      )}

      {mode === 'director' && (
        <DirectorMode onBack={() => setMode('normal')} />
      )}
    </div>
  );
}
