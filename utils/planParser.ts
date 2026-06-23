import type { WorkoutExercise, TrainingDay, WeeklyPlan } from '@/types';
import { exerciseLibrary } from '@/data/exercises';

// ============================================================
// 粘贴文本解析器 V2 — 重写模糊匹配 + 修复格式解析
// ============================================================

interface ParsedDay {
  dayName: string;
  focusArea: string;
  exercises: ParsedExercise[];
}

interface ParsedExercise {
  name: string;
  matchedId: string | null;
  sets: number;
  reps: string;
  weight?: string;
  notes?: string;
}

// ============================================================
// 主解析入口
// ============================================================

export function parseTrainingText(text: string): ParsedDay[] {
  // 规范化换行
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 按空行分割训练日
  const blocks = normalized
    .trim()
    .split(/\n\s*\n/)
    .filter((b) => b.trim());

  const days: ParsedDay[] = [];

  for (const block of blocks) {
    const lines = block
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('//'));

    if (lines.length === 0) continue;

    // 判断第一行是否为训练日名称（不含 组数x次数 格式）
    const firstLine = lines[0];
    const firstLineIsExercise = /(\d+)\s*(?:组\s*)?[xX×*]\s*(\d+|AMRAP|amrap|力竭)/.test(firstLine);

    let dayName: string;
    let focusArea = '';
    let exerciseStartIdx: number;

    if (firstLineIsExercise) {
      // 该 block 以动作开头 → 没有训练日名称 → 合并到上一个训练日（如果存在）
      if (days.length > 0) {
        const lastDay = days[days.length - 1];
        for (let i = 0; i < lines.length; i++) {
          const parsed = parseExerciseLine(lines[i]);
          if (parsed) lastDay.exercises.push(parsed);
        }
        continue; // 跳过创建新训练日
      }
      // 没有上一个训练日 → 自动命名
      dayName = `训练日 ${days.length + 1}`;
      focusArea = '全身';
      exerciseStartIdx = 0;
    } else {
      // 第一行是训练日名称
      dayName = firstLine;
      exerciseStartIdx = 1;

      // 提取括号中的肌群
      const parenMatch = dayName.match(/[（(]([^）)]+)[）)]/);
      if (parenMatch) {
        focusArea = parenMatch[1];
        dayName = dayName.replace(/[（(][^）)]+[）)]/, '').trim();
      }

      // 去掉星期前缀
      const noWeekday = dayName
        .replace(/^(周[一二三四五六日]|星期[一二三四五六日]|[A-Z][a-z]+day|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s*/i, '')
        .trim();
      if (noWeekday) dayName = noWeekday;
      if (!focusArea) focusArea = dayName;
    }

    // 解析动作行
    const exercises: ParsedExercise[] = [];
    for (let i = exerciseStartIdx; i < lines.length; i++) {
      const segments = splitBySeparators(lines[i]);
      for (const seg of segments) {
        const parsed = parseExerciseLine(seg);
        if (parsed) exercises.push(parsed);
      }
    }

    if (exercises.length > 0) {
      days.push({ dayName, focusArea, exercises });
    }
  }

  return days;
}

// ============================================================
// 按分隔符拆分行（逗号/顿号/分号分隔的多个动作）
// ============================================================

function splitBySeparators(line: string): string[] {
  // 在分隔符处拆分，但只拆分后面跟着中文或字母的（避免拆到数字里）
  const parts = line.split(/\s*[，,、；;。]\s*(?=[一-鿿㐀-䶿a-zA-Z])/);
  return parts.filter(p => p.trim());
}

// ============================================================
// 解析单行动作
// ============================================================

