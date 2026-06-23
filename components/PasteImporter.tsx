'use client';

import { useState, useRef } from 'react';
import type { WeeklyPlan, Exercise } from '@/types';
import { parseTrainingText, parsedToWeeklyPlan } from '@/utils/planParser';
import { getExerciseById } from '@/data/exercises';

interface Props {
  onImport: (plan: WeeklyPlan) => void;
}

export default function PasteImporter({ onImport }: Props) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<WeeklyPlan | null>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleParse = () => {
    setError('');
    if (!text.trim()) {
      setError('请先粘贴训练文本');
      return;
    }

    const parsed = parseTrainingText(text);
    if (parsed.length === 0) {
      setError('未能解析出训练内容，请检查格式。支持格式：\n训练日名称\n动作名 组数x次数\n动作名 组数x次数\n\n空行分隔不同训练日');
      return;
    }

    const plan = parsedToWeeklyPlan(parsed);
    setPreview(plan);
  };

  const handleImport = () => {
    if (preview) {
      onImport(preview);
      setText('');
      setPreview(null);
    }
  };

  const handleClear = () => {
    setText('');
    setPreview(null);
    setError('');
    textareaRef.current?.focus();
  };

  // 填入示例
  const fillExample = () => {
    setText(`周一 推日（胸+肩+三头）
卧推 4x8-12
上斜哑铃卧推 3x10-12
侧平举 4x15-20
绳索下压 3x12-15

周二 拉日（背+后肩+二头）
硬拉 3x5
引体向上 4x8-12
杠铃划船 3x8-12
面拉 3x15-20
杠铃弯举 3x10-15

周三 腿日（股四+腘绳+臀）
杠铃深蹲 4x8-12
罗马尼亚硬拉 3x10-12
保加利亚分腿蹲 3x10-12
站姿提踵 4x15-20

周四 推日②
哑铃卧推 4x10-12
站姿杠铃推举 3x8-12
俯卧撑 3xAMRAP
哑铃侧平举 4x15-20

周五 拉日②
高位下拉 4x10-12
坐姿划船 3x10-15
俯身哑铃飞鸟 3x15-20
杠铃弯举 3x10-15

周六 腿日②
罗马尼亚硬拉 4x8-10
臀推 4x10-12
腿举 3x10-15
腿弯举 3x12-15`);
    setError('');
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      {/* 输入区 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-white">📋 粘贴训练文本</label>
          <button
            onClick={fillExample}
            className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
          >
            ← 填入示例
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => { setText(e.target.value); setPreview(null); setError(''); }}
          placeholder={`在此粘贴训练计划...\n\n支持格式：\n周一 推日（胸+三头）\n卧推 4x8-12 70kg\n上斜哑铃卧推 3x10-12\n侧平举 4x15-20 （控制节奏）\n\n周二 拉日（背+二头）\n...\n\n提示：用空行分隔不同训练日`}
          rows={10}
          className="w-full bg-gym-dark border border-gym-border rounded-xl px-4 py-3 text-sm text-white placeholder-gym-muted focus:outline-none focus:border-primary-500/50 resize-y font-mono"
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-sm text-red-400 whitespace-pre-line">{error}</p>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleParse}
          className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          🔍 解析预览
        </button>
        {text && (
          <button
            onClick={handleClear}
            className="px-4 py-2.5 bg-gym-card border border-gym-border text-gym-muted hover:text-white rounded-lg text-sm transition-colors"
          >
            清空
          </button>
        )}
      </div>

      {/* 预览结果 */}
      {preview && (
        <div className="bg-gym-card border border-primary-500/30 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gym-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">{preview.name}</h3>
                <p className="text-xs text-gym-muted mt-0.5">
                  解析出 {preview.trainingDays.filter(d => d.exercises.length > 0).length} 个训练日，共{' '}
                  {preview.trainingDays.reduce((sum, d) => sum + d.exercises.length, 0)} 个动作
                </p>
              </div>
              <button
                onClick={handleImport}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ✅ 导入
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {preview.trainingDays.filter(d => d.exercises.length > 0).map((day, i) => (
              <div key={day.id} className="bg-gym-dark rounded-lg p-3 border border-gym-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-primary-400 font-mono">{i + 1}</span>
                  <h4 className="text-sm font-semibold text-white">{day.focusArea}</h4>
                  <span className="text-xs text-gym-muted">({day.exercises.length} 动作)</span>
                </div>
                <div className="space-y-1">
                  {day.exercises.map((we, j) => {
                    const ex = we.exerciseId !== 'custom' ? getExerciseById(we.exerciseId) : null;
                    const name = ex?.name || (we as any).customName || '未知动作';
                    const matched = !!ex;
                    return (
                      <div key={j} className="flex items-center gap-2 text-xs text-gym-text">
                        <span className={matched ? 'text-green-400' : 'text-yellow-400'}>
                          {matched ? '✓' : '~'}
                        </span>
                        <span className="flex-1">{name}</span>
                        <span className="text-gym-muted font-mono">
                          {we.sets}×{we.reps}
                        </span>
                        {we.weightSuggestion && we.weightSuggestion !== '自选' && (
                          <span className="text-gym-muted">{we.weightSuggestion}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-gym-dark/50 border-t border-gym-border">
            <p className="text-xs text-gym-muted">
              ✓ 绿色 = 已匹配动作库 | ~ 黄色 = 自定义动作（未匹配）
            </p>
          </div>
        </div>
      )}

      {/* 格式帮助 */}
      <details className="bg-gym-card border border-gym-border rounded-xl overflow-hidden">
        <summary className="p-3 text-sm text-gym-muted cursor-pointer hover:text-white transition-colors">
          📖 支持哪些粘贴格式？
        </summary>
        <div className="px-4 pb-4 space-y-2 text-xs text-gym-text">
          <div>
            <p className="font-medium text-white mb-1">基础格式</p>
            <code className="block bg-gym-dark p-2 rounded text-gym-muted font-mono">
              动作名 组数x次数<br/>
              卧推 4x8-12
            </code>
          </div>
          <div>
            <p className="font-medium text-white mb-1">带重量</p>
            <code className="block bg-gym-dark p-2 rounded text-gym-muted font-mono">
              卧推 4x8-12 70kg
            </code>
          </div>
          <div>
            <p className="font-medium text-white mb-1">带备注（括号）</p>
            <code className="block bg-gym-dark p-2 rounded text-gym-muted font-mono">
              卧推 4x8-12 （注意离心收缩）
            </code>
          </div>
          <div>
            <p className="font-medium text-white mb-1">中文格式</p>
            <code className="block bg-gym-dark p-2 rounded text-gym-muted font-mono">
              卧推 4组x8-12次 70kg
            </code>
          </div>
          <div>
            <p className="font-medium text-white mb-1">训练日格式</p>
            <code className="block bg-gym-dark p-2 rounded text-gym-muted font-mono">
              周一 推日（胸+肩+三头）<br/>
              卧推 4x8-12<br/>
              ...<br/>
              <br/>
              （空行分隔不同训练日）
            </code>
          </div>
          <p className="text-yellow-400 mt-2">
            💡 提示：系统会自动将动作名匹配到动作库。未匹配的动作仍会保留，但显示为自定义动作。
          </p>
        </div>
      </details>
    </div>
  );
}
