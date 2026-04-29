export type TextbookRefBook = {
  id: string;
  subjectId: string;
  /** 绑定年级；null 表示不限年级（选树「学科」时仍可见） */
  gradeId: string | null;
  title: string;
  /** 对应表列 `data_coursebook.coursebook_version` */
  coursebookVersion: string | null;
  coverRegistryId: string | null;
  status: 0 | 1;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type TextbookRefChapter = {
  id: string;
  textbookId: string;
  parentId: string | null;
  level: 1 | 2;
  sortOrder: number;
  title: string;
  description: string | null;
  imageRegistryId: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
};