function parseExerciseLine(line: string): ParsedExercise | null {
  // 去掉不可见字符
  line = line.replace(/[​‌‍﻿]/g, '').trim();

  // 去掉前置序号（支持更多格式）
  line = line.replace(/^[\d①②③④⑤⑥⑦⑧⑨⑩一二三四五六七八九十]+[、.．)）\s]+/, '').trim();
  // 无分隔符的数字前缀 (如 "1卧推")
  line = line.replace(/^\d{1,2}(?=[一-鿿])/, '').trim();
  line = line.replace(/^[-•·▪▸►⦁➤❯]\s*/, '').trim();
  line = line.replace(/^[|:：]\s*/, '').trim();

  if (!line) return null;

  // 提取末尾备注（中文或英文括号）
  let notes: string | undefined;
  const noteMatch = line.match(/[（(]([^）)]+)[）)]\s*$/);
  if (noteMatch) {
    notes = noteMatch[1];
    line = line.replace(/[（(][^）)]+[）)]\s*$/, '').trim();
  }

  // 提取末尾重量
  let weight: string | undefined;
  const weightMatch = line.match(/(\d+(?:\.\d+)?\s*(?:kg|公斤|lbs|lb|磅))\s*$/i);
  if (weightMatch) {
    weight = weightMatch[1];
    line = line.substring(0, line.length - weightMatch[0].length).trim();
  }

  // 提取 @重量 格式
  const atWeightMatch = line.match(/@(\d+(?:\.\d+)?)\s*$/);
  if (atWeightMatch) {
    weight = atWeightMatch[1] + 'kg';
    line = line.replace(/@\d+(?:\.\d+)?\s*$/, '').trim();
  }

  // 解析 组数 x 次数 (支持多种格式)
  // 4x8-12, 4x8, 4 x 8-12, 4组x8-12次, 4组 x 8-12次, 4*8-12, 4xAMRAP
  const setRepPatterns = [
    /(\d+)\s*(?:组|sets?)?\s*[xX×*]\s*(\d+(?:\s*[-–—]\s*\d+)?|AMRAP|amrap|力竭|至力竭)(?:\s*(?:次|reps?))?/,
    /(\d+)\s*[xX×*]\s*(\d+(?:\s*[-–—]\s*\d+)?|AMRAP|amrap)/i,
    // 中文空格分隔: "4组 8-12次" "4组8-12次"
    /(\d+)\s*组\s*(\d+(?:\s*[-–—]\s*\d+)?|AMRAP|amrap|力竭|至力竭)\s*次?/,
  ];

  let sets = 3;  // 默认组数
  let reps = '8-12';  // 默认次数
  let name = line;

  // 尝试解析 组数 x 次数
  let setRepMatch: RegExpMatchArray | null = null;
  for (const pattern of setRepPatterns) {
    setRepMatch = line.match(pattern);
    if (setRepMatch) break;
  }

  if (setRepMatch) {
    sets = parseInt(setRepMatch[1], 10);
    reps = setRepMatch[2].replace(/\s+/g, '').toUpperCase();
    if (reps === '力竭' || reps === '至力竭') reps = 'AMRAP';
    // 从行中移除 组x次 部分，剩余为动作名
    name = line.replace(setRepMatch[0], '').trim();
  }
  // 如果没匹配到组x次，整行就是动作名（使用默认 3 组 × 8-12 次）

  // 去掉可能残留在末尾的特殊字符
  name = name.replace(/[@:：|]\s*$/, '').trim();

  if (!name) return null;

  // 模糊匹配动作库
  const matched = fuzzyMatchExercise(name);

  return {
    name,
    matchedId: matched?.id ?? null,
    sets,
    reps,
    weight,
    notes,
  };
}

// ============================================================
// 模糊匹配 V2 — 针对中文优化
// ============================================================

// 常见修饰词，匹配时可以忽略
const MODIFIERS = [
  '杠铃', '哑铃', '站姿', '坐姿', '俯身', '仰卧', '单臂', '双臂',
  '宽握', '窄握', '正手', '反手', '高位', '低位', '上斜', '下斜',
  '器械', '龙门架', '绳索', '弹力带', '壶铃', '史密斯',
];

