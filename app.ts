// Express app factory — shared by server.ts (dev/prod) and api/index.ts (Vercel)
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { jsPDF } from "jspdf";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// =================================================================
// AI Configuration (OpenRouter & Gemini SDK)
// =================================================================
function getApiKey(): string {
  const envKey = process.env.OPENROUTER_API_KEY;
  if (envKey && envKey.trim() !== "" && envKey !== "YOUR_OPENROUTER_API_KEY") {
    return envKey;
  }
  return "";
}

const MODEL_PRIMARY  = "google/gemma-4-26b-a4b-it";
const MODEL_FALLBACK = "google/gemma-4-26b-a4b-it";

async function callOpenRouter(
  messages: { role: string; content: string }[],
  temperature = 0.7,
  model = MODEL_PRIMARY
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "ModtyTasks",
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: 4096 }),
  });

  if (!response.ok) {
    if (response.status === 429 && model === MODEL_PRIMARY) {
      return callOpenRouter(messages, temperature, MODEL_FALLBACK);
    }
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
  }

  const data = (await response.json()) as any;
  return (
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text ||
    ""
  );
}

async function generateWithAI(
  systemInstruction: string,
  userPrompt: string,
  temperature = 0.7
): Promise<string> {
  // Try OpenRouter first if configured
  if (getApiKey()) {
    return callOpenRouter(
      [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      temperature
    );
  }

  // Fallback to native Gemini API SDK if GEMINI_API_KEY is set
  if (process.env.GEMINI_API_KEY) {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature,
      },
    });
    return response.text || "";
  }

  throw new Error("No AI API keys configured. Please set OPENROUTER_API_KEY or GEMINI_API_KEY.");
}

