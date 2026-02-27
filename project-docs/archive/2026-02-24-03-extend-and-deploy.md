> [!WARNING]
> **本文档已废弃。**
> 其中的类型签名、配置字典、架构说明以及部署流水线等严重脱离实际代码实现，已不再适用。
> 最新重写修订的标准版请移步参考：[2026-02-24-opencode-智能体扩展与部署指南.md](../design/2026-02-24-opencode-智能体扩展与部署指南.md)

# 扩展新智能体并打包部署指南

## 概述

本文档说明如何在 oh-my-opencode 中添加新的智能体，以及如何打包和部署自定义版本供 OpenCode 使用。

---

## 第一部分：添加新智能体

### 1. 智能体架构

oh-my-opencode 的智能体遵循 Factory 模式：

```typescript
// 每个 Agent 是一个 Factory 函数
type AgentFactory = (model: string, ...args) => AgentConfig

// Factory 必须有一个静态 mode 属性
AgentFactory.mode = "primary" | "subagent" | "all"
```

### 2. 创建智能体的步骤

#### Step 1: 创建智能体文件

在 `src/agents/` 目录下创建新文件，例如 `src/agents/my-agent.ts`：

```typescript
import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"

const MODE: AgentMode = "subagent"  // 或 "primary" 或 "all"

// 智能体元数据（用于 Sisyphus 的委托决策表）
export const MY_AGENT_PROMPT_METADATA: AgentPromptMetadata = {
  category: "advisor",      // advisor, utility, research, implementation
  cost: "EXPENSIVE",        // FREE, CHEAP, EXPENSIVE
  promptAlias: "MyAgent",
  triggers: [
    {
      domain: "特定领域",
      trigger: "触发条件描述",
    },
  ],
  useWhen: [
    "使用场景 1",
    "使用场景 2",
  ],
  avoidWhen: [
    "避免场景 1",
  ],
  keyTrigger: "关键触发词或模式",
}

// System Prompt
function buildMyAgentPrompt(): string {
  return `你是一个专门的智能体，负责...

## 身份
...

## 职责
...

## 约束
...
`
}

// Factory 函数
export function createMyAgentAgent(model: string): AgentConfig {
  return {
    description: "简短描述智能体的功能 (MyAgent - OhMyOpenCode)",
    mode: MODE,
    model,
    temperature: 0.1,  // 大多数智能体使用低温度
    maxTokens: 16000,  // 根据需要调整
    prompt: buildMyAgentPrompt(),
    color: "#FF6B6B",  // 智能体的颜色标识
    permission: {
      // 配置权限
      question: "allow",      // 是否允许提问
      call_omo_agent: "deny", // 是否允许调用其他 OMO agent
    },
  }
}

// 必须设置静态 mode 属性
createMyAgentAgent.mode = MODE
```

#### Step 2: 注册智能体

在 `src/agents/builtin-agents.ts` 中注册：

```typescript
// 1. 导入你的 Factory
import { createMyAgentAgent, MY_AGENT_PROMPT_METADATA } from "./my-agent"

// 2. 添加到 agentSources
const agentSources: Record<BuiltinAgentName, AgentSource> = {
  sisyphus: createSisyphusAgent,
  hephaestus: createHephaestusAgent,
  // ...
  myAgent: createMyAgentAgent,  // 添加你的智能体
}

// 3. 添加元数据
const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  oracle: ORACLE_PROMPT_METADATA,
  // ...
  myAgent: MY_AGENT_PROMPT_METADATA,  // 添加你的元数据
}
```

#### Step 3: 导出智能体

在 `src/agents/index.ts` 中导出：

```typescript
export { createMyAgentAgent, MY_AGENT_PROMPT_METADATA } from "./my-agent"
```

#### Step 4: 添加类型定义

在 `src/config/schema/agent-names.ts` 中添加类型：

```typescript
export type BuiltinAgentName =
  | "sisyphus"
  | "hephaestus"
  // ...
  | "myAgent"  // 添加你的智能体名称
```

### 3. 智能体模式说明

| Mode | 说明 | 适用场景 |
|------|------|----------|
| `primary` | 尊重 UI 选择的模型，使用 fallback chain | 主要智能体，如 Sisyphus、Hephaestus |
| `subagent` | 使用自己的 fallback chain，忽略 UI | 辅助智能体，如 Oracle、Librarian |
| `all` | 可在两种上下文中使用 | 通用执行器，如 Sisyphus-Junior |

### 4. 配置模型回退链

在 `src/shared/model-requirements.ts` 中添加：

