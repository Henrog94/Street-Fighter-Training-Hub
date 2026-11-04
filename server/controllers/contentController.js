import Content from "../models/Content.js";
export async function getContent(req, res) {
  try {
    const doc = await Content.findOne({ key: req.params.key }).lean();
    if (!doc) return res.status(404).json({ message: "Dataset not imported", key: req.params.key });
    res.json(doc.data);
  } catch (error) { res.status(500).json({ message: error.message }); }
}
export async function listContent(req, res) {
  try {
    const docs = await Content.find({}, { key: 1, sourcePath: 1, updatedAt: 1, _id: 0 }).lean();
    res.json(docs);
  } catch (error) { res.status(500).json({ message: error.message }); }
}
