import { useState } from 'react';
import { useDirectorGame } from '@/hooks/useDirectorGame';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/game/config';
import type { EditorElementType } from '@/game/types';

interface DirectorModeProps {
  onBack: () => void;
}

export default function DirectorMode({ onBack }: DirectorModeProps) {
  const {
    editorCanvasRef,
    canvasRef,
    directorState,
    currentLevel,
    editorMode,
    selectedElement,
    rules,
    testResult,
    isTesting,
    collectedCount,
    totalCount,
    setEditorMode,
    addElement,
    selectElement,
    deleteElement,
    updateElement,
    toggleRule,
    updateRuleIntensity,
    startPlaying,
    stopPlaying,
    startTesting,
    clearTestResult,
    shareCurrentLevel,
    importLevel,
    newLevel,
    saveLevel,
    validateCurrentLevel,
    getCurrentLevelStats,
    setLevelName,
    setLevelDescription,
    setAuthorName,
  } = useDirectorGame();

  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const stats = getCurrentLevelStats();
  const validation = showValidation ? validateCurrentLevel() : null;

  const elementTypes: { type: EditorElementType; label: string; icon: string; subTypes?: { value: string; label: string }[] }[] = [
    { type: 'platform', label: '平台', icon: '🪑', subTypes: [
      { value: 'desk', label: '桌子' },
      { value: 'cabinet', label: '柜子' },
      { value: 'chair', label: '椅子' },
    ]},
    { type: 'collectible', label: '文件', icon: '📄' },
    { type: 'npc', label: 'NPC', icon: '👥', subTypes: [
      { value: 'printer_fish', label: '打印机鱼' },
      { value: 'ceiling_meeting', label: '天花板会议' },
      { value: 'backwards_boss', label: '倒退老板' },
      { value: 'floating_coffee', label: '漂浮咖啡' },
      { value: 'typewriter_birds', label: '打字机鸟' },
    ]},
  ];

  const handleShare = () => {
    const url = shareCurrentLevel();
    setShareUrl(url);
    setShowShareModal(true);
  };

  const handleImport = () => {
    if (importCode.trim()) {
      const success = importLevel(importCode.trim());
      if (success) {
        setShowImportModal(false);
        setImportCode('');
      } else {
        alert('导入失败：无效的关卡代码');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板！');
  };

  const difficultyColors = {
    easy: 'text-green-600 bg-green-100',
    medium: 'text-yellow-600 bg-yellow-100',
    hard: 'text-red-600 bg-red-100',
  };

  const difficultyLabels = {
    easy: '😊 简单',
    medium: '🤔 中等',
    hard: '😈 困难',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-800 rounded-lg font-bold border-2 border-amber-400 transition-all"
          >
            ← 返回游戏
          </button>
          <h1 className="text-3xl font-bold text-amber-900" style={{ fontFamily: '"Comic Sans MS", cursive' }}>
            🎬 梦境导演模式
          </h1>
          <div className="flex gap-2">
            <button
              onClick={newLevel}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold border-2 border-blue-600 transition-all"
            >
              🆕 新建
            </button>
            <button
              onClick={saveLevel}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold border-2 border-green-600 transition-all"
            >
              💾 保存
            </button>
          </div>
        </div>

        {directorState === 'editing' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-xl p-4 border-2 border-amber-300 shadow-lg">
                <h3 className="font-bold text-amber-800 mb-3 text-lg">📝 关卡信息</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">关卡名称</label>
                    <input
                      type="text"
                      value={currentLevel.name}
                      onChange={(e) => setLevelName(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">作者</label>
                    <input
                      type="text"
                      value={currentLevel.author}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-amber-700 mb-1">描述</label>
                    <textarea
                      value={currentLevel.description || ''}
                      onChange={(e) => setLevelDescription(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-amber-300 shadow-lg">
                <h3 className="font-bold text-amber-800 mb-3 text-lg">📊 关卡统计</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-600">平台数量：</span>
                    <span className="font-bold text-amber-800">{stats.platformCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">文件数量：</span>
                    <span className="font-bold text-amber-800">{stats.collectibleCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">NPC数量：</span>
                    <span className="font-bold text-amber-800">{stats.npcCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-600">规则数量：</span>
                    <span className="font-bold text-amber-800">{stats.ruleCount}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-amber-600">难度：</span>
                    <span className={`px-2 py-1 rounded-full text-sm font-bold ${difficultyColors[stats.estimatedDifficulty]}`}>
                      {difficultyLabels[stats.estimatedDifficulty]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-amber-300 shadow-lg">
                <h3 className="font-bold text-amber-800 mb-3 text-lg">🛠️ 编辑工具</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => setEditorMode('select')}
                    className={`p-3 rounded-lg font-bold transition-all ${
                      editorMode === 'select'
                        ? 'bg-amber-500 text-white border-2 border-amber-600'
                        : 'bg-amber-100 text-amber-700 border-2 border-amber-200 hover:bg-amber-200'
                    }`}
                  >
                    👆 选择
                  </button>
                  <button
                    onClick={() => setEditorMode('move')}
                    className={`p-3 rounded-lg font-bold transition-all ${
                      editorMode === 'move'
                        ? 'bg-amber-500 text-white border-2 border-amber-600'
                        : 'bg-amber-100 text-amber-700 border-2 border-amber-200 hover:bg-amber-200'
                    }`}
                  >
                    ✋ 移动
                  </button>
                  <button
                    onClick={() => setEditorMode('delete')}
                    className={`p-3 rounded-lg font-bold transition-all ${
                      editorMode === 'delete'
                        ? 'bg-red-500 text-white border-2 border-red-600'
                        : 'bg-red-100 text-red-700 border-2 border-red-200 hover:bg-red-200'
                    }`}
                  >
                    🗑️ 删除
                  </button>
                </div>

                <h4 className="font-bold text-amber-700 mb-2">添加元素</h4>
                <div className="space-y-2">
                  {elementTypes.map((item) => (
                    <div key={item.type} className="space-y-1">
                      <button
                        onClick={() => addElement(item.type, item.subTypes?.[0].value)}
                        className="w-full p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-bold border-2 border-purple-300 transition-all text-left"
                      >
                        {item.icon} {item.label}
                      </button>
                      {item.subTypes && (
                        <div className="flex flex-wrap gap-1 ml-2">
                          {item.subTypes.map((sub) => (
                            <button
                              key={sub.value}
                              onClick={() => addElement(item.type, sub.value)}
                              className="px-2 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-600 rounded border border-purple-200"
                            >
                              {sub.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border-2 border-amber-300 shadow-lg">
                <h3 className="font-bold text-amber-800 mb-3 text-lg">🎮 操作</h3>
                <div className="space-y-2">
                  <button
                    onClick={startPlaying}
                    className="w-full p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold border-2 border-green-600 transition-all text-lg"
                  >
                    ▶️ 试玩关卡
                  </button>
                  <button
                    onClick={() => { setShowValidation(true); startTesting(); }}
                    disabled={isTesting}
                    className="w-full p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-bold border-2 border-blue-600 disabled:border-blue-300 transition-all text-lg"
                  >
                    {isTesting ? '🤖 测试中...' : '🤖 自动测试'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-bold border-2 border-pink-600 transition-all"
                  >
                    🔗 分享关卡
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="w-full p-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold border-2 border-teal-600 transition-all"
                  >
                    📥 导入关卡
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="relative w-full" style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}>
                <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-800">
                  <canvas
                    ref={editorCanvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="w-full h-full block cursor-crosshair"
                  />
                </div>
                <div className="absolute top-2 left-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {editorMode === 'select' && '👆 点击选择元素'}
                  {editorMode === 'move' && '✋ 拖拽移动元素'}
                  {editorMode === 'delete' && '🗑️ 点击删除元素'}
                </div>
              </div>

              {testResult && (
                <div className={`rounded-xl p-4 border-2 shadow-lg ${
                  testResult.success
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-bold text-lg ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {testResult.success ? '✅ 测试通过！' : '❌ 测试失败'}
                    </h3>
                    <button
                      onClick={clearTestResult}
                      className="text-gray-500 hover:text-gray-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <p className={`mb-2 ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {testResult.message}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                    <div className="bg-white/50 p-2 rounded">
                      <span className="text-gray-600">用时：</span>
                      <span className="font-bold">{testResult.time.toFixed(1)}s</span>
                    </div>
                    <div className="bg-white/50 p-2 rounded">
                      <span className="text-gray-600">收集：</span>
                      <span className="font-bold">{testResult.collected}/{testResult.total}</span>
                    </div>
                    <div className="bg-white/50 p-2 rounded">
                      <span className="text-gray-600">出口：</span>
                      <span className="font-bold">{testResult.reachedExit ? '✅' : '❌'}</span>
                    </div>
                  </div>
                  <details className="bg-white/50 rounded-lg p-2">
                    <summary className="cursor-pointer font-bold text-amber-800">查看测试步骤</summary>
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto text-sm">
                      {testResult.steps.map((step, i) => (
                        <div key={i} className="text-gray-700">{step}</div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {validation && validation.errors.length > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-300 shadow-lg">
                  <h3 className="font-bold text-yellow-800 mb-2">⚠️ 关卡验证</h3>
                  <div className="space-y-1">
                    {validation.errors.map((error, i) => (
                      <div key={i} className="text-sm text-yellow-700">{error}</div>
                    ))}
                  </div>
                </div>
              )}

              {selectedElement && (
                <div className="bg-white rounded-xl p-4 border-2 border-amber-300 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-amber-800 text-lg">
                      ✏️ 编辑元素：{selectedElement.type}
                    </h3>
                    <button
                      onClick={() => selectElement(null)}
                      className="text-gray-500 hover:text-gray-700 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-amber-700 mb-1">X 坐标</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.x)}
                        onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                        className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-700 mb-1">Y 坐标</label>
                      <input
                        type="number"
                        value={Math.round(selectedElement.y)}
                        onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                        className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-700 mb-1">宽度</label>
                      <input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value) })}
                        className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                        disabled={selectedElement.type !== 'platform'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-700 mb-1">高度</label>
                      <input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value) })}
                        className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:outline-none"
                        disabled={selectedElement.type !== 'platform'}
                      />
                    </div>
                  </div>
                  {selectedElement.subType && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-amber-700 mb-1">子类型</label>
                      <span className="px-3 py-1 bg-amber-100 rounded-lg text-amber-800 font-medium">
                        {selectedElement.subType}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => deleteElement(selectedElement.id)}
                    className="mt-3 w-full p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold border-2 border-red-300 transition-all"
                  >
                    🗑️ 删除此元素
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-4 border-2 border-amber-300 shadow-lg">
                <h3 className="font-bold text-amber-800 mb-3 text-lg">🎪 梦境规则</h3>
                <p className="text-sm text-amber-600 mb-3">选择要启用的规则，创造独特的梦境体验！</p>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        rule.enabled
                          ? 'bg-purple-100 border-purple-400'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <button
                          onClick={() => toggleRule(rule.id)}
                          className={`flex-1 text-left font-bold ${
                            rule.enabled ? 'text-purple-800' : 'text-gray-600'
                          }`}
                        >
                          {rule.icon} {rule.name}
                        </button>
                        <div
                          className={`w-10 h-6 rounded-full transition-all cursor-pointer ${
                            rule.enabled ? 'bg-purple-500' : 'bg-gray-300'
                          }`}
                          onClick={() => toggleRule(rule.id)}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              rule.enabled ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{rule.description}</p>
                      {rule.enabled && (
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">
                            强度: {(rule.intensity * 100).toFixed(0)}%
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="2"
                            step="0.1"
                            value={rule.intensity}
                            onChange={(e) => updateRuleIntensity(rule.id, parseFloat(e.target.value))}
                            className="w-full accent-purple-500"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {directorState === 'playing' && (
          <div className="flex flex-col items-center">
            <div className="relative w-full max-w-4xl" style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}>
              <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-800">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="w-full h-full block"
                />
              </div>
              <div className="absolute top-4 left-4 bg-black/60 text-white px-4 py-2 rounded-xl">
                <div className="text-sm">📄 {collectedCount} / {totalCount}</div>
                <div className="text-xs opacity-80">按 ESC 退出</div>
              </div>
              <button
                onClick={stopPlaying}
                className="absolute top-4 right-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold border-2 border-red-600 transition-all"
              >
                ⏹️ 停止
              </button>
            </div>
            <div className="mt-4 text-amber-700 text-center">
              <p>⬅️ ➡️ 或 A D 移动 | ⬆️ 或 W 或 空格 跳跃</p>
              <p className="text-sm mt-1">收集所有文件后到达出口即可通关！</p>
            </div>
          </div>
        )}

        {directorState === 'testing' && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin text-6xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold text-amber-800 mb-2">AI 正在自动测试关卡...</h2>
            <p className="text-amber-600">请稍候，这可能需要几秒钟</p>
          </div>
        )}

        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full border-4 border-pink-300 shadow-2xl">
              <h3 className="text-2xl font-bold text-pink-800 mb-4">🔗 分享你的梦境</h3>
              <p className="text-gray-600 mb-3">复制以下链接分享给朋友：</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border-2 border-pink-200 rounded-lg bg-pink-50 text-sm"
                />
                <button
                  onClick={() => copyToClipboard(shareUrl)}
                  className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-bold border-2 border-pink-600 transition-all"
                >
                  📋 复制
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-4">
                或者复制关卡代码：
              </p>
              <div className="flex gap-2 mb-4">
                <textarea
                  value={shareUrl.split('level=')[1] || ''}
                  readOnly
                  rows={4}
                  className="flex-1 px-3 py-2 border-2 border-pink-200 rounded-lg bg-pink-50 text-xs font-mono"
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-all"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full border-4 border-teal-300 shadow-2xl">
              <h3 className="text-2xl font-bold text-teal-800 mb-4">📥 导入关卡</h3>
              <p className="text-gray-600 mb-3">粘贴关卡代码或链接：</p>
              <textarea
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                rows={6}
                placeholder="粘贴关卡代码或包含 ?level= 的链接..."
                className="w-full px-3 py-2 border-2 border-teal-200 rounded-lg focus:border-teal-400 focus:outline-none mb-4 font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowImportModal(false); setImportCode(''); }}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleImport}
                  className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-bold border-2 border-teal-600 transition-all"
                >
                  📥 导入
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