```typescript
export const AGENT_MODEL_REQUIREMENTS: Record<string, AgentModelRequirement> = {
  // ...
  myAgent: {
    fallbackChain: [
      { providers: ["anthropic"], model: "claude-sonnet-4-6" },
      { providers: ["openai"], model: "gpt-5-nano" },
    ],
    requiresAnyModel: true,
  },
}
```

### 5. 创建条件工厂（可选）

如果需要复杂的配置逻辑，在 `src/agents/builtin-agents/` 下创建：

```typescript
// src/agents/builtin-agents/my-agent-config.ts
import { createMyAgentAgent } from "../my-agent"
import { AGENT_MODEL_REQUIREMENTS } from "../../shared/model-requirements"

export function maybeCreateMyAgentConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  availableModels: Set<string>
  systemDefaultModel?: string
  // ...其他参数
}): AgentConfig | undefined {
  // 检查是否禁用
  if (input.disabledAgents.includes("myAgent")) {
    return undefined
  }

  // 检查模型可用性
  const requirement = AGENT_MODEL_REQUIREMENTS["myAgent"]
  // ... 模型解析逻辑

  // 创建配置
  let config = createMyAgentAgent(resolvedModel)
  
  // 应用用户覆盖
  const override = input.agentOverrides["myAgent"]
  if (override) {
    config = { ...config, ...override }
  }

  return config
}
```

---

## 第二部分：打包和部署

### 1. 项目结构

```
oh-my-opencode/
├── src/
│   ├── index.ts           # 插件入口
│   ├── agents/            # 智能体定义
│   ├── plugin/            # 插件核心
│   └── ...
├── package.json           # 包配置
├── tsconfig.json          # TypeScript 配置
└── dist/                  # 构建输出
```

### 2. package.json 关键配置

```json
{
  "name": "oh-my-opencode",
  "version": "3.7.3",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "type": "module",
  "bin": {
    "oh-my-opencode": "./bin/oh-my-opencode.js"
  },
  "files": [
    "dist",
    "bin",
    "postinstall.mjs"
  ],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./schema.json": "./dist/oh-my-opencode.schema.json"
  },
  "scripts": {
    "build": "bun build src/index.ts --outdir dist --target bun --format esm --external @ast-grep/napi && tsc --emitDeclarationOnly && bun run build:schema",
    "build:all": "bun run build && bun run build:binaries",
    "build:binaries": "bun run script/build-binaries.ts",
    "build:schema": "bun run script/build-schema.ts",
    "clean": "rm -rf dist",
    "prepublishOnly": "bun run clean && bun run build",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "dependencies": {
    "@opencode-ai/plugin": "^1.1.19",
    "@opencode-ai/sdk": "^1.1.19",
    // ... 其他依赖
  }
}
```

### 3. 构建流程

```bash
# 1. 清理旧构建
bun run clean

# 2. 构建主包
bun run build

# 3. 构建二进制文件（可选）
bun run build:binaries

# 4. 类型检查
bun run typecheck

# 5. 运行测试
bun test
```

### 4. 本地测试

#### 方法 1: 使用 bun link

```bash
# 在 oh-my-opencode 目录
bun link

# 在测试项目目录
bun link oh-my-opencode
```

#### 方法 2: 使用 file: 协议

```json
// 测试项目的 package.json
{
  "dependencies": {
    "oh-my-opencode": "file:/path/to/oh-my-opencode"
  }
}
```

### 5. 发布到 npm

#### Step 1: 准备发布

```bash
# 确保在正确的分支
git checkout main

# 拉取最新代码
git pull

# 运行完整构建和测试
bun run build:all
bun test

# 更新版本号
npm version patch  # 或 minor / major
```

#### Step 2: 发布

```bash
# 登录 npm（如果还没登录）
npm login

# 发布（prepublishOnly 会自动运行构建）
npm publish
```

#### Step 3: 验证发布

```bash
# 检查包是否发布成功
npm info oh-my-opencode
```

### 6. GitHub Actions 自动发布

创建 `.github/workflows/publish.yml`：

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build:all
      
      - name: Test
        run: bun test
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 第三部分：用户配置覆盖

### 1. 配置文件位置

用户可以在以下位置覆盖智能体配置：

```
~/.config/opencode/oh-my-opencode.jsonc      # 用户级
.opencode/oh-my-opencode.jsonc               # 项目级
```

### 2. 可覆盖的配置项

```jsonc
{
  "agents": {
    "myAgent": {
      "model": "claude-sonnet-4-6",      // 覆盖模型
      "temperature": 0.2,                 // 覆盖温度
      "prompt": "自定义提示词...",        // 覆盖提示词
      "max_tokens": 32000,               // 覆盖最大 token
      "permission": {                     // 覆盖权限
        "question": "deny"
      }
    }
  }
}
```

