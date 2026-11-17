import React, { useMemo, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import type { ExplorerKind } from '../types/python';

interface ConceptExplorerProps {
  kind: ExplorerKind;
  onApplySnippet: (snippet: string) => void;
}

export const ConceptExplorer: React.FC<ConceptExplorerProps> = ({
  kind,
  onApplySnippet,
}) => {
  if (kind === 'range') return <RangeExplorer onApplySnippet={onApplySnippet} />;
  if (kind === 'slice') return <SliceExplorer onApplySnippet={onApplySnippet} />;
  if (kind === 'branch') return <BranchExplorer onApplySnippet={onApplySnippet} />;
  if (kind === 'fstring') return <FStringExplorer onApplySnippet={onApplySnippet} />;
  return <RecursionExplorer onApplySnippet={onApplySnippet} />;
};

const RangeExplorer: React.FC<{ onApplySnippet: (s: string) => void }> = ({
  onApplySnippet,
}) => {
  const [start, setStart] = useState(2);
  const [stop, setStop] = useState(21);
  const [step, setStep] = useState(2);

  const values = useMemo(() => {
    const out: number[] = [];
    if (step > 0) {
      for (let i = start; i < stop && out.length < 16; i += step) out.push(i);
    } else if (step < 0) {
      for (let i = start; i > stop && out.length < 16; i += step) out.push(i);
    }
    return out;
  }, [start, stop, step]);

  const codePreview = `even_sum = 0\nfor n in range(${start}, ${stop}, ${step}):\n    even_sum += n\n\nprint("序列：", list(range(${start}, ${stop}, ${step})))\nprint("總和：", even_sum)`;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            互動實驗：range(start, stop, step)
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            拖動參數滑桿，觀察半開區間與步長如何決定輸出序列
          </p>
        </div>
        <button
          type="button"
          onClick={() => onApplySnippet(codePreview)}
          className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          套用到編輯器
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="block text-xs">
          <span className="flex justify-between font-medium text-slate-700 mb-1">
            <span>起點 start</span>
            <span className="font-mono tabular-nums text-sky-700">{start}</span>
          </span>
          <input
            type="range"
            min={0}
            max={10}
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>

        <label className="block text-xs">
          <span className="flex justify-between font-medium text-slate-700 mb-1">
            <span>終點 stop (不含)</span>
            <span className="font-mono tabular-nums text-sky-700">{stop}</span>
          </span>
          <input
            type="range"
            min={5}
            max={25}
            value={stop}
            onChange={(e) => setStop(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>

        <label className="block text-xs">
          <span className="flex justify-between font-medium text-slate-700 mb-1">
            <span>步長 step</span>
            <span className="font-mono tabular-nums text-sky-700">{step}</span>
          </span>
          <input
            type="range"
            min={1}
            max={5}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <div className="text-xs font-mono text-slate-500 mb-2">
          range({start}, {stop}, {step}) → 共 {values.length} 個數字
        </div>
        <div className="flex flex-wrap gap-1.5">
          {values.length === 0 ? (
            <span className="text-xs text-slate-500">空序列（起點已超過終點）</span>
          ) : (
            values.map((v, idx) => (
              <span
                key={`${v}-${idx}`}
                className="inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-md bg-sky-50 border border-sky-200 font-mono text-xs font-semibold text-sky-800 tabular-nums"
              >
                {v}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const SLICE_LETTERS = ['P', 'Y', 'C', 'R', 'A', 'F', 'T'];

const SliceExplorer: React.FC<{ onApplySnippet: (s: string) => void }> = ({
  onApplySnippet,
}) => {
  const [start, setStart] = useState(2);
  const [stop, setStop] = useState(5);
  const [step, setStep] = useState(1);

  const selectedIndices = useMemo(() => {
    const indices: number[] = [];
    if (step > 0) {
      for (let i = start; i < stop && i < SLICE_LETTERS.length; i += step) {
        if (i >= 0) indices.push(i);
      }
    } else if (step < 0) {
      for (let i = Math.min(start, SLICE_LETTERS.length - 1); i > stop && i >= 0; i += step) {
        indices.push(i);
      }
    }
    return indices;
  }, [start, stop, step]);

  const expr = step === 1 ? `letters[${start}:${stop}]` : `letters[${start}:${stop}:${step}]`;
  const snippet = `letters = ["P", "Y", "C", "R", "A", "F", "T"]\nmiddle = ${expr}\nreversed_letters = letters[::-1]\n\nprint("目前切片：", middle)\nprint("反轉結果：", reversed_letters)`;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            互動實驗：串列索引與切片視覺尺
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            切換切片範圍，觀察正向索引 (0~6) 與負向索引 (-7~-1) 的選取狀態
          </p>
        </div>
        <button
          type="button"
          onClick={() => onApplySnippet(snippet)}
          className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          套用到編輯器
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <label className="block text-xs">
          <span className="flex justify-between font-medium text-slate-700 mb-1">
            <span>start</span>
            <span className="font-mono tabular-nums text-sky-700">{start}</span>
          </span>
          <input
            type="range"
            min={0}
            max={6}
            value={start}
            onChange={(e) => setStart(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
        <label className="block text-xs">
          <span className="flex justify-between font-medium text-slate-700 mb-1">
            <span>stop</span>
            <span className="font-mono tabular-nums text-sky-700">{stop}</span>
          </span>
          <input
            type="range"
            min={0}
            max={7}
            value={stop}
            onChange={(e) => setStop(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
        <label className="block text-xs">
          <span className="flex justify-between font-medium text-slate-700 mb-1">
            <span>step</span>
            <span className="font-mono tabular-nums text-sky-700">{step}</span>
          </span>
          <input
            type="range"
            min={1}
            max={3}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto">
        <div className="grid grid-cols-7 gap-1.5 min-w-[320px] text-center">
          {SLICE_LETTERS.map((ch, idx) => {
            const selected = selectedIndices.includes(idx);
            return (
              <div key={idx} className="space-y-1">
                <div className="text-[11px] font-mono text-slate-400 tabular-nums">{idx}</div>
                <div
                  className={`h-10 rounded-md flex items-center justify-center font-mono text-sm font-semibold transition-colors ${
                    selected
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {ch}
                </div>
                <div className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {idx - SLICE_LETTERS.length}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-600">{expr}</span>
          <span className="text-sky-700 font-semibold">
            {JSON.stringify(selectedIndices.map((i) => SLICE_LETTERS[i]))}
          </span>
        </div>
      </div>
    </div>
  );
};

const BranchExplorer: React.FC<{ onApplySnippet: (s: string) => void }> = ({
  onApplySnippet,
}) => {
  const [score, setScore] = useState(83);

  const activeBranch =
    score >= 90 ? 0 : score >= 80 ? 1 : score >= 70 ? 2 : 3;

  const branches = [
    { cond: 'if score >= 90:', grade: 'A' },
    { cond: 'elif score >= 80:', grade: 'B' },
    { cond: 'elif score >= 70:', grade: 'C' },
    { cond: 'else:', grade: 'D' },
  ];

  const snippet = `def classify_score(score):\n    if score >= 90:\n        return "A"\n    elif score >= 80:\n        return "B"\n    elif score >= 70:\n        return "C"\n    else:\n        return "D"\n\nprint("測試分數 ${score} -> 等第", classify_score(${score}))`;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            互動實驗：條件分支路徑追蹤
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            調整分數滑桿，觀察 Python 由上而下命中第一個成立條件的流程
          </p>
        </div>
        <button
          type="button"
          onClick={() => onApplySnippet(snippet)}
          className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          套用到編輯器
        </button>
      </div>

      <label className="block text-xs">
        <span className="flex justify-between font-medium text-slate-700 mb-1">
          <span>輸入測驗分數 score</span>
          <span className="font-mono tabular-nums text-sky-700 font-semibold">
            {score} 分
          </span>
        </span>
        <input
          type="range"
          min={45}
          max={100}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-full accent-sky-600 cursor-pointer"
        />
      </label>

      <div className="space-y-1.5 font-mono text-xs">
        {branches.map((b, idx) => {
          const hit = idx === activeBranch;
          const skipped = idx > activeBranch;
          return (
            <div
              key={b.cond}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                hit
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                  : skipped
                  ? 'bg-slate-100/70 border-slate-200 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <span>
                {b.cond} return &quot;{b.grade}&quot;
              </span>
              <span className="text-[11px] font-sans">
                {hit ? '✓ 命中此分支' : skipped ? '略過不執行' : '✕ 條件不符'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const FStringExplorer: React.FC<{ onApplySnippet: (s: string) => void }> = ({
  onApplySnippet,
}) => {
  const [price, setPrice] = useState(2480);
  const [discount, setDiscount] = useState(0.85);
  const finalPrice = price * discount;

  const snippet = `item = "藍牙機械鍵盤"\nprice = ${price}\ndiscount = ${discount.toFixed(2)}\n\nfinal_price = price * discount\nsummary = f"{item} 折扣後為 {final_price:.0f} 元"\nprint(summary)`;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            互動實驗：f-string 即時格式化預覽
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            修改定價與折數，即時對照 `{`{final_price:.0f}`}` 與 `{`{final_price:.2f}`}` 的差異
          </p>
        </div>
        <button
          type="button"
          onClick={() => onApplySnippet(snippet)}
          className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          套用到編輯器
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="flex justify-between font-medium text-slate-700 mb-1">
            <span>定價 price</span>
            <span className="font-mono tabular-nums text-sky-700">{price}</span>
          </span>
          <input
            type="range"
            min={500}
            max={5000}
            step={20}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
        <label className="block text-xs">
          <span className="flex justify-between font-medium text-slate-700 mb-1">
            <span>折扣 discount</span>
            <span className="font-mono tabular-nums text-sky-700">
              {discount.toFixed(2)}
            </span>
          </span>
          <input
            type="range"
            min={0.5}
            max={0.95}
            step={0.05}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-full accent-sky-600 cursor-pointer"
          />
        </label>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-1.5 text-xs font-mono">
        <div className="flex justify-between text-slate-600">
          <span>{'f"{final_price:.0f} 元"'}</span>
          <span className="text-slate-900 font-semibold">
            {finalPrice.toFixed(0)} 元
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>{'f"{final_price:.2f} 元"'}</span>
          <span className="text-sky-700 font-semibold">
            {finalPrice.toFixed(2)} 元
          </span>
        </div>
      </div>
    </div>
  );
};

const RecursionExplorer: React.FC<{ onApplySnippet: (s: string) => void }> = ({
  onApplySnippet,
}) => {
  const [n, setN] = useState(4);

  const levels = useMemo(() => {
    const items: Array<{ arg: number; result: number }> = [];
    let acc = 1;
    for (let i = 1; i <= n; i++) {
      acc *= i;
      items.push({ arg: i, result: acc });
    }
    return items.reverse();
  }, [n]);

  const snippet = `def factorial(n):\n    if n <= 1:\n        return 1\n    sub = factorial(n - 1)\n    return n * sub\n\nans = factorial(${n})\nprint("${n}! =", ans)`;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            互動實驗：遞迴深度與回傳展開圖
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            調整 n 的大小，預覽呼叫堆疊深度與逐層回傳乘積
          </p>
        </div>
        <button
          type="button"
          onClick={() => onApplySnippet(snippet)}
          className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-white border border-sky-200 hover:bg-sky-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          套用到編輯器
        </button>
      </div>

      <label className="block text-xs">
        <span className="flex justify-between font-medium text-slate-700 mb-1">
          <span>遞迴輸入值 n</span>
          <span className="font-mono tabular-nums text-sky-700">n = {n}</span>
        </span>
        <input
          type="range"
          min={1}
          max={6}
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          className="w-full accent-sky-600 cursor-pointer"
        />
      </label>

      <div className="space-y-1.5">
        {levels.map((lv, idx) => (
          <div
            key={lv.arg}
            className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono"
            style={{ marginLeft: `${idx * 10}px` }}
          >
            <span className="text-slate-800">
              factorial({lv.arg})
              {lv.arg <= 1 && (
                <span className="ml-2 text-emerald-700 font-sans font-medium">
                  Base Case
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5 text-sky-700 font-semibold tabular-nums">
              <ArrowRight className="w-3 h-3 text-slate-400" />
              {lv.result}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
