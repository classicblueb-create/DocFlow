import React, { useState, useEffect } from 'react';
import { X, User, MapPin, CreditCard, Building2, Phone, Mail, Globe, MessageSquare } from 'lucide-react';
import { Client } from '../../types';
import { cn } from '../../lib/utils';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Partial<Client>) => void;
  initialClient?: Client | null;
}

type TabType = 'general' | 'address' | 'financial';

export function ClientModal({ isOpen, onClose, onSave, initialClient }: ClientModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // General & Contact fields
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState<'individual' | 'company' | 'government' | ''>('');
  const [industry, setIndustry] = useState('');
  const [color, setColor] = useState('blue');
  const [contactName, setContactName] = useState('');
  const [contactTitle, setContactTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [lineId, setLineId] = useState('');
  const [website, setWebsite] = useState('');

  // Address & VAT fields
  const [taxId, setTaxId] = useState('');
  const [companyRegNo, setCompanyRegNo] = useState('');
  const [vatRegistered, setVatRegistered] = useState(false);
  const [address, setAddress] = useState('');
  const [subDistrict, setSubDistrict] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Thailand');

  // Financial & Notes fields
  const [targetBudget, setTargetBudget] = useState('');
  const [currency, setCurrency] = useState('THB');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialClient) {
        setName(initialClient.name || '');
        setBusinessType(initialClient.businessType || '');
        setIndustry(initialClient.industry || '');
        setColor(initialClient.color || 'blue');
        setContactName(initialClient.contactName || '');
        setContactTitle(initialClient.contactTitle || '');
        setEmail(initialClient.email || '');
        setPhone(initialClient.phone || '');
        setMobile(initialClient.mobile || '');
        setLineId(initialClient.lineId || '');
        setWebsite(initialClient.website || '');

        setTaxId(initialClient.taxId || '');
        setCompanyRegNo(initialClient.companyRegNo || '');
        setVatRegistered(!!initialClient.vatRegistered);
        setAddress(initialClient.address || '');
        setSubDistrict(initialClient.subDistrict || '');
        setDistrict(initialClient.district || '');
        setProvince(initialClient.province || '');
        setPostalCode(initialClient.postalCode || '');
        setCountry(initialClient.country || 'Thailand');

        setTargetBudget(initialClient.targetBudget?.toString() || '');
        setCurrency(initialClient.currency || 'THB');
        setPaymentTerms(initialClient.paymentTerms || '');
        setCreditLimit(initialClient.creditLimit?.toString() || '');
        setSource(initialClient.source || '');
        setNotes(initialClient.notes || '');
      } else {
        setName('');
        setBusinessType('');
        setIndustry('');
        setColor('blue');
        setContactName('');
        setContactTitle('');
        setEmail('');
        setPhone('');
        setMobile('');
        setLineId('');
        setWebsite('');

        setTaxId('');
        setCompanyRegNo('');
        setVatRegistered(false);
        setAddress('');
        setSubDistrict('');
        setDistrict('');
        setProvince('');
        setPostalCode('');
        setCountry('Thailand');

        setTargetBudget('');
        setCurrency('THB');
        setPaymentTerms('');
        setCreditLimit('');
        setSource('');
        setNotes('');
      }
      setActiveTab('general');
    }
  }, [isOpen, initialClient]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      alert('กรุณากรอกชื่อลูกค้า / บริษัท ก่อนค่ะ');
      return;
    }
    onSave({
      id: initialClient?.id, // keep original ID if editing
      name,
      businessType: businessType || undefined,
      industry: industry || undefined,
      color,
      contactName: contactName || undefined,
      contactTitle: contactTitle || undefined,
      email: email || undefined,
      phone: phone || undefined,
      mobile: mobile || undefined,
      lineId: lineId || undefined,
      website: website || undefined,
      taxId: taxId || undefined,
      companyRegNo: companyRegNo || undefined,
      vatRegistered,
      address: address || undefined,
      subDistrict: subDistrict || undefined,
      district: district || undefined,
      province: province || undefined,
      postalCode: postalCode || undefined,
      country: country || undefined,
      targetBudget: Number(targetBudget) || 0,
      currency: currency || undefined,
      paymentTerms: paymentTerms || undefined,
      creditLimit: creditLimit ? Number(creditLimit) : undefined,
      source: source || undefined,
      notes: notes || undefined,
    });
    onClose();
  };

  const Toggle = ({ enabled, setEnabled, label }: {
    enabled: boolean; setEnabled: (v: boolean) => void; label: string;
  }) => (
    <div className="flex items-center justify-between py-2 px-1 hover:bg-slate-50 rounded-lg transition-colors">
      <span className="text-xs font-bold text-slate-650">{label}</span>
      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={cn('w-9 h-5 rounded-full transition-colors relative focus:outline-none cursor-pointer', enabled ? 'bg-emerald-500' : 'bg-slate-200')}
      >
        <span className={cn('absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200', enabled ? 'translate-x-4' : '')} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            {initialClient ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={cn(
              "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
              activeTab === 'general' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <User className="w-3.5 h-3.5" />
            ข้อมูลทั่วไป & ติดต่อ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={cn(
              "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
              activeTab === 'address' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <MapPin className="w-3.5 h-3.5" />
            ที่อยู่ & ภาษี
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={cn(
              "flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
              activeTab === 'financial' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <CreditCard className="w-3.5 h-3.5" />
            การเงิน & หมายเหตุ
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
          
          {/* TAB 1: General & Contact Info */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ชื่อลูกค้า / บริษัท <span className="text-red-500">*</span></label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="เช่น บริษัท เจริญ จำกัด"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ประเภทธุรกิจ</label>
                  <select
                    value={businessType}
                    onChange={e => setBusinessType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white text-slate-800 cursor-pointer focus:border-emerald-400"
                  >
                    <option value="">เลือกประเภทธุรกิจ</option>
                    <option value="company">นิติบุคคล (Company)</option>
                    <option value="individual">บุคคลธรรมดา (Individual)</option>
                    <option value="government">หน่วยงานรัฐ (Government)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">อุตสาหกรรม (Industry)</label>
                  <input
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    placeholder="เช่น E-commerce, อสังหาริมทรัพย์"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">สีแท็กประจำลูกค้า</label>
                  <select
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white text-slate-800 cursor-pointer focus:border-emerald-400"
                  >
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                    <option value="emerald">Emerald</option>
                    <option value="rose">Rose</option>
                    <option value="amber">Amber</option>
                    <option value="purple">Purple</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <h4 className="font-bold text-slate-700 text-xs mb-3 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" /> ข้อมูลติดต่อผู้ประสานงานหลัก
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-650 mb-1.5">ชื่อผู้ติดต่อ</label>
                    <input
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="เช่น คุณสมศักดิ์ รักดี"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-650 mb-1.5">ตำแหน่ง</label>
                    <input
                      value={contactTitle}
                      onChange={e => setContactTitle(e.target.value)}
                      placeholder="เช่น ผู้จัดการฝ่ายจัดซื้อ"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5 flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> อีเมล</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@client.com"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> เบอร์โทรศัพท์สำนักงาน</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="เช่น 02-123-4567"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5 flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> เบอร์มือถือ</label>
                  <input
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    placeholder="เช่น 081-234-5678"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5 flex items-center gap-1 flex items-center gap-1">Line ID</label>
                  <input
                    value={lineId}
                    onChange={e => setLineId(e.target.value)}
                    placeholder="เช่น @lineid"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5 flex items-center gap-1"><Globe className="w-3 h-3 text-slate-400" /> เว็บไซต์</label>
                  <input
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="www.clientwebsite.com"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Address & VAT */}
          {activeTab === 'address' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">เลขประจำตัวผู้เสียภาษี (Tax ID)</label>
                  <input
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                    placeholder="เลขประจำตัวผู้เสียภาษี 13 หลัก"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">เลขทะเบียนนิติบุคคล</label>
                  <input
                    value={companyRegNo}
                    onChange={e => setCompanyRegNo(e.target.value)}
                    placeholder="เลขทะเบียนบริษัท"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Toggle enabled={vatRegistered} setEnabled={setVatRegistered} label="จดทะเบียนภาษีมูลค่าเพิ่ม (VAT Registered 7%)" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ที่อยู่วางบิล / ส่งเอกสารหลัก</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  placeholder="บ้านเลขที่, ถนน, หมู่บ้าน, อาคาร..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">ตำบล / แขวง</label>
                  <input
                    value={subDistrict}
                    onChange={e => setSubDistrict(e.target.value)}
                    placeholder="ตำบล"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">อำเภอ / เขต</label>
                  <input
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    placeholder="อำเภอ"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">จังหวัด</label>
                  <input
                    value={province}
                    onChange={e => setProvince(e.target.value)}
                    placeholder="จังหวัด"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">รหัสไปรษณีย์</label>
                  <input
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="เช่น 10110"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">ประเทศ</label>
                  <input
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="เช่น Thailand"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Financial & Notes */}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">งบประมาณโครงการประมาณการ (฿)</label>
                  <input
                    type="number"
                    value={targetBudget}
                    onChange={e => setTargetBudget(e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">สกุลเงินหลัก (Currency)</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white text-slate-800 cursor-pointer focus:border-emerald-400"
                  >
                    <option value="THB">THB (฿)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">เงื่อนไขการชำระเงิน (Payment Terms)</label>
                  <input
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value)}
                    placeholder="เช่น เครดิต 30 วัน, แบ่งชำระ 3 งวด"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-650 mb-1.5">วงเงินเครดิต (Credit Limit - ฿)</label>
                  <input
                    type="number"
                    value={creditLimit}
                    onChange={e => setCreditLimit(e.target.value)}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-650 mb-1.5">แหล่งที่มาลูกค้า (Client Source)</label>
                <input
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="เช่น แนะนำต่อ (Referral), โฆษณา Facebook, งานสัมมนา"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">หมายเหตุเพิ่มเติม (Internal Notes)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="ระบุข้อตกลงพิเศษ ประวัติการซื้อขาย หรือพฤติกรรมเฉพาะตัวของลูกค้า..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 text-slate-800 resize-none"
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-2 rounded-xl text-sm transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition cursor-pointer shadow-sm shadow-emerald-200"
          >
            บันทึกข้อมูล
          </button>
        </div>

      </div>
    </div>
  );
}
