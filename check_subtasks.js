import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase.from('tasks').select('id, name, status, assignee, subtasks');
  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("DUMPING TASKS AND SUBTASKS:");
  data.forEach(t => {
    if (t.subtasks) {
      console.log(`Task: [${t.id}] "${t.name}" | Status: ${t.status} | Assignee: ${t.assignee}`);
      console.log(`  Raw Subtasks: ${t.subtasks}`);
      try {
        const parsed = JSON.parse(t.subtasks);
        console.log(`  Parsed Subtasks:`, parsed);
      } catch (e) {
        console.log(`  JSON Parse Error:`, e.message);
      }
    }
  });
}

run();
