import { CopilotChatInput } from '@copilotkit/react-core/v2'
import type { CopilotChatProps } from '@copilotkit/react-core/v2'
import type { ComponentProps } from 'react'
import { CHAT_ATTACHMENTS } from './attachments'

type AddButtonProps = ComponentProps<typeof CopilotChatInput.AddMenuButton>

/** 点 + 直接打开系统文件选择框，不走下拉菜单 */
function DirectAddFileButton({
  onAddFile,
  disabled,
  className,
  toolsMenu: _toolsMenu,
  ...rest
}: AddButtonProps) {
  return (
    <CopilotChatInput.ToolbarButton
      {...rest}
      data-testid="copilot-add-menu-button"
      icon={
        <svg
          className="cpk:size-[20px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      }
      labelKey="chatInputToolbarAddButtonLabel"
      defaultClassName="cpk:ml-1"
      className={className}
      disabled={disabled || !onAddFile}
      onClick={() => onAddFile?.()}
    />
  )
}

export const copilotChatConfig: Pick<
  CopilotChatProps,
  'attachments' | 'labels' | 'input'
> = {
  attachments: CHAT_ATTACHMENTS,
  labels: {
    modalHeaderTitle: 'DeepSeek 助手',
    chatInputToolbarAddButtonLabel: '添加附件',
  },
  input: {
    addMenuButton: DirectAddFileButton,
  },
}
