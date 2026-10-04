/**
 * theme.ts — Multi-Theme Design System Manager
 * รองรับทั้ง 4 ธีมตามแบบภาพอ้างอิง:
 * 1. SalesMonk (Modern Cobalt SaaS) - ภาพที่ 1
 * 2. Saddam Dashboard (Modern Tablet & Pastel Circles) - ภาพที่ 2
 * 3. Warm Editorial (Linen & Pastel Sorbet) - ภาพที่ 3
 * 4. Dei Bento (Obsidian Duo-tone & Neon Mint) - ภาพที่ 4
 */

export type ThemeId = 'salesmonk' | 'saddam' | 'editorial' | 'dei';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  nameEn: string;
  tagline: string;
  description: string;
  referenceLabel: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    sidebar: string;
    accent: string;
    swatches: string[];
  };
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'salesmonk',
    name: 'SalesMonk Cobalt',
    nameEn: 'SalesMonk (Modern Cobalt SaaS)',
    tagline: 'โมเดิร์นคลีน SaaS • การ์ดขาวทึบคงทน • สีน้ำเงินโคบอลต์',
    description: 'ถอดแบบจากภาพที่ 1 (SalesMonk): คอนทราสต์สูง การ์ดขาวบริสุทธิ์ทึบ ขอบบางเฉียบ เมนูและปุ่มสีน้ำเงินโคบอลต์สดใส มอบความรู้สึกเป็นมืออาชีพและเฉียบคม',
    referenceLabel: 'ภาพที่ 1: SalesMonk',
    colors: {
      primary: '#2563eb',
      secondary: '#3b82f6',
      background: '#f4f6fa',
      card: '#ffffff',
      sidebar: '#ffffff',
      accent: '#2563eb',
      swatches: ['#2563eb', '#3b82f6', '#ffffff', '#f4f6fa', '#10b981'],
    },
  },
  {
    id: 'saddam',
    name: 'Saddam Dashboard',
    nameEn: 'Saddam (Modern Tablet & Pastel Icons)',
    tagline: 'แท็บเล็ตโมเดิร์น • แคนวาสสีเทาคลีน • วงกลมไอคอนพาสเทล',
    description: 'ถอดแบบจากภาพที่ 2 (Welcome Back, John): แคนวาสสีเทาอ่อนนุ่มตา การ์ดทรงมนสะอาด ไอคอนสถิติเด่นในวงกลมพาสเทล (ม่วง เขียว ส้ม แดง) สไตล์โมเดิร์นแดชบอร์ดระดับพรีเมียม',
    referenceLabel: 'ภาพที่ 2: Saddam Mockup',
    colors: {
      primary: '#1e293b',
      secondary: '#6366f1',
      background: '#f1f4f8',
      card: '#ffffff',
      sidebar: '#f8fafc',
      accent: '#6366f1',
      swatches: ['#1e293b', '#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#ffffff'],
    },
  },
  {
    id: 'editorial',
    name: 'Warm Editorial',
    nameEn: 'Warm Editorial (Linen & Pastel Sorbet)',
    tagline: 'ลินินอบอุ่น • อักษร Espresso • ชิปสีพาสเทลซอร์เบต์',
    description: 'ถอดแบบจากภาพที่ 3 (Invest in Education): พื้นผิวโทนสีครีมลินินธรรมชาติ ตัวหนังสือเอสเปรสโซเข้ม ปุ่มชาร์โคลมนรี การ์ดไข่อบอุ่น พร้อมชิปสีพาสเทลพีช มินต์ และไลแลค',
    referenceLabel: 'ภาพที่ 3: Education/Linen',
    colors: {
      primary: '#1c1917',
      secondary: '#44403c',
      background: '#faf6ee',
      card: '#fffdf8',
      sidebar: '#f7f2ea',
      accent: '#ea580c',
      swatches: ['#1c1917', '#faf6ee', '#fffdf8', '#fed7aa', '#d1fae5', '#ede9fe'],
    },
  },
  {
    id: 'dei',
    name: 'Dei Bento Duo-tone',
    nameEn: 'Dei Bento (Obsidian & Cloud)',
    tagline: 'ดูโอโทนพรีเมียม • เมนู Obsidian ดำสนิท • แคนวาส Porcelain & นีออนมินต์',
    description: 'ถอดแบบจากภาพที่ 4 (Dei Bento): คอนทราสต์สูงระดับไฮเอนด์ แถบเมนูดำสนิท Obsidian แคนวาสสีเทาพอร์ซเลนสะอาดตา การ์ดทรงมน Bento ขอบโค้งเป็นพิเศษ และไฮไลต์นีออนมินต์',
    referenceLabel: 'ภาพที่ 4: Dei Bento',
    colors: {
      primary: '#090a0f',
      secondary: '#10b981',
      background: '#eff2f6',
      card: '#ffffff',
      sidebar: '#090a0f',
      accent: '#10b981',
      swatches: ['#090a0f', '#10b981', '#ffffff', '#eff2f6', '#c084fc', '#fef08a'],
    },
  },
];

const THEME_KEY = 'docflow_theme_id';
const BG_KEY = 'docflow_theme_bg';

export function getTheme(): ThemeId {
  try {
    const val = localStorage.getItem(THEME_KEY);
    if (val === 'salesmonk' || val === 'saddam' || val === 'editorial' || val === 'dei') {
      return val;
    }
  } catch {}
  return 'salesmonk';
}

export function setTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    // เมื่อเลือกพรีเซ็ตธีม ให้ลบภาพวอลเปเปอร์เดิมที่บดบังออกอัตโนมัติ เพื่อให้เห็นดีไซน์ธีมแท้จริง
    localStorage.removeItem('modty_bg_image');
    localStorage.removeItem(BG_KEY);
  } catch {}
  applyTheme();
  window.dispatchEvent(new CustomEvent('docflow_theme_changed', { detail: theme }));
}

export function getBackgroundImage(): string | null {
  try {
    return localStorage.getItem(BG_KEY) || localStorage.getItem('modty_bg_image') || null;
  } catch {
    return null;
  }
}

export function setBackgroundImage(dataUrl: string | null): void {
  try {
    if (dataUrl) {
      localStorage.setItem(BG_KEY, dataUrl);
      localStorage.setItem('modty_bg_image', dataUrl);
    } else {
      localStorage.removeItem(BG_KEY);
      localStorage.removeItem('modty_bg_image');
    }
  } catch {}
  applyTheme();
  window.dispatchEvent(new CustomEvent('docflow_theme_changed', { detail: getTheme() }));
}

export function clearCustomBackground(): void {
  setBackgroundImage(null);
}

/** Apply theme attribute & background variables to document root */
export function applyTheme(): void {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);

  const bg = getBackgroundImage();
  document.documentElement.style.setProperty('--app-bg-image', bg ? `url("${bg}")` : 'none');
}

// Backwards compatibility for existing imports
export type ThemeMode = 'light' | 'dark';
export function getThemeMode(): ThemeMode {
  return 'light';
}
export function setThemeMode(_mode: ThemeMode): void {
  applyTheme();
}
