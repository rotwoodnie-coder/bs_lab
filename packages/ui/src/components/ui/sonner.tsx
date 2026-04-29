'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import {
  Toaster as SonnerRoot,
  toast as sonnerToast,
  type ToasterProps,
} from 'sonner'

export { sonnerToast }

/**
 * Sonner 全局提示条。
 * - 业务侧统一使用组件名 `SonnerToaster` 与类型 `SonnerToasterProps`；
 * - 勿与 Radix Toast 体系中的 `Toaster`（`./toaster`）混淆。
 */
function SonnerToaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <SonnerRoot
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { SonnerToaster }
export type { ToasterProps as SonnerToasterProps }
