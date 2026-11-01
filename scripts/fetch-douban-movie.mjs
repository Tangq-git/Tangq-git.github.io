import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// ========== 用法：pnpm new-movie <豆瓣ID或豆瓣链接> ==========
// 例如：pnpm new-movie 1292052
//       pnpm new-movie https://movie.douban.com/subject/1292052/

const input = process.argv[2];
if (!input) {
    console.error("缺少参数。用法: pnpm new-movie <豆瓣ID或链接>");
    process.exit(1);
}

// 从参数里提取连续 5 位以上的数字，兼容直接贴链接的写法
const doubanId = (input.match(/(\d{5,})/) || [])[1];
if (!doubanId) {
    console.error(`无法从 "${input}" 中解析出豆瓣 ID`);
    process.exit(1);
}

// 豆瓣网页版有反爬中间页，这里走移动端 API（m.douban.com/rexxar），直接返回 JSON
const HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger",
    "Referer": `https://m.douban.com/movie/subject/${doubanId}/`,
};

const apiUrl = `https://m.douban.com/rexxar/api/v2/movie/${doubanId}`;
console.log(`正在抓取 ${apiUrl} ...`);

const res = await fetch(apiUrl, { headers: HEADERS });
if (!res.ok) {
    console.error(`豆瓣 API 请求失败: HTTP ${res.status}（检查 ID 是否正确）`);
    process.exit(1);
}
const movie = await res.json();

// 剧集也走同一个 API，提示一下但仍按电影录入
if (movie.is_tv) {
    console.warn("⚠ 这个 ID 是剧集不是电影，仍会按电影录入");
}

const title = movie.title ?? "";
const originalTitle = movie.original_title ?? "";
const year = Number.parseInt(String(movie.year ?? ""), 10) || 0;
if (!year) {
    console.warn("⚠ 没抓到年份，note.md 里 year 写的是 0，请手动修正");
}

// 导演可能有多位，用 " / " 连接
const director = (movie.directors ?? []).map((d) => d.name).join(" / ");

// 未上映的片子没有评分，先给 0 并提醒手动改
const doubanRating = movie.rating?.value ?? 0;
if (!doubanRating) {
    console.warn("⚠ 没抓到豆瓣评分（可能是未上映），note.md 里 doubanRating 写的是 0，请手动修正");
}

const tags = movie.genres ?? [];
const region = (movie.countries ?? []).join(" / ");

// 海报取大图，扩展名从 URL 里取
const posterUrl = movie.pic?.large ?? movie.pic?.normal ?? "";
if (!posterUrl) {
    console.error("没拿到海报地址，请手动补图。");
    process.exit(1);
}
const posterExt = path.extname(new URL(posterUrl).pathname) || ".jpg";
const posterFileName = `poster${posterExt}`;

// ========== 写入文件 ==========
const dir = path.join("src", "content", "movies", doubanId);
if (existsSync(dir)) {
    console.error(`目录 ${dir} 已存在，不会覆盖。如需重建请先删除该目录。`);
    process.exit(1);
}
await mkdir(dir, { recursive: true });

// 下载海报（豆瓣图床会校验 Referer，用同一套头即可）
const posterRes = await fetch(posterUrl, { headers: HEADERS });
if (!posterRes.ok) {
    console.error(`海报下载失败: HTTP ${posterRes.status}，请手动下载 ${posterUrl} 放到 ${dir}`);
} else {
    await writeFile(path.join(dir, posterFileName), Buffer.from(await posterRes.arrayBuffer()));
}

// YAML 字符串值统一用双引号包起来，防止片名里带冒号等特殊字符炸掉
const q = (s) => JSON.stringify(s);

// frontmatter：可选字段（myRating / watchDate）以注释形式给出，看完电影后取消注释填写
const noteMd = `---
title: ${q(title)}
${originalTitle ? `originalTitle: ${q(originalTitle)}\n` : ""}year: ${year}
director: ${q(director)}
doubanId: ${q(doubanId)}
doubanRating: ${doubanRating}
# myRating: 8.5
status: planned
# watchDate: 2026-11-01
${region ? `region: ${q(region)}\n` : ""}tags: [${tags.join(", ")}]
poster: ${q(`./${posterFileName}`)}
---

在这里写观后感……
`;

await writeFile(path.join(dir, "note.md"), noteMd, "utf8");

console.log(`✅ 完成！已创建 ${dir}`);
console.log(`   片名: ${title}${originalTitle ? ` (${originalTitle})` : ""}`);
console.log(`   年份: ${year}  导演: ${director}  豆瓣评分: ${doubanRating}`);
console.log(`   接下来请编辑 ${path.join(dir, "note.md")}，补 myRating / watchDate / 观后感`);