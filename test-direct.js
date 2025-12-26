const fs = require('fs');
const path = require('path');

// Читаем .env
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n═══ ПРЯМОЙ ТЕСТ ЧЕРЕЗ REST API ═══\n');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Установлен' : 'Не установлен');

async function testDirect() {
  try {
    // Прямой HTTP запрос к REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/tenants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: 'Test Company Direct',
        plan_tier: 'free'
      })
    });

    const text = await response.text();
    console.log('\nСтатус:', response.status);
    console.log('Ответ:', text);

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ Tenant создан успешно!');
      console.log('ID:', data[0].id);
      console.log('Name:', data[0].name);

      // Удаляем тестовую запись
      await fetch(`${supabaseUrl}/rest/v1/tenants?id=eq.${data[0].id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        }
      });
      console.log('✅ Тестовая запись удалена');
    } else {
      console.log('\n❌ Ошибка создания tenant');
      console.log('Детали:', text);
    }
  } catch (error) {
    console.log('\n❌ Ошибка:', error.message);
  }
}

testDirect();
