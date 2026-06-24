/**
 * theme.ts — Liquid Glass theme: light/dark mode + custom uploaded background image
 * เก็บค่าไว้ใน localStorage และ apply ผ่าน CSS variable / class บน <html>
 */

const MODE_KEY = 'docflow_theme_mode';   // 'light' | 'dark'
const BG_KEY   = 'docflow_theme_bg';     // data URL ของภาพพื้นหลัง

export type ThemeMode = 'light' | 'dark';

export function getThemeMode(): ThemeMode {
  return 'light';
}

export function setThemeMode(mode: ThemeMode): void {
  try { localStorage.setItem(MODE_KEY, 'light'); } catch {}
  applyTheme();
}

export function getBackgroundImage(): string | null {
  try {
    return localStorage.getItem(BG_KEY) || null;
  } catch {
    return null;
  }
}

export function setBackgroundImage(dataUrl: string | null): void {
  try {
    if (dataUrl) localStorage.setItem(BG_KEY, dataUrl);
    else localStorage.removeItem(BG_KEY);
  } catch {}
  applyTheme();
}

/** Apply current theme settings (mode + background) to the document. เรียกตอน mount และทุกครั้งที่เปลี่ยนค่า */
export function applyTheme(): void {
  document.documentElement.classList.toggle('dark', false);

  const bg = getBackgroundImage();
  document.documentElement.style.setProperty('--app-bg-image', bg ? `url("${bg}")` : 'none');
}
