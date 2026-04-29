/**
 * @bs-lab/ui 主入口：组件、hooks、设计 token，以及常用底层类型转发。
 * UI 组件经 `./components/index` 聚合导出（含 `TabSwitcher` 等）。
 * @author Leixm
 */
export * from "./components/index";
export * from "./hooks/index";
export * from "./tokens/index";
export * from "./lib/dashboard-command-palette-classes";

// TanStack Table：类型从主包转发，运行时 API 仍可从 `@bs-lab/ui/react-table` 全量导入。
export type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  Table as TanStackTable,
  VisibilityState,
} from "@tanstack/react-table";

/**
 * Radix 根原语 Props 类型（如 DialogContentProps、PopoverContentProps），
 * 与 `components/ui` 中封装组件并列导出；业务扩展时优先从此处取类型，勿直连 @radix-ui/*。
 */
export type * from "./radix-primitive-props";