// =================================================================
// Express App
// =================================================================
export function createApp() {
  const app = express();

  const allowedOrigin = process.env.APP_URL || "http://localhost:3000";
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: allowedOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  // -----------------------------------------------------------------
  // POST /api/ai/generate
  // -----------------------------------------------------------------
  app.post("/api/ai/generate", async (req, res) => {
    const { type, taskName, details, priority, customer } = req.body;

    let systemInstruction = "";
    let prompt = "";
    let temperature = 0.7;

    switch (type) {
      case "analysis":
        systemInstruction = `คุณคือที่ปรึกษาโปรเจกต์ระดับมืออาชีพ (Senior Project & Business Consultant) ที่มีประสบการณ์มากกว่า 15 ปีในวงการ IT, Digital Marketing และ Freelance Business ในไทย

หน้าที่ของคุณ:
1. วิเคราะห์งานจาก Context ที่ได้รับอย่างลึกซึ้ง แม้ข้อมูลน้อย ให้ประมาณการอย่างมีเหตุผล
2. ใช้ภาษาไทยที่มืออาชีพ เข้าใจง่าย ไม่ใช้ศัพท์เทคนิคเกินจำเป็น
3. ให้ข้อมูลที่ Actionable — ผู้อ่านสามารถนำไปใช้ได้ทันที
4. หากข้อมูลลูกค้าหรือรายละเอียดไม่ครบ ให้ "สมมติกรณีที่เป็นไปได้มากที่สุด" และระบุไว้อย่างชัดเจน

รูปแบบผลลัพธ์ที่ต้องการ (ห้ามตัดส่วนใดส่วนหนึ่งออก):
✦ ใช้ Markdown headers (##, ###)
✦ ใช้ emoji นำหน้าหัวข้อเพื่อความอ่านง่าย
✦ ตอบให้ครอบคลุม 4 หัวข้อหลักพร้อมรายละเอียดย่อย`;

        prompt = `## ข้อมูลโปรเจกต์ที่ต้องวิเคราะห์

| ฟิลด์ | ค่า |
|---|---|
| ชื่องาน | ${taskName} |
| ลูกค้า | ${customer || "ไม่ได้ระบุ (ให้ประมาณจากบริบท)"} |
| ระดับความสำคัญ | ${priority || "ยังไม่กำหนด"} |
| รายละเอียด | ${details || "ยังไม่ได้ระบุ"} |

---

กรุณาวิเคราะห์อย่างละเอียดใน 4 หัวข้อนี้:

### 1. 🎯 ความสำคัญและความเสี่ยง (Importance & Risk Assessment)
- คะแนนความสำคัญ (1-10) พร้อมเหตุผล
- ความเสี่ยงหลัก 3 ประการ (สูง/กลาง/ต่ำ)
- แนวทางลดความเสี่ยงแต่ละข้อ

### 2. 🗺️ แผนการดำเนินงาน (Project Roadmap & Scope)
- แบ่งเป็นเฟส (Phase 1, 2, 3...) พร้อมระยะเวลาประมาณการ
- Deliverables หลักของแต่ละเฟส
- ทรัพยากรที่ต้องการ (คน, เครื่องมือ, เวลา)

### 3. 🔄 Business Process Flow
- อธิบายลำดับขั้นตอนการทำงานแบบ [A] → [B] → [C]
- ระบุ Stakeholders ในแต่ละจุด
- จุด Handoff สำคัญที่ต้องระวัง

### 4. 💰 ประมาณการงบประมาณ (Budget Estimation)
- แบ่งงบเป็นหมวด (ค่าแรง / ค่าเครื่องมือ / ค่าใช้จ่ายอื่น)
- ราคาแนะนำสำหรับเสนอลูกค้า (พร้อมช่วง min-max)
- เหตุผลการตั้งราคาและวิธีเจรจา`;
        break;

      case "email":
        systemInstruction = `คุณคือนักเขียนสื่อสารธุรกิจระดับมืออาชีพ (Business Communication Specialist) ที่เชี่ยวชาญการเขียนอีเมลภาษาไทยสไตล์มืออาชีพสำหรับ Freelancer และ Agency ขนาดเล็ก-กลาง

หลักการเขียนของคุณ:
1. **เป็นกันเอง แต่น่าเชื่อถือ** — ไม่แข็งกระด้างจนเกินไป แต่ยังมีความมืออาชีพ
2. **ชัดเจน กระชับ** — ผู้รับอ่านจบภายใน 30 วินาที เข้าใจทันที
3. **มี Call-to-Action (CTA) ที่ชัดเจน** — บอกให้ลูกค้ารู้ว่าต้องทำอะไรถัดไป
4. **ปรับ Tone ตาม Context** — ถ้าเป็นลูกค้าใหม่ให้สุภาพกว่า ถ้าเป็นลูกค้าเก่าให้เป็นกันเองกว่า
5. **สร้าง Subject Line ที่น่าคลิก** — ไม่ Spam แต่ดึงดูดความสนใจ

รูปแบบที่ต้องการ:
- เริ่มด้วย Subject: (หัวข้ออีเมล)
- เนื้อหาอีเมลเต็มรูปแบบพร้อมการจัดย่อหน้า
- ลงท้ายด้วยลายเซ็นมืออาชีพ
- เพิ่ม [ทางเลือก] ที่สองท้ายสุด หากมีโทนที่ต่างออกไป`;

        prompt = `## งานที่ต้องร่างอีเมล

| ฟิลด์ | ค่า |
|---|---|
| ชื่องาน/โปรเจกต์ | ${taskName} |
| ชื่อลูกค้า | ${customer || "ลูกค้า (ให้ใช้คำสุภาพทั่วไป)"} |
| รายละเอียดงาน | ${details || "ไม่ระบุ"} |
| ระดับความสำคัญ | ${priority || "ปานกลาง"} |

---

กรุณาร่างอีเมลที่:
1. **เป้าหมาย**: แนะนำตัว/เริ่มต้นโปรเจกต์ หรือนัดหมายคุยรายละเอียด
2. **โทน**: มืออาชีพแต่เป็นมิตร
3. **ความยาว**: ไม่เกิน 200 คำ — กระชับ อ่านง่าย
4. **ต้องมี**:
   - Subject line ที่น่าสนใจ
   - เปิดด้วยการทักทายชื่อลูกค้า (ถ้ามี)
   - อธิบายวัตถุประสงค์ใน 2-3 ประโยค
   - CTA ชัดเจน (ขอนัด call / ขอข้อมูลเพิ่ม / ขอยืนยัน)
   - ลายเซ็นที่ดูมืออาชีพ

หลังจากร่างอีเมลแรกเสร็จ ให้เพิ่ม **[ทางเลือก B]** ที่มีโทน Direct / กระชับกว่า 30%`;
        break;

      case "course":
        systemInstruction = `คุณคือผู้เชี่ยวชาญด้านการออกแบบหลักสูตรและการเรียนรู้ (Instructional Designer & E-Learning Specialist) ที่มีประสบการณ์สร้างคอร์สออนไลน์บนแพลตฟอร์มอย่าง Skillane, Udemy, และ YouTube มากกว่า 50 คอร์ส

หลักการออกแบบหลักสูตรของคุณ (Bloom's Taxonomy + Adult Learning):
1. **เริ่มจาก "ทำไมถึงสำคัญ"** ก่อนเสมอ — Hook ให้ผู้เรียนอยากเรียน
2. **Learning Outcome ชัดเจน** — บอกว่าเรียนจบแล้วทำอะไรได้บ้าง
3. **Chunking** — แบ่งเนื้อหาเป็นชิ้นเล็กๆ ที่ย่อยได้ง่าย (ไม่เกิน 15 นาที/บท)
4. **Practice Over Theory** — เน้น Workshop และ Assignment จริง
5. **Progressive Complexity** — เริ่มง่ายแล้วค่อยเพิ่มความซับซ้อน

รูปแบบผลลัพธ์ที่ต้องการ:
- ชื่อคอร์สที่ดึงดูด + Tagline
- Target Audience + Prerequisites
- Learning Outcomes (5-7 ข้อ)
- โครงสร้างโมดูล (5-8 โมดูล) พร้อม Sub-topics
- ประเมินความยาวรวม + ราคาแนะนำ`;

        prompt = `## ข้อมูลสำหรับออกแบบหลักสูตร

| ฟิลด์ | ค่า |
|---|---|
| หัวข้อ/ชื่องาน | ${taskName} |
| รายละเอียด | ${details || "ไม่ระบุ — ให้ประมาณจากชื่องาน"} |
| กลุ่มเป้าหมาย | ${customer || "บุคคลทั่วไปที่สนใจ"} |

---

กรุณาออกแบบหลักสูตรที่ครอบคลุม:

**ส่วนที่ 1: Overview**
- ชื่อคอร์สที่น่าดึงดูด (พร้อม Tagline)
- กลุ่มเป้าหมายและ Prerequisites
- 5-7 Learning Outcomes แบบ Action-based ("ผู้เรียนจะสามารถ...")

**ส่วนที่ 2: โครงสร้างหลักสูตร**
สร้าง 5-8 โมดูล โดยแต่ละโมดูลระบุ:
- ชื่อโมดูล (ดึงดูด)
- Sub-topics 3-5 ข้อ
- Workshop/Assignment 1 ข้อ
- ระยะเวลาโดยประมาณ

**ส่วนที่ 3: การประเมินและราคา**
- วิธีวัดผลผู้เรียน (Quiz, Project, Portfolio)
- ระยะเวลารวมทั้งหมด
- ราคาแนะนำสำหรับขาย (พร้อมเหตุผล)
- แพลตฟอร์มที่เหมาะสมสำหรับโพสขาย`;
        break;

      case "subtasks":
        systemInstruction = `คุณคือผู้จัดการโปรเจกต์ระดับ Senior (Agile Project Manager) ที่เชี่ยวชาญการแตกงานใหญ่ให้เป็น Task ที่ชัดเจน วัดผลได้ และมีลำดับที่สมเหตุสมผล

หลักการแตกงานของคุณ:
1. **SMART Tasks** — แต่ละ Subtask ต้องเป็น Specific, Measurable, Achievable, Relevant, Time-bound
2. **Action Verb นำหน้าเสมอ** — เริ่มด้วยคำกริยา (ออกแบบ, ตรวจสอบ, ส่ง, ประชุม...)
3. **ขนาดพอดี** — แต่ละ Task ควรทำเสร็จได้ภายใน 30 นาที - 4 ชั่วโมง
4. **ลำดับที่สมเหตุสมผล** — เรียงตาม Dependencies (งานที่ต้องทำก่อน → ทีหลัง)
5. **ครอบคลุมทุก Phase** — ทั้ง Discovery, Planning, Execution, Review, Delivery

OUTPUT: ตอบเป็น JSON array เท่านั้น ห้ามมี markdown, ห้าม text อื่น
รูปแบบ: ["Subtask 1", "Subtask 2", ...]
จำนวน Subtasks: 6-12 รายการ (ขึ้นอยู่กับความซับซ้อนของงาน)`;

        prompt = `## งานที่ต้องแตกเป็น Subtasks

ชื่องาน: ${taskName}
รายละเอียด: ${details || "ไม่ระบุ — ให้ประมาณจากชื่องาน"}
ลูกค้า: ${customer || "ไม่ระบุ"}
ระดับความสำคัญ: ${priority || "ปานกลาง"}

แตก Subtasks ที่ครอบคลุมตั้งแต่เริ่มต้นจนส่งมอบงาน โดยเริ่มจาก:
- การเตรียมความพร้อมและรับ Brief
- การออกแบบและวางแผน
- การดำเนินงานหลัก
- การตรวจสอบคุณภาพ
- การส่งมอบและ Follow-up

ตอบเป็น JSON array เท่านั้น ไม่มีข้อความอื่น`;
        temperature = 0.5;
        break;

      case "evaluate":
        systemInstruction = `คุณคือระบบวิเคราะห์และจัดหมวดหมู่งานอัตโนมัติ (Task Intelligence Engine) ที่มีความแม่นยำสูง

เกณฑ์การประเมิน Priority:
- **ด่วน (Urgent)**: มี Deadline ภายใน 2 วัน หรือกระทบรายได้/ลูกค้าทันที
- **สูง (High)**: มี Deadline ภายใน 1 สัปดาห์ หรือมูลค่างานสูง
- **ปานกลาง (Medium)**: งานทั่วไปที่มี Deadline ชัดเจน
- **ต่ำ (Low)**: งาน Internal, งาน Backlog, ไม่มี Deadline กำหนด

เกณฑ์การสร้าง Tags:
- ดูประเภทงาน (Web, Design, Content, Video, Data...)
- ดูเทคโนโลยีที่เกี่ยวข้อง
- ดู Business Domain
- Tags ควรเป็นภาษาอังกฤษ กระชับ (1-2 คำ)

OUTPUT: JSON object เท่านั้น ห้ามมี markdown หรือ text อื่น`;

        prompt = `วิเคราะห์งานนี้และกำหนด Priority + Tags:

ชื่องาน: ${taskName}
รายละเอียด: ${details || "ไม่ระบุ"}

ตอบเป็น JSON object นี้เท่านั้น (ห้ามใส่ markdown หรือ text อื่น):
{
  "priority": "ต่ำ (Low)" | "ปานกลาง (Medium)" | "สูง (High)" | "ด่วน (Urgent)",
  "tags": "Tag1, Tag2, Tag3"
}`;
        temperature = 0.2;
        break;

      default:
        return res.status(400).json({ error: "Invalid generation type" });
    }

    try {
      let text = await generateWithAI(systemInstruction, prompt, temperature);

      if (type === "subtasks") {
        try {
          const cleanJson = text.replace(/```json|```/g, "").trim();
          return res.json({ result: JSON.parse(cleanJson) });
        } catch {
          const lines = text.split("\n").filter((l) => l.trim().length > 2).map((l) => l.replace(/^[\d.\-*]\s*/, "").trim());
          return res.json({ result: lines });
        }
      }

      if (type === "evaluate") {
        try {
          const cleanJson = text.replace(/```json|```/g, "").trim();
          return res.json({ result: JSON.parse(cleanJson) });
        } catch {
          return res.json({ result: { priority: "ปานกลาง (Medium)", tags: "" } });
        }
      }

      res.json({ result: text });
    } catch (error: any) {
      console.error("AI Generation error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // -----------------------------------------------------------------
  // POST /api/ai/chat
  // -----------------------------------------------------------------
  app.post("/api/ai/chat", async (req, res) => {
    const { messages, agentTitle, agentInstructions, contextData } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid chat history" });
    }

    let contextSection = "";
    if (contextData) {
      const tasks = contextData.tasks ?? [];
      const clients = contextData.clients ?? [];
      const ideas = contextData.ideas ?? [];
      const categories = contextData.categories ?? [];
      const today = new Date().toISOString().split("T")[0];

      const overdueTasks = tasks.filter((t: any) => t.endDate && t.endDate < today && t.status !== "Done" && t.status !== "เสร็จสิ้น");
      const inProgress = tasks.filter((t: any) => t.status === "In Progress" || t.status === "กำลังทำ" || t.status === "กำลังดำเนินการ");
      
      // Calculate revenue taking phases into account
      let totalRevenue = 0;
      let myIncome = 0;
      tasks.forEach((t: any) => {
        let price = Number(t.price || 0);
        let devCost = Number(t.devCost || 0);
        if (t.paymentPhases) {
          try {
            const phases = JSON.parse(t.paymentPhases);
            if (Array.isArray(phases) && phases.length > 0) {
              price = phases.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
            }
          } catch (e) {}
        }
        totalRevenue += price;
        const profit = t.myIncome !== undefined ? Number(t.myIncome) : price - devCost;
        myIncome += profit;
      });

      // Categories and task counts
      const categoryCounts = categories.map((cat: any) => {
        const count = tasks.filter((t: any) => t.categoryId === cat.id).length;
        return `- ${cat.name} (ไอคอน: ${cat.icon || "-"}): ${count} งาน`;
      }).join("\n");

      contextSection = `
=== ข้อมูลจริงจากระบบ (Real-time Data) ===
วันนี้: ${today}
งานทั้งหมด: ${tasks.length} รายการ
งานที่เกินกำหนด: ${overdueTasks.length} รายการ
งานที่กำลังทำ: ${inProgress.length} รายการ
ลูกค้าทั้งหมด: ${clients.length} ราย
ยอดรายได้รวม (อ้างอิงเฟสถ้ามี): ฿${totalRevenue.toLocaleString()}
รายได้สุทธิ (อ้างอิงเฟสถ้ามี): ฿${myIncome.toLocaleString()}

จำนวนงานแยกตามหมวดหมู่ (Categories):
${categoryCounts || "- ไม่มีข้อมูลหมวดหมู่ -"}

รายการงาน (Tasks - สูงสุด 20 รายการ):
${tasks.slice(0, 20).map((t: any) => {
  let price = Number(t.price || 0);
  if (t.paymentPhases) {
    try {
      const phases = JSON.parse(t.paymentPhases);
      if (Array.isArray(phases) && phases.length > 0) {
        price = phases.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      }
    } catch (e) {}
  }
  return `- [${t.status}] ${t.name} | ลูกค้า: ${t.customer || "-"} | ยอด: ฿${price} | ครบกำหนด: ${t.endDate || "-"}`;
}).join("\n")}

งานเกินกำหนด: ${overdueTasks.map((t: any) => t.name).join(", ") || "ไม่มี"}

ลูกค้า: ${clients.map((c: any) => c.name).join(", ") || "ยังไม่มีลูกค้า"}

รายการไอเดีย (Ideas/Notes):
${ideas.slice(0, 15).map((i: any) => `- [${i.status}] ${i.title} (หมวด: ${i.category || "-"}) | ลำดับความสำคัญ: ${i.priority || "-"}`).join("\n")}
=== สิ้นสุดข้อมูล ===`;
    }

    const systemInstruction = `คุณคือ ${agentTitle || "AI Assistant"} แสนสด ทำงานใน ModtyTasks ซึ่งเป็นระบบจัดการงานและรายได้สำหรับ Freelancer
${agentInstructions ? `บทบาทเฉพาะ: ${agentInstructions}` : ""}
${contextSection}
ตอบภาษาไทยเสมอ ใช้ HTML tags จัดรูปแบบ (<br/>, <b>, <ul><li>) ถ้ามีข้อมูลจริงให้ดึงมาวิเคราะห์ตามบทบาทของคุณ`;

    const openAiMessages = [
      { role: "system", content: systemInstruction },
      ...messages.map((m: any) => ({
        role: m.role === "agent" ? "assistant" : "user",
        content: m.text.replace(/<br\s*\/?>/gi, "\n").replace(/<\/?[^>]+(>|$)/g, ""),
      })),
    ];

    try {
      const reply = await callOpenRouter(openAiMessages, 0.7);
      const formattedReply = reply.trim().replace(/\n/g, "<br/>");
      res.json({ result: formattedReply });
    } catch (e: any) {
      console.error("Chat Error:", e);
      res.status(500).json({ error: e.message || "Failed to generate AI response" });
    }
  });

  // -----------------------------------------------------------------
  // POST /api/ai/generate-doc
  // -----------------------------------------------------------------
  app.post("/api/ai/generate-doc", async (req, res) => {
    const { prompt, clients } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
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
      "docNotes": string,
      "docConditions": string
    }

    Return only the raw JSON.`;

    try {
      const resultText = await generateWithAI(systemInstruction, prompt, 0.2);
      const cleanJson = resultText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      res.json({ result: parsed });
    } catch (e: any) {
      console.error("Generate Doc Error:", e);
      res.status(500).json({ error: e.message || "Failed to parse document request" });
    }
  });

  // -----------------------------------------------------------------
  // POST /api/ai/classify-braindump
  // -----------------------------------------------------------------
  app.post("/api/ai/classify-braindump", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const systemInstruction = `You are an AI assistant that classifies a user's quick thoughts/ideas/notes (in Thai) into either a 'Task' or an 'Idea'.
    Analyze the prompt and output a valid JSON object matching the schema below. Do not wrap it in markdown blocks. Return only raw JSON.

    Rules:
    - 'type': Set to 'task' if the prompt represents an actionable job, project to do, or request from a client. Set to 'idea' if it is a general thought, creative concept, or future plan.
    - 'category': Categorize it into one of these: 'Research', 'Marketing', 'Business', 'Technical', 'Design', 'Finance', 'Other'.
    - 'priority': Set to 'ต่ำ (Low)', 'ปานกลาง (Medium)', 'สูง (High)', or 'ด่วน (Urgent)'.
    - 'tags': Generate 1 to 3 relevant tags (comma-separated, English/Thai).
    - 'title': Create a clean, short title for the item.
    - 'details': Summarize the next action or details of the thought.
    - 'suggestedNextStep': A very short, clear next step description.

    Schema:
    {
      "type": "task" | "idea",
      "title": string,
      "category": string,
      "priority": string,
      "tags": string,
      "details": string,
      "suggestedNextStep": string
    }

    Return only the JSON object.`;

    try {
      const resultText = await generateWithAI(systemInstruction, prompt, 0.2);
      const cleanJson = resultText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      res.json({ result: parsed });
    } catch (e: any) {
      console.error("Classify Braindump Error:", e);
      res.status(500).json({ error: e.message || "Failed to classify input" });
    }
  });

  // -----------------------------------------------------------------
  // POST /api/ai/transcribe
  // -----------------------------------------------------------------
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

  app.post("/api/ai/transcribe", upload.single("audio"), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    try {
      const formData = new FormData();
      const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype || "audio/webm" });
      formData.append("file", audioBlob, "audio.webm");
      formData.append("model", "openai/whisper-large-v3");
      formData.append("language", "th");

      const groqKey = process.env.GROQ_API_KEY;
      if (groqKey) {
        const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${groqKey}` },
          body: formData as any,
        });
        if (response.ok) {
          const data: any = await response.json();
          return res.json({ text: data.text ?? "" });
        }
      }

      return res.json({ text: "", hint: "ทำงานด้วย Web Speech API ใน browser แทนค่ะ (ต้องการ GROQ_API_KEY สำหรับ Whisper)" });
    } catch (err: any) {
      console.error("Transcription error:", err);
      res.status(500).json({ error: err.message || "Transcription failed" });
    }
  });

  // -----------------------------------------------------------------
  // Notion Content Plan API proxy
  // -----------------------------------------------------------------
  const NOTION_TOKEN   = process.env.NOTION_TOKEN || "";
  const NOTION_DB_ID   = process.env.NOTION_CONTENT_DB_ID || "";
  const NOTION_VERSION = "2022-06-28";

  function notionHeaders() {
    return {
      Authorization: `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    };
  }

  function notionPageToContentPlan(page: any) {
    const props = page.properties;
    const platformRaw: string[] = (props["Platform "]?.multi_select || []).map((s: any) => s.name as string);
    const platformMap: Record<string, string> = { TIKTOK: "TikTok", FB: "Facebook", IG: "Instagram" };
    return {
      id: page.id,
      notionPageId: page.id,
      title: props["Name"]?.title?.[0]?.plain_text || "",
      concept: props["Details"]?.rich_text?.[0]?.plain_text || "",
      platform: platformMap[platformRaw[0]] || platformRaw[0] || "อื่นๆ",
      status: (() => {
        const s = props["Status"]?.status?.name || "Not started";
        if (s === "Done") return "เผยแพร่แล้ว";
        if (s === "In progress") return "กำลังผลิต";
        return "ไอเดีย/ร่าง";
      })(),
      done: props["Done"]?.checkbox || false,
      createdAt: page.created_time,
      notionUrl: page.url,
    };
  }

  app.get("/api/notion/content-plans", async (_req, res) => {
    if (!NOTION_TOKEN) return res.status(500).json({ error: "NOTION_TOKEN ไม่ได้ตั้งค่า" });
    try {
      const r = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
        method: "POST",
        headers: notionHeaders(),
        body: JSON.stringify({ sorts: [{ property: "Created time", direction: "descending" }] }),
      });
      const data = await r.json() as any;
      res.json((data.results || []).map(notionPageToContentPlan));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/notion/content-plans", async (req, res) => {
    if (!NOTION_TOKEN) return res.status(500).json({ error: "NOTION_TOKEN ไม่ได้ตั้งค่า" });
    const { title, concept, platform, status } = req.body;
    const platformMap: Record<string, string> = { TikTok: "TIKTOK", Facebook: "FB", Instagram: "IG" };
    const statusMap: Record<string, string> = { "เผยแพร่แล้ว": "Done", "กำลังผลิต": "In progress", "ไอเดีย/ร่าง": "Not started", "กำหนดลง": "In progress" };
    try {
      const r = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: notionHeaders(),
        body: JSON.stringify({
          parent: { database_id: NOTION_DB_ID },
          properties: {
            Name: { title: [{ text: { content: title || "" } }] },
            Details: { rich_text: [{ text: { content: concept || "" } }] },
            "Platform ": { multi_select: platform ? [{ name: platformMap[platform] || platform }] : [] },
            Status: { status: { name: statusMap[status] || "Not started" } },
          },
        }),
      });
      const page = await r.json() as any;
      res.json(notionPageToContentPlan(page));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/notion/content-plans/:id", async (req, res) => {
    if (!NOTION_TOKEN) return res.status(500).json({ error: "NOTION_TOKEN ไม่ได้ตั้งค่า" });
    const { id } = req.params;
    const { title, concept, platform, status, done } = req.body;
    const platformMap: Record<string, string> = { TikTok: "TIKTOK", Facebook: "FB", Instagram: "IG" };
    const statusMap: Record<string, string> = { "เผยแพร่แล้ว": "Done", "กำลังผลิต": "In progress", "ไอเดีย/ร่าง": "Not started", "กำหนดลง": "In progress" };
    try {
      const props: any = {};
      if (title !== undefined) props["Name"] = { title: [{ text: { content: title } }] };
      if (concept !== undefined) props["Details"] = { rich_text: [{ text: { content: concept } }] };
      if (platform !== undefined) props["Platform "] = { multi_select: [{ name: platformMap[platform] || platform }] };
      if (status !== undefined) props["Status"] = { status: { name: statusMap[status] || "Not started" } };
      if (done !== undefined) props["Done"] = { checkbox: done };
      const r = await fetch(`https://api.notion.com/v1/pages/${id}`, {
        method: "PATCH",
        headers: notionHeaders(),
        body: JSON.stringify({ properties: props }),
      });
      const page = await r.json() as any;
      res.json(notionPageToContentPlan(page));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/notion/content-plans/:id", async (req, res) => {
    if (!NOTION_TOKEN) return res.status(500).json({ error: "NOTION_TOKEN ไม่ได้ตั้งค่า" });
    try {
      await fetch(`https://api.notion.com/v1/pages/${req.params.id}`, {
        method: "PATCH",
        headers: notionHeaders(),
        body: JSON.stringify({ archived: true }),
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // -----------------------------------------------------------------
  // Telegram Bot API — webhook และการแจ้งเตือน
  // -----------------------------------------------------------------
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

  // ส่งไฟล์ Buffer โดยตรง (multipart form-data) ไม่ต้องอาศัย URL
  async function sendTelegramFile(chatId: string | number, buffer: Buffer, filename: string, caption?: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.error("[Telegram] TELEGRAM_BOT_TOKEN is missing");
      return;
    }
    try {
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append('document', buffer, { filename, contentType: filename.endsWith('.csv') ? 'text/csv' : 'application/pdf' });
      if (caption) form.append('caption', caption);
      const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
        method: 'POST',
        body: form as any,
        headers: form.getHeaders()
      });
      if (!response.ok) {
        const err = await response.text();
        console.error('[Telegram sendFile error]', err);
      }
    } catch (e: any) {
      // Fallback: try without form-data using fetch FormData
      console.error('[Telegram sendFile fallback error]', e.message);
      // Try native fetch FormData
      try {
        const fd = new (globalThis as any).FormData();
        const blob = new (globalThis as any).Blob([buffer], { type: filename.endsWith('.csv') ? 'text/csv; charset=utf-8' : 'application/pdf' });
        fd.append('chat_id', String(chatId));
        fd.append('document', blob, filename);
        if (caption) fd.append('caption', caption);
        await fetch(`https://api.telegram.org/bot${token}/sendDocument`, { method: 'POST', body: fd });
      } catch (e2: any) {
        console.error('[Telegram sendFile native error]', e2.message);
      }
    }
  }

  async function handleTelegramMessage(text: string, chatId: number | string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn("[Telegram Assistant] TELEGRAM_BOT_TOKEN is missing");
      return;
    }

    // ── Built-in commands ──────────────────────────────────────────────
    if (text.startsWith('/start') || text.startsWith('/help')) {
      await sendTelegramMessage(chatId,
        `🤖 *ModtyTasks Assistant พร้อมให้บริการ!*\n\n` +
        `คำสั่งที่ใช้ได้:\n` +
        `📋 /tasks — ดูรายการงานทั้งหมด\n` +
        `📊 /summarize — สรุปภาพรวมงานและลูกค้า\n` +
        `⚠️ /duesoon — งานที่ใกล้ครบกำหนด 5 วัน\n` +
        `❓ /help — แสดงคำสั่งทั้งหมด\n\n` +
        `หรือพิมพ์อะไรก็ได้ เช่น:\n` +
        `👉 *"ออกใบเสนอราคา ออกแบบโลโก้ 5,000 บาท ให้บริษัท ABC"*\n` +
        `👉 *"สร้างงาน ประชุม Kick-off กับลูกค้า XYZ วันพรุ่งนี้"*\n` +
        `👉 *"สรุปงานสัปดาห์นี้"*\n` +
        `👉 *"งานของใครที่ยังไม่เสร็จ?"*`
      );
      return;
    }

    if (text.startsWith('/tasks')) {
      // shortcut to list tasks
      return handleTelegramMessage('แสดงรายการงานทั้งหมดในระบบพร้อมสถานะ', chatId);
    }

    if (text.startsWith('/summarize')) {
      return handleTelegramMessage('สรุปภาพรวมงานและลูกค้าทั้งหมดในระบบ', chatId);
    }

    if (text.startsWith('/duesoon')) {
      return handleTelegramMessage('งานไหนบ้างที่ใกล้ครบกำหนดใน 5 วันนี้', chatId);
    }

    // ── Load DB context ────────────────────────────────────────────────
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
          ideasContext = ideasRes.data.map(i => `- ไอเดีย: ${i.title} (รายละเอียด: ${i.concept || 'ไม่มี'}, แพลตฟอร์ม: ${i.platform || 'ไม่มี'})`).join('\n');
        }
      } catch (dbErr) {
        console.error("[Telegram Assistant] Error loading db context:", dbErr);
      }
    }

    const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

    try {
      const systemPrompt = `คุณคือ "Modty" ผู้ช่วย AI ส่วนตัวที่ฉลาดและเป็นกันเองเหมือนเพื่อนที่รู้ทุกอย่างในระบบ ModtyTasks
วันนี้: ${today} (ใช้วันนี้ในการคำนวณ "พรุ่งนี้" "สัปดาห์นี้" ฯลฯ)

📌 ข้อมูลปัจจุบันในระบบ:
---
[งานทั้งหมด]
${tasksContext || 'ยังไม่มีงาน'}

[ลูกค้าทั้งหมด]
${clientsContext || 'ยังไม่มีลูกค้า'}

[ไอเดียทั้งหมด]
${ideasContext || 'ยังไม่มีไอเดีย'}
---

บุคลิก: เป็นกันเอง สนุกสนาน ฉลาด ตอบสั้นกระชับ ใช้ emoji อย่างเหมาะสม ตอบภาษาไทยเป็นหลัก
ถ้าถามเรื่องทั่วไป ชีวิต หรือคุย social ก็คุยได้ปกติ แต่ถ้าเกี่ยวกับงานในระบบให้อ้างอิงข้อมูลจริงเสมอ

ตอบกลับเป็น JSON เท่านั้น (ห้ามใส่ markdown block \`\`\`json):

สำหรับ action ที่ต้องทำในระบบ:

1. ออกใบเสนอราคา (มีราคา + ชื่อลูกค้า + ชื่องาน):
{"action":"create_quotation","customerName":"...","taskName":"...","price":0,"details":"...","items":[{"description":"...","amount":0}]}

2. สร้างงานใหม่ (บอกว่า สร้างงาน/เพิ่มงาน/จดไว้หน่อย):
{"action":"create_task","taskName":"...","customerName":"...","assignee":"...","endDate":"YYYY-MM-DD หรือ null","details":"...","status":"To Do"}

3. อัปเดตงาน (เปลี่ยนสถานะ/มอบหมาย/กำหนดส่ง ของงานที่มีอยู่):
{"action":"update_task","taskId":"id ของงาน","taskName":"ชื่องานที่ตรงกับในระบบ","updates":{"status":"...","assignee":"...","endDate":"...","details":"..."}}

4. เพิ่มลูกค้าใหม่:
{"action":"create_client","name":"...","contactInfo":"...","targetBudget":0}

5. เพิ่มไอเดีย:
{"action":"add_idea","title":"...","concept":"...","platform":"TikTok/YouTube/Facebook/Instagram/Blog/อื่นๆ"}

6. ตอบคำถาม/คุยทั่วไป/สรุปงาน:
{"action":"reply","replyText":"[คำตอบ ใช้ emoji อ่านง่าย ถ้าถามข้อมูลงานให้อ้างอิงจากระบบจริง ถ้าคุยทั่วไปตอบแบบเพื่อน]"}

7. ส่งไฟล์รายงานงาน (ผู้ใช้เอ่ย ส่งไฟล์/export/PDF รายงาน/CSV/ลีสต์งาน):
{"action":"export_tasks_pdf","filter":"ทั้งหมด/ยังไม่เสร็จ/เสร็จแล้ว/ชื่อลูกค้า"}
{"action":"export_tasks_csv"}
{"action":"export_clients_csv"}

กฎสำคัญ:
- ตอบเป็น JSON เท่านั้น ห้ามมีคำนอก JSON
- ถ้าไม่แน่ใจว่าจะ action อะไร ให้ใช้ reply เสมอ
- อัปเดตงาน: ให้ match ชื่องานจากรายการข้างบน แล้วใส่ taskId ให้ถูกต้อง (id ของ task นั้น)
- วันที่ให้แปลงเป็น YYYY-MM-DD เสมอ เช่น พรุ่งนี้ = คำนวณจากวันนี้`;

      const aiResponse = await generateWithAI(systemPrompt, text);
      let parsed: any;
      try {
        parsed = JSON.parse(aiResponse.replace(/```json/g, '').replace(/```/g, '').trim());
      } catch (e) {
        // If JSON parse fails, treat as plain reply
        parsed = { action: 'reply', replyText: aiResponse.trim() };
      }

      // ── Action: create_quotation ──────────────────────────────────────
      if (parsed.action === 'create_quotation') {
        const { customerName, taskName, price, details, items } = parsed;

        const taskId = `task-tg-${Date.now()}`;
        let dbSaved = false;
        let pdfUrl = "";

        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);

          let clientId: string | null = null;
          if (customerName) {
            const { data: clientData } = await supabase.from('clients').select('id').eq('name', customerName).maybeSingle();
            if (clientData) {
              clientId = clientData.id;
            } else {
              clientId = `client-${Date.now()}`;
              await supabase.from('clients').insert({ id: clientId, name: customerName, targetBudget: price });
            }
          }

          // Generate PDF
          const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
          const fontBase64 = await getSarabunBase64();
          if (fontBase64) {
            doc.addFileToVFS("Sarabun-Regular.ttf", fontBase64);
            doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
            doc.setFont("Sarabun");
          }

          doc.setFontSize(22);
          doc.text("ใบเสนอราคา / Quotation", 20, 25);
          doc.setFontSize(10);
          doc.text(`เลขที่เอกสาร: QT-${Date.now().toString().slice(-6)}`, 140, 20);
          doc.text(`วันที่ออก: ${new Date().toLocaleDateString('th-TH')}`, 140, 25);
          doc.line(20, 32, 190, 32);
          doc.setFontSize(11);
          doc.text("ข้อมูลผู้เสนอราคา:", 20, 42);
          doc.text("ModtyTasks", 20, 48);
          doc.text("อีเมล: contact@modtytasks.app", 20, 54);
          doc.text("ข้อมูลผู้รับเสนอราคา (ลูกค้า):", 110, 42);
          doc.text(customerName || "-", 110, 48);
          doc.line(20, 62, 190, 62);
          doc.setFontSize(12);
          doc.text(`ชื่อโครงการ/งาน: ${taskName}`, 20, 72);
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

          const pdfOutput = doc.output("arraybuffer");
          const buffer = Buffer.from(pdfOutput);
          const fileName = `quotation_${Date.now()}.pdf`;
          const filePath = `quotations/${fileName}`;
          const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, buffer, { contentType: 'application/pdf', cacheControl: '3600', upsert: true });
          let newAttachments: any[] = [];
          if (!uploadError) {
            const { data: { publicUrl: url } } = supabase.storage.from('attachments').getPublicUrl(filePath);
            pdfUrl = url;
            newAttachments.push({ id: `attach-${Date.now()}`, name: `ใบเสนอราคา_${taskName}.pdf`, url: pdfUrl, path: filePath, mimeType: 'application/pdf', size: `${(buffer.length / (1024 * 1024)).toFixed(2)} MB` });
          } else {
            console.error("[Telegram Assistant] Supabase PDF upload error:", uploadError);
          }

          const invoiceNo = `INV-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100+Math.random()*900)}`;
          const newInvoice = { id: `inv-${Date.now()}`, invoiceNo, issueDate: new Date().toISOString().slice(0, 10), status: 'draft', phaseIds: [], totalAmount: price, notes: details };
          const { error: taskError } = await supabase.from('tasks').insert({ id: taskId, name: taskName, status: 'ไอเดีย/ร่าง', price, customer: customerName, clientId, details, invoices: JSON.stringify([newInvoice]), attachments: newAttachments.length > 0 ? JSON.stringify(newAttachments) : null });
          if (!taskError) dbSaved = true;
          else console.error("[Telegram Assistant] Supabase insert task error:", taskError);
        }

        let messageText = `📄 *บันทึกงานและออกใบเสนอราคาสำเร็จ!*\n\n` +
          `🏢 ลูกค้า: ${customerName || '-'}\n` +
          `✅ ชื่องาน: ${taskName}\n` +
          `💰 ราคา: ${price.toLocaleString()} บาท\n` +
          `📝 รายละเอียด: ${details || '-'}\n\n`;
        messageText += dbSaved ? `บันทึกเข้าระบบเรียบร้อยแล้วค่ะ 🚀` : `⚠️ เกิดข้อผิดพลาดในการบันทึกข้อมูล`;

        if (pdfUrl) {
          await sendTelegramDocument(chatId, pdfUrl, messageText);
        } else {
          await sendTelegramMessage(chatId, messageText);
        }

      // ── Action: create_task ────────────────────────────────────────────
      } else if (parsed.action === 'create_task') {
        const { taskName, customerName, assignee, dueDate, endDate, details, status } = parsed;
        const taskId = `task-tg-${Date.now()}`;
        let dbSaved = false;

        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          let clientId: string | null = null;
          if (customerName) {
            const { data: cd } = await supabase.from('clients').select('id').eq('name', customerName).maybeSingle();
            if (cd) clientId = cd.id;
          }
          const { error } = await supabase.from('tasks').insert({
            id: taskId,
            name: taskName,
            status: status || 'To Do',
            customer: customerName || null,
            clientId,
            assignee: assignee || null,
            endDate: endDate || null,
            details: details || null,
            updatedAt: new Date().toISOString()
          });
          if (!error) dbSaved = true;
          else console.error("[Telegram create_task error]", error);
        }

        const msg = dbSaved
          ? `✅ *สร้างงานใหม่สำเร็จ!*\n\n📌 ชื่องาน: ${taskName}\n👤 มอบหมาย: ${assignee || 'ยังไม่ได้มอบหมาย'}\n🏢 ลูกค้า: ${customerName || '-'}\n📅 กำหนดส่ง: ${endDate || 'ยังไม่กำหนด'}\n📝 รายละเอียด: ${details || '-'}\n\nบันทึกเข้าระบบเรียบร้อยแล้วค่ะ 🚀`
          : `⚠️ ไม่สามารถสร้างงาน "${taskName}" ได้ กรุณาลองใหม่`;
        await sendTelegramMessage(chatId, msg);

      // ── Action: reply (general Q&A / summarize) ───────────────────────
      } else if (parsed.action === 'reply' || parsed.action === 'other') {
        const replyText = parsed.replyText || parsed.reply || 'ขอโทษค่ะ ไม่สามารถตอบได้ในขณะนี้';
        await sendTelegramMessage(chatId, replyText);

      } else if (parsed.action === 'update_task') {
        // ── Action: update_task ───────────────────────────────────────────
        const { taskId, taskName, updates } = parsed;
        let updated = false;
        if (supabaseUrl && supabaseAnonKey && (taskId || taskName)) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const taskUpdates = { ...updates };
          if (taskUpdates.dueDate !== undefined) {
            taskUpdates.endDate = taskUpdates.dueDate;
            delete taskUpdates.dueDate;
          }
          let query = supabase.from('tasks').update({ ...taskUpdates, updatedAt: new Date().toISOString() });
          if (taskId) {
            query = query.eq('id', taskId);
          } else {
            query = query.ilike('name', `%${taskName}%`);
          }
          const { error } = await query;
          if (!error) updated = true;
          else console.error('[Telegram update_task error]', error);
        }
        const statusLabel = updates?.status || updates?.assignee ? `สถานะ: ${updates.status || '?'}, มอบหมาย: ${updates.assignee || '?'}` : JSON.stringify(updates);
        await sendTelegramMessage(chatId, updated
          ? `✅ อัปเดตงาน "${taskName}" เรียบร้อยแล้วค่ะ!\n${statusLabel}`
          : `⚠️ ไม่พบงานชื่อ "${taskName}" ในระบบ`);

      } else if (parsed.action === 'create_client') {
        // ── Action: create_client ─────────────────────────────────────────
        const { name, contactInfo, targetBudget } = parsed;
        let saved = false;
        if (supabaseUrl && supabaseAnonKey && name) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { error } = await supabase.from('clients').insert({ id: `client-tg-${Date.now()}`, name, contactInfo: contactInfo || null, targetBudget: targetBudget || 0 });
          if (!error) saved = true;
          else console.error('[Telegram create_client error]', error);
        }
        await sendTelegramMessage(chatId, saved
          ? `✅ เพิ่มลูกค้า "${name}" เรียบร้อยแล้วค่ะ! 🏢`
          : `⚠️ ไม่สามารถเพิ่มลูกค้า "${name}" ได้`);

      } else if (parsed.action === 'add_idea') {
        // Action: add_idea
        const { title, concept, platform } = parsed;
        let saved = false;
        if (supabaseUrl && supabaseAnonKey && title) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { error } = await supabase.from('ideas').insert({ id: `idea-tg-${Date.now()}`, title, concept: concept || null, platform: platform || 'อื่นๆ', createdAt: new Date().toISOString() });
          if (!error) saved = true;
          else console.error('[Telegram add_idea error]', error);
        }
        await sendTelegramMessage(chatId, saved
          ? `💡 บันทึกไอเดีย "${title}" ใน ${platform || 'อื่นๆ'} เรียบร้อยแล้วค่ะ!`
          : `⚠️ ไม่สามารถบันทึกไอเดียได้`);

      } else if (parsed.action === 'export_tasks_pdf') {
        // ── Action: export_tasks_pdf ───────────────────────────────────────
        await sendTelegramMessage(chatId, '📄 กำลังสร้าง PDF รายงานงาน...');
        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data: tasks } = await supabase.from('tasks').select('*');
          const filter = parsed.filter || 'ทั้งหมด';
          const filteredTasks = (tasks || []).filter((t: any) => {
            if (filter === 'ทั้งหมด') return true;
            if (filter === 'ยังไม่เสร็จ') return t.status !== 'เสร็จสิ้น' && t.status !== 'Done';
            if (filter === 'เสร็จแล้ว') return t.status === 'เสร็จสิ้น' || t.status === 'Done';
            return (t.customer || '').toLowerCase().includes(filter.toLowerCase());
          });

          const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const fontBase64 = await getSarabunBase64();
          if (fontBase64) {
            doc.addFileToVFS('Sarabun-Regular.ttf', fontBase64);
            doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');
            doc.setFont('Sarabun');
          }
          doc.setFontSize(18);
          doc.text(`รายงานงาน ModtyTasks`, 20, 20);
          doc.setFontSize(10);
          doc.text(`ออกเมื่อ: ${new Date().toLocaleDateString('th-TH')}  สถานะ: ${filter}  รวม ${filteredTasks.length} รายการ`, 20, 28);
          doc.line(20, 32, 190, 32);

          // Header
          doc.setFillColor(60, 60, 80);
          doc.rect(20, 34, 170, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(9);
          doc.text('ชื่องาน', 22, 39);
          doc.text('ลูกค้า', 80, 39);
          doc.text('สถานะ', 120, 39);
          doc.text('ผู้รับผิดชอบ', 150, 39);
          doc.text('กำหนดส่ง', 175, 39);

          doc.setTextColor(0, 0, 0);
          let y = 50;
          filteredTasks.forEach((t: any, i: number) => {
            if (y > 270) { doc.addPage(); y = 20; }
            if (i % 2 === 0) { doc.setFillColor(245, 245, 250); doc.rect(20, y - 5, 170, 9, 'F'); }
            doc.setFontSize(8);
            doc.text((t.name || '-').substring(0, 30), 22, y);
            doc.text((t.customer || '-').substring(0, 18), 80, y);
            doc.text((t.status || '-').substring(0, 16), 120, y);
            doc.text((t.assignee || '-').substring(0, 14), 150, y);
            doc.text((t.endDate || '-'), 175, y);
            y += 9;
          });

          const buf = Buffer.from(doc.output('arraybuffer'));
          const filename = `tasks_report_${new Date().toISOString().slice(0,10)}.pdf`;
          await sendTelegramFile(chatId, buf, filename, `📄 รายงานงานทั้งหมด (${filteredTasks.length} รายการ)`);
        } else {
          await sendTelegramMessage(chatId, '⚠️ ไม่สามารถสร้างรายงานได้ เนื่องจากไม่ได้ตั้งค่า Supabase');
        }

      } else if (parsed.action === 'export_tasks_csv') {
        // ── Action: export_tasks_csv ───────────────────────────────────────
        await sendTelegramMessage(chatId, '📊 กำลังสร้าง CSV รายการงาน...');
        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data: tasks } = await supabase.from('tasks').select('*');
          const headers = ['ชื่องาน','ลูกค้า','สถานะ','ผู้รับผิดชอบ','ราคา','กำหนดส่ง','รายละเอียด'];
          const rows = (tasks || []).map((t: any) => [
            t.name || '', t.customer || '', t.status || '', t.assignee || '',
            t.price || 0, t.endDate || '', (t.details || '').replace(/[,"\n]/g, ' ')
          ].map((v: any) => `"${v}"`).join(','));
          const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
          const buf = Buffer.from(csv, 'utf-8');
          const filename = `tasks_${new Date().toISOString().slice(0,10)}.csv`;
          await sendTelegramFile(chatId, buf, filename, `📊 เอกสารงานทั้งหมด ${(tasks || []).length} รายการ (เปิดใน Excel ได้)`);
        } else {
          await sendTelegramMessage(chatId, '⚠️ ไม่สามารถ export ได้');
        }

      } else if (parsed.action === 'export_clients_csv') {
        // ── Action: export_clients_csv ─────────────────────────────────────
        await sendTelegramMessage(chatId, '🏢 กำลังสร้าง CSV รายชื่อลูกค้า...');
        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data: clients } = await supabase.from('clients').select('*');
          const headers = ['ชื่อลูกค้า','ติดต่อ','งบประมาณ'];
          const rows = (clients || []).map((c: any) => [
            c.name || '', (c.contactInfo || '').replace(/[,"\n]/g, ' '), c.targetBudget || 0
          ].map((v: any) => `"${v}"`).join(','));
          const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
          const buf = Buffer.from(csv, 'utf-8');
          const filename = `clients_${new Date().toISOString().slice(0,10)}.csv`;
          await sendTelegramFile(chatId, buf, filename, `🏢 ลูกค้าทั้งหมด ${(clients || []).length} ราย`);
        } else {
          await sendTelegramMessage(chatId, '⚠️ ไม่สามารถ export ได้');
        }

      } else {
        // Fallback
        await sendTelegramMessage(chatId, parsed.replyText || 'ขอโทษค่ะ ไม่เข้าใจคำสั่ง ลองพิมพ์ /help เพื่อดูคำสั่งทั้งหมด');
      }

    } catch (err: any) {
      console.error("[Telegram Assistant] handleTelegramMessage error:", err);
      await sendTelegramMessage(chatId, '⚠️ เกิดข้อผิดพลาดภายใน กรุณาลองใหม่ในภายหลัง');
    }
  }

  // Telegram webhook receiver
  app.post("/api/telegram/webhook", (req, res) => {
    res.sendStatus(200); // ตอบรับ Telegram ทันที
    const update = updateBody(req.body);
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
      // ตอบทุกข้อความ — bot เป็น AI เพื่อนที่คุยได้ทุกเรื่อง
      handleTelegramMessage(text, chatId).catch(err => {
        console.error("[Telegram Webhook Error]", err);
      });
    }
  });

  // Setup Telegram Webhook — เรียกครั้งเดียวเพื่อ register URL
  app.post("/api/telegram/setup-webhook", async (req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(503).json({ error: "TELEGRAM_BOT_TOKEN ยังไม่ได้ตั้งค่า" });
    const appUrl = (req.body?.appUrl || process.env.APP_URL || '').replace(/\/$/, '');
    if (!appUrl) return res.status(400).json({ error: "กรุณาระบุ appUrl เช่น https://modtytasks.vercel.app" });
    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ['message', 'edited_message'] })
      });
      const data = await r.json() as any;
      if (data.ok) {
        res.json({ ok: true, webhookUrl, message: `ตั้ง Webhook สำเร็จ: ${webhookUrl}` });
      } else {
        res.status(400).json({ error: data.description || 'Telegram API error' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ตรวจสอบสถานะ Webhook ปัจจุบัน
  app.get("/api/telegram/setup-webhook", async (_req, res) => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return res.status(503).json({ error: "TELEGRAM_BOT_TOKEN ยังไม่ได้ตั้งค่า" });
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const data = await r.json() as any;
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Helper helper to handle webhook requests body parsing safely
  function updateBody(body: any): any {
    return body || {};
  }

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
      'ส่งจาก ModtyTasks 🚀',
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
        const dueDate = new Date(task.endDate);
        return dueDate >= today && dueDate <= fiveDaysLater;
      });

      // Collect due-soon subtasks
      interface DueSubtask { name: string; parentName: string; assignee: string; dueDate: string; }
      const dueSoonSubtasks: DueSubtask[] = [];
      (tasks || []).forEach((task: any) => {
        if (!task.subtasks) return;
        try {
          const subs = JSON.parse(task.subtasks);
          if (!Array.isArray(subs)) return;
          subs.forEach((sub: any) => {
            if (sub.status === 'done') return;
            if (!sub.dueDate) return;
            const d = new Date(sub.dueDate);
            if (d >= today && d <= fiveDaysLater) {
              dueSoonSubtasks.push({ name: sub.name, parentName: task.name, assignee: sub.assignee || task.assignee || 'ไม่มี', dueDate: sub.dueDate });
            }
          });
        } catch {}
      });

      if (dueSoonTasks.length === 0 && dueSoonSubtasks.length === 0) {
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
      if (dueSoonSubtasks.length > 0) {
        message += `\n📋 *งานย่อยใกล้ครบกำหนด*\n━━━━━━━━━━━━━━━\n`;
        dueSoonSubtasks.forEach((sub) => {
          message += `↳ ${sub.name}\n`;
          message += `   งานหลัก: ${sub.parentName}\n`;
          message += `   มอบหมาย: ${sub.assignee}  |  กำหนด: ${sub.dueDate}\n`;
          message += `━━━━━━━━━━━━━━━\n`;
        });
      }
      message += `ส่งจาก ModtyTasks`;

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
        if (!t.dueDate) return false;
        if (t.status === 'เสร็จสิ้น' || t.status === 'Done') return false;
        return t.dueDate < localTodayStr;
      });

      const todayTasks = tasks.filter(t => {
        if (!t.dueDate) return false;
        if (t.status === 'เสร็จสิ้น' || t.status === 'Done') return false;
        return t.dueDate === localTodayStr;
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

      const summaryText = await generateWithAI(systemInstruction, userPrompt, 0.7);

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
      const [tasksRes, clientsRes, ideasRes, contentPlansRes] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('ideas').select('*'),
        supabase.from('content_plans').select('*')
      ]);

      const tasks = tasksRes.data || [];
      const clients = clientsRes.data || [];
      const ideas = ideasRes.data || [];
      const contentPlans = contentPlansRes.data || [];

      const highPerformers = contentPlans.filter((p: any) => p.engagementRating === 'A+' || p.engagementRating === 'B+');
      const publishedPlans = contentPlans.filter((p: any) => p.status === 'เผยแพร่แล้ว');

      // Context construction
      const tasksContext = tasks.map(t => `- งาน: ${t.name} (ลูกค้า: ${t.customer || 'ไม่มี'}, ผู้รับผิดชอบ: ${t.assignee || 'ยังไม่มอบหมาย'}, สถานะ: ${t.status}, ราคา: ${t.price || 0} บาท, กำหนดส่ง: ${t.endDate || 'ไม่มี'})`).join('\n');
      const clientsContext = clients.map(c => `- ลูกค้า: ${c.name} (เป้าหมายงบประมาณ: ${c.targetBudget || 0} บาท, ข้อมูลติดต่อ: ${c.contactInfo || 'ไม่มี'})`).join('\n');
      const ideasContext = ideas.map(i => `- ไอเดีย: ${i.title} (แนวคิด: ${i.concept || 'ไม่มี'}, แพลตฟอร์ม: ${i.platform || 'ไม่มี'})`).join('\n');
      const highPerformersContext = highPerformers.map((p: any) => `- "${p.title}" (แพลตฟอร์ม: ${p.platform}, ระดับ: ${p.engagementRating}, วิว: ${p.viewCount || 'ไม่ระบุ'}, ไลค์: ${p.likeCount || 'ไม่ระบุ'})`).join('\n');
      const contentSummary = `คอนเทนต์ทั้งหมด: ${publishedPlans.length} ชิ้น | เอนเกจดีมาก (A+/B+): ${highPerformers.length} ชิ้น`;

      const systemInstruction = `คุณคือ "Modty" ผู้ช่วย AI และนักวิเคราะห์ธุรกิจส่วนตัวที่เก่งกาจและเป็นกันเอง
หน้าที่ของคุณคือวิเคราะห์ภาพรวมธุรกิจประจำสัปดาห์ (Weekly Business Analysis / Analyse My Business) จากข้อมูลในระบบ ModtyTasks และส่งรายงานเป็นภาษาไทยให้เจ้าของธุรกิจอ่านเข้าใจง่าย ได้แรงบันดาลใจ และเห็นทิศทางชัดเจน`;

      const userPrompt = `นี่คือข้อมูลล่าสุดในระบบ:
---
[งานทั้งหมด]
${tasksContext || 'ไม่มีงานในระบบ'}

[ลูกค้าทั้งหมด]
${clientsContext || 'ไม่มีรายชื่อลูกค้า'}

[ไอเดียคอนเทนต์]
${ideasContext || 'ไม่มีไอเดียคอนเทนต์'}

[สรุปคอนเทนต์]
${contentSummary}

[คอนเทนต์ที่เอนเกจดีมาก (B+/A+)]
${highPerformersContext || 'ยังไม่มีคอนเทนต์ที่มีคะแนนเอนเกจสูง'}
---

ช่วยทำการวิเคราะห์วิเคราะห์ธุรกิจประจำสัปดาห์เชิงลึก (Analyse My Business) โดยครอบคลุมหัวข้อต่อไปนี้:
1. 📊 *ภาพรวมความคืบหน้า (Business Progress Overview):* สรุปสถานะโครงการ รายได้สะสมหรืองบประมาณรวม
2. ⚠️ *คอขวดและจุดเสี่ยง (Bottlenecks & Risks):* ชี้จุดที่ค้างส่ง (Overdue) หรืองานที่ใช้เวลานานผิดปกติ
3. 💡 *โอกาสและไอเดียธุรกิจใหม่ๆ (Ideas & Growth Opportunities):* เสนอแนะการนำไอเดียคอนเทนต์ที่มีอยู่ไปขยายผล หรือแนะนำแพลตฟอร์มที่ควรขยาย
4. 🎬 *วิเคราะห์ทิศทางคอนเทนต์สัปดาห์นี้ (Content Direction):* จากคอนเทนต์ที่เอนเกจดี วิเคราะห์ว่าควรทำคอนเทนต์แนวไหนต่อ รูปแบบ/หัวข้อ/แพลตฟอร์มที่แนะนำ พร้อมไอเดียหัวข้อใหม่ 3 ข้อจากรูปแบบที่เคยได้ผล
5. 🚀 *คำแนะนำและสิ่งแรกที่ต้องทำในสัปดาห์นี้ (Actionable Recommendations):* ลำดับความสำคัญสิ่งที่ควรทำทันที 3 ข้อแรก

กรุณาตอบเป็นภาษาไทยจัดย่อหน้าและหัวข้อให้อ่านง่าย มีการใช้ตัวหนา/ตัวเอียง/อีโมจิ เพื่อให้อ่านง่าย สไตล์เพื่อนคุยธุรกิจอย่างเป็นกันเองและกระตือรือร้น`;

      const analysisText = await generateWithAI(systemInstruction, userPrompt, 0.75);

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

  // -----------------------------------------------------------------
  // Google Calendar OAuth
  // -----------------------------------------------------------------
  // Derive redirect URI from request host — works on any domain without GOOGLE_REDIRECT_URI env var
  const getRedirectUri = (req: any): string => {
    if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || '';
    return `${proto}://${host}/api/google/callback`;
  };

  app.get("/api/google/auth", (req: any, res: any) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ error: "GOOGLE_CLIENT_ID ยังไม่ได้ตั้งค่า" });
    }
    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.readonly',
      access_type: 'offline',
      prompt: 'consent'
    });
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get("/api/google/callback", async (req: any, res: any) => {
    const { code, error } = req.query;
    if (error) return res.status(400).json({ error });
    if (!code) return res.status(400).json({ error: "No code returned from Google" });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(503).json({ error: "Google OAuth env vars missing" });
    }
    const redirectUri = getRedirectUri(req);

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' })
      });
      const tokens = await tokenRes.json() as any;
      if (tokens.error) return res.status(400).json(tokens);

      const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.from('google_tokens').upsert({
        id: 'default',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null,
        scope: tokens.scope,
        token_type: tokens.token_type,
        updated_at: new Date().toISOString()
      });

      return res.send(`<html><body><script>
        if (window.opener) { window.opener.postMessage('gcal_connected', '*'); }
        setTimeout(() => window.close(), 500);
      </script><p style="font-family:sans-serif;text-align:center;margin-top:80px;font-size:18px">✅ Google Calendar เชื่อมต่อสำเร็จ<br><small style="color:#888">กำลังปิดหน้าต่าง...</small></p></body></html>`);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/google/events", async (_req: any, res: any) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.status(503).json({ error: "Google OAuth env vars missing", connected: false });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      const { data: tokenRow } = await supabase.from('google_tokens').select('*').eq('id', 'default').single();
      if (!tokenRow) return res.json({ connected: false, events: [] });

      let accessToken = tokenRow.access_token;

      // Refresh token if expired
      if (tokenRow.expiry_date && Date.now() > tokenRow.expiry_date - 60000) {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: tokenRow.refresh_token, grant_type: 'refresh_token' })
        });
        const refreshed = await refreshRes.json() as any;
        if (refreshed.access_token) {
          accessToken = refreshed.access_token;
          await supabase.from('google_tokens').update({
            access_token: refreshed.access_token,
            expiry_date: refreshed.expires_in ? Date.now() + refreshed.expires_in * 1000 : tokenRow.expiry_date,
            updated_at: new Date().toISOString()
          }).eq('id', 'default');
        }
      }

      const now = new Date().toISOString();
      const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const calRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${twoWeeksLater}&singleEvents=true&orderBy=startTime&maxResults=50`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const calData = await calRes.json() as any;
      if (calData.error) return res.status(400).json({ error: calData.error.message, connected: true });

      const events = (calData.items || []).map((e: any) => ({
        id: e.id,
        title: e.summary || '(ไม่มีชื่อ)',
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
        location: e.location || '',
        description: e.description || '',
        htmlLink: e.htmlLink || '',
        allDay: !e.start?.dateTime
      }));

      return res.json({ connected: true, events });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/google/disconnect", async (_req: any, res: any) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await supabase.from('google_tokens').delete().eq('id', 'default');
    return res.json({ ok: true });
  });

  // Temporary debug: test Supabase write for google_tokens
  app.get("/api/google/test-write", async (_req: any, res: any) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('google_tokens').upsert({
      id: 'default',
      access_token: 'test_token',
      refresh_token: 'test_refresh',
      expiry_date: Date.now() + 3600000,
      scope: 'test',
      token_type: 'Bearer',
      updated_at: new Date().toISOString()
    }).select();
    return res.json({ data, error });
  });

  // -----------------------------------------------------------------
  // Health check
  // -----------------------------------------------------------------
  app.get("/api/health", (req: any, res: any) => {
    res.json({
      status: "ok",
      ai: { provider: "OpenRouter", primaryModel: MODEL_PRIMARY, fallbackModel: MODEL_FALLBACK },
      supabase: {
        url: !!process.env.VITE_SUPABASE_URL,
        key: !!process.env.VITE_SUPABASE_ANON_KEY,
        urlHint: (process.env.VITE_SUPABASE_URL || '').slice(8, 28),
      },
      google: {
        clientId: !!process.env.GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI || getRedirectUri(req),
      }
    });
  });

  return app;
}
