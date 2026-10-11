# 心理状态图像问卷

打开 `index.html` 即可预览。页面使用用户提供的高清三行五列参考图裁切生成 `assets/choice-01.png` 至 `assets/choice-15.png` 共 15 张 PNG；每张裁图保留原图中的方框和人物比例，第三题最后一项保留人物越出方框的原始效果。三行分别对应愉悦度、激动度和主导感题目，选项由左至右记录 1–5，选项下方不显示分数。

## 已实现

- 被试编号输入与三题必填校验
- 15 张无外框矢量线稿选项，适配桌面端和移动端
- 本机记录保存、记录表、CSV 导出
- A/B 两组选择、总分均值、题目均值和差异比较
- “未诊断性测量”提示，避免把图像选择直接表述为临床结论

## Supabase 数据接入

Supabase 项目 `rhsmtjilhddvoqzdjxvk` 已准备好 `survey_responses` 表、RLS 写入策略和问卷静态资源。问卷 HTML 可以通过 Edge Function 取得，但 Supabase 的公开 Storage 和 Edge Function URL 都将 HTML 响应作为 `text/plain` 返回；Edge Function 还附加了禁止脚本运行的 sandbox CSP。因此当前函数地址不能作为可用的问卷网页，直接打开会显示源码。

函数测试面板返回状态 200 和 HTML 内容不代表浏览器会把它解析成网页。因此正式网页由 GitHub Pages 提供，Supabase 继续作为数据后端；其他设备通过 GitHub Pages 地址打开后，提交会写入 Supabase。

本地双击打开 `index.html` 时使用本机演示存储；在支持 HTML 的 HTTP/HTTPS 静态站点打开时，表单才会将提交写入 Supabase。正式使用前应先用无敏感信息的测试编号验证提交链路。

## Supabase 数据表

字段为：`participant_code`、`q1_score`、`q2_score`、`q3_score`、`total_score`、`submitted_at`。RLS 已开启，只允许公开 anon 客户端新增记录，不能读取、修改或删除其他人的回答。

## 云端记录查看

问卷提交会写入 Supabase 的 `survey_responses` 表。为避免公开暴露被试记录，当前 RLS 只允许匿名客户端新增，网页上的记录表和 CSV 导出仍是本机演示记录；跨设备收集到的云端数据请在 Supabase Table Editor 或 SQL Editor 中查看、筛选和导出。

## CSV 导出

点击“导出 CSV”会导出当前设备记录表中的记录，字段为：被试编号、提交时间、Q1、Q2、Q3、总分。文件使用 UTF-8 BOM，适合直接用 Excel 打开。跨设备收集的云端数据请从 Supabase 管理后台导出。
