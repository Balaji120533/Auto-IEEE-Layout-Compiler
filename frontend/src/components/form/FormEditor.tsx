'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
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

function IconDoc() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
    </svg>
  );
}
function IconBook() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

const TABS: { id: Tab; label: string; Icon: () => React.JSX.Element }[] = [
  { id: 'info',       label: 'Paper',      Icon: IconDoc },
  { id: 'authors',    label: 'Authors',    Icon: IconUsers },
  { id: 'content',    label: 'Content',    Icon: IconEdit },
  { id: 'references', label: 'References', Icon: IconBook },
];

const SAVE_LABEL: Record<SaveStatus, { text: string; color: string }> = {
  saved:   { text: 'Saved',   color: 'text-gray-400' },
  saving:  { text: 'Saving…', color: 'text-gray-400' },
  unsaved: { text: 'Unsaved', color: 'text-gray-400' },
  error:   { text: 'Error',   color: 'text-red-500'  },
};

export default function FormEditor({
  form, saveStatus, savedProjects,
  onChange, onUploadImage, onNewProject, onLoadProject,
}: Props) {
  const [tab, setTab] = useState<Tab>('info');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { text: saveText, color: saveColor } = SAVE_LABEL[saveStatus];
  const { data: session } = useSession();
  const user = session?.user;
  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

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
              'relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors',
              tab === t.id ? 'text-black' : 'text-gray-400 hover:text-gray-600',
            ].join(' ')}
          >
            <t.Icon />{t.label}
            {tab === t.id && (
              <motion.div
                layoutId="form-tab-line"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
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
            <div className="p-3 border-t border-gray-100 space-y-2">
              <button
                onClick={() => { onNewProject(); setSidebarOpen(false); }}
                className="w-full py-2.5 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
              >
                + New Paper
              </button>

              {user && (
                <div className="relative">
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                      >
                        <button
                          onClick={() => { setProfileMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => setProfileMenuOpen(o => !o)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{user.name || 'Account'}</p>
                      <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="flex-shrink-0 text-gray-300">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 bg-black/20" onClick={() => { setSidebarOpen(false); setProfileMenuOpen(false); }} />
        </motion.div>
      )}
    </div>
  );
}
