/**
 * privacy.ts — Privacy Mode Manager (โหมดซ่อนตัวเลข & เนื้อหาชั่วคราว)
 * สำหรับปิดบังตัวเลขยอดเงิน ข้อมูลลูกค้า และเนื้อหาเอกสารชั่วคราว
 * เหมาะสำหรับการแชร์หน้าจอ (Screen Share), นำเสนอ (Presentation), หรือบันทึกภาพ/วิดีโอ
 */

import { useState, useEffect } from 'react';

const PRIVACY_KEY = 'docflow_privacy_mode';

export function getPrivacyMode(): boolean {
  try {
    return localStorage.getItem(PRIVACY_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPrivacyMode(enabled: boolean): void {
  try {
    localStorage.setItem(PRIVACY_KEY, String(enabled));
  } catch {}
  applyPrivacyMode();
  window.dispatchEvent(new CustomEvent('docflow_privacy_changed', { detail: enabled }));
}

export function togglePrivacyMode(): boolean {
  const next = !getPrivacyMode();
  setPrivacyMode(next);
  return next;
}

export function applyPrivacyMode(): void {
  const enabled = getPrivacyMode();
  if (enabled) {
    document.documentElement.setAttribute('data-privacy-mode', 'true');
  } else {
    document.documentElement.removeAttribute('data-privacy-mode');
  }
}

/** React hook for components needing to read/toggle Privacy Mode */
export function usePrivacyMode() {
  const [isPrivacy, setIsPrivacy] = useState(getPrivacyMode);

  useEffect(() => {
    applyPrivacyMode();
    const handler = (e: any) => {
      setIsPrivacy(typeof e.detail === 'boolean' ? e.detail : getPrivacyMode());
    };
    window.addEventListener('docflow_privacy_changed', handler);
    return () => window.removeEventListener('docflow_privacy_changed', handler);
  }, []);

  return {
    isPrivacy,
    togglePrivacy: () => togglePrivacyMode(),
    setPrivacy: (v: boolean) => setPrivacyMode(v)
  };
}
