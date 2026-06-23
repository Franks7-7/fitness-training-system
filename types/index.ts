// ============================================================
// Fitness Training System V1 — Core Type Definitions
// ============================================================

/** 训练目标 */
export type GoalType = 'hypertrophy' | 'strength' | 'fat-loss' | 'maintenance';

/** 难度等级 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/** 动作类型 */
export type ExerciseCategory = 'compound' | 'isolation';

/** 目标肌群 */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'glutes'
  | 'full-body';

/** RPE 强度等级 (6-10) */
export type RPELevel = 6 | 7 | 8 | 9 | 10;

/** 每周训练日 */
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

// ---- 动作 (Exercise) ----

export interface Exercise {
  id: string;
  name: string;
  nameEn: string;
  category: ExerciseCategory;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  difficulty: DifficultyLevel;
  description: string;
  instructions: string[];
  commonMistakes: string[];
  /** 该动作的 MET 值（用于热量估算） */
  metValue: number;
  /** 是否需要器械 */
  equipment: string;
  /** 动图/示意图 URL（可选） */
  imageUrl?: string;
}

// ---- 训练计划中的单个动作项 ----

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: string; // 如 "8-12" 或 "5" 或 "AMRAP"
  /** 建议重量（占 1RM 百分比或描述） */
  weightSuggestion: string;
  /** 目标 RPE */
  targetRPE: RPELevel;
  /** 组间休息（秒） */
  restSeconds: number;
  /** 备注 */
  notes?: string;
  /** 渐进超负荷策略 */
  progressionStrategy: string;
  /** 自定义动作名（exerciseId 为 'custom' 时使用） */
  customName?: string;
}

// ---- 训练日 ----

export interface TrainingDay {
  id: string;
  dayOfWeek: DayOfWeek;
  focusArea: string; // 如 "推日 (胸+肩+三头)"
  exercises: WorkoutExercise[];
  /** 该训练日预计耗时（分钟） */
  estimatedDuration: number;
  /** 热身建议 */
  warmup: string;
  /** 训练日类型 */
  type: 'strength' | 'cardio' | 'rest' | 'hiit';
}

// ---- 训练周计划 ----

export interface WeeklyPlan {
  id: string;
  goalType: GoalType;
  name: string;
  description: string;
  /** 每周训练天数 */
  daysPerWeek: number;
  trainingDays: TrainingDay[];
  /** 周训练原则 */
  weeklyPrinciples: string[];
  /** 渐进超负荷说明 */
  overloadStrategy: string;
}

// ---- 训练目标 ----

export interface TrainingGoal {
  id: string;
  type: GoalType;
  name: string;
  nameZh: string;
  description: string;
  icon: string;
  /** 推荐周训练频率 */
  recommendedFrequency: string;
  /** 推荐训练结构 */
  recommendedStructure: string;
  /** 每组次数范围 */
  repRange: string;
  /** 组间休息 */
  restRange: string;
  /** RPE 范围 */
  rpeRange: string;
  /** 核心原则 */
  principles: string[];
  /** 饮食建议 */
  dietTips: string;
  /** 推荐有氧频率 */
  cardioRecommendation: string;
}

// ---- 训练理论 ----

export interface TrainingTheory {
  id: string;
  title: string;
  summary: string;
  detail: string;
  practicalApplication: string;
}
