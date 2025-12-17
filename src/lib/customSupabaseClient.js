import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vsvcxdufsxngdrguohtj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzdmN4ZHVmc3huZ2RyZ3VvaHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NDY4NzAsImV4cCI6MjA4MTUyMjg3MH0.7kIU9IdvfI5Mm8NaA9y_OflXtkPn7yCGf4gAG8F3rYQ';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
