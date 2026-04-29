'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../../lib/utils'

/** 拇指水平位移（px），与轨道宽、内边距、拇指直径对齐 */
const THUMB_TRAVEL_PX = {
  sm: 14,
  md: 20,
  lg: 24,
} as const

const switchRootVariants = cva(
  'peer relative inline-flex shrink-0 cursor-pointer items-center overflow-visible rounded-full border border-transparent shadow-none outline-none transition-[background-color,border-color,box-shadow] duration-200 ease-out focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=unchecked]:bg-muted dark:data-[state=unchecked]:bg-muted/70 touch-manipulation select-none',
  {
    variants: {
      size: {
        /** 紧凑：材料清单、行内开关 */
        sm: 'h-4.5 min-h-[1.125rem] w-8 px-0.5 data-[state=checked]:bg-primary',
        /** 默认：表单与常规设置 */
        md: 'h-6 w-11 p-1 data-[state=checked]:bg-primary',
        /** 大：全局壳层、需强调触控的入口；开启态与 md 一致为纯色 primary（无渐变） */
        lg: 'h-8 w-14 p-1 data-[state=checked]:bg-primary',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

const switchThumbVariants = cva(
  'pointer-events-none block origin-center rounded-full ring-0 will-change-transform transition-transform duration-200 ease-out data-[state=unchecked]:bg-background data-[state=unchecked]:shadow-sm data-[state=checked]:bg-primary-foreground data-[state=checked]:shadow-md',
  {
    variants: {
      size: {
        sm: 'size-3.5',
        md: 'size-4',
        lg: 'size-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
)

export type SwitchProps = Omit<
  React.ComponentPropsWithoutRef<'button'>,
  'role' | 'type' | 'children' | 'aria-checked'
> &
  VariantProps<typeof switchRootVariants> & {
    checked?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }

/**
 * Switch（原生 `role="switch"`，无 `@radix-ui/react-switch`）。
 * Radix Switch 在受控模式下配合隐藏 bubble input 的 effect 曾与外层状态形成更新环，导致 Maximum update depth exceeded。
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    className,
    size: sizeProp,
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    disabled,
    onClick,
    ...props
  },
  ref,
) {
  const size = sizeProp ?? 'md'
  const isControlled = checkedProp !== undefined
  const [uncontrolledChecked, setUncontrolledChecked] = React.useState(() => defaultChecked === true)

  React.useEffect(() => {
    if (!isControlled && defaultChecked !== undefined) {
      setUncontrolledChecked(defaultChecked === true)
    }
  }, [defaultChecked, isControlled])

  const checked = isControlled ? Boolean(checkedProp) : uncontrolledChecked

  const onCheckedChangeRef = React.useRef(onCheckedChange)
  onCheckedChangeRef.current = onCheckedChange

  const travel = THUMB_TRAVEL_PX[size]

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event)
      if (event.defaultPrevented) return
      if (disabled) return
      const next = !checked
      if (!isControlled) setUncontrolledChecked(next)
      onCheckedChangeRef.current?.(next)
    },
    [onClick, disabled, checked, isControlled],
  )

  return (
    <button
      type="button"
      role="switch"
      ref={ref}
      disabled={disabled}
      aria-checked={checked}
      data-slot="switch"
      data-size={size}
      data-state={checked ? 'checked' : 'unchecked'}
      className={cn(switchRootVariants({ size }), className)}
      onClick={handleClick}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(switchThumbVariants({ size }))}
        style={{
          transform: `translateX(${checked ? travel : 0}px) scale(${checked ? 1.1 : 1})`,
        }}
      />
    </button>
  )
})

Switch.displayName = 'Switch'

export { Switch }
