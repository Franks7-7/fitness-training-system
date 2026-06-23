// 将 free-exercise-db 数据转为项目 Exercise 格式
const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'exercises-raw.json'), 'utf-8'));
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';

// 肌群英文→中文映射
const muscleMap = {
  'abdominals': 'core',
  'abductors': 'legs',
  'adductors': 'legs',
  'biceps': 'arms',
  'calves': 'legs',
  'cardiovascular system': 'full-body',
  'chest': 'chest',
  'delts': 'shoulders',
  'forearms': 'arms',
  'glutes': 'glutes',
  'hamstrings': 'legs',
  'lats': 'back',
  'lower back': 'back',
  'middle back': 'back',
  'neck': 'back',
  'quadriceps': 'legs',
  'shoulders': 'shoulders',
  'traps': 'back',
  'triceps': 'arms',
};

// 装备中文映射
const equipmentMap = {
  'body only': '无（自重）',
  'barbell': '杠铃',
  'dumbbell': '哑铃',
  'kettlebells': '壶铃',
  'cable': '龙门架/拉力器',
  'machine': '器械',
  'e-z curl bar': '曲杠',
  'bands': '弹力带',
  'medicine ball': '药球',
  'exercise ball': '健身球',
  'foam roll': '泡沫轴',
  'other': '其他',
};

const levelMap = { 'beginner': 'beginner', 'intermediate': 'intermediate', 'expert': 'advanced' };

// 常见动作中英文名映射（人工补充）
const nameMap = {
  '3/4 Sit-Up': '卷腹',
  'Air Bike': '空中蹬车',
  'Alternate Incline Dumbbell Curl': '上斜交替哑铃弯举',
  'Arnold Dumbbell Press': '阿诺德推举',
  'Barbell Bench Press - Medium Grip': '杠铃卧推（中握距）',
  'Barbell Curl': '杠铃弯举',
  'Barbell Deadlift': '杠铃硬拉',
  'Barbell Full Squat': '杠铃深蹲（全蹲）',
  'Barbell Squat': '杠铃深蹲',
  'Bent Over Barbell Row': '俯身杠铃划船',
  'Bodyweight Squat': '自重深蹲',
  'Butterfly': '蝴蝶机夹胸',
  'Cable Crossover': '龙门架夹胸',
  'Chin-Up': '反手引体向上',
  'Close-Grip Barbell Bench Press': '窄握杠铃卧推',
  'Crunches': '卷腹',
  'Deadlift': '硬拉',
  'Decline Barbell Bench Press': '下斜杠铃卧推',
  'Dumbbell Bench Press': '哑铃卧推',
  'Dumbbell Flyes': '哑铃飞鸟',
  'Dumbbell Lateral Raise': '哑铃侧平举',
  'Dumbbell Lunges': '哑铃弓步蹲',
  'Dumbbell Shoulder Press': '哑铃肩推',
  'Dumbbell Shrug': '哑铃耸肩',
  'Face Pull': '面拉',
  'Front Dumbbell Raise': '哑铃前平举',
  'Hack Squat': '哈克深蹲',
  'Hammer Curls': '锤式弯举',
  'Hanging Leg Raise': '悬垂举腿',
  'Incline Dumbbell Bench Press': '上斜哑铃卧推',
  'Incline Dumbbell Curl': '上斜哑铃弯举',
  'Incline Dumbbell Flyes': '上斜哑铃飞鸟',
  'Lat Pulldown': '高位下拉',
  'Leg Curl': '腿弯举',
  'Leg Press': '腿举',
  'Lying Leg Curls': '俯卧腿弯举',
  'Lying Triceps Press': '仰卧臂屈伸',
  'Overhead Press': '站姿杠铃推举',
  'Plank': '平板支撑',
  'Pullups': '引体向上',
  'Push-Ups': '俯卧撑',
  'Romanian Deadlift': '罗马尼亚硬拉',
  'Seated Cable Rows': '坐姿划船',
  'Side Lateral Raise': '哑铃侧平举',
  'Standing Calf Raises': '站姿提踵',
  'Stiff-Legged Deadlift': '直腿硬拉',
  'Triceps Pushdown': '绳索下压',
  'V-Bar Pulldown': 'V柄高位下拉',
};

function mapMuscles(muscles) {
  return [...new Set(muscles.map(m => muscleMap[m] || 'full-body').filter(Boolean))];
}

function mapLevel(level) {
  return levelMap[level] || 'beginner';
}

function mapCategory(mechanic) {
  if (mechanic === 'compound') return 'compound';
  return 'isolation';
}

function mapEquipment(equipment) {
  if (!equipment) return '其他';
  const lower = equipment.toLowerCase();
  for (const [key, val] of Object.entries(equipmentMap)) {
    if (lower.includes(key)) return val;
  }
  return equipment;
}

const converted = raw.map((ex, idx) => {
  const nameZh = nameMap[ex.name] || ex.name;
  const imageUrls = (ex.images || []).map(img =>
    `${IMG_BASE}/${img}`
  );

  return {
    id: `ext-${ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`,
    name: nameZh,
    nameEn: ex.name,
    category: mapCategory(ex.mechanic),
    primaryMuscles: mapMuscles(ex.primaryMuscles || []),
    secondaryMuscles: mapMuscles(ex.secondaryMuscles || []),
    difficulty: mapLevel(ex.level),
    description: `${ex.name} — ${ex.mechanic === 'compound' ? '复合动作' : '孤立动作'}，主要训练${(ex.primaryMuscles || []).join('、')}。`,
    instructions: ex.instructions || [],
    commonMistakes: [],
    metValue: ex.mechanic === 'compound' ? 5.5 : 3.5,
    equipment: mapEquipment(ex.equipment),
    imageUrl: imageUrls[0] || undefined,
  };
});

// 输出结果（只保留有效的）
const valid = converted.filter(e => e.id && e.name);

// 写入文件
const outPath = path.join(__dirname, '..', 'data', 'exercises-db.ts');
const content = `import type { Exercise } from '@/types';

// ============================================================
// 扩展动作库 — 基于 free-exercise-db (873 个动作)
// 图片来源: yuhonas/free-exercise-db (Unlicense 协议)
// ============================================================

export const extendedExerciseLibrary: Exercise[] = ${JSON.stringify(valid, null, 2)};

export function getExtendedExerciseById(id: string): Exercise | undefined {
  return extendedExerciseLibrary.find((e) => e.id === id);
}
`;

fs.writeFileSync(outPath, content, 'utf-8');
console.log(`Converted ${valid.length} exercises → ${outPath}`);
