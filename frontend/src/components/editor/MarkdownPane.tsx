'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SaveStatus, SavedProject } from '@/hooks/useProject';
import type { DocPreview } from '@/lib/parsePreview';

interface Props {
  markdown: string;
  preview: DocPreview;
  saveStatus: SaveStatus;
  imageRefs: string[];
  savedProjects: SavedProject[];
  onMarkdownChange: (value: string) => void;
  onUploadImage: (file: File) => Promise<{ ref: string; filename: string }>;
  onNewProject: () => void;
  onLoadProject: (id: string) => void;
}

const SAVE_LABELS: Record<SaveStatus, { text: string; color: string }> = {
  saved:   { text: 'Saved',   color: 'text-green-500' },
  saving:  { text: 'Saving…', color: 'text-yellow-500' },
  unsaved: { text: 'Unsaved', color: 'text-gray-400' },
  error:   { text: 'Save error', color: 'text-red-500' },
};

export default function MarkdownPane({
  markdown,
  preview,
  saveStatus,
  imageRefs,
  savedProjects,
  onMarkdownChange,
  onUploadImage,
  onNewProject,
  onLoadProject,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const figCounter = useRef(0);

  // Reset figure counter whenever imageRefs changes
  useEffect(() => {
    figCounter.current = imageRefs.length;
  }, [imageRefs]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;

    setUploading(true);
    setUploadError(null);
    try {
      for (const file of files) {
        const { ref } = await onUploadImage(file);
        figCounter.current += 1;
        const n = figCounter.current;
        const snippet = `\n[FIG ${n}](${ref}): Caption for figure ${n}.\n`;
        const ta = textareaRef.current;
        if (ta) {
          const start = ta.selectionStart ?? markdown.length;
          const next = markdown.slice(0, start) + snippet + markdown.slice(start);
          onMarkdownChange(next);
          setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + snippet.length; }, 0);
        } else {
          onMarkdownChange(markdown + snippet);
        }
      }
    } catch (err: any) {
      setUploadError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [markdown, onMarkdownChange, onUploadImage]);

  const { text: saveText, color: saveColor } = SAVE_LABELS[saveStatus];

  return (
    <div
      className="relative flex flex-col h-full bg-white"
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          title="Projects"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700 truncate flex-1">
          {preview.title || 'New Paper'}
        </span>
        <span className={`text-[11px] ${saveColor}`}>{saveText}</span>
      </div>

      {/* Structure outline (middle) */}
      <div className="flex-1 overflow-y-auto scroll-thin px-4 py-3 min-h-0">
        {!preview.hasContent ? (
          <div className="text-xs text-gray-400 italic mt-2">
            Structure outline will appear here as you type…
          </div>
        ) : (
          <div className="space-y-0.5">
            {/* Stats row */}
            <div className="flex gap-3 mb-3 flex-wrap">
              {[
                { label: 'Figs',  val: preview.figureCount },
                { label: 'Tables', val: preview.tableCount },
                { label: 'Eqs',   val: preview.equationCount },
                { label: 'Refs',  val: preview.referenceCount },
              ].map(({ label, val }) => (
                <span key={label} className="text-[11px] text-gray-500">
                  <strong className="text-gray-700">{val}</strong> {label}
                </span>
              ))}
            </div>

            {/* Heading outline */}
            {preview.sections.map((sec, i) => (
              <div
                key={i}
                className={[
                  'text-[11px] text-gray-600 py-0.5 truncate',
                  sec.level === 1 ? 'font-semibold uppercase' : '',
                  sec.level === 2 ? 'pl-3 italic' : '',
                  sec.level === 3 ? 'pl-6 text-gray-400' : '',
                ].join(' ')}
              >
                {sec.numbering ? `${sec.numbering}. ${sec.text}` : sec.text}
              </div>
            ))}

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <div className="mt-3 space-y-1">
                {preview.warnings.map((w, i) => (
                  <div key={i} className="text-[10px] text-amber-600 flex gap-1.5">
                    <span>⚠</span><span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {imageRefs.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Uploaded images</p>
            {imageRefs.map((ref, i) => (
              <div key={i} className="text-[11px] text-blue-500 font-mono truncate">
                {ref.split('/').pop()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Markdown textarea (bottom) */}
      <div className="border-t border-gray-200 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={e => onMarkdownChange(e.target.value)}
          placeholder={`Paste your Markdown draft here.\n\nStart with front matter:\n---\ntitle: Your Paper Title\nabstract: |\n  Your abstract text...\nkeywords:\n  - keyword1\n---`}
          className="w-full resize-none font-mono text-[12px] leading-relaxed text-gray-800 placeholder-gray-300 focus:outline-none px-4 py-3 scroll-thin"
          style={{ height: '38vh', background: '#fafafa' }}
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-white">
        <button
          onClick={onNewProject}
          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          + New Paper
        </button>
        {uploading && <span className="text-[11px] text-blue-500">Uploading image…</span>}
        {uploadError && <span className="text-[11px] text-red-500">{uploadError}</span>}
        <span className="text-[11px] text-gray-400">{markdown.length} chars</span>
      </div>

      {/* Drag-over overlay */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-400 flex flex-col items-center justify-center z-20 pointer-events-none"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <p className="text-sm text-blue-600 font-medium mt-2">Drop image to upload</p>
            <p className="text-xs text-blue-400">A [FIG n] anchor will be inserted</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved projects sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            className="absolute inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30 flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Saved Papers</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin py-2">
              {savedProjects.length === 0 ? (
                <p className="text-xs text-gray-400 px-4 py-2 italic">No saved papers yet</p>
              ) : (
                savedProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { onLoadProject(p.id); setSidebarOpen(false); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50"
                  >
                    <p className="text-sm text-gray-700 truncate font-medium">{p.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(p.savedAt).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => { onNewProject(); setSidebarOpen(false); }}
                className="w-full py-2 text-sm text-center text-white bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors"
              >
                + New Paper
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
