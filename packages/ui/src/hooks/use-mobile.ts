import * as React from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * 响应式断点检测：与 Sidebar 等布局组件对齐。
 * 首屏 SSR 为 false，避免 hydration 抖动；挂载后同步真实视口宽度。
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const sync = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', sync)
    sync()
    return () => mql.removeEventListener('change', sync)
  }, [])

  return isMobile
}
