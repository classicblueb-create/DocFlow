import React, { useState } from 'react';
import { Video, Sparkles, Loader2, Plus, X, Trash2, Calendar, Check, Copy, Clock, HelpCircle, Film, Radio, FileText, Flame, ExternalLink, Star, ChevronUp, ChevronDown, RefreshCw, Lightbulb } from 'lucide-react';
import { ContentPlan, Idea } from '../../types';
import { cn } from '../../lib/utils';

interface ContentPlanViewProps {
 ideas?: Idea[];
 contentPlans: ContentPlan[];
 onSaveContentPlan: (plan: ContentPlan) => Promise<void>;
 onDeleteContentPlan: (id: string) => Promise<void>;
 onUpdateContentPlan: (plan: ContentPlan) => Promise<void>;
 onRefreshContentPlans?: () => Promise<void>;
 isRefreshingPlans?: boolean;
}

const PLATFORMS = ['TikTok', 'YouTube', 'Facebook', 'Instagram', 'Blog', 'อื่นๆ'] as const;
const TONES = [
 { value: 'เป็นกันเอง', label: ' เป็นกันเอง/สนุกสนาน' },
 { value: 'วิชาการ/สาระแน่น', label: ' วิชาการ/น่าเชื่อถือ' },
 { value: 'ตลก/กวนๆ', label: ' ตลก/กวนๆ ชวนขำ' },
 { value: 'สร้างแรงบันดาลใจ', label: ' สร้างแรงบันดาลใจ/ดราม่า' },
 { value: 'ดึงดูดความสนใจ/กระตุ้น', label: ' ดึงดูด/ป้ายยาหยุดนิ้วโป้ง' }
];
const STATUSES = ['ไอเดีย/ร่าง', 'กำลังผลิต', 'กำหนดลง', 'เผยแพร่แล้ว'] as const;

const PLATFORM_THEMES: Record<string, { bg: string; text: string; border: string; bgBadge: string; iconBg: string }> = {
 TikTok: {
 bg: 'bg-zinc-950/90 hover:bg-zinc-950',
 text: 'text-white',
 border: 'border-zinc-800',
 bgBadge: 'bg-zinc-800 text-zinc-200 border-zinc-700',
 iconBg: 'bg-zinc-800 text-[#00f2fe]',
 },
 YouTube: {
 bg: 'bg-red-50 hover:bg-red-100/70',
 text: 'text-red-900',
 border: 'border-red-200',
 bgBadge: 'bg-red-100 text-red-700 border-red-200',
 iconBg: 'bg-red-500 text-white',
 },
 Facebook: {
 bg: 'bg-blue-50 hover:bg-blue-100/70',
 text: 'text-blue-900',
 border: 'border-blue-200',
 bgBadge: 'bg-blue-100 text-blue-700 border-blue-200',
 iconBg: 'bg-blue-600 text-white',
 },
 Instagram: {
 bg: 'bg-pink-50 hover:bg-pink-100/70',
 text: 'text-pink-900',
 border: 'border-pink-200',
 bgBadge: 'bg-pink-100 text-pink-700 border-pink-200',
 iconBg: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 text-white',
 },
 Blog: {
 bg: 'bg-indigo-50 hover:bg-indigo-100/70',
 text: 'text-indigo-900',
 border: 'border-indigo-200',
 bgBadge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
 iconBg: 'bg-indigo-600 text-white',
 },
 อื่นๆ: {
 bg: 'bg-slate-50 hover:bg-slate-100/70',
 text: 'text-slate-900',
 border: 'border-slate-200',
 bgBadge: 'bg-slate-100 text-slate-600 border-slate-200',
 iconBg: 'bg-slate-600 text-white',
 },
};

