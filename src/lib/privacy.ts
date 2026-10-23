/**
 * privacy.ts — Privacy Mode Manager (โหมดซ่อนตัวเลข & เนื้อหาชั่วคราว)
 * สำหรับปิดบังตัวเลขยอดเงิน ข้อมูลลูกค้า และเนื้อหาเอกสารชั่วคราวทั้งหมดของหน้าเว็บ
 * เหมาะสำหรับการแชร์หน้าจอ (Screen Share), นำเสนอ (Presentation), หรือบันทึกภาพ/วิดีโอ
 */

import { useState, useEffect } from 'react';

const PRIVACY_KEY = 'docflow_privacy_mode';

let privacyObserver: MutationObserver | null = null;
let scanTimeout: any = null;

export function getPrivacyMode(): boolean {
  try {
    return localStorage.getItem(PRIVACY_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Scan DOM inside main and mark elements containing sensitive numbers or details
 */
export function scanAndTagPrivacy(): void {
  if (typeof document === 'undefined') return;
  const isEnabled = getPrivacyMode();
  if (!isEnabled) {
    document.querySelectorAll('[data-privacy-auto="true"]').forEach(el => {
      el.removeAttribute('data-privacy-auto');
    });
    return;
  }

  const main = document.querySelector('main') || document.body;
  if (!main) return;

  // Regex matching currency symbols, formatted numbers, percentages, or quantities
  const sensitiveRegex = /(฿|\$|€|¥|%|\b\d{1,3}(,\d{3})+(\.\d+)?\b|\b\d+(\.\d+)?\s*(บาท|ชิ้น|งาน|วัน|k|M|m)\b)/;

  try {
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    const elementsToTag = new Set<HTMLElement>();
    let node: Node | null;

    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (!text || text.length < 2) continue;

      if (sensitiveRegex.test(text)) {
        const parent = node.parentElement;
        if (
          parent &&
          !parent.closest('button, nav, header, select, option, .no-privacy, [data-no-privacy="true"]')
        ) {
          elementsToTag.add(parent);
        }
      }
    }

    elementsToTag.forEach(el => {
      el.setAttribute('data-privacy-auto', 'true');
    });
  } catch {
    // Ignore tree walker errors on detached nodes
  }
}

function scheduleScan(): void {
  if (scanTimeout) clearTimeout(scanTimeout);
  scanTimeout = setTimeout(() => {
    requestAnimationFrame(scanAndTagPrivacy);
  }, 50);
}

function startPrivacyObserver(): void {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;
  if (privacyObserver) {
    privacyObserver.disconnect();
    privacyObserver = null;
  }

  privacyObserver = new MutationObserver((mutations) => {
    // Check if added nodes contain potential data
    let hasNewElements = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        hasNewElements = true;
        break;
      }
    }
    if (hasNewElements) {
      scheduleScan();
    }
  });

  const target = document.querySelector('main') || document.body;
  if (target) {
    privacyObserver.observe(target, {
      childList: true,
      subtree: true,
    });
  }
}

function stopPrivacyObserver(): void {
  if (privacyObserver) {
    privacyObserver.disconnect();
    privacyObserver = null;
  }
  if (scanTimeout) {
    clearTimeout(scanTimeout);
    scanTimeout = null;
  }
}

export function applyPrivacyMode(): void {
  if (typeof document === 'undefined') return;
  const enabled = getPrivacyMode();
  if (enabled) {
    document.documentElement.setAttribute('data-privacy-mode', 'true');
    startPrivacyObserver();
    scheduleScan();
  } else {
    document.documentElement.removeAttribute('data-privacy-mode');
    stopPrivacyObserver();
    document.querySelectorAll('[data-privacy-auto="true"]').forEach(el => {
      el.removeAttribute('data-privacy-auto');
    });
  }
}

export function setPrivacyMode(enabled: boolean): void {
  try {
    localStorage.setItem(PRIVACY_KEY, String(enabled));
  } catch {}
  applyPrivacyMode();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('docflow_privacy_changed', { detail: enabled }));
  }
}

export function togglePrivacyMode(): boolean {
  const next = !getPrivacyMode();
  setPrivacyMode(next);
  return next;
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
    setPrivacy: (v: boolean) => setPrivacyMode(v),
  };
}
