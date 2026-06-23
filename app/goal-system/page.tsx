'use client';

import { trainingGoals, trainingTheories } from '@/data/goals';
import GoalSelector from '@/components/GoalSelector';
import TheoryCard from '@/components/TheoryCard';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function GoalSystemContent() {
  const searchParams = useSearchParams();
  const initialSelect = searchParams.get('select');
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'goals' | 'theory'>(
    initialTab === 'theory' ? 'theory' : 'goals'
  );
  const [selectedGoal, setSelectedGoal] = useState<string | null>(initialSelect);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-bold text-2xl text-white">🎯 目标系统</h1>
        <p className="text-sm text-gym-muted mt-1">
          选择训练目标，系统自动生成对应的周训练计划、次数范围和训练原则
        </p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-gym-card rounded-xl p-1 border border-gym-border">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'goals'
              ? 'bg-primary-600 text-white'
              : 'text-gym-muted hover:text-white'
          }`}
        >
          🎯 训练目标
        </button>
        <button
          onClick={() => setActiveTab('theory')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'theory'
              ? 'bg-primary-600 text-white'
              : 'text-gym-muted hover:text-white'
          }`}
        >
          📖 训练理论
        </button>
      </div>

      {/* 目标选择 */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {trainingGoals.map((goal) => (
            <GoalSelector
              key={goal.id}
              goal={goal}
              isSelected={selectedGoal === goal.type}
              onSelect={(g) => setSelectedGoal(g.type)}
            />
          ))}
        </div>
      )}

      {/* 训练理论 */}
      {activeTab === 'theory' && (
        <div className="space-y-3">
          {trainingTheories.map((theory) => (
            <TheoryCard key={theory.id} theory={theory} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GoalSystemPage() {
  return (
    <Suspense fallback={<div className="text-gym-muted text-sm">Loading...</div>}>
      <GoalSystemContent />
    </Suspense>
  );
}
