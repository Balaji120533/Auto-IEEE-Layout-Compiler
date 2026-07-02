'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { PaperForm } from '@/types/paper-form';
import type { SaveStatus, SavedProject } from '@/hooks/useProject';
import PaperInfoForm from './PaperInfoForm';
import AuthorForm from './AuthorForm';
import ContentBuilder from './ContentBuilder';
import ReferenceForm from './ReferenceForm';

interface Props {
  form: PaperForm;
  saveStatus: SaveStatus;
  savedProjects: SavedProject[];
  onChange: (patch: Partial<PaperForm>) => void;
  onUploadImage: (file: File) => Promise<{ ref: string; filename: string }>;
  onNewProject: () => void;
  onLoadProject: (id: string) => void;
}

type Tab = 'info' | 'authors' | 'content' | 'references';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'info',       label: 'Paper',      emoji: '📄' },
  { id: 'authors',    label: 'Authors',    emoji: '👥' },
  { id: 'content',    label: 'Content',    emoji: '✏️' },
  { id: 'references', label: 'References', emoji: '📚' },
];

const SAVE_LABEL: Record<SaveStatus, { text: string; color: string }> = {
  saved:   { text: 'Saved',   color: 'text-green-500' },
  saving:  { text: 'Saving…', color: 'text-yellow-500' },
  unsaved: { text: 'Unsaved', color: 'text-gray-400'  },
  error:   { text: 'Error',   color: 'text-red-500'   },
};

export default function FormEditor({
  form, saveStatus, savedProjects,
  onChange, onUploadImage, onNewProject, onLoadProject,
}: Props) {
  const [tab, setTab] = useState<Tab>('info');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { text: saveText, color: saveColor } = SAVE_LABEL[saveStatus];

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          title="Saved papers"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="flex-1 text-sm font-medium text-gray-700 truncate">
          {form.title || 'New Paper'}
        </span>
        <span className={`text-[11px] ${saveColor}`}>{saveText}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'relative flex-1 py-2.5 text-[11px] font-medium transition-colors',
              tab === t.id ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600',
            ].join(' ')}
          >
            <span className="mr-1">{t.emoji}</span>{t.label}
            {tab === t.id && (
              <motion.div
                layoutId="form-tab-line"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab content — scrollable */}
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-4 min-h-0">
        {tab === 'info' && (
          <PaperInfoForm form={form} onChange={onChange} />
        )}
        {tab === 'authors' && (
          <AuthorForm form={form} onChange={onChange} />
        )}
        {tab === 'content' && (
          <ContentBuilder form={form} onChange={onChange} onUploadImage={onUploadImage} />
        )}
        {tab === 'references' && (
          <ReferenceForm form={form} onChange={onChange} />
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={onNewProject}
          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          + New Paper
        </button>
        <span className="text-[11px] text-gray-400">
          {form.sections.length} section{form.sections.length !== 1 ? 's' : ''} · {form.references.length} ref{form.references.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Saved projects sidebar */}
      {sidebarOpen && (
        <motion.div
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute inset-0 z-30 flex"
        >
          <div className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Saved Papers</span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 scroll-thin">
              {savedProjects.length === 0
                ? <p className="text-xs text-gray-400 px-4 py-3 italic">No saved papers yet</p>
                : savedProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onLoadProject(p.id); setSidebarOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-700 truncate">{p.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(p.savedAt).toLocaleDateString()}</p>
                  </button>
                ))
              }
            </div>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => { onNewProject(); setSidebarOpen(false); }}
                className="w-full py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
              >
                + New Paper
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/20" onClick={() => setSidebarOpen(false)} />
        </motion.div>
      )}
    </div>
  );
}
