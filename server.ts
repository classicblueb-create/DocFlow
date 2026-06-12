import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // AI API routes
  app.post("/api/ai/generate", async (req, res) => {
    const { type, taskName, details, priority, customer } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured" });
    }

    let systemInstruction = "";
    let prompt = "";

    switch (type) {
      case "analysis":
        systemInstruction = "You are a professional project analyst. Generate a comprehensive project analysis in Thai.";
        prompt = `วิเคราะห์งานนี้:
        ชื่องาน: ${taskName}
        ลูกค้า: ${customer || 'ไม่ได้ระบุ'}
        ความสำคัญ: ${priority}
        รายละเอียด: ${details}
        
        กรุณาสรุปข้อมูลดังนี้โดยใช้หัวข้อที่ชัดเจน:
        1. ความสำคัญและความเสี่ยง (Importance & Risks)
        2. แผนการดำเนินงานและสโคปงาน (Project Roadmap)
        3. Business Process Diagram (BPD) - อธิบายเป็นขั้นตอนลำดับงานที่เข้าใจง่าย
        4. โครงสร้างงบประมาณที่ควรเสนอ (Estimated Budget) - ประมาณการและวิธีกรคิดงบ`;
        break;

      case "email":
        systemInstruction = "You are a professional business correspondent. Draft a polite and clear email in Thai.";
        prompt = `ร่างอีเมลสำหรับงานนี้:
        ชื่องาน: ${taskName}
        ลูกค้า: ${customer || 'ไม่ได้ระบุ'}
        รายละเอียด: ${details}
        
        กรุณาสร้างเนื้อหาอีเมลเบื้องต้นสำหรับติดต่อลูกค้าเพื่อเริ่มโปรเจกต์ หรือขอข้อมูลเพิ่มเติมอย่างมืออาชีพ`;
        break;

      case "course":
        systemInstruction = "You are an expert curriculum designer and educator. Design a course structure in Thai.";
        prompt = `ร่างเนื้อหาคอร์สสำหรับงานนี้:
        ชื่องาน: ${taskName}
        รายละเอียด: ${details}
        
        กรุณาออกแบบเนื้อหาการสอน โมดูลที่เกี่ยวข้อง และหัวข้อสำคัญที่ควรนำเสนอหากโปรเจกต์นี้เป็นการสอนหรือเป็นคอร์สวิชาการ`;
        break;

      case "subtasks":
        systemInstruction = "You are an efficient project manager. Break down tasks into actionable steps. Output ONLY a valid JSON string (array of strings).";
        prompt = `แบ่งงานหลักนี้ออกเป็นขั้นตอนย่อย (Subtasks) ที่สามารถทำได้จริง:
        ชื่องาน: ${taskName}
        รายละเอียด: ${details}
        
        ให้ตอบเป็น JSON array ของข้อความสั้นๆ เท่านั้น (เช่น ["ขั้นที่ 1", "ขั้นที่ 2"])`;
        break;

      default:
        return res.status(400).json({ error: "Invalid generation type" });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      let text = response.text || "";
      
      // If subtasks, try to parse JSON if it's not clean
      if (type === "subtasks") {
        try {
          // Clean possible markdown backticks
          const cleanJson = text.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          return res.json({ result: parsed });
        } catch (e) {
          // Fallback if parsing fails - split by newlines
          const lines = text.split('\n').filter(l => l.trim().length > 2).map(l => l.replace(/^[0-9.-]\s*/, '').trim());
          return res.json({ result: lines });
        }
      }

      res.json({ result: text });
    } catch (error: any) {
      console.error("AI Generation error:", error);
      
      // Fallback handlers when API is out of quota
      const isQuotaError = error.message?.includes("429") || error.status === 429 || error.code === 429;
      if (isQuotaError) {
        if (type === "subtasks") {
            return res.json({ result: ["ตรวจสอบความต้องการและขอบเขต", "ดำเนินการและติดตามผล", "ตรวจสอบความเรียบร้อยและส่งมอบ"] });
        } else if (type === "email") {
            return res.json({ result: "เรียน ลูกค้า,\n\nสืบเนื่องจากโปรเจกต์ " + taskName + " ทางเรามีความยินดีที่จะเริ่มดำเนินงาน...\n\n(แจ้งเตือน: API Limit Reached, กรุณาเติมเครดิตการใช้งาน)" });
        } else if (type === "analysis") {
            return res.json({ result: "**การวิเคราะห์โปรเจกต์ (จำลอง)**\n\n1. ความสำคัญและความเสี่ยง: ปานกลาง\n2. แผนการดำเนินงาน: ตามกำหนดการ\n3. โครงสร้างงบประมาณ: อ้างอิงตามมาตรฐาน\n\n(แจ้งเตือน: API Limit Reached, ระบบแสดงผลข้อมูลจำลองเนื่องจากโควต้าเต็มครับ)" });
        } else {
            return res.json({ result: "ข้อมูลจำลอง เนื่องจาก AI Quota (API Limit) ของท่านหมดลง กรุณาเติมเครดิตหรือจัดการบิลที่ Google AI Studio" });
        }
      }

      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
