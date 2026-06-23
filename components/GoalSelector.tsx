'use client';

import type { TrainingGoal } from '@/types';
import { useRouter } from 'next/navigation';

interface Props {
  goal: TrainingGoal;
  isSelected?: boolean;
  onSelect?: (goal: TrainingGoal) => void;
  showDetail?: boolean;
}

export default function GoalSelector({ goal, isSelected, onSelect, showDetail = true }: Props) {
  const router = useRouter();

  const handleClick = () => {
    if (onSelect) {
      onSelect(goal);
    }
    router.push(`/training-plan?goal=${goal.type}`);
  };

  return (
    <div
      className={`bg-gym-card border-2 rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary-500/50 ${
        isSelected ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gym-border'
      }`}
      onClick={handleClick}
    >
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{goal.icon}</span>
          <div>
            <h3 className="font-bold text-white text-lg">{goal.nameZh}</h3>
            <p className="text-xs text-gym-muted">{goal.name}</p>
          </div>
        </div>
        <p className="text-sm text-gym-text leading-relaxed mb-2">{goal.description}</p>

        {showDetail && (
          <div className="space-y-2 mt-4 pt-4 border-t border-gym-border">
            <DetailRow label="训练频率" value={goal.recommendedFrequency} />
            <DetailRow label="训练结构" value={goal.recommendedStructure} />
            <DetailRow label="次数范围" value={goal.repRange} />
            <DetailRow label="组间休息" value={goal.restRange} />
            <DetailRow label="强度" value={goal.rpeRange} />
            <DetailRow label="有氧建议" value={goal.cardioRecommendation} />
          </div>
        )}

        <div className="mt-4">
          <h4 className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1.5">
            📐 核心原则
          </h4>
          <ul className="space-y-1">
            {goal.principles.map((p, i) => (
              <li key={i} className="text-xs text-gym-text flex gap-1.5">
                <span className="text-primary-400 shrink-0">•</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {showDetail && (
          <div className="mt-3 bg-gym-dark/50 rounded-lg p-3">
            <p className="text-xs text-gym-muted mb-1">🥗 饮食建议</p>
            <p className="text-xs text-gym-text leading-relaxed">{goal.dietTips}</p>
          </div>
        )}
      </div>

      <div className="bg-primary-600 hover:bg-primary-500 text-white text-center py-2.5 text-sm font-semibold transition-colors">
        选择「{goal.nameZh}」→ 生成训练计划
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-xs text-gym-muted">{label}</span>
      <span className="text-xs text-white font-medium text-right">{value}</span>
    </div>
  );
}
