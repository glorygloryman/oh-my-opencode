# 实施计划与记录：在 Claude Code 中支持全局知识保存命令

**执行时间**: 2026-02-28

---

## 1. 计划目标

将 `save-knowledge.md` 改造并注册为 Claude Code 的全局自定义命令 (`~/.claude/commands/save-knowledge.md`)。使开发者在任意项目的任意一次 Claude Code 会话中，都能快速总结上下文并沉淀知识文档到本地 `project-docs/FAQ` 中。

## 2. 详细执行步骤

### 步骤一：创建个人全局命令目录（已完成）

执行 `mkdir -p ~/.claude/commands` 确保全局的 commands 配置夹存在，准备放置我们的核心逻辑文件。

### 步骤二：撰写并生成设计方案（已完成）

编写 `project-docs/design/2026-02-28-claude-code-全局命令-save-knowledge-design.md`，对核心差别（去 XML 标签、换获取上下文途径、增加静默创建路径）进行了总结，符合项目对于方案设计必须留档的要求。

### 步骤三：编写 Command 文件本身（已完成）

按照重构后的设计模型，将原 `.opencode/command/save-knowledge.md` 中冗杂的信息去掉，增加强制创建目录的特性：

1. 去除首尾的 `<command-instruction>` 和 `<user-request>` 结构。
2. 第一步“获取会话内容”直接调整为声明指令从当前上下文读取，不需要任何提取历史命令工具的调用。
3. 文件开头增加行内执行语句 ``!`mkdir -p project-docs/FAQ` `` 为后续输出铺垫。

以上变更作为最终产物落地在 `~/.claude/commands/save-knowledge.md`。

### 步骤四：撰写计划文档说明（已完成）

完成此计划实施报告即宣告整个安装任务的闭环，将其命名并抛入 `project-docs/plans` 中。

---

## 3. 验收及后续规划

目前，相关内容全部完成。开发者现在只需呼出 Claude Code 控制台，输入 `/save-knowledge [限定词]` 进行实地检验即可，如输出文档合规、未出现冗余报错，即表示部署完美收官。
