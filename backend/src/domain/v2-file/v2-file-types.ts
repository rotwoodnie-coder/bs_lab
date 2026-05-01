/**
 * V2 文件资源模块类型定义
 * 对应表：data_file / data_file_type
 */

export interface DataFileRecord {
  fileId: string;
  fileName: string;
  /** 库表 `data_file.file_url`：文件访问地址（可为 MinIO 直链、公网 CDN、迁移占位等） */
  fileUrl: string;
  /** `data_file.file_type_id` → `data_file_type.type_id` */
  fileTypeId: string | null;
  /** 联表 `data_file_type.type_name` */
  fileTypeName: string | null;
  /** 联表 `data_file_type.logo_class` */
  fileTypeLogoClass: string | null;
  status: string | null;
  ownerUserId: string | null;
  /** JOIN sys_user.user_nick_name / user_name，上传人真实姓名 */
  ownerUserName: string | null;
  /** JOIN sys_user.user_logo，头像 URL */
  ownerAvatarUrl: string | null;
  /** JOIN data_pref_title.title_name，职称 */
  ownerTitleName: string | null;
  /** JOIN sys_org.org_name，单位名称 */
  ownerOrgName: string | null;
  /** `data_file.logo_url`：封面图 URL（设计文档） */
  logoUrl: string | null;
  fileSize: number | null;
  fileExt: string | null;
  /** 内容 SHA-256(hex)；上传写入，用于全库去重 */
  contentSha256?: string | null;
  /** 父文件ID（自引用），表达从属关系 */
  parentFileId?: string | null;
  /** 关系类型：logo（封面）、transcoded（转码）等 */
  relationType?: string | null;
  /** 封面文件ID（冗余加速） */
  coverFileId?: string | null;
  /** 库表 `create_time`（ISO 8601 或 DATETIME 字符串，由 JSON 序列化决定） */
  createTime?: string | null;
  /** 库表 `update_time` */
  updateTime?: string | null;
}

export interface CreateFileInput {
  /** 可选：显式 `file_id`；缺省由 `fileName` 自动生成。 */
  fileId?: string;
  fileName: string;
  fileUrl: string;
  fileTypeId?: string;
  ownerUserId?: string;
  logoUrl?: string;
  fileSize?: number;
  fileExt?: string;
  /** 父文件ID（自引用），表达从属关系 */
  parentFileId?: string;
  /** 关系类型：logo（封面）、transcoded（转码）等 */
  relationType?: string;
  /** 上传必填：与对象字节一致，用于库内去重 */
  contentSha256: string;
}

export interface UpdateFileInput {
  fileName?: string;
  /** `null` 清空封面列 */
  logoUrl?: string | null;
  fileTypeId?: string;
  status?: string;
}

export type FileListQuery = {
  keyword?: string;
  fileTypeId?: string;
  ownerUserId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export type FileListPage = {
  items: DataFileRecord[];
  total: number;
  page: number;
  pageSize: number;
};
