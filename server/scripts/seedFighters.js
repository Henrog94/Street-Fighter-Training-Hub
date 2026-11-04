
import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Fighter from "../models/Fighter.js";
import { fetchExternalFighterData } from
  "../services/fighterImportService.js";

dotenv.config();

function normalizeMove(input, frameData) {
  return {
    name: input,
    input: input,
    startup: String(frameData["Startup"] ?? "-"),
    active: String(frameData["Active"] ?? "-"),
    recovery: String(frameData["Recovery"] ?? "-"),
    cancel: String(frameData["Cancel"] ?? "-"),
    damage: String(frameData["Damage"] ?? "-"),
    guard: String(frameData["Guard"] ?? "-"),
    onHit: String(frameData["On Hit"] ?? "-"),
    onBlock: String(frameData["On Block"] ?? "-")
  };
}

function normalizeFighter(name, moveData) {
  const moves = Object.entries(moveData)
    .filter(([input, frameData]) =>
      input &&
      frameData &&
      typeof frameData === "object" &&
      !Array.isArray(frameData)
    )
    .map(([input, frameData]) =>
      normalizeMove(input, frameData)
    );

  return {
    name: name.replaceAll("_", " "),
    game: "Street Fighter 6",
    sourceId: `sf6-frame-data:${name}`,
    moves
  };
}

async function seedFighters() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();

    console.log("Fetching external API data...");
    const apiData = await fetchExternalFighterData();

    if (
      !apiData ||
      typeof apiData !== "object" ||
      Array.isArray(apiData)
    ) {
      throw new Error("Unexpected API data structure");
    }

    const fighters = Object.entries(apiData)
      .filter(([name, moves]) =>
        name &&
        moves &&
        typeof moves === "object" &&
        !Array.isArray(moves)
      )
      .map(([name, moves]) =>
        normalizeFighter(name, moves)
      )
      .filter(fighter => fighter.moves.length > 0);

    if (fighters.length === 0) {
      throw new Error("No valid fighter records found");
    }

    const operations = fighters.map(fighter => ({
      updateOne: {
        filter: { sourceId: fighter.sourceId },
        update: {
          $set: {
            name: fighter.name,
            game: fighter.game,
            moves: fighter.moves
          },
          $setOnInsert: {
            sourceId: fighter.sourceId
          }
        },
        upsert: true
      }
    }));

    const result = await Fighter.bulkWrite(operations);

    console.log("Import completed successfully!");
    console.log("Fighters processed:", fighters.length);
    console.log("New fighters:", result.upsertedCount);
    console.log("Existing fighters matched:", result.matchedCount);
    console.log("Records modified:", result.modifiedCount);

    const totalMoves = fighters.reduce(
      (total, fighter) => total + fighter.moves.length,
      0
    );

    console.log("Total moves processed:", totalMoves);
  } catch (error) {
    console.error("Import failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedFighters();
