import React, { useMemo, useRef } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (next: string) => void;
  activeLine?: number | null;
  onRunShortcut?: () => void;
  minHeight?: number;
}

const PY_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]);

const PY_BUILTINS = new Set([
  'abs', 'all', 'any', 'bool', 'dict', 'enumerate', 'float', 'input', 'int',
  'len', 'list', 'max', 'min', 'print', 'range', 'round', 'set', 'sorted',
  'str', 'sum', 'tuple', 'type', 'zip',
]);

function highlightPythonLine(line: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const tokenRegex =
    /(#.*$)|((?:f|r|b)?(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'))|(\b\d+(?:\.\d+)?\b)|(\b[A-Za-z_]\w*\b)/gm;

  let lastIdx = 0;
  let match: RegExpExecArray | null;
  let keyCounter = 0;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      nodes.push(line.slice(lastIdx, match.index));
    }
    const [full, comment, str, num, ident] = match;
    if (comment) {
      nodes.push(
        <span key={keyCounter++} className="text-slate-500 italic">
          {comment}
        </span>
      );
    } else if (str) {
      nodes.push(
        <span key={keyCounter++} className="text-emerald-300">
          {str}
        </span>
      );
    } else if (num) {
      nodes.push(
        <span key={keyCounter++} className="text-amber-300">
          {num}
        </span>
      );
    } else if (ident) {
      if (PY_KEYWORDS.has(ident)) {
        nodes.push(
          <span key={keyCounter++} className="text-sky-400 font-medium">
            {ident}
          </span>
        );
      } else if (PY_BUILTINS.has(ident)) {
        nodes.push(
          <span key={keyCounter++} className="text-cyan-300">
            {ident}
          </span>
        );
      } else {
        nodes.push(ident);
      }
    } else {
      nodes.push(full);
    }
    lastIdx = match.index + full.length;
  }

  if (lastIdx < line.length) {
    nodes.push(line.slice(lastIdx));
  }
  if (nodes.length === 0) {
    nodes.push('\u200B');
  }
  return nodes;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  activeLine = null,
  onRunShortcut,
  minHeight = 310,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = useMemo(() => value.split('\n'), [value]);

  const handleScroll = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onRunShortcut?.();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineText = value.slice(lineStart, end);
        if (lineText.startsWith('    ')) {
          const next = value.slice(0, lineStart) + value.slice(lineStart + 4);
          onChange(next);
          requestAnimationFrame(() => {
            ta.selectionStart = Math.max(lineStart, start - 4);
            ta.selectionEnd = Math.max(lineStart, end - 4);
          });
        }
      } else {
        const next = value.slice(0, start) + '    ' + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 4;
        });
      }
      return;
    }

    if (e.key === 'Enter') {
      const start = ta.selectionStart;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.slice(lineStart, start);
      const indentMatch = /^(\s*)/.exec(currentLine);
      let indent = indentMatch ? indentMatch[1] : '';
      if (currentLine.trimEnd().endsWith(':')) {
        indent += '    ';
      }
      if (indent.length > 0) {
        e.preventDefault();
        const end = ta.selectionEnd;
        const next = value.slice(0, start) + '\n' + indent + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 1 + indent.length;
        });
      }
    }
  };

  return (
    <div
      className="relative flex bg-slate-950 text-slate-100 rounded-b-xl overflow-hidden font-mono text-[13.5px] leading-[22px]"
      style={{ height: `${minHeight}px` }}
    >
      {/* Line number gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="w-12 shrink-0 select-none overflow-hidden bg-slate-900/90 border-r border-slate-800 py-3 text-right text-xs leading-[22px] text-slate-500 tabular-nums"
      >
        {lines.map((_, idx) => {
          const lineNo = idx + 1;
          const isActive = activeLine === lineNo;
          return (
            <div
              key={lineNo}
              className={`px-2.5 flex items-center justify-end gap-1 ${
                isActive ? 'bg-amber-500/20 text-amber-300 font-semibold' : ''
              }`}
            >
              {isActive && <span className="text-[10px]">▶</span>}
              <span>{lineNo}</span>
            </div>
          );
        })}
      </div>

      {/* Layered highlight + transparent editable textarea */}
      <div className="relative flex-1 overflow-hidden">
        <pre
          ref={preRef}
          aria-hidden="true"
          className="editor-scroll pointer-events-none absolute inset-0 m-0 overflow-auto py-3 px-4 font-mono text-[13.5px] leading-[22px] whitespace-pre text-slate-100"
        >
          {lines.map((line, idx) => {
            const lineNo = idx + 1;
            const isActive = activeLine === lineNo;
            return (
              <div
                key={lineNo}
                className={
                  isActive
                    ? 'bg-amber-500/15 -mx-4 px-4 rounded-sm'
                    : undefined
                }
              >
                {highlightPythonLine(line)}
              </div>
            );
          })}
        </pre>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label="Python 程式碼編輯器"
          className="code-input editor-scroll relative z-10 h-full w-full resize-none overflow-auto bg-transparent py-3 px-4 font-mono text-[13.5px] leading-[22px] text-transparent caret-sky-400 focus:outline-none whitespace-pre"
        />
      </div>
    </div>
  );
};
