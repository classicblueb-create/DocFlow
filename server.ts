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
  let ai: any = null;
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // Helper function to call AI (supports OpenRouter and Gemini SDK)
  async function generateWithAI(systemInstruction: string, prompt: string): Promise<string> {
    if (process.env.OPENROUTER_API_KEY) {
      const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/classicblueb-create/DocFlow",
            "X-Title": "DocFlow",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
        }

        const data: any = await response.json();
        return data.choices?.[0]?.message?.content || "";
      } catch (e: any) {
        console.error("OpenRouter Error:", e);
        throw e;
      }
    } else if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      return response.text || "";
    } else {
      throw new Error("No API keys configured. Please set OPENROUTER_API_KEY or GEMINI_API_KEY.");
    }
  }

  // AI API routes
  app.post("/api/ai/generate", async (req, res) => {
    const { type, taskName, details, priority, customer } = req.body;

    if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "AI API key is not configured" });
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

      case "evaluate":
        systemInstruction = "You are a task management expert. Analyze the task and determine its priority level and suggested tag keywords. Output ONLY a valid JSON string.";
        prompt = `วิเคราะห์งานนี้:
        ชื่องาน: ${taskName}
        รายละเอียด: ${details || 'ไม่ได้ระบุ'}
        
        กรุณาจัดระดับความสำคัญ (Priority) และแนะนำแท็ก (Tags):
        ให้ตอบเป็น JSON object รูปแบบนี้เท่านั้น (ห้ามใส่ markdown block):
        {
          "priority": "ต่ำ (Low)" | "ปานกลาง (Medium)" | "สูง (High)" | "ด่วน (Urgent)",
          "tags": "แท็ก1, แท็ก2, แท็ก3"
        }`;
        break;

      default:
        return res.status(400).json({ error: "Invalid generation type" });
    }

    try {
      let text = await generateWithAI(systemInstruction, prompt);
      
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

      if (type === "evaluate") {
        try {
          const cleanJson = text.replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleanJson);
          return res.json({ result: parsed });
        } catch (e) {
          return res.json({ result: { priority: "ปานกลาง (Medium)", tags: "" } });
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

  // AI Chat API
  app.post("/api/ai/chat", async (req, res) => {
    const { messages, agentTitle, agentInstructions } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid chat history" });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "AI API key is not configured" });
    }

    const systemInstruction = `You are a professional AI Assistant specializing as a ${agentTitle || 'assistant'}. ${agentInstructions || ''}. Always reply politely in Thai. Use HTML tags for formatting if needed (like <br/>, <b>, etc.) to make the text structured and easy to read.`;
    
    const openAiMessages = messages.map((m: any) => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.text.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?[^>]+(>|$)/g, "")
    }));

    try {
      let reply = "";
      if (process.env.OPENROUTER_API_KEY) {
        const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/classicblueb-create/DocFlow",
            "X-Title": "DocFlow",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemInstruction },
              ...openAiMessages
            ],
            temperature: 0.7,
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
        }

        const data: any = await response.json();
        reply = data.choices?.[0]?.message?.content || "";
      } else if (process.env.GEMINI_API_KEY) {
        const contents = openAiMessages.map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          }
        });
        reply = response.text || "";
      }

      const formattedReply = reply.trim().replace(/\n/g, "<br/>");
      res.json({ result: formattedReply });
    } catch (e: any) {
      console.error("Chat Error:", e);
      res.status(500).json({ error: e.message || "Failed to generate AI response" });
    }
  });

  // AI Document Generator API
  app.post("/api/ai/generate-doc", async (req, res) => {
    const { prompt, clients } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: "AI API key is not configured" });
    }

    const systemInstruction = `You are a document extraction assistant. Analyze the user's request (in Thai) and extract the invoice/quotation details.
    Return ONLY a valid JSON object matching the schema below. Do not wrap it in markdown code blocks.
    
    Available Clients in database:
    ${JSON.stringify(clients || [])}
    
    If a customer name mentioned in the prompt matches or is very similar to one of the Available Clients, use their name, address, and taxId exactly.
    Otherwise, extract whatever customer name, address, and taxId is mentioned or implied.
    
    Schema:
    {
      "docType": "Quotation" | "Invoice",
      "customerName": string,
      "customerAddress": string,
      "customerTaxId": string,
      "items": [
        { "desc": string, "qty": number, "price": number }
      ],
      "docNotes": string (optional notes, e.g. payment terms),
      "docConditions": string (optional payment conditions)
    }
    
    Return only the raw JSON.`;

    try {
      let resultText = "";
      if (process.env.OPENROUTER_API_KEY) {
        const model = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/classicblueb-create/DocFlow",
            "X-Title": "DocFlow",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: prompt }
            ],
            temperature: 0.2,
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
        }

        const data: any = await response.json();
        resultText = data.choices?.[0]?.message?.content || "";
      } else if (process.env.GEMINI_API_KEY) {
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        });
        resultText = response.text || "";
      }

      const cleanJson = resultText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      res.json({ result: parsed });
    } catch (e: any) {
      console.error("Generate Doc Error:", e);
      res.status(500).json({ error: e.message || "Failed to parse document request" });
    }
  });

  // LINE Messaging API — webhook รับ Group ID อัตโนมัติเมื่อ bot ถูก add เข้ากลุ่ม
  let lineGroupId = process.env.LINE_GROUP_ID || '';

  app.post("/api/line/webhook", (req, res) => {
    res.sendStatus(200); // ตอบ 200 ทันทีตาม LINE spec
    const events = req.body?.events || [];
    for (const event of events) {
      const source = event.source;
      // บันทึก groupId จาก event ใดก็ตามที่มาจากกลุ่ม
      if (source?.type === 'group' && source?.groupId) {
        if (lineGroupId !== source.groupId) {
          lineGroupId = source.groupId;
          console.log(`[LINE] บันทึก Group ID: ${lineGroupId}`);
        }
      }
    }
  });

  // LINE Messaging API — ดู Group ID ที่จับได้ (สำหรับ debug)
  app.get("/api/line/group-id", (_req, res) => {
    res.json({ groupId: lineGroupId || null });
  });

  // LINE Messaging API — ส่งแจ้งเตือนเมื่อ assign งาน
  app.post("/api/notify/line", async (req, res) => {
    const channelToken = process.env.LINE_CHANNEL_TOKEN;
    const groupId = lineGroupId || process.env.LINE_GROUP_ID;

    if (!channelToken) {
      return res.status(503).json({ error: "LINE_CHANNEL_TOKEN ยังไม่ได้ตั้งค่าในไฟล์ .env" });
    }
    if (!groupId) {
      return res.status(503).json({ error: "ยังไม่มี LINE_GROUP_ID — พิมพ์อะไรก็ได้ในกลุ่มที่มี bot ก่อน แล้วลองใหม่" });
    }

    const { taskName, assignee, dueDate, fileUrl, details, customer } = req.body;
    if (!taskName || !assignee) {
      return res.status(400).json({ error: "ต้องระบุ taskName และ assignee" });
    }

    const lines = [
      '📋 มอบหมายงานใหม่!',
      '━━━━━━━━━━━━━━━',
      `✅ งาน: ${taskName}`,
      `👤 มอบให้: ${assignee}`,
      customer   ? `🏢 ลูกค้า: ${customer}` : '',
      dueDate    ? `📅 กำหนดส่ง: ${dueDate}` : '',
      details    ? `📝 ${details.slice(0, 120)}${details.length > 120 ? '...' : ''}` : '',
      fileUrl    ? `🔗 ${fileUrl}` : '',
      '━━━━━━━━━━━━━━━',
      'ส่งจาก DocFlow 🚀',
    ].filter(Boolean).join('\n');

    try {
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${channelToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: groupId,
          messages: [{ type: "text", text: lines }],
        }),
      });
      if (!response.ok) {
        const err: any = await response.json();
        console.error("[LINE] push error:", err);
        return res.status(response.status).json({ error: err.message || "LINE API error" });
      }
      return res.json({ ok: true });
    } catch (e: any) {
      console.error("[LINE] fetch error:", e);
      return res.status(500).json({ error: e.message });
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
