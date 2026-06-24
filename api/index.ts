import { createApp } from '../app.js';

// Singleton — reuse across warm invocations
let _app: ReturnType<typeof createApp> | null = null;
function getApp() {
  if (!_app) _app = createApp();
  return _app;
}

export default function handler(req: any, res: any) {
  return getApp()(req, res);
}
