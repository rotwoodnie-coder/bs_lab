"use client";

import { useState } from "react";

export default function MobileUploadPage() {
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<{ image: boolean; video: boolean }>({ image: false, video: false });

  const handleSubmit = () => {
    setMessage("上传成功");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-8">
      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">成果上传</div>
        <h1 className="mt-2 text-2xl font-black text-slate-900">提交实验作品</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">支持图片或视频的静态选择区，这里仅模拟上传，不会调用任何接口。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={() => setSelected((current) => ({ ...current, image: !current.image }))}
          className={`rounded-[28px] border-2 border-dashed p-6 text-left transition ${selected.image ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white"}`}
        >
          <div className="text-lg font-extrabold text-slate-900">选择图片</div>
          <p className="mt-2 text-sm text-slate-500">点击模拟上传实验照片、过程图或结果图。</p>
          <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{selected.image ? "已选择 1 张图片" : "未选择图片"}</div>
        </button>

        <button
          type="button"
          onClick={() => setSelected((current) => ({ ...current, video: !current.video }))}
          className={`rounded-[28px] border-2 border-dashed p-6 text-left transition ${selected.video ? "border-orange-400 bg-orange-50" : "border-slate-200 bg-white"}`}
        >
          <div className="text-lg font-extrabold text-slate-900">选择视频</div>
          <p className="mt-2 text-sm text-slate-500">点击模拟上传 30 秒以内的短视频成果。</p>
          <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">{selected.video ? "已选择 1 段视频" : "未选择视频"}</div>
        </button>
      </div>

      <div className="rounded-[28px] bg-white p-5 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">提交前检查</div>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li className="rounded-2xl bg-slate-50 px-4 py-3">• 确认图片/视频内容清晰</li>
          <li className="rounded-2xl bg-slate-50 px-4 py-3">• 可补充实验说明或观察结果</li>
          <li className="rounded-2xl bg-slate-50 px-4 py-3">• 支持家长代交的静态展示</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="w-full rounded-full bg-slate-900 px-5 py-4 text-sm font-black text-white shadow-sm"
      >
        提交成果
      </button>

      {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">{message}</div> : null}
    </div>
  );
}
