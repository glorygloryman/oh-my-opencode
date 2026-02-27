# Save-Knowledge 命令设计方案

**生成时间**: 2026-02-24  
**命令路径**: `.opencode/command/save-knowledge.md`  
**输出目录**: `project-docs/FAQ/`

---

## 1. 功能概述

创建一个 OpenCode Command，允许用户通过 `/save-knowledge [可选主题]` 命令将当前会话的对话内容保存为结构化的知识文档。

### 1.1 使用场景

- 阅读项目代码时记录学习成果
- 保存技术讨论和决策过程
- 积累项目知识库

### 1.2 触发方式

```bash
# 方式 1：自动提取主题
/save-knowledge

# 方式 2：指定主题关键词
/save-knowledge Hook实现
/save-knowledge 插件架构设计
```

---

## 2. 核心设计决策

### 2.1 方案对比

| 维度 | 原方案 (save-faq) | 优化后 (save-knowledge) |
|------|-------------------|-------------------------|
| 命令名称 | `/save-faq` | `/save-knowledge` |
| 标题来源 | 仅自动提取 | 支持参数 + 自动提取降级 |
| 文件名格式 | `YYYY-MM-DD-标题.md` | `YYYY-MM-DD-标题-HHMMSS.md` |
| 噪音过滤 | 仅描述"过滤调试过程" | 明确过滤规则 + 主题相关性过滤 |
| 输出格式 | 结构化知识文档 | 结构化知识文档（保留） |

### 2.2 优化点详解

#### 优化 1：自定义标题参数

利用 OpenCode Command 的 `$ARGUMENTS` 变量：

- 如果 `$ARGUMENTS` 不为空 → 使用参数作为主题主干
- 如果 `$ARGUMENTS` 为空 → 模型自动提取主题

**优势**: 用户可精确控制文档主题，避免自动提取偏差

#### 优化 2：文件命名追加时间戳

**原格式**: `2026-02-24-会话保存方案.md`  
**新格式**: `2026-02-24-会话保存方案-143052.md`

**优势**: 防止同一天多次保存导致的文件覆盖冲突

#### 优化 3：精细化噪音过滤

**必须过滤的内容**:
1. Thinking 块: `<thinking>...</thinking>`
2. 工具原始输出:
   - `session_read` 返回的 JSON
   - `Bash` 命令输出
   - `Read`/`Grep`/`Glob`/`LSP` 等工具返回
3. Session ID、消息 ID 等技术标识
4. 调试日志、错误堆栈
5. 重复的试错过程

**主题相关性过滤** (当指定主题时):
- 只保留与主题直接相关的对话内容
- 过滤无关寒暄、过渡语句、旁支讨论

**优势**: 生成的文档更聚焦、更精炼、更有价值

---

## 3. 实现细节

### 3.1 文件位置

```
.opencode/command/
├── save-knowledge.md    # 命令配置文件
└── save-faq.md          # 已删除的旧文件
```

### 3.2 命令结构

```markdown
---
description: 保存当前会话总结为知识文档到 project-docs/FAQ 目录
argument-hint: [可选：主题关键词]
---

<command-instruction>
# 保存会话为知识文档

[指令内容...]
</command-instruction>

<user-request>
$ARGUMENTS
</user-request>
```

### 3.3 执行流程

```
1. 获取会话历史 (session_list + session_read)
2. 内容过滤 (thinking块/工具输出/主题相关性)
3. 分析与总结 (提取核心主题、讨论要点、结论)
4. 生成文件名 (YYYY-MM-DD-主题-HHMMSS.md)
5. 写入文件 (project-docs/FAQ/)
6. 确认输出
```

### 3.4 输出文档结构

```markdown
# [中文标题]

> 生成时间：YYYY-MM-DD HH:MM:SS
> 来源：OpenCode 会话总结
> 主题关键词：[如指定]

## 背景与问题

## 讨论要点

### [要点1]
### [要点2]

## 结论与决策

## 相关引用
```

---

## 4. 迁移指南

### 4.1 项目级使用

文件已位于 `.opencode/command/save-knowledge.md`，在当前项目可直接使用：

```bash
/save-knowledge
/save-knowledge 插件架构
```

### 4.2 全局使用

复制到全局配置目录：

```bash
# 方法 1：复制
cp .opencode/command/save-knowledge.md ~/.opencode/command/

# 方法 2：软链接（推荐，方便同步更新）
mkdir -p ~/.opencode/command
ln -s $(pwd)/.opencode/command/save-knowledge.md ~/.opencode/command/save-knowledge.md
```

迁移后在**任何项目**中都可以使用 `/save-knowledge` 命令。

---

## 5. 使用示例

### 示例 1：保存全部对话

```
用户: /save-knowledge
系统: ✅ 知识文档已保存: project-docs/FAQ/2026-02-24-插件架构设计-143052.md
```

### 示例 2：指定主题

```
用户: /save-knowledge Hook实现
系统: ✅ 知识文档已保存: project-docs/FAQ/2026-02-24-Hook实现-143052.md

# 文档只包含与 Hook 实现相关的内容
```

---

## 6. 方案评估

基于 `project-docs/reports/2026-02-24-save-faq方案评估报告.md` 的评估结论：

- ✅ **配置文件路径**: `.opencode/command/`（单数）正确
- ✅ **输出目录**: `project-docs/FAQ/` 符合项目规范
- ✅ **输出格式**: 结构化知识文档优于机械问答对
- ✅ **文件命名**: 追加 HHMMSS 时间戳防冲突
- ✅ **标题生成**: 支持参数传入 + 自动提取降级
- ✅ **噪音过滤**: 明确过滤规则 + 主题相关性过滤

---

## 7. 注意事项

1. **目录自动创建**: 如果 `project-docs/FAQ/` 不存在，命令会自动创建
2. **中文要求**: 文档语言、标题、文件名主题描述必须为中文
3. **简短对话处理**: 如果对话内容无实质内容，会提示用户
4. **完成确认**: 写入后会向用户确认文件路径和标题

---

## 8. 相关文件

- **命令文件**: `.opencode/command/save-knowledge.md`
- **评估报告**: `project-docs/reports/2026-02-24-save-faq方案评估报告.md`
- **本设计方案**: `project-docs/plans/2026-02-24-save-knowledge-design.md`
