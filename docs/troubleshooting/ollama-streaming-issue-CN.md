# Ollama 流式传输问题 - JSON 解析错误

## 问题

当使用 Ollama 作为 oh-my-opencode 代理的提供者时，你可能会遇到：

```
JSON Parse error: Unexpected EOF
```

当代理尝试进行工具调用时会出现此错误（例如 `explore` 代理使用 `mcp_grep_search`）。

## 根本原因

当 API 请求中使用 `stream: true` 时，Ollama 返回 **NDJSON**（换行符分隔的 JSON）：

```json
{"message":{"tool_calls":[{"function":{"name":"read","arguments":{"filePath":"README.md"}}}]}, "done":false}
{"message":{"content":""}, "done":true}
```

Claude Code SDK 期望的是单个 JSON 对象，而不是多行 NDJSON，因此导致解析错误。

### 为什么会发生这种情况

- **Ollama API**：设计上以 NDJSON 格式返回流式响应
- **Claude Code SDK**：无法正确处理工具调用的 NDJSON 响应
- **oh-my-opencode**：透传 SDK 的行为（无法在此层面修复）

## 解决方案

### 方案一：禁用流式传输（推荐 - 立即生效）

配置你的 Ollama 提供者使用 `stream: false`：

```json
{
  "provider": "ollama",
  "model": "qwen3-coder",
  "stream": false
}
```

**优点：**
- 立即生效
- 无需修改代码
- 配置简单

**缺点：**
- 响应时间稍慢（无流式传输）
- 交互反馈较少

### 方案二：仅使用非工具代理

如果需要流式传输，请避免使用带工具的代理：

- ✅ **安全**：简单文本生成、非工具任务
- ❌ **有问题**：任何带工具调用的代理（explore、librarian 等）

### 方案三：等待 SDK 修复（长期）

正确的修复需要 Claude Code SDK：

1. 检测 NDJSON 响应
2. 分别解析每一行
3. 合并多行中的 `tool_calls`
4. 返回单个合并后的响应

**追踪**：https://github.com/code-yeongyu/oh-my-opencode/issues/1124

## 变通实现

在 SDK 修复之前，以下是实现 NDJSON 解析的方法（供 SDK 维护者参考）：

```typescript
async function parseOllamaStreamResponse(response: string): Promise<object> {
  const lines = response.split('\n').filter(line => line.trim());
  const mergedMessage = { tool_calls: [] };

  for (const line of lines) {
    try {
      const json = JSON.parse(line);
      if (json.message?.tool_calls) {
        mergedMessage.tool_calls.push(...json.message.tool_calls);
      }
      if (json.message?.content) {
        mergedMessage.content = json.message.content;
      }
    } catch (e) {
      // 跳过格式错误的行
      console.warn('Skipping malformed NDJSON line:', line);
    }
  }

  return mergedMessage;
}
```

## 测试

验证修复是否有效：

```bash
# 使用 curl 测试（应与 stream: false 一起正常工作）
curl -s http://localhost:11434/api/chat \
  -d '{
    "model": "qwen3-coder",
    "messages": [{"role": "user", "content": "Read file README.md"}],
    "stream": false,
    "tools": [{"type": "function", "function": {"name": "read", "description": "Read a file", "parameters": {"type": "object", "properties": {"filePath": {"type": "string"}}, "required": ["filePath"]}}}]
  }'
```

## 相关问题

- **oh-my-opencode**：https://github.com/code-yeongyu/oh-my-opencode/issues/1124
- **Ollama API 文档**：https://github.com/ollama/ollama/blob/main/docs/api.md

## 获取帮助

如果遇到此问题：

1. 检查你的 Ollama 提供者配置
2. 设置 `stream: false` 作为临时解决方案
3. 向问题追踪器报告任何其他错误
4. 提供你的配置（不含密钥）以便调试
