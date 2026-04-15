import React, { useState, useRef, useEffect } from 'react';

// 🌟 新增：隨身 AI 助教文字區塊元件
// 🌟 新增：隨身 AI 助教文字區塊元件 (精準相對定位版)
export function AiTutorArticle({ children }: { children: React.ReactNode }) {
  const [selectedText, setSelectedText] = useState('');
  // 🌟 1. 新增一個狀態，用來儲存整篇文章的上下文
  const [articleContext, setArticleContext] = useState('');
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  
  const [aiStatus, setAiStatus] = useState<'idle' | 'thinking' | 'answered'>('idle');
  const [aiResponse, setAiResponse] = useState('');
  
  // 🌟 把 Ref 綁定在最外層的 relative 容器上
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0 && text.length < 50 && containerRef.current) {
        // 🌟 2. 抓取這整篇文章的純文字內容，作為 AI 的參考脈絡
        const contextText = containerRef.current.innerText;
        setArticleContext(contextText);
        const range = selection!.getRangeAt(0);
        const selectionRect = range.getBoundingClientRect(); // 反白文字的視窗座標
        const containerRect = containerRef.current.getBoundingClientRect(); // 容器的視窗座標

        // 🌟 核心修正：計算文字相對於「容器」的內部座標
        let relativeLeft = selectionRect.left - containerRect.left + (selectionRect.width / 2);
        const relativeTop = selectionRect.top - containerRect.top;

        // 🛡️ 新版防撞牆：依據容器的寬度來限制，不再受側邊欄開關影響
        const containerWidth = containerRect.width;
        
        if (relativeLeft + 120 > containerWidth) {
          relativeLeft = containerWidth - 120; // 靠右防撞
        } else if (relativeLeft - 120 < 0) {
          relativeLeft = 120; // 靠左防撞
        }

        setSelectedText(text);
        setPopoverPos({
          top: relativeTop,
          left: relativeLeft,
        });
        setAiStatus('idle');
      } else if (!isHoveringButton) {
        setSelectedText('');
      }
    }, 10);
  };

  // 更新版：呼叫你自己寫的 FastAPI 後端
  const handleAskAi = async () => {
    setAiStatus('thinking');
    
    try {
      // 打向你剛剛啟動的本地端 Python 伺服器
      const response = await fetch('http://localhost:8000/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_text: selectedText,
          // 🌟 3. 把上下文一起送到後端！
          article_context: articleContext
        })
      });

      if (!response.ok) {
        throw new Error('伺服器無回應');
      }

      const data = await response.json();
      setAiResponse(data.reply); // 把後端回傳的文字設定進畫面裡
      
    } catch (error) {
      console.error("連線錯誤:", error);
      setAiResponse("無法連線到 AI 助教伺服器，請確認後端是否已啟動。");
    }

    setAiStatus('answered');
  };

  return (
    // 🌟 將 ref 放在擁有 relative 的容器上
    <div className="relative" ref={containerRef}>
      
      {/* 文章內容區塊 */}
      <div 
        onMouseUp={handleMouseUp}
        className="leading-relaxed text-lg text-gray-700 dark:text-gray-300"
      >
        {children}
      </div>

      {/* 浮動的 AI 按鈕或對話框 */}
      {selectedText && (
        <div 
          // 🌟 關鍵：改回 absolute，讓它完全聽從 containerRef 的相對座標
          className="absolute z-[100] transition-all duration-200 -translate-x-1/2 -translate-y-full mb-2"
          style={{ top: popoverPos.top, left: popoverPos.left }}
          onMouseEnter={() => setIsHoveringButton(true)}
          onMouseLeave={() => setIsHoveringButton(false)}
        >
          {aiStatus === 'idle' && (
            <button 
              onClick={handleAskAi}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform"
            >
              <span className="text-blue-500">✨</span> 
              解釋「{selectedText.length > 8 ? selectedText.substring(0, 8) + '...' : selectedText}」
            </button>
          )}

          {(aiStatus === 'thinking' || aiStatus === 'answered') && (
            <div className="w-64 md:w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-4 animate-fade-in-up">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-500 text-sm">✨</span>
                  <span className="font-bold text-xs text-gray-500 dark:text-gray-400">AI 助教</span>
                </div>
                <button onClick={() => setSelectedText('')} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">×</button>
              </div>
              
              {aiStatus === 'thinking' ? (
                <div className="flex gap-1 items-center h-8 px-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              ) : (
                <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                  {aiResponse}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- 1. 模擬的課程大綱資料 ---
const menuData = [
  {
    id: 'unit1',
    title: 'Unit 1: 遇見生成式 AI',
    items: [
      { id: '1-1', title: '什麼是 Deepfake？', type: 'theory' },
      { id: '1-2', title: '看見真相之眼', type: 'challenge' },
    ],
  },
  {
    id: 'unit2',
    title: 'Unit 2: 拆解生成對抗網路',
    items: [
      { id: '2-1', title: '偽鈔天才與王牌警察', type: 'theory' },
      { id: '2-2', title: 'GAN 訓練視覺化', type: 'sandbox' },
    ],
  },
  {
    id: 'unit3',
    title: 'Unit 3: 參數與潛在空間',
    items: [
      { id: '3-1', title: '潛在空間 (Latent Space)', type: 'theory' },
      { id: '3-2', title: '特徵融合實作', type: 'sandbox' },
    ],
  }
];

// --- 2. 小圖示元件 ---
const IconHome = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const IconTheory = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const IconSandbox = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const IconChallenge = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5" /></svg>;
const IconMenu = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const IconClose = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>;

// 🌟 新增：翻轉卡片沙盒元件
function FlipCardSandbox() {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // 設定三個 AI 訓練的核心參數狀態
  const [learningRate, setLearningRate] = useState(0.002);
  const [batchSize, setBatchSize] = useState(32);
  const [epochs, setEpochs] = useState(100);

  // 這是背面會顯示的 PyTorch 程式碼，它會隨著正面的拉桿即時改變！
  const codeString = `import torch
import torch.nn as nn
import torch.optim as optim

# 1. 初始化神經網路模型 (以 GAN 為例)
generator = Generator()
discriminator = Discriminator()

# 2. 設定超參數 (接收來自前端介面的數值)
LEARNING_RATE = ${learningRate}
BATCH_SIZE = ${batchSize}
EPOCHS = ${epochs}

# 3. 設定優化器 (Adam)
optimizer_G = optim.Adam(generator.parameters(), lr=LEARNING_RATE)
optimizer_D = optim.Adam(discriminator.parameters(), lr=LEARNING_RATE)

# 4. 開始訓練迴圈
for epoch in range(EPOCHS):
    for batch in dataloader(batch_size=BATCH_SIZE):
        # 進行神經網路的前向傳播與反向傳播...
        pass
`;

  return (
    // [perspective:1000px] 是開啟 3D 空間的關鍵
    <div className="relative w-full h-[450px] [perspective:1000px] group">
      
      {/* 翻轉容器：負責執行動畫與 180 度旋轉 */}
      <div 
        className={`w-full h-full absolute transition-all duration-700 ease-in-out [transform-style:preserve-3d] 
          ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`
        }
      >

        {/* === 正面 (Front)：無程式碼的直覺滑桿 === */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-8 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold">訓練參數設定</h2>
              <p className="text-sm text-gray-500 mt-1">調整數值，看看背後的程式碼會發生什麼變化</p>
            </div>
            <button 
              onClick={() => setIsFlipped(true)} 
              className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/30"
            >
              查看背後程式碼 ➜
            </button>
          </div>

          <div className="space-y-8 flex-1 justify-center flex flex-col max-w-lg mx-auto w-full">
            <div>
              <label className="flex justify-between font-medium mb-3">學習率 (Learning Rate) <span className="text-blue-500 font-mono">{learningRate}</span></label>
              <input type="range" min="0.0001" max="0.01" step="0.0001" value={learningRate} onChange={e => setLearningRate(parseFloat(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="flex justify-between font-medium mb-3">批次大小 (Batch Size) <span className="text-blue-500 font-mono">{batchSize}</span></label>
              <input type="range" min="8" max="128" step="8" value={batchSize} onChange={e => setBatchSize(parseInt(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="flex justify-between font-medium mb-3">訓練回合 (Epochs) <span className="text-blue-500 font-mono">{epochs}</span></label>
              <input type="range" min="10" max="500" step="10" value={epochs} onChange={e => setEpochs(parseInt(e.target.value))} className="w-full accent-blue-500" />
            </div>
          </div>
        </div>

        {/* === 背面 (Back)：真實的 PyTorch 程式碼 === */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#1e1e1e] text-gray-100 backdrop-blur-xl border border-gray-700 rounded-3xl shadow-2xl p-8 flex flex-col font-mono">
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-4">
            <h2 className="text-lg font-bold text-green-400">train_gan.py</h2>
            <button 
              onClick={() => setIsFlipped(false)} 
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              ⭠ 返回視覺化介面
            </button>
          </div>
          {/* 顯示程式碼的區塊 */}
          <pre className="text-sm overflow-x-auto whitespace-pre-wrap text-gray-300 flex-1 leading-relaxed">
            {codeString}
          </pre>
        </div>

      </div>
    </div>
  );
}

// 🌟 新增：模擬 AI 訓練數據流的動態儀表板
function TrainingDashboard() {
  const [isTraining, setIsTraining] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [learningRate, setLearningRate] = useState(0.002);
  const maxEpochs = 100;
  
  // 儲存折線圖的歷史資料
  const [data, setData] = useState([{ epoch: 0, gLoss: 2.5, dLoss: 0.5 }]);

  // 模擬訓練迴圈的核心邏輯
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTraining && epoch < maxEpochs) {
      interval = setInterval(() => {
        setEpoch((prev) => {
          const nextEpoch = prev + 1;
          
          setData((currentData) => {
            const last = currentData[currentData.length - 1];
            // 根據學習率加入亂數波動 (模擬真實訓練的震盪)
            const noiseG = (Math.random() - 0.5) * learningRate * 80;
            const noiseD = (Math.random() - 0.5) * learningRate * 30;
            
            // G_Loss 趨勢往下，D_Loss 維持震盪
            let nextGLoss = Math.max(0.2, last.gLoss - 0.02 + noiseG);
            let nextDLoss = Math.max(0.2, last.dLoss + noiseD);

            // 🌟 彩蛋：如果學生把學習率調太高，模型會「崩潰 (Mode Collapse)」
            if (learningRate > 0.008) {
              nextGLoss += Math.random() * 0.8;
              nextDLoss += Math.random() * 0.8;
            }

            return [...currentData, { epoch: nextEpoch, gLoss: nextGLoss, dLoss: nextDLoss }];
          });
          
          if (nextEpoch >= maxEpochs) setIsTraining(false);
          return nextEpoch;
        });
      }, 80); // 動畫更新速度 (80毫秒)
    }
    return () => clearInterval(interval);
  }, [isTraining, epoch, learningRate]);

  const resetTraining = () => {
    setIsTraining(false);
    setEpoch(0);
    setData([{ epoch: 0, gLoss: 2.5, dLoss: 0.5 }]);
  };

  // 將數據轉換為 SVG 可以畫出的座標點
  const createSvgPoints = (key: 'gLoss' | 'dLoss') => {
    return data.map((d) => {
      const x = (d.epoch / maxEpochs) * 100; // X 軸 (進度 0-100%)
      const y = Math.max(0, Math.min(100, 100 - (d[key] / 3.5) * 100)); // Y 軸 (Loss 值映射)
      return `${x},${y}`;
    }).join(' ');
  };

  const currentGLoss = data[data.length - 1].gLoss.toFixed(3);
  const currentDLoss = data[data.length - 1].dLoss.toFixed(3);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-8 w-full max-w-3xl mx-auto flex flex-col gap-8">
      
      {/* 頂部控制面板 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            實時訓練監控
            {isTraining && <span className="flex w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Epoch: {epoch} / {maxEpochs}</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <label className="flex justify-between text-xs font-medium mb-1 text-gray-500">
              學習率 (LR) <span className="font-mono text-blue-500">{learningRate}</span>
            </label>
            <input 
              type="range" min="0.0005" max="0.01" step="0.0005" 
              value={learningRate} 
              onChange={e => setLearningRate(parseFloat(e.target.value))} 
              disabled={isTraining}
              className="w-full accent-blue-500 cursor-pointer disabled:opacity-50" 
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setIsTraining(!isTraining)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all text-white shadow-lg 
                ${isTraining ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/30'}`}
            >
              {isTraining ? '暫停' : epoch === 0 ? '開始訓練' : '繼續'}
            </button>
            <button 
              onClick={resetTraining}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              重置
            </button>
          </div>
        </div>
      </div>

      {/* SVG 折線圖顯示區 */}
      <div className="relative w-full h-64 bg-gray-50 dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 overflow-hidden">
        {/* 背景格線 */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 opacity-10 pointer-events-none">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full border-b border-gray-900 dark:border-white" />)}
        </div>

        {/* 原生 SVG 繪製折線 */}
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
          {/* 生成器 Loss 線條 (藍色) */}
          <polyline 
            points={createSvgPoints('gLoss')} 
            fill="none" stroke="#3b82f6" strokeWidth="2.5" 
            vectorEffect="non-scaling-stroke"
            className="transition-all duration-75 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
          />
          {/* 判別器 Loss 線條 (紫色) */}
          <polyline 
            points={createSvgPoints('dLoss')} 
            fill="none" stroke="#a855f7" strokeWidth="2.5" 
            vectorEffect="non-scaling-stroke"
            className="transition-all duration-75 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
          />
        </svg>
      </div>

      {/* 底部數據圖例 */}
      <div className="flex justify-center gap-12">
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
            Generator Loss
          </span>
          <span className="font-mono text-2xl mt-1 text-gray-900 dark:text-white">{currentGLoss}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span>
            Discriminator Loss
          </span>
          <span className="font-mono text-2xl mt-1 text-gray-900 dark:text-white">{currentDLoss}</span>
        </div>
      </div>
      
    </div>
  );
}

// 🌟 新增：節點式模型拼圖 (神經網路架構沙盒)
function NodeBuilderSandbox() {
  // 預設會有一個「輸入層 (Input)」
  const [nodes, setNodes] = useState([
    { id: 'input-0', type: 'Input', label: '輸入影像', detail: '64x64 RGB', color: 'from-gray-500 to-gray-600' }
  ]);

  // 定義學生可以加入的網路層積木
  const availableLayers = [
    { type: 'Conv2D', label: '卷積層', detail: '特徵萃取', color: 'from-blue-500 to-cyan-500' },
    { type: 'ReLU', label: '啟動函數', detail: '加入非線性', color: 'from-purple-500 to-pink-500' },
    { type: 'Flatten', label: '展平層', detail: '降維轉化', color: 'from-orange-500 to-amber-500' },
    { type: 'Dense', label: '全連接層', detail: '最終分類', color: 'from-emerald-500 to-teal-500' },
  ];

  // 加入節點的函式
  const addNode = (layer: typeof availableLayers[0]) => {
    if (nodes.length >= 8) return; // 限制最多 8 個節點避免畫面塞爆
    setNodes([...nodes, { ...layer, id: `${layer.type}-${Date.now()}` }]);
  };

  // 移除節點的函式 (不能移除第一個 Input)
  const removeNode = (id: string) => {
    if (id === 'input-0') return;
    setNodes(nodes.filter(node => node.id !== id));
  };

  // 重置畫布
  const resetCanvas = () => {
    setNodes([{ id: 'input-0', type: 'Input', label: '輸入影像', detail: '64x64 RGB', color: 'from-gray-500 to-gray-600' }]);
  };

  // 簡易的模型架構驗證邏輯
  const validateModel = () => {
    if (nodes.length < 3) return { status: 'warning', msg: '模型太淺了，試著加入更多網路層吧！' };
    
    const hasFlatten = nodes.some(n => n.type === 'Flatten');
    const lastNode = nodes[nodes.length - 1];
    
    if (lastNode.type === 'Dense' && !hasFlatten) {
      return { status: 'error', msg: '⚠️ 錯誤：在加入 Dense (全連接層) 之前，必須先使用 Flatten 展平資料！' };
    }
    if (lastNode.type === 'Dense') {
      return { status: 'success', msg: '✅ 完美的架構！這是一個標準的影像分類/判別器模型。' };
    }
    return { status: 'normal', msg: '繼續建構... (提示：判別器通常以 Dense 層作為結尾)' };
  };

  const validation = validateModel();

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-8 w-full max-w-4xl mx-auto flex flex-col gap-8">
      
      {/* 標題與驗證狀態列 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">神經網路建構所</h2>
          <p className="text-sm text-gray-500 mt-1">點擊下方積木，依序組裝出你的判別器 (Discriminator) 模型</p>
        </div>
        <button onClick={resetCanvas} className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          清空畫布
        </button>
      </div>

      {/* 積木選擇區 (工具列) */}
      <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
        {availableLayers.map((layer) => (
          <button
            key={layer.type}
            onClick={() => addNode(layer)}
            disabled={nodes.length >= 8}
            className={`px-4 py-3 rounded-xl flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0`}
          >
            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${layer.color}`} />
            <div className="text-left">
              <div className="font-bold text-sm leading-none">{layer.type}</div>
              <div className="text-[10px] text-gray-500 mt-1">{layer.label}</div>
            </div>
            <span className="text-gray-300 dark:text-gray-600 ml-2">＋</span>
          </button>
        ))}
      </div>

      {/* 畫布區：節點連線展示 (支援橫向捲動) */}
      <div className="relative w-full h-48 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 overflow-x-auto flex items-center">
        <div className="flex items-center gap-2 min-w-max">
          {nodes.map((node, index) => (
            <React.Fragment key={node.id}>
              {/* 節點卡片 */}
              <div className={`group relative w-32 h-32 rounded-2xl bg-gradient-to-br ${node.color} p-1 shadow-lg animate-fade-in-up`}>
                <div className="w-full h-full bg-white/90 dark:bg-gray-900/90 rounded-[14px] flex flex-col items-center justify-center p-3 text-center relative">
                  
                  {/* 刪除按鈕 (Hover 時顯示) */}
                  {index !== 0 && (
                    <button 
                      onClick={() => removeNode(node.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md flex items-center justify-center text-xs pb-0.5"
                    >
                      ×
                    </button>
                  )}

                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">{node.type}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{node.label}</span>
                  <span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md mt-2 text-gray-500">
                    {node.detail}
                  </span>
                </div>
              </div>

              {/* 連接箭頭 (除了最後一個節點外都要顯示) */}
              {index < nodes.length - 1 && (
                <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 animate-fade-in-up">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 狀態回饋提示條 */}
      <div className={`p-4 rounded-xl border flex items-center gap-3 transition-colors duration-300
        ${validation.status === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' : 
          validation.status === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' : 
          'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'}
      `}>
        {validation.status === 'success' ? '✨' : validation.status === 'error' ? '🚨' : '💡'}
        <span className="text-sm font-medium">{validation.msg}</span>
      </div>

    </div>
  );
}

// 🌟 新增：Apple 風格 3D 互動學習徽章
function AchievementBadge({ 
  title = "初探生成式 AI", 
  date = "2026.04.14", 
  icon = "🔮", 
  colorFrom = "from-amber-400", 
  colorTo = "to-orange-600" 
}) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  // 核心魔法：計算滑鼠位置來決定卡片的傾斜角度
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    
    // 計算滑鼠在卡片內的相對 X, Y 座標
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 找出卡片的中心點
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // 將座標轉換為旋轉角度 (限制在 -20 到 +20 度之間)
    const rotateX = -((y - centerY) / centerY) * 20;
    const rotateY = ((x - centerX) / centerX) * 20;
    
    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    // 滑鼠移開時，平滑回歸原位
    setRotation({ x: 0, y: 0 });
  };

  return (
    <div 
      className="relative w-64 h-80 [perspective:1000px] group cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 徽章本體 (根據滑鼠位置進行 3D 旋轉) */}
      <div 
        className={`w-full h-full absolute rounded-[2rem] p-1 
          bg-gradient-to-br ${colorFrom} ${colorTo} 
          shadow-2xl flex flex-col items-center justify-center
          ${isHovering ? 'transition-none' : 'transition-all duration-500 ease-out'}
        `}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovering ? 1.05 : 1})`,
          // 模擬金屬光澤的動態反光效果
          boxShadow: isHovering 
            ? `${-rotation.y * 2}px ${rotation.x * 2}px 30px rgba(0,0,0,0.3)` 
            : '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
        }}
      >
        {/* 內層玻璃質感 (Glassmorphism) */}
        <div className="w-full h-full bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-[1.8rem] border border-white/40 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          
          {/* 動態光斑 (Glitter/Glare effect) */}
          <div 
            className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 pointer-events-none"
            style={{
              transform: `translateX(${rotation.y * 2}px) translateY(${rotation.x * 2}px)`,
              transition: isHovering ? 'none' : 'transform 0.5s ease-out',
            }}
          />

          {/* 徽章內容 */}
          <div className="text-6xl mb-4 drop-shadow-xl transform transition-transform group-hover:scale-110 duration-300">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-white text-center drop-shadow-md tracking-wide">
            {title}
          </h3>
          <div className="mt-6 px-4 py-1.5 bg-black/30 rounded-full text-white/90 text-xs font-mono tracking-widest backdrop-blur-sm">
            {date}
          </div>
          <div className="absolute top-4 right-5 text-white/50 text-xs font-bold">
            01
          </div>
        </div>
      </div>
    </div>
  );
}

// 🌟 新增：生成式 AI 核心概念視覺化 (模擬去雜訊生成過程)
function GenerativeConceptSandbox() {
  const [progress, setProgress] = useState(0); // 生成進度 0 到 100
  const [prompt, setPrompt] = useState('太空貓咪');

  // 根據使用者的 Prompt 切換不同的目標圖示
  const getTargetIcon = () => {
    switch (prompt) {
      case '太空貓咪': return '🐱🚀';
      case '賽博龐克城市': return '🏙️🌆';
      case '魔法森林': return '🌲✨';
      default: return '🤖🎨';
    }
  };

  // 核心視覺魔法：根據進度計算模糊度與雜訊透明度
  // 進度越低：雜訊越重、主體越模糊
  // 進度越高：雜訊消失、主體變清晰
  const noiseOpacity = Math.max(0, 1 - progress / 60); // 0-60% 階段雜訊逐漸消失
  const blurAmount = Math.max(0, 20 - progress / 5);   // 初始模糊度為 20px，逐漸變為 0
  const imageOpacity = progress / 100;                 // 圖像透明度逐漸浮現

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-3xl shadow-2xl p-8 w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center">
      
      {/* 左側：視覺化畫布 (模擬 AI 生成結果) */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 bg-gray-100 dark:bg-gray-900 rounded-3xl overflow-hidden shadow-inner flex-shrink-0 border border-gray-200 dark:border-gray-700">
        
        {/* 底層：生成的目標圖像 (帶有動態模糊與透明度) */}
        <div 
          className="absolute inset-0 flex items-center justify-center text-7xl md:text-9xl transition-all duration-200"
          style={{ 
            filter: `blur(${blurAmount}px)`,
            opacity: imageOpacity,
            transform: `scale(${1 + blurAmount/50})` // 模糊時稍微放大，清晰時縮回原比例
          }}
        >
          {getTargetIcon()}
        </div>

        {/* 頂層：模擬雜訊 (TV Static Noise) */}
        <div 
          className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-200"
          style={{ 
            opacity: noiseOpacity,
            // 利用 SVG 濾鏡產生極致的雜訊效果
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        {/* 進度百分比浮水印 */}
        <div className="absolute bottom-4 right-4 font-mono text-xl font-bold text-gray-800/30 dark:text-gray-200/30">
          {progress}%
        </div>
      </div>

      {/* 右側：控制面板與解說 */}
      <div className="flex flex-col justify-center w-full">
        <h2 className="text-3xl font-bold mb-2">魔法如何發生？</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          生成式 AI 並不是「搜尋」圖片，而是像雕刻家一樣，從一團混亂的雜訊中，根據你的提示詞，一步步推敲並還原出真實的樣貌。
        </p>

        {/* 步驟 1: 選擇提示詞 */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">1. 輸入文本提示 (Condition)</label>
          <div className="flex flex-wrap gap-2">
            {['太空貓咪', '賽博龐克城市', '魔法森林'].map(p => (
              <button 
                key={p}
                onClick={() => { setPrompt(p); setProgress(0); }} // 換主題時重置進度
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  prompt === p 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* 步驟 2: 控制生成進度 */}
        <div>
          <label className="flex justify-between text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            <span>2. 演算進度 (Denoising Steps)</span>
            <span className="text-blue-500 font-mono">{progress}%</span>
          </label>
          <input 
            type="range" 
            min="0" max="100" 
            value={progress} 
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-blue-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          
          {/* 動態教育提示字 */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl">
            <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              {progress === 0 && "模型現在只看到一團隨機的雜訊。"}
              {progress > 0 && progress < 40 && "開始辨識大方向的輪廓與色塊..."}
              {progress >= 40 && progress < 80 && "特徵逐漸清晰，雜訊正在被消除..."}
              {progress >= 80 && progress < 100 && "進行最終的細節打磨與銳化。"}
              {progress === 100 && "✨ 生成完成！這就是 AI 創造的新事物。"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 🌟 1. 讀取記憶：初始載入時，先去 localStorage 找有沒有紀錄，沒有就預設 'home'
  const [activeItem, setActiveItem] = useState(() => {
    return localStorage.getItem('lastActiveItem') || 'home';
  });

  // 🌟 2. 寫入記憶：只要 activeItem 改變（且不是首頁），我們就把它存進瀏覽器
  React.useEffect(() => {
    if (activeItem !== 'home') {
      localStorage.setItem('lastActiveItem', activeItem);
    }
  }, [activeItem]);

  // 🌟 3. 動態尋找上次學習的單元資訊
  // 我們從 localStorage 拿出紀錄（如果沒紀錄就預設 1-1）
  const savedUnitId = localStorage.getItem('lastActiveItem') || '1-1';
  
  // 利用 ID 去 menuData 裡面把那堂課的名字跟單元抓出來
  const targetUnit = menuData.find(u => u.items.some(i => i.id === savedUnitId));
  const targetItem = targetUnit?.items.find(i => i.id === savedUnitId);

  // 🌟 4. 把寫死的 lastLesson 換成這個「動態生成的記憶物件」
  const dynamicLastLesson = {
    id: savedUnitId,
    title: targetItem?.title || '準備開始你的 AI 旅程',
    description: targetItem?.type === 'theory' 
      ? '點擊繼續閱讀，掌握生成式 AI 的核心理論。' 
      : targetItem?.type === 'sandbox' 
        ? '進入互動沙盒，繼續你的參數調校實驗。'
        : '迎接挑戰，測試你的 Deepfake 辨識能力！',
    progress: 35, // (備註：進度條數值未來也可以用同樣方式存進 localStorage)
    unit: targetUnit?.title || '基礎單元'
  };

  // 找尋目前選中的單元名稱 (用來顯示在頂部導覽列)
  const currentUnit = menuData.flatMap(u => u.items).find(item => item.id === activeItem);
  // 🌟 單元內容派發中心
  const renderUnitContent = () => {
    switch (activeItem) {
      
      // ===== Unit 1 =====
      case '1-1':
        return (
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl">
            <h1 className="text-3xl font-bold mb-6">什麼是 Deepfake？</h1>
            
            {/* 🌟 把你想讓學生提問的文字用它包起來！ */}
            <AiTutorArticle>
              <p className="mb-4">
                Deepfake（深偽技術）是結合了「Deep Learning (深度學習)」與「Fake (偽造)」的新創詞彙。
                它主要依賴一種被稱為 <span className="font-bold text-blue-500 cursor-text">GAN (生成對抗網路)</span> 的架構。
              </p>
              <p>
                在訓練過程中，模型需要大量的運算資源，有時候我們會利用 
                <span className="font-bold text-purple-500 cursor-text"> NVIDIA Jetson</span> 這種邊緣運算裝置來加速神經網路的推論 (Inference)。
                當學生在實作時，如果學習率 (Learning Rate) 調整不當，很容易發生 <span className="font-bold text-red-500 cursor-text">Mode Collapse (模式崩潰)</span>。
              </p>
              
              <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-sm text-yellow-800 dark:text-yellow-200">
                💡 試試看：用滑鼠反白選取上面文章中你不懂的專有名詞（例如「GAN」或「模式崩潰」），看看會發生什麼事！
              </div>
            </AiTutorArticle>

          </div>
        );
      
      // 🌟 新增：把生成觀念視覺化掛載到 1-2
      case '1-2':
        return <GenerativeConceptSandbox />; 

      // ===== Unit 2 =====
      case '2-2':
        return <TrainingDashboard />; // 動態圖表
      
      // ===== Unit 3 =====
      case '3-1':
        return <NodeBuilderSandbox />; // 節點積木拼圖
      case '3-2':
        return <FlipCardSandbox />;    // 翻轉程式碼卡片
      
      default:
        return (
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-3xl shadow-2xl p-12 h-96 flex items-center justify-center transition-all duration-300">
            <span className="text-gray-400 text-lg">({currentUnit?.title}) 的內容預計放置於此區塊</span>
          </div>
        );
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} transition-colors duration-500`}>
      <div className="flex h-screen bg-[#f5f5f7] dark:bg-[#0a0a0c] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500 selection:text-white overflow-hidden">
        
        {/* === 左側導覽列 (Sidebar) === */}
        {/* 🛠️ Bug 修復：加上了 overflow-hidden，這樣隱形的字就不會蓋住漢堡按鈕了 */}
        <aside 
          className={`flex-shrink-0 flex flex-col bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-r border-gray-200/50 dark:border-gray-800/50 relative z-40 
            transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden
            ${isSidebarOpen ? 'w-72' : 'w-0 opacity-0 border-none'}
          `}
        >
          {/* Logo 區塊 (點擊也可以回首頁) */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200/50 dark:border-gray-800/50">
            <button onClick={() => setActiveItem('home')} className="flex items-center hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 mr-3 shadow-lg shadow-blue-500/20 flex-shrink-0" />
              <span className="text-lg font-semibold tracking-tight">AI 學習平台</span>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <IconClose />
            </button>
          </div>

          {/* 選單列表區塊 */}
          <div className="caret-transparent flex-1 overflow-y-auto overflow-x-hidden py-6 px-4 space-y-6">
            
            {/* 🌟 新增：獨立的首頁按鈕 */}
            <div>
              <button
                onClick={() => setActiveItem('home')}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${activeItem === 'home' 
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <span className={`mr-3 ${activeItem === 'home' ? 'text-white' : 'text-gray-400'}`}>
                  <IconHome />
                </span>
                學習總覽 (首頁)
              </button>
            </div>

            <div className="h-px bg-gray-200/50 dark:bg-gray-800/50 w-full" />

            {/* 原本的課程單元列表 */}
            {menuData.map((unit) => (
              <div key={unit.id}>
                <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 px-2">
                  {unit.title}
                </h3>
                <ul className="space-y-1">
                  {unit.items.map((item) => {
                    const isActive = activeItem === item.id;
                    return (
                      <li key={item.id}>
                        <button
                          onClick={() => setActiveItem(item.id)}
                          className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200
                            ${isActive 
                              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20' 
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                            }
                          `}
                        >
                          <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-400'}`}>
                            {item.type === 'theory' && <IconTheory />}
                            {item.type === 'sandbox' && <IconSandbox />}
                            {item.type === 'challenge' && <IconChallenge />}
                          </span>
                          {item.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* === 右側主要內容區 (Main Content) === */}
        <div className="caret-transparent flex-1 flex flex-col relative z-30 overflow-hidden">
          
          {/* 頂部導覽列 (Topbar) */}
          <header className="h-16 flex items-center justify-between px-6 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 relative z-50">
            <div className="flex items-center">
              {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="mr-4 p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <IconMenu />
                </button>
              )}
              
              <div className="text-sm text-gray-500 font-medium hidden sm:block">
                {activeItem === 'home' ? (
                  <span className="text-gray-900 dark:text-gray-100 font-semibold">首頁 Dashboard</span>
                ) : (
                  <>正在學習 ➜ <span className="text-gray-900 dark:text-gray-100">{currentUnit?.title}</span></>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-200/50 dark:bg-gray-800/50 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 transition-colors"
            >
              切換{isDarkMode ? '淺色' : '深色'}
            </button>
          </header>

          {/* 內容視窗：透過 activeItem 決定顯示什麼畫面 */}
          <main className="flex-1 overflow-y-auto p-8 md:p-12 relative z-10">
            <div className="max-w-5xl mx-auto">
              
              {activeItem === 'home' ? (
                /* === 首頁畫面 (Dashboard) === */
                <div className="space-y-12 animate-fade-in-up">
                  <header className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                      歡迎回來，準備好探索 AI 了嗎？
                    </h1>
                    <p className="text-xl text-gray-500 dark:text-gray-400">
                      你目前的學習進度為 35%，建議繼續完成「GAN 訓練視覺化」單元。
                    </p>
                  </header>

                  {/* 🌟 核心：繼續學習按鈕橫幅 (Resume Banner) */}
                  <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200/50 dark:border-blue-500/30 rounded-[2.5rem] p-8 md:p-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                      
                      {/* 左側：課堂資訊與介紹 */}
                      <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-widest uppercase">
                          上次學習到：{dynamicLastLesson.unit}
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">{dynamicLastLesson.title}</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
                          {dynamicLastLesson.description}
                        </p>
                        
                        {/* 簡易進度條 */}
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-1000" 
                              style={{ width: `${dynamicLastLesson.progress}%` }} 
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-blue-500">{dynamicLastLesson.progress}%</span>
                        </div>
                      </div>

                      {/* 右側：按鈕區 */}
                      <button 
                        onClick={() => setActiveItem(dynamicLastLesson.id)}
                        className="group relative flex items-center gap-3 py-5 px-10 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-gray-500/20"
                      >
                        <span>繼續上次的學習</span>
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>

                    {/* 背景裝飾：模糊的光暈，增加 Apple 風格的層次感 */}
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />
                  </div>

                  {/* 模擬三個學習進度卡片 */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {['基礎理論', '實作沙盒', '真相之眼挑戰'].map((title, i) => (
                      <div key={i} className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 p-6 rounded-3xl shadow-xl">
                        <h3 className="text-lg font-semibold mb-2">{title}</h3>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 mb-4">
                          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(i + 1) * 25}%` }}></div>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">已完成 {(i + 1) * 3} 個小節</p>
                      </div>
                    ))}
                  </div>

                  {/* 🌟 新增：榮譽徽章牆 (Achievement Wall) */}
                  <div className="mt-16">
                    <div className="flex justify-between items-end mb-8">
                      <div>
                        <h2 className="text-3xl font-bold">你的成就</h2>
                        <p className="text-gray-500 mt-2">完成章節挑戰，解鎖專屬的 3D 榮譽徽章。</p>
                      </div>
                      <span className="text-blue-500 font-semibold cursor-pointer hover:underline">查看全部 ➜</span>
                    </div>
                    
                    {/* 徽章展示列 */}
                    <div className="flex flex-wrap gap-8 justify-start">
                      {/* 第一顆徽章：預設的橘色魔法球 */}
                      <AchievementBadge />
                      
                      {/* 第二顆徽章：透過 Props 自訂顏色與圖示 */}
                      <AchievementBadge 
                        title="真相看破者" 
                        icon="👁️" 
                        date="2026.04.10" 
                        colorFrom="from-emerald-400" 
                        colorTo="to-teal-700" 
                      />

                      {/* 第三顆徽章：模擬還沒解鎖的狀態 */}
                      <div className="w-64 h-80 rounded-[2rem] border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 opacity-50">
                        <span className="text-4xl mb-4">🔒</span>
                        <span className="font-semibold">尚未解鎖</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center mt-8">
                    <button 
                      onClick={() => setActiveItem('2-2')}
                      className="py-4 px-8 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold transition-transform active:scale-95 shadow-lg shadow-gray-500/30 dark:shadow-white/20"
                    >
                      繼續上次的學習 ➜
                    </button>
                  </div>
                </div>
              ) : (
                /* === 其他單元學習畫面 (Unit Content) === */
                <div className="animate-fade-in-up">
                  <div className="text-center space-y-4 mb-16 mt-8">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                      {currentUnit?.title}
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400">
                      這裡是 {currentUnit?.type === 'theory' ? '理論解析' : currentUnit?.type === 'sandbox' ? '互動實作' : '過關挑戰'} 的專屬頁面。
                    </p>
                  </div>

                  {/* 🌟 關鍵修改：呼叫派發中心，讓它決定要顯示什麼畫面 */}
                  {renderUnitContent()}
                </div>
              )}

            </div>
          </main>
        </div>

      </div>
    </div>
  );
}