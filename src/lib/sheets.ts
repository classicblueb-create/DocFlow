import { getAccessToken } from './auth';
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
        title: 'DocFlow App Data',
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
  
  // Initialize headers
  await fetchGoogleAPI(`https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        {
          updateCells: {
            range: { sheetId: data.sheets[0].properties.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
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
  
  // First, find the row index of the task. Wait, this requires fetching all tasks and finding the ID.
  // Alternatively, just append if it's new. Wait, the easiest way for full sync is to overwrite all tasks.
  // Let's implement full sync of all tasks because replacing specific ranges is complex without row index.
  // We'll see how `saveTaskToSheet` was used.
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
