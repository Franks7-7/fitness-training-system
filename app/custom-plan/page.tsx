'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { WeeklyPlan, TrainingDay, WorkoutExercise, RPELevel } from '@/types';
import { exerciseLibrary, getExerciseById } from '@/data/exercises';
import { weeklyPlans } from '@/data/trainingPlans';
import { parseTrainingText, parsedToWeeklyPlan } from '@/utils/planParser';

// ============================================================
// 常量
// ============================================================

const STORAGE_KEY = 'fitness-custom-plans';
const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const RPE_OPTIONS: RPELevel[] = [6, 7, 8, 9, 10];
const REST_OPTIONS = [30, 45, 60, 90, 120, 150, 180];

const EXAMPLE_TEXT = `周一 推日（胸+肩+三头）
卧推 4x8-12 70kg
上斜哑铃卧推 3x10-12
侧平举 4x15-20
绳索下压 3x12-15

周二 拉日（背+后肩+二头）
硬拉 3x5 120kg
引体向上 4x8-12
杠铃划船 3x8-12
面拉 3x15-20
杠铃弯举 3x10-15

周三 腿日（股四+腘绳+臀）
杠铃深蹲 4x8-12
罗马尼亚硬拉 3x10-12
保加利亚分腿蹲 3x10-12
站姿提踵 4x15-20`;

// ============================================================
// 工具
// ============================================================

function loadPlans(): WeeklyPlan[] {
  if (typeof window === 'undefined') return [];
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function savePlansToStorage(plans: WeeklyPlan[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plans)); } catch {}
}

function makeEmptyDay(idx: number): TrainingDay {
  return {
    id: `day-${idx}`, dayOfWeek: DAY_KEYS[idx], focusArea: '',
    type: 'strength', estimatedDuration: 0, warmup: '', exercises: [],
  };
}

function makeEmptyExercise(): WorkoutExercise {
  return {
    exerciseId: '', sets: 4, reps: '8-12', weightSuggestion: '',
    targetRPE: 8, restSeconds: 90, notes: '', progressionStrategy: '每周尝试增加重量或次数',
  };
}

// ============================================================
// 主页面
// ============================================================

