"use client";

import * as React from "react";
import {
  Avatar, AvatarFallback, Button, Card, CardContent, CardHeader, CardTitle, Input,
} from "@bs-lab/ui";
import { BookOpen, Copy, LayoutGrid, List, School, Search, Settings2, Users } from "@bs-lab/ui/icons";

import type { V2SysUserItem, V2SysOrgItem } from "@/lib/v2/v2-sys-api";
import type { TeacherClassRelationRow, SubjectOption } from "../page.hooks";
import {
  resolveDeptDisplayName,
  resolveTeacherSchoolColumn,
} from "../_lib/teacher-class-org-resolve";
import {
  ClassBadges, CountBadge, DeptBadge, StatusIndicator, SubjectBadges,
} from "./teacher-table-helpers";

export interface TeacherClassTableProps {
  teachers: V2SysUserItem[];
  loading: boolean;
  query: string;
  onQueryChange: (v: string) => void;
  allRelationsMap: Record<string, TeacherClassRelationRow[]>;
  classTree: V2SysOrgItem[];
  classNameById: Record<string, string>;
  subjectNameById: Record<string, string>;
  schoolOrgId: string | null;
  schoolOrgName: string | null;
  subjects: SubjectOption[];
  onConfigure: (teacherId: string) => void;
  onCopyConfig?: (fromTeacherId: string) => void;
}

const AVATAR_TONES = [
  "bg-teal-100 text-teal-800",
  "bg-sky-100 text-sky-800",
  "bg-cyan-100 text-cyan-800",
  "bg-emerald-100 text-emerald-800",
  "bg-indigo-100 text-indigo-800",
  "bg-violet-100 text-violet-800",
] as const;

function avatarToneClass(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length]!;
}

function initials(name: string) { return (name ?? "?").slice(0, 2); }

const COLS =
  "grid-cols-[minmax(200px,2.2fr)_minmax(180px,2fr)_minmax(140px,1.6fr)_minmax(240px,3.5fr)_52px_100px_88px]";

export function TeacherClassTable({
  teachers, loading, query, onQueryChange,
  allRelationsMap, classTree, classNameById, subjectNameById, schoolOrgId, schoolOrgName,
  onConfigure, onCopyConfig,
}: TeacherClassTableProps) {
  const [viewMode, setViewMode] = React.useState<"table" | "grid">("table");

  return (
    <Card className="w-full max-w-none rounded-xl border border-border/80 bg-card shadow-none">
      <CardHeader className="border-b border-border/80 pb-4 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">教师列表</CardTitle>
            <p className="mt-1 text-xs font-normal text-muted-foreground">
              共 {teachers.length} 位教师
              {schoolOrgName ? <span className="ml-2 font-medium text-primary">· {schoolOrgName}</span> : null}
            </p>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
            <div className="relative min-w-0 flex-1 basis-[min(100%,28rem)]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="搜索教师姓名或工号…"
                className="border-border/80 bg-background pl-9 text-sm font-normal tracking-tight placeholder:text-muted-foreground/70"
              />
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-0.5">
              <ViewBtn active={viewMode === "table"} onClick={() => setViewMode("table")} icon={<List className="h-4 w-4" />} />
              <ViewBtn active={viewMode === "grid"} onClick={() => setViewMode("grid")} icon={<LayoutGrid className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? <SkeletonRows /> : viewMode === "table"
          ? <TableView teachers={teachers} allRelationsMap={allRelationsMap} classTree={classTree} classNameById={classNameById} subjectNameById={subjectNameById} schoolOrgId={schoolOrgId} schoolOrgName={schoolOrgName} onConfigure={onConfigure} />
          : <GridView teachers={teachers} allRelationsMap={allRelationsMap} classTree={classTree} classNameById={classNameById} subjectNameById={subjectNameById} schoolOrgId={schoolOrgId} schoolOrgName={schoolOrgName} onConfigure={onConfigure} onCopyConfig={onCopyConfig} />
        }
      </CardContent>
    </Card>
  );
}

