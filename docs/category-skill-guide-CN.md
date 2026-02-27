# Category & Skill 系统指南

本文档提供 **Category**（类别）和 **Skill**（技能）系统的完整指南，它们是 Oh-My-OpenCode 可扩展性的核心。

## 1. 概述

与其将所有工作委托给单个 AI 代理，调用针对任务性质定制的**专家**会高效得多。

- **Category**：「这是什么类型的工作？」（决定模型、温度、提示词思维模式）
- **Skill**：「需要什么工具和知识？」（注入专业知识、MCP 工具、工作流程）

通过组合这两个概念，你可以通过 `task` 生成最优代理。

---

## 2. Category 系统

Category 是针对特定领域优化的代理配置预设。

### 内置可用类别

| Category | 默认模型 | 使用场景 |
|----------|----------|----------|
| `visual-engineering` | `google/gemini-3-pro` | 前端、UI/UX、设计、样式、动画 |
| `ultrabrain` | `openai/gpt-5.3-codex` (xhigh) | 深度逻辑推理、需要大量分析的复杂架构决策 |
| `deep` | `openai/gpt-5.3-codex` (medium) | 目标导向的自主问题解决。行动前进行彻底研究。适用于需要深入理解的棘手问题。 |
| `artistry` | `google/gemini-3-pro` (max) | 高度创意/艺术性任务、新颖想法 |
| `quick` | `anthropic/claude-haiku-4-5` | 简单任务——单文件修改、错别字修正、简单变更 |
| `unspecified-low` | `anthropic/claude-sonnet-4-6` | 不适合其他类别的任务，所需精力较低 |
| `unspecified-high` | `anthropic/claude-opus-4-6` (max) | 不适合其他类别的任务，所需精力较高 |
| `writing` | `google/gemini-3-flash` | 文档、文章、技术写作 |

### 使用方法

调用 `task` 工具时指定 `category` 参数。

```typescript
task(
  category="visual-engineering",
  prompt="在仪表板页面添加响应式图表组件"
)
```

### Sisyphus-Junior（委托执行者）

当你使用 Category 时，一个名为 **Sisyphus-Junior** 的特殊代理会执行工作。
- **特点**：无法将任务**再次委托**给其他代理。
- **目的**：防止无限委托循环，确保专注于分配的任务。

---

## 3. Skill 系统

Skill 是一种将特定领域的**专业知识（Context）**和**工具（MCP）**注入代理的机制。

### 内置技能

1. **`git-master`**
   - **能力**：Git 专家。检测提交风格、拆分原子提交、制定 rebase 策略。
   - **MCP**：无（使用 Git 命令）
   - **用途**：提交、历史搜索、分支管理的必备技能。

2. **`playwright`**
   - **能力**：浏览器自动化。网页测试、截图、数据抓取。
   - **MCP**：`@playwright/mcp`（自动执行）
   - **用途**：用于实现后的 UI 验证、E2E 测试编写。

3. **`frontend-ui-ux`**
   - **能力**：注入设计师思维。色彩、排版、动效指南。
   - **用途**：用于超出简单实现范围的美观 UI 工作。

### 使用方法

将所需的技能名称添加到 `load_skills` 数组中。

```typescript
task(
  category="quick",
  load_skills=["git-master"],
  prompt="提交当前更改。遵循提交消息风格。"
)
```

### Skill 自定义（SKILL.md）

你可以直接在项目根目录的 `.opencode/skills/` 或主目录的 `~/.claude/skills/` 中添加自定义技能。

**示例：`.opencode/skills/my-skill/SKILL.md`**

```markdown
---
name: my-skill
description: 我的自定义特殊技能
mcp:
  my-mcp:
    command: npx
    args: ["-y", "my-mcp-server"]
---

# 我的技能提示词

此内容将被注入到代理的系统提示词中。
...
```

---

## 4. 组合策略（Combo）

