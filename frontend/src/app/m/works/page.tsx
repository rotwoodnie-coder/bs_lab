import Link from "next/link";

const WORKS = [
  {
    id: "w1",
    title: "彩虹液体分层",
    student: "小明",
    status: "已提交",
    desc: "上传了 3 张步骤图和 1 段说明视频。",
    updatedAt: "2026-05-01 19:30",
  },
  {
    id: "w2",
    title: "气球火箭",
    student: "小红",
    status: "已批阅",
    desc: "完成实验并记录了 12 米的飞行距离。",
    updatedAt: "2026-04-29 16:10",
  },
  {
    id: "w3",
    title: "会转的纸风车",
    student: "小刚",
    status: "展示中",
    desc: "作品被选入班级作品墙，获得 20 积分。",
    updatedAt: "2026-04-25 09:00",
  },
];

export default function MobileWorksPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-8">
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">作品展示</div>
        <h1 className="mt-2 text-2xl font-black text-slate-900">学生提交的作品列表</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">展示已提交成果、批阅状态和最近更新时间。</p>
      </div>

      <div className="space-y-3">
        {WORKS.map((work) => (
          <Link key={work.id} href={`/m/task/${work.id === "w2" ? "101" : "demo"}`} className="block rounded-[28px] bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">{work.title}</div>
                <div className="mt-1 text-xs text-slate-400">提交者：{work.student}</div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{work.status}</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">{work.desc}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
              <span>更新时间：{work.updatedAt}</span>
              <span>查看详情</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
