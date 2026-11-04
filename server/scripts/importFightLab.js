import dotenv from "dotenv";
import mongoose from "mongoose";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import connectDB from "../config/db.js";
import Fighter from "../models/Fighter.js";
import Content from "../models/Content.js";
import { guideVideos } from "../../src/data/guide-videos.js";
import { tutorials, resources } from "../../src/config/content.js";

dotenv.config();
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const normalize = name => String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const canonical = name => normalize(name);
const sourceFiles = [
  ["characters", "src/data/characters.json"],
  ["guides", "src/data/guides.json"],
  ["wiki-moves", "src/data/wiki-moves.json"],
  ["wiki-characters", "src/data/wiki-characters.json"],
  ["frame-data", "src/data/frame-data.json"],
  ["patch-notes", "src/data/patch-notes.json"],
  ["patch-feed", "src/data/patch-feed.json"],
  ["controls-reference", "src/data/controls-reference.json"],
  ["button-reference", "src/data/button-reference.json"],
  ["glossary-reference", "src/data/glossary-reference.json"],
  ["hud-reference", "src/data/hud-reference.json"]
];
async function loadJSON(rel) { return JSON.parse(await readFile(path.join(projectRoot, rel), "utf8")); }
async function importContent(key, data, sourcePath) {
  await Content.updateOne({ key }, { $set: { data, sourcePath, importedAt: new Date() } }, { upsert: true });
  console.log(`  ${key}: ${Array.isArray(data) ? data.length : Object.keys(data || {}).length} entries`);
}
async function main() {
  await connectDB();
  try {
    console.log("Importing original FightLab data (existing MongoDB records are preserved)...");
    const loaded = {};
    for (const [key, rel] of sourceFiles) {
      const data = await loadJSON(rel);
      loaded[key] = data;
      await importContent(key, data, rel);
    }
    const publicDir = path.join(projectRoot, "public/data");
    const publicFiles = (await readdir(publicDir)).filter(n => n.endsWith(".json"));
    for (const filename of publicFiles) {
      const key = `public-${filename.replace(/\.json$/, "")}`;
      await importContent(key, await loadJSON(`public/data/${filename}`), `public/data/${filename}`);
    }
    // Store individually scraped pages as well, including character-specific pages.
    const charDir = path.join(publicDir, "wiki-characters");
    try {
      for (const filename of (await readdir(charDir)).filter(n => n.endsWith(".json"))) {
        await importContent(`wiki-page-${filename.replace(/\.json$/, "")}`,
          await loadJSON(`public/data/wiki-characters/${filename}`), `public/data/wiki-characters/${filename}`);
      }
    } catch (error) { if (error.code !== "ENOENT") throw error; }
    await importContent("guide-videos", guideVideos, "src/data/guide-videos.js");
    await importContent("tutorials", tutorials, "src/config/content.js");
    await importContent("resources", resources, "src/config/content.js");
    const existing = await Fighter.find({}).lean();
    const byName = new Map();
    for (const fighter of existing) {
      if (!byName.has(canonical(fighter.name))) byName.set(canonical(fighter.name), fighter);
    }
    let created = 0, enriched = 0;
    const wikiMoves = loaded["wiki-moves"];
    const wikiCharacters = loaded["wiki-characters"];
    for (const local of loaded.characters) {
      const key = canonical(local.name);
      const prior = byName.get(key);
      const scraped = Object.entries(wikiMoves).find(([n]) => canonical(n) === key)?.[1] ?? null;
      const wiki = Object.entries(wikiCharacters).find(([n]) => canonical(n) === key)?.[1] ?? null;
      const frames = loaded["frame-data"].filter(m => canonical(m.character) === key);
      const updates = {
        name: local.name, game: "Street Fighter 6", fightingStyle: local.style || "",
        description: local.description || "", image: local.image || "",
        localCharacter: local, wikiMoves: scraped, wikiCharacter: wiki,
        importedFrameData: frames, aliases: [local.name]
      };
      if (prior) {
        await Fighter.updateOne({ _id: prior._id }, { $set: updates });
        enriched++;
      } else {
        const createdFighter = await Fighter.create({ ...updates, sourceId: `fightlab-local:${key}` });
        byName.set(key, createdFighter);
        created++;
      }
    }
    console.log(`Local fighter profiles: ${enriched} enriched, ${created} created`);
    console.log(`Total fighter documents: ${await Fighter.countDocuments()}`);
    console.log(`Content datasets stored: ${await Content.countDocuments()}`);
    console.log("Finished. No existing records were deleted. Run npm run seed first if the external API data has not yet been imported.");
  } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error("Import failed:", error); process.exitCode = 1; });
