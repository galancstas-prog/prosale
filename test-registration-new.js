const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mzicwglcvhszxgxpnbse.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aWN3Z2xjdmhzenhneHBuYnNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY2NzM5MCwiZXhwIjoyMDgyMjQzMzkwfQ.L2EH_lqc2krFC7Gz0PboWzLXADvlcRKplcbafEuvQOE';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testRegistration() {
  console.log('Testing create_new_tenant function...\n');

  const testCompany = `Test Company ${Date.now()}`;

  try {
    const { data, error } = await adminClient
      .rpc('create_new_tenant', { p_name: testCompany });

    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }

    console.log('✅ Success! Tenant ID:', data);
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

testRegistration();
