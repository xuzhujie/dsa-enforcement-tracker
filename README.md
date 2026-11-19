# DSA Enforcement Tracker · DSA 执法追踪器

一个双语（中文 / English）、官方来源优先的欧盟《数字服务法》（DSA）执法跟踪器。产品结构参考同目录旁的 DMA enforcement tracker：顶部数据摘要、筛选、驾驶舱、案件卡片、时间线、图表、自动动态、主体名单、规则速览和官方来源目录。

## What it tracks · 跟踪范围

- European Commission DSA enforcement and news
- Digital Services Coordinators（DSC）及成员国监管路径
- EUR-Lex 法律正文与条款映射
- CURIA / CJEU 司法复核和案件进展
- RFI、正式程序、初步认定、承诺、决定、罚款、临时措施和整改跟踪
- VLOP / VLOSE 标识、罚款、owner、next action、deadline 与证据来源
- 监管日历，以及按当前筛选结果导出 Markdown / JSON / CSV

界面内的案件主数据是人工可核验的静态登记簿；官方动态由 `public/data/updates.json` 提供，并可由 GitHub Actions 每日刷新。动态抓取不会自动改写案件状态，避免新闻噪声直接变成案件事实。

## Data model · 数据对象

当前前端用 TypeScript 数据模型表达以下对象，后续可平移到 SQLite / Postgres：

`enforcement_cases` · `case_events` · `legal_basis` · `entities/platforms` · `regulators` · `remedies_measures` · `fines` · `compliance_actions` · `sources` · `review_logs` · `monitor_runs`

案件字段覆盖：`case_id`、主体 / 平台、国家 / 主管机关、VLOP/VLOSE、DSA 条款、案件类型、首次日期、最新进展日期、当前状态、潜在 / 实际罚款、核心事实、业务影响、风险等级、owner、next_action、deadline、source_url、source_type、evidence_snapshot、last_verified_at。

## Run locally · 本地运行

```bash
npm install
npm run dev
```

其他常用命令：

```bash
npm run build       # TypeScript 检查并生成 dist
npm test            # 数据派生指标与双语金额格式测试
npm run lint        # TypeScript 项目检查
python scripts/check_updates.py
```

打开页面后，右上角可以切换 `中文 / EN`；语言选择会保存在浏览器本地。筛选器支持案件类型、平台和 DSA 条款，案件详情可展开查看要点、业务影响、owner / next action 和官方来源。
筛选栏右侧的 Markdown、JSON、CSV 按钮会导出当前筛选视图；监管日历用于承接回应窗口、证据复核和 DSC / 欧盟法院检查节点。

## Source policy · 来源策略

默认来源均指向官方域名，且每个案件保存 source link。`updates.json` 的抓取器只负责官方动态 feed；案件合并、去重、状态变化和证据快照应在人工复核后写入主数据。生产化接入数据库时，建议使用：

1. `source_url + published_at + source_hash` 去重；
2. `case_id` 与 `case_events` 分离，避免整改动作和原始案件重复计数；
3. 每次状态变化写入 `review_logs`，记录 reviewer、verified_at 和 evidence_snapshot；
4. 将 `last_verified_at` 与抓取运行 `monitor_runs` 分开保存。

## Project layout · 项目结构

```text
src/data/cases.ts          # 双语案件、主体、规则和官方来源登记簿
src/data/dashboardMetrics.ts
src/App.tsx                # 页面信息架构、筛选和双语切换
public/data/updates.json   # 官方动态 feed
scripts/check_updates.py   # 官方 RSS 监测器
tests/metrics.test.ts      # 数据派生指标测试
.github/workflows/         # 每日监测工作流
```

本项目是研究和合规运营辅助工具，不构成法律意见；案件状态和法律结论应以最新官方原文为准。