function ViewBtn({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex h-8 w-9 items-center justify-center rounded-md transition-colors ${active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
      {icon}
    </button>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-border/80">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex h-16 items-center gap-4 px-6">
          <div className="size-9 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

type TeacherTableContextProps = {
  allRelationsMap: Record<string, TeacherClassRelationRow[]>;
  classTree: V2SysOrgItem[];
  classNameById: Record<string, string>;
  subjectNameById: Record<string, string>;
  schoolOrgId: string | null;
  schoolOrgName: string | null;
  onConfigure: (id: string) => void;
};

type RowProps = { teachers: V2SysUserItem[] } & TeacherTableContextProps;

function TableView({ teachers, allRelationsMap, classTree, classNameById, subjectNameById, schoolOrgId, schoolOrgName, onConfigure }: RowProps) {
  return (
    <div className="w-full max-w-none">
      <div className={`grid w-full ${COLS} items-start gap-3 border-b border-border/80 bg-muted/30 px-6 py-3 text-base font-semibold tracking-wide text-foreground`}>
        <span className="pt-0.5">教师画像</span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 leading-tight">
            <School className="h-4 w-4 shrink-0 text-foreground/75" aria-hidden />
            学校
          </span>
          <span className="pl-[22px] text-xs font-medium tracking-normal text-muted-foreground">部门</span>
        </span>
        <span className="flex items-center gap-1.5 pt-0.5">
          <BookOpen className="h-4 w-4 shrink-0 text-foreground/75" aria-hidden />
          授课学科
        </span>
        <span className="flex items-center gap-1.5 pt-0.5">
          <Users className="h-4 w-4 shrink-0 text-foreground/75" aria-hidden />
          关联班级
        </span>
        <span className="pt-0.5 text-center">班数</span>
        <span className="pt-0.5">排课状态</span>
        <span className="pt-0.5 text-right">操作</span>
      </div>
      {teachers.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">暂无教师，请调整搜索条件</div>
      ) : (
        <div className="divide-y divide-border/80">
          {teachers.map((t) => (
            <TableRow key={t.userId} t={t} allRelationsMap={allRelationsMap} classTree={classTree} classNameById={classNameById} subjectNameById={subjectNameById} schoolOrgId={schoolOrgId} schoolOrgName={schoolOrgName} onConfigure={onConfigure} />
          ))}
        </div>
      )}
    </div>
  );
}

function TableRow({
  t,
  allRelationsMap,
  classTree,
  classNameById,
  subjectNameById,
  schoolOrgId,
  schoolOrgName,
  onConfigure,
}: { t: V2SysUserItem } & TeacherTableContextProps) {
  const rels = allRelationsMap[t.userId] ?? [];
  const classIds = [...new Set(rels.map((r) => r.classOrgId).filter(Boolean))];
  const subjectIds = [...new Set(rels.map((r) => r.subjectId).filter(Boolean))];
  const schoolColLine = resolveTeacherSchoolColumn(t, classTree, schoolOrgId, schoolOrgName);
  const deptOnly = resolveDeptDisplayName(t, classTree, schoolColLine);

  return (
    <div className={`grid w-full max-w-none ${COLS} items-start gap-3 px-6 py-3.5 transition-colors hover:bg-muted/25`}>
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/60">
          <AvatarFallback className={`text-xs font-semibold ${avatarToneClass(t.userName)}`}>{initials(t.userName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          {/* V0 列表：姓名略大于正文、工号弱化 */}
          <p className="truncate text-[15px] font-semibold leading-snug tracking-tight text-foreground">{t.userName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{t.loginName}</p>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-start gap-1.5">
          <School className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <div className="min-w-0 flex flex-col gap-1">
            {schoolColLine ? (
              <p className="text-sm font-normal leading-snug text-foreground">{schoolColLine}</p>
            ) : (
              <em className="not-italic text-xs text-muted-foreground/80">未分配</em>
            )}
            {deptOnly ? <DeptBadge name={deptOnly} /> : null}
          </div>
        </div>
      </div>
      <SubjectBadges ids={subjectIds} subjectNameById={subjectNameById} />
      <ClassBadges ids={classIds} classNameById={classNameById} max={6} />
      <div className="flex justify-center"><CountBadge count={classIds.length} /></div>
      <StatusIndicator active={rels.length > 0} />
      <div className="flex justify-end">
        <Button size="sm" variant="outline"
          className="h-8 gap-1 rounded-lg border-border/80 px-2.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
          onClick={() => onConfigure(t.userId)}>
          <Settings2 className="h-3.5 w-3.5" />配置
        </Button>
      </div>
    </div>
  );
}

function GridView({ teachers, allRelationsMap, classTree, classNameById, subjectNameById, schoolOrgId, schoolOrgName, onConfigure, onCopyConfig }: RowProps & { onCopyConfig?: (id: string) => void }) {
  if (teachers.length === 0) return <div className="py-12 text-center text-sm text-muted-foreground">暂无教师数据</div>;
  return (
    <div className="grid w-full max-w-none grid-cols-1 gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {teachers.map((t) => (
        <TeacherCard key={t.userId} t={t} allRelationsMap={allRelationsMap} classTree={classTree} classNameById={classNameById} subjectNameById={subjectNameById} schoolOrgId={schoolOrgId} schoolOrgName={schoolOrgName} onConfigure={onConfigure} onCopyConfig={onCopyConfig} />
      ))}
    </div>
  );
}

function TeacherCard({
  t,
  allRelationsMap,
  classTree,
  classNameById,
  subjectNameById,
  schoolOrgId,
  schoolOrgName,
  onConfigure,
  onCopyConfig,
}: { t: V2SysUserItem } & TeacherTableContextProps & { onCopyConfig?: (id: string) => void }) {
  const rels = allRelationsMap[t.userId] ?? [];
  const classIds = [...new Set(rels.map((r) => r.classOrgId).filter(Boolean))];
  const subjectIds = [...new Set(rels.map((r) => r.subjectId).filter(Boolean))];
  const schoolLine = resolveTeacherSchoolColumn(t, classTree, schoolOrgId, schoolOrgName);
  const deptOnly = resolveDeptDisplayName(t, classTree, schoolLine);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-6 shadow-none transition-shadow hover:shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar className="h-11 w-11 shrink-0 ring-2 ring-border/60">
          <AvatarFallback className={`text-sm font-semibold ${avatarToneClass(t.userName)}`}>{initials(t.userName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-snug tracking-tight text-foreground">{t.userName}</p>
          <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">{t.loginName}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
        <School className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="truncate font-medium text-foreground">
          {schoolLine ?? <em className="not-italic font-normal text-muted-foreground/80">未分配学校</em>}
        </span>
      </div>
      {deptOnly ? (
        <p className="text-xs text-muted-foreground">
          部门 / 教研组：<span className="font-medium text-foreground">{deptOnly}</span>
        </p>
      ) : null}
      <div className="flex items-center justify-between border-t border-border/80 pt-3">
        <StatusIndicator active={rels.length > 0} />
        <CountBadge count={classIds.length} />
      </div>
      <div className="flex items-start gap-2 text-xs">
        <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div>
          <span className="text-muted-foreground">学科：</span>
          {subjectIds.length ? subjectIds.map((id) => subjectNameById[id] ?? id).join("、") : <em className="not-italic text-muted-foreground/80">未分配</em>}
        </div>
      </div>
      <div className="flex items-start gap-2 text-xs">
        <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div>
          <span className="text-muted-foreground">班级：</span>
          {classIds.length ? classIds.map((id) => classNameById[id] ?? id).join("、") : <em className="not-italic text-muted-foreground/80">未分配</em>}
        </div>
      </div>
      <div className="mt-auto flex gap-2 pt-2">
        <Button size="sm" className="flex-1 gap-1 rounded-lg text-xs font-medium" onClick={() => onConfigure(t.userId)}>
          <Settings2 className="h-3.5 w-3.5" />配置
        </Button>
        {onCopyConfig ? (
          <Button size="sm" variant="outline" className="gap-1 rounded-lg border-border/80 px-2.5 text-xs" onClick={() => onCopyConfig(t.userId)}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
