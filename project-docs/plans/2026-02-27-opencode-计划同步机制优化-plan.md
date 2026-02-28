# 计划同步机制优化与软链接重构 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 重构 `start-work` 钩子中的计划同步逻辑，使用软链接 (Symlink) 替代物理内容复制，确保计划进度的状态实时同步并消除多个日期历史版本的冗余。

**Architecture:** 将之前在 `start-work-hook.ts` 内部实现的原始复制逻辑抽取为独立的模块。在此模块中强化防卫性编程（校验文件存在），修复计划名称多重后缀问题 (`.md.md`)，采用文件真实创建时间 (birthtime) 作为前缀获取基准并创建指向真实文件的软链接（Symlink）。所有文件 IO 系统行为通过真实的临时目录编写相关的集成 / 单元测试保障。

**Tech Stack:** TypeScript, Bun Test, Node.js (`fs.symlinkSync`, `fs.lstatSync`, `fs.mkdirSync`, `fs.existsSync`, `fs.statSync`)

---

### Task 1: 拆解并创建同步工具方法（包含单元与文件系统集成测试）

我们将遵循 TDD 原则，首先编写涉及软链接真实表现和名称格式化规则的测试用例。

**Files:**

- Create: `src/hooks/start-work/sync-plan.test.ts`
- Create: `src/hooks/start-work/sync-plan.ts`

**Step 1: 编写失败用例**

创建 `src/hooks/start-work/sync-plan.test.ts`并写入：

```typescript
import { expect, test, describe, beforeEach, afterEach } from "bun:test"
import { join } from "node:path"
import { existsSync, mkdirSync, rmSync, writeFileSync, lstatSync, readlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { syncPlanToProjectDocs } from "./sync-plan"

describe("syncPlanToProjectDocs", () => {
  let testDir: string
  let plansDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `sync-plan-test-${randomUUID()}`)
    plansDir = join(testDir, "project-docs", "plans")
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  test("should handle missing plan paths gracefully", () => {
    const ctx = { directory: testDir, client: {} as any }
    const result = syncPlanToProjectDocs(ctx, join(testDir, "nonexistent.md"))
    expect(result.success).toBeFalse()
    expect(result.error).toContain("does not exist")
  })

  test("should strip duplicate .md suffixes and create symlink to real birthtime date", () => {
    const sisyphusPlansDir = join(testDir, ".sisyphus", "plans")
    mkdirSync(sisyphusPlansDir, { recursive: true })
    const planPath = join(sisyphusPlansDir, "my-test.md")
    writeFileSync(planPath, "# Test Plan")
    
    const ctx = { directory: testDir, client: {} as any }
    const result = syncPlanToProjectDocs(ctx, planPath)
    
    expect(result.success).toBeTrue()
    expect(result.targetPath).toBeDefined()
    expect(result.targetPath).toEndWith("my-test.md")
    expect(result.targetPath).not.toEndWith(".md.md")

    // Verify properties of the symlink
    const stat = lstatSync(result.targetPath!)
    expect(stat.isSymbolicLink()).toBeTrue()
    
    const target = readlinkSync(result.targetPath!)
    expect(target).toBe(planPath)
  })

  test("should safely overwrite existing symlink if it exists", () => {
    const sisyphusPlansDir = join(testDir, ".sisyphus", "plans")
    mkdirSync(sisyphusPlansDir, { recursive: true })
    const planPath = join(sisyphusPlansDir, "resume-test.md")
    writeFileSync(planPath, "# Original")
    
    const ctx = { directory: testDir, client: {} as any }
    
    // First run
    syncPlanToProjectDocs(ctx, planPath)
    // Second run
    const result2 = syncPlanToProjectDocs(ctx, planPath)
    
    expect(result2.success).toBeTrue()
    const stat = lstatSync(result2.targetPath!)
    expect(stat.isSymbolicLink()).toBeTrue()
  })
})
```

**Step 2: 运行测试并验证其失败**

Run: `bun test src/hooks/start-work/sync-plan.test.ts`
Expected: FAIL，因为 `sync-plan.ts` 以及里面的方法还没有被定义。

**Step 3: 编写最小可行性实现，让测试通过**

创建 `src/hooks/start-work/sync-plan.ts` 并写入：

