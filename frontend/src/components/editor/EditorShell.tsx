'use client';

import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFormProject } from '@/hooks/useFormProject';
import { useCompileJob } from '@/hooks/useCompileJob';
import { formToModel } from '@/lib/formToModel';
import FormEditor from '@/components/form/FormEditor';
import PreviewPane from './PreviewPane';
import { api } from '@/lib/api';
import type { DocPreview, PreviewBlock, PreviewSection } from '@/lib/parsePreview';
import type { PaperForm } from '@/types/paper-form';

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Build a rich, ordered DocPreview from the form (no Markdown parsing needed). */
function formToPreview(form: PaperForm): DocPreview {
  // Defensive: treat any missing arrays as empty so stale localStorage never crashes
  const safeSections    = Array.isArray(form?.sections)    ? form.sections    : [];
  const safeAuthors     = Array.isArray(form?.authors)     ? form.authors     : [];
  const safeReferences  = Array.isArray(form?.references)  ? form.references  : [];

  const blocks: PreviewBlock[] = [];
  const sections: PreviewSection[] = [];
  let figCount = 0;
  let eqCount  = 0;

  safeSections.forEach((s, i) => {
    const roman = ROMAN[i] ?? String(i + 1);
    let subLetter = 0;
    let subNum = 0;

    if (s.heading?.trim()) {
      blocks.push({ kind: 'heading', level: 1, text: s.heading.trim(), numbering: roman });
      // Keep the flat sections list for the footer stats / warnings
      const paragraphs = (s.content ?? [])
        .filter(it => it.kind === 'paragraph' && (it as { text?: string }).text?.trim())
        .map(it => (it as { text: string }).text.trim());
      sections.push({ level: 1, text: s.heading, numbering: roman, paragraphs });
    }

    (s.content ?? []).forEach(item => {
      switch (item.kind) {
        case 'paragraph':
          if (item.text?.trim()) blocks.push({ kind: 'paragraph', text: item.text.trim() });
          break;
        case 'subsection':
          if (item.text?.trim()) {
            const numbering = item.level === 2
              ? (LETTERS[subLetter++] ?? '')
              : String(++subNum);
            if (item.level === 2) subNum = 0;
            blocks.push({ kind: 'heading', level: item.level, text: item.text.trim(), numbering });
            sections.push({ level: item.level, text: item.text });
          }
          break;
        case 'figure':
          if (item.imageRef) {
            figCount++;
            blocks.push({
              kind: 'figure',
              label: `Fig. ${figCount}`,
              caption: item.caption?.trim() ?? '',
              imageUrl: api.imageUrl(item.imageRef),
              wide: item.wide,
            });
          }
          break;
        case 'equation':
          if (item.latex?.trim()) {
            eqCount++;
            blocks.push({ kind: 'equation', label: `(${eqCount})`, latex: item.latex.trim() });
          }
          break;
        case 'list':
          if (item.items?.some(x => x.trim())) {
            blocks.push({ kind: 'list', style: item.style, items: item.items.filter(x => x.trim()) });
          }
          break;
      }
    });
  });

  const namedReferences = safeReferences.filter(r => r.title?.trim());
  const referenceCount = namedReferences.length;
  const references = namedReferences.map((r, i) => {
    const authors = (r.authors ?? '').split(',').map(a => a.trim()).filter(Boolean);
    const parts = [
      authors.join(', '),
      `"${r.title.trim()}"`,
      r.venue?.trim() && `in ${r.venue.trim()}`,
      r.year?.trim(),
    ].filter(Boolean);
    return { key: String(i + 1), text: parts.join(', ') + '.' };
  });

  const title    = form?.title    ?? '';
  const abstract = form?.abstract ?? '';
  const keywords = form?.keywords ?? '';

  const warnings: string[] = [];
  if (!title.trim())    warnings.push('Missing title');
  if (!abstract.trim()) warnings.push('Missing abstract');
  if (!keywords.trim()) warnings.push('Missing keywords');
  if (safeAuthors.every(a => !a.name?.trim())) warnings.push('No authors added');

  const hasContent = !!(title || abstract || safeSections.some(s => s.heading));

  return {
    title,
    authors: safeAuthors.map(a => a.name).filter(Boolean),
    abstract,
    keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    sections,
    blocks,
    figureCount: figCount,
    tableCount: 0,
    equationCount: eqCount,
    referenceCount,
    references,
    warnings,
    hasContent,
  };
}

export default function EditorShell() {
  const project    = useFormProject();
  const compileJob = useCompileJob();

  // Bootstrap: create a project if none in localStorage. On failure the error
  // is surfaced via project.projectError (see the banner below) instead of
  // being silently swallowed — retrying is just clicking Compile again.
  useEffect(() => {
    if (!project.isReady) return;
    if (!project.projectId) {
      project.initProject().catch(() => { /* surfaced via project.projectError */ });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.isReady]);

  const preview = useMemo(() => formToPreview(project.form), [project.form]);

  const handleCompile = async () => {
    // Self-heal: create a project on the fly if bootstrap failed or the
    // stored projectId is stale, instead of silently doing nothing.
    const id = await project.ensureProject().catch(() => null);
    if (!id) return;
    const model = formToModel(project.form);
    await compileJob.compile(id, model);
  };

  if (!project.isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      className="flex h-screen overflow-hidden bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left pane — form editor */}
      <div className="w-[40%] min-w-0 border-r border-gray-200 flex flex-col overflow-hidden">
        <FormEditor
          form={project.form}
          saveStatus={project.saveStatus}
          savedProjects={project.savedProjects}
          onChange={project.handleFormChange}
          onUploadImage={project.uploadImage}
          onNewProject={() => project.initProject()}
          onLoadProject={project.loadProject}
        />
      </div>

      {/* Right pane — live preview + compile */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <PreviewPane
          preview={preview}
          compileState={compileJob}
          projectId={project.projectId}
          projectError={project.projectError}
          onCompile={handleCompile}
          onReset={compileJob.reset}
        />
      </div>
    </motion.div>
  );
}
