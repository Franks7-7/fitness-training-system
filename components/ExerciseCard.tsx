'use client';

import type { Exercise } from '@/types';
import { useState } from 'react';

interface Props {
  exercise: Exercise;
  compact?: boolean;
}

const difficultyBadge: Record<string, { label: string; color: string }> = {
  beginner: { label: '初级', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  intermediate: { label: '中级', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  advanced: { label: '高级', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

const categoryLabel: Record<string, string> = {
  compound: '复合动作',
  isolation: '孤立动作',
};

const muscleLabels: Record<string, string> = {
  chest: '胸',
  back: '背',
  legs: '腿',
  shoulders: '肩',
  arms: '手臂',
  core: '核心',
  glutes: '臀',
  'full-body': '全身',
};

export default function ExerciseCard({ exercise, compact = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const diff = difficultyBadge[exercise.difficulty];

  return (
    <div className="bg-gym-card border border-gym-border rounded-xl overflow-hidden">
      {/* 头部 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-base">{exercise.name}</h3>
            <span className="text-xs text-gym-muted">{exercise.nameEn}</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${diff.color}`}
            >
              {diff.label}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${
                exercise.category === 'compound'
                  ? 'bg-primary-500/20 text-primary-400 border-primary-500/30'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
              }`}
            >
              {categoryLabel[exercise.category]}
            </span>
            {exercise.primaryMuscles.map((m) => (
              <span
                key={m}
                className="text-xs px-2 py-0.5 rounded-full bg-gym-dark text-gym-muted border border-gym-border"
              >
                {muscleLabels[m] || m}
              </span>
            ))}
          </div>
        </div>
        <span className="text-gym-muted text-sm mt-1">{expanded ? '▲' : '▼'}</span>
      </button>

      {/* 展开内容 */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gym-border pt-3 space-y-3">
          <p className="text-sm text-gym-text leading-relaxed">{exercise.description}</p>

          <div>
            <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1.5">
              📝 动作步骤
            </h4>
            <ol className="space-y-1">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="text-sm text-gym-text flex gap-2">
                  <span className="text-primary-400 font-medium shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-accent-400 uppercase tracking-wider mb-1.5">
              ⚠️ 常见错误
            </h4>
            <ul className="space-y-1">
              {exercise.commonMistakes.map((mistake, i) => (
                <li key={i} className="text-sm text-gym-text flex gap-2">
                  <span className="text-accent-400 shrink-0">✗</span>
                  {mistake}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-3 text-xs text-gym-muted pt-1">
            <span>🏷️ MET: {exercise.metValue}</span>
            <span>🛠️ {exercise.equipment}</span>
          </div>
        </div>
      )}

      {/* 折叠时的简短提示 */}
      {!expanded && !compact && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gym-muted line-clamp-1">{exercise.description}</p>
        </div>
      )}
    </div>
  );
}
