export interface VariableEntry {
  name: string;
  typeName: string;
  repr: string;
  kind: 'primitive' | 'list' | 'dict' | 'tuple' | 'set' | 'function' | 'other';
  items?: Array<{ key?: string; value: string; typeName: string }>;
  changed?: boolean;
}

export interface StackFrame {
  id: string;
  name: string;
  line: number;
  locals: VariableEntry[];
}

export interface ExecutionStep {
  stepIndex: number;
  line: number;
  event: 'line' | 'call' | 'return' | 'exception';
  functionName: string;
  callStack: StackFrame[];
  globals: VariableEntry[];
  stdout: string;
  returnValue?: string;
  errorMessage?: string;
}

export interface TestCaseResult {
  id: string;
  label: string;
  passed: boolean;
  expected: string;
  actual: string;
  error?: string;
}

export interface RunResult {
  success: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
  engine: 'pyodide' | 'builtin';
  steps: ExecutionStep[];
  testResults?: TestCaseResult[];
}

export type ExplorerKind = 'range' | 'slice' | 'branch' | 'fstring' | 'recursion';

export interface LessonTest {
  id: string;
  label: string;
  description: string;
  /** Python snippet appended after user code; should print a JSON marker or raise AssertionError */
  testCode: string;
  expectedSummary: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  moduleTitle: string;
  orderLabel: string;
  title: string;
  durationLabel: string;
  difficultyLabel: string;
  summary: string;
  conceptPoints: string[];
  explorerKind?: ExplorerKind;
  starterCode: string;
  solutionCode: string;
  hint: string;
  defaultStdin?: string;
  tests: LessonTest[];
}

export interface ModuleGroup {
  id: string;
  order: string;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}

export interface SandboxPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  code: string;
  stdin?: string;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  difficulty: string;
  prompt: string;
  code: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
