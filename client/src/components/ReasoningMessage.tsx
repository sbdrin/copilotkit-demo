import { CopilotChatReasoningMessage } from '@copilotkit/react-core/v2'
import type { ComponentProps } from 'react'

type ReasoningProps = ComponentProps<typeof CopilotChatReasoningMessage>

/** 将内置英文时长文案转成中文 */
function toZhLabel(label: string, isStreaming: boolean): string {
  if (isStreaming) return '思考中…'
  return label
    .replace(/^Thought for\s+/i, '已思考 ')
    .replace(/a few seconds/i, '片刻')
    .replace(/(\d+)\s*seconds?/i, '$1 秒')
    .replace(/(\d+)\s*minutes?/i, '$1 分钟')
    .replace(/(\d+)m\s+(\d+)s/i, '$1 分 $2 秒')
}

/**
 * 弱化思考过程：流式时展开，结束后自动折叠（沿用内置逻辑），样式更淡。
 */
export function ReasoningMessage(props: ReasoningProps) {
  return (
    <CopilotChatReasoningMessage
      {...props}
      className="reasoning-muted"
      header={({ isOpen, label, hasContent, isStreaming, onClick }) => (
        <CopilotChatReasoningMessage.Header
          isOpen={isOpen}
          label={toZhLabel(label ?? '', !!isStreaming)}
          hasContent={hasContent}
          isStreaming={isStreaming}
          onClick={onClick}
          className="reasoning-muted__header"
        />
      )}
      contentView={({ isStreaming, hasContent, children }) => (
        <CopilotChatReasoningMessage.Content
          isStreaming={isStreaming}
          hasContent={hasContent}
          className="reasoning-muted__content"
        >
          {children}
        </CopilotChatReasoningMessage.Content>
      )}
    />
  )
}
