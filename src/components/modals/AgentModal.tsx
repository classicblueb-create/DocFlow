import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { agentsData } from '../views/AgentsView';

interface AgentModalProps {
  agentId: string | null;
  onClose: () => void;
}

export function AgentModal({ agentId, onClose }: AgentModalProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'agent', text: string}[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const agent = agentsData.find(a => a.id === agentId) || {
    id: 'general', cat: 'general', title: 'ผู้ช่วยมดตี้ (General)', icon: Bot, bg: 'bg-clickup-purple', color: 'indigo', text: 'จำข้อมูลลูกค้าและโปรเจกต์ของคุณไว้หมดแล้วค่ะ สั่งงานได้เลย!', prompts: ['สรุปงานด่วนวันนี้', 'มีงานไหนเกินกำหนดบ้าง?']
  };

  useEffect(() => {
    if (agentId) {
      setMessages([{
        role: 'agent',
        text: `สวัสดีค่ะ! <b>${agent.title}</b> พร้อมให้บริการค่ะ 😊<br/><br/>${agent.text}`
      }]);
    }
  }, [agentId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!agentId) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user' as const, text: input }];
    setMessages(newMessages);
    setInput('');
    
    // Add temporary thinking indicator
    const placeholderIndex = newMessages.length;
    setMessages(prev => [...prev, { role: 'agent', text: `<i>กำลังประมวลผลข้อมูลด้วย AI...</i>` }]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          agentTitle: agent.title,
          agentInstructions: agent.text
        })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to chat with AI");
      }
      
      setMessages(prev => {
        const updated = [...prev];
        updated[placeholderIndex] = { role: 'agent', text: data.result };
        return updated;
      });
    } catch (e: any) {
      console.error(e);
      setMessages(prev => {
        const updated = [...prev];
        updated[placeholderIndex] = { role: 'agent', text: `<span class="text-red-500">[เกิดข้อผิดพลาด: ${e.message || 'กรุณาลองใหม่อีกครั้ง'}]</span>` };
        return updated;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 via-purple-50 to-white">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg relative", agent.bg)}>
              <agent.icon className="w-6 h-6" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">{agent.title}</h2>
              <p className="text-xs text-gray-500">{agent.text}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-md border shadow-sm hover:bg-gray-50 transition"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="flex-1 flex flex-col bg-gray-50/50 relative overflow-hidden">
          {agent.prompts && (
            <div className="p-3 border-b border-gray-200 bg-white shadow-sm overflow-x-auto hide-scrollbar z-10 shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2"><Sparkles className="w-3.5 h-3.5 text-amber-500"/> คำถามแนะนำ (Smart Prompts)</div>
              <div className="flex gap-2 w-max">
                {agent.prompts.map((p, i) => (
                  <button key={i} onClick={() => setInput(p)} className={cn("px-3 py-1.5 bg-gray-50 border rounded-lg text-xs font-bold shadow-sm hover:text-white transition whitespace-nowrap", agent.bg.replace('bg-', 'hover:bg-'))}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex w-full mb-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
                {msg.role === 'user' ? (
                  <div className="bg-gray-800 text-white px-4 py-3 rounded-2xl rounded-br-sm text-sm max-w-[85%]">{msg.text}</div>
                ) : (
                  <div className="flex items-start gap-3 w-full max-w-[85%]">
                    <div className={cn("w-8 h-8 rounded-full bg-opacity-10 flex justify-center items-center shrink-0", agent.bg.replace('bg-', 'text-'))}>
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm" dangerouslySetInnerHTML={{__html: msg.text}} />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
          
          <div className="p-4 bg-white border-t border-gray-200 shrink-0">
            <div className="relative flex items-end gap-2">
              <textarea 
                value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                rows={2} 
                placeholder="พิมพ์สั่งงาน..." 
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-clickup-purple outline-none resize-none"
              ></textarea>
              <button 
                onClick={handleSend}
                className={cn("w-12 h-12 rounded-xl text-white shadow-md flex justify-center items-center shrink-0 hover:opacity-90 transition-opacity", agent.bg)}
              >
                <Send className="w-5 h-5"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
