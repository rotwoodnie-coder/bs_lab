import type { AppViewMode } from "@/config/nav-config";
import { UserRole } from "@/types/auth";

/** 用姓名，后续可对接账户资料 */
const DEMO_DISPLAY_NAME = "张";

/**
 * 模式切换成功后展示的 Sonner 文案（按角色 × 目标模式）。
 */
export function getModeSwitchToastMessage(role: UserRole, mode: AppViewMode): string {
  if (mode === "portal") {
    switch (role) {
      case UserRole.STUDENT:
        return "开启今日科学探索之旅";
      case UserRole.PARENT:
        return "已切换至家庭学习门户，可随时查看孩子进度";
      case UserRole.TEACHER:
        return "已进入门户视图：实验库与实验工坊已就绪";
      case UserRole.RESEARCHER:
        return "已进入门户视图：浏览资源与成长数据";
      case UserRole.SCHOOL_ADMIN:
      case UserRole.DISTRICT_ADMIN:
      case UserRole.SUPER_ADMIN:
        return "已进入门户视图";
      default:
        return "已切换至门户视图";
    }
  }

  switch (role) {
    case UserRole.TEACHER:
      return `欢迎回来，${DEMO_DISPLAY_NAME}老师。已加载工作台视图`;
    case UserRole.RESEARCHER:
      return `${DEMO_DISPLAY_NAME}教研员，资源评审与全区看板已就绪`;
    case UserRole.STUDENT:
      return `${DEMO_DISPLAY_NAME}同学，学习任务与班级入口已展开`;
    case UserRole.PARENT:
      return "已切换至管理视图：孩子进度与报告一览更易查找";
    case UserRole.SCHOOL_ADMIN:
      return "学校管理视图已就绪：教学数据与组织架构入口已展开";
    case UserRole.DISTRICT_ADMIN:
      return "区级管理视图已就绪：资源与组织配置入口已展开";
    case UserRole.SUPER_ADMIN:
      return "超级管理视图已就绪：系统级配置入口已展开";
    default:
      return "已切换至管理视图";
  }
}
