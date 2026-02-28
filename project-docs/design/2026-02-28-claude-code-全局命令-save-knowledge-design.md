# Claude Code 全局命令 `save-knowledge` 设计方案

**生成时间**: 2026-02-28  
**目标路径**: `~/.claude/commands/save-knowledge.md`

---

## 1. 需求与背景

在原有的 OpenCode 环境中，用户通过定义在项目内的 `.opencode/command/save-knowledge.md` 使用 `/save-knowledge [关键词]` 功能，自动将当前对话整理为知识文档保存。

由于用户目前高频使用 **Claude Code** 进行工作，期望将该能力顺滑、无缝地迁移到 Claude Code 的全局命令中，并在全系统的所有开发目录下均能使用这一习惯沉淀知识到该项目的 `project-docs/FAQ/`。

### 核心诉求

1. **全局可用**：不再与具体的工程目录强绑定，保证在任何项目中打开 `claude` 都能 `/save-knowledge`。
2. **去除冗余标签**：剔除 OpenCode 特有标签（如 `<command-instruction>` 等闭环标签），改用 Claude Code 的纯 Markdown 指令。
3. **自适应的会话获取**：依托 Claude Code 会话历史本身在前置上下文的能力，不再使用显式调用拉取对话的接口。
4. **安全与兜底**：命令应当通过行内 Bash （`!`）优先保障目录的创建，避免因 `project-docs/FAQ/` 不存在导致写入失败。

---

## 2. 方案对比与选型

如上一轮分析所示，我们从“软连接项目命令”、“硬拷贝解耦式命令”和“插件封装式命令”中，最终采纳了**硬拷贝解耦式命令 (方案 B)**：

* **原因**：完全迎合 Claude Code 自带的 `commands/` 生态约定（YAML frontmatter 原生支持）；彻底去掉了 OpenCode 生态特有的历史包袱；且它对于单文件迁移的开发、维护心智最为友好，避免了过度设计的嫌疑。

---

## 3. 设计调整点（改动映射）

| 功能点/设计 | 原 OpenCode 版 | 迁移后 Claude Code 版 | 获益 |
| ----------- | -------------- | --------------------- | ---- |
| **标签外壳** | 使用 `<command-instruction>` 与 `<user-request>` | 纯 Markdown，不使用任何外部标签包装 | 结构更轻，完全符合 Claude Code Slash Command 的设计初衷 |
| **参数注入** | `<user-request>$ARGUMENTS</user-request>`在底部 | 不显式包围，直接在 Prompt 中声明 `$ARGUMENTS` 规则 | 原生语境，更自然 |
| **拉取对话** | 第一步需调用 `session_list` 获 ID 再 `session_read` 读取 | 宣告：“直接基于当前对话上下文”，零代码调用 | 节省 Token，极大减少模型为了取知识而发起的冗余 Tool Calls，性能飙升 |
| **目录保障** | 纯靠模型分析时是否机智地创建目录，偶尔报错失败 | 引入行内语法: `!mkdir -p project-docs/FAQ` 前置触发 | 100% 确定性保证，无需依赖模型推理尝试建目录动作即可成功 |
| **模板标签** | 内部 `来源：OpenCode 会话总结` | `来源：Claude Code 会话总结` | 文脉顺畅 |

---

## 4. 实施细节与文件布局

最终的文件内容放置在系统用户根目录：`~/.claude/commands/save-knowledge.md`。

只要该文件存在，用户在终端启动 Claude Code 命令时，键入 `/help` 即可看到并调用 `/save-knowledge`（标有 `(user)` 个人全局标识）。

---

## 5. 测试与回归建议

部署完成后，在任意能够容错并可以新建文档的项目下启动 Claude Code 输入：

```bash
/save-knowledge 测试知识导出指令
```

**测试验收点**:

1. 观察是否报 Tool 错误。
2. 观察当前目录下是否生成 `project-docs/FAQ` 目录并输出了合理的 .md 文件。
3. 检查文件内部结构是否遵守前文的模板定义，以及来源是否标记为 `Claude Code`。
