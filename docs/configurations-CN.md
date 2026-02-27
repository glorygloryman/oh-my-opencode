# Oh-My-OpenCode 配置

高度自定义，但开箱即用。

## 快速开始

**大多数用户不需要手动配置任何内容。** 运行交互式安装程序：

```bash
bunx oh-my-opencode install
```

它会询问你的提供商（Claude、OpenAI、Gemini 等）并自动生成最优配置。

**想要自定义？** 这里是一些常用模式：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  
  // 覆盖特定代理模型
  "agents": {
    "oracle": { "model": "openai/gpt-5.2" },           // 调试时使用 GPT
    "librarian": { "model": "zai-coding-plan/glm-4.7" }, // 研究时使用便宜模型
    "explore": { "model": "opencode/gpt-5-nano" }        // grep 时使用免费模型
  },
  
  // 覆盖类别模型（用于任务）
  "categories": {
    "quick": { "model": "opencode/gpt-5-nano" },         // 琐碎任务使用快速/便宜模型
    "visual-engineering": { "model": "google/gemini-3-pro" } // UI 使用 Gemini
  }
}
```

**查看可用模型：** 运行 `opencode models` 查看环境中所有可用模型。

## 配置文件位置

配置文件位置（优先级顺序）：
1. `.opencode/oh-my-opencode.jsonc` 或 `.opencode/oh-my-opencode.json`（项目级；两者都存在时优先使用 `.jsonc`）
2. 用户配置（平台特定；两者都存在时优先使用 `.jsonc`）：

| 平台           | 用户配置路径                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Windows**    | `~/.config/opencode/oh-my-opencode.jsonc`（优先）或 `~/.config/opencode/oh-my-opencode.json`（备选）；`%APPDATA%\opencode\oh-my-opencode.jsonc` / `%APPDATA%\opencode\oh-my-opencode.json`（备选） |
| **macOS/Linux** | `~/.config/opencode/oh-my-opencode.jsonc`（优先）或 `~/.config/opencode/oh-my-opencode.json`（备选）                |

支持 Schema 自动补全：

```json
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json"
}
```

## JSONC 支持

`oh-my-opencode` 配置文件支持 JSONC（带注释的 JSON）：
- 单行注释：`// 注释`
- 块注释：`/* 注释 */`
- 尾随逗号：`{ "key": "value", }`

当 `oh-my-opencode.jsonc` 和 `oh-my-opencode.json` 文件同时存在时，`.jsonc` 优先。

**带注释的示例：**

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",

  /* 代理覆盖 - 为特定任务自定义模型 */
  "agents": {
    "oracle": {
      "model": "openai/gpt-5.2"  // GPT 用于战略推理
    },
    "explore": {
      "model": "opencode/gpt-5-nano"  // 探索时免费且快速
    },
  },
}
```

## Google 认证

**推荐**：对于 Google Gemini 认证，安装 [`opencode-antigravity-auth`](https://github.com/NoeFabris/opencode-antigravity-auth) 插件（`@latest`）。它提供多账户负载均衡、基于变体的思考级别、双配额系统（Antigravity + Gemini CLI），并且持续维护。参见 [安装 > Google Gemini](guide/installation.md#google-gemini-antigravity-oauth)。

## Ollama 提供商

**重要**：当使用 Ollama 作为提供商时，你**必须**禁用流式传输以避免 JSON 解析错误。

### 必需配置

```json
{
  "agents": {
    "explore": {
      "model": "ollama/qwen3-coder",
      "stream": false
    }
  }
}
```

### 为什么需要 `stream: false`

Ollama 在启用流式传输时返回 NDJSON（换行分隔的 JSON），但 Claude Code SDK 期望单个 JSON 对象。这会导致代理尝试工具调用时出现 `JSON Parse error: Unexpected EOF`。

**问题示例**：
```json
// Ollama 流式响应（NDJSON - 多行）
{"message":{"tool_calls":[...]}, "done":false}
{"message":{"content":""}, "done":true}

// Claude Code SDK 期望（单个 JSON 对象）
{"message":{"tool_calls":[...], "content":""}, "done":true}
```

### 支持的模型

适用于 oh-my-opencode 的常见 Ollama 模型：

| 模型 | 最佳用途 | 配置 |
|------|----------|------|
| `ollama/qwen3-coder` | 代码生成、构建修复 | `{"model": "ollama/qwen3-coder", "stream": false}` |
| `ollama/ministral-3:14b` | 探索、代码库搜索 | `{"model": "ollama/ministral-3:14b", "stream": false}` |
| `ollama/lfm2.5-thinking` | 文档、写作 | `{"model": "ollama/lfm2.5-thinking", "stream": false}` |

### 故障排除

如果遇到 `JSON Parse error: Unexpected EOF`：

1. **验证代理配置中设置了 `stream: false`**
2. **检查 Ollama 是否运行**：`curl http://localhost:11434/api/tags`
3. **使用 curl 测试**：
   ```bash
   curl -s http://localhost:11434/api/chat \
     -d '{"model": "qwen3-coder", "messages": [{"role": "user", "content": "Hello"}], "stream": false}'
   ```
4. **查看详细故障排除**：[docs/troubleshooting/ollama-streaming-issue.md](troubleshooting/ollama-streaming-issue.md)

### 未来的 SDK 修复

正确的长期修复需要 Claude Code SDK 正确解析 NDJSON 响应。在此之前，使用 `stream: false` 作为变通方案。

**追踪**：https://github.com/code-yeongyu/oh-my-opencode/issues/1124

## 代理

覆盖内置代理设置：

```json
{
  "agents": {
    "explore": {
      "model": "anthropic/claude-haiku-4-5",
      "temperature": 0.5
    },
    "multimodal-looker": {
      "disable": true
    }
  }
}
```