通过组合 Category 和 Skill，你可以创建强大的专业代理。

### 🎨 设计师（UI 实现）
- **Category**：`visual-engineering`
- **load_skills**：`["frontend-ui-ux", "playwright"]`
- **效果**：实现美观的 UI，并在浏览器中直接验证渲染结果。

### 🏗️ 架构师（设计评审）
- **Category**：`ultrabrain`
- **load_skills**：`[]`（纯推理）
- **效果**：利用 GPT-5.3 Codex 的逻辑推理进行深度系统架构分析。

### ⚡ 维护者（快速修复）
- **Category**：`quick`
- **load_skills**：`["git-master"]`
- **效果**：使用经济高效的模型快速修复代码并生成整洁的提交。

---

## 5. task 提示词指南

委托时，**清晰具体**的提示词至关重要。包含以下 7 个要素：

1. **TASK**：需要做什么？（单一目标）
2. **EXPECTED OUTCOME**：交付物是什么？
3. **REQUIRED SKILLS**：应通过 `load_skills` 加载哪些技能？
4. **REQUIRED TOOLS**：必须使用哪些工具？（白名单）
5. **MUST DO**：必须做什么（约束条件）
6. **MUST NOT DO**：绝不能做什么
7. **CONTEXT**：文件路径、现有模式、参考资料

**反面示例**：
> 「修复这个」

**正面示例**：
> **TASK**：修复 `LoginButton.tsx` 中的移动端布局错位问题
> **CONTEXT**：`src/components/LoginButton.tsx`，使用 Tailwind CSS
> **MUST DO**：在 `md:` 断点更改 flex-direction
> **MUST NOT DO**：修改现有的桌面端布局
> **EXPECTED**：按钮在移动端垂直对齐

---

## 6. 配置指南（oh-my-opencode.json）

你可以在 `oh-my-opencode.json` 中微调类别。

### Category 配置模式（CategoryConfig）

| 字段 | 类型 | 描述 |
|------|------|------|
| `description` | string | 类别用途的可读描述。显示在 task 提示词中。 |
| `model` | string | 要使用的 AI 模型 ID（例如 `anthropic/claude-opus-4-6`） |
| `variant` | string | 模型变体（例如 `max`、`xhigh`） |
| `temperature` | number | 创造性级别（0.0 ~ 2.0）。越低越确定。 |
| `top_p` | number | 核采样参数（0.0 ~ 1.0） |
| `prompt_append` | string | 选择此类别时追加到系统提示词的内容 |
| `thinking` | object | 思考模型配置（`{ type: "enabled", budgetTokens: 16000 }`） |
| `reasoningEffort` | string | 推理努力级别（`low`、`medium`、`high`） |
| `textVerbosity` | string | 文本详细程度（`low`、`medium`、`high`） |
| `tools` | object | 工具使用控制（使用 `{ "tool_name": false }` 禁用） |
| `maxTokens` | number | 最大响应令牌数 |
| `is_unstable_agent` | boolean | 将代理标记为不稳定——强制后台模式以便监控 |

### 配置示例

```jsonc
{
  "categories": {
    // 1. 定义新的自定义类别
    "korean-writer": {
      "model": "google/gemini-3-flash",
      "temperature": 0.5,
      "prompt_append": "你是一位韩语技术作家。保持友好清晰的语调。"
    },
    
    // 2. 覆盖现有类别（更改模型）
    "visual-engineering": {
      "model": "openai/gpt-5.2", // 可以更改模型
      "temperature": 0.8
    },

    // 3. 配置思考模型并限制工具
    "deep-reasoning": {
      "model": "anthropic/claude-opus-4-6",
      "thinking": {
        "type": "enabled",
        "budgetTokens": 32000
      },
      "tools": {
        "websearch_web_search_exa": false // 禁用网络搜索
      }
    }
  },
  
  // 禁用技能
  "disabled_skills": ["playwright"]
}
```
