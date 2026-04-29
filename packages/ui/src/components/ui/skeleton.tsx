import * as React from 'react'
import { cn } from '../../lib/utils'

/**
 * Skeleton
 * Props: 继承 div 原生属性，支持 `className` 自定义尺寸与圆角。
 * 用法: 用于异步加载占位，推荐搭配语义容器（Card/List/Table）按布局放置。
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-pulse rounded-md', className)}
      {...props}
    />
  )
}

export type SkeletonProps = React.ComponentProps<typeof Skeleton>;

export { Skeleton }


