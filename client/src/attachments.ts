import type { AttachmentsConfig } from "@copilotkit/react-core/v2"

/** 聊天框附件配置：支持图片、文档、文本等 */
export const CHAT_ATTACHMENTS: AttachmentsConfig = {
  enabled: true,
  accept: "image/*,.pdf,.txt,.md,.json,.csv,.html,.doc,.docx,.xls,.xlsx",
  maxSize: 20 * 1024 * 1024, // 20MB
  onUploadFailed: ({ reason, file, message }) => {
    const tips: Record<string, string> = {
      "file-too-large": "文件过大",
      "invalid-type": "不支持的文件类型",
      "upload-failed": "上传失败",
    }
    console.warn(`[附件] ${tips[reason] ?? reason}: ${file.name} — ${message}`)
    // ponytail: 演示用 alert；生产环境可换 toast
    alert(`${tips[reason] ?? "上传失败"}：${file.name}\n${message}`)
  },
}
