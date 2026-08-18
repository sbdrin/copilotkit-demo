import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { CopilotKit } from "@copilotkit/react-core/v2"
import "@copilotkit/react-core/v2/styles.css"
import "./index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      useSingleEndpoint
      enableInspector
    >
      <App />
    </CopilotKit>
  </StrictMode>,
)
