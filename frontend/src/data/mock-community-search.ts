/**
 * 全局搜索（⌘K）种子数据：已清理 Mock。
 * 真实搜索数据应由后端 API 提供。
 */
export type MockSearchUser = {
  id: string;
  displayName: string;
  /** 检索用关键词 */
  keywords: string;
  href: string;
};

export type MockSearchTopic = {
  id: string;
  tag: string;
  description: string;
  href: string;
};

export const MOCK_SEARCH_USERS: MockSearchUser[] = [];

export const MOCK_SEARCH_TOPICS: MockSearchTopic[] = [];