function fuzzyMatchExercise(input: string): (typeof exerciseLibrary)[0] | null {
  const normalized = input.trim();

  // 1. 完全匹配（忽略大小写）
  const exact = exerciseLibrary.find(
    (e) => e.name === normalized || e.nameEn.toLowerCase() === normalized.toLowerCase()
  );
  if (exact) return exact;

  const lowerInput = normalized.toLowerCase();

  // 2. 包含匹配
  for (const ex of exerciseLibrary) {
    const lowerName = ex.name.toLowerCase();
    const lowerEn = ex.nameEn.toLowerCase();

    // 输入包含完整动作名，或动作名包含完整输入
    if (lowerInput.includes(lowerName) || lowerName.includes(lowerInput)) return ex;
    if (lowerInput.includes(lowerEn) || lowerEn.includes(lowerInput)) return ex;
  }

  // 3. 去掉修饰词后再匹配
  let strippedInput = lowerInput;
  for (const mod of MODIFIERS) {
    strippedInput = strippedInput.replace(mod, '');
  }
  strippedInput = strippedInput.trim();

  if (strippedInput.length >= 2) {
    for (const ex of exerciseLibrary) {
      let strippedExName = ex.name.toLowerCase();
      for (const mod of MODIFIERS) {
        strippedExName = strippedExName.replace(mod, '');
      }
      strippedExName = strippedExName.trim();

      if (strippedInput.includes(strippedExName) || strippedExName.includes(strippedInput)) {
        return ex;
      }
    }
  }

  // 4. 中文 bigram 重叠匹配（2 字片段至少 1 个匹配 + 单字高覆盖）
  if (/[一-鿿]/.test(normalized)) {
    let bestMatch: (typeof exerciseLibrary)[0] | null = null;
    let bestScore = 0;

    for (const ex of exerciseLibrary) {
      const score = chineseCharOverlap(normalized, ex.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = ex;
      }
    }

    // 需要至少 3 个字的输入 + 至少 50% 字符覆盖
    if (bestMatch && normalized.length >= 3 && bestScore >= 0.5) {
      return bestMatch;
    }
  }

  // 5. 英文关键词匹配（按空格/连字符分词）
  const keywords = lowerInput.split(/[\s\-–—/]+/).filter((k) => k.length >= 2);
  if (keywords.length > 0) {
    for (const ex of exerciseLibrary) {
      const exText = (ex.name + ' ' + ex.nameEn).toLowerCase();
      const matchCount = keywords.filter((kw) => exText.includes(kw)).length;
      if (matchCount >= keywords.length * 0.5) return ex;
    }
  }

  return null;
}

/** 中文字符重叠度 */
function chineseCharOverlap(input: string, target: string): number {
  const inputClean = input.replace(/\s+/g, '');
  const targetClean = target.replace(/\s+/g, '');
  const inputChars = Array.from(new Set(inputClean.split('')));
  const targetSet = new Set(targetClean.split(''));
  let overlap = 0;
  for (let i = 0; i < inputChars.length; i++) {
    if (targetSet.has(inputChars[i])) overlap++;
  }
  return overlap / Math.max(inputChars.length, 1);
}

// ============================================================
// 转为 TrainingDay / WeeklyPlan
// ============================================================

const dayMapping = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function parsedToTrainingDays(days: ParsedDay[]): TrainingDay[] {
  return days.map((pd, idx) => {
    const exercises: WorkoutExercise[] = pd.exercises.map((pe) => ({
      exerciseId: pe.matchedId || 'custom',
      sets: pe.sets,
      reps: pe.reps,
      weightSuggestion: pe.weight || '自选',
      targetRPE: 8,
      restSeconds: 90,
      notes: pe.notes,
      progressionStrategy: '每周尝试增加重量或次数',
      customName: pe.matchedId ? undefined : pe.name,
    }));

    return {
      id: `custom-${idx}`,
      dayOfWeek: dayMapping[idx] || 'monday',
      focusArea: pd.focusArea,
      type: 'strength' as const,
      estimatedDuration: exercises.length * 10,
      warmup: '5分钟动态拉伸 + 轻重量热身',
      exercises,
    };
  });
}

export function parsedToWeeklyPlan(days: ParsedDay[]): WeeklyPlan {
  const trainingDays = parsedToTrainingDays(days);
  return {
    id: `custom-${Date.now()}`,
    goalType: 'hypertrophy',
    name: '自定义训练计划',
    description: `通过粘贴导入创建的 ${trainingDays.filter(d => d.exercises.length > 0).length} 天训练计划`,
    daysPerWeek: trainingDays.filter((d) => d.exercises.length > 0).length,
    trainingDays,
    weeklyPrinciples: ['自定义计划，根据自身感受调整强度', '注意记录每次训练的重量和次数'],
    overloadStrategy: '根据自身进步节奏递增重量或次数',
  };
}
