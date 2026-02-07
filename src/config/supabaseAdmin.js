import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pfmiwusneqjplwwwlvyh.supabase.co';
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmbWl3dXNuZXFqcGx3d3dsdnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDM1MjY5NCwiZXhwIjoyMDg1OTI4Njk0fQ.oNMXceNEyFmlJMJ_UfpUvbRakLhYmmxWre3dWlcqMXE';

// Admin client for user management (create users, reset passwords).
// Uses service_role key — only used by admin-facing components (Usuarios).
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
