'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useMemo } from 'react';
import Link from 'next/link';
import { trainingGoals } from '@/data/goals';
import { weeklyPlans } from '@/data/trainingPlans';
import { getExerciseById } from '@/data/exercises';

const goalIcons: Record<string, string> = {
  hypertrophy: '💪',
  strength: '🏋️',
  'fat-loss': '🔥',
  maintenance: '🧘',
};

const goalLabels: Record<string, string> = {
  hypertrophy: '增肌',
  strength: '增力',
  'fat-loss': '减脂',
  maintenance: '维持',
};

function TrainingPlanContent() {
  const searchParams = useSearchParams();
  const goalParam = searchParams.get('goal');
  const [filterGoal, setFilterGoal] = useState<string | null>(goalParam);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);

  const filteredPlans = useMemo(() => {
    if (!filterGoal) return weeklyPlans;
    return weeklyPlans.filter((p) => p.goalType === filterGoal);
  }, [filterGoal]);

  const allGoals = useMemo(() => {
    const seen = new Set(weeklyPlans.map((p) => p.goalType));
    return trainingGoals.filter((g) => seen.has(g.type));
  }, []);

  // 无筛选时展示全部；有筛选时展示对应的 goal 信息
  const activeGoal = filterGoal ? trainingGoals.find((g) => g.type === filterGoal) : null;

  return (
    <div className="space-y-5">
      {/* 头部 */}
      <div>
        <h1 className="font-bold text-2xl text-white">📋 训练计划库</h1>
        <p className="text-sm text-gym-muted mt-1">
          共 {weeklyPlans.length} 套标准训练计划，覆盖增肌、增力、减脂、维持四大目标
        </p>
      </div>

      {/* 目标筛选 */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterGoal(null)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !filterGoal ? 'bg-primary-600 text-white' : 'bg-gym-card text-gym-muted border border-gym-border hover:text-white'
          }`}
        >
          全部（{weeklyPlans.length}）
        </button>
        {allGoals.map((g) => {
          const count = weeklyPlans.filter((p) => p.goalType === g.type).length;
          return (
            <button
              key={g.type}
              onClick={() => setFilterGoal(g.type)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterGoal === g.type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gym-card text-gym-muted border border-gym-border hover:text-white'
              }`}
            >
              {g.icon} {g.nameZh}（{count}）
            </button>
          );
        })}
      </div>

      {/* 筛选结果概览 */}
      {activeGoal && (
        <div className="bg-gym-card border border-gym-border rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{activeGoal.icon}</span>
            <div>
              <h3 className="font-bold text-white">{activeGoal.nameZh}</h3>
              <p className="text-xs text-gym-muted">{activeGoal.recommendedStructure}</p>
            </div>
          </div>
          <p className="text-xs text-gym-text leading-relaxed">{activeGoal.description}</p>
        </div>
      )}

      {/* 计划列表 */}
      <div className="space-y-3">
        {filteredPlans.map((plan) => {
          const isExpanded = expandedPlan === plan.id;
          const trainingDays = plan.trainingDays.filter((d) => d.type !== 'rest' && d.exercises.length > 0);
          const exCount = plan.trainingDays.reduce((s, d) => s + d.exercises.length, 0);
          const matchedCount = plan.trainingDays.reduce(
            (s, d) => s + d.exercises.filter((e) => getExerciseById(e.exerciseId)).length, 0
          );
          const goal = trainingGoals.find((g) => g.type === plan.goalType);

          return (
            <div
              key={plan.id}
              className={`bg-gym-card border rounded-xl overflow-hidden transition-colors ${
                isExpanded ? 'border-primary-500/40' : 'border-gym-border hover:border-primary-500/30'
              }`}
            >
              {/* 计划头部 */}
              <button
                onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                className="w-full text-left p-4 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-white">{plan.name}</h3>
                    <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                      {plan.daysPerWeek}天/周
                    </span>
                    {goal && (
                      <span className="text-xs bg-gym-dark text-gym-muted px-2 py-0.5 rounded-full border border-gym-border">
                        {goal.icon} {goalLabels[plan.goalType]}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gym-text line-clamp-2">{plan.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gym-muted">
                    <span>{trainingDays.length} 个训练日</span>
                    <span>{exCount} 个动作</span>
                    <span className="text-green-400">{matchedCount} 已匹配</span>
                  </div>
                </div>
                <span className="text-gym-muted text-sm mt-1 shrink-0">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {/* 展开详情 */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gym-border space-y-3">
                  {/* 适合人群 & 训练原则 */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gym-dark rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">📐 训练原则</h4>
                      <ul className="space-y-0.5">
                        {plan.weeklyPrinciples.map((p, i) => (
                          <li key={i} className="text-xs text-gym-text flex gap-1.5">
                            <span className="text-primary-400 shrink-0">•</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-gym-dark rounded-lg p-3">
                      <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">📈 渐进超负荷</h4>
                      <p className="text-xs text-gym-text">{plan.overloadStrategy}</p>
                    </div>
                  </div>

                  {/* 训练日预览 */}
                  <div>
                    <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-2">
                      🗓️ 每周安排
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                      {plan.trainingDays.map((day) => (
                        <div
                          key={day.id}
                          className={`bg-gym-dark rounded-lg px-2.5 py-2 border ${
                            day.type === 'rest' ? 'border-gym-border/30 opacity-50' : 'border-gym-border'
                          }`}
                        >
                          <div className="text-xs text-gym-text font-medium truncate">
                            {day.type === 'rest' ? '😴 休息' : day.focusArea}
                          </div>
                          {day.type !== 'rest' && day.exercises.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {day.exercises.slice(0, 3).map((we, i) => {
                                const ex = getExerciseById(we.exerciseId);
                                return (
                                  <div key={i} className="text-[10px] text-gym-muted truncate flex items-center gap-1">
                                    <span className={ex ? 'text-green-400' : 'text-yellow-400'}>
                                      {ex ? '•' : '◦'}
                                    </span>
                                    {ex?.name || we.customName || '自定义动作'}
                                  </div>
                                );
                              })}
                              {day.exercises.length > 3 && (
                                <div className="text-[10px] text-gym-muted">+{day.exercises.length - 3} 更多</div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 导入按钮 */}
                  <Link
                    href={`/custom-plan?import=${plan.id}`}
                    className="block w-full bg-primary-600 hover:bg-primary-500 text-white text-center py-2.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    📥 导入此计划 → 自定义编辑
                  </Link>
                </div>
              )}
            </div>
          );
        })}

        {filteredPlans.length === 0 && (
          <div className="text-center py-12 text-gym-muted">
            <p className="text-4xl mb-3">📋</p>
            <p>没有匹配的训练计划</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrainingPlanPage() {
  return (
    <Suspense fallback={<div className="text-gym-muted text-sm">Loading...</div>}>
      <TrainingPlanContent />
    </Suspense>
  );
}
