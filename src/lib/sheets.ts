// Google Sheets shadow-write helpers
// getAccessToken is not available in Supabase auth — shadow writes are best-effort no-ops
async function getAccessToken(): Promise<string | null> { return null; }
import type { Task, Client, Template } from '../types';

export const SPREADSHEET_ID_KEY = 'docflow_spreadsheet_id';

async function fetchGoogleAPI(url: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API Error: ${response.status} - ${errorText}`);
  }
  
  return response.json();
}

export async function createSpreadsheet(): Promise<string> {
  const data = await fetchGoogleAPI('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify({
      properties: {
        title: 'ModtyTasks App Data',
      },
      sheets: [
        { properties: { title: 'Tasks' } },
        { properties: { title: 'Clients' } },
        { properties: { title: 'Templates' } },
      ],
    }),
  });
  
  const id = data.spreadsheetId;
  localStorage.setItem(SPREADSHEET_ID_KEY, id);
  
  const tasksSheetId = data.sheets.find((s: any) => s.properties.title === 'Tasks')?.properties.sheetId;
  const clientsSheetId = data.sheets.find((s: any) => s.properties.title === 'Clients')?.properties.sheetId;
  const templatesSheetId = data.sheets.find((s: any) => s.properties.title === 'Templates')?.properties.sheetId;

  // Initialize headers for all sheets
  await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          updateCells: {
            range: { sheetId: tasksSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
            rows: [{
              values: [
                { userEnteredValue: { stringValue: 'id' } },
                { userEnteredValue: { stringValue: 'name' } },
                { userEnteredValue: { stringValue: 'status' } },
                { userEnteredValue: { stringValue: 'customer' } },
                { userEnteredValue: { stringValue: 'price' } },
                { userEnteredValue: { stringValue: 'startDate' } },
                { userEnteredValue: { stringValue: 'endDate' } },
                { userEnteredValue: { stringValue: 'tags' } },
                { userEnteredValue: { stringValue: 'details' } },
                { userEnteredValue: { stringValue: 'subtasks' } },
                { userEnteredValue: { stringValue: 'priority' } },
              ]
            }],
            fields: 'userEnteredValue'
          }
        },
        {
          updateCells: {
            range: { sheetId: clientsSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 12 },
            rows: [{
              values: [
                { userEnteredValue: { stringValue: 'id' } },
                { userEnteredValue: { stringValue: 'name' } },
                { userEnteredValue: { stringValue: 'address' } },
                { userEnteredValue: { stringValue: 'taxId' } },
                { userEnteredValue: { stringValue: 'targetBudget' } },
                { userEnteredValue: { stringValue: 'color' } },
                { userEnteredValue: { stringValue: 'businessType' } },
                { userEnteredValue: { stringValue: 'email' } },
                { userEnteredValue: { stringValue: 'phone' } },
                { userEnteredValue: { stringValue: 'contactName' } },
                { userEnteredValue: { stringValue: 'paymentTerms' } },
                { userEnteredValue: { stringValue: 'notes' } },
              ]
            }],
            fields: 'userEnteredValue'
          }
        },
        {
          updateCells: {
            range: { sheetId: templatesSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 4 },
            rows: [{
              values: [
                { userEnteredValue: { stringValue: 'id' } },
                { userEnteredValue: { stringValue: 'name' } },
                { userEnteredValue: { stringValue: 'price' } },
                { userEnteredValue: { stringValue: 'details' } },
              ]
            }],
            fields: 'userEnteredValue'
          }
        }
      ]
    })
  });
  return id;
}

export async function getSpreadsheetId(): Promise<string> {
  let id = localStorage.getItem(SPREADSHEET_ID_KEY);
  if (!id) {
    id = await createSpreadsheet();
  }
  return id;
}

export async function fetchTasksFromSheet(): Promise<Task[]> {
  const id = await getSpreadsheetId();
  try {
    const data = await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Tasks!A2:K`);
    if (!data.values) return [];
    
    return data.values.map((row: any[]) => ({
      id: row[0],
      name: row[1],
      status: row[2],
      customer: row[3],
      price: parseFloat(row[4]) || 0,
      startDate: row[5],
      endDate: row[6],
      tags: row[7],
      details: row[8],
      subtasks: row[9],
      priority: row[10]
    }));
  } catch (e: any) {
    if (e.message.includes('404')) {
      localStorage.removeItem(SPREADSHEET_ID_KEY);
    }
    throw e;
  }
}

