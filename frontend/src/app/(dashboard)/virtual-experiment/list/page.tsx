"use client"

import { useState } from "react"
import { LayoutGrid, Loader2, Table2, Plus, Search } from "@bs-lab/ui/icons"
import { Button, Input, Tabs, TabsList, TabsTrigger } from "@bs-lab/ui"
import { buildApiUrl } from "@/lib/core-api-shared"
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes"
import { cn } from "@/lib/utils"
import { useVirtualExperiments } from "@/hooks/use-virtual-experiments"
import { ExperimentCard, ExperimentTable } from "@/components/business/virtual-experiment"
import { CreateExperimentDialog } from "./_components/CreateExperimentDialog"
import { EditExperimentDialog } from "./_components/EditExperimentDialog"
import { updateVirtualExperiment } from "@/lib/v2/v2-virtual-experiment-api"
import { useSessionActor } from "@/hooks/use-session-actor"
import { UserRole } from "@/types/auth"
import type { VirtualExperimentRecord } from "@/lib/v2/v2-virtual-experiment-api"

function canReview(role: UserRole): boolean {
  return role === UserRole.RESEARCHER || role === UserRole.SCHOOL_ADMIN
    || role === UserRole.DISTRICT_ADMIN || role === UserRole.SUPER_ADMIN
}

export default function VirtualExperimentListPage() {
  const { role, hydrated } = useSessionActor()
  const {
    actor,
    viewScope,
    setViewScope,
    displayMode,
    setDisplayMode,
    result,
    loading,
    error,
    search,
    goPage,
    remove,
    submit,
    approve,
    reject,
    reload,
  } = useVirtualExperiments({ initialDisplayMode: "waterfall" })

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VirtualExperimentRecord | null>(null)

  const handleEdit = (item: VirtualExperimentRecord) => setEditTarget(item)
  const handleReject = (id: string) => {
    const comment = prompt("请输入拒绝原因（可选）：")
    // 用户点击取消时会返回 null
    reject(id, comment ?? undefined)
  }
  const handleUploadCover = (item: VirtualExperimentRecord) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/jpeg,image/png"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const formData = new FormData()
      formData.append("file", file)
      formData.append("biz_type", "virtual_exp_cover")
      formData.append("is_hidden_from_gallery", "1")
      try {
        const res = await fetch(buildApiUrl("/v2/file/upload"), { method: "POST", body: formData, credentials: "include" })
        const json = await res.json()
        if (json.success && json.data?.fileUrl) {
          await updateVirtualExperiment(actor, item.id, { coverUrl: json.data.fileUrl })
          reload()
        }
      } catch { /* 静默 */ }
    }
    input.click()
  }

  const items = result?.items ?? []

  // Auth 尚未水合时显示加载态，避免"暂无数据"闪白
  if (!hydrated) {
    return (
      <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "items-center justify-center")}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className={cn(DASHBOARD_MAIN_CONTAINER_CLASS, "gap-4 py-4")}>
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">虚拟实验管理</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          新增
        </Button>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* 搜索 */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索实验名称..."
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") search((e.target as HTMLInputElement).value)
            }}
          />
        </div>

        {/* 数据范围切换 */}
        <div className="flex gap-2">
          <Button
            variant={viewScope === "mine" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewScope("mine")}
          >
            我的实验
          </Button>
          {canReview(role) && (
            <Button
              variant={viewScope === "review" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewScope("review")}
            >
              审核管理
            </Button>
          )}
        </div>

        {/* 视图模式切换 Tabs */}
        <Tabs
          value={displayMode}
          onValueChange={(v) => setDisplayMode(v as "waterfall" | "table")}
          className="ml-auto"
        >
          <TabsList className="h-9">
            <TabsTrigger value="waterfall" className="gap-1.5 text-xs h-7 px-3">
              <LayoutGrid className="w-3.5 h-3.5" />
              瀑布流
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-1.5 text-xs h-7 px-3">
              <Table2 className="w-3.5 h-3.5" />
              表格
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded border border-red-200">
          {error}
          <Button variant="link" size="sm" className="ml-2" onClick={reload}>重试</Button>
        </div>
      )}

      {/* ─── 瀑布流视图 ─────────────────────────────── */}
      {displayMode === "waterfall" && (
        <>
          {items.length === 0 && !loading ? (
            <div className="py-16 text-center text-muted-foreground">暂无数据</div>
          ) : (
            <div
              className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4"
              style={{ columnFill: "balance" }}
            >
              {items.map((item) => (
                <div key={item.id} className="break-inside-avoid mb-4">
                  <ExperimentCard
                    item={item}
                    onEdit={handleEdit}
                    onDelete={(id) => { if (confirm("确认删除？")) remove(id) }}
                    onSubmitReview={submit}
                    onUploadCover={handleUploadCover}
                    onApprove={viewScope === "review" ? approve : undefined}
                    onReject={viewScope === "review" ? handleReject : undefined}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 瀑布流分页 */}
          {result && result.total > result.pageSize && (
            <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
              <span>共 {result.total} 条</span>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={result.page <= 1}
                  onClick={() => goPage(result.page - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={result.page * result.pageSize >= result.total}
                  onClick={() => goPage(result.page + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── 表格视图 ───────────────────────────────── */}
      {displayMode === "table" && (
        <ExperimentTable
          items={items}
          loading={loading}
          onEdit={handleEdit}
          onDelete={(id) => { if (confirm("确认删除？")) remove(id) }}
          onSubmitReview={submit}
          onUploadCover={handleUploadCover}
          onApprove={viewScope === "review" ? approve : undefined}
          onReject={viewScope === "review" ? handleReject : undefined}
        />
      )}

      {/* 弹窗 */}
      <CreateExperimentDialog
        actor={actor}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={reload}
      />
      {editTarget && (
        <EditExperimentDialog
          actor={actor}
          record={editTarget}
          open={!!editTarget}
          onOpenChange={() => setEditTarget(null)}
          onUpdated={reload}
        />
      )}
    </div>
  )
}
