import { Client, Template } from '../../types';
import { Users, Library } from 'lucide-react';

export function ClientsView({ clients }: { clients: Client[] }) {
  return (
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-gray-50">
      <div className="max-w-6xl w-full mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-emerald-500" /> ฐานลูกค้า
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(client => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border p-5 flex flex-col">
              <h3 className="font-bold text-gray-800 text-lg mb-1">{client.name}</h3>
              <p className="text-xs text-gray-500 mb-4">{client.address}</p>
              <div className="mt-auto space-y-2 text-sm pt-4 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax ID:</span>
                  <span className="font-medium">{client.taxId}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Target Budget:</span>
                  <span>฿{client.targetBudget.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
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

export function TemplatesView({ templates }: { templates: Template[] }) {
  return (
    <div className="flex-1 flex-col overflow-y-auto hide-scrollbar p-4 md:p-6 flex bg-gray-50">
      <div className="max-w-6xl w-full mx-auto">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Library className="w-6 h-6 text-blue-500" /> คลังงาน (Template Library)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {templates.map(template => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border p-5 hover:border-blue-300 transition-colors cursor-pointer">
              <h3 className="font-bold text-gray-800 text-sm mb-2">{template.name}</h3>
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">{template.details}</p>
              <p className="font-bold text-blue-600 text-sm">฿{template.price.toLocaleString()}</p>
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