export async function saveTaskToSheet(task: Task) {
  const id = await getSpreadsheetId();
  // Deprecated, use syncAllTasksToSheet instead
}

export async function syncAllTasksToSheet(tasks: Task[]) {
  const id = await getSpreadsheetId();
  
  // Clear existing tasks
  await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Tasks!A2:Z:clear`, {
    method: 'POST',
    body: JSON.stringify({})
  });

  if (tasks.length === 0) return;

  const values = tasks.map(t => [
    t.id, t.name, t.status, t.customer || '', (t.price || 0).toString(), 
    t.startDate || '', t.endDate || '', t.tags || '', t.details || '', t.subtasks || '', t.priority || ''
  ]);
  
  await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Tasks!A2:K?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({
      values
    })
  });
}

export async function fetchClientsFromSheet(): Promise<Client[]> {
  const id = await getSpreadsheetId();
  try {
    const data = await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Clients!A2:L`);
    if (!data.values) return [];
    
    return data.values.map((row: any[]) => ({
      id: row[0],
      name: row[1],
      address: row[2] || '',
      taxId: row[3] || '',
      targetBudget: parseFloat(row[4]) || 0,
      color: row[5] || 'blue',
      businessType: row[6] as any || null,
      email: row[7] || '',
      phone: row[8] || '',
      contactName: row[9] || '',
      paymentTerms: row[10] || '',
      notes: row[11] || ''
    }));
  } catch (e: any) {
    console.error("Error fetching clients:", e);
    // Return empty array if tab exists but fetching fails due to missing rows
    if (e.message?.includes('400') || e.message?.includes('INVALID_ARGUMENT')) {
      return [];
    }
    throw e;
  }
}

export async function syncAllClientsToSheet(clients: Client[]) {
  const id = await getSpreadsheetId();
  
  // Clear existing clients
  await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Clients!A2:Z:clear`, {
    method: 'POST',
    body: JSON.stringify({})
  });

  if (clients.length === 0) return;

  const values = clients.map(c => [
    c.id,
    c.name,
    c.address || '',
    c.taxId || '',
    (c.targetBudget || 0).toString(),
    c.color || 'blue',
    c.businessType || '',
    c.email || '',
    c.phone || '',
    c.contactName || '',
    c.paymentTerms || '',
    c.notes || ''
  ]);
  
  await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Clients!A2:L?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({
      values
    })
  });
}

export async function fetchTemplatesFromSheet(): Promise<Template[]> {
  const id = await getSpreadsheetId();
  try {
    const data = await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Templates!A2:D`);
    if (!data.values) return [];
    
    return data.values.map((row: any[]) => ({
      id: row[0],
      name: row[1],
      price: parseFloat(row[2]) || 0,
      details: row[3] || ''
    }));
  } catch (e: any) {
    console.error("Error fetching templates:", e);
    if (e.message?.includes('400') || e.message?.includes('INVALID_ARGUMENT')) {
      return [];
    }
    throw e;
  }
}

export async function syncAllTemplatesToSheet(templates: Template[]) {
  const id = await getSpreadsheetId();
  
  // Clear existing templates
  await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Templates!A2:Z:clear`, {
    method: 'POST',
    body: JSON.stringify({})
  });

  if (templates.length === 0) return;

  const values = templates.map(t => [
    t.id, t.name, (t.price || 0).toString(), t.details || ''
  ]);
  
  await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/Templates!A2:D?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    body: JSON.stringify({
      values
    })
  });
}

// ── Stub exports for db.ts shadow-writes ────────────────────────────────────
// These are no-ops until Google OAuth token support is wired up.
import type { Idea } from '../types';

export async function deleteTaskFromSheet(_id: string | number): Promise<void> {}
export async function saveClientToSheet(_client: Client): Promise<void> {}
export async function deleteClientFromSheet(_id: string): Promise<void> {}
export async function saveTemplateToSheet(_template: Template): Promise<void> {}
export async function deleteTemplateFromSheet(_id: string): Promise<void> {}
export async function saveIdeaToSheet(_idea: Idea): Promise<void> {}
export async function deleteIdeaFromSheet(_id: string): Promise<void> {}
export async function generatePDF(_data: unknown): Promise<string | null> { return null; }
