/** 教材参考 API 与基线 `data_coursebook*` 映射后的行形态（供 mapBookRow / mapChapterRow 使用）。 */

export type TextbookRefBookRow = {
  id: string;
  subject_id: string;
  grade_id: string | null;
  title: string;
  coursebook_version: string | null;
  cover_registry_id: number | null;
  status: number;
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
};

export type TextbookRefChapterRow = {
  id: string;
  textbook_id: string;
  parent_id: string | null;
  level: number;
  sort_order: number;
  title: string;
  description: string | null;
  image_registry_id: number | null;
  row_version: number;
  created_at: Date | string;
  updated_at: Date | string;
};
