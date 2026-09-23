# layergraph

**一份 JSON 规格 → 一段分层 3D 图谱动画（MP4 + GIF 预览 + 封面 PNG + 2D 横带）。**
layergraph 把分层的依赖或流程——供应层级、项目阶段、软件模块——做成一条安静的短片，让其中一条路径逐段亮起，直接放进幻灯片、报告或 README。
层、分组、可选的深度维度、边、*一条会亮起来的高亮路径*、镜头关键帧、中英字幕。three.js 在无头 Chromium 里逐帧渲染，ffmpeg 编码。给人用，也给编码 agent 用（见 [SKILL.md](SKILL.md) 与 [prompts/](prompts/)）。

[English →](README.md) · **Showcase：** *（留空——见 [Showcase](#showcase)）*

| 供应链溯源 · `ivory-gold`（深度维度、子部件、证书） | 项目关键路径 · `ivory-indigo`（平面） | 模块依赖 · `ivory-gold`（测试套件作叶节点） |
|---|---|---|
| ![](examples/supply-chain/render/preview.gif) | ![](examples/critical-path/render/preview.gif) | ![](examples/deps/render/preview.gif) |
| ![](examples/supply-chain/render/contact.png) | ![](examples/critical-path/render/contact.png) | ![](examples/deps/render/contact.png) |

完整视频（1080p MP4，每段约 20 秒）见 [Releases → v1.0.0](https://github.com/pengmengying2025/layergraph/releases/tag/v1.0.0)。

## 它做什么

- **布局来自数据，不来自力导向模拟。** 每个节点声明自己的*层*（层级、阶段、级别……）、*分组*（区域、团队、子系统……）和可选的*深度*（风险、变更频率、优先级……）。引擎把层叠成地板（y）、分组放成车道（x）、深度向内（z）。没有随机性，画面稳定、可解释。
- **高亮路径。** `highlight.path` 按顺序列出要亮的节点：逐个变亮、放大、加光晕、出标签；边上长出一根管子。尾段可以再亮第二条路径。
- **镜头即数据。** `camera: "auto"` 由路径自动推出「全景 → 推近 → 沿路径走 → 拉回」；也可以自己写关键帧，目标用语义写法（`node:ID`、`mid:A,B`、`path`、`center`）。
- **时间轴字幕**、双语文本字段（`{"zh": …, "en": …}`）、品牌行、图例、尾段小字——全部来自规格。
- **视觉预设**——`ivory-gold`（默认：米白底、灰绿节点、金色路径）、`ivory-indigo`（同底、靛蓝路径），深色三套 `slate-gold`、`midnight`、`obsidian-gold`。每套的全部色值与发光参数在一个 JSON 里，可行内覆盖任意键，或用 `"base"` 继承。
- **安静的字体。** 全篇衬线（Times New Roman → Source Serif 4 → Georgia；中文后备 Noto Serif SC），字号小、字重 Regular：节点标签 14 px、路径标签 20 px、字幕 22 / 15 px（@1080p）。
- **一条命令一件事**：`validate`、`test`（先看关键帧）、`render`（视频 + GIF + 封面 + 拼图）、`still`、`cover`、`strip`（路径的 2D 横带，放 deck 和文档）。

## 快速开始

```bash
npm install                      # three + playwright
npx playwright install chromium  # 无头浏览器（一次）
scripts/get_fonts.sh             # 下载 Source Serif 4 + Noto Serif SC（OFL）到 fonts/（任何字体目录都行：--font-dir）
# ffmpeg：放到 PATH，或 export FFMPEG=/path/to/ffmpeg，或 pip install imageio-ffmpeg

node src/cli.mjs validate examples/deps/layergraph.json
node src/cli.mjs test     examples/deps/layergraph.json -o out/deps --lang zh   # 关键帧，先看
node src/cli.mjs render   examples/deps/layergraph.json -o out/deps --lang zh   # video.mp4 · preview.gif · cover.png · contact.png · timeline.json
node src/cli.mjs strip    examples/deps/layergraph.json -o out/deps --lang zh   # strip.png
```

Node ≥ 18。1080p 软件渲染约 3–5 帧/秒，20 秒的片子要 2–3 分钟。

## 规格一屏看完

```jsonc
{
  "meta":   { "title": {"zh": "…", "en": "…"}, "preset": "ivory-gold", "duration": 21, "lang": "zh" },
  "axes":   { "layer": {"label": {"zh": "供应层级 ↑"}}, "group": {"label": {"zh": "← 区域 →"}},
              "depth": {"label": {"zh": "风险等级"}, "levels": [{"id": 1, "label": {"zh": "低"}}, {"id": 2, "label": {"zh": "高"}}]} },
  "layers": [ {"id": "raw", "label": {"zh": "原材料"}}, {"id": "parts", "label": {"zh": "零部件"}}, … ],     // 自下而上
  "groups": [ {"id": "north", "label": {"zh": "华北"}}, … ],
  "nodes":  [ {"id": "r-rare", "label": {"zh": "稀土"}, "layer": "raw", "group": "overseas", "depth": 2},
              {"id": "a-motor-k1", "label": {"zh": "定子"}, "layer": "asm", "kind": "minor", "parent": "a-motor"},
              {"id": "c-rare", "label": {"zh": "稀土 · 证书"}, "layer": "raw", "kind": "leaf", "parent": "r-rare", "state": "live"} ],
  "edges":  [ {"from": "r-rare", "to": "p-magnet"} ],                                  // kind: dep（默认）| link；minor/leaf 到父节点的连线自动画
  "highlight": { "path": ["f-robot", "a-motor", "p-magnet", "r-rare"], "lit_at": [4.6, 6.0, 7.4, 8.8], "release_at": 13.5,
                 "labels": {"r-rare": {"zh": "原材料 · 稀土"}} },
  "camera": "auto",                                                                     // 或 [{t, az, el, r, target}, …]
  "captions": [ {"a": 3.8, "b": 5.8, "main": {"zh": "一台*服务机器人*，它的来路"}, "sub": {"zh": "沿供应链往下追溯"}} ],
  "overlays": { "legend": {"kinds": {"leaf": {"zh": "质检证书"}}}, "tail": {"a": 14.2, "text": {"zh": "第二条路径：工业相机"}} }
}
```

完整字段：[schema/layergraph.schema.json](schema/layergraph.schema.json)（JSON Schema draft-07；规格文件允许注释与尾逗号）。节点三种：**major**（网格上的球）、**minor**（父节点前方半环上的小球——子项、部件）、**leaf**（叶平面上的八面体——测试、证书、文档）。边的方向 `from → to` 表示「`to` 依赖 `from`」（先 → 后，供应方 → 需求方）。

## 命令

| 命令 | 产出 | 说明 |
|---|---|---|
| `validate spec` | 退出码 0/1 + 信息 | 引用完整性、时刻单调、字幕窗口、文本长度、语言覆盖 |
| `info spec` | `timeline.json` | 解析后的车道、边界、自动镜头关键帧、点亮时刻（需要浏览器） |
| `test spec -o dir [--times a,b]` | 每个关键时刻一张 `test_<t>.png` | **渲染前必看**：远景（t=0.5）、每次点亮、每条字幕、末帧 |
| `render spec -o dir [--fps 30 --crf 18 --keep-frames --no-video --no-gif]` | `video.mp4`、`preview.gif`（480 px、10 fps）、`cover.png`（第一个路径节点点亮那一帧）、`contact.png`（12 格）、`timeline.json` | 编码后删帧目录，除非 `--keep-frames` |
| `still spec -o dir --t 10.6 [--dpr 2]` | 高清单帧，不带叠层 | 放 deck 与文档 |
| `cover spec -o dir --t 10.6` | 同上，路径以外全部压暗 | 只见路径的海报帧 |
| `strip spec -o dir [--second --reverse --width 1500]` | `strip.png` | 高亮路径的 2D 横带 |

全局选项：`--lang zh|en`、`--preset ivory-gold|ivory-indigo|slate-gold|midnight|obsidian-gold|file.json`、`--font-dir DIR`、`--ffmpeg PATH`。

## 预设与视觉规则

| 预设 | 底 | 节点 | 高亮路径 | 用在 |
|---|---|---|---|---|
| `ivory-gold`（默认） | #F5F3EE → #ECE9E2 极轻渐变、无暗角；层面板白 40% + #D9D4C8 细描边 | 灰绿 #8C9A92 | 金 #E3B94A + 软衬带；点亮节点填 #EBC25B、1 px #C99A2E 描边、两层普通混合晕圈（1.6× 与 2.6×）；小而亮的流光 #FFF1B8 | 报告、文档、白底 deck、产品视频——默认 |
| `ivory-indigo` | 同 ivory-gold | 同 | 同样构造的靛蓝色阶（路径 #4F46E5、填充 #6366F1、描边 #3730A3） | 同上，金色不合适时 |
| `slate-gold` | #1F2532 → #2B3345 轻径向渐变，暗角减半 | 冷灰 #9AA4B8 | 金 #E8B84A，柔和加法光晕，细金描边 | 深色 deck 与产品视频 |
| `midnight` | #0B1020 → #111A33 径向渐变 + 暗角 | 灰蓝 #8FA3C8 | 电光青 #22D3EE，加法光晕 | 要更亮眼的深色产品视频 |
| `obsidian-gold` | #0A0A0C | 中性灰 #6B6B73 | 暖金 #E5B84B，加法光晕 | 黑底主题演讲、金融 / 高端场合 |

各套遵守同样的四条规则——底安静（米白或深色）、节点低饱和、路径高饱和 + 发光、边低 alpha——外加层面板极淡渐变 + 细描边、景深雾、点亮时沿边流动的光点、圆角轻阴影的标签框、封面帧取第一个节点点亮的时刻。理由、每套一张对比图、试过又放弃了什么，见 [docs/visual.md](docs/visual.md)。要改：复制一份预设改键值，`--preset my.json`（或把 `meta.preset` 写成带 `"base": "ivory-gold"` 的对象——`ivory-indigo` 就是这么定义的）。点亮节点只放大 1.15×，路径是细管，光晕很小——路径靠颜色被看见，不靠体积。点亮的一切（填充、管子、晕圈、流光、描边）不受光照也不受雾，画面颜色就是预设色；普通节点仍有明暗。浅色预设用普通混合的晕圈发光，因为米白底上加法发光会截成白——见 [docs/visual.md](docs/visual.md) 第 4 节。

## 字体

全篇一套衬线栈：`"Times New Roman", "Source Serif 4", Georgia, serif`，中文后备 `Noto Serif SC`。机器上有 Times New Roman（macOS、Windows）就用它；Source Serif 4（OFL，`scripts/get_fonts.sh` 下载）是可移植的替身，Linux CI 上除这一处外与笔记本渲染一致。字号（@1080p）：层标题 18 px Semibold、节点标签 14 px、路径标签 20 px Semibold（`cover` 里 30 px）、字幕 22 / 15 px、图例与轴标 12 px；字距略收。规格里可改：`meta.fonts.family`（拉丁字体列表）、`meta.fonts.cjk`、`meta.fonts.scale`（一个倍数）或 `meta.fonts.sizes`（按角色）；其他输出尺寸随 `meta.size` 自动缩放。

## 示例

- `examples/supply-chain/`：四级供应层级作层，四个区域作车道，风险等级作深度；子部件作 minor 节点、质检证书作 leaf 节点；高亮路径从一台成品追溯到原材料，尾段再亮第二台产品的路径。`ivory-gold`。
- `examples/critical-path/`：五个项目阶段作层，五个团队作车道，无深度；高亮路径 = 决定上线日期的关键路径；显式镜头关键帧让顶层标题不被裁。`ivory-indigo`。
- `examples/deps/`：五个架构层作层，四个子系统作车道，变更频率作深度，测试套件作 leaf；高亮路径 = 一个模块自下而上的构建顺序。`ivory-gold`。

三份全部合成，默认以英文渲染；中文字符串作为可选本地化保留在规格里（`--lang zh`）。每个目录有规格与 `render/`（`preview.gif`、`cover.png`、`contact.png`、`timeline.json`）；完整的 `video.mp4` 不入仓，挂在 [Release v1.0.0](https://github.com/pengmengying2025/layergraph/releases/tag/v1.0.0)（本地跑 `render` 照常生成）。

## 给 agent

[SKILL.md](SKILL.md) 是 Agent Skills 格式：何时用、要向用户要什么、validate → test → 看图 → render 的流程、坑。[prompts/zh](prompts/zh) 与 [prompts/en](prompts/en) 各有两份可直接粘贴的模板：从零建一张图；改现有图的路径、字幕与配色。

## 排障

- **引擎一直不 READY** → 页面里有 JS 错误或字体永远加载不完；CLI 会打印捕获到的页面错误。先跑 `validate`。
- **无头 Chromium 起不来 WebGL** → CLI 已带 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`；Linux CI 上先 `npx playwright install-deps chromium`。
- **中文显示成方块** → 没找到 CJK 字体；跑 `scripts/get_fonts.sh` 或传 `--font-dir`。缺字体时 CLI 会提示。
- **封面帧标签叠在一起** → 换一个 `--t`，或缩短 `highlight.labels`。标签避让会试三圈候选位置，再不行就贴边放。
- **深度轴标题压到图例或网格** → 轴标沿刻度延长线放置；可关掉图例（`overlays.legend=false`）或缩短标题。远景（t≈0.5）和近景都要看一帧。
- **改配色后总有旧色残留** → 色值只在预设 JSON 里，grep 预设而不是引擎。
- **层标题被画面裁掉** → 标题到画面边缘会自动淡出；老是消失就把推近放宽（`r: "0.5"`）或对准两节点之间（`mid:A,B`），见 `examples/critical-path`。
- **渲染很长** → `nohup … &` 跑 `render` 看日志；每 60 帧打印一次进度。

## Showcase

*（留空）*

## 许可

MIT。依赖许可（three.js MIT、Playwright Apache-2.0、ffmpeg 作为外部进程调用、Source Serif 4 与 Noto Serif SC 按 OFL 按需下载）见 [docs/licenses.md](docs/licenses.md)。
