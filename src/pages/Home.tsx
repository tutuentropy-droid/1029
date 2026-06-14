import GameCanvas from '@/components/GameCanvas';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-yellow-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900 mb-1"
              style={{ fontFamily: '"Comic Sans MS", cursive, sans-serif' }}>
            😴 梦境打工人 💼
          </h1>
          <p className="text-amber-700 text-sm">一款手绘风格的摸鱼小游戏</p>
        </header>

        <GameCanvas />

        <footer className="text-center mt-6 text-amber-600 text-sm">
          <p>⬅️ ➡️ / A D 移动 &nbsp;&nbsp;|&nbsp;&nbsp; ⬆️ / W / 空格 跳跃</p>
          <p className="mt-1 text-xs text-amber-500">
            收集所有 📄 文件，冲向 🚪 出口，下班万岁！
          </p>
        </footer>
      </div>
    </div>
  );
}