const STATUS_COLORS: Record<string, string> = {
 'ไอเดีย/ร่าง': 'bg-slate-100 text-slate-700 border-slate-200',
 'กำลังผลิต': 'bg-amber-100 text-amber-800 border-amber-200',
 'กำหนดลง': 'bg-blue-100 text-blue-800 border-blue-200',
 'เผยแพร่แล้ว': 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export function ContentPlanView({
 ideas = [],
 contentPlans,
 onSaveContentPlan,
 onDeleteContentPlan,
 onUpdateContentPlan,
 onRefreshContentPlans,
 isRefreshingPlans = false,
}: ContentPlanViewProps) {
  // Drag and Drop Idea States
  const [droppedIdea, setDroppedIdea] = useState<Idea | null>(null);
  const [droppedTier, setDroppedTier] = useState<'A+' | 'B+' | null>(null);

  const handleDropIdea = (e: React.DragEvent, tier: 'A+' | 'B+') => {
    e.preventDefault();
    const ideaId = e.dataTransfer.getData('text/plain');
    if (!ideaId || !ideas) return;
    const idea = ideas.find(i => i.id === ideaId);
    if (idea) {
      setDroppedIdea(idea);
      setDroppedTier(tier);
      setConcept(idea.description || idea.title);
    }
  };

  const handleClearDropped = () => {
    setDroppedIdea(null);
    setDroppedTier(null);
    setConcept('');
  };

 // AI Form States
 const [concept, setConcept] = useState('');
 const [platform, setPlatform] = useState<typeof PLATFORMS[number]>('TikTok');
 const [tone, setTone] = useState('เป็นกันเอง');
 const [audience, setAudience] = useState('');
 const [isBrainstorming, setIsBrainstorming] = useState(false);

 // Manual Creation States
 const [isAdding, setIsAdding] = useState(false);
 const [manualTitle, setManualTitle] = useState('');
 const [manualConcept, setManualConcept] = useState('');
 const [manualPlatform, setManualPlatform] = useState<typeof PLATFORMS[number]>('TikTok');
 const [manualDate, setManualDate] = useState('');

 // Search & Filter
 const [searchQ, setSearchQ] = useState('');
 const [filterPlatform, setFilterPlatform] = useState<string>('ทั้งหมด');
 const [filterStatus, setFilterStatus] = useState<string>('ทั้งหมด');

 // AI Brainstorm Result Panel (Temporary before save)
  const [tempResult, setTempResult] = useState<{
    title: string;
    concept: string;
    platform: typeof PLATFORMS[number];
    tone: string;
    audience: string;
    hooks: string[];
    outline: string;
    script: string;
    hashtags: string;
    engagementRating?: 'B+' | 'A+' | null;
  } | null>(null);

  // Copied state mapping
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Edit modal
  const [editingPlan, setEditingPlan] = useState<ContentPlan | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleBrainstorm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setIsBrainstorming(true);
    setTempResult(null);

    const systemPrompt = `คุณคือ AI Gemma ผู้เชี่ยวชาญด้านการวางแผนคอนเทนต์และคิดกลยุทธ์การตลาดออนไลน์ชั้นยอด (Content Creator Expert) สำหรับ ${platform}
คุณเชี่ยวชาญการเขียน Hook สะกดสายตา โครงเรื่อง (Outline) สคริปต์แบบเต็ม (Full script / voiceover) และแฮชแท็กตอบโจทย์กลุ่มเป้าหมาย`;

    const tierContext = droppedIdea && droppedTier
      ? `\n- ระดับความเป้าหมายความสำเร็จของไอเดียนี้: ระดับ ${droppedTier} (${
          droppedTier === 'A+' 
            ? 'เน้นความปังระดับไวรัลแมส ผู้เข้าชม 10,000+ ไลก์ 500+ เน้น Hook และสคริปต์ที่กระตุ้นอารมณ์ ดึงดูดความสนใจขั้นสุดหยุดนิ้วโป้งคนดูภายใน 3 วินาทีแรก'
            : 'เน้นความปังระดับคุณภาพสูงเจาะกลุ่มเป้าหมายคุณภาพ ผู้เข้าชม 5,000+ ไลก์ 100+ เน้นให้คนบันทึกเก็บไว้ดูซ้ำและส่งต่อ โครงสร้างข้อมูลละเอียดชัดเจน มีสาระครบถ้วน'
        })`
      : '';

    const userPrompt = `ระดมสมองคิดแผนคอนเทนต์อย่างละเอียดโดยมีข้อมูลดังนี้:
- คอนเซ็ปต์หลัก: ${concept}${tierContext}
- แพลตฟอร์ม: ${platform}
- โทนเสียง (Tone of Voice): ${tone}
- กลุ่มเป้าหมาย: ${audience || 'คนทั่วไป'}

ตอบกลับในรูปแบบ JSON บริสุทธิ์เท่านั้น (ห้ามมีอักขระอื่นนอกเหนือจาก JSON หรือสัญลักษณ์ markdown เช่น \`\`\`json หรือ \`\`\`) มีโครงสร้างดังนี้:
{
  "title": "ชื่อหัวข้อคลิป/บทความสั้นและดึงดูดใจ (ยาวไม่เกิน 60 ตัวอักษร)",
  "hooks": [
    "Hook แบบที่ 1 (แนวหยุดนิ้วโป้ง)",
    "Hook แบบที่ 2 (แนวตั้งคำถามเปิดประเด็น)",
    "Hook แบบที่ 3 (แนวสัจธรรม/ขยี้ปมความสงสัย)"
  ],
  "outline": "โครงสร้างการเล่าเรื่องแยกเป็นลำดับชัดเจน (เช่น 1. เปิดคลิป 2. จุดขยี้ 3. นำเสนอคำตอบ 4. ปิดคลิป/Call to Action)",
  "script": "สคริปต์คำพูดจริง/บทบรรยายโดยละเอียดสำหรับพูดในคลิปหรือโพสต์ (Full script / voiceover) เพื่อให้ผู้ใช้นำไปใช้อัดคลิปหรือลงงานได้ทันที",
  "hashtags": "แฮชแท็กฮิตที่เกี่ยวข้องคั่นด้วยเว้นวรรค เช่น #React #Coding"
}`;

  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: userPrompt }],
        agentTitle: 'เอไอช่วยระดมสมองคอนเทนต์',
        agentInstructions: systemPrompt,
        contextData: {},
      }),
    });

 const data = await response.json();
 if (!response.ok) throw new Error(data.error || 'AI ไม่ตอบสนอง');

 let jsonText = data.result || '';
 // Clean up markdown block if existing
 if (jsonText.includes('```')) {
 jsonText = jsonText.replace(/```json|```/gi, '').trim();
 }

 const parsed = JSON.parse(jsonText);
 setTempResult({
 title: parsed.title || `คอนเทนต์ ${platform} เรื่องใหม่`,
 concept: concept.trim(),
 platform,
 tone,
 audience: audience || 'คนทั่วไป',
 hooks: parsed.hooks || [],
 outline: parsed.outline || '',
 script: parsed.script || '',
 hashtags: parsed.hashtags || '',
 });
 } catch (error: any) {
 console.error(error);
 alert('เกิดข้อผิดพลาดในการเรียก AI: ' + error.message);
 } finally {
 setIsBrainstorming(false);
 }
 };

 const handleSaveTempResult = async () => {
 if (!tempResult) return;
 const newPlan: ContentPlan = {
 id: `cp-${Date.now()}`,
 title: tempResult.title,
 platform: tempResult.platform,
 status: 'ไอเดีย/ร่าง',
 concept: tempResult.concept,
 toneOfVoice: tempResult.tone,
 targetAudience: tempResult.audience,
 aiHooks: tempResult.hooks,
 aiOutline: tempResult.outline,
 aiScript: tempResult.script,
 aiHashtags: tempResult.hashtags,
 createdAt: new Date().toISOString(),
 };
 await onSaveContentPlan(newPlan);
 setTempResult(null);
 setConcept('');
 setAudience('');
 };

 const handleSaveManual = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!manualTitle.trim() || !manualConcept.trim()) return;

 const newPlan: ContentPlan = {
 id: `cp-${Date.now()}`,
 title: manualTitle.trim(),
 platform: manualPlatform,
 status: 'ไอเดีย/ร่าง',
 concept: manualConcept.trim(),
 publishDate: manualDate || undefined,
 createdAt: new Date().toISOString(),
 };

 await onSaveContentPlan(newPlan);
 setManualTitle('');
 setManualConcept('');
 setManualDate('');
 setIsAdding(false);
 };

 const handleDelete = async (id: string) => {
 if (window.confirm('ลบแผนงานคอนเทนต์นี้ใช่ไหม?')) {
 await onDeleteContentPlan(id);
 }
 };

 const handleStatusChange = async (plan: ContentPlan, newStatus: ContentPlan['status']) => {
 await onUpdateContentPlan({ ...plan, status: newStatus });
 };

 // Filter lists
 const filtered = contentPlans.filter(p => {
 const matchPlatform = filterPlatform === 'ทั้งหมด' || p.platform === filterPlatform;
 const matchStatus = filterStatus === 'ทั้งหมด' || p.status === filterStatus;
 const matchSearch = !searchQ || p.title.toLowerCase().includes(searchQ.toLowerCase()) || p.concept.toLowerCase().includes(searchQ.toLowerCase());
 return matchPlatform && matchStatus && matchSearch;
 });

 const stats = {
 total: contentPlans.length,
 draft: contentPlans.filter(p => p.status === 'ไอเดีย/ร่าง').length,
 production: contentPlans.filter(p => p.status === 'กำลังผลิต').length,
 published: contentPlans.filter(p => p.status === 'เผยแพร่แล้ว').length,
 };

 return (
 <div className="flex-1 overflow-y-auto hide-scrollbar p-4 md:p-6 bg-transparent">
 <div className="max-w-6xl w-full mx-auto space-y-6">

  {/* Notion sync bar */}
  <div className="flex items-center justify-between">
   <div>
    <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">แผนคอนเทนต์</h2>
    <p className="text-[10px] text-slate-400 mt-0.5">ดึงข้อมูลจาก Notion โดยตรง</p>
   </div>
   {onRefreshContentPlans && (
    <button
     onClick={onRefreshContentPlans}
     disabled={isRefreshingPlans}
     className="flex items-center gap-1.5 px-3 py-1.5 bg-white/70 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-white hover:border-indigo-300 hover:text-indigo-700 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
    >
     <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPlans ? 'animate-spin' : ''}`} />
     {isRefreshingPlans ? 'กำลังดึงข้อมูล...' : 'Sync จาก Notion'}
    </button>
   )}
  </div>

 {/* Stats Section */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {[
 { icon: Film, label: 'แผนงานทั้งหมด', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50/50 border-indigo-100/50' },
 { icon: HelpCircle, label: 'ไอเดีย/ร่าง', value: stats.draft, color: 'text-slate-600', bg: 'bg-slate-50/50 border-slate-100/50' },
 { icon: Radio, label: 'กำลังผลิต', value: stats.production, color: 'text-amber-600', bg: 'bg-amber-50/50 border-amber-100/50' },
 { icon: Flame, label: 'เผยแพร่แล้ว', value: stats.published, color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-100/50' },
 ].map(stat => (
 <div key={stat.label} className={cn('border rounded-[18px] p-4 flex items-center gap-3 bg-white/70 backdrop-blur-md shadow-sm', stat.bg)}>
 <div className={cn('w-9 h-9 rounded-xl bg-white border border-white/80 flex items-center justify-center shrink-0 shadow-sm', stat.color)}>
 <stat.icon className="w-[18px] h-[18px]" />
 </div>
 <div>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
 <p className={cn('text-2xl font-black', stat.color)}>{stat.value}</p>
 </div>
 </div>
 ))}
 </div>

 {/* Main interactive grid */}
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
 
 {/* Left: AI Generator Panel */}
 <div className="lg:col-span-5 space-y-6">
 <div className="glass-card rounded-[28px] p-6">
 <div className="flex items-center gap-2 mb-4">
 <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
 <Sparkles className="w-4.5 h-4.5 text-indigo-550 animate-pulse" />
 </div>
 <h3 className="font-black text-sm text-[#0f172a] uppercase tracking-wide">AI Content Assistant</h3>
 </div>

  <form onSubmit={handleBrainstorm} className="space-y-4">
    {/* Drag & Drop Target Slots */}
    <div className="grid grid-cols-2 gap-3 mb-2">
      {/* A+ Slot */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => handleDropIdea(e, 'A+')}
        className={cn(
          "border-2 border-dashed rounded-[22px] p-3 text-center transition-all duration-300 flex flex-col justify-center items-center gap-1 min-h-[90px] relative overflow-hidden",
          droppedIdea && droppedTier === 'A+'
            ? "border-rose-500 bg-rose-500/5 text-[#0f172a]"
            : "border-slate-200 hover:border-rose-500/50 bg-slate-50/50 text-slate-400"
        )}
      >
        {droppedIdea && droppedTier === 'A+' ? (
          <>
            <span className="absolute top-1 right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-500 text-white shadow-sm">A+ (Viral)</span>
            <Flame className="w-4 h-4 text-rose-500 mb-0.5 animate-pulse" />
            <h4 className="text-[10px] font-bold truncate max-w-full px-2 text-slate-800">{droppedIdea.title}</h4>
            <p className="text-[8px] text-slate-500 line-clamp-2 px-1 leading-snug">{droppedIdea.description}</p>
            <button 
              type="button" 
              onClick={handleClearDropped} 
              className="mt-1 text-[8px] text-rose-500 hover:text-rose-600 hover:underline font-bold cursor-pointer"
            >
              ล้างข้อมูล
            </button>
          </>
        ) : (
          <>
            <Flame className="w-4 h-4 text-rose-500/40" />
            <span className="text-[10px] font-bold text-slate-700">ลากไอเดียใส่ช่อง A+</span>
            <span className="text-[8px] text-slate-400 font-semibold">ปังระดับแมส</span>
          </>
        )}
      </div>

      {/* B+ Slot */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => handleDropIdea(e, 'B+')}
        className={cn(
          "border-2 border-dashed rounded-[22px] p-3 text-center transition-all duration-300 flex flex-col justify-center items-center gap-1 min-h-[90px] relative overflow-hidden",
          droppedIdea && droppedTier === 'B+'
            ? "border-amber-500 bg-amber-500/5 text-[#0f172a]"
            : "border-slate-200 hover:border-amber-500/50 bg-slate-50/50 text-slate-400"
        )}
      >
        {droppedIdea && droppedTier === 'B+' ? (
          <>
            <span className="absolute top-1 right-1 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">B+ (Engage)</span>
            <Star className="w-4 h-4 text-amber-500 mb-0.5 animate-pulse" />
            <h4 className="text-[10px] font-bold truncate max-w-full px-2 text-slate-800">{droppedIdea.title}</h4>
            <p className="text-[8px] text-slate-500 line-clamp-2 px-1 leading-snug">{droppedIdea.description}</p>
            <button 
              type="button" 
              onClick={handleClearDropped} 
              className="mt-1 text-[8px] text-amber-500 hover:text-amber-600 hover:underline font-bold cursor-pointer"
            >
              ล้างข้อมูล
            </button>
          </>
        ) : (
          <>
            <Star className="w-4 h-4 text-amber-500/40" />
            <span className="text-[10px] font-bold text-slate-700">ลากไอเดียใส่ช่อง B+</span>
            <span className="text-[8px] text-slate-400 font-semibold">ปังระดับเจาะจง</span>
          </>
        )}
      </div>
    </div>

  <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">คอนเซ็ปต์เนื้อหา / ไอเดียดิบ</label>
 <textarea
 required
 value={concept}
 onChange={e => setConcept(e.target.value)}
 placeholder="เช่น สอนเขียนแอปพลิเคชันด้วย React Native ภายใน 10 นาที หรือ แนะนำสกินแคร์กู้หน้าใสในงบ 300 บาท..."
 rows={4}
 className="glass-input w-full px-4 py-2 text-xs bg-white/5 resize-none text-slate-805"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">แพลตฟอร์ม</label>
 <select
 value={platform}
 onChange={e => setPlatform(e.target.value as any)}
 className="glass-input w-full px-3 py-1.5 text-xs bg-white/5 cursor-pointer text-slate-805"
 >
 {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">โทนเสียง / อารมณ์</label>
 <select
 value={tone}
 onChange={e => setTone(e.target.value)}
 className="glass-input w-full px-3 py-1.5 text-xs bg-white/5 cursor-pointer text-slate-805"
 >
 {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
 </select>
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">กลุ่มเป้าหมาย (ระบุหรือไม่ระบุก็ได้)</label>
 <input
 type="text"
 value={audience}
 onChange={e => setAudience(e.target.value)}
 placeholder="เช่น Freelancer, นักศึกษา, พนักงานออฟฟิศ..."
 className="glass-input w-full px-4 py-2 text-xs bg-white/5"
 />
 </div>

 <button
 type="submit"
 disabled={isBrainstorming || !concept.trim()}
 className="w-full flex items-center justify-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 border border-indigo-200/50 font-bold text-xs py-3.5 rounded-2xl transition-all shadow-sm active:scale-[0.98] cursor-pointer disabled:opacity-60"
 >
 {isBrainstorming ? (
 <>
 <Loader2 className="w-4 h-4 animate-spin text-white" />
 <span>กำลังคิดแผนงาน...</span>
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4 text-white animate-pulse" />
 <span> ระดมสมองกับ AI</span>
 </>
 )}
 </button>
 </form>
 </div>

 {/* Drag Source: Ideas Repository */}
  <div className="glass-card rounded-[28px] p-6 space-y-4">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <Lightbulb className="w-4.5 h-4.5 text-amber-550" />
      </div>
      <div>
        <h3 className="font-black text-sm text-[#0f172a] uppercase tracking-wide">คลังไอเดียสะสม</h3>
        <p className="text-[9px] text-slate-400 mt-0.5 font-bold">ลากไอเดียไปวางในช่อง A+ หรือ B+ เพื่อเขียนแผน</p>
      </div>
    </div>
    
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 hide-scrollbar">
      {(!ideas || ideas.length === 0) ? (
        <div className="text-center py-6 text-xs text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
          ไม่มีไอเดียในคลังขณะนี้
        </div>
      ) : (
        ideas.map(idea => (
          <div
            key={idea.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', idea.id);
              e.dataTransfer.effectAllowed = 'copyMove';
            }}
            className="bg-white/50 border border-slate-150 hover:border-indigo-400/50 p-3.5 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-200 select-none relative group shadow-sm hover:shadow"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-[9px] bg-amber-500/10 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">{idea.category || 'ทั่วไป'}</span>
              {idea.priority && (
                <span className={cn(
                  "text-[9px] font-bold px-2 py-0.5 rounded-full",
                  idea.priority === 'สูง' ? "bg-rose-500/10 text-rose-700 border border-rose-200" :
                  idea.priority === 'กลาง' ? "bg-amber-500/10 text-amber-700 border border-amber-250" :
                                             "bg-blue-500/10 text-blue-700 border border-blue-200"
                )}>
                  {idea.priority}
                </span>
              )}
            </div>
            <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-1">{idea.title}</h4>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-semibold">{idea.description}</p>
          </div>
        ))
      )}
    </div>
  </div>

 {/* Temporary AI Result Panel */}
 {tempResult && (
 <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[28px] p-6 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <div className="flex items-center justify-between border-b border-indigo-150 pb-3">
 <div>
 <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{tempResult.platform}</span>
 <h4 className="font-bold text-[#0f172a] text-sm mt-1">{tempResult.title}</h4>
 </div>
 <button onClick={() => setTempResult(null)} className="p-1 rounded-full hover:bg-indigo-100 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-4 h-4" /></button>
 </div>

 {/* 3 Hooks */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-indigo-655" /> Hooks แนะนำ (ดึงดูดสายตา)</p>
 </div>
 <div className="space-y-1.5">
 {tempResult.hooks.map((hook, i) => (
 <div key={i} className="flex items-start gap-2 bg-white/10 p-2.5 rounded-xl border border-white/10 text-xs text-slate-705">
 <span className="text-indigo-500 font-bold shrink-0">#{i + 1}</span>
 <p className="flex-1 font-medium">{hook}</p>
 <button onClick={() => handleCopy(hook, `hook-${i}`)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-slate-600 cursor-pointer transition-all">
 {copiedKey === `hook-${i}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
 </button>
 </div>
 ))}
 </div>
 </div>

 {/* Outline */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">โครงสร้างเนื้อหา (Outline)</p>
 <button onClick={() => handleCopy(tempResult.outline, 'outline')} className="text-[10px] font-bold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer">
 {copiedKey === 'outline' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
 คัดลอกโครงร่าง
 </button>
 </div>
 <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs text-slate-705 leading-relaxed font-mono whitespace-pre-line">
 {tempResult.outline}
 </div>
 </div>

 {/* Caption / Script */}
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">บทพูด / แคปชั่น (Caption/Script)</p>
 <button onClick={() => handleCopy(tempResult.script, 'script')} className="text-[10px] font-bold text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer">
 {copiedKey === 'script' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
 คัดลอกบทพูด
 </button>
 </div>
 <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs text-slate-705 leading-relaxed whitespace-pre-line">
 {tempResult.script}
 </div>
 </div>

 {/* Hashtags */}
 <div className="space-y-1">
 <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">แฮชแท็กแนะนำ</p>
 <p className="text-xs text-indigo-600 font-mono font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">{tempResult.hashtags}</p>
 </div>

 <div className="pt-2 flex gap-2">
 <button
 onClick={handleSaveTempResult}
 className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-2xl transition shadow-md active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
 >
 <Check className="w-4 h-4 text-emerald-400" /> บันทึกไอเดียคอนเทนต์นี้
 </button>
 <button
 onClick={() => setTempResult(null)}
 className="px-4 py-3 border border-slate-200 text-slate-500 font-semibold text-xs rounded-2xl hover:bg-slate-50 transition cursor-pointer active:scale-[0.98]"
 >
 ทิ้ง
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Right: Content Plans List */}
 <div className="lg:col-span-7 space-y-6">

 {/* Toolbar */}
 <div className="flex flex-wrap gap-2.5 items-center justify-between">
 <div className="flex flex-wrap gap-2 items-center flex-1">
 <input
 type="text"
 placeholder="ค้นหาแผนคอนเทนต์..."
 value={searchQ}
 onChange={e => setSearchQ(e.target.value)}
 className="glass-input text-xs px-3 py-1.5 flex-1 md:flex-initial text-slate-805"
 />
 <select
 value={filterPlatform}
 onChange={e => setFilterPlatform(e.target.value)}
 className="glass-input text-xs px-2 py-1.5 cursor-pointer text-slate-805"
 >
 <option value="ทั้งหมด">ช่องทาง: ทั้งหมด</option>
 {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
 </select>
 <select
 value={filterStatus}
 onChange={e => setFilterStatus(e.target.value)}
 className="glass-input text-xs px-2 py-1.5 cursor-pointer text-slate-855"
 >
 <option value="ทั้งหมด">สถานะ: ทั้งหมด</option>
 {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>

 <button
 onClick={() => setIsAdding(v => !v)}
 className="flex items-center gap-1 bg-white/20 text-slate-700 border border-white/30 hover:bg-white/30 text-xs font-bold px-3 py-2 rounded-xl backdrop-blur-sm cursor-pointer transition-all"
 >
 <Plus className="w-4 h-4 text-indigo-500" /> เขียนแผนเอง
 </button>
 </div>

 {/* Manual Form Toggle */}
 {isAdding && (
 <form onSubmit={handleSaveManual} className="glass-card rounded-[24px] p-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
 <div className="flex items-center justify-between border-b border-white/10 pb-2">
 <h4 className="font-black text-xs text-slate-800 uppercase tracking-wide">เขียนแผนคอนเทนต์ใหม่เอง</h4>
 <button type="button" onClick={() => setIsAdding(false)} className="p-1 rounded hover:bg-white/10 text-slate-400 cursor-pointer"><X className="w-4 h-4" /></button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <div className="md:col-span-2">
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">หัวข้อคอนเทนต์ *</label>
 <input
 type="text" required value={manualTitle} onChange={e => setManualTitle(e.target.value)}
 placeholder="เช่น รีวิวกาแฟดริปตอนเช้า"
 className="glass-input w-full px-3 py-1.5 text-xs bg-white/5 text-slate-805"
 />
 </div>
 <div className="md:col-span-2">
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">แนวคิด/คอนเซ็ปต์ *</label>
 <textarea
 required rows={3} value={manualConcept} onChange={e => setManualConcept(e.target.value)}
 placeholder="คอนเซ็ปต์สั้นๆ เช่น แชร์รสชาติกาแฟดริปของร้านเปิดใหม่ โทนชิวๆ"
 className="glass-input w-full px-3 py-1.5 text-xs bg-white/5 resize-none text-slate-805"
 />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">แพลตฟอร์ม</label>
 <select
 value={manualPlatform} onChange={e => setManualPlatform(e.target.value as any)}
 className="glass-input w-full px-3 py-1.5 text-xs bg-white/5 cursor-pointer text-slate-805"
 >
 {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">กำหนดลงงาน (ถ้ามี)</label>
 <input
 type="date" value={manualDate} onChange={e => setManualDate(e.target.value)}
 className="glass-input w-full px-3 py-1.5 text-xs bg-white/5 text-slate-805"
 />
 </div>
 </div>

 <div className="pt-2 flex gap-2">
 <button type="submit" className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer">
 บันทึกแผนงาน
 </button>
 <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2.5 border border-white/20 text-slate-500 font-semibold text-xs rounded-xl hover:bg-white/10 cursor-pointer">
 ยกเลิก
 </button>
 </div>
 </form>
 )}

 {/* List Grid */}
 {filtered.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-white/40 border border-white/20 rounded-[28px] shadow-sm">
 <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
 <Video className="w-6 h-6 text-slate-400" />
 </div>
 <div>
 <p className="font-bold text-slate-700 text-sm mb-1">ยังไม่มีแผนคอนเทนต์</p>
 <p className="text-[11px] text-slate-400 max-w-xs">ให้ AI ช่วยคิดด้านซ้าย หรือกดปุ่ม "เขียนแผนเอง" ด้านขวา เพื่อเริ่มจดไอเดียคอนเทนต์แรกของคุณ</p>
 </div>
 </div>
 ) : (
 <div className="space-y-4">
 {filtered.map(plan => {
 const isExpanded = expandedCardId === plan.id;
 const theme = PLATFORM_THEMES[plan.platform] || PLATFORM_THEMES.อื่นๆ;
 const isTikTok = plan.platform === "TikTok";
 const PlatformIcon = plan.platform === "Blog" ? FileText : Video;

 return (
 <div
 key={plan.id}
 className={cn(
 "rounded-[28px] border transition-all duration-300 hover:shadow-md overflow-hidden relative group",
 theme.bg,
 theme.border,
 theme.text
 )}
 >
 {/* Summary Card Header */}
 <div
 className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
 onClick={() => setEditingPlan(plan)}
 >
 <div className="flex items-center gap-3">
 <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", theme.iconBg)}>
 <PlatformIcon className="w-[18px] h-[18px]" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h4 className="font-bold text-sm leading-snug">{plan.title}</h4>
 {plan.engagementRating === 'B+' && (
 <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">B+</span>
 )}
 {plan.engagementRating === 'A+' && (
 <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">A+</span>
 )}
 </div>
 <div className="flex items-center gap-2 mt-1">
 <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", theme.bgBadge)}>
 {plan.platform}
 </span>
 {plan.publishDate && (
 <span className="text-[9px] font-medium flex items-center gap-1 opacity-70">
 <Calendar className="w-3 h-3" />
 {new Date(plan.publishDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
 </span>
 )}
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between md:justify-end gap-2" onClick={e => e.stopPropagation()}>
 {/* Engagement rating buttons — published only */}
 {plan.status === 'เผยแพร่แล้ว' && (
 <>
 <button
 title="B+ (views 5000+, likes 100+)"
 onClick={() => onUpdateContentPlan({ ...plan, engagementRating: plan.engagementRating === 'B+' ? null : 'B+' })}
 className={cn("p-1.5 rounded-lg transition-colors cursor-pointer border", plan.engagementRating === 'B+' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'hover:bg-amber-50 text-slate-400 border-transparent')}
 >
 <Star className="w-3.5 h-3.5" />
 </button>
 <button
 title="A+ (views 10000+, likes 500+)"
 onClick={() => onUpdateContentPlan({ ...plan, engagementRating: plan.engagementRating === 'A+' ? null : 'A+' })}
 className={cn("p-1.5 rounded-lg transition-colors cursor-pointer border", plan.engagementRating === 'A+' ? 'bg-rose-100 text-rose-600 border-rose-300' : 'hover:bg-rose-50 text-slate-400 border-transparent')}
 >
 <Flame className="w-3.5 h-3.5" />
 </button>
 </>
 )}

 {/* Status Selector */}
 <select
 value={plan.status}
 onChange={e => handleStatusChange(plan, e.target.value as any)}
 className={cn(
 "text-[10px] font-bold px-2.5 py-1 rounded-xl border cursor-pointer focus:ring-1 focus:ring-indigo-500",
 STATUS_COLORS[plan.status]
 )}
 >
 {STATUSES.map(status => (
 <option key={status} value={status}>{status}</option>
 ))}
 </select>

 {/* Notion link */}
 {plan.notionUrl && (
 <a
 href={plan.notionUrl}
 target="_blank"
 rel="noopener noreferrer"
 title="เปิดใน Notion"
 className="p-1.5 hover:bg-slate-500/10 rounded-lg text-slate-400 hover:text-slate-700 transition-colors flex items-center"
 onClick={e => e.stopPropagation()}
 >
 <ExternalLink className="w-4 h-4" />
 </a>
 )}

 {/* Delete Button */}
 <button
 onClick={() => onDeleteContentPlan(plan.id)}
 className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors cursor-pointer"
 title="ลบแผนงาน"
 >
 <Trash2 className="w-4 h-4" />
 </button>

 {/* Toggle Expand Icon */}
 <button
 onClick={e => { e.stopPropagation(); setExpandedCardId(isExpanded ? null : plan.id); }}
 className="p-1 hover:bg-slate-500/10 rounded-lg cursor-pointer text-current"
 >
 {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
 </button>
 </div>
 </div>

 {/* Expanded Section showing Details & AI Brainstorm results */}
 {isExpanded && (
 isTikTok ? (
 <div className="border-t border-white/10 bg-white/5 p-4 space-y-3.5 animate-in fade-in duration-200 text-slate-300">
 <div>
 <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">ไอเดียดิบ / คอนเซ็ปต์</span>
 <p className="text-xs text-slate-200 font-medium leading-relaxed mt-0.5">{plan.concept}</p>
 </div>

 {plan.toneOfVoice && (
 <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-450 bg-white/10 p-2 rounded-xl border border-white/10">
 <div>โทนเสียง: <strong className="text-white">{plan.toneOfVoice}</strong></div>
 <div>กลุ่มเป้าหมาย: <strong className="text-white">{plan.targetAudience || "คนทั่วไป"}</strong></div>
 </div>
 )}

 {plan.aiHooks && plan.aiHooks.length > 0 && (
 <div className="space-y-2">
 <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">Hooks ที่ AI ช่วยคิด:</span>
 <div className="space-y-1.5">
 {plan.aiHooks.map((hook, idx) => (
 <div key={idx} className="flex items-start gap-2 bg-white/10 p-2.5 rounded-xl border border-white/10 text-xs text-slate-200">
 <span className="text-indigo-400 font-bold shrink-0">#{idx + 1}</span>
 <p className="flex-1 font-medium">{hook}</p>
 <button onClick={() => handleCopy(hook, `plan-hook-${idx}`)} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white cursor-pointer">
 {copiedKey === `plan-hook-${idx}` ? <Check className="w-3 h-3 text-emerald-450" /> : <Copy className="w-3 h-3" />}
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {plan.aiOutline && (
 <div className="space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">โครงเรื่อง (Outline):</span>
 <button onClick={() => handleCopy(plan.aiOutline!, "plan-outline")} className="text-[9px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer">
 {copiedKey === "plan-outline" ? <Check className="w-3 h-3 text-emerald-455" /> : <Copy className="w-3 h-3" />} คัดลอก
 </button>
 </div>
 <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-line">
 {plan.aiOutline}
 </div>
 </div>
 )}

 {plan.aiScript && (
 <div className="space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">บทพูด / สคริปต์ / แคปชั่น:</span>
 <button onClick={() => handleCopy(plan.aiScript!, "plan-script")} className="text-[9px] text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer">
 {copiedKey === "plan-script" ? <Check className="w-3 h-3 text-emerald-455" /> : <Copy className="w-3 h-3" />} คัดลอก
 </button>
 </div>
 <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-xs text-slate-200 leading-relaxed whitespace-pre-line">
 {plan.aiScript}
 </div>
 </div>
 )}

 {plan.aiHashtags && (
 <div>
 <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">แฮชแท็ก:</span>
 <p className="text-[11px] text-indigo-400 font-mono font-bold mt-0.5 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 inline-block">{plan.aiHashtags}</p>
 </div>
 )}

 {/* Created date */}
 <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 pt-1">
 <Clock className="w-3 h-3" />
 สร้างเมื่อ: {new Date(plan.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
 </div>
 </div>
 ) : (
 <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3.5 animate-in fade-in duration-200 text-slate-600">
 <div>
 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ไอเดียดิบ / คอนเซ็ปต์</span>
 <p className="text-xs text-slate-700 font-medium leading-relaxed mt-0.5">{plan.concept}</p>
 </div>

 {plan.toneOfVoice && (
 <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 bg-white p-2 rounded-xl border border-slate-100">
 <div>โทนเสียง: <strong className="text-slate-700">{plan.toneOfVoice}</strong></div>
 <div>กลุ่มเป้าหมาย: <strong className="text-slate-700">{plan.targetAudience || "คนทั่วไป"}</strong></div>
 </div>
 )}

 {plan.aiHooks && plan.aiHooks.length > 0 && (
 <div className="space-y-2">
 <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">Hooks ที่ AI ช่วยคิด:</span>
 <div className="space-y-1.5">
 {plan.aiHooks.map((hook, idx) => (
 <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-indigo-100/50 text-xs text-slate-700">
 <span className="text-indigo-500 font-bold shrink-0">#{idx + 1}</span>
 <p className="flex-1 font-medium">{hook}</p>
 <button onClick={() => handleCopy(hook, `plan-hook-${idx}`)} className="p-1 hover:bg-slate-55 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
 {copiedKey === `plan-hook-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
 </button>
 </div>
 ))}
 </div>
 </div>
 )}

 {plan.aiOutline && (
 <div className="space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">โครงเรื่อง (Outline):</span>
 <button onClick={() => handleCopy(plan.aiOutline!, "plan-outline")} className="text-[9px] text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer">
 {copiedKey === "plan-outline" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} คัดลอก
 </button>
 </div>
 <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-line">
 {plan.aiOutline}
 </div>
 </div>
 )}

 {plan.aiScript && (
 <div className="space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">บทพูด / สคริปต์ / แคปชั่น:</span>
 <button onClick={() => handleCopy(plan.aiScript!, "plan-script")} className="text-[9px] text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer">
 {copiedKey === "plan-script" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />} คัดลอก
 </button>
 </div>
 <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
 {plan.aiScript}
 </div>
 </div>
 )}

 {plan.aiHashtags && (
 <div>
 <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">แฮชแท็ก:</span>
 <p className="text-[11px] text-indigo-600 font-mono font-bold mt-0.5 bg-white px-2.5 py-1 rounded-lg border border-slate-100 inline-block">{plan.aiHashtags}</p>
 </div>
 )}

 {/* Created date */}
 <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 pt-1">
 <Clock className="w-3 h-3" />
 สร้างเมื่อ: {new Date(plan.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}
 </div>
 </div>
 )
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>

 </div>

 {/* Full Edit Modal */}
 {editingPlan && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setEditingPlan(null)}>
 <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
 <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-[28px]">
 <h2 className="font-black text-sm text-slate-900">แก้ไขแผนคอนเทนต์</h2>
 <button onClick={() => setEditingPlan(null)} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">หัวข้อ</label>
 <input value={editingPlan.title} onChange={e => setEditingPlan({ ...editingPlan, title: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">แพลตฟอร์ม</label>
 <select value={editingPlan.platform} onChange={e => setEditingPlan({ ...editingPlan, platform: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 cursor-pointer">
 {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">สถานะ</label>
 <select value={editingPlan.status} onChange={e => setEditingPlan({ ...editingPlan, status: e.target.value as ContentPlan['status'] })}
 className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 cursor-pointer">
 {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
 </select>
 </div>
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">คอนเซ็ปต์</label>
 <textarea rows={3} value={editingPlan.concept} onChange={e => setEditingPlan({ ...editingPlan, concept: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 resize-none" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">โทนเสียง</label>
 <input value={editingPlan.toneOfVoice || ''} onChange={e => setEditingPlan({ ...editingPlan, toneOfVoice: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400" />
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">กลุ่มเป้าหมาย</label>
 <input value={editingPlan.targetAudience || ''} onChange={e => setEditingPlan({ ...editingPlan, targetAudience: e.target.value })}
 className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400" />
 </div>
 </div>
 <div>
 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">วันที่เผยแพร่</label>
 <input type="date" value={editingPlan.publishDate || ''} onChange={e => setEditingPlan({ ...editingPlan, publishDate: e.target.value || undefined })}
 className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400" />
 </div>
 {editingPlan.aiHooks && editingPlan.aiHooks.length > 0 && (
 <div>
 <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Hooks (AI-generated)</label>
 <div className="space-y-1">
 {editingPlan.aiHooks.map((h, i) => (
 <div key={i} className="text-xs bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl text-slate-700">
 <span className="text-indigo-400 font-bold mr-1">#{i+1}</span>{h}
 </div>
 ))}
 </div>
 </div>
 )}
 {editingPlan.aiOutline && (
 <div>
 <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Outline (AI-generated)</label>
 <div className="text-xs bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl text-slate-700 whitespace-pre-line font-mono">{editingPlan.aiOutline}</div>
 </div>
 )}
 {editingPlan.aiScript && (
 <div>
 <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Script (AI-generated)</label>
 <div className="text-xs bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl text-slate-700 whitespace-pre-line max-h-40 overflow-y-auto">{editingPlan.aiScript}</div>
 </div>
 )}
 {editingPlan.aiHashtags && (
 <div>
 <label className="block text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Hashtags (AI-generated)</label>
 <div className="text-xs bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl text-indigo-600 font-mono font-bold">{editingPlan.aiHashtags}</div>
 </div>
 )}
 {editingPlan.notionUrl && (
 <div className="flex items-center gap-2 text-xs text-slate-500">
 <ExternalLink className="w-3.5 h-3.5" />
 <a href={editingPlan.notionUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">เปิดใน Notion</a>
 </div>
 )}
 <div className="pt-2 flex gap-2">
 <button
 onClick={async () => { await onUpdateContentPlan(editingPlan); setEditingPlan(null); }}
 className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white font-bold text-sm py-3 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
 >
 <Check className="w-4 h-4 text-emerald-400" /> บันทึก &amp; ซิงค์ Notion
 </button>
 <button onClick={() => setEditingPlan(null)} className="px-5 py-3 border border-slate-200 text-slate-500 font-semibold text-sm rounded-2xl hover:bg-slate-50 cursor-pointer">
 ปิด
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
