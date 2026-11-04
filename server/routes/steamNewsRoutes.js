import { Router } from "express";

const router = Router();
const APP_ID = 1364780;
const API_URL = `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${APP_ID}&count=100&maxlength=1800&format=json`;
const TTL_MS = 15 * 60 * 1000;
let cache = { expires: 0, items: [] };

function plainText(value = "") {
  return String(value)
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/gis, "$2")
    .replace(/\[\/?(?:b|i|u|h1|h2|h3|list|\*|img|previewyoutube|table|tr|td|th)[^\]]*\]/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:amp|quot|lt|gt|nbsp);/g, " ")
    .replace(/\s+/g, " ").trim();
}

router.get("/patch-notes", async (_req, res) => {
  if (Date.now() < cache.expires && cache.items.length) return res.json(cache.items);
  try {
    const response = await fetch(API_URL, { signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error(`Steam responded ${response.status}`);
    const json = await response.json();
    const posts = json?.appnews?.newsitems;
    if (!Array.isArray(posts)) throw new Error("Invalid Steam response");
    const items = posts
      .filter(p => /patch|update|balance|adjustment|maintenance|fix|version|release/i.test(`${p.title} ${plainText(p.contents).slice(0, 220)}`))
      .slice(0, 20)
      .map(p => {
        const content = plainText(p.contents);
        const isPatch = /patch|balance|adjustment|bug fix|hotfix/i.test(`${p.title} ${content.slice(0, 200)}`);
        return {
          id: `steam-${p.gid}`, title: p.title,
          date: new Date(p.date * 1000).toISOString().slice(0, 10),
          summary: content.slice(0, 290) + (content.length > 290 ? "…" : ""),
          source: "Steam / Street Fighter 6", type: isPatch ? "Patch / balance announcement" : "Game update / news",
          url: /^https:\/\//.test(p.url || "") ? p.url : `https://steamcommunity.com/app/${APP_ID}/allnews/`
        };
      });
    cache = { items, expires: Date.now() + TTL_MS };
    res.json(items);
  } catch (error) {
    if (cache.items.length) return res.json(cache.items);
    res.status(502).json({ message: "Steam news is temporarily unavailable", detail: error.message });
  }
});

export default router;
