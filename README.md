# CopilotKit 全功能演示 · Agno AG-UI

基于 React + Vite 的 CopilotKit 示例项目。前端保留全部 CopilotKit hooks 演示；后端推理与工具执行由 **Agno AGUIApp** 承担，本地仅保留一层 **CopilotRuntime 薄代理**（参考 `kdl-agent` 的 `/api/copilotkit` 接法）。

## 架构

```
React 前端 (CopilotKit v2 hooks)
    ↓  /api/copilotkit
Express 薄代理 (server/) — CopilotRuntime + AgnoAgent
    ↓  AG-UI 协议
Agno AGUIApp (远程)
```

## 功能覆盖

| 功能 | 实现方式 | 说明 |
|------|----------|------|
| **Chat UI** | `CopilotSidebar` / `CopilotPopup` | 流式对话 |
| **Frontend Tools** | `useFrontendTool` | AI 操作待办列表 |
| **Agent Context** | `useAgentContext` | 共享用户/待办/表单状态 |
| **Generative UI** | `useComponent` / `useRenderTool` | 天气卡片、HTML 预览等 |
| **Human-in-the-Loop** | `useHumanInTheLoop` | 表单、会议预约、HTML 编辑 |
| **Suggestions** | `useConfigureSuggestions` | 快捷指令 |
| **Attachments** | 聊天附件配置 | 图片/文档上传 |
| **后端 Agent** | Agno AGUIApp | 推理与 Server Tools 在 Agno 侧配置 |

> 原先 demo 中的 `getWeather`、`calculate` 等 **Server Tools** 需在 Agno Agent 中配置；前端 `useRenderTool` 仍可渲染同名工具结果。

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入 Agno AG-UI 端点
# JWT 必须从 kdl-agent 管理后台「全局配置 → agno_jwt_token」复制（会过期）
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务

```bash
npm run dev
```

- 前端：http://localhost:3100
- 代理：http://localhost:3001（转发至 Agno AGUIApp）

### 4. 试试这些指令

- 「添加高优先级待办：完成演示文档」
- 「生成产品介绍 HTML 并预览」
- 「我想提交反馈，弹出表单」
- 「预约技术分享会议」

## 项目结构

```
copilot-demo/
├── client/                 # React 前端（Vite + CopilotKit v2）
│   └── src/
│       ├── App.tsx         # 所有 CopilotKit hooks 演示
│       └── components/
├── server/                 # Agno 薄代理（非业务后端）
│   └── src/index.ts        # CopilotRuntime + AgnoAgent
├── .env.example
└── package.json
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `AGNO_AGUI_URL` | 是 | Agno AG-UI 端点 URL |
| `AGNO_JWT_TOKEN` | 是 | Agno 鉴权 JWT（header: `jwt-token`）。**须从 kdl-agent 全局配置 `agno_jwt_token` 复制**，seed 里的默认值会失效 |
| `AGNO_AGENT_CODE` | 否 | 目标智能体 code，默认 `AGENT_005` |
| `PORT` | 否 | 本地代理端口，默认 `3001` |

## 生产构建

```bash
npm run build        # 构建前端
npm run start        # 启动代理（需先 build server: cd server && npm run build）
```

## 参考

- [kdl-agent](../kdl-agent) — Agno 代理实现参考
- [CopilotKit 文档](https://docs.copilotkit.ai)
- [CopilotKit × Agno 集成](https://docs.copilotkit.ai/integrations/agno/quickstart)
