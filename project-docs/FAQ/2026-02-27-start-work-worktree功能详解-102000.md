# start-work worktree 功能详解

> 生成时间：2026-02-27 10:20:00
> 来源：OpenCode 会话总结
> 主题关键词：start-work, worktree, git-worktree, --worktree, boulder

## 背景与问题

用户想了解 `/start-work` 命令新增的 `--worktree` 功能的具体实现和工作原理，特别是：
1. 这个功能到底做了什么？
2. 使用场景是什么？
3. 是否真的能切换分支工作？

## 讨论要点

### 1. Git Worktree 基本概念

Git Worktree 允许在同一个仓库中**同时检出多个分支到不同的目录**，互不干扰：

```bash
# 创建 worktree
git worktree add ../oh-my-opencode-feature-a feature-a-branch

# 结果：多个独立工作目录
# - oh-my-opencode/ (main branch)
# - oh-my-opencode-feature-a/ (feature-a-branch)
```

### 2. 代码实现机制

**涉及的文件**：
- `src/hooks/start-work/parse-user-request.ts` - 解析 `--worktree` 参数
- `src/hooks/start-work/worktree-detector.ts` - 检测 worktree 路径
- `src/hooks/start-work/start-work-hook.ts` - 保存到 boulder.json 并显示提示

**核心代码逻辑**：

```typescript
// 1. 解析用户请求，提取 --worktree 参数
const { planName, explicitWorktreePath } = parseUserRequest(promptText)

// 2. 检测 worktree 路径（使用 git rev-parse --show-toplevel）
const { worktreePath, block: worktreeBlock } = resolveWorktreeContext(explicitWorktreePath)

// 3. 保存到 boulder.json
writeBoulderState(ctx.directory, {
  ...existingState,
  worktree_path: worktreePath,  // 新增字段
})

// 4. 在 contextInfo 中显示
contextInfo = `**Worktree**: ${worktreePath}`
```

### 3. 使用方式

**方式一：指定具体路径**
```bash
/start-work my-plan --worktree /path/to/worktree
```

**方式二：不指定路径（让模型决定）**
```bash
/start-work my-plan --worktree
```
系统会提示：
```
## Worktree Setup Required

No worktree specified. Before starting work, you MUST choose or create one:

1. `git worktree list --porcelain` — list existing worktrees
2. Create if needed: `git worktree add <absolute-path> <branch-or-HEAD>`
3. Update `.sisyphus/boulder.json` — add `"worktree_path": "<absolute-path>"`
4. Work exclusively inside that worktree directory
```

### 4. 使用场景

| 场景 | 说明 |
|------|------|
| **并行开发** | 同时在 feature-a 和 feature-b 上工作，互不干扰 |
| **Hotfix** | 生产环境紧急 bug，不中断当前开发 |
| **多会话** | 多个 Sisyphus 会话同时执行不同计划 |

### 5. 关键发现：提示性 ≠ 自动切换

**重要结论**：当前实现只是**提示性功能**，不是自动切换。

当你运行：
```bash
/start-work my-plan --worktree ../oh-my-opencode-feature-a
```

**你会看到**：
```
**Worktree**: /Users/cy/workspace/oh-my-opencode-feature-a
```

**但实际执行**：
- `Read(filePath="src/index.ts")` → 读取的是 **当前目录** 的文件
- `Write(filePath="src/new.ts")` → 写入到 **当前目录**
- `Bash(command="git status")` → 显示 **当前分支** 的状态

**原因**：`ctx.directory` 从未被修改，工具执行的 cwd 仍然是原始目录。

## 结论与决策

### 核心理解

```typescript
/start-work my-plan --worktree /path/to/worktree
         │              │
         │              └── 只是告诉 Sisyphus："你应该在这里工作"
         │                  （但实际工具执行还是在当前目录）
         │
         └── 你的对话框（dev 分支）保持不变
```

### 正确的工作方式

如果想在 worktree 中工作，需要**显式操作**：

```bash
# 在 Sisyphus 会话中
Read filePath="/path/to/worktree/src/index.ts"
Bash command="cd /path/to/worktree && git status"
Write filePath="/path/to/worktree/src/new.ts" content="..."
```

### 一句话总结

> **worktree 功能 = 告诉 Sisyphus 目标位置，而不是 自动切换到目标位置。**

它和 `git checkout feature-a` 完全不同：
- `git checkout`：改变当前分支
- `--worktree /path`：只是路径提示，cwd 不变，分支也不变

## 相关引用

### 关键文件
- `src/hooks/start-work/start-work-hook.ts` - 主要实现
- `src/hooks/start-work/parse-user-request.ts` - 参数解析
- `src/hooks/start-work/worktree-detector.ts` - 路径检测
- `src/features/boulder-state/types.ts` - boulder.json 类型定义

### 代码片段

**worktree 检测**：
```typescript
// worktree-detector.ts
export function detectWorktreePath(directory: string): string | null {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: directory,
      encoding: "utf-8",
      timeout: 5000,
    }).trim()
  } catch {
    return null
  }
}
```

**boulder.json 结构**：
```json
{
  "active_plan": "/path/to/plan.md",
  "worktree_path": "/Users/cy/workspace/oh-my-opencode-feature-a",
  "session_ids": ["ses_xxx"],
  "plan_name": "plan-name"
}
```

### 外部链接
- [Git Worktree 官方文档](https://git-scm.com/docs/git-worktree)
