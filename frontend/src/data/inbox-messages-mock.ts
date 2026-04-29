import type { InboxMessage } from "@/types/inbox-message";

/**
 * 全量数据；页面侧按当前角色名过滤 receiver.name。
 */
export const INBOX_MESSAGES_SEED: readonly InboxMessage[] = [
  {
    id: "msg-001",
    sender: { name: "实验教学平台", subtitle: "系统" },
    receiver: { name: "教师" },
    summary: "本周六 22:00–24:00 例行维护，提交入口将短暂关闭",
    content:
      "尊敬的老师：\n\n本周六 22:00–24:00 平台进行例行维护，期间实验提交与报告上传入口将短暂关闭，请您提前安排学生提交。\n\n实验教学平台",
    isRead: false,
    category: "system",
    sentAtLabel: "今天 09:12",
  },
  {
    id: "msg-002",
    sender: { name: "教研组·李芳", subtitle: "任务" },
    receiver: { name: "教师" },
    summary: "请在本周五前完成「光的折射」实验课例评审表",
    content:
      "您好，区本课例征集进行中，请在本周五 17:00 前在评审入口填写《光的折射》实验课例表并上传课堂实录片段（≤8 分钟）。\n\n如有问题请联系教研组。",
    isRead: false,
    category: "task",
    sentAtLabel: "昨天 16:40",
  },
  {
    id: "msg-003",
    sender: { name: "王同学", subtitle: "四年级(3)班" },
    receiver: { name: "教师" },
    summary: "老师好，上周观察记录想再核对一下",
    content:
      "老师您好：\n\n我在整理上周「水的三态变化」观察记录时对时间点标注有点不确定，能否在答疑课再一次记录方法？谢谢老师！\n\n王同学",
    isRead: true,
    category: "social",
    sentAtLabel: "周一 20:05",
  },
  {
    id: "msg-004",
    sender: { name: "作业系统", subtitle: "作业" },
    receiver: { name: "教师" },
    summary: "「水的三态变化」作业已提交 32 份，3 份待批改",
    content:
      "班级作业提醒：「水的三态变化」预习与实验记录已收到 32 份提交，其中 3 份待您批改。您可在作业看板中批量处理。\n\n（本消息为数据）",
    isRead: false,
    category: "homework",
    sentAtLabel: "今天 07:58",
  },
  {
    id: "msg-005",
    sender: { name: "实验教学平台", subtitle: "系统" },
    receiver: { name: "学生" },
    summary: "你的实验报告已通过自动查重，可继续提交终稿",
    content:
      "同学你好：\n\n你的实验报告已通过查重检测，未发现高风险重复。请在截止日期前提交终稿版本。\n\n祝学习顺利！",
    isRead: true,
    category: "system",
    sentAtLabel: "上周三 11:22",
  },
  {
    id: "msg-006",
    sender: { name: "张老师", subtitle: "科学备课组" },
    receiver: { name: "学生" },
    summary: "下周实验课请提前预习「小电路」安全须知",
    content:
      "各位同学：\n\n下周实验课内容为搭建小电路点亮小灯泡，请务必提前阅读安全须知，保持桌面干燥，操作电池不要短路。课代表会发放预习单。\n\n张老师",
    isRead: false,
    category: "task",
    sentAtLabel: "今天 14:30",
  },
  {
    id: "msg-007",
    sender: { name: "学生", subtitle: "四年级(3)班" },
    receiver: { name: "学生" },
    summary: "（）发给自己的备忘：记得带实验册",
    content: "明天带实验册和笔，小组分工已写在班群里。",
    isRead: true,
    category: "social",
    sentAtLabel: "昨天 21:10",
  },
  {
    id: "msg-008",
    sender: { name: "作业系统", subtitle: "作业" },
    receiver: { name: "学生" },
    summary: "「水的三态变化」作业即将截止，还剩 1 天",
    content:
      "提醒：作业「水的三态变化」将在明天 23:59 截止，请尚未提交的同学尽快完成。\n\n（数据）",
    isRead: false,
    category: "homework",
    sentAtLabel: "今天 08:00",
  },
  {
    id: "msg-009",
    sender: { name: "区教研室", subtitle: "系统" },
    receiver: { name: "教研员" },
    summary: "本月课例征集评审日程已发布",
    content:
      "各位教研员：\n\n本月课例征集评审日程已在共享文档更新，请查收并确认本人场次。如有冲突请本周内联系秘书处。\n\n（数据）",
    isRead: false,
    category: "system",
    sentAtLabel: "今天 10:00",
  },
  {
    id: "msg-010",
    sender: { name: "任务中心", subtitle: "任务" },
    receiver: { name: "教研员" },
    summary: "请完成 3 份「实验安全」抽检记录",
    content:
      "根据学期安排，请您在月底前完成 3 份实验安全课堂抽检记录表，入口：工作台 → 实验评审。\n\n（数据）",
    isRead: true,
    category: "task",
    sentAtLabel: "上周五",
  },
  {
    id: "msg-011",
    sender: { name: "家校通", subtitle: "系统" },
    receiver: { name: "家长" },
    summary: "您孩子的实验报告已批改，可查看评语",
    content:
      "家长您好：\n\n您孩子本周提交的实验报告已由任课教师批改，您可在「成长足迹」中查看评语与得分。\n\n（数据）",
    isRead: false,
    category: "system",
    sentAtLabel: "昨天 19:15",
  },
  {
    id: "msg-012",
    sender: { name: "校级管理员", subtitle: "社交" },
    receiver: { name: "校管" },
    summary: "下周会议室预约已确认：教研室周例会",
    content:
      "您好，下周三 15:00 教研室周例会场地已预约完成，如需投影请提前联系电教。\n\n（数据）",
    isRead: true,
    category: "social",
    sentAtLabel: "周一",
  },
  {
    id: "msg-013",
    sender: { name: "区教育局", subtitle: "系统" },
    receiver: { name: "区管" },
    summary: "全区实验开出率周报已生成",
    content:
      "本周全区实验开出率统计已生成，请登录数据看板查看明细与预警学校名单。\n\n（数据）",
    isRead: false,
    category: "system",
    sentAtLabel: "今天 08:30",
  },
  {
    id: "msg-014",
    sender: { name: "运维机器人", subtitle: "系统" },
    receiver: { name: "超管" },
    summary: "沙箱环境部署成功，可开始联调",
    content:
      "超级管理员您好：\n\n沙箱已部署至最新构建，环境变量与密钥已同步至运维面板。\n\n（数据）",
    isRead: true,
    category: "system",
    sentAtLabel: "昨天",
  },
];
