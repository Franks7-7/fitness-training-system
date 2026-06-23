'use client';

import { useState, useEffect } from 'react';
import type { TrainingDay, WorkoutExercise, WeeklyPlan, RPELevel } from '@/types';
import { exerciseLibrary } from '@/data/exercises';

interface Props {
  initialPlan?: WeeklyPlan | null;
  onSave: (plan: WeeklyPlan) => void;
}

const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const rpeOptions: RPELevel[] = [6, 7, 8, 9, 10];
const restOptions = [30, 45, 60, 90, 120, 150, 180, 240, 300];

function emptyDay(idx: number): TrainingDay {
  return {
    id: `day-${idx}`,
    dayOfWeek: dayKeys[idx],
    focusArea: '',
    type: 'strength',
    estimatedDuration: 0,
    warmup: '',
    exercises: [],
  };
}

function emptyExercise(): WorkoutExercise {
  return {
    exerciseId: '',
    sets: 4,
    reps: '8-12',
    weightSuggestion: '',
    targetRPE: 8,
    restSeconds: 90,
    notes: '',
    progressionStrategy: '每周尝试增加重量或次数',
  };
}

export default function CustomPlanBuilder({ initialPlan, onSave }: Props) {
  const [planName, setPlanName] = useState(initialPlan?.name || '');
  const [planDesc, setPlanDesc] = useState(initialPlan?.description || '');
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>(() => {
    if (initialPlan?.trainingDays?.length) return initialPlan.trainingDays;
    return dayKeys.map((_, i) => emptyDay(i));
  });

  const [activeDay, setActiveDay] = useState(0);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState<number | null>(null);

  // 当前编辑的训练日
  const day = trainingDays[activeDay];

  // 更新训练日
  const updateDay = (field: keyof TrainingDay, value: any) => {
    setTrainingDays((prev) =>
      prev.map((d, i) => (i === activeDay ? { ...d, [field]: value } : d))
    );
  };

  // 设置训练日为休息日
  const toggleRestDay = () => {
    if (day.type === 'rest') {
      updateDay('type', 'strength');
    } else {
      setTrainingDays((prev) =>
        prev.map((d, i) =>
          i === activeDay ? { ...d, type: 'rest' as const, exercises: [], focusArea: '休息日' } : d
        )
      );
    }
  };

  // 添加动作
  const addExercise = (exerciseId: string) => {
    const ex = exerciseLibrary.find((e) => e.id === exerciseId);
    const newEx: WorkoutExercise = {
      ...emptyExercise(),
      exerciseId,
      notes: ex ? `${ex.name} — ${ex.category === 'compound' ? '复合动作，优先完成' : '孤立动作，注意感受肌肉'}` : '',
    };
    setTrainingDays((prev) =>
      prev.map((d, i) =>
        i === activeDay ? { ...d, exercises: [...d.exercises, newEx] } : d
      )
    );
    setShowExercisePicker(null);
    setExerciseSearch('');
  };

  // 添加自定义动作
  const addCustomExercise = () => {
    if (!exerciseSearch.trim()) return;
    const newEx: WorkoutExercise = {
      ...emptyExercise(),
      exerciseId: 'custom',
      notes: exerciseSearch.trim(),
    };
    setTrainingDays((prev) =>
      prev.map((d, i) =>
        i === activeDay ? { ...d, exercises: [...d.exercises, newEx] } : d
      )
    );
    setShowExercisePicker(null);
    setExerciseSearch('');
  };

  // 更新动作
  const updateExercise = (exIdx: number, field: keyof WorkoutExercise, value: any) => {
    setTrainingDays((prev) =>
      prev.map((d, i) =>
        i === activeDay
          ? {
              ...d,
              exercises: d.exercises.map((ex, j) =>
                j === exIdx ? { ...ex, [field]: value } : ex
              ),
            }
          : d
      )
    );
  };

  // 删除动作
  const removeExercise = (exIdx: number) => {
    setTrainingDays((prev) =>
      prev.map((d, i) =>
        i === activeDay
          ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
          : d
      )
    );
  };

  // 清空当天
  const clearDay = () => {
    setTrainingDays((prev) =>
      prev.map((d, i) =>
        i === activeDay ? { ...d, exercises: [], focusArea: '', warmup: '' } : d
      )
    );
  };

  // 保存
  const handleSave = () => {
    const nonRestDays = trainingDays.filter((d) => d.type !== 'rest' && d.exercises.length > 0);
    if (nonRestDays.length === 0) return;

    const plan: WeeklyPlan = {
      id: initialPlan?.id || `custom-${Date.now()}`,
      goalType: 'hypertrophy',
      name: planName || '自定义训练计划',
      description: planDesc || `包含 ${nonRestDays.length} 个训练日的自定义计划`,
      daysPerWeek: nonRestDays.length,
      trainingDays,
      weeklyPrinciples: ['自定义计划', '根据自身感受调整强度'],
      overloadStrategy: '根据自身进步节奏递增',
    };
    onSave(plan);
  };

  // 筛选动作库
  const filteredExercises = exerciseSearch.trim()
    ? exerciseLibrary.filter(
        (e) =>
          e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
          e.nameEn.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
          e.primaryMuscles.some((m) => m.includes(exerciseSearch.toLowerCase()))
      )
    : exerciseLibrary;

  const activeExercises = day.exercises;
  const totalExercises = trainingDays.reduce((s, d) => s + d.exercises.length, 0);

  return (
    <div className="space-y-4">
      {/* 计划名称 */}
      <div className="space-y-2">
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          placeholder="计划名称（如：我的 PPL 训练）"
          className="w-full bg-gym-dark border border-gym-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gym-muted focus:outline-none focus:border-primary-500/50"
        />
        <input
          type="text"
          value={planDesc}
          onChange={(e) => setPlanDesc(e.target.value)}
          placeholder="简短描述（可选）"
          className="w-full bg-gym-dark border border-gym-border rounded-xl px-4 py-2.5 text-gym-text text-sm placeholder-gym-muted focus:outline-none focus:border-primary-500/50"
        />
      </div>

      {/* 训练日标签 */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {trainingDays.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActiveDay(i)}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              i === activeDay
                ? 'bg-primary-600 text-white'
                : d.type === 'rest'
                ? 'bg-gym-card/40 text-gym-muted border border-gym-border/50'
                : d.exercises.length > 0
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-gym-card text-gym-muted border border-gym-border'
            }`}
          >
            <div>{dayLabels[i]}</div>
            <div className="text-[10px] mt-0.5 opacity-70">
              {d.type === 'rest' ? '休息' : d.exercises.length > 0 ? `${d.exercises.length}动作` : '空'}
            </div>
          </button>
        ))}
      </div>

      {/* 当前训练日编辑 */}
      <div className="bg-gym-card border border-gym-border rounded-xl p-4">
        {/* 日信息 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-white">{dayLabels[activeDay]}</h3>
          <div className="flex gap-2">
            <button
              onClick={toggleRestDay}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                day.type === 'rest'
                  ? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
              }`}
            >
              {day.type === 'rest' ? '设为训练日' : '设为休息日'}
            </button>
            {day.exercises.length > 0 && (
              <button
                onClick={clearDay}
                className="text-xs px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                清空
              </button>
            )}
          </div>
        </div>

        {day.type === 'rest' ? (
          <p className="text-sm text-gym-muted text-center py-4">😴 休息日 — 好好恢复</p>
        ) : (
          <>
            {/* 训练日名称 */}
            <input
              type="text"
              value={day.focusArea}
              onChange={(e) => updateDay('focusArea', e.target.value)}
              placeholder="训练日名称（如：推日 / 胸+三头）"
              className="w-full bg-gym-dark border border-gym-border rounded-lg px-3 py-2 text-sm text-white placeholder-gym-muted focus:outline-none focus:border-primary-500/50 mb-2"
            />

            {/* 热身 */}
            <input
              type="text"
              value={day.warmup}
              onChange={(e) => updateDay('warmup', e.target.value)}
              placeholder="热身建议（可选）"
              className="w-full bg-gym-dark border border-gym-border rounded-lg px-3 py-2 text-xs text-gym-text placeholder-gym-muted focus:outline-none focus:border-primary-500/50 mb-3"
            />

            {/* 动作列表 */}
            <div className="space-y-2 mb-3">
              {activeExercises.map((we, exIdx) => {
                const ex = we.exerciseId !== 'custom' ? exerciseLibrary.find((e) => e.id === we.exerciseId) : null;
                const displayName = ex?.name || (we.notes && we.exerciseId === 'custom' ? we.notes : '自定义动作');
                return (
                  <div key={exIdx} className="bg-gym-dark rounded-lg p-3 border border-gym-border space-y-2">
                    {/* 动作头部 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate flex-1">
                        {displayName}
                      </span>
                      <button
                        onClick={() => removeExercise(exIdx)}
                        className="text-xs text-red-400 hover:text-red-300 ml-2 shrink-0"
                      >
                        ✕
                      </button>
                    </div>

                    {/* 参数 */}
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-gym-muted">组数</label>
                        <input
                          type="number"
                          value={we.sets}
                          onChange={(e) => updateExercise(exIdx, 'sets', parseInt(e.target.value) || 1)}
                          className="w-full bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary-500/50"
                          min={1}
                          max={10}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gym-muted">次数</label>
                        <input
                          type="text"
                          value={we.reps}
                          onChange={(e) => updateExercise(exIdx, 'reps', e.target.value)}
                          className="w-full bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary-500/50"
                          placeholder="8-12"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gym-muted">RPE</label>
                        <select
                          value={we.targetRPE}
                          onChange={(e) => updateExercise(exIdx, 'targetRPE', parseInt(e.target.value) as RPELevel)}
                          className="w-full bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary-500/50"
                        >
                          {rpeOptions.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gym-muted">休息(s)</label>
                        <select
                          value={we.restSeconds}
                          onChange={(e) => updateExercise(exIdx, 'restSeconds', parseInt(e.target.value))}
                          className="w-full bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary-500/50"
                        >
                          {restOptions.map((r) => (
                            <option key={r} value={r}>{r}s</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 重量 + 备注 */}
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={we.weightSuggestion}
                        onChange={(e) => updateExercise(exIdx, 'weightSuggestion', e.target.value)}
                        placeholder="建议重量（如：70kg）"
                        className="bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-gym-text placeholder-gym-muted focus:outline-none focus:border-primary-500/50"
                      />
                      <input
                        type="text"
                        value={we.notes || ''}
                        onChange={(e) => updateExercise(exIdx, 'notes', e.target.value)}
                        placeholder="备注（如：注意离心）"
                        className="bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-gym-text placeholder-gym-muted focus:outline-none focus:border-primary-500/50"
                      />
                    </div>
                  </div>
                );
              })}

              {activeExercises.length === 0 && (
                <p className="text-sm text-gym-muted text-center py-4">
                  还没有动作，点击下方按钮添加
                </p>
              )}
            </div>

            {/* 添加动作 */}
            {showExercisePicker === activeDay ? (
              <div className="bg-gym-dark border border-primary-500/30 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="搜索或输入自定义动作名..."
                    className="flex-1 bg-gym-card border border-gym-border rounded-lg px-3 py-2 text-sm text-white placeholder-gym-muted focus:outline-none focus:border-primary-500/50"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && exerciseSearch.trim()) {
                        const match = filteredExercises[0];
                        if (match) {
                          addExercise(match.id);
                        } else {
                          addCustomExercise();
                        }
                      }
                    }}
                  />
                  <button
                    onClick={() => { setShowExercisePicker(null); setExerciseSearch(''); }}
                    className="text-xs px-3 py-2 text-gym-muted hover:text-white transition-colors"
                  >
                    取消
                  </button>
                </div>

                {/* 搜索结果 */}
                {exerciseSearch.trim() && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredExercises.slice(0, 8).map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => addExercise(ex.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-500/10 text-sm text-gym-text hover:text-white transition-colors flex items-center justify-between"
                      >
                        <span>{ex.name}</span>
                        <span className="text-xs text-gym-muted">{ex.primaryMuscles[0]}</span>
                      </button>
                    ))}
                    <button
                      onClick={addCustomExercise}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-yellow-500/10 text-sm text-yellow-400 transition-colors"
                    >
                      + 添加自定义动作：「{exerciseSearch}」
                    </button>
                  </div>
                )}

                {/* 未搜索时显示常用 */}
                {!exerciseSearch.trim() && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {exerciseLibrary.slice(0, 10).map((ex) => (
                      <button
                        key={ex.id}
                        onClick={() => addExercise(ex.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-500/10 text-sm text-gym-text hover:text-white transition-colors flex items-center justify-between"
                      >
                        <span>{ex.name}</span>
                        <span className="text-xs text-gym-muted">{ex.primaryMuscles[0]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowExercisePicker(activeDay)}
                className="w-full py-2.5 border-2 border-dashed border-gym-border rounded-lg text-sm text-gym-muted hover:text-white hover:border-primary-500/30 transition-colors"
              >
                + 添加动作
              </button>
            )}
          </>
        )}
      </div>

      {/* 底部统计 + 保存 */}
      <div className="flex items-center justify-between bg-gym-card border border-gym-border rounded-xl p-4">
        <div>
          <span className="text-sm text-gym-text">
            {trainingDays.filter((d) => d.type !== 'rest' && d.exercises.length > 0).length} 个训练日 · {totalExercises} 个动作
          </span>
        </div>
        <button
          onClick={handleSave}
          disabled={totalExercises === 0}
          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          💾 保存计划
        </button>
      </div>
    </div>
  );
}
