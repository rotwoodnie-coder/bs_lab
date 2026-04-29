declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** 列在「列显示」菜单与工具提示中的展示名；缺省时回退为 column.id */
    label?: string;
  }
}

export {};