每个代理支持：`model`、`temperature`、`top_p`、`prompt`、`prompt_append`、`tools`、`disable`、`description`、`mode`、`color`、`permission`、`category`、`variant`、`maxTokens`、`thinking`、`reasoningEffort`、`textVerbosity`、`providerOptions`。

### 额外代理选项

| 选项              | 类型    | 描述                                                                                     |
| ----------------- | ------- | ---------------------------------------------------------------------------------------- |
| `category`        | string  | 类别名称，从类别默认值继承模型和其他设置                             |
| `variant`         | string  | 模型变体（如 `max`、`high`、`medium`、`low`、`xhigh`）                                 |
| `maxTokens`       | number  | 响应的最大 token 数。直接传递给 OpenCode SDK。                                      |
| `thinking`        | object  | Anthropic 模型的扩展思考配置。参见下方 [思考选项](#思考选项anthropic)。 |
| `reasoningEffort` | string  | OpenAI 推理努力级别。值：`low`、`medium`、`high`、`xhigh`。                         |
| `textVerbosity`   | string  | 文本冗长度级别。值：`low`、`medium`、`high`。                                        |
| `providerOptions` | object  | 直接传递给 OpenCode SDK 的提供商特定选项。                                      |

#### 思考选项（Anthropic）

```json
{
  "agents": {
    "oracle": {
      "thinking": {
        "type": "enabled",
        "budgetTokens": 200000
      }
    }
  }
}
```

| 选项          | 类型    | 默认值 | 描述                                  |
| ------------- | ------- | ------ | ------------------------------------- |
| `type`        | string  | -      | `enabled` 或 `disabled`                      |
| `budgetTokens`| number  | -      | 扩展思考的最大预算 token  |

使用 `prompt_append` 添加额外指令而不替换默认系统提示：

```json
{
  "agents": {
    "librarian": {
      "prompt_append": "Always use the elisp-dev-mcp for Emacs Lisp documentation lookups."
    }
  }
}
```

你也可以使用相同选项覆盖 `Sisyphus`（主编排器）和 `build`（默认代理）的设置。

### 权限选项

精细控制代理可以执行的操作：

```json
{
  "agents": {
    "explore": {
      "permission": {
        "edit": "deny",
        "bash": "ask",
        "webfetch": "allow"
      }
    }
  }
}
```

| 权限                | 描述                            | 值                                                                      |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| `edit`              | 文件编辑权限                    | `ask` / `allow` / `deny`                                                    |
| `bash`              | Bash 命令执行                   | `ask` / `allow` / `deny` 或按命令：`{ "git": "allow", "rm": "deny" }` |
| `webfetch`          | Web 请求权限                    | `ask` / `allow` / `deny`                                                    |
| `doom_loop`         | 允许无限循环检测覆盖            | `ask` / `allow` / `deny`                                                    |
| `external_directory`| 访问项目根目录外的文件          | `ask` / `allow` / `deny`                                                    |

或通过 `~/.config/opencode/oh-my-opencode.json` 或 `.opencode/oh-my-opencode.json` 中的 `disabled_agents` 禁用：

```json
{
  "disabled_agents": ["oracle", "multimodal-looker"]
}
```

可用代理：`sisyphus`、`hephaestus`、`prometheus`、`oracle`、`librarian`、`explore`、`multimodal-looker`、`metis`、`momus`、`atlas`

## 内置技能

Oh My OpenCode 包含提供额外能力的内置技能：

- **playwright**（默认）/ **agent-browser**：浏览器自动化，用于网页抓取、测试、截图和浏览器交互。参见 [浏览器自动化](#浏览器自动化) 了解如何切换提供商。
- **git-master**：Git 专家，用于原子提交、rebase/squash 和历史搜索（blame、bisect、log -S）。强烈推荐：与 `task(category='quick', load_skills=['git-master'], ...)` 一起使用以节省上下文。

通过 `~/.config/opencode/oh-my-opencode.json` 或 `.opencode/oh-my-opencode.json` 中的 `disabled_skills` 禁用内置技能：

```json
{
  "disabled_skills": ["playwright"]
}
```

可用内置技能：`playwright`、`agent-browser`、`git-master`

## 技能配置

配置高级技能设置，包括自定义技能源、启用/禁用特定技能和定义自定义技能。

```json
{
  "skills": {
    "sources": [
      { "path": "./custom-skills", "recursive": true },
      "https://example.com/skill.yaml"
    ],
    "enable": ["my-custom-skill"],
    "disable": ["other-skill"],
    "my-skill": {
      "description": "自定义技能描述",
      "template": "自定义提示模板",
      "from": "source-file.ts",
      "model": "custom/model",
      "agent": "custom-agent",
      "subtask": true,
      "argument-hint": "用法提示",
      "license": "MIT",
      "compatibility": ">= 3.0.0",
      "metadata": {
        "author": "你的名字"
      },
      "allowed-tools": ["tool1", "tool2"]
    }
  }
}
```

### 源

从本地目录或远程 URL 加载技能：

```json
{
  "skills": {
    "sources": [
      { "path": "./custom-skills", "recursive": true },
      { "path": "./single-skill.yaml" },
      "https://example.com/skill.yaml",
      "https://raw.githubusercontent.com/user/repo/main/skills/*"
    ]
  }
}
```

| 选项        | 默认值  | 描述                                    |
| ----------- | ------- | --------------------------------------- |
| `path`      | -       | 本地文件/目录路径或远程 URL            |
| `recursive` | `false` | 从目录递归加载                          |
| `glob`      | -       | 文件选择的 glob 模式                    |

### 启用/禁用技能

```json
{
  "skills": {
    "enable": ["skill-1", "skill-2"],
    "disable": ["disabled-skill"]
  }
}
```

### 自定义技能定义

直接在配置中定义自定义技能：

| 选项            | 默认值  | 描述                                                                          |
| --------------- | ------- | ----------------------------------------------------------------------------- |
| `description`   | -       | 技能的人类可读描述                                                 |
| `template`      | -       | 技能的自定义提示模板                                                    |
| `from`          | -       | 加载模板的源文件                                                     |
| `model`         | -       | 覆盖此技能的模型                                                         |
| `agent`         | -       | 覆盖此技能的代理                                                         |
| `subtask`       | `false` | 是否作为子任务运行                                                           |
| `argument-hint` | -       | 如何使用技能的提示                                                        |
| `license`       | -       | 技能许可证                                                                       |
| `compatibility` | -       | 所需 oh-my-opencode 版本兼容性                                           |
| `metadata`      | -       | 作为键值对的额外元数据                                                |
| `allowed-tools` | -       | 此技能允许使用的工具数组                                            |

**示例：自定义技能**

```json
{
  "skills": {
    "data-analyst": {
      "description": "专门用于数据分析任务",
      "template": "You are a data analyst. Focus on statistical analysis, visualization, and data interpretation.",
      "model": "openai/gpt-5.2",
      "allowed-tools": ["read", "bash", "lsp_diagnostics"]
    }
  }
}
```

## 浏览器自动化

在两个浏览器自动化提供商之间选择：

| 提供商 | 接口 | 特性 | 安装 |
|--------|------|------|------|
| **playwright**（默认） | MCP 工具 | Playwright MCP 服务器，带结构化工具调用 | 通过 npx 自动安装 |
| **agent-browser** | Bash CLI | Vercel 的 CLI，带会话管理、并行浏览器 | 需要 `bun add -g agent-browser` |

通过 `oh-my-opencode.json` 中的 `browser_automation_engine` **切换提供商**：

```json
{
  "browser_automation_engine": {
    "provider": "agent-browser"
  }
}
```

### Playwright（默认）

使用官方 Playwright MCP 服务器（`@playwright/mcp`）。浏览器自动化通过结构化 MCP 工具调用进行。

### agent-browser

使用 [Vercel 的 agent-browser CLI](https://github.com/vercel-labs/agent-browser)。主要优势：
- **会话管理**：使用 `--session` 标志运行多个隔离的浏览器实例
- **持久配置文件**：使用 `--profile` 在重启之间保持浏览器状态
- **基于快照的工作流**：通过 `snapshot -i` 获取元素引用，使用 `@e1`、`@e2` 等交互
- **CLI 优先**：所有命令通过 Bash 执行 - 非常适合脚本编写

**需要安装**：
```bash
bun add -g agent-browser
agent-browser install  # 下载 Chromium
```

**示例工作流**：
```bash
agent-browser open https://example.com
agent-browser snapshot -i  # 获取带引用的交互元素
agent-browser fill @e1 "user@example.com"
agent-browser click @e2
agent-browser screenshot result.png
agent-browser close
```

## Tmux 集成

在单独的 tmux 窗格中运行后台子代理，实现**可视化多代理执行**。查看你的代理并行工作，每个都在自己的终端窗格中。

通过 `oh-my-opencode.json` 中的 `tmux` **启用 tmux 集成**：

```json
{
  "tmux": {
    "enabled": true,
    "layout": "main-vertical",
    "main_pane_size": 60,
    "main_pane_min_width": 120,
    "agent_pane_min_width": 40
  }
}
```

| 选项 | 默认值 | 描述 |
|------|--------|------|
| `enabled` | `false` | 启用 tmux 子代理窗格生成。仅在现有 tmux 会话内运行时生效。 |
| `layout` | `main-vertical` | 代理窗格的 Tmux 布局。参见下方 [布局选项](#布局选项)。 |
| `main_pane_size` | `60` | 主窗格大小百分比（20-80）。 |
| `main_pane_min_width` | `120` | 主窗格最小宽度（列数）。 |
| `agent_pane_min_width` | `40` | 每个代理窗格的最小宽度（列数）。 |

### 布局选项

| 布局 | 描述 |
|------|------|
| `main-vertical` | 主窗格在左，代理窗格在右侧堆叠（默认） |
| `main-horizontal` | 主窗格在上，代理窗格在底部堆叠 |
| `tiled` | 所有窗格等大小网格 |
| `even-horizontal` | 所有窗格水平排列 |
| `even-vertical` | 所有窗格垂直堆叠 |

### 要求

1. **必须在 tmux 内运行**：该功能仅在 OpenCode 已在 tmux 会话内运行时激活
2. **已安装 Tmux**：要求 tmux 在 PATH 中可用
3. **服务器模式**：OpenCode 必须使用 `--port` 标志运行以启用子代理窗格生成

### 工作原理

当 `tmux.enabled` 为 `true` 且你在 tmux 会话内时：
- 后台代理（通过 `task(run_in_background=true)`）在新的 tmux 窗格中生成
- 每个窗格显示子代理的实时输出
- 子代理完成时窗格自动关闭
- 布局根据你的配置自动调整

### 使用 Tmux 子代理支持运行 OpenCode

要启用 tmux 子代理窗格，OpenCode 必须以**服务器模式**运行，使用 `--port` 标志。这会启动一个 HTTP 服务器，子代理窗格通过 `opencode attach` 连接。

**基本设置**：
```bash
# 启动 tmux 会话
tmux new -s dev

# 使用服务器模式运行 OpenCode（端口 4096）
opencode --port 4096

# 现在后台代理将出现在单独的窗格中
```

**推荐：Shell 函数**

为方便起见，创建一个自动处理 tmux 会话和端口分配的 shell 函数。以下是 Fish shell 的示例：

```fish
# ~/.config/fish/config.fish
function oc
    set base_name (basename (pwd))
    set path_hash (echo (pwd) | md5 | cut -c1-4)
    set session_name "$base_name-$path_hash"
    
    # 从 4096 开始查找可用端口
    function __oc_find_port
        set port 4096
        while test $port -lt 5096
            if not lsof -i :$port >/dev/null 2>&1
                echo $port
                return 0
            end
            set port (math $port + 1)
        end
        echo 4096
    end
    
    set oc_port (__oc_find_port)
    set -x OPENCODE_PORT $oc_port
    
    if set -q TMUX
        # 已在 tmux 内 - 直接带端口运行
        opencode --port $oc_port $argv
    else
        # 创建 tmux 会话并运行 opencode
        set oc_cmd "OPENCODE_PORT=$oc_port opencode --port $oc_port $argv; exec fish"
        if tmux has-session -t "$session_name" 2>/dev/null
            tmux new-window -t "$session_name" -c (pwd) "$oc_cmd"
            tmux attach-session -t "$session_name"
        else
            tmux new-session -s "$session_name" -c (pwd) "$oc_cmd"
        end
    end
    
    functions -e __oc_find_port
end
```

**Bash/Zsh 等效版本**：

```bash
# ~/.bashrc 或 ~/.zshrc
oc() {
    local base_name=$(basename "$PWD")
    local path_hash=$(echo "$PWD" | md5sum | cut -c1-4)
    local session_name="${base_name}-${path_hash}"
    
    # 查找可用端口
    local port=4096
    while [ $port -lt 5096 ]; do
        if ! lsof -i :$port >/dev/null 2>&1; then
            break
        fi
        port=$((port + 1))
    done
    
    export OPENCODE_PORT=$port
    
    if [ -n "$TMUX" ]; then
        opencode --port $port "$@"
    else
        local oc_cmd="OPENCODE_PORT=$port opencode --port $port $*; exec $SHELL"
        if tmux has-session -t "$session_name" 2>/dev/null; then
            tmux new-window -t "$session_name" -c "$PWD" "$oc_cmd"
            tmux attach-session -t "$session_name"
        else
            tmux new-session -s "$session_name" -c "$PWD" "$oc_cmd"
        fi
    fi
}
```

**子代理窗格如何工作**：

1. 主 OpenCode 在指定端口启动 HTTP 服务器（如 `http://localhost:4096`）
2. 当后台代理生成时，Oh My OpenCode 创建新的 tmux 窗格
3. 窗格运行：`opencode attach http://localhost:4096 --session <session-id>`
4. 每个子代理窗格显示实时流式输出
5. 子代理完成时窗格自动关闭

**环境变量**：

| 变量 | 描述 |
|------|------|
| `OPENCODE_PORT` | HTTP 服务器的默认端口（如果未指定 `--port` 则使用） |

### 服务器模式参考

OpenCode 的服务器模式公开了用于程序化交互的 HTTP API：

```bash
# 独立服务器（无 TUI）
opencode serve --port 4096

# 带服务器的 TUI（推荐用于 tmux 集成）
opencode --port 4096
```

| 标志 | 默认值 | 描述 |
|------|--------|------|
| `--port` | `4096` | HTTP 服务器端口 |
| `--hostname` | `127.0.0.1` | 监听的主机名 |

更多详情，参见 [OpenCode 服务器文档](https://opencode.ai/docs/server/)。

## Git Master

配置 git-master 技能行为：

```json
{
  "git_master": {
    "commit_footer": true,
    "include_co_authored_by": true
  }
}
```

| 选项                   | 默认值  | 描述                                                                      |
| ---------------------- | ------- | ------------------------------------------------------------------------- |
| `commit_footer`        | `true`  | 在提交消息中添加 "Ultraworked with Sisyphus" 页脚。                      |
| `include_co_authored_by` | `true` | 向提交添加 `Co-authored-by: Sisyphus <clio-agent@sisyphuslabs.ai>` 尾注。 |

## Sisyphus 代理

启用时（默认），Sisyphus 提供强大的编排器，带有可选的专业代理：

- **Sisyphus**：主编排器代理（Claude Opus 4.6）
- **OpenCode-Builder**：OpenCode 的默认构建代理，由于 SDK 限制而重命名（默认禁用）
- **Prometheus (Planner)**：OpenCode 的默认计划代理，采用工作规划方法论（默认启用）
- **Metis (Plan Consultant)**：预规划分析代理，识别隐藏需求和 AI 失败点

**配置选项：**

```json
{
  "sisyphus_agent": {
    "disabled": false,
    "default_builder_enabled": false,
    "planner_enabled": true,
    "replace_plan": true
  }
}
```

**示例：启用 OpenCode-Builder：**

```json
{
  "sisyphus_agent": {
    "default_builder_enabled": true
  }
}
```

这将启用 OpenCode-Builder 代理与 Sisyphus 并行。当 Sisyphus 启用时，默认构建代理始终降级为子代理模式。

**示例：禁用所有 Sisyphus 编排：**

```json
{
  "sisyphus_agent": {
    "disabled": true
  }
}
```

你也可以像其他代理一样自定义 Sisyphus 代理：

```json
{
  "agents": {
    "Sisyphus": {
      "model": "anthropic/claude-sonnet-4",
      "temperature": 0.3
    },
    "OpenCode-Builder": {
      "model": "anthropic/claude-opus-4"
    },
    "Prometheus (Planner)": {
      "model": "openai/gpt-5.2"
    },
    "Metis (Plan Consultant)": {
      "model": "anthropic/claude-sonnet-4-6"
    }
  }
}
```

| 选项                    | 默认值  | 描述                                                                                                                            |
| ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `disabled`              | `false` | 为 `true` 时，禁用所有 Sisyphus 编排并恢复原始 build/plan 为主代理。                                          |
| `default_builder_enabled` | `false` | 为 `true` 时，启用 OpenCode-Builder 代理（与 OpenCode build 相同，因 SDK 限制而重命名）。默认禁用。             |
| `planner_enabled`       | `true`  | 为 `true` 时，启用带工作规划方法论的 Prometheus (Planner) 代理。默认启用。                                     |
| `replace_plan`          | `true`  | 为 `true` 时，将默认 plan 代理降级为子代理模式。设为 `false` 可同时保留 Prometheus (Planner) 和默认 plan 可用。 |

## 后台任务

配置后台代理任务的并发限制。这控制可以同时运行多少个并行后台代理。

```json
{
  "background_task": {
    "defaultConcurrency": 5,
    "staleTimeoutMs": 180000,
    "providerConcurrency": {
      "anthropic": 3,
      "openai": 5,
      "google": 10
    },
    "modelConcurrency": {
      "anthropic/claude-opus-4-6": 2,
      "google/gemini-3-flash": 10
    }
  }
}
```

| 选项                | 默认值    | 描述                                                                                                             |
| ------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| `defaultConcurrency` | -         | 所有提供商/模型的默认最大并发后台任务                                                    |
| `staleTimeoutMs`    | `180000`  | 过期超时（毫秒）- 中断无活动超过此时长的任务（最小值：60000 = 1 分钟）             |
| `providerConcurrency` | -       | 每提供商并发限制。键为提供商名称（如 `anthropic`、`openai`、`google`）                        |
| `modelConcurrency`  | -         | 每模型并发限制。键为完整模型名称（如 `anthropic/claude-opus-4-6`）。覆盖提供商限制。 |

**优先级顺序**：`modelConcurrency` > `providerConcurrency` > `defaultConcurrency`

**使用场景**：
- 限制昂贵模型（如 Opus）以防止成本激增
- 允许快速/便宜模型（如 Gemini Flash）更多并发任务
- 通过设置提供商级别上限来遵守提供商速率限制

## 类别

类别通过 `task` 工具启用领域特定的任务委派。每个类别在调用 `Sisyphus-Junior` 代理时应用运行时预设（模型、温度、提示追加）。

### 内置类别

所有 8 个类别都带有最优模型默认值，但**你必须配置它们才能使用这些默认值**：

| 类别                | 内置默认模型             | 描述                                                          |
| ------------------- | ------------------------ | -------------------------------------------------------------- |
| `visual-engineering` | `google/gemini-3-pro` (high) | 前端、UI/UX、设计、样式、动画                          |
| `ultrabrain`        | `openai/gpt-5.3-codex` (xhigh) | 深度逻辑推理、复杂架构决策               |
| `deep`              | `openai/gpt-5.3-codex` (medium) | 目标导向的自主问题解决、行动前深入研究 |
| `artistry`          | `google/gemini-3-pro` (high) | 高度创意/艺术性任务、新颖想法                          |
| `quick`             | `anthropic/claude-haiku-4-5` | 琐碎任务 - 单文件更改、拼写修复、简单修改        |
| `unspecified-low`   | `anthropic/claude-sonnet-4-6` | 不适合其他类别的任务，低努力需求           |
| `unspecified-high`  | `anthropic/claude-opus-4-6` (max) | 不适合其他类别的任务，高努力需求          |
| `writing`           | `kimi-for-coding/k2p5` | 文档、散文、技术写作                              |

### ⚠️ 关键：模型解析优先级

**类别不会使用其内置默认值，除非已配置。** 模型解析遵循此优先级：

```
1. 用户配置的模型（在 oh-my-opencode.json 中）
2. 类别的内置默认值（如果你在配置中添加了类别）
3. 系统默认模型（来自 opencode.json）
```

**示例问题：**

```json
// opencode.json
{ "model": "anthropic/claude-sonnet-4-6" }

// oh-my-opencode.json（空类别部分）
{}

// 结果：所有类别使用 claude-sonnet-4-6（浪费！）
// - quick 任务使用 Sonnet 而不是 Haiku（昂贵）
// - ultrabrain 使用 Sonnet 而不是 GPT-5.2（推理能力较差）
// - 视觉任务使用 Sonnet 而不是 Gemini（UI 效果较差）
```

### 推荐配置

**要为每个类别使用最优模型，将它们添加到你的配置中：**

```json
{
  "categories": {
    "visual-engineering": { 
      "model": "google/gemini-3-pro"
    },
    "ultrabrain": { 
      "model": "openai/gpt-5.3-codex",
      "variant": "xhigh"
    },
    "deep": {
      "model": "openai/gpt-5.3-codex",
      "variant": "medium"
    },
    "artistry": { 
      "model": "google/gemini-3-pro",
      "variant": "high"
    },
    "quick": { 
      "model": "anthropic/claude-haiku-4-5"  // 琐碎任务快速 + 便宜
    },
    "unspecified-low": { 
      "model": "anthropic/claude-sonnet-4-6"
    },
    "unspecified-high": { 
      "model": "anthropic/claude-opus-4-6",
      "variant": "max"
    },
    "writing": { 
      "model": "kimi-for-coding/k2p5"
    }
  }
}
```

**只配置你有权访问的类别。** 未配置的类别将回退到你的系统默认模型。

### 用法

```javascript
// 通过 task 工具
task(category="visual-engineering", prompt="创建一个响应式仪表板组件")
task(category="ultrabrain", prompt="设计支付处理流程")

// 或直接指定代理（绕过类别）
task(agent="oracle", prompt="审查此架构")
```

### 自定义类别

添加你自己的类别或覆盖内置类别：

```json
{
  "categories": {
    "data-science": {
      "model": "anthropic/claude-sonnet-4-6",
      "temperature": 0.2,
      "prompt_append": "Focus on data analysis, ML pipelines, and statistical methods."
    },
    "visual-engineering": {
      "model": "google/gemini-3-pro-preview",
      "prompt_append": "Use shadcn/ui components and Tailwind CSS."
    }
  }
}
```

每个类别支持：`model`、`temperature`、`top_p`、`maxTokens`、`thinking`、`reasoningEffort`、`textVerbosity`、`tools`、`prompt_append`、`variant`、`description`、`is_unstable_agent`。

### 额外类别选项

| 选项              | 类型    | 默认值  | 描述                                                                                         |
| ----------------- | ------- | ------- | -------------------------------------------------------------------------------------------- |
| `description`     | string  | -       | 类别用途的人类可读描述。显示在任务提示中。                     |
| `is_unstable_agent` | boolean | `false` | 将代理标记为不稳定 - 强制后台模式进行监控。gemini 模型自动启用。 |

## 模型解析系统

在运行时，Oh My OpenCode 使用 3 步解析过程来确定每个代理和类别使用的模型。这根据你的配置和可用模型动态发生。

### 概述

**问题**：用户有不同的提供商配置。系统需要在运行时为每个任务选择最佳可用模型。

**解决方案**：简单的 3 步解析流程：
1. **步骤 1：用户覆盖** — 如果你在 `oh-my-opencode.json` 中指定了模型，完全使用该模型
2. **步骤 2：提供商回退** — 按需求的优先级顺序尝试每个提供商，直到找到一个可用的
3. **步骤 3：系统默认** — 回退到 OpenCode 配置的默认模型

### 解析流程

```
┌─────────────────────────────────────────────────────────────────┐
│                     模型解析流程                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   步骤 1：用户覆盖                                         │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 用户在 oh-my-opencode.json 中指定了模型？               │   │
│   │         是 → 完全按指定使用                  │   │
│   │         否 → 继续步骤 2                        │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│   步骤 2：提供商优先级回退                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 按需求的 providers 顺序尝试每个提供商：                 │   │
│   │                                                         │   │
│   │ Sisyphus 示例：                                   │   │
│   │ anthropic → github-copilot → opencode → antigravity     │   │
│   │     │            │              │            │          │   │
│   │     ▼            ▼              ▼            ▼          │   │
│   │ 尝试：anthropic/claude-opus-4-6                          │   │
│   │ 尝试：github-copilot/claude-opus-4-6                     │   │
│   │ 尝试：opencode/claude-opus-4-6                           │   │
│   │ ...                                                     │   │
│   │                                                         │   │
│   │ 在可用模型中找到？ → 返回匹配的模型       │   │
│   │ 未找到？ → 尝试下一个提供商                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼（所有提供商已耗尽）        │
│   步骤 3：系统默认                                        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 返回 systemDefaultModel（来自 opencode.json）          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 代理提供商链

每个代理都有定义的提供商优先级链。系统按顺序尝试提供商，直到找到可用模型：

| 代理 | 模型（无前缀） | 提供商优先级链 |
|------|----------------|----------------|
| **Sisyphus** | `claude-opus-4-6` | anthropic/github-copilot/opencode → kimi-for-coding → opencode → zai-coding-plan → opencode |
| **Hephaestus** | `gpt-5.3-codex` | openai/github-copilot/opencode（需要提供商） |
| **oracle** | `gpt-5.2` | openai/github-copilot/opencode → google/github-copilot/opencode → anthropic/github-copilot/opencode |
| **librarian** | `glm-4.7` | zai-coding-plan → opencode → anthropic/github-copilot/opencode |
| **explore** | `grok-code-fast-1` | github-copilot → anthropic/opencode → opencode |
| **multimodal-looker** | `gemini-3-flash` | google/github-copilot/opencode → openai/github-copilot/opencode → zai-coding-plan → kimi-for-coding → opencode → anthropic/github-copilot/opencode → opencode |
| **Prometheus (Planner)** | `claude-opus-4-6` | anthropic/github-copilot/opencode → kimi-for-coding → opencode → openai/github-copilot/opencode → google/github-copilot/opencode |
| **Metis (Plan Consultant)** | `claude-opus-4-6` | anthropic/github-copilot/opencode → kimi-for-coding → opencode → openai/github-copilot/opencode → google/github-copilot/opencode |
| **Momus (Plan Reviewer)** | `gpt-5.2` | openai/github-copilot/opencode → anthropic/github-copilot/opencode → google/github-copilot/opencode |
| **Atlas** | `k2p5` | kimi-for-coding → opencode → anthropic/github-copilot/opencode → openai/github-copilot/opencode → google/github-copilot/opencode |

### 类别提供商链

类别遵循相同的解析逻辑：

| 类别 | 模型（无前缀） | 提供商优先级链 |
|------|----------------|----------------|
| **visual-engineering** | `gemini-3-pro` | google/github-copilot/opencode → zai-coding-plan → anthropic/github-copilot/opencode → kimi-for-coding |
| **ultrabrain** | `gpt-5.3-codex` | openai/github-copilot/opencode → google/github-copilot/opencode → anthropic/github-copilot/opencode |
| **deep** | `gpt-5.3-codex` | openai/github-copilot/opencode → anthropic/github-copilot/opencode → google/github-copilot/opencode |
| **artistry** | `gemini-3-pro` | google/github-copilot/opencode → anthropic/github-copilot/opencode → openai/github-copilot/opencode |
| **quick** | `claude-haiku-4-5` | anthropic/github-copilot/opencode → google/github-copilot/opencode → opencode |
| **unspecified-low** | `claude-sonnet-4-6` | anthropic/github-copilot/opencode → openai/github-copilot/opencode → google/github-copilot/opencode |
| **unspecified-high** | `claude-opus-4-6` | anthropic/github-copilot/opencode → openai/github-copilot/opencode → google/github-copilot/opencode |
| **writing** | `k2p5` | kimi-for-coding → google/github-copilot/opencode → anthropic/github-copilot/opencode |

### 检查你的配置

使用 `doctor` 命令查看模型如何在当前配置下解析：

```bash
bunx oh-my-opencode doctor --verbose
```

"模型解析"检查显示：
- 每个代理/类别的模型需求
- 提供商回退链
- 用户覆盖（如果已配置）
- 有效解析路径

### 手动覆盖

在 `oh-my-opencode.json` 中覆盖任何代理或类别模型：

```json
{
  "agents": {
    "Sisyphus": {
      "model": "anthropic/claude-sonnet-4-6"
    },
    "oracle": {
      "model": "openai/o3"
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "anthropic/claude-opus-4-6"
    }
  }
}
```

当你指定模型覆盖时，它优先（步骤 1），提供商回退链完全跳过。

## 钩子

通过 `~/.config/opencode/oh-my-opencode.json` 或 `.opencode/oh-my-opencode.json` 中的 `disabled_hooks` 禁用特定内置钩子：

```json
{
  "disabled_hooks": ["comment-checker", "agent-usage-reminder"]
}
```

可用钩子：`todo-continuation-enforcer`、`context-window-monitor`、`session-recovery`、`session-notification`、`comment-checker`、`grep-output-truncator`、`tool-output-truncator`、`directory-agents-injector`、`directory-readme-injector`、`empty-task-response-detector`、`think-mode`、`anthropic-context-window-limit-recovery`、`rules-injector`、`background-notification`、`auto-update-checker`、`startup-toast`、`keyword-detector`、`agent-usage-reminder`、`non-interactive-env`、`interactive-bash-session`、`compaction-context-injector`、`thinking-block-validator`、`claude-code-hooks`、`ralph-loop`、`preemptive-compaction`、`auto-slash-command`、`sisyphus-junior-notepad`、`no-sisyphus-gpt`、`start-work`

**关于 `directory-agents-injector` 的说明**：此钩子在 OpenCode 1.1.37+ 上运行时**自动禁用**，因为 OpenCode 现在原生支持从子目录动态解析 AGENTS.md 文件（PR #10678）。这可以防止重复的 AGENTS.md 注入。对于较旧的 OpenCode 版本，该钩子保持激活以提供相同的功能。

**关于 `no-sisyphus-gpt` 的说明**：禁用此钩子**强烈不建议**。Sisyphus 没有针对 GPT 模型优化 —— 使用 GPT 运行 Sisyphus 的效果比原生 Codex 差，而且浪费你的钱。此钩子在检测到 GPT 模型时自动切换到 Hephaestus，这是 GPT 的正确代理。只有在你完全理解后果的情况下才禁用它。

**关于 `auto-update-checker` 和 `startup-toast` 的说明**：`startup-toast` 钩子是 `auto-update-checker` 的子功能。要仅禁用启动提示通知同时保持更新检查启用，请将 `"startup-toast"` 添加到 `disabled_hooks`。要禁用所有更新检查功能（包括提示），请将 `"auto-update-checker"` 添加到 `disabled_hooks`。

## 禁用命令

通过 `~/.config/opencode/oh-my-opencode.json` 或 `.opencode/oh-my-opencode.json` 中的 `disabled_commands` 禁用特定内置命令：

```json
{
  "disabled_commands": ["init-deep", "start-work"]
}
```

可用命令：`init-deep`、`start-work`

## 注释检查器

配置 comment-checker 钩子行为。注释检查器在代码中添加过多注释时发出警告。

```json
{
  "comment_checker": {
    "custom_prompt": "你的自定义警告消息。使用 {{comments}} 占位符显示检测到的注释 XML。"
  }
}
```

| 选项          | 默认值 | 描述                                                                |
| ------------- | ------ | ------------------------------------------------------------------- |
| `custom_prompt` | -    | 替换默认的自定义警告消息。使用 `{{comments}}` 占位符。 |

## 通知

配置后台任务完成的通知行为。

```json
{
  "notification": {
    "force_enable": true
  }
}
```

| 选项          | 默认值  | 描述                                                                                   |
| ------------- | ------- | -------------------------------------------------------------------------------------- |
| `force_enable` | `false` | 强制启用会话通知，即使检测到外部通知插件。默认：`false`。 |

## Sisyphus 任务

配置用于高级任务管理的 Sisyphus 任务系统。

```json
{
  "sisyphus": {
    "tasks": {
      "enabled": false,
      "storage_path": ".sisyphus/tasks",
      "claude_code_compat": false
    }
  }
}
```

### 任务配置

| 选项               | 默认值            | 描述                                                               |
| ------------------ | ----------------- | ------------------------------------------------------------------- |
| `enabled`          | `false`           | 启用 Sisyphus 任务系统                                               |
| `storage_path`     | `.sisyphus/tasks` | 任务存储路径（相对于项目根目录）                           |
| `claude_code_compat` | `false`        | 启用 Claude Code 路径兼容模式                                   |

## MCP

默认启用 Exa、Context7 和 grep.app MCP。

- **websearch**：由 [Exa AI](https://exa.ai) 驱动的实时网页搜索 - 搜索网页并返回相关内容
- **context7**：获取库的最新官方文档
- **grep_app**：通过 [grep.app](https://grep.app) 在数百万个公共 GitHub 仓库中超快速代码搜索

不需要它们？通过 `~/.config/opencode/oh-my-opencode.json` 或 `.opencode/oh-my-opencode.json` 中的 `disabled_mcps` 禁用：

```json
{
  "disabled_mcps": ["websearch", "context7", "grep_app"]
}
```

## LSP

OpenCode 提供 LSP 工具用于分析。
Oh My OpenCode 添加重构工具（重命名、代码操作）。
所有 OpenCode LSP 配置和自定义设置（来自 `opencode.jsonc` / `opencode.json`）都受支持，还有额外的 Oh My OpenCode 特定设置。
对于配置发现，当两者都存在时 `.jsonc` 优先于 `.json`（适用于 `opencode.*` 和 `oh-my-opencode.*`）。

通过 `~/.config/opencode/oh-my-opencode.jsonc` / `~/.config/opencode/oh-my-opencode.json` 或 `.opencode/oh-my-opencode.jsonc` / `.opencode/oh-my-opencode.json` 中的 `lsp` 选项添加 LSP 服务器：

```json
{
  "lsp": {
    "typescript-language-server": {
      "command": ["typescript-language-server", "--stdio"],
      "extensions": [".ts", ".tsx"],
      "priority": 10
    },
    "pylsp": {
      "disabled": true
    }
  }
}
```

每个服务器支持：`command`、`extensions`、`priority`、`env`、`initialization`、`disabled`。

| 选项           | 类型    | 默认值  | 描述                                                            |
| -------------- | ------- | ------- | ---------------------------------------------------------------- |
| `command`      | array   | -       | 启动 LSP 服务器的命令（可执行文件 + 参数）                          |
| `extensions`   | array   | -       | 此服务器处理的文件扩展名（如 `[".ts", ".tsx"]`）               |
| `priority`     | number  | -       | 多个服务器匹配文件时的优先级                               |
| `env`          | object  | -       | LSP 服务器的环境变量（键值对）                     |
| `initialization` | object | -       | 传递给 LSP 服务器的自定义初始化选项                        |
| `disabled`     | boolean | `false` | 是否禁用此 LSP 服务器                                         |

**带高级选项的示例：**

```json
{
  "lsp": {
    "typescript-language-server": {
      "command": ["typescript-language-server", "--stdio"],
      "extensions": [".ts", ".tsx"],
      "priority": 10,
      "env": {
        "NODE_OPTIONS": "--max-old-space-size=4096"
      },
      "initialization": {
        "preferences": {
          "includeInlayParameterNameHints": "all",
          "includeInlayFunctionParameterTypeHints": true
        }
      }
    }
  }
}
```

## 实验性

可选的实验性功能，可能会在未来版本中更改或删除。谨慎使用。

```json
{
  "experimental": {
    "truncate_all_tool_outputs": true,
    "aggressive_truncation": true,
    "auto_resume": true,
    "dynamic_context_pruning": {
      "enabled": false,
      "notification": "detailed",
      "turn_protection": {
        "enabled": true,
        "turns": 3
      },
      "protected_tools": ["task", "todowrite", "lsp_rename"],
      "strategies": {
        "deduplication": {
          "enabled": true
        },
        "supersede_writes": {
          "enabled": true,
          "aggressive": false
        },
        "purge_errors": {
          "enabled": true,
          "turns": 5
        }
      }
    }
  }
}
```

| 选项                      | 默认值  | 描述                                                                                                                                                                                   |
| ------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `truncate_all_tool_outputs` | `false` | 截断所有工具输出而不是仅白名单工具（Grep、Glob、LSP、AST-grep）。工具输出截断器默认启用 - 通过 `disabled_hooks` 禁用。                         |
| `aggressive_truncation`   | `false` | 当超过 token 限制时，积极截断工具输出以适应限制。比默认截断行为更激进。如果不足则回退到总结/恢复。 |
| `auto_resume`             | `false` | 在从思考块错误或思考禁用违规成功恢复后自动恢复会话。提取最后的用户消息并继续。                             |
| `dynamic_context_pruning` | 见下文  | 动态上下文修剪配置，用于自动管理上下文窗口使用。参见下方 [动态上下文修剪](#动态上下文修剪)。                              |

### 动态上下文修剪

动态上下文修剪通过智能修剪旧的工具输出自动管理上下文窗口。此功能有助于在长时间会话中保持性能。

```json
{
  "experimental": {
    "dynamic_context_pruning": {
      "enabled": false,
      "notification": "detailed",
      "turn_protection": {
        "enabled": true,
        "turns": 3
      },
      "protected_tools": ["task", "todowrite", "todoread", "lsp_rename", "session_read", "session_write", "session_search"],
      "strategies": {
        "deduplication": {
          "enabled": true
        },
        "supersede_writes": {
          "enabled": true,
          "aggressive": false
        },
        "purge_errors": {
          "enabled": true,
          "turns": 5
        }
      }
    }
  }
}
```

| 选项            | 默认值    | 描述                                                                               |
| --------------- | --------- | ---------------------------------------------------------------------------------- |
| `enabled`       | `false`   | 启用动态上下文修剪                                                               |
| `notification`  | `detailed` | 通知级别：`off`、`minimal` 或 `detailed`                                        |
| `turn_protection` | 见下文  | 回合保护设置 - 防止修剪最近的工具输出                                 |

#### 回合保护

| 选项      | 默认值 | 描述                                                  |
| --------- | ------ | ----------------------------------------------------- |
| `enabled` | `true` | 启用回合保护                                         |
| `turns`   | `3`    | 保护免受修剪的最近回合数（1-10）           |

#### 受保护工具

永不修剪的工具（默认）：

```json
["task", "todowrite", "todoread", "lsp_rename", "session_read", "session_write", "session_search"]
```

#### 修剪策略

| 策略            | 选项       | 默认值  | 描述                                                                  |
| --------------- | ---------- | ------- | ---------------------------------------------------------------------- |
| **deduplication** | `enabled`  | `true`  | 移除重复的工具调用（相同工具 + 相同参数）                              |
| **supersede_writes** | `enabled`  | `true`  | 当文件随后被读取时修剪写入输入                                   |
|                 | `aggressive` | `false` | 激进模式：如果有任何后续读取则修剪任何写入                         |
| **purge_errors** | `enabled`  | `true`  | 在 N 回合后修剪错误的工具输入                                        |
|                 | `turns`    | `5`     | 修剪错误前的回合数（1-20）                                    |

**警告**：这些功能是实验性的，可能导致意外行为。仅在你理解其影响时启用。

## 环境变量

| 变量                  | 描述                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCODE_CONFIG_DIR` | 覆盖 OpenCode 配置目录。用于使用 [OCX](https://github.com/kdcokenny/ocx) ghost 模式等工具进行配置文件隔离。 |
