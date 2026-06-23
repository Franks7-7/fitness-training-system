'use client';

import type { WeeklyPlan } from '@/types';
import TrainingDayCard from './TrainingDayCard';
import { useState } from 'react';

interface Props {
  plan: WeeklyPlan;
}

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayShortLabels: Record<string, string> = {
  monday: '一',
  tuesday: '二',
  wednesday: '三',
  thursday: '四',
  friday: '五',
  saturday: '六',
  sunday: '日',
};

const dayFullLabels: Record<string, string> = {
  monday: '周一',
  tuesday: '周二',
  wednesday: '周三',
  thursday: '周四',
  friday: '周五',
  saturday: '周六',
  sunday: '周日',
};

export default function WeeklyPlan({ plan }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  // 按星期排序
  const sortedDays = dayOrder
    .map((dow) => plan.trainingDays.find((td) => td.dayOfWeek === dow))
    .filter(Boolean) as typeof plan.trainingDays;

  const todayDow = dayOrder[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]; // Mon=0
  const todayIndex = sortedDays.findIndex((d) => d.dayOfWeek === todayDow);

  return (
    <div>
      {/* 计划概览 */}
      <div className="bg-gym-card border border-gym-border rounded-xl p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-white text-lg">{plan.name}</h2>
            <p className="text-sm text-gym-text mt-1">{plan.description}</p>
          </div>
          <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded-full whitespace-nowrap">
            {plan.daysPerWeek} 天/周
          </span>
        </div>

        {/* 周训原则 */}
        <div className="mt-3 pt-3 border-t border-gym-border">
          <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1.5">
            📐 本周训练原则
          </h4>
          <ul className="space-y-0.5">
            {plan.weeklyPrinciples.map((p, i) => (
              <li key={i} className="text-xs text-gym-text flex gap-1.5">
                <span className="text-primary-400 shrink-0">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* 超负荷策略 */}
        <div className="mt-2 bg-primary-500/5 border border-primary-500/10 rounded-lg p-3">
          <p className="text-xs text-gym-muted mb-1">📈 渐进超负荷策略</p>
          <p className="text-xs text-gym-text">{plan.overloadStrategy}</p>
        </div>
      </div>

      {/* 每日训练标签（移动端横滑） */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 md:grid md:grid-cols-7">
        {sortedDays.map((day, idx) => (
          <button
            key={day.id}
            onClick={() => setActiveTab(idx)}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              idx === activeTab
                ? 'bg-primary-600 text-white'
                : day.type === 'rest'
                ? 'bg-gym-card/50 text-gym-muted border border-gym-border'
                : 'bg-gym-card text-gym-text border border-gym-border hover:border-primary-500/30'
            }`}
          >
            <div>{dayFullLabels[day.dayOfWeek]}</div>
            <div className="text-[10px] mt-0.5 opacity-70">
              {day.type === 'rest' ? '休息' : day.type === 'hiit' ? 'HIIT' : day.type === 'cardio' ? '有氧' : '力量'}
            </div>
          </button>
        ))}
      </div>

      {/* 训练日详情 */}
      <TrainingDayCard
        trainingDay={sortedDays[activeTab]}
        dayLabel={dayFullLabels[sortedDays[activeTab].dayOfWeek]}
        isToday={activeTab === todayIndex}
      />
    </div>
  );
}
