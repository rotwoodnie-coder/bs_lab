"use client";

import { useState } from "react";

// 硬编码校区数据，跳过所有 API 请求
const SCHOOLS = [
  { id: "school_1", name: "第一校区" },
  { id: "school_2", name: "第二校区" },
];

const LEVELS: Record<string, { id: string; name: string }[]> = {
  school_1: [{ id: "level_1", name: "小学" }],
  school_2: [],
};

const GRADES: Record<string, { id: string; name: string }[]> = {
  level_1: [
    { id: "grade_1", name: "一年级" },
    { id: "grade_2", name: "二年级" },
  ],
  // 学校2无学段，直接年级
  school_2: [
    { id: "grade_7", name: "七年级" },
    { id: "grade_8", name: "八年级" },
  ],
};

const CLASSES: Record<string, { id: string; name: string }[]> = {
  grade_1: [
    { id: "class_1", name: "1班" },
    { id: "class_2", name: "2班" },
  ],
  grade_7: [
    { id: "class_7_1", name: "7年级1班" },
  ],
};

export default function BindChildPage() {
  const [step, setStep] = useState(0);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");

  const steps = ["校区", "学段", "年级", "班级", "学生姓名"];
  
  // 动态计算当前步骤显示的文字
  const currentOptions = () => {
    switch (step) {
      case 0: return SCHOOLS;
      case 1: return schoolId ? (LEVELS[schoolId] || []) : [];
      case 2: {
        if (levelId) return GRADES[levelId] || [];
        if (schoolId && !levelId) return GRADES[schoolId] || []; // 无学段直接年级
        return [];
      }
      case 3: return gradeId ? (CLASSES[gradeId] || []) : [];
      default: return [];
    }
  };

  const handleSelect = (id: string, name?: string) => {
    if (step === 0) setSchoolId(id);
    else if (step === 1) setLevelId(id);
    else if (step === 2) setGradeId(id);
    else if (step === 3) setClassId(id);
    
    // 动态跳转：如果该学校无学段，跳过学段步骤
    if (step === 0) {
      const levels = LEVELS[id] || [];
      if (levels.length === 0) {
        setLevelId(null);
        setStep(2); // 直接到年级
        return;
      }
    }
    
    // 年级选完自动到班级
    if (step === 2) {
      const classes = CLASSES[id] || [];
      if (classes.length === 0) {
        alert("该年级无班级数据");
        return;
      }
    }

    setStep(prev => prev + 1);
  };

  const handleSubmit = () => {
    if (!studentName.trim()) {
      alert("请输入学生姓名");
      return;
    }
    const payload = btoa(JSON.stringify({ role_id: "role_parent", has_binding: true }));
    document.cookie = `v2_access_token=${payload}.mock-signature; path=/; max-age=3600`;
    document.cookie = "bs_has_binding=1; path=/; max-age=3600";
    window.location.href = "/m";
  };

  const options = currentOptions();

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>绑定孩子</h2>
      <p>步骤 {step + 1} / {steps.length}：选择{steps[step]}</p>
      
      {step < 4 ? (
        <div>
          {options.length === 0 ? (
            <p>无可用选项，自动跳过</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {options.map((opt) => (
                <li
                  key={opt.id}
                  onClick={() => handleSelect(opt.id, opt.name)}
                  style={{
                    padding: "12px",
                    margin: "8px 0",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "8px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {opt.name}
                </li>
              ))}
            </ul>
          )}
          {options.length === 0 && (
            <button onClick={() => setStep(prev => prev + 1)}>跳过</button>
          )}
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="请输入学生姓名"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
          />
          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            提交绑定
          </button>
        </div>
      )}

      {step > 0 && (
        <button
          onClick={() => setStep(prev => prev - 1)}
          style={{ marginTop: "15px", padding: "8px" }}
        >
          上一步
        </button>
      )}
    </div>
  );
}