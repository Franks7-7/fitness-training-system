'use client';

import { useState, useMemo } from 'react';
import { exerciseLibrary, getExercisesByMuscle } from '@/data/exercises';
import ExerciseCard from '@/components/ExerciseCard';
import type { MuscleGroup, ExerciseCategory } from '@/types';

const muscleOptions: { value: string; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'chest', label: '胸' },
  { value: 'back', label: '背' },
  { value: 'legs', label: '腿' },
  { value: 'shoulders', label: '肩' },
  { value: 'arms', label: '手臂' },
  { value: 'core', label: '核心' },
  { value: 'glutes', label: '臀' },
];

const difficultyOptions = [
  { value: 'all', label: '全部难度' },
  { value: 'beginner', label: '初级' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' },
];

const categoryOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'compound', label: '复合动作' },
  { value: 'isolation', label: '孤立动作' },
];

export default function ExerciseLibraryPage() {
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredExercises = useMemo(() => {
    let list = [...exerciseLibrary];

    // 搜索
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.nameEn.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }

    // 肌群筛选
    if (muscleFilter !== 'all') {
      list = list.filter(
        (e) =>
          e.primaryMuscles.includes(muscleFilter as MuscleGroup) ||
          e.secondaryMuscles.includes(muscleFilter as MuscleGroup)
      );
    }

    // 难度筛选
    if (difficultyFilter !== 'all') {
      list = list.filter((e) => e.difficulty === difficultyFilter);
    }

    // 类型筛选
    if (categoryFilter !== 'all') {
      list = list.filter((e) => e.category === (categoryFilter as ExerciseCategory));
    }

    return list;
  }, [search, muscleFilter, difficultyFilter, categoryFilter]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bold text-2xl text-white">📚 动作库</h1>
        <p className="text-sm text-gym-muted mt-1">
          共 {exerciseLibrary.length} 个动作 | 复合 {exerciseLibrary.filter((e) => e.category === 'compound').length} 个 | 孤立{' '}
          {exerciseLibrary.filter((e) => e.category === 'isolation').length} 个
        </p>
      </div>

      {/* 搜索 */}
      <input
        type="text"
        placeholder="搜索动作名称..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gym-card border border-gym-border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gym-muted focus:outline-none focus:border-primary-500/50"
      />

      {/* 筛选 */}
      <div className="space-y-2">
        {/* 肌群 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {muscleOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMuscleFilter(opt.value)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                muscleFilter === opt.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gym-card text-gym-muted border border-gym-border hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* 难度 + 类型 */}
        <div className="flex gap-2">
          <div className="flex gap-1.5 overflow-x-auto">
            {difficultyOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficultyFilter(opt.value)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  difficultyFilter === opt.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gym-card text-gym-muted border border-gym-border hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCategoryFilter(opt.value)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  categoryFilter === opt.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-gym-card text-gym-muted border border-gym-border hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 结果 */}
      <div className="space-y-2">
        <p className="text-xs text-gym-muted">
          {filteredExercises.length === exerciseLibrary.length
            ? `显示全部 ${exerciseLibrary.length} 个动作`
            : `筛选出 ${filteredExercises.length} / ${exerciseLibrary.length} 个动作`}
        </p>

        {filteredExercises.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}

        {filteredExercises.length === 0 && (
          <div className="text-center py-12 text-gym-muted">
            <p className="text-4xl mb-3">🔍</p>
            <p>没有找到匹配的动作</p>
            <p className="text-sm mt-1">尝试更换筛选条件或搜索关键词</p>
          </div>
        )}
      </div>
    </div>
  );
}
