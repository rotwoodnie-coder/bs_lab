/**
 * 角色权限配置页
 */
"use client";

import * as React from "react";
import { Alert, AlertDescription, Badge, Button, Card, CardContent, Input, Tabs, TabsContent, TabsList, TabsTrigger, Switch } from "@bs-lab/ui";
import { PageHeader } from "@/components/layout/page-header";
import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";
import { useRolesPage } from "./page.hooks";
import { RoleSelector } from "./_components/RoleSelector";
import { IdentityGovernanceDrawer } from "./_components/IdentityGovernanceDrawer";
import { withPermission } from "@/lib/permissions/with-permission";

function ConsoleRolesPage() {
  const {
    roles,
    rolesLoading,
    rolesError,
    selectedRoleId,
    selectedRoleLabel,
    accessMatrix,
    identityDrawerOpen,
    setIdentityDrawerOpen,
    handleRoleChange,
    permissionGroups,
    permissionRows,
    permissionSearch,
    setPermissionSearch,
    permissionScope,
    setPermissionScope,
    updatePermissionRow,
    saving,
    savePermissions,
    sysMenus,
    resetToPreset,
  } = useRolesPage();

  const totalCount = sysMenus.length;
  const totalRead = permissionRows.filter((r) => r.canRead).length;
  const totalWrite = permissionRows.filter((r) => r.canWrite).length;

  const scopeBadge = React.useMemo(() => {
    switch (permissionScope) {
      case "read-on": return "已开读";
      case "write-on": return "已开写";
      case "missing": return "未完整";
      default: return "全部";
    }
  }, [permissionScope]);

  return (
    <div className={DASHBOARD_MAIN_CONTAINER_CLASS}>
      <div className="space-y-6">
        <PageHeader
          title="角色与权限"
          description="系统级全量目录 + 当前角色授权视图。菜单数量不代表权限高低，最终以角色授权为准。"
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetToPreset} disabled={!selectedRoleId || sysMenus.length === 0}>恢复默认预设</Button>
              <Button variant="outline" onClick={() => setIdentityDrawerOpen(true)}>打开身份治理</Button>
            </div>
          }
        />

        {rolesError ? <Alert><AlertDescription>角色列表加载失败，请检查后端 /v2/sys-role 接口。</AlertDescription></Alert> : null}

        <Card className="border-border shadow-none">
          <CardContent className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <RoleSelector roles={roles} selectedRoleId={selectedRoleId} loading={rolesLoading} error={rolesError} onSelect={handleRoleChange} />

            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-medium text-foreground">{selectedRoleId ? `${selectedRoleLabel} — 当前角色授权视图` : "当前角色授权视图"}</h3>
                  <p className="text-xs text-muted-foreground">先选角色，再查看全量目录；只在授权页修改权限，菜单数量不代表权限高低。</p>
                </div>
                <Button onClick={() => void savePermissions()} disabled={saving || !selectedRoleId || sysMenus.length === 0}>{saving ? "保存中…" : "保存权限"}</Button>
              </div>

              {!selectedRoleId ? <Alert><AlertDescription>请先选择一个角色后再配置权限。</AlertDescription></Alert> : null}
              {sysMenus.length === 0 ? <Alert><AlertDescription>当前没有加载到菜单目录，请先确认 sys_menu 已初始化。</AlertDescription></Alert> : null}

              <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 md:grid-cols-5">
                <div><div className="text-xs text-muted-foreground">全量目录</div><div className="mt-1 text-lg font-semibold">{totalCount}</div></div>
                <div><div className="text-xs text-muted-foreground">READ</div><div className="mt-1 text-lg font-semibold">{totalRead}</div></div>
                <div><div className="text-xs text-muted-foreground">WRITE</div><div className="mt-1 text-lg font-semibold">{totalWrite}</div></div>
                <div><div className="text-xs text-muted-foreground">当前筛选</div><div className="mt-1"><Badge variant="secondary">{scopeBadge}</Badge></div></div>
                <div><div className="text-xs text-muted-foreground">当前角色</div><div className="mt-1 text-sm font-medium">{selectedRoleLabel || "未选择"}</div></div>
              </div>

              <Tabs defaultValue="permission" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2"><TabsTrigger value="permission">权限编辑</TabsTrigger><TabsTrigger value="matrix">授权视图</TabsTrigger></TabsList>

                <TabsContent value="permission" className="pt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input value={permissionSearch} onChange={(e) => setPermissionSearch(e.target.value)} placeholder="搜索菜单名 / 编码 / 路径" className="max-w-md" />
                    <Button variant={permissionScope === "all" ? "default" : "outline"} size="sm" onClick={() => setPermissionScope("all")}>全部</Button>
                    <Button variant={permissionScope === "read-on" ? "default" : "outline"} size="sm" onClick={() => setPermissionScope("read-on")}>已开读</Button>
                    <Button variant={permissionScope === "write-on" ? "default" : "outline"} size="sm" onClick={() => setPermissionScope("write-on")}>已开写</Button>
                    <Button variant={permissionScope === "missing" ? "default" : "outline"} size="sm" onClick={() => setPermissionScope("missing")}>未完整</Button>
                    <Button variant="outline" size="sm" onClick={() => setPermissionSearch("")}>清空搜索</Button>
                  </div>
                  <div className="text-xs text-muted-foreground">提示：点击“恢复默认预设”可快速加载当前角色的默认 R/W 建议，再按实际业务微调保存。</div>
                  <div className="space-y-4 rounded-lg border border-border p-4">
                    {permissionGroups.map((group) => (
                      <div key={group.group} className="space-y-3 rounded-md border border-border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium">{group.title}</div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => group.items.forEach((row) => updatePermissionRow(row.menuId, { canRead: true }))}>本组全读</Button><Button variant="outline" size="sm" onClick={() => group.items.forEach((row) => updatePermissionRow(row.menuId, { canWrite: true, canRead: true }))}>本组全写</Button><Badge variant="secondary">{group.items.length}</Badge></div></div>
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[980px] text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-3 py-2 text-left">页面</th>
                                <th className="px-3 py-2 text-left">路径</th>
                                <th className="px-3 py-2 text-center">READ</th>
                                <th className="px-3 py-2 text-center">WRITE</th>
                                <th className="px-3 py-2 text-center">权限码</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((row) => (
                                <tr key={row.menuId} className="border-t border-border">
                                  <td className="px-3 py-2">{row.menuName}</td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground">{row.path ?? "-"}</td>
                                  <td className="px-3 py-2 text-center"><Switch checked={row.canRead} onCheckedChange={(checked) => updatePermissionRow(row.menuId, { canRead: checked })} /></td>
                                  <td className="px-3 py-2 text-center"><Switch checked={row.canWrite} onCheckedChange={(checked) => updatePermissionRow(row.menuId, { canWrite: checked })} /></td>
                                  <td className="px-3 py-2 text-xs text-muted-foreground"><div>{row.readCode}</div><div>{row.writeCode}</div></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="matrix" className="pt-4 space-y-3">
                  {permissionGroups.map((group) => (
                    <Card key={group.group} className="border-border shadow-none"><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between"><div><h4 className="text-sm font-medium">{group.title}</h4><p className="text-xs text-muted-foreground">当前角色在该分组下的授权明细</p></div><Badge variant="secondary">{group.items.length}</Badge></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-muted/50"><tr><th className="px-3 py-2 text-left">页面</th><th className="px-3 py-2 text-left">路径</th><th className="px-3 py-2 text-center">READ</th><th className="px-3 py-2 text-center">WRITE</th><th className="px-3 py-2 text-center">权限码</th></tr></thead><tbody>{group.items.map((row) => (<tr key={row.menuId} className="border-t border-border"><td className="px-3 py-2">{row.menuName}</td><td className="px-3 py-2 text-xs text-muted-foreground">{row.path ?? "-"}</td><td className="px-3 py-2 text-center">{row.canRead ? "✓" : "×"}</td><td className="px-3 py-2 text-center">{row.canWrite ? "✓" : "×"}</td><td className="px-3 py-2 text-xs text-muted-foreground"><div>{row.readCode}</div><div>{row.writeCode}</div></td></tr>))}</tbody></table></div></CardContent></Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <IdentityGovernanceDrawer open={identityDrawerOpen} onOpenChange={setIdentityDrawerOpen} />
      </div>
    </div>
  );
}

export default withPermission(ConsoleRolesPage, "/console/settings/system/roles");
