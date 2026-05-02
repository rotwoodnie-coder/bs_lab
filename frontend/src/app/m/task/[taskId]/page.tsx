"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

const TASKS: Record<string, {
  title: string;
  status: string;
  dueDate: string;
  teacher: string;
  summary: string;
  video: { id: string; title: string; duration: string };
  requirements: string[];
  steps: string[];
}> = {
  demo: {
    title: "彩虹液体分层实验作业",
    status: "待完成",
    dueDate: "2026-05-08 20:00",
    teacher: "李老师",
    summary: "观看实验视频，完成步骤操作并上传成果照片或短视频。",
    video: { id: "1", title: "安全实验：彩虹液体分层", duration: "2 分钟" },
    requirements: ["至少上传 1 张步骤照片", "可附 1 段 30 秒以内视频", "需写明实验名称和观察结果"],
    steps: ["观看关联视频", "准备材料并完成实验", "整理成果后提交"],
  },
  "101": {
    title: "气球火箭挑战任务",
    status: "已发布",
    dueDate: "2026-05-10 18:00",
    teacher: "王老师",
    summary: "结合课堂演示完成一次气球火箭实验，记录距离变化。",
    video: { id: "2", title: "科学实验：气球火箭", duration: "2 分钟" },
    requirements: ["上传实验成品图", "记录一次测量数据", "建议附上简短说明"],
    steps: ["查看视频步骤", "完成实验记录", "上传作品"],
  },
};

export default function MobileTaskDetailPage() {
  const params = useParams<{ taskId: string }>();
  const taskId = params?.taskId ?? "demo";
  const task = TASKS[taskId] ?? TASKS.demo;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-8">
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">作业任务详情</div>
        <h1 className="mt-2 text-2xl font-black text-slate-900">{task.title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">{task.summary}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-400">状态</div>
            <div className="mt-1 font-semibold text-slate-900">{task.status}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="text-xs text-slate-400">截止时间</div>
            <div className="mt-1 font-semibold text-slate-900">{task.dueDate}</div>
          </div>
        </div>
        <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          指导老师：{task.teacher}
        </div>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">关联视频入口</div>
            <div className="mt-1 text-lg font-extrabold text-slate-900">{task.video.title}</div>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{task.video.duration}</div>
        </div>
        <Link href={`/m/video/${task.video.id}`} className="mt-4 block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white">
          去观看视频并开始任务
        </Link>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">提交要求</div>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {task.requirements.map((item) => (
            <li key={item} className="rounded-2xl bg-slate-50 px-4 py-3">• {item}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">完成步骤</div>
        <ol className="mt-3 space-y-2 text-sm text-slate-700">
          {task.steps.map((item, index) => (
            <li key={item} className="rounded-2xl border px-4 py-3">
              <span className="mr-2 font-bold text-orange-500">0{index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
      </div>

      <Link href="/m/upload" className="block rounded-full bg-orange-500 px-5 py-4 text-center text-sm font-black text-white shadow-sm">
        进入成果上传
      </Link>
    </div>
  );
}
