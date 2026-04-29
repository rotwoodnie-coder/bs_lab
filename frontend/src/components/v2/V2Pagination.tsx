"use client";

import { Button } from "@bs-lab/ui";

interface V2PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function V2Pagination({ page, pageSize, total, onPageChange, className }: V2PaginationProps) {
  if (total <= pageSize) return null;

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className={`flex items-center justify-center gap-2 pt-2 ${className ?? ""}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        上一页
      </Button>
      <span className="text-sm text-muted-foreground tabular-nums">
        第 {page} 页 · 共 {totalPages} 页 · {total} 条
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        下一页
      </Button>
    </div>
  );
}
