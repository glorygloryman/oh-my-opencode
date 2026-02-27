# 使用非默认大模型配置指南

如果你在使用 `oh-my-opencode` 时没有 Claude、OpenAI、Gemini 等默认支持的模型，可以通过以下方式配置你自己的模型。

## 方式一：直接编辑配置文件（推荐）

安装完成后，直接编辑插件的配置文件：

```bash
# 配置文件位置
~/.config/opencode/oh-my-opencode.json
```

### 配置格式示例

```json
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "agents": {
    "sisyphus": { 
      "model": "your-provider/your-model" 
    },
    "oracle": { 
      "model": "your-provider/your-model" 
    },
    "hephaestus": { 
      "model": "your-provider/your-model" 
    },
    "librarian": { 
      "model": "your-provider/your-model" 
    }
  },
  "categories": {
    "unspecified-high": { 
      "model": "your-provider/your-model" 
    },
    "unspecified-low": { 
      "model": "your-provider/your-model" 
    }
  }
}
```

### 配置项说明

- **agents**: 配置各个智能体使用的模型
  - `sisyphus`: 主代理（负责任务规划和编排）
  - `oracle`: 调试专家（负责问题诊断和修复）
  - `hephaestus`: 代码生成专家
  - `librarian`: 知识检索专家
  - `explore`: 探索型代理
  
- **categories**: 配置任务类别默认使用的模型
  - `unspecified-high`: 高优先级任务
  - `unspecified-low`: 低优先级任务

## 方式二：非交互模式安装

在安装时跳过所有模型选择提示，全部选择 "no"：

```bash
bunx oh-my-opencode install --no-tui \
  --claude=no \
  --openai=no \
  --gemini=no \
  --copilot=no \
  --opencode-zen=no \
  --zai-coding-plan=no \
  --kimi-for-coding=no
```

安装完成后，按方式一所述编辑配置文件。

## 如何查看可用的模型

在 OpenCode 中查看你已配置的可用模型：

```bash
opencode models
```

## 常见的模型格式

根据你使用的模型提供商，模型 ID 格式如下：

| 提供商 | 示例模型 ID |
|--------|------------|
| OpenRouter | `openrouter/anthropic/claude-sonnet-4` |
| Together AI | `together/meta-llama/Llama-3-70b-chat-hf` |
| DeepSeek | `deepseek/deepseek-chat` |
| OpenAI | `openai/gpt-4-turbo` |
| Anthropic | `anthropic/claude-sonnet-4-5` |
| Google | `google/gemini-1.5-pro` |
| 本地模型 | `http://localhost:11434/v1/model-name` |

## 注意事项

1. **模型兼容性**: 某些代理（如 `sisyphus`）对模型能力要求较高，建议使用 Claude Opus 4.5 或同等能力的模型

2. **fallback 配置**: 如果配置的模型不可用，插件会自动回退到 `opencode/glm-4.7-free`

3. **配置文件修改后立即生效**: 修改 `~/.config/opencode/oh-my-opencode.json` 后，重启 OpenCode 即可生效

4. **验证配置**: 使用 `bunx oh-my-opencode doctor` 命令检查配置是否正确

## 故障排查

如果遇到问题，可以查看日志：

```bash
# 插件日志位置
cat /tmp/oh-my-opencode.log
```

或使用诊断工具：

```bash
bunx oh-my-opencode doctor
```

## 相关文件位置

```
~/.config/opencode/
├── config.json              # OpenCode 主配置
├── oh-my-opencode.json      # oh-my-opencode 插件配置 ⭐
└── .mcp.json                # MCP 服务器配置
```
