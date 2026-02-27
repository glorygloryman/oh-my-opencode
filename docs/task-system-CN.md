# 任务系统

Oh My OpenCode 的任务系统提供结构化的任务管理，支持依赖追踪和并行执行优化。

## 关于 Claude Code 对齐说明

本实现遵循 Claude Code 内部 Task 工具的签名规范（`TaskCreate`、`TaskUpdate`、`TaskList`、`TaskGet`）和字段命名约定（`subject`、`blockedBy`、`blocks` 等）。

**但 Anthropic 尚未发布这些工具的官方文档。** Task 工具存在于 Claude Code 中，但未在 `docs.anthropic.com` 或 `code.claude.com` 上文档化。

这是 **Oh My OpenCode 的自主实现**，基于对 Claude Code 行为的观察和内部规范。

## 工具

| 工具 | 用途 |
|------|------|
| `TaskCreate` | 创建任务，自动生成 ID（`T-{uuid}`） |
| `TaskGet` | 根据 ID 获取完整任务详情 |
| `TaskList` | 列出活跃任务及未解决的阻塞项 |
| `TaskUpdate` | 更新状态、依赖关系或元数据 |

## 任务结构

```ts
interface Task {
  id: string              // T-{uuid}
  subject: string         // 祈使句形式：「运行测试」
  description: string
  status: "pending" | "in_progress" | "completed" | "deleted"
  activeForm?: string     // 进行时形式：「正在运行测试」
  blocks: string[]        // 被本任务阻塞的任务列表
  blockedBy: string[]     // 阻塞本任务的任务列表
  owner?: string          // 代理名称
  metadata?: Record<string, unknown>
  threadID: string        // 会话 ID（自动设置）
}
```

## 依赖与并行执行

```
[构建前端]    ──┐
              ├──→ [集成测试] ──→ [部署]
[构建后端]    ──┘
```

- `blockedBy` 为空的任务可并行执行
- 有依赖的任务会等待其阻塞项完成

## 示例工作流

```ts
TaskCreate({ subject: "构建前端" })                    // T-001
TaskCreate({ subject: "构建后端" })                    // T-002
TaskCreate({ subject: "运行集成测试",
             blockedBy: ["T-001", "T-002"] })          // T-003
```

```ts
TaskList()
// T-001 [pending] 构建前端        blockedBy: []
// T-002 [pending] 构建后端        blockedBy: []
// T-003 [pending] 集成测试        blockedBy: [T-001, T-002]
```

```ts
TaskUpdate({ id: "T-001", status: "completed" })
TaskUpdate({ id: "T-002", status: "completed" })
// T-003 现已解除阻塞
```

## 存储

任务以 JSON 文件形式存储：

```
.sisyphus/tasks/
```

## 与 TodoWrite 的区别

| 特性 | TodoWrite | 任务系统 |
|------|-----------|----------|
| 存储 | 会话内存 | 文件系统 |
| 持久性 | 关闭后丢失 | 重启后保留 |
| 依赖关系 | 不支持 | 完整支持（`blockedBy`） |
| 并行执行 | 手动管理 | 自动优化 |

## 使用场景

以下情况使用任务系统：
- 工作包含多个有依赖关系的步骤
- 多个子代理需要协作
- 进度需要跨会话持久保存
