const supabaseUrl = 'https://mzicwglcvhszxgxpnbse.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aWN3Z2xjdmhzenhneHBuYnNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjczOTAsImV4cCI6MjA4MjI0MzM5MH0.6hqw42IiNk732fe2nwktTvP4icS7bXE2PzipGB9ccuQ';

async function testEdgeFunction() {
  console.log('Testing Edge Function register-user...\n');

  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'test123456';
  const testCompany = 'Test Company';

  console.log(`Test data:`);
  console.log(`  Email: ${testEmail}`);
  console.log(`  Company: ${testCompany}\n`);

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/register-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          companyName: testCompany,
        }),
      }
    );

    console.log(`Response status: ${response.status}`);

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.ok) {
      console.log('\n✅ Registration successful!');
    } else {
      console.log('\n❌ Registration failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEdgeFunction();
