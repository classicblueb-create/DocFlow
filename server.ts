import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { jsPDF } from "jspdf";
import { createClient } from "@supabase/supabase-js";

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

  // Telegram Bot API — webhook และการแจ้งเตือน
  let telegramChatId = process.env.TELEGRAM_CHAT_ID || '';

  // Helper to load Thai font for jsPDF on the server
  let sarabunBase64: string | null = null;
  async function getSarabunBase64(): Promise<string> {
    if (sarabunBase64) return sarabunBase64;
    try {
      const res = await fetch("https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sarabun/Sarabun-Regular.ttf");
      if (!res.ok) throw new Error("Failed to fetch font");
      const arrayBuffer = await res.arrayBuffer();
      sarabunBase64 = Buffer.from(arrayBuffer).toString('base64');
      return sarabunBase64;
    } catch (e) {
      console.error("[Telegram Assistant] Failed to load Sarabun font", e);
      return "";
    }
  }

  async function sendTelegramMessage(chatId: string | number, text: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("[Telegram] TELEGRAM_BOT_TOKEN is missing");
      return;
    }
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[Telegram sendMessage error]", err);
    }
  }

  async function sendTelegramDocument(chatId: string | number, documentUrl: string, caption?: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("[Telegram] TELEGRAM_BOT_TOKEN is missing");
      return;
    }
    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        document: documentUrl,
        caption: caption
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[Telegram sendDocument error]", err);
    }
  }

  async function handleTelegramMessage(text: string, chatId: number | string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn("[Telegram Assistant] TELEGRAM_BOT_TOKEN is missing");
      return;
    }

    if (text.startsWith('/start') || text.startsWith('/help')) {
      await sendTelegramMessage(chatId, `สวัสดีค่ะ! ฉันคือผู้ช่วยบันทึกงานและออกใบเสนอราคาอัจฉริยะ (DocFlow Assistant)\n\nคุณสามารถสั่งงานฉันได้ เช่น:\n👉 "ออกใบเสนอราคา ออกแบบแบนเนอร์ 3500 บาท สำหรับ บริษัท สินดี จำกัด"`);
      return;
    }

    let tasksContext = "";
    let clientsContext = "";
    let ideasContext = "";

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const [tasksRes, clientsRes, ideasRes] = await Promise.all([
          supabase.from('tasks').select('*'),
          supabase.from('clients').select('*'),
          supabase.from('ideas').select('*')
        ]);
        if (tasksRes.data) {
          tasksContext = tasksRes.data.map(t => `- งาน: ${t.name} (ลูกค้า: ${t.customer || 'ไม่มี'}, ผู้ทำ: ${t.assignee || 'ยังไม่มอบหมาย'}, สถานะ: ${t.status || 'To Do'}, ราคา: ${t.price || 0} บาท, กำหนดส่ง: ${t.endDate || 'ไม่มี'}, รายละเอียด: ${t.details || 'ไม่มี'})`).join('\n');
        }
        if (clientsRes.data) {
          clientsContext = clientsRes.data.map(c => `- ลูกค้า: ${c.name} (Budget: ${c.targetBudget || 0} บาท, อีเมล/ติดต่อ: ${c.contactInfo || 'ไม่มี'})`).join('\n');
        }
        if (ideasRes.data) {
          ideasContext = ideasRes.data.map(i => `- ไอเดีย: ${i.title} (รายละเอียด: ${i.concept || 'ไม่มี'}, แพลตฟอร์ม: ${i.platform || 'ไม่มี'}, ผู้ลง: ${i.author || 'ไม่มี'})`).join('\n');
        }
      } catch (dbErr) {
        console.error("[Telegram Assistant] Error loading db context:", dbErr);
      }
    }

    try {
      const systemPrompt = `คุณคือผู้ช่วยจดบันทึกงานและสร้างใบเสนอราคาอัจฉริยะ (DocFlow Assistant)
ทำหน้าที่วิเคราะห์ข้อความพิมพ์ดิบในแชท เพื่อสร้างงาน/ดีลใหม่ และตอบคำถามทั่วไปเกี่ยวกับโปรเจกต์/ลูกค้า/ไอเดียที่มีอยู่ในระบบ

นี่คือข้อมูลปัจจุบันในระบบเว็บ DocFlow:
---
[รายการงานทั้งหมด]
${tasksContext || 'ไม่มีข้อมูลงาน'}

[รายการลูกค้าทั้งหมด]
${clientsContext || 'ไม่มีข้อมูลลูกค้า'}

[รายการไอเดียทั้งหมด]
${ideasContext || 'ไม่มีข้อมูลไอเดีย'}
---

ความสามารถและเงื่อนไขการตอบกลับ:
1. หากผู้ใช้สั่งงาน เช่น "ออกใบเสนอราคา ออกแบบแบนเนอร์ 3500 บาท สำหรับ บริษัท สินดี จำกัด" 
   ให้วิเคราะห์และสร้างใบเสนอราคาโดยตอบกลับเป็น JSON รูปแบบนี้รูปเดียวเท่านั้น (ห้ามมีคำพูดอธิบายอื่นนอกจาก JSON และห้ามใส่ markdown block):
   {
     "action": "create_quotation",
     "customerName": "บริษัท สินดี จำกัด",
     "taskName": "ออกแบบแบนเนอร์โฆษณา",
     "price": 3500,
     "details": "ทำกราฟิก 5 ภาพ",
     "items": [
       { "description": "ทำกราฟิก 5 ภาพ", "amount": 3500 }
     ]
   }

2. หากผู้ใช้ถามคำถามเกี่ยวกับงาน ลูกค้า หรือไอเดียในระบบ เช่น "งานของบริษัท สินดี จำกัด ใครรับผิดชอบ?", "สัปดาห์นี้มีงานอะไรบ้าง?", "ลูกค้าทั้งหมดมีใครบ้าง?"
   ให้ตอบกลับด้วยข้อความอธิบายเป็นภาษาไทยตามความจริงจากข้อมูลที่ได้รับด้านบน โดยกำหนดโครงสร้าง JSON ดังนี้ (ห้ามมีคำพูดอื่นนอกจาก JSON):
   {
     "action": "other",
     "replyText": "[คำตอบของคุณที่นี่ อ้างอิงจากข้อมูลด้านบนอย่างแม่นยำ สรุปให้อ่านง่าย ชัดเจน]"
   }

3. หากผู้ใช้พูดคุยทั่วไป หรือข้อมูลไม่พอสร้างใบเสนอราคา ให้ตอบกลับด้วย:
   {
     "action": "other",
     "replyText": "สวัสดีค่ะ! ต้องการให้ฉันช่วยจดงานหรือสอบถามข้อมูลงาน/ลูกค้า พิมพ์ถามรายละเอียดมาได้เลยนะคะ"
   }`;

      const aiResponse = await generateWithAI(systemPrompt, text);
      let parsed: any;
      try {
        parsed = JSON.parse(aiResponse.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (e) {
        console.error("[Telegram Assistant] Failed to parse AI response:", aiResponse);
        return;
      }

      if (parsed.action === 'create_quotation') {
        const { customerName, taskName, price, details, items } = parsed;

        // Save to Supabase Tasks
        const taskId = `task-tg-${Date.now()}`;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
        
        let dbSaved = false;
        let pdfUrl = "";

        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          
          // Get or create client
          let clientId: string | null = null;
          if (customerName) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('id')
              .eq('name', customerName)
              .maybeSingle();
            
            if (clientData) {
              clientId = clientData.id;
            } else {
              clientId = `client-${Date.now()}`;
              await supabase.from('clients').insert({
                id: clientId,
                name: customerName,
                targetBudget: price
              });
            }
          }

          // Generate PDF using jsPDF
          const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          
          const fontBase64 = await getSarabunBase64();
          if (fontBase64) {
            doc.addFileToVFS("Sarabun-Regular.ttf", fontBase64);
            doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
            doc.setFont("Sarabun");
          }

          // Write PDF content
          doc.setFontSize(22);
          doc.text("ใบเสนอราคา / Quotation", 20, 25);
          
          doc.setFontSize(10);
          doc.text(`เลขที่เอกสาร: QT-${Date.now().toString().slice(-6)}`, 140, 20);
          doc.text(`วันที่ออก: ${new Date().toLocaleDateString('th-TH')}`, 140, 25);
          
          doc.line(20, 32, 190, 32);
          
          doc.setFontSize(11);
          doc.text("ข้อมูลผู้เสนอราคา:", 20, 42);
          doc.text("DocFlow Workspace Co., Ltd.", 20, 48);
          doc.text("อีเมล: contact@docflow.app", 20, 54);
          
          doc.text("ข้อมูลผู้รับเสนอราคา (ลูกค้า):", 110, 42);
          doc.text(customerName || "-", 110, 48);
          
          doc.line(20, 62, 190, 62);
          
          doc.setFontSize(12);
          doc.text(`ชื่อโครงการ/งาน: ${taskName}`, 20, 72);
          
          // Draw Table Header
          doc.setFontSize(10);
          doc.setFillColor(240, 240, 240);
          doc.rect(20, 80, 170, 8, "F");
          doc.text("รายละเอียดรายการงาน (Items / Scope)", 22, 85);
          doc.text("จำนวนเงิน (THB)", 150, 85);
          
          let currentY = 95;
          const pdfItems = items || [{ description: taskName, amount: price }];
          pdfItems.forEach((item: any, idx: number) => {
            doc.text(`${idx + 1}. ${item.description || item.name || taskName}`, 22, currentY);
            doc.text(`${(item.amount || price).toLocaleString()} .-`, 150, currentY);
            currentY += 10;
          });
          
          doc.line(20, currentY, 190, currentY);
          currentY += 8;
          
          doc.setFontSize(12);
          doc.text("ยอดเงินรวมสุทธิ (Total Amount):", 90, currentY);
          doc.text(`${price.toLocaleString()} บาท`, 150, currentY);
          
          currentY += 15;
          doc.setFontSize(10);
          doc.text("ลงชื่อผู้เสนอราคา .....................................", 110, currentY);

          // Upload PDF to Supabase Storage
          const pdfOutput = doc.output("arraybuffer");
          const buffer = Buffer.from(pdfOutput);
          const fileName = `quotation_${Date.now()}.pdf`;
          const filePath = `quotations/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(filePath, buffer, {
              contentType: 'application/pdf',
              cacheControl: '3600',
              upsert: true
            });
            
          let newAttachments: any[] = [];
          if (!uploadError) {
            const { data: { publicUrl: url } } = supabase.storage
              .from('attachments')
              .getPublicUrl(filePath);
            pdfUrl = url;

            // Build task attachment
            newAttachments.push({
              id: `attach-${Date.now()}`,
              name: `ใบเสนอราคา_${taskName}.pdf`,
              url: pdfUrl,
              path: filePath,
              mimeType: 'application/pdf',
              size: `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`
            });
          } else {
            console.error("[Telegram Assistant] Supabase PDF upload error:", uploadError);
          }

          // Build a mock invoice in the task
          const invoiceNo = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100+Math.random()*900)}`;
          const newInvoice = {
            id: `inv-${Date.now()}`,
            invoiceNo,
            issueDate: new Date().toISOString().slice(0, 10),
            status: 'draft',
            phaseIds: [],
            totalAmount: price,
            notes: details
          };

          const { error: taskError } = await supabase.from('tasks').insert({
            id: taskId,
            name: taskName,
            status: 'ไอเดีย/ร่าง',
            price: price,
            customer: customerName,
            clientId: clientId,
            details: details,
            invoices: JSON.stringify([newInvoice]),
            attachments: newAttachments.length > 0 ? JSON.stringify(newAttachments) : null
          });
          
          if (!taskError) {
            dbSaved = true;
          } else {
            console.error("[Telegram Assistant] Supabase insert task error:", taskError);
          }
        }

        // Send Reply to Telegram
        let messageText = `📄 *บันทึกงานและออกใบเสนอราคาสำเร็จ!*\n\n` +
          `🏢 ลูกค้า: ${customerName || '-'}\n` +
          `✅ ชื่องาน: ${taskName}\n` +
          `💰 ราคา: ${price.toLocaleString()} บาท\n` +
          `📝 รายละเอียด: ${details || '-'}\n\n`;
          
        if (dbSaved) {
          messageText += `บันทึกเข้าระบบเรียบร้อยแล้วค่ะ 🚀`;
        } else {
          messageText += `⚠️ เกิดข้อผิดพลาดในการบันทึกข้อมูล`;
        }

        if (pdfUrl) {
          await sendTelegramDocument(chatId, pdfUrl, messageText);
        } else {
          await sendTelegramMessage(chatId, messageText);
        }
      } else if (parsed.action === 'other' && parsed.replyText) {
        await sendTelegramMessage(chatId, parsed.replyText);
      }
    } catch (err: any) {
      console.error("[Telegram Assistant] handleTelegramMessage error:", err);
    }
  }

  // Telegram webhook receiver
  app.post("/api/telegram/webhook", (req, res) => {
    res.sendStatus(200); // ตอบรับ Telegram ทันที
    const update = req.body || {};
    const message = update.message || update.edited_message;
    if (!message) return;

    const chat = message.chat;
    const text = message.text?.trim() || "";
    const chatId = chat?.id;

    if (chatId) {
      const chatIdStr = String(chatId);
      if (telegramChatId !== chatIdStr) {
        telegramChatId = chatIdStr;
        console.log(`[Telegram] บันทึก Chat ID: ${telegramChatId}`);
      }
    }

    if (text) {
      // ตอบกลับหากมีคำสำคัญ หรือเริ่มด้วย / หรือพิมพ์หาบอท
      const isTriggered = text.includes('เสนอราคา') || text.includes('ใบเสนอราคา') || text.startsWith('/');
      if (isTriggered) {
        handleTelegramMessage(text, chatId).catch(err => {
          console.error("[Telegram Webhook Error]", err);
        });
      }
    }
  });

  // ดู Chat ID ล่าสุด
  app.get("/api/telegram/chat-id", (_req, res) => {
    res.json({ chatId: telegramChatId || null });
  });

  // Telegram push notification
  app.post("/api/notify/telegram", async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      return res.status(503).json({ error: "TELEGRAM_BOT_TOKEN ยังไม่ได้ตั้งค่าในไฟล์ .env" });
    }
    if (!chatId) {
      return res.status(503).json({ error: "ยังไม่มี TELEGRAM_CHAT_ID — ส่งข้อความหาบอทในแชทก่อน แล้วลองใหม่" });
    }

    const { taskName, assignee, dueDate, endDate, fileUrl, details, customer } = req.body;
    if (!taskName || !assignee) {
      return res.status(400).json({ error: "ต้องระบุ taskName และ assignee" });
    }

    const targetDate = endDate || dueDate;
    const lines = [
      '📋 มอบหมายงานใหม่!',
      '━━━━━━━━━━━━━━━',
      `✅ งาน: ${taskName}`,
      `👤 มอบให้: ${assignee}`,
      customer   ? `🏢 ลูกค้า: ${customer}` : '',
      targetDate ? `📅 กำหนดส่ง: ${targetDate}` : '',
      details    ? `📝 ${details.slice(0, 120)}${details.length > 120 ? '...' : ''}` : '',
      fileUrl    ? `🔗 ${fileUrl}` : '',
      '━━━━━━━━━━━━━━━',
      'ส่งจาก DocFlow 🚀',
    ].filter(Boolean).join('\n');

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines
        })
      });
      if (!response.ok) {
        const err = await response.text();
        console.error("[Telegram Push Error]", err);
        return res.status(response.status).json({ error: err || "Telegram API error" });
      }
      return res.json({ ok: true });
    } catch (e: any) {
      console.error("[Telegram] Push fetch error:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // Telegram push notification for due-soon tasks (within 5 days)
  const handleDueSoon = async (req: any, res: any) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token) {
      return res.status(503).json({ error: "TELEGRAM_BOT_TOKEN ยังไม่ได้ตั้งค่าในไฟล์ .env" });
    }
    if (!chatId) {
      return res.status(503).json({ error: "ยังไม่มี TELEGRAM_CHAT_ID — ส่งข้อความหาบอทในแชทก่อน แล้วลองใหม่" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*');

      if (error) throw error;

      const today = new Date();
      // Set to start of today local time
      today.setHours(0,0,0,0);
      const fiveDaysLater = new Date();
      fiveDaysLater.setDate(today.getDate() + 5);
      fiveDaysLater.setHours(23,59,59,999);

      const dueSoonTasks = (tasks || []).filter((task: any) => {
        if (!task.endDate) return false;
        if (task.status === 'เสร็จสิ้น' || task.status === 'Done') return false;
        const endDateVal = new Date(task.endDate);
        return endDateVal >= today && endDateVal <= fiveDaysLater;
      });

      if (dueSoonTasks.length === 0) {
        return res.json({ ok: true, message: "ไม่มีงานที่ใกล้ครบกำหนดใน 5 วัน" });
      }

      let message = `⚠️ *แจ้งเตือนงานใกล้ครบกำหนด (ใน 5 วัน)*\n`;
      message += `━━━━━━━━━━━━━━━\n`;
      dueSoonTasks.forEach((task: any) => {
        message += `✅ งาน: ${task.name}\n`;
        message += `👤 มอบหมาย: ${task.assignee || 'ไม่มี'}\n`;
        message += `📅 กำหนดส่ง: ${task.endDate}\n`;
        message += `🏢 ลูกค้า: ${task.customer || '-'}\n`;
        message += `━━━━━━━━━━━━━━━\n`;
      });
      message += `ส่งจาก DocFlow 🚀`;

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown"
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Telegram Due Soon Push Error]", errText);
        return res.status(response.status).json({ error: errText || "Telegram API error" });
      }

      return res.json({ ok: true, notifiedCount: dueSoonTasks.length });
    } catch (e: any) {
      console.error("[Telegram] Due soon fetch error:", e);
      return res.status(500).json({ error: e.message });
    }
  };

  app.get("/api/notify/due-soon", handleDueSoon);
  app.post("/api/notify/due-soon", handleDueSoon);
  app.get("/api/cron/due-soon", handleDueSoon);
  app.post("/api/cron/due-soon", handleDueSoon);

  // GET and POST for daily briefing
  const handleDailyBriefing = async (req: any, res: any) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token) return res.status(503).json({ error: "TELEGRAM_BOT_TOKEN ยังไม่ได้ตั้งค่าในไฟล์ .env" });
    if (!chatId) return res.status(503).json({ error: "ยังไม่มี TELEGRAM_CHAT_ID — ส่งข้อความหาบอทในแชทก่อน แล้วลองใหม่" });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const [tasksRes, clientsRes, ideasRes] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('ideas').select('*')
      ]);

      const tasks = tasksRes.data || [];
      const clients = clientsRes.data || [];
      const ideas = ideasRes.data || [];

      // Filter tasks due today & overdue
      const localTodayStr = new Date().toLocaleDateString('en-CA'); // Local date YYYY-MM-DD
      
      const overdueTasks = tasks.filter(t => {
        if (!t.endDate) return false;
        if (t.status === 'เสร็จสิ้น' || t.status === 'Done') return false;
        return t.endDate < localTodayStr;
      });

      const todayTasks = tasks.filter(t => {
        if (!t.endDate) return false;
        if (t.status === 'เสร็จสิ้น' || t.status === 'Done') return false;
        return t.endDate === localTodayStr;
      });

      const pendingCount = tasks.filter(t => t.status !== 'เสร็จสิ้น' && t.status !== 'Done').length;
      const completedCount = tasks.filter(t => t.status === 'เสร็จสิ้น' || t.status === 'Done').length;

      const systemInstruction = `คุณคือ "Modty" ผู้ช่วย AI ส่วนตัวแสนดีที่ฉลาดและเป็นกันเอง คุยสนุก ใช้ emoji น่ารักๆ
หน้าที่ของคุณคือสรุปงานวันนี้ (Daily Briefing) ตอนเช้าให้คุณ Modty (ผู้ใช้งาน) ฟังเป็นภาษาไทยสั้นกระชับ เป็นกันเอง สุภาพแต่เหมือนเพื่อนสนิท`;

      const userPrompt = `วันนี้วันที่: ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
สถานะของบอร์ดงานปัจจุบัน:
- งานทั้งหมด: ${tasks.length} งาน (เสร็จแล้ว ${completedCount} งาน, กำลังทำ/ค้างอยู่ ${pendingCount} งาน)
- งานที่ต้องส่งวันนี้: ${todayTasks.length > 0 ? todayTasks.map(t => `- ${t.name} (ลูกค้า: ${t.customer || '-'}, มอบหมาย: ${t.assignee || 'ยังไม่มอบหมาย'})`).join('\n') : 'ไม่มีงานที่ต้องส่งวันนี้'}
- งานที่เลยกำหนดส่งแล้ว (Overdue): ${overdueTasks.length > 0 ? overdueTasks.map(t => `- ${t.name} (กำหนดส่งเดิม: ${t.endDate}, มอบหมาย: ${t.assignee || 'ยังไม่มอบหมาย'})`).join('\n') : 'ไม่มีงานเลยกำหนด'}
- จำนวนลูกค้าทั้งหมด: ${clients.length} ราย
- จำนวนไอเดียคอนเทนต์: ${ideas.length} ไอเดีย

โปรดสรุปและกล่าวคำทักทายตอนเช้าสั้นๆ ให้พลังบวกและโฟกัสงานที่ต้องทำวันนี้ (เน้นย้ำงานต้องส่งวันนี้ และเตือนเรื่องงานเลยกำหนดแบบสุภาพ/ขี้เล่น)
ความยาวประมาณ 2-3 ย่อหน้าสั้นๆ ใส่ Emoji สนุกสนานและจัดหน้าอ่านง่าย`;

      const summaryText = await generateWithAI(systemInstruction, userPrompt);

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: summaryText,
          parse_mode: "Markdown"
        })
      });

      if (!response.ok) {
        // Fallback if markdown parsing fails
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: summaryText
          })
        });
      }

      return res.json({ ok: true, type: 'daily-briefing', message: 'ส่งรายงานสรุปประจำวันสำเร็จ' });
    } catch (e: any) {
      console.error("[Cron Daily Briefing Error]", e);
      return res.status(500).json({ error: e.message });
    }
  };

  app.get("/api/cron/daily-briefing", handleDailyBriefing);
  app.post("/api/cron/daily-briefing", handleDailyBriefing);

  // GET and POST for weekly business analysis
  const handleWeeklyAnalysis = async (req: any, res: any) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!token) return res.status(503).json({ error: "TELEGRAM_BOT_TOKEN ยังไม่ได้ตั้งค่าในไฟล์ .env" });
    if (!chatId) return res.status(503).json({ error: "ยังไม่มี TELEGRAM_CHAT_ID — ส่งข้อความหาบอทในแชทก่อน แล้วลองใหม่" });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: "Missing Supabase configuration" });
    }

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const [tasksRes, clientsRes, ideasRes] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('ideas').select('*')
      ]);

      const tasks = tasksRes.data || [];
      const clients = clientsRes.data || [];
      const ideas = ideasRes.data || [];

      // Context construction
      const tasksContext = tasks.map(t => `- งาน: ${t.name} (ลูกค้า: ${t.customer || 'ไม่มี'}, ผู้รับผิดชอบ: ${t.assignee || 'ยังไม่มอบหมาย'}, สถานะ: ${t.status}, ราคา: ${t.price || 0} บาท, กำหนดส่ง: ${t.endDate || 'ไม่มี'})`).join('\n');
      const clientsContext = clients.map(c => `- ลูกค้า: ${c.name} (เป้าหมายงบประมาณ: ${c.targetBudget || 0} บาท, ข้อมูลติดต่อ: ${c.contactInfo || 'ไม่มี'})`).join('\n');
      const ideasContext = ideas.map(i => `- ไอเดีย: ${i.title} (แนวคิด: ${i.concept || 'ไม่มี'}, แพลตฟอร์ม: ${i.platform || 'ไม่มี'})`).join('\n');

      const systemInstruction = `คุณคือ "Modty" ผู้ช่วย AI และนักวิเคราะห์ธุรกิจส่วนตัวที่เก่งกาจและเป็นกันเอง
หน้าที่ของคุณคือวิเคราะห์ภาพรวมธุรกิจประจำสัปดาห์ (Weekly Business Analysis / Analyse My Business) จากข้อมูลในระบบ DocFlow และส่งรายงานเป็นภาษาไทยให้เจ้าของธุรกิจอ่านเข้าใจง่าย ได้แรงบันดาลใจ และเห็นทิศทางชัดเจน`;

      const userPrompt = `นี่คือข้อมูลล่าสุดในระบบ:
---
[งานทั้งหมด]
${tasksContext || 'ไม่มีงานในระบบ'}

[ลูกค้าทั้งหมด]
${clientsContext || 'ไม่มีรายชื่อลูกค้า'}

[ไอเดียคอนเทนต์]
${ideasContext || 'ไม่มีไอเดียคอนเทนต์'}
---

ช่วยทำการวิเคราะห์วิเคราะห์ธุรกิจประจำสัปดาห์เชิงลึก (Analyse My Business) โดยครอบคลุมหัวข้อต่อไปนี้:
1. 📊 *ภาพรวมความคืบหน้า (Business Progress Overview):* สรุปสถานะโครงการ รายได้สะสมหรืองบประมาณรวม
2. ⚠️ *คอขวดและจุดเสี่ยง (Bottlenecks & Risks):* ชี้จุดที่ค้างส่ง (Overdue) หรืองานที่ใช้เวลานานผิดปกติ
3. 💡 *โอกาสและไอเดียธุรกิจใหม่ๆ (Ideas & Growth Opportunities):* เสนอแนะการนำไอเดียคอนเทนต์ที่มีอยู่ไปขยายผล หรือแนะนำแพลตฟอร์มที่ควรขยาย
4. 🚀 *คำแนะนำและสิ่งแรกที่ต้องทำในสัปดาห์นี้ (Actionable Recommendations):* ลำดับความสำคัญสิ่งที่ควรทำทันที 3 ข้อแรก

กรุณาตอบเป็นภาษาไทยจัดย่อหน้าและหัวข้อให้อ่านง่าย มีการใช้ตัวหนา/ตัวเอียง/อีโมจิ เพื่อให้อ่านง่าย สไตล์เพื่อนคุยธุรกิจอย่างเป็นกันเองและกระตือรือร้น`;

      const analysisText = await generateWithAI(systemInstruction, userPrompt);

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: analysisText,
          parse_mode: "Markdown"
        })
      });

      if (!response.ok) {
        // Fallback if markdown parsing fails
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: analysisText
          })
        });
      }

      return res.json({ ok: true, type: 'weekly-analysis', message: 'ส่งรายงานวิเคราะห์ประจำสัปดาห์สำเร็จ' });
    } catch (e: any) {
      console.error("[Cron Weekly Analysis Error]", e);
      return res.status(500).json({ error: e.message });
    }
  };

  app.get("/api/cron/weekly-analysis", handleWeeklyAnalysis);
  app.post("/api/cron/weekly-analysis", handleWeeklyAnalysis);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // ── Notion Content Plan Sync ─────────────────────────────────────────────
  const NOTION_HEADERS = () => ({
    'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  });

  function buildNotionChildren(plan: any) {
    const blocks: any[] = [];
    const richText = (text: string) => [{ type: 'text', text: { content: String(text).slice(0, 2000) } }];

    if (plan.concept) {
      blocks.push({ object: 'block', type: 'heading_2', heading_2: { rich_text: richText('ไอเดีย / คอนเซ็ปต์') } });
      blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(plan.concept) } });
    }
    if (plan.toneOfVoice || plan.targetAudience) {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: richText('โทนเสียง & กลุ่มเป้าหมาย') } });
      if (plan.toneOfVoice)   blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(`โทน: ${plan.toneOfVoice}`) } });
      if (plan.targetAudience) blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(`กลุ่มเป้าหมาย: ${plan.targetAudience}`) } });
    }
    if (plan.aiHooks && plan.aiHooks.length > 0) {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: richText('Hooks') } });
      plan.aiHooks.forEach((h: string) => blocks.push({ object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: richText(h) } }));
    }
    if (plan.aiOutline) {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: richText('Outline') } });
      blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(plan.aiOutline) } });
    }
    if (plan.aiScript) {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: richText('Script / Caption') } });
      blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(plan.aiScript) } });
    }
    if (plan.aiHashtags) {
      blocks.push({ object: 'block', type: 'heading_3', heading_3: { rich_text: richText('Hashtags') } });
      blocks.push({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(plan.aiHashtags) } });
    }
    return blocks;
  }

  // GET all Notion content plans
  app.get('/api/notion/content-plans', async (_req, res) => {
    try {
      const dbId = process.env.NOTION_CONTENT_DB_ID;
      if (!process.env.NOTION_TOKEN || !dbId) return res.status(400).json({ error: 'Notion not configured' });
      const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
        method: 'POST',
        headers: NOTION_HEADERS(),
        body: JSON.stringify({ sorts: [{ property: 'Created time', direction: 'descending' }] }),
      });
      const data = await r.json() as any;
      const plans = (data.results || []).map((page: any) => {
        const props = page.properties;
        const platformRaw: string[] = (props['Platform ']?.multi_select || []).map((s: any) => s.name as string);
        const platformMap: Record<string, string> = { TIKTOK: 'TikTok', FB: 'Facebook', IG: 'Instagram' };
        const s = props['Status']?.status?.name || 'Not started';
        return {
          id: page.id,
          notionPageId: page.id,
          title: props['Name']?.title?.[0]?.plain_text || props['name']?.title?.[0]?.plain_text || '',
          concept: props['Details']?.rich_text?.[0]?.plain_text || '',
          platform: platformMap[platformRaw[0]] || platformRaw[0] || 'อื่นๆ',
          status: s === 'Done' ? 'เผยแพร่แล้ว' : s === 'In progress' ? 'กำลังผลิต' : 'ไอเดีย/ร่าง',
          createdAt: page.created_time,
          notionUrl: page.url,
        };
      });
      res.json(plans);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Create a new Notion page for a content plan (supports both singular and plural URL)
  async function createNotionContentPlan(req: any, res: any) {
    try {
      const dbId = process.env.NOTION_CONTENT_DB_ID;
      if (!process.env.NOTION_TOKEN || !dbId) return res.status(400).json({ error: 'Notion not configured' });
      const plan = req.body;
      const response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: NOTION_HEADERS(),
        body: JSON.stringify({
          parent: { database_id: dbId },
          properties: {
            title: { title: [{ text: { content: plan.title || 'Untitled' } }] },
          },
          children: buildNotionChildren(plan),
        }),
      });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: data.message });
      res.json({ notionPageId: data.id, id: data.id, notionUrl: data.url });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
  app.post('/api/notion/content-plan', createNotionContentPlan);
  app.post('/api/notion/content-plans', createNotionContentPlan);


  // Update an existing Notion page (replace all children blocks)
  app.patch('/api/notion/content-plan/:pageId', async (req, res) => {
    try {
      if (!process.env.NOTION_TOKEN) return res.status(400).json({ error: 'Notion not configured' });
      const { pageId } = req.params;
      const plan = req.body;

      // Update title
      await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'PATCH',
        headers: NOTION_HEADERS(),
        body: JSON.stringify({
          properties: {
            title: { title: [{ text: { content: plan.title || 'Untitled' } }] },
          },
        }),
      });

      // Get existing blocks and delete them
      const listRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, { headers: NOTION_HEADERS() });
      const listData = await listRes.json();
      if (listData.results) {
        await Promise.all(listData.results.map((b: any) =>
          fetch(`https://api.notion.com/v1/blocks/${b.id}`, { method: 'DELETE', headers: NOTION_HEADERS() })
        ));
      }

      // Append new blocks
      await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        method: 'PATCH',
        headers: NOTION_HEADERS(),
        body: JSON.stringify({ children: buildNotionChildren(plan) }),
      });

      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
  // Alias: plural URL
  app.patch('/api/notion/content-plans/:pageId', async (req, res) => {
    req.params.pageId = req.params.pageId;
    // Reuse same logic by delegating to singular
    try {
      if (!process.env.NOTION_TOKEN) return res.status(400).json({ error: 'Notion not configured' });
      const { pageId } = req.params;
      const plan = req.body;
      await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'PATCH',
        headers: NOTION_HEADERS(),
        body: JSON.stringify({ properties: { title: { title: [{ text: { content: plan.title || 'Untitled' } }] } } }),
      });
      const listRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, { headers: NOTION_HEADERS() });
      const listData = await listRes.json();
      if (listData.results) {
        await Promise.all(listData.results.map((b: any) =>
          fetch(`https://api.notion.com/v1/blocks/${b.id}`, { method: 'DELETE', headers: NOTION_HEADERS() })
        ));
      }
      await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        method: 'PATCH', headers: NOTION_HEADERS(), body: JSON.stringify({ children: buildNotionChildren(plan) }),
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
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
