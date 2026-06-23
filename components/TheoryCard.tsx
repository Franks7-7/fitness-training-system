'use client';

import type { TrainingTheory } from '@/types';
import { useState } from 'react';

interface Props {
  theory: TrainingTheory;
}

export default function TheoryCard({ theory }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gym-card border border-gym-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start justify-between gap-3"
      >
        <div>
          <h3 className="font-semibold text-white">{theory.title}</h3>
          <p className="text-sm text-gym-text mt-1">{theory.summary}</p>
        </div>
        <span className="text-gym-muted text-sm mt-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gym-border pt-3 space-y-3">
          <div>
            <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">
              📖 详细说明
            </h4>
            <p className="text-sm text-gym-text leading-relaxed">{theory.detail}</p>
          </div>
          <div className="bg-primary-500/5 border border-primary-500/10 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-primary-400 mb-1">🛠️ 实际应用</h4>
            <p className="text-sm text-gym-text leading-relaxed">{theory.practicalApplication}</p>
          </div>
        </div>
      )}
    </div>
  );
}
