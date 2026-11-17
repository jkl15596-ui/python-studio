import React, { useEffect, useState } from 'react';
import { ALL_LESSONS } from './data/curriculum';
import { warmUpPyodide } from './engine/pythonRunner';
import type { Lesson } from './types/python';
import { CurriculumView } from './components/CurriculumView';
import { QuizView } from './components/QuizView';
import { TopNav, type AppSection } from './components/TopNav';
import {
  WorkspaceView,
  type OutputTab,
  type WorkspaceMode,
} from './components/WorkspaceView';

const STORAGE_KEY = 'pycraft_completed_lessons_v1';

export function App() {
  const [section, setSection] = useState<AppSection>('curriculum');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('lesson');
  const [outputTab, setOutputTab] = useState<OutputTab>('console');
  const [activeLesson, setActiveLesson] = useState<Lesson>(ALL_LESSONS[0]);
  const [customSandboxSeed, setCustomSandboxSeed] = useState<{
    title: string;
    code: string;
    stdin?: string;
  } | null>(null);

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    // Pre-warm Pyodide CPython WASM silently in background
    warmUpPyodide();
  }, []);

  const handleMarkCompleted = (lessonId: string) => {
    setCompletedIds((prev) => {
      if (prev.includes(lessonId)) return prev;
      const next = [...prev, lessonId];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  };

  const handleNavigate = (next: AppSection) => {
    setSection(next);
    if (next === 'sandbox') {
      setWorkspaceMode('sandbox');
      setOutputTab('console');
    } else if (next === 'visualizer') {
      setOutputTab('visualizer');
    }
  };

  const handleSelectLesson = (lesson: Lesson, openVisualizer = false) => {
    setActiveLesson(lesson);
    setWorkspaceMode('lesson');
    setOutputTab(openVisualizer ? 'visualizer' : 'console');
    setSection(openVisualizer ? 'visualizer' : 'sandbox');
  };

  const handleQuickStart = () => {
    const firstIncomplete =
      ALL_LESSONS.find((l) => !completedIds.includes(l.id)) ?? ALL_LESSONS[0];
    handleSelectLesson(firstIncomplete, false);
  };

  const handleTestInSandbox = (code: string, title: string) => {
    setCustomSandboxSeed({ title, code });
    setWorkspaceMode('sandbox');
    setOutputTab('visualizer');
    setSection('sandbox');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopNav
        activeSection={section}
        onNavigate={handleNavigate}
        onQuickStart={handleQuickStart}
      />

      <main className="flex-1">
        {section === 'curriculum' && (
          <CurriculumView
            completedIds={completedIds}
            onSelectLesson={handleSelectLesson}
            onOpenSandbox={() => {
              setWorkspaceMode('sandbox');
              setOutputTab('console');
              setSection('sandbox');
            }}
            onOpenQuiz={() => setSection('quiz')}
          />
        )}

        {(section === 'sandbox' || section === 'visualizer') && (
          <WorkspaceView
            mode={workspaceMode}
            onModeChange={setWorkspaceMode}
            activeLesson={activeLesson}
            onSelectLesson={(lesson) => setActiveLesson(lesson)}
            completedIds={completedIds}
            onMarkCompleted={handleMarkCompleted}
            outputTab={outputTab}
            onOutputTabChange={(tab) => {
              setOutputTab(tab);
              setSection(tab === 'visualizer' ? 'visualizer' : 'sandbox');
            }}
            customSandboxSeed={customSandboxSeed}
          />
        )}

        {section === 'quiz' && (
          <QuizView onTestInSandbox={handleTestInSandbox} />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>PyCraft 互動程式學院 · Python 視覺化學習平台</span>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setSection('curriculum')}
              className="hover:text-slate-900 cursor-pointer"
            >
              課程地圖
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('sandbox')}
              className="hover:text-slate-900 cursor-pointer"
            >
              程式沙盒
            </button>
            <button
              type="button"
              onClick={() => setSection('quiz')}
              className="hover:text-slate-900 cursor-pointer"
            >
              觀念測驗
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
