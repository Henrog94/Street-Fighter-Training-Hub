import mongoose from "mongoose";
const moveSchema = new mongoose.Schema({
  name: { type: String, required: true }, input: String, startup: String,
  active: String, recovery: String, cancel: String, damage: String,
  guard: String, onHit: String, onBlock: String
}, { _id: false, strict: false });
const fighterSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  game: { type: String, default: "Street Fighter 6" },
  fightingStyle: { type: String, default: "" },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  moves: { type: [moveSchema], default: [] },
  sourceId: { type: String, unique: true, sparse: true },
  localCharacter: { type: mongoose.Schema.Types.Mixed, default: null },
  wikiMoves: { type: mongoose.Schema.Types.Mixed, default: null },
  wikiCharacter: { type: mongoose.Schema.Types.Mixed, default: null },
  importedFrameData: { type: [mongoose.Schema.Types.Mixed], default: [] },
  aliases: { type: [String], default: [] }
}, { timestamps: true });
export default mongoose.model("Fighter", fighterSchema);
