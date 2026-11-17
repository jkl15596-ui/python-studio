import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Lightbulb,
  Play,
  RotateCcw,
  Terminal,
  XCircle,
} from 'lucide-react';
import { ALL_LESSONS, SANDBOX_PRESETS } from '../data/curriculum';
import { runPythonCode } from '../engine/pythonRunner';
import type { Lesson, RunResult } from '../types/python';
import { CodeEditor } from './CodeEditor';
import { ConceptExplorer } from './ConceptExplorer';
import { TraceVisualizer } from './TraceVisualizer';

export type WorkspaceMode = 'lesson' | 'sandbox';
export type OutputTab = 'console' | 'visualizer';

interface WorkspaceViewProps {
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
  activeLesson: Lesson;
  onSelectLesson: (lesson: Lesson) => void;
  completedIds: string[];
  onMarkCompleted: (lessonId: string) => void;
  outputTab: OutputTab;
  onOutputTabChange: (tab: OutputTab) => void;
  customSandboxSeed?: { title: string; code: string; stdin?: string } | null;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  mode,
  onModeChange,
  activeLesson,
  onSelectLesson,
  completedIds,
  onMarkCompleted,
  outputTab,
  onOutputTabChange,
  customSandboxSeed,
}) => {
  const [code, setCode] = useState(() =>
    mode === 'sandbox' && customSandboxSeed
      ? customSandboxSeed.code
      : mode === 'sandbox'
      ? SANDBOX_PRESETS[0].code
      : activeLesson.starterCode
  );
  const [stdinText, setStdinText] = useState(() =>
    mode === 'sandbox' && customSandboxSeed
      ? customSandboxSeed.stdin ?? ''
      : mode === 'sandbox'
      ? SANDBOX_PRESETS[0].stdin ?? ''
      : activeLesson.defaultStdin ?? ''
  );
  const [showStdin, setShowStdin] = useState(
    Boolean(
      mode === 'sandbox' && customSandboxSeed
        ? customSandboxSeed.stdin
        : activeLesson.defaultStdin
    )
  );
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [activePresetId, setActivePresetId] = useState(SANDBOX_PRESETS[0].id);
  const [sandboxTitle, setSandboxTitle] = useState(
    mode === 'sandbox' && customSandboxSeed
      ? customSandboxSeed.title
      : SANDBOX_PRESETS[0].title
  );

  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [traceStepIndex, setTraceStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Sync editor when switching lessons
  useEffect(() => {
    if (mode === 'lesson') {
      setCode(activeLesson.starterCode);
      setStdinText(activeLesson.defaultStdin ?? '');
      setShowStdin(Boolean(activeLesson.defaultStdin));
      setShowHint(false);
      setShowSolution(false);
      setRunResult(null);
      setTraceStepIndex(0);
    }
  }, [mode, activeLesson]);

  // Handle seed from Quiz -> Sandbox
  useEffect(() => {
    if (mode === 'sandbox' && customSandboxSeed) {
      setCode(customSandboxSeed.code);
      setStdinText(customSandboxSeed.stdin ?? '');
      setShowStdin(Boolean(customSandboxSeed.stdin));
      setSandboxTitle(customSandboxSeed.title);
      setRunResult(null);
      setTraceStepIndex(0);
    }
  }, [mode, customSandboxSeed]);

  // Automatically reveal stdin box if user writes input(
  const codeUsesInput = useMemo(() => /\binput\s*\(/.test(code), [code]);

  const lessonIdx = ALL_LESSONS.findIndex((l) => l.id === activeLesson.id);
  const prevLesson = lessonIdx > 0 ? ALL_LESSONS[lessonIdx - 1] : null;
  const nextLesson =
    lessonIdx >= 0 && lessonIdx < ALL_LESSONS.length - 1
      ? ALL_LESSONS[lessonIdx + 1]
      : null;

  const activeTraceLine = useMemo(() => {
    if (
      outputTab !== 'visualizer' ||
      !runResult ||
      runResult.steps.length === 0
    ) {
      return null;
    }
    const step = runResult.steps[Math.min(traceStepIndex, runResult.steps.length - 1)];
    return step?.line ?? null;
  }, [outputTab, runResult, traceStepIndex]);

  const execute = async (switchToVisualizer: boolean, overrideCode?: string) => {
    const codeToRun = overrideCode ?? code;
    setIsRunning(true);
    try {
      const res = await runPythonCode({
        code: codeToRun,
        stdin: stdinText,
        tests: mode === 'lesson' ? activeLesson.tests : [],
        captureTrace: true,
      });
      setRunResult(res);
      setTraceStepIndex(0);
      if (switchToVisualizer) {
        onOutputTabChange('visualizer');
      }
      if (
        mode === 'lesson' &&
        res.success &&
        res.testResults &&
        res.testResults.length > 0 &&
        res.testResults.every((t) => t.passed)
      ) {
        onMarkCompleted(activeLesson.id);
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Run initial trace automatically when switching straight into visualizer mode with empty results
  useEffect(() => {
    if (outputTab === 'visualizer' && !runResult && !isRunning) {
      const targetCode =
        mode === 'sandbox' && customSandboxSeed
          ? customSandboxSeed.code
          : mode === 'lesson'
          ? activeLesson.starterCode
          : code;
      void execute(true, targetCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outputTab]);

  const handleSelectPreset = (presetId: string) => {
    const preset = SANDBOX_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePresetId(preset.id);
    setSandboxTitle(preset.title);
    setCode(preset.code);
    setStdinText(preset.stdin ?? '');
    setShowStdin(Boolean(preset.stdin));
    setRunResult(null);
    setTraceStepIndex(0);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore clipboard failures in restricted frames
    }
  };

  const handleResetCode = () => {
    if (mode === 'lesson') {
      setCode(activeLesson.starterCode);
      setStdinText(activeLesson.defaultStdin ?? '');
    } else {
      const preset = SANDBOX_PRESETS.find((p) => p.id === activePresetId);
      setCode(preset ? preset.code : '');
      setStdinText(preset?.stdin ?? '');
    }
    setRunResult(null);
    setTraceStepIndex(0);
  };

  const isLessonCompleted = completedIds.includes(activeLesson.id);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Workspace Mode Bar (below Top Header, adhering to Top Bar Contract) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => onModeChange('lesson')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'lesson'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            單元引導練習
          </button>
          <button
            type="button"
            onClick={() => onModeChange('sandbox')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              mode === 'sandbox'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            自由程式沙盒
          </button>
        </div>

        {mode === 'lesson' ? (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="選擇學習單元"
              value={activeLesson.id}
              onChange={(e) => {
                const found = ALL_LESSONS.find((l) => l.id === e.target.value);
                if (found) onSelectLesson(found);
              }}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-600"
            >
              {ALL_LESSONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.orderLabel} {l.title}
                  {completedIds.includes(l.id) ? ' (已完成)' : ''}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!prevLesson}
                onClick={() => prevLesson && onSelectLesson(prevLesson)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="上一個單元"
                title="上一個單元"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={!nextLesson}
                onClick={() => nextLesson && onSelectLesson(nextLesson)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                aria-label="下一個單元"
                title="下一個單元"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">範例模板：</span>
            {SANDBOX_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activePresetId === preset.id && sandboxTitle === preset.title
                    ? 'bg-sky-50 text-sky-800 border-sky-300 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {preset.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Balanced Two-Zone Interactive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Zone: Guided Concept & Verification Deck */}
        <div className="lg:col-span-5 space-y-5">
          {mode === 'lesson' ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    單元 {activeLesson.orderLabel} · {activeLesson.moduleTitle} ·{' '}
                    {activeLesson.difficultyLabel}
                  </span>
                  {isLessonCompleted && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold whitespace-nowrap shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      已通關
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-display font-bold text-slate-900">
                  {activeLesson.title}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {activeLesson.summary}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <h2 className="text-xs font-semibold text-slate-800">
                  核心重點
                </h2>
                <ul className="space-y-1.5 text-sm text-slate-700 list-disc pl-5">
                  {activeLesson.conceptPoints.map((pt, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>

              {activeLesson.explorerKind && (
                <ConceptExplorer
                  kind={activeLesson.explorerKind}
                  onApplySnippet={(snippet) => {
                    setCode(snippet);
                    setRunResult(null);
                  }}
                />
              )}

              {/* Automated Test Cases */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-slate-800">
                    自動化驗證關卡
                  </h2>
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    共 {activeLesson.tests.length} 項測試
                  </span>
                </div>

                <div className="space-y-2">
                  {activeLesson.tests.map((test) => {
                    const res = runResult?.testResults?.find(
                      (r) => r.id === test.id
                    );
                    return (
                      <div
                        key={test.id}
                        className={`rounded-xl border p-3 text-xs space-y-1 ${
                          res
                            ? res.passed
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-red-50/70 border-red-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900">
                            {test.label}
                          </span>
                          {res ? (
                            res.passed ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 whitespace-nowrap shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                通過
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-red-700 whitespace-nowrap shrink-0">
                                <XCircle className="w-3.5 h-3.5" />
                                未通過
                              </span>
                            )
                          ) : (
                            <span className="text-slate-500 whitespace-nowrap shrink-0">
                              待執行
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600">{test.description}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          預期：{test.expectedSummary}
                          {res && !res.passed ? ` ｜ 實際：${res.actual}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progressive Hint & Solution */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHint((h) => !h)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    {showHint ? '隱藏提示' : '查看解題提示'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSolution((s) => !s)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {showSolution ? '隱藏參考解答' : '查看參考解答'}
                  </button>
                </div>

                {showHint && (
                  <div className="rounded-xl bg-amber-50/70 border border-amber-200 p-3 text-xs text-amber-950 leading-relaxed">
                    {activeLesson.hint}
                  </div>
                )}

                {showSolution && (
                  <div className="space-y-2">
                    <pre className="bg-slate-950 text-slate-100 rounded-xl p-3 font-mono text-xs overflow-x-auto">
                      {activeLesson.solutionCode}
                    </pre>
                    <button
                      type="button"
                      onClick={() => setCode(activeLesson.solutionCode)}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
                    >
                      將參考解答填入編輯器
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500">
                  自由實驗環境 · 支援 CPython 語法與單步記憶體追蹤
                </div>
                <h1 className="text-xl font-display font-bold text-slate-900">
                  {sandboxTitle}
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {SANDBOX_PRESETS.find((p) => p.title === sandboxTitle)
                    ?.description ??
                    '在右側撰寫任意 Python 程式，支援函式定義、遞迴、串列推導式、字典統計與標準輸入。'}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2.5">
                <h2 className="text-xs font-semibold text-slate-800">
                  快速載入實驗範例
                </h2>
                <div className="space-y-2">
                  {SANDBOX_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`w-full text-left rounded-xl border p-3 transition-colors cursor-pointer ${
                        activePresetId === preset.id &&
                        sandboxTitle === preset.title
                          ? 'bg-sky-50/70 border-sky-300'
                          : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-900">
                          {preset.title}
                        </span>
                        <span className="text-slate-500">{preset.category}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSandboxTitle('空白 Python 草稿');
                    setCode('# 在此輸入你的 Python 程式碼\nprint("Hello, Python!")\n');
                    setStdinText('');
                    setRunResult(null);
                  }}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  清空為空白草稿
                </button>
                <span className="text-xs text-slate-400 font-mono">
                  Ctrl/Cmd + Enter 執行
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Zone: Code Stage + Console / Memory Visualizer */}
        <div className="lg:col-span-7 space-y-4">
          {/* Code Editor Card */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-950">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-medium text-slate-300">
                  main.py
                </span>
                {activeTraceLine !== null && (
                  <span className="text-xs font-mono text-amber-300 tabular-nums">
                    ▶ 追蹤停在第 {activeTraceLine} 行
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStdin((s) => !s)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showStdin || codeUsesInput
                      ? 'border-sky-500/50 text-sky-300 bg-sky-950/40'
                      : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  輸入資料 (stdin)
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      複製
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleResetCode}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 rounded-lg flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重設
                </button>

                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => void execute(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-sky-200 bg-slate-800 border border-sky-500/40 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Eye className="w-3.5 h-3.5" />
                  單步追蹤
                </button>

                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => void execute(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {isRunning ? '執行中...' : '執行程式'}
                </button>
              </div>
            </div>

            {(showStdin || codeUsesInput) && (
              <div className="bg-slate-900/70 border-b border-slate-800 px-4 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>標準輸入資料（每行對應一次 input() 呼叫）</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    stdin
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={stdinText}
                  onChange={(e) => setStdinText(e.target.value)}
                  placeholder="例如：&#10;王小明&#10;95"
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}

            <CodeEditor
              value={code}
              onChange={setCode}
              activeLine={activeTraceLine}
              onRunShortcut={() => void execute(outputTab === 'visualizer')}
              minHeight={300}
            />
          </div>

          {/* Output & Trace Visualizer Tabs */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
                <button
                  type="button"
                  onClick={() => onOutputTabChange('console')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    outputTab === 'console'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  終端機輸出
                </button>
                <button
                  type="button"
                  onClick={() => onOutputTabChange('visualizer')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    outputTab === 'visualizer'
                      ? 'bg-white text-slate-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  執行視覺化（單步記憶體）
                </button>
              </div>

              {runResult && (
                <div className="text-xs text-slate-500 font-mono tabular-nums">
                  {runResult.success ? '✓ 執行完成' : '✕ 發生錯誤'} ·{' '}
                  {runResult.durationMs} ms · 共 {runResult.steps.length} 步
                </div>
              )}
            </div>

            {outputTab === 'console' ? (
              <div className="p-4 bg-slate-950 text-slate-100 min-h-[180px] space-y-3">
                {!runResult ? (
                  <div className="text-xs text-slate-400 font-mono py-6 text-center">
                    點擊右上角「執行程式」或按下 Ctrl + Enter 查看輸出結果
                  </div>
                ) : (
                  <>
                    {runResult.stdout && (
                      <pre className="font-mono text-xs leading-relaxed text-emerald-300 whitespace-pre-wrap">
                        {runResult.stdout}
                      </pre>
                    )}
                    {!runResult.stdout && runResult.success && (
                      <div className="font-mono text-xs text-slate-400">
                        (程式執行完成，沒有標準輸出)
                      </div>
                    )}
                    {runResult.stderr && (
                      <pre className="font-mono text-xs leading-relaxed text-red-400 whitespace-pre-wrap bg-red-950/30 border border-red-900/50 rounded-lg p-3">
                        {runResult.stderr}
                      </pre>
                    )}
                  </>
                )}
              </div>
            ) : (
              <TraceVisualizer
                steps={runResult?.steps ?? []}
                currentStepIndex={traceStepIndex}
                onStepChange={setTraceStepIndex}
                onRequestTrace={() => void execute(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
