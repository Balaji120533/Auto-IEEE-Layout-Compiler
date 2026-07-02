'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { emptyForm } from '@/types/paper-form';
import type { PaperForm } from '@/types/paper-form';
import type { SavedProject } from './useProject';

const LS_FORM    = 'ieee-form';
const LS_PROJECT = 'ieee-project-id';
const LS_LIST    = 'ieee-projects';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

/** Merge stored JSON with the default structure so stale/partial data never
 *  produces missing fields (e.g. sections without content arrays). */
function mergeForm(stored: unknown): PaperForm {
  const base = emptyForm();
  if (!stored || typeof stored !== 'object') return base;
  const s = stored as Partial<PaperForm>;
  return {
    ...base,
    ...s,
    // Ensure every section has a content array
    sections: Array.isArray(s.sections)
      ? s.sections.map(sec => ({
          id: sec.id ?? '',
          heading: sec.heading ?? '',
          content: Array.isArray(sec.content) ? sec.content : [],
        }))
      : base.sections,
    authors:      Array.isArray(s.authors)      ? s.authors      : base.authors,
    affiliations: Array.isArray(s.affiliations) ? s.affiliations : base.affiliations,
    references:   Array.isArray(s.references)   ? s.references   : base.references,
  };
}

export function useFormProject() {
  const [projectId, setProjectId]   = useState<string | null>(null);
  const [form, setForm]             = useState<PaperForm>(emptyForm);
  const [imageRefs, setImageRefs]   = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [isReady, setIsReady]       = useState(false);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [projectError, setProjectError] = useState<string | null>(null);

  // Ref holds the latest form so the auto-save timer reads it without stale closure
  const latestForm   = useRef<PaperForm>(emptyForm());
  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore on mount
  useEffect(() => {
    const pid = localStorage.getItem(LS_PROJECT);
    if (pid) setProjectId(pid);

    const raw = localStorage.getItem(LS_FORM);
    if (raw) {
      try {
        const restored = mergeForm(JSON.parse(raw));
        setForm(restored);
        latestForm.current = restored;
      } catch { /* ignore corrupt data */ }
    }

    const list = localStorage.getItem(LS_LIST);
    if (list) {
      try { setSavedProjects(JSON.parse(list)); } catch { /* ignore */ }
    }

    setIsReady(true);
  }, []);

  // Persist form to localStorage on every change
  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(LS_FORM, JSON.stringify(form));
    if (projectId) localStorage.setItem(LS_PROJECT, projectId);
  }, [isReady, form, projectId]);

  const initProject = useCallback(async () => {
    let project;
    try {
      project = await api.createProject();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not reach the server';
      setProjectError(`Failed to start a new project: ${msg}. Check that the gateway is running, then retry.`);
      throw err;
    }
    setProjectError(null);
    const blank = emptyForm();
    setProjectId(project.id);
    setForm(blank);
    latestForm.current = blank;
    setImageRefs([]);
    setSaveStatus('saved');

    const entry: SavedProject = { id: project.id, title: 'New Paper', savedAt: new Date().toISOString() };
    setSavedProjects(prev => {
      const updated = [entry, ...prev].slice(0, 10);
      localStorage.setItem(LS_LIST, JSON.stringify(updated));
      return updated;
    });

    return project.id;
  }, []);

  const loadProject = useCallback(async (id: string) => {
    const raw = localStorage.getItem(`ieee-form-${id}`);
    const loaded = raw ? (() => { try { return mergeForm(JSON.parse(raw)); } catch { return emptyForm(); } })() : emptyForm();
    setForm(loaded);
    latestForm.current = loaded;
    setProjectId(id);
    setSaveStatus('saved');
  }, []);

  const handleFormChange = useCallback((patch: Partial<PaperForm>) => {
    // Pure state update — no side effects inside the updater
    setForm(prev => {
      const next = { ...prev, ...patch };
      latestForm.current = next;
      return next;
    });
    setSaveStatus('unsaved');

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const id = projectId;
      if (!id) return;
      setSaveStatus('saving');
      const snapshot = latestForm.current;
      try {
        localStorage.setItem(`ieee-form-${id}`, JSON.stringify(snapshot));
        const title = snapshot.title || 'Untitled';
        setSavedProjects(prev => {
          const updated = prev.map(p => p.id === id ? { ...p, title, savedAt: new Date().toISOString() } : p);
          localStorage.setItem(LS_LIST, JSON.stringify(updated));
          return updated;
        });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 800);
  }, [projectId]);

  /** Ensure a project exists on the gateway, creating one if needed. Used
   *  before any action (upload, compile) that requires a live projectId —
   *  so a stale/missing project never permanently blocks those actions. */
  const ensureProject = useCallback(async (): Promise<string> => {
    if (projectId) return projectId;
    const p = await api.createProject();
    setProjectId(p.id);
    localStorage.setItem(LS_PROJECT, p.id);
    setProjectError(null);
    return p.id;
  }, [projectId]);

  const uploadImage = useCallback(async (file: File) => {
    const id = await ensureProject();
    try {
      const result = await api.uploadImage(id, file);
      setImageRefs(prev => [...prev, result.ref]);
      return result;
    } catch (err) {
      // The gateway keeps projects in memory only — a restart drops them, leaving
      // a stale projectId in localStorage. On 404, recreate the project and retry.
      const status = (err as { status?: number }).status;
      if (status === 404) {
        const p = await api.createProject();
        setProjectId(p.id);
        localStorage.setItem(LS_PROJECT, p.id);
        const result = await api.uploadImage(p.id, file);
        setImageRefs(prev => [...prev, result.ref]);
        return result;
      }
      throw err;
    }
  }, [ensureProject]);

  return {
    projectId,
    projectError,
    form,
    imageRefs,
    saveStatus,
    isReady,
    savedProjects,
    initProject,
    loadProject,
    handleFormChange,
    uploadImage,
    ensureProject,
  };
}
