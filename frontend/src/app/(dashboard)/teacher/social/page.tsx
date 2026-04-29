import Link from "next/link";
import { ArrowRight, BookMarked, Scale } from "@bs-lab/ui/icons";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@bs-lab/ui";

import { DASHBOARD_MAIN_CONTAINER_CLASS } from "@/lib/layout-container-classes";

/**
 * 教师 · 社区与法庭「双入口」枢纽：便于完成「断案」与「发现优秀做法」两条心智。
 * 小法庭仍与运营共用 `/console/social/court`；优秀案例库指向实验圈动态。
 */
export default function TeacherSocialHubPage() {
  return (
    <div className={`${DASHBOARD_MAIN_CONTAINER_CLASS} flex flex-col gap-6`}>
      <Card className="border-border shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="size-5 text-muted-foreground" />
            社区与教研
          </CardTitle>
          <CardDescription>
            进入小法庭处理争议与平局终裁；到优秀案例库浏览实验圈中高互动作品，发掘学生亮点。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Scale className="size-5 text-muted-foreground" />
                  小法庭
                </CardTitle>
                <CardDescription>与运营中心共用案件列表；教师侧重仲裁与协查。</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" className="gap-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90">
                  <Link href="/console/social/court">
                    进入小法庭
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookMarked className="size-5 text-muted-foreground" />
                  优秀案例库
                </CardTitle>
                <CardDescription>
                  从实验圈动态中筛选高点赞、高完成度的做法；运营可将甄选结果同步到门户「实验圈」展示。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" size="sm" className="gap-1.5 rounded-lg">
                  <Link href="/console/social/dynamics">
                    打开实验圈动态
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
