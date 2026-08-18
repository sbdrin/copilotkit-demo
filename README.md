# CopilotKit 全功能演示 · DeepSeek

基于 React + Vite 的 CopilotKit 示例项目，后端通过 OpenAI 兼容 API 接入 **DeepSeek**。

## 功能覆盖

| 功能 | 实现方式 | 演示场景 |
|------|----------|----------|
| **Chat UI** | `CopilotSidebar` / `CopilotPopup` | 流式对话，可切换侧边栏/弹窗模式 |
| **Server Tools** | `defineTool` + `BuiltInAgent` | 查天气、搜知识库、数学计算 |
| **Frontend Tools** | `useFrontendTool` | AI 添加/切换/删除待办 |
| **Agent Context** | `useAgentContext` | 共享用户信息和待办列表 |
| **Generative UI** | `useComponent` / `useRenderTool` | 天气卡片、任务统计卡片 |
| **Default Render** | `useDefaultRenderTool` | 兜底渲染未注册的工具调用 |
| **Human-in-the-Loop** | `useHumanInTheLoop` | 预约会议时间选择 |
| **Suggestions** | `useConfigureSuggestions` | 快捷指令建议 |
| **DeepSeek** | `createOpenAI({ baseURL })` | 后端 LLM 接入 |

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的 DeepSeek API Key
```

默认使用 [DMXAPI](https://www.dmxapi.cn) OpenAI 兼容接口，也可换成其他兼容网关。

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务

```bash
npm run dev
```

- 前端：http://localhost:3100
- 后端：http://localhost:3001

### 4. 试试这些指令

在右侧 AI 助手面板中输入：

- 「查一下北京的天气」
- 「添加高优先级待办：完成演示文档」
- 「显示任务统计」
- 「预约技术分享会议」
- 「我有哪些待办？」
- 「搜索 hitl 功能说明」
- 「计算 99 * 88」

## 项目结构

```
copilot-demo/
├── client/                 # React 前端（Vite）
│   └── src/
│       ├── App.tsx         # 主应用，集成所有 CopilotKit hooks
│       └── components/     # UI 组件 + 生成式 UI 卡片
├── server/                 # Express 后端
│   └── src/index.ts        # CopilotKit Runtime + DeepSeek + 后端工具
├── .env.example
└── package.json            # monorepo 根配置
```

## 技术栈

- **前端**：React 19 + Vite + CopilotKit v2 (`@copilotkit/react-core/v2`)
- **后端**：Express + CopilotKit Runtime v2 + DeepSeek API
- **LLM**：`deepseek-v4-flash-0731`（DMXAPI OpenAI 兼容接口）

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `LLM_API_KEY` | 是 | API Key |
| `LLM_BASE_URL` | 否 | 兼容接口地址，默认 `https://www.dmxapi.cn/v1` |
| `LLM_MODEL` | 否 | 模型名称，默认 `deepseek-v4-flash-0731` |
| `PORT` | 否 | 后端端口，默认 `3001` |

## 生产构建

```bash
npm run build        # 构建前端
npm run start        # 启动后端（需先 build server: cd server && npm run build）
```

## 参考

- [CopilotKit 文档](https://docs.copilotkit.ai)
- [DeepSeek API 文档](https://api-docs.deepseek.com)
- [Built-in Agent 快速开始](https://docs.copilotkit.ai/built-in-agent/quickstart)
