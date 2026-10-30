# 咕噜比耶动画（gulu-cheer）

人形咕噜（牛皮纸剪纸风）在开通会员等“好消息”时刻出场的庆祝动画，放在官网上供各项目共用。演示页：https://www.funbits.cn/assets/gulu-cheer/

## 帧图

`assets/img/brand/character/kraft/cheer/`，四帧同机位、同构图，透明底：

| 帧 | 内容 |
|---|---|
| `cheer-0` | 待机：抱书、半眯眼、浅 ω 嘴 |
| `cheer-1` | 双手比耶：睁大眼、张嘴笑、腮红、尾巴卷高 |
| `cheer-2` | 由 cheer-1 只改脸：眨右眼 + ω 笑 |
| `cheer-3` | 由 cheer-1 只改脸：眼睛弯成 ^ ^ 大笑 |

每帧有 1024×1024 PNG（原图）和 512×512 WebP（网页用）。

## 节奏

默认 `mode="breathe"`：抱书待机 0.7s → 弹起比耶（带小装饰）播一遍，之后停在比耶上，3.6 秒一次轻呼吸（微微上浮、放大 1–2%）。需要比耶后继续眨眼、大笑循环时用 `mode="full"`：

抱书待机 0.7s → 比耶弹出（挤压回弹 + 两侧飘出金星 / 珊瑚爱心 / 暖橙水滴）0.9s → 循环：眨眼 0.42s → 比耶 0.7s → 大笑小跳 0.76s → 比耶轻晃 1.6s。具体数值见 `timeline.json`，App 原生实现照它复刻。系统开启“减少动态效果”时只静态显示比耶帧。

## 网页里用

```html
<script src="https://www.funbits.cn/assets/gulu-cheer/gulu-cheer.js" defer></script>
<gulu-cheer size="220"></gulu-cheer>
```

| 属性 | 说明 |
|---|---|
| `mode` | `breathe`（默认，比耶播一遍后呼吸）/ `full`（比耶后继续眨眼、大笑循环） |
| `size` | 边长 px，默认 200 |
| `trigger` | `visible`（默认，进入视口时播）/ `auto` / `click` / `manual` |
| `once` | 只播一遍，停在比耶 |
| `src` | 帧图目录，默认是脚本同站的 `img/brand/character/kraft/cheer/` |

脚本方法 `el.play()`、`el.stop()`；比耶出现时派发 `gulu-cheer:peace` 事件，可以用来同步音效或震动。

按品牌规范，同一屏只放一个咕噜，不放在按钮上。
