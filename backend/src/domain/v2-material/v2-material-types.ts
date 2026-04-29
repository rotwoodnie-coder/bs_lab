/**
 * V2 材料库模块类型定义
 * 对应表：material_msg / material_pic / material_security
 */

export interface MaterialTypeRecord {
  materialTypeId: string;
  materialTypeName: string;
}

export interface MaterialUnitRecord {
  materialUnitId: string;
  materialUnitName: string;
}

export interface MaterialMsgRecord {
  materialId: string;
  materialName: string;
  materialPropId: string | null;
  materialTypeId: string | null;
  materialTypeName?: string | null;
  materialUnitId?: string | null;
  materialUnitName?: string | null;
  materialNum: number | string | null;
  mainPicUrl: string | null;
  expPurpose: string | null;
  additionalComments: string | null;
  comments: string | null;
  status: string | null;
  ownerUserId: string | null;
  createUserId: string | null;
  createTime: string | null;
  updateUserId: string | null;
  updateTime: string | null;
  isDeleted: 0 | 1;
  pics?: MaterialPicRecord[];
  securities?: MaterialSecurityRecord[];
}

export interface MaterialPicRecord {
  seqId: string;
  materialId: string;
  materialUrl: string | null;
  sortOrder: number | null;
  createTime: string | null;
}

export interface MaterialSecurityRecord {
  seqId: string;
  materialId: string;
  securityId: string;
  sortOrder: number | null;
  createTime: string | null;
}

export interface CreateMaterialInput {
  materialId?: string;
  materialName: string;
  materialPropId?: string | null;
  materialTypeId?: string | null;
  materialUnitId?: string | null;
  materialNum?: number | string | null;
  mainPicUrl?: string | null;
  expPurpose?: string | null;
  additionalComments?: string | null;
  comments?: string | null;
  status?: string | null;
  picUrls?: string[];
  securityIds?: string[];
  ownerUserId?: string | null;
}

export type UpdateMaterialInput = Partial<CreateMaterialInput> & {
  materialId?: string;
};

export type MaterialListQuery = {
  keyword?: string;
  materialTypeId?: string;
  materialPropId?: string;
  status?: string;
  createUserId?: string;
  page?: number;
  pageSize?: number;
};

export type MaterialListPage = {
  items: MaterialMsgRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export type SaveMaterialInput = CreateMaterialInput & {
  materialId?: string;
};
