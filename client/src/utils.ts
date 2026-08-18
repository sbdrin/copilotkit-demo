/** CopilotKit 工具结果可能是 JSON 对象，也可能是普通字符串 */
export function parseToolResult<T = unknown>(result: string): T | string {
  try {
    return JSON.parse(result) as T
  } catch {
    return result
  }
}
