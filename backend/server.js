const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ShezoraX AI Backend is running 🚀",
    status: "online",
  });
});

// AI Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content:
            "You are ShezoraX, a helpful, intelligent and friendly personal AI assistant. Give clear, useful and natural answers.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      success: true,
      reply: response.output_text,
    });
  } catch (error) {
    console.error("OPENAI ERROR:", error);

    res.status(500).json({
      success: false,
      error: "AI response failed",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ShezoraX AI Backend running at http://localhost:${PORT}`);
  console.log(`🤖 Chat API: http://localhost:${PORT}/api/chat`);
});