import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { ExecutionStep, VariableEntry } from '../types/python';

interface TraceVisualizerProps {
  steps: ExecutionStep[];
  currentStepIndex: number;
  onStepChange: (nextIndex: number) => void;
  onRequestTrace: () => void;
}

export const TraceVisualizer: React.FC<TraceVisualizerProps> = ({
  steps,
  currentStepIndex,
  onStepChange,
  onRequestTrace,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(650);

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;
    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => {
      onStepChange(Math.min(steps.length - 1, currentStepIndex + 1));
    }, speedMs);
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, speedMs, onStepChange]);

  if (steps.length === 0) {
    return (
      <div className="p-6 text-center space-y-3 bg-white">
        <p className="text-sm font-medium text-slate-800">
          尚未產生單步執行軌跡
        </p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          點擊「單步追蹤」或下方按鈕，即時紀錄每一行程式執行時的呼叫堆疊與變數記憶體變化。
        </p>
        <button
          type="button"
          onClick={onRequestTrace}
          className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          立即產生執行視覺化
        </button>
      </div>
    );
  }

  const step = steps[Math.min(currentStepIndex, steps.length - 1)];

  const eventLabel =
    step.event === 'call'
      ? '進入函式'
      : step.event === 'return'
      ? '函式回傳'
      : step.event === 'exception'
      ? '發生例外'
      : '執行此行';

  return (
    <div className="bg-white divide-y divide-slate-200">
      {/* Playback Controls & Timeline Scrubber */}
      <div className="p-4 space-y-3 bg-slate-50/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onStepChange(0);
              }}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              aria-label="回到第一步"
              title="回到第一步"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onStepChange(Math.max(0, currentStepIndex - 1));
              }}
              disabled={currentStepIndex === 0}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              上一步
            </button>
            <button
              type="button"
              onClick={() => {
                if (currentStepIndex >= steps.length - 1) {
                  onStepChange(0);
                  setIsPlaying(true);
                } else {
                  setIsPlaying((p) => !p);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  暫停
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  自動播放
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                onStepChange(Math.min(steps.length - 1, currentStepIndex + 1));
              }}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              下一步
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600">
            <label className="flex items-center gap-1.5">
              <span className="whitespace-nowrap">速度</span>
              <select
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-600"
              >
                <option value={1000}>0.6x 慢速</option>
                <option value={650}>1.0x 標準</option>
                <option value={300}>2.0x 快速</option>
              </select>
            </label>
            <span className="font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
              步驟 {currentStepIndex + 1} / {steps.length}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={Math.max(0, steps.length - 1)}
            value={currentStepIndex}
            onChange={(e) => {
              setIsPlaying(false);
              onStepChange(Number(e.target.value));
            }}
            aria-label="執行步驟時間軸"
            className="flex-1 accent-sky-600 cursor-pointer"
          />
          <span className="text-xs font-mono text-slate-700 whitespace-nowrap shrink-0 tabular-nums">
            第 {step.line} 行 · {eventLabel}
          </span>
        </div>

        {step.returnValue !== undefined && (
          <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg px-3 py-2 font-mono">
            ✓ {step.functionName}() 回傳值：<span className="font-semibold">{step.returnValue}</span>
          </div>
        )}
        {step.errorMessage && (
          <div className="text-xs bg-red-50 border border-red-200 text-red-900 rounded-lg px-3 py-2 font-mono">
            ✕ {step.errorMessage}
          </div>
        )}
      </div>

      {/* Call Stack + Variable Memory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* Call Stack Column */}
        <div className="md:col-span-5 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-800">呼叫堆疊 (Call Stack)</span>
            <span className="font-mono tabular-nums">{step.callStack.length} 層</span>
          </div>

          <div className="space-y-2">
            {step.callStack.map((frame, idx) => {
              const isTop = idx === step.callStack.length - 1;
              return (
                <div
                  key={frame.id}
                  className={`rounded-lg border p-2.5 text-xs ${
                    isTop
                      ? 'bg-sky-50/70 border-sky-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono mb-1.5">
                    <span className="font-semibold text-slate-900">{frame.name}</span>
                    <span className="text-slate-500 tabular-nums">
                      第 {frame.line} 行{isTop ? ' · 目前作用中' : ''}
                    </span>
                  </div>
                  {frame.locals.length === 0 ? (
                    <div className="text-slate-400 text-[11px]">尚無區域變數</div>
                  ) : (
                    <div className="space-y-1">
                      {frame.locals.map((v) => (
                        <div
                          key={v.name}
                          className="flex items-center justify-between gap-2 font-mono text-[11px]"
                        >
                          <span className="text-slate-700 truncate">{v.name}</span>
                          <span className="text-slate-900 font-medium truncate max-w-[160px]">
                            {v.repr}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Memory Objects Column */}
        <div className="md:col-span-7 p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-slate-800">記憶體變數視覺化</span>
            <span className="font-mono tabular-nums">
              {step.callStack[step.callStack.length - 1]?.locals.length ?? 0} 個變數
            </span>
          </div>

          <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
            {(step.callStack[step.callStack.length - 1]?.locals ?? []).length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                目前作用域尚未建立任何變數
              </div>
            ) : (
              (step.callStack[step.callStack.length - 1]?.locals ?? []).map((entry) => (
                <MemoryVariableRow key={entry.name} entry={entry} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Console Output at Current Step */}
      <div className="p-4 bg-slate-950 text-slate-100">
        <div className="text-[11px] font-medium text-slate-400 mb-1.5">
          截至目前步驟的終端機輸出
        </div>
        <pre className="font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre-wrap min-h-[36px]">
          {step.stdout || '(尚未輸出任何文字)'}
        </pre>
      </div>
    </div>
  );
};

const MemoryVariableRow: React.FC<{ entry: VariableEntry }> = ({ entry }) => {
  return (
    <div
      className={`rounded-lg border p-2.5 transition-colors ${
        entry.changed
          ? 'bg-amber-50/70 border-amber-300'
          : 'bg-slate-50/60 border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="font-semibold text-slate-900">{entry.name}</span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-500">{entry.typeName}</span>
        </div>
        {entry.changed && (
          <span className="text-[11px] font-semibold text-amber-800">
            ▲ 本步更新
          </span>
        )}
      </div>

      {(entry.kind === 'list' || entry.kind === 'tuple' || entry.kind === 'set') &&
      entry.items ? (
        entry.items.length === 0 ? (
          <div className="font-mono text-xs text-slate-500">
            {entry.kind === 'list' ? '[] (空串列)' : entry.repr}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {entry.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-center min-w-[36px]"
              >
                <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                  {entry.kind === 'set' ? '元素' : `[${idx}]`}
                </div>
                <div className="font-mono text-xs font-medium text-slate-900">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        )
      ) : entry.kind === 'dict' && entry.items ? (
        entry.items.length === 0 ? (
          <div className="font-mono text-xs text-slate-500">{'{} (空字典)'}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {entry.items.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded px-2 py-1 font-mono text-xs flex items-center justify-between gap-2"
              >
                <span className="text-sky-700 truncate">{item.key}:</span>
                <span className="text-slate-900 font-medium truncate">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="font-mono text-xs text-slate-900 bg-white border border-slate-200 rounded px-2.5 py-1.5 inline-block max-w-full break-all">
          {entry.repr}
        </div>
      )}
    </div>
  );
};
