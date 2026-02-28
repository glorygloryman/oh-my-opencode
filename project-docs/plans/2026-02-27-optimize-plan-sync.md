# 计划同步机制优化 - 软链接重构

## TL;DR

> **Quick Summary**: 重构 `start-work` 钩子中的计划同步逻辑，使用软链接 (Symlink) 替代物理内容复制，确保计划进度实时同步并消除冗余文件。
> 
> **Deliverables**:
> - `src/hooks/start-work/sync-plan.ts` - 独立的同步模块
> - `src/hooks/start-work/sync-plan.test.ts` - 单元测试
> - 重构后的 `src/hooks/start-work/start-work-hook.ts`
> 
> **Estimated Effort**: Short
> **Parallel Execution**: NO - 顺序依赖
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4

---

## Context

### Original Request
用户请求优化 `start-work` 钩子中的计划同步机制，使用软链接替代物理复制。

### Interview Summary
**Key Discussions**:
- 当前实现使用 `readFileSync` + `writeFileSync` 物理复制文件内容
- 日期前缀使用 `mtimeMs` 而非更准确的 `birthtimeMs`
- 需要抽取 `syncPlanToProjectDocs` 为独立模块

**Research Findings**:
- `getPlanName` 函数使用 `basename(path, ".md")` 正确处理后缀
- 现有测试使用 `tmpdir()` + `randomUUID()` 模式
- 调用位置: `start-work-hook.ts` Line 154 和 Line 268

### Metis Review
**Identified Gaps** (addressed):
- **Windows 兼容性**: 当前环境是 macOS，优先实现 Unix 兼容版本
- **目标已存在策略**: 使用 `rmSync({ force: true })` 后重建（幂等）
- **birthtimeMs 可靠性**: 添加 `mtimeMs` 作为 fallback

---

## Work Objectives

### Core Objective
将 `syncPlanToProjectDocs` 从 `start-work-hook.ts` 抽取为独立模块 `sync-plan.ts`，使用软链接替代物理复制。

### Concrete Deliverables
- `src/hooks/start-work/sync-plan.ts` - 独立的同步模块
- `src/hooks/start-work/sync-plan.test.ts` - 单元测试（TDD）
- 修改后的 `src/hooks/start-work/start-work-hook.ts`

### Definition of Done
- [ ] `bun test src/hooks/start-work/sync-plan.test.ts` → 全部通过
- [ ] `bun test src/hooks/start-work/` → 现有测试不受影响
- [ ] `bun run typecheck` → 无类型错误

### Must Have
- 使用 `symlinkSync` 创建软链接
- 使用 `birthtimeMs || mtimeMs` 作为日期前缀
- 处理目标已存在的情况（删除后重建）
- 目标目录不存在时自动创建

### Must NOT Have (Guardrails)
- 不修改 `start-work-hook.ts` 中与同步无关的逻辑
- 不添加配置项或新类型文件
- 不使用 `as any` 或 `@ts-ignore`
- 不静默忽略错误

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES (Bun Test)
- **Automated tests**: YES (TDD)
- **Framework**: bun test

### QA Policy
Every task includes agent-executed QA scenarios.

---

## Execution Strategy

### Sequential Execution (依赖关系)

```
Task 1 (Start Immediately — TDD 红灯):
└── 创建 sync-plan.test.ts 测试文件（测试先失败）

Task 2 (After Task 1 — TDD 绿灯):
└── 创建 sync-plan.ts 实现模块（让测试通过）

Task 3 (After Task 2 — 重构):
└── 重构 start-work-hook.ts 使用新模块

Task 4 (After Task 3 — 验证):
└── 运行全量测试确保无回归
```

### Dependency Matrix
- **1**: — — 2
- **2**: 1 — 3
- **3**: 2 — 4
- **4**: 3 — —

---

## TODOs

> Implementation + Test = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.

- [ ] 1. 创建 sync-plan.test.ts 测试文件 (TDD 红灯)

  **What to do**:
  - 创建 `src/hooks/start-work/sync-plan.test.ts`
  - 编写以下测试用例（预期失败）：
    - 源文件不存在时返回错误
    - 正常创建软链接
    - 目标已存在时覆盖
    - 日期前缀使用 birthtimeMs
    - 不产生 `.md.md` 重复后缀

  **Must NOT do**:
  - 不创建实现代码（仅测试）
  - 不修改其他文件

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: None
  - **Blocks**: Task 2

  **References**:
  - `src/hooks/start-work/index.test.ts` - 现有测试模式和断言风格
  - `src/hooks/start-work/worktree-detector.test.ts` - 单元测试结构参考

  **Acceptance Criteria**:
  - [ ] 测试文件已创建
  - [ ] `bun test src/hooks/start-work/sync-plan.test.ts` → FAIL（预期行为，实现不存在）

  **QA Scenarios**:
  ```
  Scenario: 测试文件创建并预期失败
    Tool: Bash
    Steps:
      1. bun test src/hooks/start-work/sync-plan.test.ts
    Expected Result: 测试失败，错误信息包含 "Cannot find module" 或类似
    Evidence: .sisyphus/evidence/task-1-test-fail.txt
  ```

  **Commit**: NO (与 Task 2 一起提交)

---

