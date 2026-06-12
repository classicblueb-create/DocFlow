// ==========================================
// Disabled external connections for now
// ==========================================

export async function syncToSheet(action: string, data: any) {
  // console.log("Local Sync Mock:", action, data);
  return { status: "success", message: "Saved locally (Simulated)" };
}

export async function fetchInitialData() {
  // console.log("Local Fetch Mock");
  return { status: "success", tasks: [], clients: [], templates: [] };
}
