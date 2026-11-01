import { defineCollection } from "astro:content";
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

import { getCategoryPathParts } from "@utils/category";
import { parseTags } from "@utils/tag";


// Helper for handling dates that might be empty strings from JSON
const optionalDateSchema = z.preprocess((arg) => {
    if (typeof arg === "string" && arg.trim() === "") return undefined;
    return arg;
}, z.coerce.date().optional());

const categorySchema = z.preprocess((arg) => {
    const parts = getCategoryPathParts(arg as any);
    return parts ?? arg;
}, z.union([z.string(), z.array(z.string())]).optional().nullable().default(""));

const tagsSchema = z.preprocess((arg) => {
    return parseTags(arg);
}, z.array(z.string()).optional().default([]));

const postsCollection = defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/posts" }),
    schema: z.object({
        title: z.coerce.string(),
        directoryTitle: z.coerce.string().optional().default("").transform(s => s.trim()),
        published: optionalDateSchema,
        updated: optionalDateSchema,
        description: z.string().optional().default(""),
        cover: z.string().optional().default(""),
        coverInContent: z.boolean().optional().default(false),
        category: categorySchema,
        tags: tagsSchema,
        lang: z.string().optional().default(""),
        pinned: z.boolean().optional().default(false),
        author: z.string().optional().default(""),
        sourceLink: z.string().optional().default(""),
        licenseName: z.string().optional().default(""),
        licenseUrl: z.string().optional().default(""),
        comment: z.boolean().optional().default(true),
        draft: z.boolean().optional().default(false),

        /* Page encryption fields */
        encrypted: z.boolean().optional().default(false),
        password: z.string().optional().default(""),

        /* Copy protection fields */
        copyProtection: z.object({
            blockSelection: z.boolean().optional().default(false),
            blockClipboard: z.boolean().optional().default(false),
            blockContextMenu: z.boolean().optional().default(false),
            blockDevTools: z.boolean().optional().default(false),
        }).optional().default({
            blockSelection: false,
            blockClipboard: false,
            blockContextMenu: false,
            blockDevTools: false,
        }),

        /* Custom routeName */
        routeName: z.string().optional(),

        /* For internal use */
        prevTitle: z.string().default(""),
        prevSlug: z.string().default(""),
        nextTitle: z.string().default(""),
        nextSlug: z.string().default(""),
    }),
});

const specCollection = defineCollection({
    loader: glob({ pattern: '[^_]*.{md,mdx}', base: "./src/content" }),
    schema: z.object({
        title: z.coerce.string().optional(),
        description: z.string().optional(),
    }),
});

const moviesCollection = defineCollection({
    // 加载器：构建时扫描 src/content/movies 下所有子文件夹里的 note.md / note.mdx
    // 每个文件变成一个 entry，entry.id = 相对路径去扩展名（如 "30292777/note"）
    loader: glob({ pattern: '**/note.{md,mdx}', base: "./src/content/movies" }),
    // 校验规则：每个 note.md 的 frontmatter 必须符合这个结构，否则构建报错
    schema: z.object({
        title: z.coerce.string(),                        // 片名（必填）
        originalTitle: z.string().optional(),            // 原名（可空）
        year: z.coerce.number(),                         // 年份；coerce 容忍 "2019" 这种字符串，自动转数字
        director: z.string(),                            // 导演
        doubanId: z.string(),                            // 豆瓣 ID（字符串防精度问题）
        doubanRating: z.number().min(0).max(10),         // 豆瓣评分，限定 0-10
        myRating: z.number().min(0).max(10).optional(),  // 我的评分（"想看"的片还没评分，所以可空）
        status: z.enum(["watched", "planned"]),          // 状态枚举，写第三个值直接报错
        watchDate: optionalDateSchema,                   // 观影日期，复用文件顶部现成的日期预处理
        region: z.string().optional(),                   // 地区
        tags: tagsSchema,                                // 标签，复用现成的标签解析（处理了字符串/数组两种写法）
        poster: z.string(),                              // 海报路径（必填，海报墙没图还叫什么海报墙）
    }),
});
export const collections = {
    posts: postsCollection,
    spec: specCollection,
    movies: moviesCollection,
};