- [ ] 2. 创建 sync-plan.ts 实现模块 (TDD 绿灯)

  **What to do**:
  - 创建 `src/hooks/start-work/sync-plan.ts`
  - 实现 `syncPlanToProjectDocs(ctx: PluginInput, planPath: string): SyncPlanResult`
  - 功能：
    - 校验源文件存在
    - 使用 `birthtimeMs || mtimeMs` 获取日期前缀
    - 清理目标路径中的 `.md` 后缀避免重复
    - 创建目标目录（如不存在）
    - 删除已存在的目标（文件或链接）
    - 使用 `symlinkSync` 创建软链接

  **Must NOT do**:
  - 不使用物理复制 (`readFileSync`/`writeFileSync`)
  - 不修改其他文件

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 1
  - **Blocks**: Task 3

  **References**:
  - `src/hooks/start-work/start-work-hook.ts:44-65` - 原实现（待替换）
  - `src/features/boulder-state/storage.ts:143-145` - `getPlanName` 函数

  **Acceptance Criteria**:
  - [ ] `bun test src/hooks/start-work/sync-plan.test.ts` → PASS
  - [ ] `bun run typecheck` → 无错误

  **QA Scenarios**:
  ```
  Scenario: 测试全部通过
    Tool: Bash
    Steps:
      1. bun test src/hooks/start-work/sync-plan.test.ts
    Expected Result: 所有测试通过 (X/X tests, 0 failures)
    Evidence: .sisyphus/evidence/task-2-test-pass.txt

  Scenario: 类型检查通过
    Tool: Bash
    Steps:
      1. bun run typecheck
    Expected Result: 无类型错误
    Evidence: .sisyphus/evidence/task-2-typecheck.txt
  ```

  **Commit**: YES
  - Message: `feat(start-work): add symlink-based plan synchronization module`
  - Files: `src/hooks/start-work/sync-plan.ts`, `src/hooks/start-work/sync-plan.test.ts`

---

- [ ] 3. 重构 start-work-hook.ts 使用新模块

  **What to do**:
  - 移除 `start-work-hook.ts` 中的 `SyncPlanResult` 接口定义 (Line 30-34)
  - 移除 `syncPlanToProjectDocs` 函数实现 (Line 44-65)
  - 移除不再需要的 `readFileSync`, `writeFileSync` 导入
  - 添加 `import { syncPlanToProjectDocs } from "./sync-plan"`
  - 确保两处调用 (Line 154, 268) 正常工作

  **Must NOT do**:
  - 不修改其他逻辑
  - 不改变函数调用方式

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 2
  - **Blocks**: Task 4

  **References**:
  - `src/hooks/start-work/start-work-hook.ts` - 完整文件

  **Acceptance Criteria**:
  - [ ] `bun test src/hooks/start-work/index.test.ts` → PASS
  - [ ] `bun run typecheck` → 无错误

  **QA Scenarios**:
  ```
  Scenario: 现有测试不受影响
    Tool: Bash
    Steps:
      1. bun test src/hooks/start-work/index.test.ts
    Expected Result: 所有测试通过
    Evidence: .sisyphus/evidence/task-3-integration-test.txt
  ```

  **Commit**: YES
  - Message: `refactor(start-work): use external sync-plan module instead of inline implementation`
  - Files: `src/hooks/start-work/start-work-hook.ts`

---

- [ ] 4. 集成验证

  **What to do**:
  - 运行全量测试确保重构未引入回归
  - 验证构建正常

  **Must NOT do**:
  - 不添加新代码

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 3
  - **Blocks**: None

  **References**:
  - None

  **Acceptance Criteria**:
  - [ ] `bun test` → 全部通过
  - [ ] `bun run typecheck` → 无错误
  - [ ] `bun run build` → 成功

  **QA Scenarios**:
  ```
  Scenario: 全量测试通过
    Tool: Bash
    Steps:
      1. bun test
    Expected Result: 所有测试通过
    Evidence: .sisyphus/evidence/task-4-full-test.txt

  Scenario: 构建成功
    Tool: Bash
    Steps:
      1. bun run build
    Expected Result: 构建成功，无错误
    Evidence: .sisyphus/evidence/task-4-build.txt
  ```

  **Commit**: NO (验证任务，无代码变更)

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  验证所有 Must Have 已实现，所有 Must NOT Have 未违反。

- [ ] F2. **Code Quality Review** — `unspecified-high`
  运行 `bun run typecheck` + linter，检查无 `as any`/`@ts-ignore`。

- [ ] F3. **Real Manual QA** — `unspecified-high`
  手动测试 `/start-work` 命令，验证 `project-docs/plans/` 中生成软链接。

- [ ] F4. **Scope Fidelity Check** — `deep`
  验证仅修改了计划中指定的文件。

---

## Commit Strategy

| Task | Commit Message | Files |
|------|---------------|-------|
| 1+2 | `feat(start-work): add symlink-based plan synchronization module` | `sync-plan.ts`, `sync-plan.test.ts` |
| 3 | `refactor(start-work): use external sync-plan module` | `start-work-hook.ts` |

---

## Success Criteria

### Verification Commands
```bash
bun test src/hooks/start-work/sync-plan.test.ts  # 新模块测试
bun test src/hooks/start-work/                    # 全部 hook 测试
bun run typecheck                                 # 类型检查
bun run build                                     # 构建验证
```

### Final Checklist
- [ ] 软链接替代物理复制
- [ ] 使用 `birthtimeMs || mtimeMs` 日期前缀
- [ ] 处理目标已存在（幂等重建）
- [ ] 无 `.md.md` 重复后缀
- [ ] 所有测试通过
- [ ] 无类型错误
