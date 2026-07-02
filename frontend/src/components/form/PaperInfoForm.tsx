'use client';

import type { PaperForm } from '@/types/paper-form';

interface Props {
  form: PaperForm;
  onChange: (patch: Partial<PaperForm>) => void;
}

const label = 'block text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-1';
const input = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 transition-colors bg-white';

export default function PaperInfoForm({ form, onChange }: Props) {
  return (
    <div className="space-y-5 px-1">
      {/* Title */}
      <div>
        <label className={label}>Paper Title <span className="text-red-400">*</span></label>
        <input
          className={input}
          placeholder="e.g. Deep Learning for Edge Computing in IoT Networks"
          value={form.title}
          onChange={e => onChange({ title: e.target.value })}
        />
      </div>

      {/* Conference */}
      <div>
        <label className={label}>Conference / Journal <span className="text-gray-300">(optional)</span></label>
        <input
          className={input}
          placeholder="e.g. 2025 IEEE International Conference on Communications"
          value={form.conference}
          onChange={e => onChange({ conference: e.target.value })}
        />
      </div>

      {/* Abstract */}
      <div>
        <label className={label}>Abstract <span className="text-red-400">*</span></label>
        <textarea
          className={`${input} resize-none`}
          rows={6}
          placeholder="Paste or type your abstract here. IEEE typically requires 150–250 words."
          value={form.abstract}
          onChange={e => onChange({ abstract: e.target.value })}
        />
        <p className="text-[10px] text-gray-400 mt-1">{form.abstract.trim().split(/\s+/).filter(Boolean).length} words</p>
      </div>

      {/* Keywords */}
      <div>
        <label className={label}>Keywords <span className="text-red-400">*</span></label>
        <input
          className={input}
          placeholder="edge computing, deep learning, IoT, neural networks"
          value={form.keywords}
          onChange={e => onChange({ keywords: e.target.value })}
        />
        <p className="text-[10px] text-gray-400 mt-1">Separate with commas</p>
      </div>
    </div>
  );
}
