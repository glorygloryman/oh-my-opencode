# Oh My OpenCode 智能体与类别系统详解

本文档详细解释 Oh My OpenCode 中 **Agents（智能体）** 和 **Categories（类别）** 的区别，以及为什么用户只能看到部分智能体。

---

## 问题 1：为什么只有 Sisyphus、Prometheus、Atlas、Hephaestus 四个智能体可见？

### 答案：智能体有三种 `mode`，用户只能看到 `primary` 类型的智能体

### 智能体的三种模式

```typescript
// src/agents/types.ts
export type AgentMode = "primary" | "subagent" | "all"

/**
 * - "primary": 尊重用户在 UI 中选择的模型
 * - "subagent": 使用自己的 fallback 链，忽略 UI 选择  
 * - "all": 两种上下文都可用（OpenCode 兼容性）
 */
```

### 完整智能体列表及其类型

| 智能体 | Mode | 可见性 | 职责 |
|--------|------|--------|------|
| **Sisyphus** | `primary` | ✅ Tab 切换 | 主编排者，规划+委托 |
| **Hephaestus** | `primary` | ✅ Tab 切换 | 自主深度工作者 |
| **Atlas** | `primary` | ✅ Tab 切换 | Todo 列表编排器 |
| **Prometheus** | 内部 | ⚡ Tab 进入规划模式 | 战略规划者 |
| Oracle | `subagent` | ❌ 不可见 | 只读咨询，架构/调试 |
| Librarian | `subagent` | ❌ 不可见 | 外部文档/代码搜索 |
| Explore | `subagent` | ❌ 不可见 | 代码库快速探索 |
| Multimodal-Looker | `subagent` | ❌ 不可见 | PDF/图像分析 |
| Metis | `subagent` | ❌ 不可见 | 预规划咨询 |
| Momus | `subagent` | ❌ 不可见 | 计划审查 |
| Sisyphus-Junior | `subagent` | ❌ 不可见 | Category 执行器 |

### 核心实现机制

```typescript
// src/tools/delegate-task/subagent-resolver.ts (第 57 行)
const callableAgents = agents.filter((a) => a.mode !== "primary")

// 第 70-74 行
if (isPrimaryAgent) {
  return {
    error: `Cannot call primary agent "${isPrimaryAgent.name}" via task. 
            Primary agents are top-level orchestrators.`
  }
}
```

**设计理念**：
- **Primary** = 指挥官（用户可以直接对话）
- **Subagent** = 专家顾问（只能被召唤，不能直接对话）

---

## 问题 2：Agents 和 Categories 的区别是什么？

### 核心对比

| 维度 | Agents（智能体） | Categories（类别） |
|------|------------------|-------------------|
| **本质** | 独立的执行实体 | 配置预设/任务类型标签 |
| **调用方式** | `task(subagent_type="oracle")` | `task(category="ultrabrain")` |
| **底层实现** | 独立的 agent 定义 + 固定 prompt | Sisyphus-Junior + 动态配置 |
| **用户感知** | "谁来做" | "做什么类型的任务" |
| **可扩展性** | 需要写新代码文件 | 只需在 JSON 中添加配置 |
| **模型选择** | 每个 agent 有独立的 fallback 链 | 每个 category 有独立的 fallback 链 |

### Category 工作原理

```
task(category="visual-engineering", prompt="创建登录组件")
        ↓
┌───────────────────────────────────────────┐
│ 1. tools.ts: 检测 category 参数            │
│    → 自动设置 subagent_type = "Sisyphus-Junior" │
└─────────────────────┬─────────────────────┘
                      ↓
┌───────────────────────────────────────────┐
│ 2. category-resolver.ts: 解析 category 配置    │
│    → 读取 visual-engineering 的配置：           │
│      - model: "google/gemini-3-pro"            │
│      - variant: "high"                         │
│      - prompt_append: "You are a frontend..."  │
└─────────────────────┬─────────────────────┘
                      ↓
┌───────────────────────────────────────────┐
│ 3. 创建 Sisyphus-Junior-visual-engineering │
│    → 使用 gemini-3-pro 模型                   │
│    → 注入前端领域指令                          │
└───────────────────────────────────────────┘
```

### 8 个内置 Categories

| Category | 用途 | 默认模型 | 变体 |
|----------|------|----------|------|
| `visual-engineering` | 前端、UI/UX | gemini-3-pro | high |
| `ultrabrain` | 复杂逻辑、架构 | gpt-5.3-codex | xhigh |
| `deep` | 深度分析、自主解决 | gpt-5.3-codex | medium |
| `artistry` | 创意设计 | gemini-3-pro | high |
| `quick` | 简单任务 | claude-haiku-4-5 | - |
| `unspecified-low` | 未分类低复杂度 | claude-sonnet-4-6 | - |
| `unspecified-high` | 未分类高复杂度 | claude-opus-4-6 | max |
| `writing` | 文档编写 | kimi-k2p5 | - |

### Sisyphus-Junior：Category 的执行者

```typescript
// src/agents/sisyphus-junior/agent.ts
// Sisyphus-Junior 是一个"通用执行器模板"
// 它本身没有固定的领域，而是接收 category 配置来动态调整

// 关键特征：
// 1. BLOCKED_TOOLS: ["task"] - 不能调用 task 工具（防止无限递归）
// 2. 可以调用 call_omo_agent (explore/librarian)

// 禁止直接调用：
// src/tools/delegate-task/subagent-resolver.ts
if (subagentType === "Sisyphus-Junior") {
  return { 
    error: `Cannot use subagent_type="Sisyphus-Junior" directly. 
            Use category parameter instead.`
  }
}
```

### 架构图

```
                      task() 调用
                          │
         ┌────────────────┼────────────────┐
         ↓                ↓                ↓
  category="xxx"   subagent_type="yyy"   (直接调用 Sisyphus-Junior)
         │                │                │
         ↓                ↓                ✗ 禁止
┌─────────────────┐ ┌─────────────────┐
│ Category Resolver│ │ Subagent Resolver │
│ 解析配置：        │ │ 直接匹配：         │
│ - model         │ │ - oracle         │
│ - variant       │ │ - explore        │
│ - prompt_append │ │ - librarian      │
└────────┬────────┘ └────────┬────────┘
         ↓                   ↓
┌─────────────────┐ ┌─────────────────┐
│ Sisyphus-Junior │ │  特定 Agent     │
│ + category 配置  │ │  (固定能力)      │
└─────────────────┘ └─────────────────┘
```

---

## 总结

| 概念 | 类比 | 用户操作 | 底层实现 |
|------|------|----------|----------|
| **Primary Agent** | 指挥官 | Tab 切换，直接对话 | `mode: "primary"` |
| **Subagent** | 专家顾问 | `task(subagent_type="oracle")` | `mode: "subagent"` |
| **Category** | 任务标签 | `task(category="visual-engineering")` | Sisyphus-Junior + 配置包 |

**设计哲学**：
- 用户只需关心"我要做什么"→ 选择 category
- 用户需要特定专家 → 直接调用 subagent
- 用户想要控制全局 → 切换 primary agent

---

## 参考文档

- [Oh My OpenCode 配置指南](../configurations-CN.md)
- [智能体与类别系统指南](../category-skill-guide-CN.md)
- [配置文件详解](./oh-my-opencode-config-explained.md)
