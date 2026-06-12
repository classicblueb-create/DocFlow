import React, { useState } from 'react';
import { Client, Template } from '../../types';
import { Users, Library, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ClientsViewProps {
  clients: Client[];
  onCreateClient: (client: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
}

export function ClientsView({ clients, onCreateClient, onDeleteClient }: ClientsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [targetBudget, setTargetBudget] = useState('');
  const [color, setColor] = useState('blue');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateClient({
      name,
      address,
      taxId,
      targetBudget: Number(targetBudget) || 0,
      color
    });
    setName('');
    setAddress('');
    setTaxId('');
    setTargetBudget('');
    setColor('blue');
    setIsAdding(false);
  };

  return (
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-gray-50">
      <div className="max-w-6xl w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" /> ฐานลูกค้า
          </h2>
          <button 
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow transition"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? 'ยกเลิก' : 'เพิ่มลูกค้าใหม่'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-gray-800 text-sm">ระบุข้อมูลลูกค้า</h3>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">ชื่อลูกค้า / บริษัท *</label>
              <input type="text" value={name} onChange={e=>setName(e.target.value)} required placeholder="เช่น บริษัท เจริญ จำกัด" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
              <input type="text" value={taxId} onChange={e=>setTaxId(e.target.value)} placeholder="เช่น 01055xxxxxxxx" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 mb-1">ที่อยู่</label>
              <textarea value={address} onChange={e=>setAddress(e.target.value)} rows={2} placeholder="ที่อยู่ติดต่อผู้รับเอกสาร..." className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">งบประมาณโครงการประมาณการ (฿)</label>
              <input type="number" value={targetBudget} onChange={e=>setTargetBudget(e.target.value)} placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">สีประจำป้ายแท็ก</label>
              <select value={color} onChange={e=>setColor(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="blue">Blue</option>
                <option value="indigo">Indigo</option>
                <option value="emerald">Emerald</option>
                <option value="rose">Rose</option>
                <option value="amber">Amber</option>
                <option value="purple">Purple</option>
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition">บันทึก</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => {
            const bgClassMap: Record<string, string> = {
              blue: 'border-l-blue-500',
              indigo: 'border-l-indigo-500',
              emerald: 'border-l-emerald-500',
              rose: 'border-l-rose-500',
              amber: 'border-l-amber-500',
              purple: 'border-l-purple-500',
            };
            const borderLeft = bgClassMap[client.color] || 'border-l-indigo-500';

            return (
              <div key={client.id} className={cn("bg-white rounded-xl shadow-sm border border-l-4 p-5 flex flex-col group relative", borderLeft)}>
                <button 
                  type="button"
                  onClick={() => onDeleteClient(client.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="ลบลูกค้า"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-gray-800 text-lg mb-1 pr-6">{client.name}</h3>
                <p className="text-xs text-gray-500 mb-4 whitespace-pre-wrap">{client.address || 'ไม่มีที่อยู่'}</p>
                <div className="mt-auto space-y-2 text-sm pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax ID:</span>
                    <span className="font-medium">{client.taxId || '-'}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Target Budget:</span>
                    <span>฿{client.targetBudget.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {clients.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed rounded-xl">
              ไม่มีข้อมูลลูกค้า
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface TemplatesViewProps {
  templates: Template[];
  onCreateTemplate: (template: Partial<Template>) => void;
  onDeleteTemplate: (id: string) => void;
}

export function TemplatesView({ templates, onCreateTemplate, onDeleteTemplate }: TemplatesViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [details, setDetails] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateTemplate({
      name,
      price: Number(price) || 0,
      details
    });
    setName('');
    setPrice('');
    setDetails('');
    setIsAdding(false);
  };

  return (
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-gray-50">
      <div className="max-w-6xl w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Library className="w-6 h-6 text-blue-500" /> คลังงาน (Template Library)
          </h2>
          <button 
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow transition"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? 'ยกเลิก' : 'เพิ่มเทมเพลตใหม่'}
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 mb-6 space-y-4">
            <h3 className="font-bold text-gray-800 text-sm pb-2 border-b">ระบุข้อมูลเทมเพลตงาน</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ชื่อสโคปงาน / แพ็กเกจ *</label>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} required placeholder="เช่น พัฒนาหน้าเว็บ Landing Page" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ราคามาตรฐาน (฿)</label>
                <input type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">รายละเอียดและสโคปของงาน</label>
              <textarea value={details} onChange={e=>setDetails(e.target.value)} rows={3} placeholder="เช่น ออกแบบ UI/UX, เขียน React, ซิงค์หลังบ้าน..." className="w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-sm transition">บันทึก</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border p-5 hover:border-blue-300 transition-all cursor-pointer relative group flex flex-col justify-between">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onDeleteTemplate(template.id); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="ลบเทมเพลต"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-2 pr-6">{template.name}</h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-3">{template.details || 'ไม่มีรายละเอียด'}</p>
              </div>
              <p className="font-bold text-blue-600 text-sm border-t pt-2 mt-auto">฿{template.price.toLocaleString()}</p>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500 border border-dashed rounded-xl">
              ไม่มีข้อมูลเทมเพลต
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
