'use client';

import type { TrainingDay } from '@/types';
import { getExerciseById } from '@/data/exercises';
import { useState } from 'react';

interface Props {
  trainingDay: TrainingDay;
  dayLabel: string;
  isToday?: boolean;
}

const dayNames: Record<string, string> = {
  monday: '周一',
  tuesday: '周二',
  wednesday: '周三',
  thursday: '周四',
  friday: '周五',
  saturday: '周六',
  sunday: '周日',
};

const typeBadge: Record<string, { label: string; icon: string; color: string }> = {
  strength: { label: '力量', icon: '🏋️', color: 'bg-primary-500/20 text-primary-400' },
  cardio: { label: '有氧', icon: '🏃', color: 'bg-green-500/20 text-green-400' },
  hiit: { label: 'HIIT', icon: '⚡', color: 'bg-orange-500/20 text-orange-400' },
  rest: { label: '休息', icon: '😴', color: 'bg-gray-500/20 text-gray-400' },
};

export default function TrainingDayCard({ trainingDay, dayLabel, isToday }: Props) {
  const [expanded, setExpanded] = useState(isToday || false);
  const typeInfo = typeBadge[trainingDay.type] || typeBadge.rest;

  return (
    <div
      className={`bg-gym-card border rounded-xl overflow-hidden transition-colors ${
        isToday ? 'border-primary-500/50 ring-1 ring-primary-500/20' : 'border-gym-border'
      } ${trainingDay.type === 'rest' ? 'opacity-60' : ''}`}
    >
      {/* 头部 */}
      <button
        onClick={() => trainingDay.type !== 'rest' && setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              isToday
                ? 'bg-primary-500 text-white'
                : 'bg-gym-dark text-gym-text border border-gym-border'
            }`}
          >
            {dayLabel}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{trainingDay.focusArea}</h3>
              {isToday && (
                <span className="text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded">
                  今天
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-1.5 py-0.5 rounded ${typeInfo.color}`}>
                {typeInfo.icon} {typeInfo.label}
              </span>
              {trainingDay.type !== 'rest' && trainingDay.estimatedDuration > 0 && (
                <span className="text-xs text-gym-muted">
                  ⏱️ 约 {trainingDay.estimatedDuration} 分钟
                </span>
              )}
            </div>
          </div>
        </div>
        {trainingDay.type !== 'rest' && (
          <span className="text-gym-muted text-sm">{expanded ? '▲' : '▼'}</span>
        )}
      </button>

      {/* 展开内容 */}
      {expanded && trainingDay.type !== 'rest' && (
        <div className="px-4 pb-4 border-t border-gym-border space-y-3">
          {/* 热身 */}
          {trainingDay.warmup && (
            <div className="mt-3 bg-gym-dark/50 rounded-lg p-3">
              <p className="text-xs text-gym-muted mb-1">🔥 热身</p>
              <p className="text-sm text-gym-text">{trainingDay.warmup}</p>
            </div>
          )}

          {/* 动作列表 */}
          <div className="space-y-2">
            {trainingDay.exercises.map((we, idx) => {
              const exercise = getExerciseById(we.exerciseId);
              if (!exercise) return null;
              return (
                <div
                  key={we.exerciseId}
                  className="bg-gym-dark rounded-lg p-3 border border-gym-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-primary-400 font-mono">{idx + 1}</span>
                        <h4 className="font-medium text-white text-sm">{exercise.name}</h4>
                        <span className="text-xs text-gym-muted">
                          {exercise.category === 'compound' ? '复合' : '孤立'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <span className="text-xs bg-gym-card text-gym-text px-2 py-0.5 rounded">
                          {we.sets} 组 × {we.reps} 次
                        </span>
                        <span className="text-xs text-gym-muted">💪 {we.weightSuggestion}</span>
                        <span className="text-xs text-gym-muted">🎯 RPE {we.targetRPE}</span>
                        <span className="text-xs text-gym-muted">
                          ⏱️ 休息 {we.restSeconds}s
                        </span>
                      </div>
                      {we.notes && (
                        <p className="text-xs text-primary-300/80 mt-1.5">💡 {we.notes}</p>
                      )}
                      <p className="text-xs text-gym-muted mt-1">
                        📈 {we.progressionStrategy}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
