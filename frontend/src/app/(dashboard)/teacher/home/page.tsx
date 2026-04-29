"use client";

import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@bs-lab/ui";
import { ManagementPageFrame } from "@/components/business/common/ManagementPageFrame";
import {
  ClipboardCheck,
  LayoutDashboard,
  Layers,
  ListChecks,
  Scale,
  Users,
} from "@bs-lab/ui/icons";

import { useDemoRole } from "@/components/layout/demo-role-context";
import { useSessionActor } from "@/hooks/use-session-actor";
import { userRoleLabelZh, UserRole } from "@/types/auth";

export default function TeacherHomePage() {
  const { actor } = useSessionActor();
  const { role, setRole } = useDemoRole();

  const displayName = actor.userName && actor.userName !== "anonymous" ? actor.userName : "教职员工";
  const orgName = actor.orgName ?? "";

  return (
    <ManagementPageFrame
      title={
        <div className="flex flex-wrap items-center gap-2">
          <LayoutDashboard className="size-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">教师工作台</h1>
          {role === UserRole.SUPER_ADMIN ? (
            <div className="ml-auto min-w-[220px]">
              <Select
                defaultValue={UserRole.TEACHER}
                onValueChange={(v) => {
                  const next = v as UserRole;
                  setRole(next);
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="切换工作台角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.STUDENT}>学生工作台</SelectItem>
                  <SelectItem value={UserRole.PARENT}>家长工作台</SelectItem>
                  <SelectItem value={UserRole.TEACHER}>教师工作台</SelectItem>
                  <SelectItem value={UserRole.RESEARCHER}>教研工作台</SelectItem>
                  <SelectItem value={UserRole.SCHOOL_ADMIN}>校级管理员工作台</SelectItem>
                  <SelectItem value={UserRole.DISTRICT_ADMIN}>区级管理员工作台</SelectItem>
                  <SelectItem value={UserRole.SUPER_ADMIN}>超级管理员工作台</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      }
      description={`${displayName}${orgName ? ` · ${orgName}` : ""}`}
      kpis={
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>进行中作业</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums text-muted-foreground">
                —
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">待采集</p>
              <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                <Link href="/teacher/assignments">管理作业任务</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>待我批改</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums text-muted-foreground">
                —
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">待采集</p>
              <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                <Link href="/teacher/reports">打开批改队列</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>待仲裁动态</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums text-muted-foreground">
                —
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">待采集</p>
              <Button variant="outline" size="sm" className="mt-2 w-full" asChild>
                <Link href="/console/social/court">前往社区与法庭</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      }
      cardTitle="快捷概览"
      cardToolbar={null}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-muted-foreground" />
              任教班级
            </CardTitle>
            <CardDescription>组织与班级归属</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">暂无班级数据</p>
            <Button variant="ghost" size="sm" className="w-full px-0" asChild>
              <Link href="/class/home">班级管理</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="size-4 text-muted-foreground" />
              作业完成概览
            </CardTitle>
            <CardDescription>按任务聚合提交进度</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">暂无作业数据</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="outline" asChild>
                <Link href="/teacher/assignments">
                  <ListChecks className="size-4" />
                  作业任务
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/experiment-manage">
                  <Layers className="size-4" />
                  实验课程管理
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/teacher/materials">实验素材</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 border-border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardCheck className="size-4 text-muted-foreground" />
            快捷入口
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/teacher/reports">批改队列</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/teacher/social">
              <Scale className="size-4" />
              社区与法庭
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/experimental-materials">实验材料库</Link>
          </Button>
        </CardContent>
      </Card>
    </ManagementPageFrame>
  );
}
