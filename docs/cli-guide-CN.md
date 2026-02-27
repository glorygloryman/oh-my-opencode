# Oh-My-OpenCode CLI 指南

本文档提供 Oh-My-OpenCode CLI 工具的完整使用指南。

## 1. 概述

Oh-My-OpenCode 通过 `bunx oh-my-opencode` 命令提供 CLI 工具。CLI 支持插件安装、环境诊断和会话执行等多种功能。

```bash
# 基本执行（显示帮助信息）
bunx oh-my-opencode

# 或使用 npx 运行
npx oh-my-opencode
```

---

## 2. 可用命令

| 命令 | 描述 |
|---------|-------------|
| `install` | 交互式安装向导 |
| `doctor` | 环境诊断与健康检查 |
| `run` | OpenCode 会话运行器 |
| `auth` | Google Antigravity 认证管理 |
| `version` | 显示版本信息 |

---

## 3. `install` - 交互式安装向导

用于初始 Oh-My-OpenCode 设置的交互式安装工具。提供基于 `@clack/prompts` 的精美 TUI（文本用户界面）。

### 使用方法

```bash
bunx oh-my-opencode install
```

### 安装流程

1. **提供商选择**：从 Claude、ChatGPT 或 Gemini 中选择你的 AI 提供商。
2. **API 密钥输入**：输入所选提供商的 API 密钥。
3. **配置文件创建**：生成 `opencode.json` 或 `oh-my-opencode.json` 文件。
4. **插件注册**：自动在 OpenCode 设置中注册 oh-my-opencode 插件。

### 选项

| 选项 | 描述 |
|--------|-------------|
| `--no-tui` | 以非交互模式运行，不使用 TUI（适用于 CI/CD 环境） |
| `--verbose` | 显示详细日志 |

---

## 4. `doctor` - 环境诊断

诊断你的环境以确保 Oh-My-OpenCode 正常运行。执行 17 项以上的健康检查。

### 使用方法

```bash
bunx oh-my-opencode doctor
```

### 诊断类别

| 类别 | 检查项 |
|----------|-------------|
| **安装** | OpenCode 版本（>= 1.0.150）、插件注册状态 |
| **配置** | 配置文件有效性、JSONC 解析 |
| **认证** | Anthropic、OpenAI、Google API 密钥有效性 |
| **依赖** | Bun、Node.js、Git 安装状态 |
| **工具** | LSP 服务器状态、MCP 服务器状态 |
| **更新** | 最新版本检查 |

### 选项

| 选项 | 描述 |
|--------|-------------|
| `--category <name>` | 仅检查特定类别（如 `--category authentication`） |
| `--json` | 以 JSON 格式输出结果 |
| `--verbose` | 包含详细信息 |

### 示例输出

```
oh-my-opencode doctor

┌──────────────────────────────────────────────────┐
│  Oh-My-OpenCode Doctor                           │
└──────────────────────────────────────────────────┘

Installation
  ✓ OpenCode version: 1.0.155 (>= 1.0.150)
  ✓ Plugin registered in opencode.json

Configuration
  ✓ oh-my-opencode.json is valid
  ⚠ categories.visual-engineering: using default model

Authentication
  ✓ Anthropic API key configured
  ✓ OpenAI API key configured
  ✗ Google API key not found

Dependencies
  ✓ Bun 1.2.5 installed
  ✓ Node.js 22.0.0 installed
  ✓ Git 2.45.0 installed

Summary: 10 passed, 1 warning, 1 failed
```

---

## 5. `run` - OpenCode 会话运行器

执行 OpenCode 会话并监控任务完成情况。

### 使用方法

```bash
bunx oh-my-opencode run [prompt]
```

### 选项

| 选项 | 描述 |
|--------|-------------|
| `--enforce-completion` | 保持会话活跃直到所有 TODO 完成 |
| `--timeout <seconds>` | 设置最大执行时间 |

---

## 6. `mcp oauth` - MCP OAuth 管理

管理远程 MCP 服务器的 OAuth 2.1 认证。

