# oh-my-opencode.json 配置文件详解

## 概述

这是 OhMyOpenCode 插件的核心配置文件，用于定义各个 Agent 和任务类别使用的模型。配置文件位于 `~/.config/opencode/oh-my-opencode.json`。

## 配置结构

```json
{
  "$schema": "...",
  "agents": { ... },
  "categories": { ... }
}
```

---

## 顶层字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `$schema` | string | JSON Schema 验证规则地址，用于 IDE 智能提示和配置校验 |
| `agents` | object | 定义各个专用 Agent 使用的模型 |
| `categories` | object | 定义不同任务类别使用的模型 |

---

## Agents（智能体）

OhMyOpenCode 采用多 Agent 架构，每个 Agent 有特定的职责和擅长的领域。

### Agent 列表

| Agent 名称 | 模型配置 | 职责说明 |
|------------|----------|----------|
| **hephaestus** | `opencode/big-pickle` | **自主深度工作者** - 目标导向的自主执行，灵感来自 AmpCode 的 deep mode。先探索后行动，不停止直到 100% 完成 |
| **oracle** | `opencode/big-pickle` | **架构与调试专家** - 高 IQ 战略支援，当主 Agent 陷入循环或遇到困难时提供帮助 |
| **librarian** | `opencode/big-pickle` | **文档与代码搜索** - 搜索官方文档、开源实现、代码库历史 |
| **explore** | `opencode/big-pickle` | **快速代码库探索** - 闪电般的 grep 搜索，用于快速定位代码 |
| **multimodal-looker** | `opencode/big-pickle` | **多模态视觉分析** - 处理图像、截图、视觉相关任务 |
| **prometheus** | `opencode/big-pickle` | **规划者** - 通过对话式流程创建工作计划，按 Tab 进入此模式 |
| **metis** | `opencode/big-pickle` | **计划顾问** - 评估和优化 Prometheus 创建的工作计划 |
| **momus** | `opencode/big-pickle` | **评论家** - 代码审查、质量检查、提供改进建议 |
| **atlas** | `opencode/big-pickle` | **协调者** - 多 Agent 任务协调和编排 |

### 希腊神话背景

这些 Agent 的命名都来自希腊神话：

- **Sisyphus** - 被惩罚永无止境推巨石上山的人，象征持续执行
- **Hephaestus** - 火与锻造之神，代表精湛的工艺和创造
- **Oracle** - 神谕，代表智慧和预见
- **Prometheus** - 先知，代表规划和远见
- **Metis** - 智慧女神，代表谋略和 counsel
- **Momus** - 嘲讽之神，代表批判性思维
- **Atlas** - 泰坦神，背负天空，代表协调和支撑

---

## Categories（任务类别）

Categories 用于根据任务性质自动选择合适的模型。

| 类别名称 | 模型配置 | 适用场景 |
|----------|----------|----------|
| **visual-engineering** | `opencode/big-pickle` | 视觉工程 - UI 组件开发、样式调整、前端可视化 |
| **ultrabrain** | `opencode/big-pickle` | 超级大脑 - 复杂推理、多步骤规划、需要深度思考的任务 |
| **deep** | `opencode/big-pickle` | 深度任务 - 需要深入分析和全面理解的工作 |
| **artistry** | `opencode/big-pickle` | 艺术创作 - 创意设计、美学相关任务 |
| **quick** | `opencode/big-pickle` | 快速任务 - 简单查询、小修改、不需要深度思考的工作 |
| **unspecified-low** | `opencode/big-pickle` | 低优先级未指定 - 未明确分类的低复杂度任务 |
| **unspecified-high** | `opencode/big-pickle` | 高优先级未指定 - 未明确分类的高复杂度任务 |
| **writing** | `opencode/big-pickle` | 写作任务 - 文档编写、注释、说明文字 |

---

## 模型分配优先级

当有多个 Provider 可用时，模型选择遵循以下优先级：

```
Native (anthropic/, openai/, google/) > GitHub Copilot > OpenCode Zen > Z.ai Coding Plan
```

由于你当前没有配置任何订阅，所有 Agent 和 Category 都使用 `opencode/big-pickle` 作为后备模型。

---

## 推荐配置（有订阅时）

如果你有相应的订阅，推荐配置如下：

### 有 Claude Pro/Max 订阅

```json
{
  "agents": {
    "hephaestus": { "model": "openai/gpt-5.2" },
    "oracle": { "model": "openai/gpt-5.2" },
    "librarian": { "model": "anthropic/claude-sonnet-4.5" },
    "explore": { "model": "anthropic/claude-haiku-4.5" },
    "multimodal-looker": { "model": "google/gemini-3-pro" },
    "prometheus": { "model": "anthropic/claude-opus-4.5" },
    "metis": { "model": "anthropic/claude-sonnet-4.5" },
    "momus": { "model": "anthropic/claude-sonnet-4.5" },
    "atlas": { "model": "anthropic/claude-opus-4.5" }
  }
}
```

### 模型选择原则

| 模型 | 适用场景 |
|------|----------|
| `anthropic/claude-opus-4.5` | 主 Agent (Sisyphus)、复杂规划、高质量输出 |
| `anthropic/claude-sonnet-4.5` | 平衡性能与成本，适合大多数任务 |
| `anthropic/claude-haiku-4.5` | 快速响应，适合探索和简单任务 |
| `openai/gpt-5.2` | Oracle、调试、高 IQ 战略支援 |
| `google/gemini-3-pro` | 多模态、前端 UI/UX |

---

## 如何修改配置

### 方法一：直接编辑文件

```bash
# 使用你喜欢的编辑器
vim ~/.config/opencode/oh-my-opencode.json
# 或
code ~/.config/opencode/oh-my-opencode.json
```

### 方法二：项目级配置

在项目根目录创建 `.opencode/oh-my-opencode.json`，会覆盖用户级配置：

```bash
mkdir -p .opencode
# 创建项目特定配置
```

### 方法三：重新运行安装程序

```bash
npx oh-my-opencode install --no-tui --claude=max20 --openai=yes --gemini=yes
```

---

## 参考链接

- [OhMyOpenCode 官方仓库](https://github.com/code-yeongyu/oh-my-opencode)
- [配置文档](https://github.com/code-yeongyu/oh-my-opencode/blob/master/docs/configurations.md)
- [Overview Guide](https://github.com/code-yeongyu/oh-my-opencode/blob/master/docs/guide/overview.md)