```typescript
import { existsSync, mkdirSync, statSync, lstatSync, symlinkSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { PluginInput } from "@opencode-ai/plugin"
import { getPlanName } from "../../features/boulder-state"

export interface SyncPlanResult {
  success: boolean
  targetPath?: string
  error?: string
}

export function syncPlanToProjectDocs(ctx: PluginInput, planPath: string): SyncPlanResult {
  try {
    if (!existsSync(planPath)) {
      return { success: false, error: `source plan ${planPath} does not exist` }
    }

    const stat = statSync(planPath)
    const date = new Date(stat.birthtimeMs || stat.mtimeMs) // Fallback for OSes lacking birthtime
    const dateStr = date.toISOString().split("T")[0] // YYYY-MM-DD
    
    const rawPlanName = getPlanName(planPath)
    const cleanPlanName = rawPlanName.replace(/\.md$/, "")
    
    const targetDir = join(ctx.directory, "project-docs", "plans")
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true })
    }

    const targetPath = join(targetDir, `${dateStr}-${cleanPlanName}.md`)

    if (existsSync(targetPath) || (lstatSync(targetPath, { throwIfNoEntry: false })?.isSymbolicLink())) {
      rmSync(targetPath, { force: true })
    }

    symlinkSync(planPath, targetPath)
    
    return { success: true, targetPath }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { success: false, error: err }
  }
}
```

**Step 4: 再次运行测试并验证通过**

Run: `bun test src/hooks/start-work/sync-plan.test.ts`
Expected: PASS

**Step 5: 提交更改**

Run:

```bash
git add src/hooks/start-work/sync-plan.ts src/hooks/start-work/sync-plan.test.ts
git commit -m "feat: implement symlink-based plan synchronization logic and tests"
```

---

### Task 2: 将原 `start-work-hook` 重构为使用外部纯函数

**Files:**

- Modify: `src/hooks/start-work/start-work-hook.ts`
- Modify: `src/hooks/start-work/index.test.ts`

**Step 1: 先确保现有全局 Hook 测试均通过（避免被破坏），调整引入逻辑**

编辑 `src/hooks/start-work/start-work-hook.ts`，进行如下替换：

删除原有的物理复制 `syncPlanToProjectDocs` 方法定义（以及其包含的 `SyncPlanResult` 接口）。
删除 `import { ... readFileSync, writeFileSync }` （如果仅为 `syncPlanToProjectDocs` 而存在）。
增加新文件的导入：

```typescript
import { syncPlanToProjectDocs } from "./sync-plan"
```

删除原文件中的旧实现片段（Lines 30-65）：

```typescript
interface SyncPlanResult { ... } 
// ...
function syncPlanToProjectDocs(ctx: PluginInput, planPath: string): SyncPlanResult { ... }
```

确保 Hook 的注入处：

```typescript
const syncResult = syncPlanToProjectDocs(ctx, matchedPlan)
```

正常链接并能够调用新抽取进 `sync-plan.ts` 的函数。

**Step 2: 运行测试确保无遗漏或者误伤**

Run: `bun test src/hooks/start-work/index.test.ts`
Expected: PASS

如果遇到与 `targetPath` 相关的断言微型差错（在极端情况下），因为此前并无针对该部分的深度 assert，大多数测试应当继续 pass。

**Step 3: 补充与完善全局测试 (Opt)**

通过 `bun test src/hooks/start-work` 一遍扫全目录的 test 文件，应全绿。

**Step 4: 提交更改**

Run:

```bash
git add src/hooks/start-work/start-work-hook.ts
git commit -m "refactor: drop old start-work plan physical copy and integrate symlink approach"
```

---

### Task 3: 整体功能校验与清理

**步骤：**

1. 执行全量构建确保 TypeScript 编译通过。

   ```bash
   bun run build
   ```

2. 手动执行一个简单的业务工作流。使用 `pnpm build` 或 `npm build` 等构建脚本，运行应用进行一个真实的计划创建并启动 `/start-work` 流程，观察 `project-docs/plans/` 下是否生成了符合预期的符号链接，并能够在修改 Sisyphus 文件后立即从 `project-docs` 中读取到带勾选的更新状态。

> 提示：本任务中没有特别多的手动清理项，主要的清理工作在于去除僵尸文件残留的隐患被我们 `rmSync(..., { force: true })` 这个防护性编程规避了。

**提交更改:**
该步骤本身无代码变动修改，如若一切完毕，向原请求者同步即可。
