---

# Oh My OpenCode 概览

了解 Oh My OpenCode，这是一款将 OpenCode 转化为最佳 Agent 编排框架的插件。

---

## 一句话总结

> **Sisyphus Agent 强烈推荐使用 Opus 4.6 模型。使用其他模型可能导致体验显著下降。**

**想偷懒？** 只要在提示词中包含 `ultrawork`（或 `ulw`）。就这样。Agent 会自动处理剩下的事情。

**需要精确控制？** 按 **Tab** 进入 Prometheus（规划者）模式，通过访谈流程创建工作计划，然后运行 `/start-work` 由完整的编排系统执行。

---

## Oh My OpenCode 能为你做什么

- **从描述构建功能**：只需告诉 Agent 你想要什么。它会制定计划、编写代码并确保其正常工作。全自动。你不需要关心细节。
- **调试和修复问题**：描述一个 bug 或粘贴错误信息。Agent 会分析你的代码库，识别问题并实现修复。
- **浏览任何代码库**：询问关于代码库的任何问题。Agent 对你的整个项目结构保持感知。
- **自动化繁琐任务**：修复 lint 问题、解决合并冲突、编写发布说明——全部在单个命令中完成。

---

## 两种工作方式

### 方式一：Ultrawork 模式（适合快速工作）

如果你感到懒散，只需在提示词中包含 **`ultrawork`**（或 **`ulw`**）：

```
ulw add authentication to my Next.js app
```

Agent 会自动：
1. 探索你的代码库以理解现有模式
2. 通过专门的 Agent 研究最佳实践
3. 遵循你的约定实现功能
4. 通过诊断和测试进行验证
5. 持续工作直到完成

这是"只管做"模式。全自动模式。
Agent 已经足够聪明，它会自己探索代码库并制定计划。
**你不需要想得那么深。Agent 会替你想。**

### 方式二：Prometheus 模式（适合精确工作）

对于复杂或关键任务，按 **Tab** 切换到 Prometheus（规划者）模式。

**工作流程：**

1. **Prometheus 访谈你** — 作为你的个人顾问，提出澄清性问题，同时研究你的代码库以准确理解你的需求。

2. **生成计划** — 基于访谈，Prometheus 生成详细的工作计划，包含任务、验收标准和保障措施。可选择由 Momus（计划审核者）进行高精度验证。

3. **运行 `/start-work`** — Atlas 接管：
   - 将任务分配给专门的子 Agent
   - 独立验证每个任务的完成情况
   - 跨任务积累学习经验
   - 跨会话跟踪进度（随时恢复）

**何时使用 Prometheus：**
- 跨多天或多会话的项目
- 关键的生产环境变更
- 跨越多文件的复杂重构
- 当你需要文档化的决策记录时

---

## 关键使用指南

### 始终同时使用 Prometheus 和编排器

**不要在没有 `/start-work` 的情况下使用 `atlas`。**

编排器旨在执行由 Prometheus 创建的工作计划。直接使用而没有计划会导致不可预测的行为。

**正确的工作流程：**
```
1. 按 Tab → 进入 Prometheus 模式
2. 描述工作 → Prometheus 访谈你
3. 确认计划 → 审阅 .sisyphus/plans/*.md
4. 运行 /start-work → 编排器执行
```

**Prometheus 和 Atlas 是一对。始终一起使用它们。**

---

## 模型配置

Oh My OpenCode 根据你可用的提供商自动配置模型。你不需要手动指定每个模型。

### 模型如何确定

**1. 安装时（交互式安装程序）**

当你运行 `bunx oh-my-opencode install` 时，安装程序会询问你拥有哪些提供商：
- Claude Pro/Max 订阅？
- OpenAI/ChatGPT Plus？
- Google Gemini？
- GitHub Copilot？
- OpenCode Zen？
- Z.ai Coding Plan？

根据你的回答，它会生成 `~/.config/opencode/oh-my-opencode.json`，为每个 Agent 和类别分配最优的模型。

**2. 运行时（回退链）**

每个 Agent 都有一个**提供商优先链**。系统按顺序尝试提供商，直到找到可用的模型：

```
示例：multimodal-looker
google → openai → zai-coding-plan → anthropic → opencode
   ↓        ↓           ↓              ↓           ↓
gemini   gpt-5.2     glm-4.6v       haiku     gpt-5-nano
```

如果你有 Gemini，它使用 `google/gemini-3-flash`。没有 Gemini 但有 Claude？使用 `anthropic/claude-haiku-4-5`。以此类推。

### 配置示例

以下是同时拥有 **Claude、OpenAI、Gemini 和 Z.ai** 的用户的真实配置：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "agents": {
    // 仅覆盖特定 Agent - 其余使用回退链
    "atlas": { "model": "anthropic/claude-sonnet-4-6", "variant": "max" },
    "librarian": { "model": "zai-coding-plan/glm-4.7" },
    "explore": { "model": "opencode/gpt-5-nano" },
    "multimodal-looker": { "model": "zai-coding-plan/glm-4.6v" }
  },
  "categories": {
    // 覆盖类别以优化成本
    "quick": { "model": "opencode/gpt-5-nano" },
    "unspecified-low": { "model": "zai-coding-plan/glm-4.7" }
  },
  "experimental": {
    "aggressive_truncation": true
  }
}
```

**要点：**
- 你只需要覆盖想要更改的部分
- 未指定的 Agent/类别使用自动回退链
- 自由混合提供商（Claude 用于主要工作，Z.ai 用于低成本任务等）

### 查找可用模型

运行 `opencode models` 查看环境中所有可用的模型。模型名称遵循 `provider/model-name` 格式。

### 了解更多

有关详细配置选项，包括按 Agent 设置、类别自定义等，请参阅[配置指南](../configurations.md)。

---

## 下一步

- [理解编排系统](./understanding-orchestration-system.md) — 深入了解 Prometheus → 编排器 → Junior 工作流程
- [Ultrawork 宣言](../ultrawork-manifesto.md) — Oh My OpenCode 背后的哲学和原则
- [安装指南](./installation.md) — 详细的安装说明
- [配置指南](../configurations.md) — 自定义 Agent、模型和行为
- [功能参考](../features.md) — 完整的功能文档
