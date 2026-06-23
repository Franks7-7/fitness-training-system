'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { WeeklyPlan, WorkoutExercise, RPELevel } from '@/types';
import { getExerciseById } from '@/data/exercises';

const STORAGE_KEY = 'fitness-custom-plans';
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const DAY_LABELS: Record<string, string> = {
  sunday: '周日', monday: '周一', tuesday: '周二', wednesday: '周三',
  thursday: '周四', friday: '周五', saturday: '周六',
};

function loadPlans(): WeeklyPlan[] {
  if (typeof window === 'undefined') return [];
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function getTodayKey(): string {
  return DAY_KEYS[new Date().getDay()]; // 0=Sun ... 6=Sat
}

export default function Home() {
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [activePlanIdx, setActivePlanIdx] = useState(0);
  const [viewDay, setViewDay] = useState<string | null>(null); // null = auto (today)

  useEffect(() => {
    setPlans(loadPlans());
  }, []);

  // 刷新已保存计划
  const refreshPlans = () => setPlans(loadPlans());

  const todayKey = getTodayKey();
  const displayDay = viewDay || todayKey;

  const activePlan = plans.length > 0 ? plans[Math.min(activePlanIdx, plans.length - 1)] : null;
  const todayTraining = activePlan?.trainingDays.find(d => d.dayOfWeek === displayDay);

  // 找到计划中所有有动作的训练日
  const allTrainingDays = activePlan?.trainingDays.filter(d => d.type !== 'rest' && d.exercises.length > 0) || [];
  const isRestDay = !todayTraining || todayTraining.type === 'rest' || todayTraining.exercises.length === 0;

  const totalDays = plans.reduce((s, p) => s + p.trainingDays.filter(d => d.type !== 'rest' && d.exercises.length > 0).length, 0);
  const totalExercises = plans.reduce((s, p) => s + p.trainingDays.reduce((a, d) => a + d.exercises.length, 0), 0);

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-900/40 via-gym-card to-gym-card border border-gym-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">🏋️</span>
          <div>
            <h1 className="font-bold text-2xl text-white">Training System V1</h1>
            <p className="text-sm text-gym-muted">你的个人训练规划工具</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Link href="/custom-plan" className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            ✏️ 创建计划
          </Link>
          <Link href="/exercise-library" className="bg-gym-dark border border-gym-border hover:border-primary-500/30 text-gym-text px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            📚 动作库
          </Link>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="📋" value={`${plans.length}`} label="训练计划" />
        <StatCard icon="📅" value={`${totalDays}`} label="训练日" />
        <StatCard icon="🏋️" value={`${totalExercises}`} label="动作" />
      </div>

      {/* ========== 今日训练（核心区域） ========== */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white text-lg">
            📋 {viewDay ? DAY_LABELS[displayDay] + '训练' : '今日训练'}
          </h2>
          <div className="flex items-center gap-2">
            {/* 计划选择器 */}
            {plans.length > 1 && (
              <select
                value={activePlanIdx}
                onChange={e => setActivePlanIdx(parseInt(e.target.value))}
                className="bg-gym-card border border-gym-border rounded-lg px-2 py-1 text-xs text-gym-text focus:outline-none focus:border-primary-500/50"
              >
                {plans.map((p, i) => (
                  <option key={p.id} value={i}>{p.name}</option>
                ))}
              </select>
            )}
            <Link href="/custom-plan" className="text-xs text-primary-400 hover:text-primary-300">管理</Link>
          </div>
        </div>

        {/* 日期快速切换 */}
        {activePlan && allTrainingDays.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-2 mb-3">
            {allTrainingDays.map((td) => (
              <button
                key={td.id}
                onClick={() => setViewDay(viewDay === td.dayOfWeek ? null : td.dayOfWeek)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  displayDay === td.dayOfWeek
                    ? 'bg-primary-600 text-white'
                    : 'bg-gym-card text-gym-muted border border-gym-border hover:text-white'
                }`}
              >
                {DAY_LABELS[td.dayOfWeek]}
                <span className="ml-1 opacity-60">{td.exercises.length}动作</span>
              </button>
            ))}
            <button
              onClick={() => setViewDay(null)}
              className={`shrink-0 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                !viewDay ? 'text-primary-400' : 'text-gym-muted hover:text-white'
              }`}
            >
              📍今天
            </button>
          </div>
        )}

        {!activePlan ? (
          /* 无计划 */
          <div className="bg-gym-card border border-dashed border-gym-border rounded-xl p-8 text-center">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-gym-text font-medium mb-1">还没有训练计划</p>
            <p className="text-sm text-gym-muted mb-4">导入预设计划或粘贴训练笔记，首页自动显示今日训练</p>
            <Link
              href="/custom-plan"
              className="inline-block bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              🚀 创建第一个计划
            </Link>
          </div>
        ) : isRestDay ? (
          /* 休息日 */
          <div className="bg-gym-card border border-gym-border rounded-xl p-8 text-center">
            <p className="text-5xl mb-3">😴</p>
            <p className="text-white font-bold text-lg mb-1">
              {DAY_LABELS[displayDay]} — 休息日
            </p>
            <p className="text-sm text-gym-muted mb-4">好好恢复，肌肉在休息时生长 💪</p>
            {allTrainingDays.length > 0 && (
              <button
                onClick={() => setViewDay(allTrainingDays[0].dayOfWeek)}
                className="text-primary-400 text-sm hover:text-primary-300"
              >
                → 查看最近训练日（{DAY_LABELS[allTrainingDays[0].dayOfWeek]}）
              </button>
            )}
          </div>
        ) : (
          /* 今日训练 — 大卡片模式 */
          <div className="space-y-3">
            {/* 训练日信息条 */}
            <div className="bg-primary-600/10 border border-primary-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">{todayTraining.focusArea || '训练日'}</h3>
                {activePlan && (
                  <p className="text-xs text-gym-muted mt-0.5">
                    {activePlan.name} · {DAY_LABELS[displayDay]} · {todayTraining.exercises.length} 个动作 · 约 {todayTraining.estimatedDuration} 分钟
                  </p>
                )}
              </div>
              <Link
                href={`/custom-plan?edit=${activePlan.id}`}
                className="text-xs bg-gym-card border border-gym-border text-gym-muted hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                编辑计划
              </Link>
            </div>

            {/* 热身提示 */}
            {todayTraining.warmup && (
              <div className="bg-gym-dark/50 border border-gym-border rounded-xl px-4 py-3">
                <span className="text-xs text-primary-400 font-semibold">🔥 热身</span>
                <p className="text-sm text-gym-text mt-1">{todayTraining.warmup}</p>
              </div>
            )}

            {/* 动作卡片列表 — 放大版，全部信息可见 */}
            <div className="space-y-3">
              {todayTraining.exercises.map((we, idx) => {
                const ex = getExerciseById(we.exerciseId);
                const name = ex?.name || we.customName || we.notes || '自定义动作';
                const isCompound = ex?.category === 'compound';
                const isMatched = !!ex;

                return (
                  <div
                    key={idx}
                    className={`bg-gym-card border rounded-xl overflow-hidden ${
                      isMatched ? 'border-gym-border' : 'border-yellow-500/20'
                    }`}
                  >
                    {/* 动作名称 + 序号 */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gym-border">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="font-semibold text-white text-base">{name}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isMatched && ex && (
                              <>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                  isCompound
                                    ? 'bg-primary-500/10 text-primary-400 border-primary-500/20'
                                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>
                                  {isCompound ? '复合' : '孤立'}
                                </span>
                                <span className="text-[10px] text-gym-muted">{ex.primaryMuscles[0]}</span>
                              </>
                            )}
                            {!isMatched && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                自定义
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 核心参数 — 大字醒目 */}
                    <div className="px-4 py-3 grid grid-cols-4 gap-3">
                      <ParamBlock label="组数" value={`${we.sets}`} unit="组" />
                      <ParamBlock label="次数" value={we.reps} unit="次" />
                      <ParamBlock label="RPE" value={`${we.targetRPE}`} unit="/10" />
                      <ParamBlock label="休息" value={`${we.restSeconds}`} unit="秒" />
                    </div>

                    {/* 重量 + 备注 */}
                    {(we.weightSuggestion || we.notes) && (
                      <div className="px-4 pb-3 grid grid-cols-2 gap-3">
                        {we.weightSuggestion && (
                          <div className="bg-gym-dark rounded-lg px-3 py-2">
                            <span className="text-[10px] text-gym-muted">💪 建议重量</span>
                            <p className="text-sm text-white font-medium mt-0.5">{we.weightSuggestion}</p>
                          </div>
                        )}
                        {we.notes && (
                          <div className="bg-gym-dark rounded-lg px-3 py-2">
                            <span className="text-[10px] text-gym-muted">💡 备注</span>
                            <p className="text-sm text-gym-text mt-0.5">{we.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 渐进策略 */}
                    <div className="px-4 pb-3">
                      <p className="text-[10px] text-gym-muted">
                        📈 {we.progressionStrategy}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 底部操作 */}
            <div className="flex gap-2">
              <button
                onClick={refreshPlans}
                className="flex-1 bg-gym-card border border-gym-border hover:border-primary-500/30 text-gym-text py-2.5 rounded-lg text-sm transition-colors"
              >
                🔄 刷新
              </button>
              <Link
                href="/custom-plan"
                className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg text-sm font-medium text-center transition-colors"
              >
                ✏️ 自定义计划
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="bg-gym-card border border-gym-border rounded-xl p-3 text-center">
      <span className="text-2xl">{icon}</span>
      <div className="text-xl font-bold text-white mt-1">{value}</div>
      <div className="text-xs text-gym-muted">{label}</div>
    </div>
  );
}

function ParamBlock({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="text-center bg-gym-dark rounded-lg py-2.5">
      <div className="text-[10px] text-gym-muted mb-0.5">{label}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-gym-muted">{unit}</div>
    </div>
  );
}
