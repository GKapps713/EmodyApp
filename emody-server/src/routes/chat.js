import express from "express";
import { chatWithGpt } from "../services/openaiService.js";

const router = express.Router();

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;
    const reply = await chatWithGpt(messages);
    res.json({ reply });
  } catch (err) {
    console.error("Chat API Error:", err);
    res.status(500).json({ error: "Failed to chat with GPT" });
  }
});

export default router;
