import { redirect } from "next/navigation";

/** 旧路由：家庭实验室已迁至 `/parent/lab`（见 `frontend-prd-alignment.md` §8）。 */
export default function ParentChildProgressRedirectPage() {
  redirect("/parent/lab");
}
