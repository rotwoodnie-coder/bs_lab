-- ----------------------------
-- Migration 0014: 修复虚拟实验种子数据的 is_deleted 标记
-- 三条记录被错误地标记为 is_deleted = 'y'，导致列表接口无法查询到
-- 正确值应为 'n'（软删除标记：y=已删除, n=未删除）
-- ----------------------------
USE bs_exp_data;

UPDATE virtual_experiment
SET is_deleted = 'n',
    update_user_id = 'system',
    update_time = NOW()
WHERE id IN (
    'gao_lou_de_ding_hai_shen_zhe',
    'sheng_cheng_shi_wu_xiao_hua',
    'wu_shui_jing_hua_guo_lu_shi'
)
AND is_deleted = 'y';

-- 验证修复结果
-- SELECT id, title, is_deleted FROM virtual_experiment WHERE id IN ('gao_lou_de_ding_hai_shen_zhe', 'sheng_cheng_shi_wu_xiao_hua', 'wu_shui_jing_hua_guo_lu_shi');
