// Express app factory — shared by server.ts (dev/prod) and api/index.ts (Vercel)
import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import { jsPDF } from "jspdf";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

// =================================================================
// OpenRouter Configuration
// =================================================================
function getApiKey(): string {
  const envKey = process.env.OPENROUTER_API_KEY;
  if (envKey && envKey.trim() !== "" && envKey !== "YOUR_OPENROUTER_API_KEY") {
    return envKey;
  }
  throw new Error("OPENROUTER_API_KEY ไม่ได้ตั้งค่าใน .env — กรุณาใส่ API key ก่อนใช้งาน AI features");
}

const MODEL_PRIMARY  = "google/gemma-4-26b-a4b-it";
const MODEL_FALLBACK = "google/gemma-4-26b-a4b-it";

async function callOpenRouter(
  messages: { role: string; content: string }[],
  temperature = 0.7,
  model = MODEL_PRIMARY
): Promise<string> {
  const apiKey = getApiKey();
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
  return callOpenRouter(
    [
      { role: "system", content: systemInstruction },
      { role: "user", content: userPrompt },
    ],
    temperature
  );
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
      const templates = contextData.templates ?? [];
      const today = new Date().toISOString().split("T")[0];

      const overdueTasks = tasks.filter((t: any) => t.endDate && t.endDate < today && t.status !== "Done" && t.status !== "เสร็จสิ้น");
      const inProgress = tasks.filter((t: any) => t.status === "In Progress" || t.status === "กำลังดำเนินการ");
      const totalRevenue = tasks.reduce((s: number, t: any) => s + Number(t.price || 0), 0);
      const myIncome = tasks.reduce((s: number, t: any) => s + Number(t.myIncome || (Number(t.price || 0) - Number(t.devCost || 0))), 0);

      contextSection = `
=== ข้อมูลจริงจากระบบ (Real-time Data) ===
วันนี้: ${today}
งานทั้งหมด: ${tasks.length} รายการ
งานที่เกินกำหนด: ${overdueTasks.length} รายการ
งานที่กำลังทำ: ${inProgress.length} รายการ
ลูกค้าทั้งหมด: ${clients.length} ราย
ยอดรายได้รวม: ฿${totalRevenue.toLocaleString()}
รายได้สุทธิ: ฿${myIncome.toLocaleString()}

รายการงาน (Tasks):
${tasks.slice(0, 20).map((t: any) => `- [${t.status}] ${t.name} | ลูกค้า: ${t.customer || "-"} | ยอด: ฿${t.price || 0} | ครบกำหนด: ${t.endDate || "-"}`).join("\n")}

งานเกินกำหนด: ${overdueTasks.map((t: any) => t.name).join(", ") || "ไม่มี"}

ลูกค้า: ${clients.map((c: any) => c.name).join(", ") || "ยังไม่มีลูกค้า"}

รายการไอเดีย (Ideas/Notes):
${ideas.slice(0, 15).map((i: any) => `- [${i.status}] ${i.title} (หมวด: ${i.category || "-"}) | ลำดับความสำคัญ: ${i.priority || "-"}`).join("\n")}

เทมเพลตที่มี (Templates):
${templates.slice(0, 10).map((t: any) => `- ${t.name} (ราคาแนะนำ: ฿${t.price || 0})`).join("\n")}
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
          tasksContext = tasksRes.data.map(t => `- งาน: ${t.name} (ลูกค้า: ${t.customer || 'ไม่มี'}, ผู้ทำ: ${t.assignee || 'ยังไม่มอบหมาย'}, สถานะ: ${t.status || 'To Do'}, ราคา: ${t.price || 0} บาท, กำหนดส่ง: ${t.dueDate || 'ไม่มี'}, รายละเอียด: ${t.details || 'ไม่มี'})`).join('\n');
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
      // ตอบกลับหากมีคำสำคัญ หรือเริ่มด้วย / หรือพิมพ์หาบอท
      const isTriggered = text.includes('เสนอราคา') || text.includes('ใบเสนอราคา') || text.startsWith('/');
      if (isTriggered) {
        handleTelegramMessage(text, chatId).catch(err => {
          console.error("[Telegram Webhook Error]", err);
        });
      }
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
  app.post("/api/notify/due-soon", async (req, res) => {
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
        if (!task.dueDate) return false;
        if (task.status === 'เสร็จสิ้น' || task.status === 'Done') return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= today && dueDate <= fiveDaysLater;
      });

      if (dueSoonTasks.length === 0) {
        return res.json({ ok: true, message: "ไม่มีงานที่ใกล้ครบกำหนดใน 5 วัน" });
      }

      let message = `⚠️ *แจ้งเตือนงานใกล้ครบกำหนด (ใน 5 วัน)*\n`;
      message += `━━━━━━━━━━━━━━━\n`;
      dueSoonTasks.forEach((task: any) => {
        message += `✅ งาน: ${task.name}\n`;
        message += `👤 มอบหมาย: ${task.assignee || 'ไม่มี'}\n`;
        message += `📅 กำหนดส่ง: ${task.dueDate}\n`;
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
  });

  // -----------------------------------------------------------------
  // Health check
  // -----------------------------------------------------------------
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      ai: { provider: "OpenRouter", primaryModel: MODEL_PRIMARY, fallbackModel: MODEL_FALLBACK },
    });
  });

  return app;
}