function CustomPlanPage() {
  const searchParams = useSearchParams();
  const editParam = searchParams.get('edit');
  const importParam = searchParams.get('import');

  const [mode, setMode] = useState<'visual' | 'paste' | 'import'>('import');
  const [savedPlans, setSavedPlans] = useState<WeeklyPlan[]>([]);
  const [editPlan, setEditPlan] = useState<WeeklyPlan | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // ---- 可视化编辑器状态 ----
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>(() => DAY_KEYS.map((_, i) => makeEmptyDay(i)));
  const [activeDay, setActiveDay] = useState(0);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // ---- 粘贴导入状态 ----
  const [pasteText, setPasteText] = useState('');
  const [pastePreview, setPastePreview] = useState<WeeklyPlan | null>(null);
  const [pasteError, setPasteError] = useState('');

  // 初始化
  useEffect(() => { setSavedPlans(loadPlans()); }, []);

  // 从 URL 参数加载本地保存的计划
  useEffect(() => {
    if (editParam) {
      const all = loadPlans();
      const target = all.find(p => p.id === editParam);
      if (target) {
        setEditPlan(JSON.parse(JSON.stringify(target)));
        setMode('visual');
      }
    }
  }, [editParam]);

  // 从训练计划库导入预设计划
  useEffect(() => {
    if (importParam) {
      const preset = weeklyPlans.find(p => p.id === importParam);
      if (preset) {
        const cloned = JSON.parse(JSON.stringify(preset));
        setPlanName(cloned.name);
        setPlanDesc(cloned.description);
        setTrainingDays(cloned.trainingDays && cloned.trainingDays.length ? cloned.trainingDays : DAY_KEYS.map((_, i) => makeEmptyDay(i)));
        setActiveDay(0);
        setShowPicker(false);
        setEditPlan(cloned);
        setMode('visual');
      }
    }
  }, [importParam]);

  // 编辑已有计划时重置编辑器
  useEffect(() => {
    if (editPlan) {
      setPlanName(editPlan.name);
      setPlanDesc(editPlan.description);
      setTrainingDays(editPlan.trainingDays.length ? editPlan.trainingDays : DAY_KEYS.map((_, i) => makeEmptyDay(i)));
      setActiveDay(0);
      setShowPicker(false);
    }
  }, [editPlan]);

  const day = trainingDays[activeDay];

  // ---- 编辑器操作 ----

  const updateDay = (field: keyof TrainingDay, value: any) => {
    setTrainingDays(prev => prev.map((d, i) => (i === activeDay ? { ...d, [field]: value } : d)));
  };

  const toggleRest = () => {
    if (day.type === 'rest') {
      updateDay('type', 'strength');
    } else {
      setTrainingDays(prev => prev.map((d, i) =>
        i === activeDay ? { ...d, type: 'rest' as const, exercises: [], focusArea: '休息日' } : d));
    }
  };

  const addExercise = (exerciseId: string) => {
    const ex = exerciseLibrary.find(e => e.id === exerciseId);
    const newEx: WorkoutExercise = {
      ...makeEmptyExercise(), exerciseId,
      notes: ex ? `${ex.name} — ${ex.category === 'compound' ? '复合动作，优先完成' : '孤立动作，注意感受肌肉'}` : '',
    };
    setTrainingDays(prev => prev.map((d, i) =>
      i === activeDay ? { ...d, exercises: [...d.exercises, newEx] } : d));
    setShowPicker(false);
    setExerciseSearch('');
  };

  const addCustomExercise = () => {
    if (!exerciseSearch.trim()) return;
    const newEx: WorkoutExercise = { ...makeEmptyExercise(), exerciseId: 'custom', customName: exerciseSearch.trim() };
    setTrainingDays(prev => prev.map((d, i) =>
      i === activeDay ? { ...d, exercises: [...d.exercises, newEx] } : d));
    setShowPicker(false);
    setExerciseSearch('');
  };

  const updateExercise = (exIdx: number, field: keyof WorkoutExercise, value: any) => {
    setTrainingDays(prev => prev.map((d, i) => i === activeDay
      ? { ...d, exercises: d.exercises.map((ex, j) => j === exIdx ? { ...ex, [field]: value } : ex) }
      : d));
  };

  const removeExercise = (exIdx: number) => {
    setTrainingDays(prev => prev.map((d, i) => i === activeDay
      ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) }
      : d));
  };

  const clearDay = () => {
    setTrainingDays(prev => prev.map((d, i) =>
      i === activeDay ? { ...d, exercises: [], focusArea: '', warmup: '' } : d));
  };

  const handleSave = () => {
    const nonRest = trainingDays.filter(d => d.type !== 'rest' && d.exercises.length > 0);
    if (nonRest.length === 0) return;
    const plan: WeeklyPlan = {
      id: editPlan?.id || `custom-${Date.now()}`,
      goalType: 'hypertrophy', name: planName || '自定义训练计划',
      description: planDesc || `包含 ${nonRest.length} 个训练日的自定义计划`,
      daysPerWeek: nonRest.length, trainingDays,
      weeklyPrinciples: ['自定义计划', '根据自身感受调整强度'],
      overloadStrategy: '根据自身进步节奏递增',
    };
    const existing = savedPlans.findIndex(p => p.id === plan.id);
    const updated = existing >= 0 ? savedPlans.map((p, i) => i === existing ? plan : p) : [...savedPlans, plan];
    setSavedPlans(updated);
    savePlansToStorage(updated);
    setEditPlan(null);
    resetBuilder();
    setSavedMsg('✅ 已保存！');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const resetBuilder = () => {
    setPlanName('');
    setPlanDesc('');
    setTrainingDays(DAY_KEYS.map((_, i) => makeEmptyDay(i)));
    setActiveDay(0);
    setShowPicker(false);
    setExerciseSearch('');
  };

  // ---- 粘贴导入 ----

  const handleParse = () => {
    setPasteError('');
    if (!pasteText.trim()) { setPasteError('请先粘贴训练文本'); return; }
    const parsed = parseTrainingText(pasteText);
    if (parsed.length === 0) { setPasteError('未能解析出训练内容，请检查格式'); return; }

    // 打印诊断信息到控制台
    console.log('=== 粘贴解析诊断 ===');
    console.log('原始行数:', pasteText.split('\n').filter(l => l.trim()).length);
    console.log('解析出训练日:', parsed.length);
    parsed.forEach((d, i) => {
      console.log(`  训练日${i+1} "${d.dayName}" → ${d.exercises.length} 个动作`);
      d.exercises.forEach((e, j) => console.log(`    ${j+1}. ${e.name} | ${e.sets}x${e.reps} | matched=${e.matchedId || 'none'}`));
    });
    console.log('总动作数:', parsed.reduce((s, d) => s + d.exercises.length, 0));

    setPastePreview(parsedToWeeklyPlan(parsed));
  };

  const handleImport = () => {
    if (!pastePreview) return;
    // 直接从 pastePreview 设置所有状态，避免 useEffect 异步时序问题
    const plan = pastePreview;
    setPlanName(plan.name);
    setPlanDesc(plan.description);
    if (plan.trainingDays && plan.trainingDays.length > 0) {
      setTrainingDays(plan.trainingDays);
    }
    setActiveDay(0);
    setShowPicker(false);
    setEditPlan(plan); // 保留用于保存时检测 editPlan.id
    setMode('visual');
    setPasteText('');
    setPastePreview(null);
  };

  // ---- 过滤动作库 ----
  const filteredEx = exerciseSearch.trim()
    ? exerciseLibrary.filter(e =>
        e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        e.nameEn.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
        e.primaryMuscles.some(m => m.includes(exerciseSearch.toLowerCase())))
    : exerciseLibrary;

  const totalExercises = trainingDays.reduce((s, d) => s + d.exercises.length, 0);
  const activeExercises = day.exercises;

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-white">✏️ 自定义计划</h1>
          <p className="text-sm text-gym-muted mt-1">可视化编辑或粘贴导入 — 创建你自己的训练计划</p>
        </div>
        <button onClick={resetBuilder} className="bg-primary-600 hover:bg-primary-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">+ 新建</button>
      </div>

      {/* 保存提示 */}
      {savedMsg && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-2.5 text-sm text-green-400 text-center animate-pulse">{savedMsg}</div>
      )}

      {/* 模式切换 */}
      <div className="flex gap-1 bg-gym-card rounded-xl p-1 border border-gym-border">
        <button onClick={() => setMode('import')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === 'import' ? 'bg-primary-600 text-white' : 'text-gym-muted hover:text-white'}`}>
          📥 一键导入
        </button>
        <button onClick={() => setMode('visual')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === 'visual' ? 'bg-primary-600 text-white' : 'text-gym-muted hover:text-white'}`}>
          🛠️ 可视化编辑
        </button>
        <button onClick={() => setMode('paste')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${mode === 'paste' ? 'bg-primary-600 text-white' : 'text-gym-muted hover:text-white'}`}>
          📋 粘贴导入
        </button>
      </div>

      {/* ========== 一键导入模式 ========== */}
      {mode === 'import' && (
        <div className="space-y-3">
          <p className="text-sm text-gym-text">选择一个预设训练计划，一键导入到可视化编辑器。所有动作已自动匹配动作库。</p>
          {weeklyPlans.map((plan) => (
            <div key={plan.id} className="bg-gym-card border border-gym-border hover:border-primary-500/40 rounded-xl p-4 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white">{plan.name}</h3>
                    <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">{plan.daysPerWeek} 天/周</span>
                  </div>
                  <p className="text-xs text-gym-text mt-1">{plan.description}</p>
                </div>
              </div>
              {/* 训练日预览 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-3">
                {plan.trainingDays.filter(d => d.exercises.length > 0).slice(0, 6).map(td => (
                  <div key={td.id} className="bg-gym-dark rounded-lg px-2.5 py-1.5 text-xs">
                    <span className="text-gym-text font-medium block truncate">{td.focusArea}</span>
                    <span className="text-gym-muted">{td.exercises.length} 动作 · 约{td.estimatedDuration}分钟</span>
                  </div>
                ))}
              </div>
              {/* 匹配状态 */}
              <div className="flex items-center gap-1 mb-3 text-xs text-green-400">
                <span>✓</span>
                <span>
                  {plan.trainingDays.reduce((s, d) => s + d.exercises.filter(e => e.exerciseId !== 'custom').length, 0)} 个动作已匹配动作库
                </span>
              </div>
              <button
                onClick={() => {
                  setEditPlan(JSON.parse(JSON.stringify(plan))); // deep clone
                  setMode('visual');
                }}
                className="w-full bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                📥 导入此计划 → 可视化编辑
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ========== 粘贴导入模式 ========== */}
      {mode === 'paste' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white">粘贴你的训练文本</label>
              <button onClick={() => { setPasteText(EXAMPLE_TEXT); setPasteError(''); setPastePreview(null); }} className="text-xs text-primary-400 hover:text-primary-300">← 填入示例</button>
            </div>
            <textarea value={pasteText} onChange={e => { setPasteText(e.target.value); setPastePreview(null); setPasteError(''); }}
              placeholder="在此粘贴训练计划...&#10;&#10;格式：动作名 组数x次数&#10;空行分隔不同训练日..."
              rows={10}
              className="w-full bg-gym-dark border border-gym-border rounded-xl px-4 py-3 text-sm text-white placeholder-gym-muted focus:outline-none focus:border-primary-500/50 resize-y font-mono"
            />
          </div>
          {pasteError && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 whitespace-pre-line">{pasteError}</div>}
          <div className="flex gap-2">
            <button onClick={handleParse} className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg text-sm font-medium">🔍 解析预览</button>
            {pasteText && <button onClick={() => { setPasteText(''); setPastePreview(null); setPasteError(''); }} className="px-4 py-2.5 bg-gym-card border border-gym-border text-gym-muted hover:text-white rounded-lg text-sm">清空</button>}
          </div>
          {/* 预览 */}
          {pastePreview && (
            <div className="bg-gym-card border border-primary-500/30 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-gym-border flex items-center justify-between">
                <div><h3 className="font-bold text-white">{pastePreview.name}</h3><p className="text-xs text-gym-muted">
                  {pastePreview.trainingDays.filter(d => d.exercises.length > 0).length} 天 ·{' '}
                  <span className="text-white font-bold">{pastePreview.trainingDays.reduce((s, d) => s + d.exercises.length, 0)}</span> 个动作
                  {pastePreview.trainingDays.map(d => d.exercises.length).filter(Boolean).join('+') !== String(pastePreview.trainingDays.reduce((s, d) => s + d.exercises.length, 0)) && (
                    <>（各天：{pastePreview.trainingDays.filter(d => d.exercises.length > 0).map(d => d.exercises.length).join('+')}）</>
                  )}
                </p></div>
                <button onClick={handleImport} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium">✅ 导入编辑</button>
              </div>
              <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {pastePreview.trainingDays.filter(d => d.exercises.length > 0).map((td, i) => (
                  <div key={td.id} className="bg-gym-dark rounded-lg p-3 border border-gym-border">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs text-primary-400 font-mono">{i + 1}</span>
                      <h4 className="text-sm font-semibold text-white">{td.focusArea}</h4>
                    </div>
                    {td.exercises.map((we, j) => {
                      const ex = we.exerciseId !== 'custom' ? getExerciseById(we.exerciseId) : null;
                      return (
                        <div key={j} className="flex items-center gap-2 text-xs text-gym-text ml-4">
                          <span className={ex ? 'text-green-400' : 'text-yellow-400'}>{ex ? '✓' : '~'}</span>
                          <span className="flex-1">{ex?.name || we.customName || we.notes || '未命名'}</span>
                          <span className="text-gym-muted font-mono">{we.sets}×{we.reps}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* 逐行诊断 */}
          {pastePreview && (
            <details className="bg-gym-card border border-yellow-500/20 rounded-xl overflow-hidden">
              <summary className="p-3 text-sm text-yellow-400 cursor-pointer hover:text-yellow-300">📊 逐行诊断 — 查看每行解析结果</summary>
              <div className="px-4 pb-4 space-y-1 max-h-60 overflow-y-auto font-mono text-xs">
                {pasteText.split('\n').map((rawLine, i) => {
                  const line = rawLine.trim();
                  if (!line) return <div key={i} className="text-gym-muted">— 空行 —</div>;
                  // 检查此行是否被解析为动作
                  let found: { dayName: string; exName: string; sets: number; reps: string } | null = null;
                  for (const td of pastePreview.trainingDays) {
                    for (const we of td.exercises) {
                      const ex = getExerciseById(we.exerciseId);
                      const exName = ex?.name || we.customName || we.notes || '';
                      if (exName && line.includes(exName.substring(0, 2))) {
                        found = { dayName: td.focusArea, exName, sets: we.sets, reps: we.reps };
                        break;
                      }
                    }
                    if (found) break;
                  }
                  if (found) {
                    return <div key={i} className="text-green-400">✓ 行{i+1}: <span className="text-gym-text">"{found.exName}"</span> → <span className="text-gym-muted">{found.sets}×{found.reps}</span> <span className="text-yellow-400">[{found.dayName}]</span></div>;
                  }
                  // 可能是训练日名称
                  for (const td of pastePreview.trainingDays) {
                    if (td.focusArea && line.includes(td.focusArea.substring(0, 2))) {
                      return <div key={i} className="text-primary-400">📅 行{i+1}: <span className="text-gym-text">"{line}"</span> → 训练日名称</div>;
                    }
                  }
                  return <div key={i} className="text-red-400">✗ 行{i+1}: <span className="text-gym-text">"{line}"</span> → 未识别</div>;
                })}
              </div>
            </details>
          )}

          <details className="bg-gym-card border border-gym-border rounded-xl overflow-hidden">
            <summary className="p-3 text-sm text-gym-muted cursor-pointer hover:text-white">📖 支持哪些粘贴格式？</summary>
            <div className="px-4 pb-4 space-y-2 text-xs text-gym-text">
              <p><code className="bg-gym-dark px-1.5 py-0.5 rounded text-gym-muted">动作名 组数x次数</code> 如 卧推 4x8-12</p>
              <p><code className="bg-gym-dark px-1.5 py-0.5 rounded text-gym-muted">动作名 组数x次数 重量</code> 如 卧推 4x8-12 70kg</p>
              <p><code className="bg-gym-dark px-1.5 py-0.5 rounded text-gym-muted">动作名</code> 纯动作名（自动默认3组×8-12次）</p>
              <p>用<b>空行</b>分隔不同训练日。第一行写训练日名称。</p>
            </div>
          </details>
        </div>
      )}

      {/* ========== 可视化编辑模式 ========== */}
      {mode === 'visual' && (
        <div className="space-y-4">
          {/* 计划名称 */}
          <div className="space-y-2">
            <input type="text" value={planName} onChange={e => setPlanName(e.target.value)}
              placeholder="计划名称（如：我的 PPL 训练）"
              className="w-full bg-gym-dark border border-gym-border rounded-xl px-4 py-2.5 text-white text-sm placeholder-gym-muted focus:outline-none focus:border-primary-500/50"
            />
            <input type="text" value={planDesc} onChange={e => setPlanDesc(e.target.value)}
              placeholder="简短描述（可选）"
              className="w-full bg-gym-dark border border-gym-border rounded-xl px-4 py-2.5 text-gym-text text-sm placeholder-gym-muted focus:outline-none focus:border-primary-500/50"
            />
          </div>

          {/* 训练日横滑标签 */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {trainingDays.map((d, i) => (
              <button key={d.id} onClick={() => { setActiveDay(i); setShowPicker(false); }}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  i === activeDay ? 'bg-primary-600 text-white' :
                  d.type === 'rest' ? 'bg-gym-card/40 text-gym-muted border border-gym-border/50' :
                  d.exercises.length > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  'bg-gym-card text-gym-muted border border-gym-border'
                }`}>
                <div>{DAY_LABELS[i]}</div>
                <div className="text-[10px] mt-0.5 opacity-70">
                  {d.type === 'rest' ? '休息' : d.exercises.length > 0 ? `${d.exercises.length}动作` : '空'}
                </div>
              </button>
            ))}
          </div>

          {/* 当前训练日编辑卡片 */}
          <div className="bg-gym-card border border-gym-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">{DAY_LABELS[activeDay]}</h3>
              <div className="flex gap-2">
                <button onClick={toggleRest}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${day.type === 'rest' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'}`}>
                  {day.type === 'rest' ? '设为训练日' : '设为休息日'}
                </button>
                {day.exercises.length > 0 && (
                  <button onClick={clearDay} className="text-xs px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20">清空</button>
                )}
              </div>
            </div>

            {day.type === 'rest' ? (
              <p className="text-sm text-gym-muted text-center py-8">😴 休息日 — 好好恢复</p>
            ) : (
              <>
                <input type="text" value={day.focusArea} onChange={e => updateDay('focusArea', e.target.value)}
                  placeholder="训练日名称（如：推日 / 胸+三头）"
                  className="w-full bg-gym-dark border border-gym-border rounded-lg px-3 py-2 text-sm text-white placeholder-gym-muted focus:outline-none focus:border-primary-500/50 mb-2"
                />
                <input type="text" value={day.warmup} onChange={e => updateDay('warmup', e.target.value)}
                  placeholder="热身建议（可选）"
                  className="w-full bg-gym-dark border border-gym-border rounded-lg px-3 py-2 text-xs text-gym-text placeholder-gym-muted focus:outline-none focus:border-primary-500/50 mb-3"
                />

                {/* 已添加的动作 */}
                <div className="space-y-2 mb-3">
                  {activeExercises.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gym-border rounded-lg">
                      <p className="text-3xl mb-2">🏋️</p>
                      <p className="text-sm text-gym-muted">还没有动作</p>
                      <p className="text-xs text-gym-muted mt-1">点击下方按钮添加第一个动作</p>
                    </div>
                  )}
                  {activeExercises.map((we, exIdx) => {
                    const ex = we.exerciseId !== 'custom' ? exerciseLibrary.find(e => e.id === we.exerciseId) : null;
                    return (
                      <div key={exIdx} className="bg-gym-dark rounded-lg p-3 border border-gym-border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white truncate flex-1">
                            {ex?.name || we.customName || we.notes || '未命名'}
                          </span>
                          <button onClick={() => removeExercise(exIdx)} className="text-xs text-red-400 hover:text-red-300 ml-2 shrink-0">✕</button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] text-gym-muted block mb-0.5">组数</label>
                            <input type="number" value={we.sets} onChange={e => updateExercise(exIdx, 'sets', parseInt(e.target.value) || 1)}
                              min={1} max={10}
                              className="w-full bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary-500/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gym-muted block mb-0.5">次数</label>
                            <input type="text" value={we.reps} onChange={e => updateExercise(exIdx, 'reps', e.target.value)}
                              placeholder="8-12"
                              className="w-full bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary-500/50" />
                          </div>
                          <div>
                            <label className="text-[10px] text-gym-muted block mb-0.5">RPE</label>
                            <select value={we.targetRPE} onChange={e => updateExercise(exIdx, 'targetRPE', parseInt(e.target.value) as RPELevel)}
                              className="w-full bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary-500/50">
                              {RPE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gym-muted block mb-0.5">休息(s)</label>
                            <select value={we.restSeconds} onChange={e => updateExercise(exIdx, 'restSeconds', parseInt(e.target.value))}
                              className="w-full bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary-500/50">
                              {REST_OPTIONS.map(r => <option key={r} value={r}>{r}s</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={we.weightSuggestion} onChange={e => updateExercise(exIdx, 'weightSuggestion', e.target.value)}
                            placeholder="建议重量（如：70kg）"
                            className="bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-gym-text placeholder-gym-muted focus:outline-none focus:border-primary-500/50" />
                          <input type="text" value={we.notes || ''} onChange={e => updateExercise(exIdx, 'notes', e.target.value)}
                            placeholder="备注"
                            className="bg-gym-card border border-gym-border rounded px-2 py-1 text-xs text-gym-text placeholder-gym-muted focus:outline-none focus:border-primary-500/50" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 添加动作按钮 / 搜索面板 */}
                {showPicker ? (
                  <div className="bg-gym-dark border border-primary-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2">
                      <input type="text" value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)}
                        placeholder="搜索动作名 或输入自定义动作..."
                        className="flex-1 bg-gym-card border border-gym-border rounded-lg px-3 py-2 text-sm text-white placeholder-gym-muted focus:outline-none focus:border-primary-500/50"
                        autoFocus
                        onKeyDown={e => {
                          if (e.key === 'Enter' && exerciseSearch.trim()) {
                            const match = filteredEx[0];
                            match ? addExercise(match.id) : addCustomExercise();
                          }
                        }}
                      />
                      <button onClick={() => { setShowPicker(false); setExerciseSearch(''); }} className="text-xs px-3 py-2 text-gym-muted hover:text-white">取消</button>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {(exerciseSearch.trim() ? filteredEx : exerciseLibrary).map(ex => (
                        <button key={ex.id} onClick={() => addExercise(ex.id)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-500/10 text-sm text-gym-text hover:text-white transition-colors flex items-center justify-between">
                          <span>{ex.name}</span>
                          <span className="text-xs text-gym-muted">{ex.primaryMuscles[0]} | {ex.category === 'compound' ? '复合' : '孤立'}</span>
                        </button>
                      ))}
                      {exerciseSearch.trim() && (
                        <button onClick={addCustomExercise} className="w-full text-left px-3 py-2 rounded-lg hover:bg-yellow-500/10 text-sm text-yellow-400 transition-colors">
                          + 添加自定义动作：「{exerciseSearch}」
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowPicker(true)}
                    className="w-full py-3 border-2 border-dashed border-gym-border rounded-lg text-sm text-gym-muted hover:text-white hover:border-primary-500/30 transition-colors">
                    + 添加动作
                  </button>
                )}
              </>
            )}
          </div>

          {/* 底部统计 + 保存 */}
          <div className="flex items-center justify-between bg-gym-card border border-gym-border rounded-xl p-4">
            <span className="text-sm text-gym-text">
              共 {trainingDays.filter(d => d.type !== 'rest' && d.exercises.length > 0).length} 个训练日 · {totalExercises} 个动作
            </span>
            <button onClick={handleSave} disabled={totalExercises === 0}
              className="bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              💾 保存计划
            </button>
          </div>
        </div>
      )}

      {/* 已保存的计划 */}
      <div>
        <button onClick={() => setShowSaved(!showSaved)}
          className="flex items-center gap-2 text-sm text-gym-muted hover:text-white transition-colors">
          <span>{showSaved ? '▼' : '▶'}</span> 已保存的计划 ({savedPlans.length})
        </button>
        {showSaved && (
          <div className="mt-2 space-y-2">
            {savedPlans.length === 0 ? (
              <p className="text-sm text-gym-muted text-center py-4">暂无保存的计划</p>
            ) : savedPlans.map(plan => (
              <div key={plan.id} className="bg-gym-card border border-gym-border rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white text-sm truncate">{plan.name}</h3>
                  <p className="text-xs text-gym-muted mt-0.5">
                    {plan.trainingDays.filter(d => d.type !== 'rest' && d.exercises.length > 0).length} 天 · {plan.trainingDays.reduce((s, d) => s + d.exercises.length, 0)} 动作
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => { setEditPlan(plan); setMode('visual'); }}
                    className="text-xs px-2.5 py-1.5 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-lg hover:bg-primary-500/20">编辑</button>
                  <button onClick={() => {
                    const updated = savedPlans.filter(p => p.id !== plan.id);
                    setSavedPlans(updated); savePlansToStorage(updated);
                    if (editPlan?.id === plan.id) setEditPlan(null);
                  }} className="text-xs px-2.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20">删除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Suspense boundary for useSearchParams
function CustomPlanPageWrapper() {
  return (
    <Suspense fallback={<div className="text-gym-muted text-sm text-center py-12">加载中...</div>}>
      <CustomPlanPage />
    </Suspense>
  );
}

export default CustomPlanPageWrapper;
