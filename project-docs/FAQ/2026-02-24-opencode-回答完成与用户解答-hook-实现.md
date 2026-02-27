# OpenCode 回答完成与用户解答 Hook 实现

> 生成时间：2026-02-24
> 来源：OpenCode 会话总结

## 背景与问题

了解 oh-my-opencode 项目中 OpenCode 插件架构下，关于 AI 回答完成时和用户提交消息时的 hook 实现机制，以及项目文档规范化管理方案。

## 讨论要点

### OpenCode Hook 类型与实现

oh-my-opencode 实现了 Claude Code 兼容的 Hook 系统，支持以下 Hook 事件类型：

```typescript
export type ClaudeHookEvent = 
  | "PreToolUse"      // 工具使用前
  | "PostToolUse"     // 工具使用后
  | "UserPromptSubmit" // 用户提交消息时
  | "Stop"            // AI 回答完成时
  | "PreCompact"      // 会话压缩前
```

### Stop Hook（回答完成时触发）

**文件位置**: `src/hooks/claude-code-hooks/stop.ts`

**核心功能**:
- 当 AI 完成回答并准备停止会话时触发
- 可以阻止会话停止（返回 `block: true`）
- 支持注入 continuation prompt 强制 AI 继续工作
- 控制 `stop_hook_active` 状态

**输出类型定义**:
```typescript
export interface StopOutput {
  decision?: "block" | "continue"
  reason?: string
  stop_hook_active?: boolean
  permission_mode?: PermissionMode
  inject_prompt?: string  // 注入提示词
}
```

**实际应用场景**:
- **Todo Continuation Enforcer**: 当任务未完成时，通过 Stop hook 阻止 AI 停止并强制继续执行
- **Atlas Hook**: 监控会话状态，在适当时机注入 continuation 提示

### UserPromptSubmit Hook（用户提交消息时触发）

**文件位置**: `src/hooks/claude-code-hooks/user-prompt-submit.ts`

**核心功能**:
- 当用户提交新的 prompt 时触发
- 支持拦截/修改用户输入
- 可注入系统消息（通过 `<user-prompt-submit-hook>` 标签包裹）
- 根据条件阻止消息处理

**输入类型定义**:
```typescript
export interface UserPromptSubmitInput {
  session_id: string
  cwd: string
  permission_mode?: PermissionMode
  hook_event_name: "UserPromptSubmit"
  prompt: string
  session?: { id: string }
  hook_source?: HookSource
}
```

### Hook 配置方式

这些 hooks 兼容 Claude Code 的 `settings.json` 配置格式，支持用户自定义 hook 命令：

```json
{
  "permissions": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "./my-stop-hook.sh" }]
    }],
    "UserPromptSubmit": [{
      "matcher": "*",
      "hooks": [{ "type": "command", "command": "./my-prompt-hook.sh" }]
    }]
  }
}
```

### 项目文档规范化

按照工程管理规范，建立标准化的文档目录结构：

```
project-docs/
├── api/              # API 接口定义文档
├── design/           # 架构设计文档
├── plans/            # 实施计划
├── reports/          # 测试/评估报告
├── archive/          # 归档资料（含日期前缀）
│   └── 2026-02-24-xxx.md
└── FAQ/              # 知识问答文档
    └── 2026-02-24-xxx.md
```

**文档命名规范**: 所有生成的工程文档必须在文件名前附加 `YYYY-MM-DD-` 的日期前缀。

## 结论与决策

1. **Stop Hook** 是实现"任务未完成时强制继续"（Boulder 机制）的核心组件，通过返回 `block: true` 阻止会话结束，并可注入 continuation prompt 引导 AI 继续工作。

2. **UserPromptSubmit Hook** 提供了用户输入预处理的能力，可用于动态注入上下文、拦截特定指令等场景。

3. 项目文档采用分层的目录结构进行管理，历史资料归档到 `archive/` 目录并附加日期前缀，FAQ 类知识文档存放于 `FAQ/` 目录。

## 相关引用

**Hook 实现文件**:
- `src/hooks/claude-code-hooks/stop.ts` - Stop Hook 实现
- `src/hooks/claude-code-hooks/user-prompt-submit.ts` - UserPromptSubmit Hook 实现
- `src/hooks/claude-code-hooks/types.ts` - Hook 类型定义

**Hook 应用场景**:
- `src/hooks/todo-continuation-enforcer/` - Todo 强制继续机制（使用 Stop Hook）
- `src/hooks/atlas/` - 编排执行器（使用 continuation injection）

**相关规范**:
- 文档目录规范: `project-docs/` 分层结构
- 文件命名规范: `YYYY-MM-DD-主题描述.md`
