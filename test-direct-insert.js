const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mzicwglcvhszxgxpnbse.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aWN3Z2xjdmhzenhneHBuYnNlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjY2NzM5MCwiZXhwIjoyMDgyMjQzMzkwfQ.L2EH_lqc2krFC7Gz0PboWzLXADvlcRKplcbafEuvQOE';

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDirectInsert() {
  console.log('Testing direct INSERT...\n');

  const testCompany = `Test Company ${Date.now()}`;

  try {
    const { data, error } = await adminClient
      .from('tenants')
      .insert({
        name: testCompany,
        plan_tier: 'free',
      })
      .select('id')
      .single();

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✅ Success! Tenant created with ID:', data.id);
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

testDirectInsert();
