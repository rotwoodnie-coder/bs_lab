"use client";

import { useMemo, useState } from "react";
import { MobileCard } from "@/components/mobile/MobileCard";

const EXPERIMENTS = [
  { id: "exp_wind", name: "风力实验：自制风向标" },
  { id: "exp_light", name: "光学实验：彩虹投影" },
  { id: "exp_circuit", name: "电路实验：简易串联灯" },
];

const CLASSES = [
  { id: "class_3_1", name: "三年级一班" },
  { id: "class_3_2", name: "三年级二班" },
  { id: "class_4_1", name: "四年级一班" },
  { id: "class_4_2", name: "四年级二班" },
];

export default function AssignPage() {
  const [experimentId, setExperimentId] = useState(EXPERIMENTS[0]?.id ?? "");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([CLASSES[0]?.id ?? ""]);
  const [dueDate, setDueDate] = useState("2026-05-10");
  const [remark, setRemark] = useState("");
  const [message, setMessage] = useState("");

  const selectedExperiment = useMemo(
    () => EXPERIMENTS.find((item) => item.id === experimentId) ?? EXPERIMENTS[0],
    [experimentId],
  );

  const toggleClass = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId],
    );
  };

  const handlePublish = () => {
    if (!selectedExperiment || selectedClassIds.length === 0 || !dueDate) {
      setMessage("请先完成实验、班级和截止日期设置");
      return;
    }

    setMessage("发布成功");
  };

  return (
    <div className="space-y-4 p-4 md:pb-4">
      <MobileCard title="发布作业" subtitle="静态数据优先，快速布置实验任务">
        <div className="space-y-4 text-sm">
          <div>
            <div className="mb-2 font-medium">选择实验</div>
            <div className="grid gap-2">
              {EXPERIMENTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setExperimentId(item.id)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-left transition",
                    experimentId === item.id ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                  ].join(" ")}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-medium">关联班级</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {CLASSES.map((item) => {
                const checked = selectedClassIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleClass(item.id)}
                    className={[
                      "rounded-2xl border px-4 py-3 text-left transition",
                      checked ? "border-primary bg-primary/5" : "hover:bg-muted/40",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{item.name}</span>
                      <span className="text-xs text-muted-foreground">{checked ? "已选" : "可选"}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-medium" htmlFor="dueDate">截止日期</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-2xl border bg-background px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium" htmlFor="remark">备注说明</label>
            <textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              placeholder="可补充提交要求、材料准备说明等"
              className="w-full rounded-2xl border bg-background px-4 py-3"
            />
          </div>

          <div className="rounded-2xl bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            当前选择：{selectedExperiment?.name ?? "未选择"} · {selectedClassIds.length} 个班级 · 截止 {dueDate}
          </div>

          <button
            type="button"
            onClick={handlePublish}
            className="w-full rounded-2xl bg-primary px-4 py-3 font-medium text-primary-foreground"
          >
            发布
          </button>

          {message ? <div className="text-center text-sm font-medium text-emerald-600">{message}</div> : null}
        </div>
      </MobileCard>
    </div>
  );
}
