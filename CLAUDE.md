# CLAUDE.md

本项目以 `AGENTS.md` 为唯一事实来源。开始任何工作前，必须完整阅读：

1. `AGENTS.md`（宪法）
2. `docs/OPEN_QUESTIONS.md`（矛盾与暂定解释）
3. `docs/EXECUTION_PLAN.md`（当前阶段与验收）

最低限度必须遵守：

- **不得读取、打开、预览、OCR 或截图分析任何图片文件**；视觉验收只接受用户文字反馈或 DOM/Canvas 状态断言。
- 不擅自改玩法、数值、范围；阻塞矛盾先问用户。
- 不引入框架/依赖/网络请求，不执行 `git commit`/`git push`。
- 每次改动后运行 `node work/check-all.js`，保持 `outputs/` 可运行。

完整规则、目录结构、架构约定和工作流程见 `AGENTS.md`。

