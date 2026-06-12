import { BrainCircuit, Sparkles, UserCheck, Calendar, AtSign, Kanban, FileCode2, FileEdit } from 'lucide-react';

export const agentsData = [
  { id: 'daily_briefer', cat: 'productivity', title: 'Daily Briefer', icon: Sparkles, bg: 'bg-blue-500', color: 'blue', text: 'สรุปเป้าหมายประจำวันและแจ้งเตือนงานที่เกินกำหนด', prompts: ['สรุปงานด่วนวันนี้', 'มีงานไหนเกินกำหนดบ้าง?'] },
  { id: 'personal_assistant', cat: 'productivity', title: 'Personal Assistant', icon: UserCheck, bg: 'bg-blue-500', color: 'blue', text: 'ช่วยจัดการแจ้งเตือน, อีเมล, และงานยิบย่อย', prompts: ['จัดตารางเวลาให้หน่อย', 'ร่างอีเมลขอบคุณลูกค้า'] },
  { id: 'meeting_prep', cat: 'productivity', title: 'Meeting Prep', icon: Calendar, bg: 'bg-blue-500', color: 'blue', text: 'ร่างวาระประชุมและดึงงานที่เกี่ยวข้องมาสรุปให้ฟังล่วงหน้า', prompts: ['ร่างวาระประชุมทีมบ่ายนี้', 'สรุปงานเตรียมพรีเซนต์'] },
  { id: 'sprint_planner', cat: 'engineering', title: 'Sprint Planner', icon: Kanban, bg: 'bg-indigo-500', color: 'indigo', text: 'ช่วยจัดการ Backlog และวางแผน Sprint', prompts: ['วางแผน Sprint ถัดไป', 'ดึงงานค้างมาจัดตาราง'] },
  { id: 'release_notes', cat: 'engineering', title: 'Release Notes', icon: FileCode2, bg: 'bg-indigo-500', color: 'indigo', text: 'แปลงข้อมูลตั๋วงานให้เป็นบันทึกการอัปเดตภาษาอ่านง่าย', prompts: ['เขียน Release Notes', 'สรุปฟีเจอร์ใหม่สัปดาห์นี้'] },
  { id: 'prd_writer', cat: 'engineering', title: 'PRD Writer', icon: FileEdit, bg: 'bg-indigo-500', color: 'indigo', text: 'ร่างเอกสารความต้องการของระบบ (PRD) จากไอเดียสั้นๆ', prompts: ['ร่าง PRD ระบบล็อกอิน', 'เขียน Spec สำหรับฟีเจอร์แชท'] },
];

interface AgentsViewProps {
  onAgentClick: (agentId: string) => void;
}

export function AgentsView({ onAgentClick }: AgentsViewProps) {

  const categories = [
    { id: 'productivity', name: 'ประสิทธิภาพส่วนตัว (Productivity)', color: 'blue' },
    { id: 'engineering', name: 'วิศวกรรม (Engineering)', color: 'indigo' },
  ];

  return (
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-gray-50">
      <div className="max-w-6xl w-full mx-auto">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <BrainCircuit className="w-7 h-7 text-clickup-purple" /> คลังผู้ช่วยอัจฉริยะ (AI Agents Library)
            </h2>
            <p className="text-sm text-gray-500 mt-1">เลือกผู้ช่วย AI เฉพาะทางเพื่อช่วยจัดการงานของคุณได้อย่างแม่นยำ</p>
          </div>
        </div>

        <div className="space-y-8">
          {categories.map(cat => {
            const catAgents = agentsData.filter(a => a.cat === cat.id);
            if (catAgents.length === 0) return null;
            
            return (
              <div key={cat.id} className="mb-8">
                <h3 className={`text-lg font-bold text-gray-800 mb-4 border-l-4 pl-3`} style={{ borderColor: `var(--color-${cat.color}-500, #3b82f6)` }}>
                  {cat.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {catAgents.map(agent => (
                    <div key={agent.id} onClick={() => onAgentClick(agent.id)} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col group relative overflow-hidden">
                      <div className={`w-10 h-10 rounded-lg ${agent.bg} bg-opacity-10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <agent.icon className="w-5 h-5 text-current" style={{ color: `var(--color-${agent.color}-600, #2563eb)`}} />
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm mb-2">{agent.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">{agent.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