### 3. 禁用智能体

```jsonc
{
  "disabled_agents": ["myAgent"]
}
```

---

## 第四部分：完整示例

### 示例：创建一个"代码审查"智能体

#### 1. 创建文件 `src/agents/code-reviewer.ts`

```typescript
import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode, AgentPromptMetadata } from "./types"

const MODE: AgentMode = "subagent"

export const CODE_REVIEWER_PROMPT_METADATA: AgentPromptMetadata = {
  category: "advisor",
  cost: "CHEAP",
  promptAlias: "CodeReviewer",
  triggers: [
    {
      domain: "代码审查",
      trigger: "Review code for quality, security, or best practices",
    },
  ],
  useWhen: [
    "Need automated code review",
    "Checking for security vulnerabilities",
    "Verifying code style consistency",
  ],
  avoidWhen: [
    "Simple syntax checks (use linter instead)",
    "Running tests",
  ],
  keyTrigger: "review this code / code review / check my code",
}

function buildCodeReviewerPrompt(): string {
  return `你是一个专业的代码审查智能体。

## 身份
你是一个经验丰富的代码审查专家，专注于代码质量、安全性和最佳实践。

## 审查范围
1. **代码质量**: 可读性、可维护性、复杂度
2. **安全性**: 注入风险、敏感数据处理、权限检查
3. **性能**: 潜在的性能瓶颈、资源泄漏
4. **最佳实践**: 设计模式、SOLID 原则、DRY

## 输出格式
\`\`\`
## 概述
[整体评价]

## 问题列表
| 严重性 | 文件:行号 | 问题描述 | 建议 |
|--------|-----------|----------|------|
| HIGH   | foo.ts:42 | ... | ... |

## 改进建议
1. ...
\`\`\`

## 约束
- 只报告实际问题，不要过度建议
- 提供具体的修复建议
- 考虑项目上下文和现有模式
`
}

export function createCodeReviewerAgent(model: string): AgentConfig {
  return {
    description: "Professional code reviewer for quality, security, and best practices (CodeReviewer - OhMyOpenCode)",
    mode: MODE,
    model,
    temperature: 0.1,
    maxTokens: 16000,
    prompt: buildCodeReviewerPrompt(),
    color: "#9B59B6",
    permission: {
      question: "allow",
      call_omo_agent: "deny",
    },
  }
}

createCodeReviewerAgent.mode = MODE
```

#### 2. 在 `src/agents/builtin-agents.ts` 中注册

```typescript
import { createCodeReviewerAgent, CODE_REVIEWER_PROMPT_METADATA } from "./code-reviewer"

const agentSources: Record<BuiltinAgentName, AgentSource> = {
  // ...现有智能体
  codeReviewer: createCodeReviewerAgent,
}

const agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>> = {
  // ...现有元数据
  codeReviewer: CODE_REVIEWER_PROMPT_METADATA,
}
```

#### 3. 在 `src/agents/index.ts` 中导出

```typescript
export { createCodeReviewerAgent, CODE_REVIEWER_PROMPT_METADATA } from "./code-reviewer"
```

#### 4. 添加类型

```typescript
// src/config/schema/agent-names.ts
export type BuiltinAgentName =
  | "sisyphus"
  // ...
  | "codeReviewer"
```

#### 5. 构建和发布

```bash
# 构建
bun run build

# 本地测试
bun link

# 发布
npm version patch
npm publish
```

---

## 总结

### 添加新智能体的检查清单

- [ ] 创建 `src/agents/{name}.ts` 文件
- [ ] 实现 `create{Name}Agent` Factory 函数
- [ ] 设置 `create{Name}Agent.mode` 静态属性
- [ ] 定义 `{NAME}_PROMPT_METADATA` 元数据
- [ ] 在 `src/agents/builtin-agents.ts` 中注册
- [ ] 在 `src/agents/index.ts` 中导出
- [ ] 在 `src/config/schema/agent-names.ts` 中添加类型
- [ ] 在 `src/shared/model-requirements.ts` 中配置模型回退链（可选）
- [ ] 编写单元测试
- [ ] 运行 `bun run build` 验证构建
- [ ] 运行 `bun test` 验证测试通过

### 打包发布检查清单

- [ ] 更新版本号（`npm version patch/minor/major`）
- [ ] 更新 CHANGELOG（如有）
- [ ] 运行 `bun run build:all`
- [ ] 运行 `bun test`
- [ ] 提交代码（`git commit -am "chore: release vX.Y.Z"`）
- [ ] 创建 tag（`git tag vX.Y.Z`）
- [ ] 推送代码和 tag（`git push && git push --tags`）
- [ ] 发布到 npm（`npm publish`）
