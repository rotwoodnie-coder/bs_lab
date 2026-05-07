-- ─────────────────────────────────────────────────────────────
-- Migration 0007: 为现有 3 个实验补充 exp_pic 封面图片
--
-- 数据来源：MinIO 中已有的视频封面缩略图和用户上传图片
-- 执行方式：mysql -h10.0.181.204 -P13306 -uroot -p bs_exp_data < 0007_fill_exp_pic_covers.sql
-- ─────────────────────────────────────────────────────────────

-- 实验 1：观察水的特点 → 使用"梁文怡老师-观察水的特点.mp4"的视频封面缩略图
-- seq_id 可读生成：cov_ + exp_id 前缀，保证 32 字符以内
INSERT IGNORE INTO exp_pic (seq_id, pic_url, exp_id, sort_order, file_id) VALUES
(
  'cov_lgy_tedian_thumb_yuanfei',
  'v2/yuan_fei_y_u_a_n_f_e_i/thumb/liang_wen_yi_lao_shi_guan_c_39b0-e663a1d9.jpg',
  'wei_ming_ming_shi_yan_2397',
  1,
  'liang_wen_yi_lao_shi_guan_c_357b'
);

-- 实验 2：测量肺活量、脉搏 → 使用 liangwenyi 上传的微信图片（唯一可用图片）
INSERT IGNORE INTO exp_pic (seq_id, pic_url, exp_id, sort_order, file_id) VALUES
(
  'cov_feilang_maibo_weixin_pic',
  'v2/liangwenyi_liangwenyi/8ee34a88-213f-4791-a2a6-0dbb9722b5cf.jpg',
  'wei_ming_ming_shi_yan_008a',
  1,
  'wei_xin_tu_pian_2_0_2_6_0_5'
);

-- 实验 3：校本拓展 · 单摆与计时 → 与实验 1 共享同一视频封面缩略图
-- 该实验的 exp_video 已关联同一视频（liang_wen_yi_lao_shi_guan_c_39b0）
INSERT IGNORE INTO exp_pic (seq_id, pic_url, exp_id, sort_order, file_id) VALUES
(
  'cov_danbai_jishi_thumb_yuanfei',
  'v2/yuan_fei_y_u_a_n_f_e_i/thumb/liang_wen_yi_lao_shi_guan_c_39b0-e663a1d9.jpg',
  'wei_ming_ming_shi_yan_9256',
  1,
  'liang_wen_yi_lao_shi_guan_c_357b'
);
