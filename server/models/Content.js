import mongoose from "mongoose";
const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  sourcePath: String,
  importedAt: { type: Date, default: Date.now }
}, { timestamps: true, minimize: false });
export default mongoose.model("Content", schema);
