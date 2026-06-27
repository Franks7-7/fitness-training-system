# 🏋️ Training System V1

**健身训练规划 PWA** — 一个功能完整的健身训练规划 Web 应用，支持训练计划管理、903 个动作库、粘贴文本智能导入，可离线使用。

🔗 **线上地址**: [franks7-7.github.io/fitness-training-system](https://franks7-7.github.io/fitness-training-system/)

---

## ✨ 功能

| 页面 | 说明 |
|------|------|
| 🏠 **首页** | 自动匹配今日训练，大卡片展示动作详情（组数 / 次数 / RPE / 休息 / 重量 / 备注），支持多计划切换 |
| 🎯 **目标系统** | 4 种训练目标（增肌 / 增力 / 减脂 / 维持）+ 6 大训练理论（RPE、渐进超负荷、恢复周期等） |
| 📋 **训练计划库** | 7 套标准训练计划，按目标筛选，展开查看详情，一键导入自定义编辑 |
| 📚 **动作库** | 30 个核心动作 + 873 个扩展动作，按肌群 / 难度 / 器械类型筛选，含 GIF 动图预览 |
| ✏️ **自定义计划** | 3 种模式：一键导入预设计划 / 可视化逐日编辑 / **粘贴文本智能导入** |

### 🧠 粘贴智能导入

支持自然语言解析，将训练笔记直接转换为结构化计划：

```
周一 推日（胸+肩+三头）
卧推 4x8-12 70kg
上斜哑铃卧推 3x10-12
侧平举 4x15-20
绳索下压 3x12-15
```

- 自动识别日期、动作名、组数×次数、重量
- 中文模糊匹配：去修饰词 + 字符重叠度评分，自动关联动作库
- 未匹配动作保留原名，不影响导入

### 📱 PWA 支持

- Service Worker + Manifest，支持离线访问
- 可添加到手机 / 电脑主屏幕，像原生 App 一样使用
- 深色主题，移动端优先设计

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| 语言 | TypeScript（全量类型覆盖） |
| 存储 | localStorage（全客户端，零后端） |
| 部署 | GitHub Pages（静态导出） |
| PWA | Service Worker + Web App Manifest |
| 数据 | 903 动作来自 [free-exercise-db](https://github.com/yuhonas/free-exercise-db) |

---

## 📁 项目结构

```
fitness-training-system/
├── app/                    # Next.js App Router 页面
│   ├── page.tsx            # 首页 - 今日训练
│   ├── goal-system/        # 目标系统
│   ├── training-plan/      # 训练计划库
│   ├── exercise-library/   # 动作库
│   └── custom-plan/        # 自定义计划编辑器
├── components/             # 可复用组件
│   ├── PasteImporter.tsx   # 粘贴文本导入
│   ├── WeeklyPlan.tsx      # 周计划可视化
│   ├── ExerciseCard.tsx    # 动作卡片
│   └── ...
├── data/                   # 数据层
│   ├── exercises.ts        # 30 个核心动作
│   ├── exercises-db.ts     # 873 个扩展动作 (1.1MB)
│   └── trainingPlans.ts    # 7 套标准训练计划
├── utils/                  # 工具函数
│   └── planParser.ts       # 文本解析引擎
├── types/                  # TypeScript 类型定义
├── public/                 # 静态资源（PWA manifest、图标）
├── docs/                   # 构建产物（GitHub Pages 部署目录）
└── scripts/                # 数据转换脚本
```

---

## 🚀 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:3000/fitness-training-system
```

> 注意：应用 basePath 为 `/fitness-training-system`，开发时也需带此前缀访问。

## 📦 构建与部署

```bash
# 构建静态文件
npm run build

# 复制到 docs/（GitHub Pages 部署目录）
cp -r out docs

# 提交并推送
git add -A
git commit -m "Update build"
git push origin main
```

GitHub Pages 配置：Settings → Pages → Source 选择 `main` 分支的 `/docs` 目录。

---

## 📝 7 套训练计划

| 计划 | 目标 | 频率 | 适合人群 |
|------|------|------|----------|
| PPL 6 天 | 增肌 | 6天/周 | 中高级 |
| Bro Split 五分化 | 增肌 | 5天/周 | 中级 |
| 三分化精简 | 增肌 | 3天/周 | 新手 |
| ULPPL 混合 | 增肌 | 5天/周 | 中高级 |
| Upper/Lower | 增力 | 4天/周 | 中级 |
| 力量+有氧 | 减脂 | 5天/周 | 通用 |
| 全身训练 | 维持 | 3天/周 | 忙碌人群 |

---

## 📄 License

MIT
