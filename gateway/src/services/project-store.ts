import { randomUUID } from 'crypto';

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  markdown?: string;
  imageRefs: string[];  // refs like "projectId/filename.png"
}

const store = new Map<string, Project>();

export const projectStore = {
  create(): Project {
    const project: Project = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      imageRefs: [],
    };
    store.set(project.id, project);
    return project;
  },

  get(id: string): Project | undefined {
    return store.get(id);
  },

  update(id: string, patch: Partial<Pick<Project, 'markdown'>>): Project | undefined {
    const p = store.get(id);
    if (!p) return undefined;
    const updated: Project = { ...p, ...patch, updatedAt: new Date().toISOString() };
    store.set(id, updated);
    return updated;
  },

  addImageRef(id: string, ref: string): Project | undefined {
    const p = store.get(id);
    if (!p) return undefined;
    const updated: Project = {
      ...p,
      imageRefs: [...p.imageRefs, ref],
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  },
};
