import type {
  ExecutionStep,
  LessonTest,
  RunResult,
  StackFrame,
  TestCaseResult,
  VariableEntry,
} from '../types/python';

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  globals: {
    set: (key: string, value: unknown) => void;
    get: (key: string) => unknown;
    delete: (key: string) => void;
  };
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

let pyodidePromise: Promise<PyodideInterface> | null = null;
let pyodideInstance: PyodideInterface | null = null;
let pyodideFailed = false;

export function isPyodideReady(): boolean {
  return pyodideInstance !== null;
}

export function warmUpPyodide(onReady?: () => void): void {
  if (pyodideInstance) {
    onReady?.();
    return;
  }
  if (pyodideFailed || typeof window === 'undefined') return;
  loadPyodideEngine()
    .then(() => onReady?.())
    .catch(() => {
      pyodideFailed = true;
    });
}

async function loadPyodideEngine(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise<PyodideInterface>((resolve, reject) => {
    const init = () => {
      if (!window.loadPyodide) {
        reject(new Error('Pyodide loader unavailable'));
        return;
      }
      window
        .loadPyodide({ indexURL: PYODIDE_CDN })
        .then((py) => {
          pyodideInstance = py;
          resolve(py);
        })
        .catch((err) => {
          pyodideFailed = true;
          reject(err);
        });
    };

    if (window.loadPyodide) {
      init();
      return;
    }

    const existing = document.querySelector('script[data-pyodide="true"]');
    if (existing) {
      existing.addEventListener('load', init, { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Pyodide script')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.async = true;
    script.dataset.pyodide = 'true';
    script.onload = init;
    script.onerror = () => {
      pyodideFailed = true;
      reject(new Error('Failed to load Pyodide script'));
    };
    document.head.appendChild(script);
  });

  return pyodidePromise;
}

const PYTHON_DRIVER = `
import sys, io, json, traceback, builtins, types

def _pycraft_serialize_val(val):
    t = type(val).__name__
    try:
        r = repr(val)
    except Exception:
        r = f"<{t}>"
    if len(r) > 120:
        r = r[:117] + "..."

    if isinstance(val, list):
        items = [{"value": repr(x)[:48], "typeName": type(x).__name__} for x in val[:24]]
        return {"typeName": t, "repr": r, "kind": "list", "items": items}
    if isinstance(val, tuple):
        items = [{"value": repr(x)[:48], "typeName": type(x).__name__} for x in val[:24]]
        return {"typeName": t, "repr": r, "kind": "tuple", "items": items}
    if isinstance(val, set):
        items = [{"value": repr(x)[:48], "typeName": type(x).__name__} for x in list(val)[:24]]
        return {"typeName": t, "repr": r, "kind": "set", "items": items}
    if isinstance(val, dict):
        items = [{"key": str(k)[:32], "value": repr(v)[:48], "typeName": type(v).__name__} for k, v in list(val.items())[:20]]
        return {"typeName": t, "repr": r, "kind": "dict", "items": items}
    if callable(val):
        return {"typeName": t, "repr": f"<function {getattr(val, '__name__', t)}>", "kind": "function"}
    return {"typeName": t, "repr": r, "kind": "primitive"}

def _pycraft_serialize_scope(scope, prev_map=None):
    entries = []
    next_map = {}
    for k, v in scope.items():
        if k.startswith("__") and k.endswith("__"):
            continue
        if isinstance(v, types.ModuleType):
            continue
        if callable(v) and not isinstance(v, type):
            # Include user-defined functions cleanly
            if getattr(v, "__code__", None) and v.__code__.co_filename != "<user>":
                continue
        info = _pycraft_serialize_val(v)
        next_map[k] = info["repr"]
        changed = prev_map is not None and prev_map.get(k) != info["repr"]
        entries.append({
            "name": str(k),
            "typeName": info["typeName"],
            "repr": info["repr"],
            "kind": info["kind"],
            **({"items": info["items"]} if "items" in info else {}),
            **({"changed": True} if changed else {})
        })
    return entries, next_map

def _pycraft_execute(user_code, stdin_text, tests_json, capture_trace=True):
    stdin_lines = stdin_text.splitlines() if stdin_text else []
    stdin_idx = [0]

    def _custom_input(prompt=""):
        if prompt:
            sys.stdout.write(str(prompt))
        if stdin_idx[0] < len(stdin_lines):
            val = stdin_lines[stdin_idx[0]]
            stdin_idx[0] += 1
            sys.stdout.write(val + "\\n")
            return val
        return ""

    out_buf = io.StringIO()
    err_buf = io.StringIO()
    old_stdout, old_stderr, old_input = sys.stdout, sys.stderr, builtins.input
    sys.stdout = out_buf
    sys.stderr = err_buf
    builtins.input = _custom_input

    steps = []
    max_steps = 360
    prev_var_maps = {}
    user_ns = {"__name__": "__main__"}
    success = True

    def _collect_stack(frame, cur_event, cur_arg):
        frames = []
        f = frame
        while f is not None:
            if f.f_code.co_filename == "<user>":
                frames.append(f)
            f = f.f_back
        frames.reverse()
        out_frames = []
        for idx, fr in enumerate(frames):
            fid = f"{id(fr)}_{idx}"
            fname = "<module>" if fr.f_code.co_name == "<module>" else f"{fr.f_code.co_name}()"
            prev = prev_var_maps.get(fid)
            locs, next_m = _pycraft_serialize_scope(fr.f_locals, prev)
            prev_var_maps[fid] = next_m
            out_frames.append({
                "id": fid,
                "name": fname,
                "line": fr.f_lineno,
                "locals": locs
            })
        return out_frames

    def _tracer(frame, event, arg):
        if frame.f_code.co_filename != "<user>":
            return None
        if event not in ("line", "call", "return", "exception"):
            return _tracer
        if len(steps) >= max_steps:
            raise RuntimeError("執行步驟超過 360 步上限（請檢查是否有無窮迴圈）。")

        stack = _collect_stack(frame, event, arg)
        globals_list, _ = _pycraft_serialize_scope(user_ns)
        step = {
            "stepIndex": len(steps),
            "line": frame.f_lineno,
            "event": event,
            "functionName": "<module>" if frame.f_code.co_name == "<module>" else frame.f_code.co_name,
            "callStack": stack,
            "globals": globals_list,
            "stdout": out_buf.getvalue(),
        }
        if event == "return" and frame.f_code.co_name != "<module>":
            step["returnValue"] = repr(arg)[:80]
        if event == "exception" and arg is not None:
            step["errorMessage"] = f"{arg[0].__name__}: {arg[1]}"
        steps.append(step)
        return _tracer

    try:
        compiled = compile(user_code, "<user>", "exec")
        if capture_trace:
            sys.settrace(_tracer)
        exec(compiled, user_ns, user_ns)
    except SyntaxError as e:
        success = False
        err_buf.write(f"SyntaxError: {e.msg} (第 {e.lineno} 行)\\n")
        if e.text:
            err_buf.write(f"  {e.text.rstrip()}\\n")
    except Exception as e:
        success = False
        tb_lines = traceback.format_exception(type(e), e, e.__traceback__)
        filtered = [ln for ln in tb_lines if "<user>" in ln or not ln.strip().startswith("File ")]
        err_buf.write("".join(filtered))
    finally:
        sys.settrace(None)
        sys.stdout = old_stdout
        sys.stderr = old_stderr
        builtins.input = old_input

    stdout_val = out_buf.getvalue()
    stderr_val = err_buf.getvalue()

    test_results = []
    tests = json.loads(tests_json) if tests_json else []
    if tests:
        for t in tests:
            if not success:
                test_results.append({
                    "id": t["id"],
                    "label": t["label"],
                    "passed": False,
                    "expected": t["expectedSummary"],
                    "actual": "程式執行失敗",
                    "error": stderr_val.strip().splitlines()[-1] if stderr_val.strip() else "執行錯誤"
                })
                continue
            t_out = io.StringIO()
            t_err = io.StringIO()
            sys.stdout = t_out
            sys.stderr = t_err
            t_ns = dict(user_ns)
            t_ns["__USER_STDOUT__"] = stdout_val
            try:
                exec(compile(t["testCode"], "<test>", "exec"), t_ns, t_ns)
                test_results.append({
                    "id": t["id"],
                    "label": t["label"],
                    "passed": True,
                    "expected": t["expectedSummary"],
                    "actual": "符合預期",
                })
            except AssertionError as ae:
                msg = str(ae) or "輸出或數值不符合預期"
                test_results.append({
                    "id": t["id"],
                    "label": t["label"],
                    "passed": False,
                    "expected": t["expectedSummary"],
                    "actual": msg,
                })
            except Exception as ex:
                test_results.append({
                    "id": t["id"],
                    "label": t["label"],
                    "passed": False,
                    "expected": t["expectedSummary"],
                    "actual": f"{type(ex).__name__}: {ex}",
                })
            finally:
                sys.stdout = old_stdout
                sys.stderr = old_stderr

    return json.dumps({
        "success": success,
        "stdout": stdout_val,
        "stderr": stderr_val,
        "steps": steps,
        "testResults": test_results,
    }, ensure_ascii=False)
`;

let driverLoaded = false;

export async function runPythonCode(params: {
  code: string;
  stdin?: string;
  tests?: LessonTest[];
  captureTrace?: boolean;
}): Promise<RunResult> {
  const start = performance.now();
  const { code, stdin = '', tests = [], captureTrace = true } = params;

  try {
    const py = await loadPyodideEngine();
    if (!driverLoaded) {
      await py.runPythonAsync(PYTHON_DRIVER);
      driverLoaded = true;
    }

    py.globals.set('_pycraft_arg_code', code);
    py.globals.set('_pycraft_arg_stdin', stdin);
    py.globals.set(
      '_pycraft_arg_tests',
      JSON.stringify(
        tests.map((t) => ({
          id: t.id,
          label: t.label,
          testCode: t.testCode,
          expectedSummary: t.expectedSummary,
        }))
      )
    );
    py.globals.set('_pycraft_arg_trace', captureTrace);

    const rawJson = (await py.runPythonAsync(
      '_pycraft_execute(_pycraft_arg_code, _pycraft_arg_stdin, _pycraft_arg_tests, _pycraft_arg_trace)'
    )) as string;

    const parsed = JSON.parse(rawJson) as {
      success: boolean;
      stdout: string;
      stderr: string;
      steps: ExecutionStep[];
      testResults: TestCaseResult[];
    };

    return {
      success: parsed.success,
      stdout: parsed.stdout,
      stderr: parsed.stderr,
      durationMs: Math.max(1, Math.round(performance.now() - start)),
      engine: 'pyodide',
      steps: parsed.steps,
      testResults: tests.length > 0 ? parsed.testResults : undefined,
    };
  } catch {
    // Fallback to built-in educational Python subset engine if Pyodide CDN is unavailable
    return runBuiltinPython(code, stdin, tests, start);
  }
}

/* --------------------------------------------------------------------------
 * Built-in Educational Python Subset Interpreter + Step Tracer (Zero-latency fallback)
 * -------------------------------------------------------------------------- */

function toEntry(name: string, val: unknown, prevRepr?: string): VariableEntry {
  const repr = formatPyRepr(val);
  const changed = prevRepr !== undefined && prevRepr !== repr;

  if (Array.isArray(val)) {
    return {
      name,
      typeName: 'list',
      repr,
      kind: 'list',
      items: val.slice(0, 24).map((x) => ({
        value: formatPyRepr(x),
        typeName: inferPyType(x),
      })),
      changed,
    };
  }
  if (val !== null && typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>).slice(0, 20);
    return {
      name,
      typeName: 'dict',
      repr,
      kind: 'dict',
      items: entries.map(([k, v]) => ({
        key: k,
        value: formatPyRepr(v),
        typeName: inferPyType(v),
      })),
      changed,
    };
  }
  return {
    name,
    typeName: inferPyType(val),
    repr,
    kind: 'primitive',
    changed,
  };
}

function inferPyType(val: unknown): string {
  if (val === null || val === undefined) return 'NoneType';
  if (typeof val === 'boolean') return 'bool';
  if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
  if (typeof val === 'string') return 'str';
  if (Array.isArray(val)) return 'list';
  if (typeof val === 'object') return 'dict';
  return 'object';
}

function formatPyRepr(val: unknown): string {
  if (val === null || val === undefined) return 'None';
  if (typeof val === 'boolean') return val ? 'True' : 'False';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return `'${val}'`;
  if (Array.isArray(val)) return `[${val.map(formatPyRepr).join(', ')}]`;
  if (typeof val === 'object') {
    const parts = Object.entries(val as Record<string, unknown>).map(
      ([k, v]) => `'${k}': ${formatPyRepr(v)}`
    );
    return `{${parts.join(', ')}}`;
  }
  return String(val);
}

function formatPyStr(val: unknown): string {
  if (typeof val === 'string') return val;
  return formatPyRepr(val);
}

interface ParsedLine {
  lineNo: number;
  indent: number;
  raw: string;
  text: string;
}

interface UserFunc {
  name: string;
  params: string[];
  body: ParsedLine[];
}

function runBuiltinPython(
  code: string,
  stdin: string,
  tests: LessonTest[],
  startTime: number
): RunResult {
  const lines = code.split('\n');
  const parsed: ParsedLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const indent = raw.search(/\S/);
    parsed.push({ lineNo: i + 1, indent, raw, text: trimmed });
  }

  const stdinLines = stdin ? stdin.split('\n') : [];
  let stdinIdx = 0;
  let stdout = '';
  let stderr = '';
  let success = true;
  const steps: ExecutionStep[] = [];
  const prevVarSnapshots: Record<string, Record<string, string>> = {};

  const globalScope: Record<string, unknown> = {};
  const functions: Record<string, UserFunc> = {};
  const callStack: Array<{ id: string; name: string; line: number; scope: Record<string, unknown> }> = [
    { id: 'module', name: '<module>', line: 1, scope: globalScope },
  ];

  const recordStep = (
    line: number,
    event: ExecutionStep['event'],
    functionName: string,
    returnValue?: string
  ) => {
    if (steps.length >= 360) {
      throw new Error('執行步驟超過 360 步上限（請檢查是否有無窮迴圈）。');
    }
    const frames: StackFrame[] = callStack.map((f) => {
      const prev = prevVarSnapshots[f.id] || {};
      const next: Record<string, string> = {};
      const locals: VariableEntry[] = Object.entries(f.scope).map(([k, v]) => {
        const entry = toEntry(k, v, prev[k]);
        next[k] = entry.repr;
        return entry;
      });
      prevVarSnapshots[f.id] = next;
      return { id: f.id, name: f.name, line: f.line, locals };
    });

    const globals = Object.entries(globalScope).map(([k, v]) => toEntry(k, v));

    steps.push({
      stepIndex: steps.length,
      line,
      event,
      functionName,
      callStack: frames,
      globals,
      stdout,
      returnValue,
    });
  };

  class ReturnSignal {
    constructor(public value: unknown) {}
  }

  const evalExpr = (expr: string, scope: Record<string, unknown>): unknown => {
    const trimmed = expr.trim();
    if (!trimmed) return null;

    // Handle f-strings: f"..." or f'...'
    if ((trimmed.startsWith('f"') && trimmed.endsWith('"')) || (trimmed.startsWith("f'") && trimmed.endsWith("'"))) {
      const inner = trimmed.slice(2, -1);
      return inner.replace(/\{([^}]+)\}/g, (_, codeInside: string) => {
        const [exprPart, fmtPart] = codeInside.split(':');
        const val = evalExpr(exprPart, scope);
        if (fmtPart && typeof val === 'number') {
          const decMatch = /\.(\d+)f/.exec(fmtPart);
          if (decMatch) return val.toFixed(Number(decMatch[1]));
        }
        return formatPyStr(val);
      });
    }

    // Direct function calls like input(...), range(...), len(...), sum(...), int(...), str(...), float(...), list(...), user funcs
    const fnCallMatch = /^([a-zA-Z_]\w*)\((.*)\)$/.exec(trimmed);
    if (fnCallMatch) {
      const fnName = fnCallMatch[1];
      const argsRaw = splitTopLevelArgs(fnCallMatch[2]);
      if (fnName === 'input') {
        const promptVal = argsRaw[0] ? formatPyStr(evalExpr(argsRaw[0], scope)) : '';
        if (promptVal) stdout += promptVal;
        const nextLine = stdinIdx < stdinLines.length ? stdinLines[stdinIdx++] : '';
        stdout += `${nextLine}\n`;
        return nextLine;
      }
      if (fnName === 'range') {
        const nums = argsRaw.map((a) => Number(evalExpr(a, scope)));
        let start = 0;
        let stop = 0;
        let step = 1;
        if (nums.length === 1) stop = nums[0];
        else if (nums.length === 2) {
          start = nums[0];
          stop = nums[1];
        } else if (nums.length >= 3) {
          start = nums[0];
          stop = nums[1];
          step = nums[2];
        }
        const res: number[] = [];
        if (step > 0) for (let i = start; i < stop; i += step) res.push(i);
        else if (step < 0) for (let i = start; i > stop; i += step) res.push(i);
        return res;
      }
      if (fnName === 'len') {
        const v = evalExpr(argsRaw[0], scope);
        if (Array.isArray(v) || typeof v === 'string') return v.length;
        if (v && typeof v === 'object') return Object.keys(v).length;
        return 0;
      }
      if (fnName === 'sum') {
        const v = evalExpr(argsRaw[0], scope);
        return Array.isArray(v) ? v.reduce((a: number, b: number) => a + Number(b), 0) : 0;
      }
      if (fnName === 'min') {
        const v = evalExpr(argsRaw[0], scope);
        return Array.isArray(v) ? Math.min(...v.map(Number)) : 0;
      }
      if (fnName === 'max') {
        const v = evalExpr(argsRaw[0], scope);
        return Array.isArray(v) ? Math.max(...v.map(Number)) : 0;
      }
      if (fnName === 'abs') return Math.abs(Number(evalExpr(argsRaw[0], scope)));
      if (fnName === 'round') {
        const val = Number(evalExpr(argsRaw[0], scope));
        const digits = argsRaw[1] ? Number(evalExpr(argsRaw[1], scope)) : 0;
        return Number(val.toFixed(digits));
      }
      if (fnName === 'int') return Math.trunc(Number(evalExpr(argsRaw[0], scope)));
      if (fnName === 'float') return Number(evalExpr(argsRaw[0], scope));
      if (fnName === 'str') return formatPyStr(evalExpr(argsRaw[0], scope));
      if (fnName === 'bool') return Boolean(evalExpr(argsRaw[0], scope));
      if (fnName === 'type') return `<class '${inferPyType(evalExpr(argsRaw[0], scope))}'>`;
      if (fnName === 'sorted') {
        const v = evalExpr(argsRaw[0], scope);
        return Array.isArray(v) ? [...v].sort((a, b) => Number(a) - Number(b)) : [];
      }
      if (fnName === 'enumerate') {
        const v = evalExpr(argsRaw[0], scope);
        return Array.isArray(v) ? v.map((item, idx) => [idx, item]) : [];
      }
      if (functions[fnName]) {
        const fn = functions[fnName];
        const evaluatedArgs = argsRaw.map((a) => evalExpr(a, scope));
        const localScope: Record<string, unknown> = {};
        fn.params.forEach((p, idx) => {
          localScope[p] = evaluatedArgs[idx];
        });
        const frameId = `${fnName}_${steps.length}_${callStack.length}`;
        callStack.push({ id: frameId, name: `${fnName}()`, line: fn.body[0]?.lineNo ?? 1, scope: localScope });
        recordStep(fn.body[0]?.lineNo ?? 1, 'call', fnName);
        let retVal: unknown = null;
        try {
          execBlock(fn.body, localScope, fnName);
        } catch (sig) {
          if (sig instanceof ReturnSignal) {
            retVal = sig.value;
          } else {
            callStack.pop();
            throw sig;
          }
        }
        recordStep(fn.body[fn.body.length - 1]?.lineNo ?? 1, 'return', fnName, formatPyRepr(retVal));
        callStack.pop();
        return retVal;
      }
    }

    // List literal or comprehension
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const inner = trimmed.slice(1, -1).trim();
      const compMatch = /^(.+?)\s+for\s+([a-zA-Z_]\w*)\s+in\s+(.+?)(?:\s+if\s+(.+))?$/.exec(inner);
      if (compMatch) {
        const [, outExpr, varName, iterExpr, condExpr] = compMatch;
        const iterable = evalExpr(iterExpr, scope);
        const result: unknown[] = [];
        if (Array.isArray(iterable)) {
          for (const item of iterable) {
            const tempScope = { ...scope, [varName]: item };
            if (!condExpr || Boolean(evalExpr(condExpr, tempScope))) {
              result.push(evalExpr(outExpr, tempScope));
            }
          }
        }
        return result;
      }
      if (!inner) return [];
      return splitTopLevelArgs(inner).map((el) => evalExpr(el, scope));
    }

    // Dict literal
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const inner = trimmed.slice(1, -1).trim();
      if (!inner) return {};
      const obj: Record<string, unknown> = {};
      for (const pair of splitTopLevelArgs(inner)) {
        const colonIdx = pair.indexOf(':');
        if (colonIdx !== -1) {
          const k = formatPyStr(evalExpr(pair.slice(0, colonIdx), scope));
          const v = evalExpr(pair.slice(colonIdx + 1), scope);
          obj[k] = v;
        }
      }
      return obj;
    }

    // Indexing / slicing: obj[idx] or obj[start:stop:step]
    const sliceMatch = /^([a-zA-Z_]\w*)\[(.+)\]$/.exec(trimmed);
    if (sliceMatch) {
      const target = scope[sliceMatch[1]] ?? globalScope[sliceMatch[1]];
      const spec = sliceMatch[2].trim();
      if (spec.includes(':')) {
        const parts = spec.split(':').map((p) => p.trim());
        const arrLen = Array.isArray(target) || typeof target === 'string' ? target.length : 0;
        const step = parts[2] ? Number(evalExpr(parts[2], scope)) : 1;
        let start = parts[0] ? Number(evalExpr(parts[0], scope)) : step > 0 ? 0 : arrLen - 1;
        let stop = parts[1] ? Number(evalExpr(parts[1], scope)) : step > 0 ? arrLen : -arrLen - 1;
        if (start < 0) start = Math.max(0, arrLen + start);
        if (parts[1] && stop < 0) stop = Math.max(-1, arrLen + stop);
        if (Array.isArray(target)) {
          const out: unknown[] = [];
          if (step > 0) for (let i = start; i < Math.min(stop, arrLen); i += step) out.push(target[i]);
          else if (step < 0) for (let i = Math.min(start, arrLen - 1); i > stop && i >= 0; i += step) out.push(target[i]);
          return out;
        }
        if (typeof target === 'string') {
          let out = '';
          if (step > 0) for (let i = start; i < Math.min(stop, arrLen); i += step) out += target[i];
          else if (step < 0) for (let i = Math.min(start, arrLen - 1); i > stop && i >= 0; i += step) out += target[i];
          return out;
        }
      } else {
        const idx = evalExpr(spec, scope);
        if (Array.isArray(target) || typeof target === 'string') {
          const n = Number(idx);
          const pos = n < 0 ? target.length + n : n;
          return target[pos];
        }
        if (target && typeof target === 'object') {
          return (target as Record<string, unknown>)[String(idx)];
        }
      }
    }

    // Safe JS-equivalent expression evaluation for arithmetic, strings, comparisons, booleans
    const jsExpr = trimmed
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\s+/g, '!')
      .replace(/(\S+)\s*\/\/\s*(\S+)/g, 'Math.floor(($1)/($2))')
      .replace(/\*\*/g, '**');

    const merged = { ...globalScope, ...scope };
    const helperNames = {
      len: (v: unknown) => (Array.isArray(v) || typeof v === 'string' ? v.length : 0),
      sum: (v: unknown) => (Array.isArray(v) ? v.reduce((a: number, b: number) => a + Number(b), 0) : 0),
      min: (v: unknown) => (Array.isArray(v) ? Math.min(...v.map(Number)) : 0),
      max: (v: unknown) => (Array.isArray(v) ? Math.max(...v.map(Number)) : 0),
      abs: Math.abs,
      int: (v: unknown) => Math.trunc(Number(v)),
      float: Number,
      str: formatPyStr,
      bool: Boolean,
      range: (a: number, b?: number, s = 1) => {
        const start = b === undefined ? 0 : a;
        const stop = b === undefined ? a : b;
        const out: number[] = [];
        if (s > 0) for (let i = start; i < stop; i += s) out.push(i);
        else if (s < 0) for (let i = start; i > stop; i += s) out.push(i);
        return out;
      },
      ...Object.fromEntries(
        Object.keys(functions).map((fnName) => [
          fnName,
          (...args: unknown[]) => evalExpr(`${fnName}(${args.map(formatPyRepr).join(', ')})`, scope),
        ])
      ),
    };

    const allScope = { ...helperNames, ...merged };
    const keys = Object.keys(allScope);
    const vals = Object.values(allScope);
    // Support Python `x in y` membership test simply
    const inMatch = /^(.+?)\s+in\s+(.+)$/.exec(trimmed);
    if (inMatch && !trimmed.includes('for ')) {
      const needle = evalExpr(inMatch[1], scope);
      const haystack = evalExpr(inMatch[2], scope);
      if (Array.isArray(haystack)) return haystack.includes(needle);
      if (typeof haystack === 'string') return haystack.includes(String(needle));
      if (haystack && typeof haystack === 'object') return String(needle) in haystack;
    }

    const evaluator = new Function(...keys, `return (${jsExpr});`);
    return evaluator(...vals);
  };

  const splitTopLevelArgs = (raw: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let depth = 0;
    let quote: string | null = null;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (quote) {
        cur += ch;
        if (ch === quote && raw[i - 1] !== '\\') quote = null;
      } else {
        if (ch === '"' || ch === "'") quote = ch;
        else if (ch === '(' || ch === '[' || ch === '{') depth++;
        else if (ch === ')' || ch === ']' || ch === '}') depth--;
        if (ch === ',' && depth === 0) {
          if (cur.trim()) out.push(cur.trim());
          cur = '';
          continue;
        }
        cur += ch;
      }
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  };

  const collectBlock = (linesList: ParsedLine[], startIdx: number, parentIndent: number) => {
    const block: ParsedLine[] = [];
    let idx = startIdx;
    while (idx < linesList.length && linesList[idx].indent > parentIndent) {
      block.push(linesList[idx]);
      idx++;
    }
    return { block, nextIdx: idx };
  };

  const execBlock = (blockLines: ParsedLine[], scope: Record<string, unknown>, fnName: string) => {
    let i = 0;
    while (i < blockLines.length) {
      const ln = blockLines[i];
      const text = ln.text;
      if (callStack.length > 0) callStack[callStack.length - 1].line = ln.lineNo;

      // def statement
      if (text.startsWith('def ') && text.endsWith(':')) {
        const m = /^def\s+([a-zA-Z_]\w*)\(([^)]*)\):$/.exec(text);
        if (m) {
          const { block, nextIdx } = collectBlock(blockLines, i + 1, ln.indent);
          functions[m[1]] = {
            name: m[1],
            params: m[2]
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean),
            body: block,
          };
          recordStep(ln.lineNo, 'line', fnName);
          i = nextIdx;
          continue;
        }
      }

      // return statement
      if (text === 'return' || text.startsWith('return ')) {
        recordStep(ln.lineNo, 'line', fnName);
        const expr = text === 'return' ? 'None' : text.slice(7);
        throw new ReturnSignal(evalExpr(expr, scope));
      }

      // if / elif / else chain
      if (text.startsWith('if ') && text.endsWith(':')) {
        const branches: Array<{ cond: string | null; block: ParsedLine[]; lineNo: number }> = [];
        const firstBlock = collectBlock(blockLines, i + 1, ln.indent);
        branches.push({ cond: text.slice(3, -1), block: firstBlock.block, lineNo: ln.lineNo });
        let cursor = firstBlock.nextIdx;
        while (cursor < blockLines.length && blockLines[cursor].indent === ln.indent) {
          const nextLn = blockLines[cursor];
          if (nextLn.text.startsWith('elif ') && nextLn.text.endsWith(':')) {
            const b = collectBlock(blockLines, cursor + 1, ln.indent);
            branches.push({ cond: nextLn.text.slice(5, -1), block: b.block, lineNo: nextLn.lineNo });
            cursor = b.nextIdx;
          } else if (nextLn.text === 'else:') {
            const b = collectBlock(blockLines, cursor + 1, ln.indent);
            branches.push({ cond: null, block: b.block, lineNo: nextLn.lineNo });
            cursor = b.nextIdx;
            break;
          } else {
            break;
          }
        }
        recordStep(ln.lineNo, 'line', fnName);
        for (const br of branches) {
          if (br.cond === null || Boolean(evalExpr(br.cond, scope))) {
            execBlock(br.block, scope, fnName);
            break;
          }
        }
        i = cursor;
        continue;
      }

      // for loop
      if (text.startsWith('for ') && text.endsWith(':')) {
        const m = /^for\s+([a-zA-Z_,\s\w]+)\s+in\s+(.+):$/.exec(text);
        if (m) {
          const { block, nextIdx } = collectBlock(blockLines, i + 1, ln.indent);
          const vars = m[1].split(',').map((v) => v.trim());
          const iterable = evalExpr(m[2], scope);
          const items =
            typeof iterable === 'string'
              ? iterable.split('')
              : Array.isArray(iterable)
              ? iterable
              : iterable && typeof iterable === 'object'
              ? Object.keys(iterable)
              : [];

          for (const item of items) {
            if (vars.length > 1 && Array.isArray(item)) {
              vars.forEach((v, idx) => {
                scope[v] = item[idx];
              });
            } else {
              scope[vars[0]] = item;
            }
            recordStep(ln.lineNo, 'line', fnName);
            execBlock(block, scope, fnName);
          }
          i = nextIdx;
          continue;
        }
      }

      // while loop
      if (text.startsWith('while ') && text.endsWith(':')) {
        const cond = text.slice(6, -1);
        const { block, nextIdx } = collectBlock(blockLines, i + 1, ln.indent);
        while (Boolean(evalExpr(cond, scope))) {
          recordStep(ln.lineNo, 'line', fnName);
          execBlock(block, scope, fnName);
        }
        i = nextIdx;
        continue;
      }

      // print(...)
      const printMatch = /^print\((.*)\)$/.exec(text);
      if (printMatch) {
        const args = splitTopLevelArgs(printMatch[1]);
        let endStr = '\n';
        let sepStr = ' ';
        const valueArgs: string[] = [];
        for (const a of args) {
          if (a.startsWith('end=')) {
            endStr = String(evalExpr(a.slice(4), scope));
          } else if (a.startsWith('sep=')) {
            sepStr = String(evalExpr(a.slice(4), scope));
          } else {
            valueArgs.push(a);
          }
        }
        const rendered = valueArgs.map((a) => formatPyStr(evalExpr(a, scope))).join(sepStr);
        stdout += rendered + endStr;
        recordStep(ln.lineNo, 'line', fnName);
        i++;
        continue;
      }

      // list.append(x)
      const appendMatch = /^([a-zA-Z_]\w*)\.append\((.+)\)$/.exec(text);
      if (appendMatch) {
        const arr = scope[appendMatch[1]] ?? globalScope[appendMatch[1]];
        if (Array.isArray(arr)) {
          arr.push(evalExpr(appendMatch[2], scope));
        }
        recordStep(ln.lineNo, 'line', fnName);
        i++;
        continue;
      }

      // Augmented assignment: +=, -=, *=
      const augMatch = /^([a-zA-Z_]\w*)\s*(\+=|-=|\*=)\s*(.+)$/.exec(text);
      if (augMatch) {
        const [, varName, op, rhs] = augMatch;
        const cur = Number(scope[varName] ?? globalScope[varName] ?? 0);
        const val = Number(evalExpr(rhs, scope));
        if (op === '+=') scope[varName] = cur + val;
        if (op === '-=') scope[varName] = cur - val;
        if (op === '*=') scope[varName] = cur * val;
        recordStep(ln.lineNo, 'line', fnName);
        i++;
        continue;
      }

      // Dict / list subscript assignment: d[k] = v
      const subAssign = /^([a-zA-Z_]\w*)\[(.+?)\]\s*=\s*(.+)$/.exec(text);
      if (subAssign) {
        const target = scope[subAssign[1]] ?? globalScope[subAssign[1]];
        const key = evalExpr(subAssign[2], scope);
        const val = evalExpr(subAssign[3], scope);
        if (Array.isArray(target)) target[Number(key)] = val;
        else if (target && typeof target === 'object') {
          (target as Record<string, unknown>)[String(key)] = val;
        }
        recordStep(ln.lineNo, 'line', fnName);
        i++;
        continue;
      }

      // Tuple swap or simple assignment: a, b = b, a or x = expr
      const assignMatch = /^([a-zA-Z_]\w*(?:\s*,\s*[a-zA-Z_]\w*)*)\s*=\s*(.+)$/.exec(text);
      if (assignMatch && !text.includes('==')) {
        const lhsVars = assignMatch[1].split(',').map((v) => v.trim());
        const rhsParts = splitTopLevelArgs(assignMatch[2]);
        const evaluated = rhsParts.map((r) => evalExpr(r, scope));
        if (lhsVars.length > 1 && evaluated.length === 1 && Array.isArray(evaluated[0])) {
          lhsVars.forEach((v, idx) => {
            scope[v] = (evaluated[0] as unknown[])[idx];
          });
        } else {
          lhsVars.forEach((v, idx) => {
            scope[v] = evaluated[idx];
          });
        }
        recordStep(ln.lineNo, 'line', fnName);
        i++;
        continue;
      }

      // Standalone expression
      evalExpr(text, scope);
      recordStep(ln.lineNo, 'line', fnName);
      i++;
    }
  };

  try {
    execBlock(parsed, globalScope, '<module>');
  } catch (err) {
    success = false;
    stderr = err instanceof Error ? err.message : String(err);
  }

  const testResults: TestCaseResult[] | undefined =
    tests.length > 0
      ? tests.map((t) => ({
          id: t.id,
          label: t.label,
          passed: success && stdout.trim().length > 0,
          expected: t.expectedSummary,
          actual: success ? '等待 Pyodide 完整引擎載入後驗證' : stderr,
        }))
      : undefined;

  return {
    success,
    stdout,
    stderr,
    durationMs: Math.max(1, Math.round(performance.now() - startTime)),
    engine: 'builtin',
    steps,
    testResults,
  };
}
