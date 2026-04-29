# 实验材料共享权限模型

## 1. 目标

- 支持以下共享场景：
  - 同课题组老师共享
  - 同学校共享
  - 同班级共享
  - 角色共享与用户定向共享

## 2. 数据模型

表：`edu_experimental_material_scopes`

- `material_id`：授权对象
- `subject_type`：主体类型
- `subject_key`：主体标识
- `permission_mask`：权限掩码
- `expires_at`：可选过期时间

## 3. 主体类型建议

- `ORG`：组织
- `SCHOOL`：学校
- `CLASS`：班级
- `GROUP`：课题组
- `ROLE`：角色
- `USER`：用户
- `EXTERNAL`：外部主体

## 4. 权限掩码建议

- `1`：查看
- `2`：编辑
- `4`：管理
- `8`：分享

可组合，例如 `3` 表示查看+编辑。

## 5. 授权判定规则

1. 解析当前请求主体集合（USER/ROLE/ORG/SCHOOL/CLASS/GROUP）。
2. 查询 scope 表命中任一主体。
3. 检查 `expires_at` 未过期。
4. 校验 `permission_mask` 是否满足动作权限。

## 6. 与媒体权限关系

建议采用“交集策略”：

- 材料可见：需满足材料 scope。
- 资源可访问：需同时满足材料 scope 与媒体 scope。
- 若媒体更严格，按媒体权限执行。

## 7. 审计建议

- 授权操作记录 `created_by_actor_id`。
- 高权限变更（管理、分享）建议保留审计日志。
