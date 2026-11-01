---
title: "文件夹写作方案（推荐）"
directoryTitle: "03 文件夹写作"
published: 2026-11-01
description: "官方推荐的写作方式：一篇文章一个文件夹，文章、封面、配图全部放在一起管理。"
tags: [博客教程]
category: 博客教程
draft: false
cover: "./cover.jpg"
---

# 文件夹写作方案

**一个文件夹 = 一篇文章**，文件夹里放 `index.md`（正文）和所有配图。图片用相对路径引用，RSS 也能正常工作。

:::note
本篇就是文件夹方案的活例子：`posts/博客使用教程合集/03-文件夹写作/` 里有 `index.md` + `cover.jpg` + `photo-demo.jpg`，这篇文章的封面和正文图片都来自同目录的本地文件。
:::

## 文件结构

```
src/content/posts/
└── 03-文件夹写作/
    ├── index.md        ← 正文（文件名必须叫 index.md）
    ├── cover.jpg       ← 封面图，frontmatter 里 cover: "./cover.jpg"
    └── photo-demo.jpg  ← 正文配图
```

文章访问地址：`/posts/03-文件夹写作/`（文件夹名就是 URL）。

## 本地图片怎么引用

封面在 frontmatter 里写 `./文件名`：

```yaml
cover: "./cover.jpg"
```

正文里用 Markdown 图片语法，同样写相对路径：

```markdown
![本地图片示例](./photo-demo.jpg)
```

效果如下（这张就是同目录的 `photo-demo.jpg`）：

![本地图片示例](./photo-demo.jpg)

:::tip
记得图片路径写成 `./xxx.jpg` 或直接 `xxx.jpg`，**不要**加开头的 `/`（加了斜杠会去 `public/` 目录找，找不到就裂图）。
:::

## 什么时候用文件夹方案

- 文章图片多（教程、游记、影评）
- 想给文章配本地封面
- 需要 RSS 正常显示图片

## 两种方案怎么选

| | 单文件 | 文件夹 |
|---|---|---|
| 适合 | 纯文字 | 多图文章 |
| 本地图片 | ❌ 放不了旁边 | ✅ 同目录 |
| RSS 图片 | ⚠️ 有问题 | ✅ 正常 |
| 管理 | 简单 | 资源集中好维护 |

**官方建议：默认用文件夹方案**。
