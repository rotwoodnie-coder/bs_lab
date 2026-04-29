import { redirect } from "next/navigation";

/** 旧「实验配置」路径已弃用；实验课程请在教师「实验课程管理」编辑页维护。 */
export default function LegacyExperimentConfigRedirect() {
  redirect("/teacher/experiment-editor");
}
