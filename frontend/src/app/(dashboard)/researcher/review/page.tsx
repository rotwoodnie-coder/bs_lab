import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 旧路径：课标级实验评审已迁入「运营中心 → 教研与评审」。 */
export default async function LegacyResearcherReviewRedirect({ searchParams }: PageProps) {
  const sp = await searchParams;
  const raw = sp.expId;
  const expId = Array.isArray(raw) ? raw[0] : raw;
  const q = expId ? `?expId=${encodeURIComponent(expId)}` : "";
  redirect(`/console/review/experiments${q}`);
}