### 使用方法

```bash
# 登录到受 OAuth 保护的 MCP 服务器
bunx oh-my-opencode mcp oauth login <server-name> --server-url https://api.example.com

# 使用显式客户端 ID 和作用域登录
bunx oh-my-opencode mcp oauth login my-api --server-url https://api.example.com --client-id my-client --scopes "read,write"

# 移除已存储的 OAuth 令牌
bunx oh-my-opencode mcp oauth logout <server-name>

# 检查 OAuth 令牌状态
bunx oh-my-opencode mcp oauth status [server-name]
```

### 选项

| 选项 | 描述 |
|--------|-------------|
| `--server-url <url>` | MCP 服务器 URL（登录时必需） |
| `--client-id <id>` | OAuth 客户端 ID（如果服务器支持动态客户端注册则可选） |
| `--scopes <scopes>` | 逗号分隔的 OAuth 作用域 |

### 令牌存储

令牌存储在 `~/.config/opencode/mcp-oauth.json` 中，权限为 `0600`（仅所有者可读写）。键格式为：`{serverHost}/{resource}`。

---

## 7. `auth` - 认证管理

管理 Google Antigravity OAuth 认证。使用 Gemini 模型时需要。

### 使用方法

```bash
# 登录
bunx oh-my-opencode auth login

# 登出
bunx oh-my-opencode auth logout

# 检查当前状态
bunx oh-my-opencode auth status
```

---

## 8. 配置文件

CLI 按以下顺序（优先级从高到低）搜索配置文件：

1. **项目级别**：`.opencode/oh-my-opencode.json`
2. **用户级别**：`~/.config/opencode/oh-my-opencode.json`

### JSONC 支持

配置文件支持 **JSONC（带注释的 JSON）** 格式。你可以使用注释和尾随逗号。

```jsonc
{
  // Agent 配置
  "sisyphus_agent": {
    "disabled": false,
    "planner_enabled": true,
  },
  
  /* 类别自定义 */
  "categories": {
    "visual-engineering": {
      "model": "google/gemini-3-pro",
    },
  },
}
```

---

## 9. 故障排除

### "OpenCode version too old" 错误

```bash
# 更新 OpenCode
npm install -g opencode@latest
# 或
bun install -g opencode@latest
```

### "Plugin not registered" 错误

```bash
# 重新安装插件
bunx oh-my-opencode install
```

### Doctor 检查失败

```bash
# 使用详细信息进行诊断
bunx oh-my-opencode doctor --verbose

# 仅检查特定类别
bunx oh-my-opencode doctor --category authentication
```

---

## 10. 非交互模式

使用 `--no-tui` 选项适用于 CI/CD 环境。

```bash
# 在 CI 环境中运行 doctor
bunx oh-my-opencode doctor --no-tui --json

# 保存结果到文件
bunx oh-my-opencode doctor --json > doctor-report.json
```

---

## 11. 开发者信息

### CLI 结构

```
src/cli/
├── index.ts              # 基于 Commander.js 的主入口
├── install.ts            # 基于 @clack/prompts 的 TUI 安装器
├── config-manager.ts     # JSONC 解析、多源配置管理
├── doctor/               # 健康检查系统
│   ├── index.ts          # Doctor 命令入口
│   └── checks/           # 17 个以上的独立检查模块
├── run/                  # 会话运行器
└── commands/auth.ts      # 认证管理
```

### 添加新的 Doctor 检查

1. 创建 `src/cli/doctor/checks/my-check.ts`：

```typescript
import type { DoctorCheck } from "../types"

export const myCheck: DoctorCheck = {
  name: "my-check",
  category: "environment",
  check: async () => {
    // 检查逻辑
    const isOk = await someValidation()
    
    return {
      status: isOk ? "pass" : "fail",
      message: isOk ? "一切正常" : "出现问题",
    }
  },
}
```

2. 在 `src/cli/doctor/checks/index.ts` 中注册：

```typescript
export { myCheck } from "./my-check"
```
