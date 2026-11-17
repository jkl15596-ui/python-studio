import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { CONCEPT_QUIZZES } from '../data/quizzes';

interface QuizViewProps {
  onTestInSandbox: (code: string, title: string) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ onTestInSandbox }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [activeIdx, setActiveIdx] = useState(0);

  const current = CONCEPT_QUIZZES[activeIdx];
  const selected = answers[current.id];
  const isAnswered = selected !== undefined;
  const isCorrect = selected === current.correctIndex;

  const answeredCount = Object.keys(answers).length;
  const correctCount = CONCEPT_QUIZZES.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;

  const handleSelect = (optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: optionIdx }));
  };

  const handleResetAll = () => {
    setAnswers({});
    setActiveIdx(0);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Python 核心觀念互動測驗
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            先預測程式執行結果，再點擊「在沙盒中實測」親自驗證每一個細節
          </p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="font-mono tabular-nums text-slate-700">
            答對 {correctCount} / {CONCEPT_QUIZZES.length} 題（已作答 {answeredCount} 題）
          </span>
          <button
            type="button"
            onClick={handleResetAll}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重新作答
          </button>
        </div>
      </div>

      {/* Question Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CONCEPT_QUIZZES.map((q, idx) => {
          const ans = answers[q.id];
          const done = ans !== undefined;
          const ok = ans === q.correctIndex;
          const active = idx === activeIdx;

          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setActiveIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                active
                  ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                  : done
                  ? ok
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              第 {idx + 1} 題
              {done ? (ok ? ' · ✓' : ' · ✕') : ''}
            </button>
          );
        })}
      </div>

      {/* Active Quiz Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <div className="text-xs text-slate-500">
            主題：{current.topic} · {current.difficulty}
          </div>
          <h2 className="text-lg font-display font-semibold text-slate-900">
            {activeIdx + 1}. {current.prompt}
          </h2>
        </div>

        <pre className="bg-slate-950 text-slate-100 rounded-xl p-4 font-mono text-sm leading-relaxed overflow-x-auto">
          {current.code}
        </pre>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {current.options.map((opt, idx) => {
            const isChosen = selected === idx;
            const isRightOption = idx === current.correctIndex;

            let optionStyle =
              'bg-white border-slate-200 text-slate-800 hover:border-sky-400 hover:bg-sky-50/40';
            if (isAnswered) {
              if (isRightOption) {
                optionStyle =
                  'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold';
              } else if (isChosen && !isRightOption) {
                optionStyle = 'bg-red-50 border-red-300 text-red-900';
              } else {
                optionStyle = 'bg-slate-50 border-slate-200 text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`text-left px-4 py-3 rounded-xl border text-sm font-mono transition-colors flex items-center justify-between gap-2 cursor-pointer ${optionStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && isRightOption && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                {isAnswered && isChosen && !isRightOption && (
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div
            className={`rounded-xl border p-4 space-y-3 ${
              isCorrect
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-sm font-semibold flex items-center gap-1.5 ${
                  isCorrect ? 'text-emerald-800' : 'text-amber-900'
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    ✓ 答對了！觀念非常正確
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-600" />
                    ✕ 再想一下，正確答案是 {current.options[current.correctIndex]}
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={() =>
                  onTestInSandbox(current.code, `觀念實測：${current.topic}`)
                }
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                在沙盒中實測這段程式
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              {current.explanation}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            disabled={activeIdx === 0}
            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            上一題
          </button>
          <button
            type="button"
            disabled={activeIdx >= CONCEPT_QUIZZES.length - 1}
            onClick={() =>
              setActiveIdx((i) => Math.min(CONCEPT_QUIZZES.length - 1, i + 1))
            }
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            下一題
          </button>
        </div>
      </div>
    </div>
  );
};
