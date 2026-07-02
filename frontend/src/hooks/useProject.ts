'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

const LS_CURRENT = 'ieee-current';
const LS_LIST    = 'ieee-projects';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface SavedProject {
  id: string;
  title: string;
  savedAt: string;
}

export function useProject() {
  const [projectId, setProjectId]   = useState<string | null>(null);
  const [markdown, setMarkdown]     = useState('');
  const [imageRefs, setImageRefs]   = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isReady, setIsReady]       = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(LS_CURRENT);
    if (raw) {
      try {
        const { id, markdown: md, imageRefs: refs } = JSON.parse(raw);
        setProjectId(id);
        setMarkdown(md ?? '');
        setImageRefs(refs ?? []);
      } catch { /* ignore */ }
    }

    const list = localStorage.getItem(LS_LIST);
    if (list) {
      try { setSavedProjects(JSON.parse(list)); } catch { /* ignore */ }
    }

    setIsReady(true);
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    if (!isReady || !projectId) return;
    localStorage.setItem(LS_CURRENT, JSON.stringify({ id: projectId, markdown, imageRefs }));
  }, [isReady, projectId, markdown, imageRefs]);

  const initProject = useCallback(async () => {
    const project = await api.createProject();
    setProjectId(project.id);
    setMarkdown('');
    setImageRefs([]);
    setSaveStatus('saved');

    const newEntry: SavedProject = {
      id: project.id,
      title: 'Untitled',
      savedAt: new Date().toISOString(),
    };
    setSavedProjects(prev => {
      const updated = [newEntry, ...prev].slice(0, 10);
      localStorage.setItem(LS_LIST, JSON.stringify(updated));
      return updated;
    });

    return project.id;
  }, []);

  const loadProject = useCallback(async (id: string) => {
    const project = await api.getProject(id);
    setProjectId(project.id);
    setMarkdown(project.markdown ?? '');
    setImageRefs(project.imageRefs ?? []);
    setSaveStatus('saved');
  }, []);

  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdown(value);
    setSaveStatus('unsaved');

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const id = projectId;
      if (!id) return;
      setSaveStatus('saving');
      try {
        await api.saveMarkdown(id, value);
        setSaveStatus('saved');

        // Update title in project list from front matter
        const titleMatch = value.match(/^title:\s*(.+)$/m);
        const title = titleMatch?.[1].trim().replace(/^['"]|['"]$/g, '') ?? 'Untitled';
        setSavedProjects(prev => {
          const updated = prev.map(p => p.id === id ? { ...p, title, savedAt: new Date().toISOString() } : p);
          localStorage.setItem(LS_LIST, JSON.stringify(updated));
          return updated;
        });
      } catch {
        setSaveStatus('error');
      }
    }, 1200);
  }, [projectId]);

  const uploadImage = useCallback(async (file: File) => {
    if (!projectId) throw new Error('No active project');
    const result = await api.uploadImage(projectId, file);
    setImageRefs(prev => [...prev, result.ref]);
    return result;
  }, [projectId]);

  return {
    projectId,
    markdown,
    imageRefs,
    saveStatus,
    isReady,
    savedProjects,
    initProject,
    loadProject,
    handleMarkdownChange,
    uploadImage,
  };
}
