'use client';

import { trainingGoals, trainingTheories } from '@/data/goals';
import GoalSelector from '@/components/GoalSelector';
import TheoryCard from '@/components/TheoryCard';
import { useState, useEffect } from 'react';

export default function GoalSystemPage() {
  const [activeTab, setActiveTab] = useState<'goals' | 'theory'>('goals');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (init || typeof window === 'undefined') return;
    setInit(true);
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get('select');
    const t = sp.get('tab');
    if (s) setSelectedGoal(s);
    if (t === 'theory') setActiveTab('theory');
  }, [init]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-bold text-2xl text-white">🎯 目标系统</h1>
        <p className="text-sm text-gym-muted mt-1">
          选择训练目标，系统自动生成对应的周训练计划、次数范围和训练原则
        </p>
      </div>

      <div className="flex gap-1 bg-gym-card rounded-xl p-1 border border-gym-border">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'goals' ? 'bg-primary-600 text-white' : 'text-gym-muted hover:text-white'
          }`}
        >
          🎯 训练目标
        </button>
        <button
          onClick={() => setActiveTab('theory')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'theory' ? 'bg-primary-600 text-white' : 'text-gym-muted hover:text-white'
          }`}
        >
          📖 训练理论
        </button>
      </div>

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
