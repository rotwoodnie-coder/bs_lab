"use client";

import * as React from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  sonnerToast,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@bs-lab/ui";
import {
  Bot,
  Copy,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
} from "@bs-lab/ui/icons";

import { PageHeader } from "@/components/layout/page-header";
import { useSessionActor } from "@/hooks/use-session-actor";
import {
  listAiPrompts,
  createAiPrompt,
  updateAiPrompt,
  deleteAiPrompt,
  type AiPromptTemplate,
  type CreateAiPromptInput,
  type UpdateAiPromptInput,
} from "@/lib/v2/v2-ai-prompt-api";

const ROLE_OPTIONS = [
  { value: "Teacher", label: "教师 (Teacher)" },
  { value: "Student", label: "学生 (Student)" },
  { value: "Researcher", label: "研究员 (Researcher)" },
  { value: "*", label: "默认兜底 (*)" },
] as const;

function formatTime(t: string | null): string {
  if (!t) return "-";
  try {
    return new Date(t).toLocaleString("zh-CN");
  } catch {
    return t;
  }
}

export default function AdminAiPromptsPage() {
  const { actor } = useSessionActor();
  const [templates, setTemplates] = React.useState<AiPromptTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<AiPromptTemplate | null>(null);
  const [previewId, setPreviewId] = React.useState<string | null>(null);

  // 编辑表单
  const [editCode, setEditCode] = React.useState("");
  const [editName, setEditName] = React.useState("");
  const [editRole, setEditRole] = React.useState("*");
  const [editContent, setEditContent] = React.useState("");
  const [editIsActive, setEditIsActive] = React.useState(true);
  const [editDescription, setEditDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const loadTemplates = React.useCallback(async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const data = await listAiPrompts(actor);
      setTemplates(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "加载失败";
      sonnerToast.error("加载失败", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [actor]);

  React.useEffect(() => {
    if (actor) loadTemplates();
  }, [actor, loadTemplates]);

  // ─── 新增 ─────────────────────────────────────────
  const handleNew = () => {
    setEditingTemplate(null);
    setEditCode("");
    setEditName("");
    setEditRole("*");
    setEditContent("");
    setEditIsActive(true);
    setEditDescription("");
    setEditDialogOpen(true);
  };

  // ─── 编辑 ─────────────────────────────────────────
  const handleEdit = (t: AiPromptTemplate) => {
    setEditingTemplate(t);
    setEditCode(t.code);
    setEditName(t.name);
    setEditRole(t.role);
    setEditContent(t.content);
    setEditIsActive(t.isActive === "y");
    setEditDescription(t.description ?? "");
    setEditDialogOpen(true);
  };

  // ─── 保存 ─────────────────────────────────────────
  const handleSave = async () => {
    if (!actor) return;
    if (!editCode.trim() || !editName.trim() || !editContent.trim()) {
      sonnerToast.error("请填写必要字段（编码、名称、内容）");
      return;
    }
    setSaving(true);
    try {
      if (editingTemplate) {
        const input: UpdateAiPromptInput = {
          name: editName.trim(),
          content: editContent.trim(),
          is_active: editIsActive ? "y" : "n",
          description: editDescription.trim() || undefined,
        };
        await updateAiPrompt(actor, editingTemplate.templateId, input);
        sonnerToast.success("更新成功");
      } else {
        const input: CreateAiPromptInput = {
          code: editCode.trim(),
          name: editName.trim(),
          role: editRole,
          content: editContent.trim(),
          is_active: editIsActive ? "y" : "n",
          description: editDescription.trim() || undefined,
        };
        await createAiPrompt(actor, input);
        sonnerToast.success("创建成功");
      }
      setEditDialogOpen(false);
      await loadTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "保存失败";
      sonnerToast.error("保存失败", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  // ─── 删除 ─────────────────────────────────────────
  const handleDelete = async (t: AiPromptTemplate) => {
    if (!actor) return;
    if (!window.confirm(`确定删除模板"${t.name}"？此操作不可撤销。`)) return;
    try {
      await deleteAiPrompt(actor, t.templateId);
      sonnerToast.success("删除成功");
      await loadTemplates();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "删除失败";
      sonnerToast.error("删除失败", { description: msg });
    }
  };

  // ─── 预览/收起 ────────────────────────────────────
  const togglePreview = (id: string) => {
    setPreviewId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <PageHeader
        title="AI 系统提示词管理"
        description="管理各角色的 system prompt 模板，编辑后 60 秒内自动生效于 AI 对话。"
      />

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {templates.length} 个模板
        </p>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="size-4" />
          新建模板
        </Button>
      </div>

      <Separator className="my-4" />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <FileText className="size-12" />
          <p className="mt-4 text-sm">暂无模板，点击上方按钮新建</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <Card key={t.templateId} className={t.isActive === "n" ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bot className="size-4 text-primary" />
                      {t.name}
                      <Badge variant={t.isActive === "y" ? "default" : "secondary"}>
                        {t.isActive === "y" ? "启用" : "停用"}
                      </Badge>
                      <Badge variant="outline">v{t.version}</Badge>
                    </CardTitle>
                    <CardDescription>
                      编码：{t.code} | 角色：{t.role} | 更新：{formatTime(t.updateTime)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePreview(t.templateId)}
                      title={previewId === t.templateId ? "收起" : "预览"}
                    >
                      {previewId === t.templateId ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(t)}
                      title="编辑"
                    >
                      <Edit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(t)}
                      title="删除"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {previewId === t.templateId && (
                <CardContent>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                      {t.content.slice(0, 2000)}
                      {t.content.length > 2000 && "\n\n...(内容过长，已截取前 2000 字)"}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "编辑模板" : "新建模板"}
            </DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "修改系统提示词模板，保存后自动清除缓存，60 秒内生效。"
                : "创建新的系统提示词模板，code 必须唯一。"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">编码 *</Label>
                <input
                  id="code"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  placeholder="role_teacher"
                  disabled={!!editingTemplate}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">名称 *</Label>
                <input
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="教师角色 · 专业结构化"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">适用角色</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Prompt 内容 *</Label>
              <Textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="输入系统提示词模板内容..."
                className="min-h-[300px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                支持变量占位符：{'{{userName}}'}（用户姓名）、{'{{schoolLevelId}}'}（学段标识）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">备注说明</Label>
              <input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="可选，说明模板用途"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="is-active"
                checked={editIsActive}
                onCheckedChange={setEditIsActive}
              />
              <Label htmlFor="is-active">启用</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
