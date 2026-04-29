import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

/**
 * Button
 * - 基于 Radix Slot 支持 asChild 组合模式
 * - variant 样式统一依赖 Tailwind 语义色（映射自 @theme 变量）
 * - size 提供默认、紧凑、大尺寸与图标按钮规格
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/30",
        /** 审核通过、成功主操作（语义色 status-success） */
        success:
          "bg-status-success text-primary-foreground hover:bg-status-success/90 focus-visible:ring-status-success/35",
        /** 驳回、警示主操作（语义色 status-warning；与 Badge warning 前景对齐） */
        warning:
          "bg-status-warning text-primary hover:bg-status-warning/90 focus-visible:ring-status-warning/40",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 h-11 px-4 py-2 has-[>svg]:px-3",
        sm: "min-h-11 h-11 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "min-h-12 h-12 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-11 min-h-11 min-w-11",
        "icon-sm": "size-10 min-h-10 min-w-10",
        "icon-lg": "size-12 min-h-12 min-w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
