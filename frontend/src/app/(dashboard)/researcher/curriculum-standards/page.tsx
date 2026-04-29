import { redirect } from "next/navigation";

/** 历史路由：试验列表已合并为控制台的「标准实验目录」。 */
export default function CurriculumStandardsRedirectPage() {
  redirect("/console/settings/experiments");
}
