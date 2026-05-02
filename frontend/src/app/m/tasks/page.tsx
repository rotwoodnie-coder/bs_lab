import Link from "next/link";

const TODO_TASKS = [
  {
    id: "demo",
    title: "彩虹液体分层实验作业",
    status: "待完成",
    dueDate: "2026-05-08 20:00",
    tag: "关联视频 + 上传成果",
    desc: "观看视频后完成实验，并提交照片或视频成果。",
    href: "/m/task/demo",
  },
  {
    id: "101",
    title: "气球火箭挑战任务",
    status: "待完成",
    dueDate: "2026-05-10 18:00",
    tag: "需要记录数据",
    desc: "完成气球火箭实验，记录飞行距离并上传。",
    href: "/m/task/101",
  },
];

const DONE_TASKS = [
  {
    id: "done-1",
    title: "会转的纸风车",
    status: "已完成",
    dueDate: "2026-04-28",
    tag: "已提交",
    desc: "已上传实验成品图，等待老师点评。",
    href: "/m/task/demo",
  },
  {
    id: "done-2",
    title: "自制简易温度计",
    status: "已完成",
    dueDate: "2026-04-21",
    tag: "已批阅",
    desc: "作品已通过审核，获得 10 积分。",
    href: "/m/task/101",
  },
];

function TaskCard({ item }: { item: typeof TODO_TASKS[number] }) {
  return (
    <Link href={item.href} className="block rounded-[28px] bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-extrabold text-slate-900">{item.title}</div>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">{item.status}</span>
      </div>
      <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{item.tag}</span>
        <span>截止：{item.dueDate}</span>
      </div>
    </Link>
  );
}

export default function MobileTasksPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-8">
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">作业列表</div>
        <h1 className="mt-2 text-2xl font-black text-slate-900">待完成与已完成作业</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">全部为静态写死数据，便于移动端闭环壳页预览。</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">待完成</h2>
          <span className="text-xs text-slate-400">{TODO_TASKS.length} 项</span>
        </div>
        <div className="space-y-3">
          {TODO_TASKS.map((item) => <TaskCard key={item.id} item={item} />)}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">已完成</h2>
          <span className="text-xs text-slate-400">{DONE_TASKS.length} 项</span>
        </div>
        <div className="space-y-3">
          {DONE_TASKS.map((item) => (
            <Link key={item.id} href={item.href} className="block rounded-[28px] bg-white p-5 shadow-sm transition hover:-translate-y-0.5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-lg font-extrabold text-slate-900">{item.title}</div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{item.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <span>{item.tag}</span>
                <span>完成于：{item.dueDate}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
