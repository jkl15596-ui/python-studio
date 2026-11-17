import React from 'react';
import { ArrowRight, CheckCircle2, Code2, Eye, HelpCircle } from 'lucide-react';
import { ALL_LESSONS, MODULES } from '../data/curriculum';
import type { Lesson } from '../types/python';

interface CurriculumViewProps {
  completedIds: string[];
  onSelectLesson: (lesson: Lesson, openVisualizer?: boolean) => void;
  onOpenSandbox: () => void;
  onOpenQuiz: () => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  completedIds,
  onSelectLesson,
  onOpenSandbox,
  onOpenQuiz,
}) => {
  const totalCount = ALL_LESSONS.length;
  const completedCount = completedIds.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Focused Hero Split Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-sm font-medium text-sky-700">
              互動式 Python 程式設計實驗室
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-display font-bold tracking-tight text-slate-900 leading-[1.15] [text-wrap:balance]">
              親眼看見每一行 Python 程式碼在記憶體中的運作過程
            </h1>
            <p className="text-base text-slate-600 leading-relaxed max-w-[62ch]">
              結合瀏覽器原生 Python 執行引擎、單步呼叫堆疊追蹤與參數互動視覺化，從基礎變數一路掌握到遞迴與資料結構。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectLesson(ALL_LESSONS[0])}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              從 1.1 開始學習
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSandbox}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              開啟自由沙盒
            </button>
            <button
              type="button"
              onClick={onOpenQuiz}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              觀念測驗練習
            </button>
          </div>
        </div>

        {/* Interactive Learning Progress & Preview Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-display font-semibold text-slate-900">
                你的學習進度
              </h2>
              <span className="font-mono text-sm font-semibold text-sky-700 tabular-nums">
                {completedCount} / {totalCount} 單元 ({progressPct}%)
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              每完成一個單元的自動單元測試驗證，系統會自動記錄學習進度。
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-4 text-left">
            <div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Code2 className="w-3.5 h-3.5 text-sky-600" />
                <span>即時執行</span>
              </div>
              <div className="font-display font-bold text-lg text-slate-900 tabular-nums">
                {totalCount} 關卡
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <Eye className="w-3.5 h-3.5 text-sky-600" />
                <span>單步追蹤</span>
              </div>
              <div className="font-display font-bold text-lg text-slate-900">
                記憶體視覺化
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
                <span>觀念測驗</span>
              </div>
              <div className="font-display font-bold text-lg text-slate-900 tabular-nums">
                6 題精選
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Modules */}
      <section className="space-y-8">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-900">
              完整課程地圖
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              依序完成五個核心模組，或直接點擊任何單元進入程式編輯與單步追蹤模式
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            共 {MODULES.length} 大章節 · {totalCount} 個實作單元
          </div>
        </div>

        <div className="space-y-10">
          {MODULES.map((mod) => {
            const doneInMod = mod.lessons.filter((l) =>
              completedIds.includes(l.id)
            ).length;

            return (
              <div key={mod.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <h3 className="text-lg font-display font-semibold text-slate-900">
                      {mod.order}. {mod.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-0.5">{mod.subtitle}</p>
                  </div>
                  <div className="text-xs font-mono text-slate-500 tabular-nums whitespace-nowrap">
                    已完成 {doneInMod} / {mod.lessons.length}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mod.lessons.map((lesson) => {
                    const isDone = completedIds.includes(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-sky-300 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span>
                              單元 {lesson.orderLabel} · {lesson.difficultyLabel} ·{' '}
                              {lesson.durationLabel}
                            </span>
                            {isDone && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold whitespace-nowrap shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                已通過
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-display font-semibold text-slate-900">
                            {lesson.title}
                          </h4>
                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                            {lesson.summary}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectLesson(lesson, false)}
                            className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            進入練習
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectLesson(lesson, true)}
                            className="text-xs font-medium text-slate-500 hover:text-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            直接視覺化追蹤
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
