/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface EBState { hasError: boolean; error: Error | null; }
interface EBProps { children: ReactNode; }

/**
 * Error Boundary — ป้องกันจอขาวเมื่อเกิด runtime error
 * ใช้ (this as any) เพื่อหลีกเลี่ยงปัญหา useDefineForClassFields:false ใน tsconfig
 */
export class ErrorBoundary extends Component<EBProps, EBState> {
 constructor(props: EBProps) {
 super(props);
 (this as any).state = { hasError: false, error: null } as EBState;
 this.handleReload = this.handleReload.bind(this);
 }

 static getDerivedStateFromError(error: Error): EBState {
 return { hasError: true, error };
 }

 componentDidCatch(error: Error, info: ErrorInfo) {
 console.error(' App Error:', error, info);
 }

 handleReload() {
 (this as any).setState({ hasError: false, error: null });
 window.location.reload();
 }

 render(): ReactNode {
 const st: EBState = (this as any).state;
 const pr: EBProps = (this as any).props;

 if (st.hasError) {
 return (
 <div style={{
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 height: '100vh', fontFamily: 'system-ui, sans-serif',
 background: '#f8fafc', padding: '24px',
 }}>
 <div style={{
 background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
 padding: '32px', maxWidth: '480px', width: '100%', textAlign: 'center',
 boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
 }}>
 <div style={{ fontSize: '40px', marginBottom: '12px' }}></div>
 <h2 style={{ color: '#0f172a', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
 เกิดข้อผิดพลาด
 </h2>
 <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
 {st.error?.message ?? 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'}
 </p>
 <button
 onClick={this.handleReload}
 style={{
 background: '#0f172a', color: 'white', border: 'none',
 borderRadius: '10px', padding: '10px 24px',
 fontSize: '13px', fontWeight: 700, cursor: 'pointer',
 }}
 >
 รีโหลดหน้า
 </button>
 </div>
 </div>
 );
 }
 return pr.children;
 }
}
