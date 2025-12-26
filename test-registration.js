const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Читаем .env файл вручную
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
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  ТЕСТ ПОДКЛЮЧЕНИЯ К SUPABASE - Sale Pro');
console.log('═══════════════════════════════════════════════════════════════\n');

// Проверка переменных окружения
console.log('1. Проверка переменных окружения:');
console.log('   ✓ SUPABASE_URL:', supabaseUrl ? '✅ Установлен' : '❌ Отсутствует');
console.log('   ✓ ANON_KEY:', supabaseAnonKey ? '✅ Установлен' : '❌ Отсутствует');
console.log('   ✓ SERVICE_ROLE_KEY:', supabaseServiceKey && supabaseServiceKey !== 'your_service_role_key_here' ? '✅ Установлен' : '❌ Отсутствует');

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here') {
  console.log('\n❌ Ошибка: Не все переменные окружения установлены!\n');
  process.exit(1);
}

async function testConnection() {
  try {
    // Создаем клиенты
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log('\n2. Проверка подключения к базе данных:');

    // Тест 1: Проверка таблиц
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);

    if (tenantsError) {
      console.log('   ❌ Ошибка подключения:', tenantsError.message);
      return false;
    }
    console.log('   ✅ Подключение успешно');
    console.log('   ✅ Таблица tenants доступна');

    // Тест 2: Проверка app_users
    const { data: users, error: usersError } = await supabase
      .from('app_users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.log('   ❌ Ошибка app_users:', usersError.message);
    } else {
      console.log('   ✅ Таблица app_users доступна');
    }

    console.log('\n3. Тест регистрации нового пользователя:');

    const testEmail = `test${Date.now()}@salepro.test`;
    const testPassword = 'TestPassword123!';
    const testCompany = 'Sale Pro Test Company';

    console.log(`   → Email: ${testEmail}`);
    console.log(`   → Компания: ${testCompany}`);

    // Шаг 1: Создание auth пользователя
    console.log('\n   Шаг 1: Создание auth пользователя...');
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          company_name: testCompany,
        },
      },
    });

    if (signUpError) {
      console.log('   ❌ Ошибка создания пользователя:', signUpError.message);
      return false;
    }

    if (!authData.user) {
      console.log('   ❌ Пользователь не создан');
      return false;
    }

    const userId = authData.user.id;
    console.log(`   ✅ Auth пользователь создан: ${userId}`);

    // Шаг 2: Создание tenant
    console.log('\n   Шаг 2: Создание tenant (компании)...');

    let tenant = null;
    let tenantError = null;

    try {
      // Триггер автоматически заполнит все поля
      const result = await adminClient
        .from('tenants')
        .insert({ name: testCompany })
        .select()
        .single();

      tenant = result.data;
      tenantError = result.error;
    } catch (err) {
      tenantError = err;
    }

    if (tenantError) {
      console.log('   ❌ Ошибка создания tenant:', tenantError.message);
      // Откатываем создание пользователя
      await adminClient.auth.admin.deleteUser(userId);
      return false;
    }

    console.log(`   ✅ Tenant создан: ${tenant.id}`);
    console.log(`   ✅ Название: ${tenant.name}`);

    // Шаг 3: Создание app_users записи
    console.log('\n   Шаг 3: Создание профиля пользователя...');
    const { data: appUser, error: appUserError } = await adminClient
      .from('app_users')
      .insert({
        id: userId,
        tenant_id: tenant.id,
        email: testEmail,
        role: 'ADMIN',
        full_name: testCompany,
      })
      .select()
      .single();

    if (appUserError) {
      console.log('   ❌ Ошибка создания профиля:', appUserError.message);
      // Откатываем всё
      await adminClient.auth.admin.deleteUser(userId);
      return false;
    }

    console.log(`   ✅ Профиль создан: ${appUser.id}`);
    console.log(`   ✅ Роль: ${appUser.role}`);
    console.log(`   ✅ Email: ${appUser.email}`);

    console.log('\n4. Проверка связей данных:');

    // Проверяем что всё связано правильно
    const { data: checkData, error: checkError } = await adminClient
      .from('app_users')
      .select(`
        id,
        email,
        role,
        tenant:tenants(id, name)
      `)
      .eq('id', userId)
      .single();

    if (checkError) {
      console.log('   ❌ Ошибка проверки:', checkError.message);
      return false;
    }

    console.log('   ✅ Связь app_users ↔ tenants работает');
    console.log(`   ✅ Пользователь: ${checkData.email}`);
    console.log(`   ✅ Компания: ${checkData.tenant.name}`);
    console.log(`   ✅ Роль: ${checkData.role}`);

    console.log('\n5. Тест входа:');

    // Пробуем войти с новым пользователем
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (loginError) {
      console.log('   ❌ Ошибка входа:', loginError.message);
      return false;
    }

    console.log('   ✅ Вход успешен');
    console.log(`   ✅ Session ID: ${loginData.session.access_token.substring(0, 20)}...`);

    // Очистка тестовых данных
    console.log('\n6. Очистка тестовых данных...');
    await adminClient.auth.admin.deleteUser(userId);
    console.log('   ✅ Тестовый пользователь удалён');

    return true;
  } catch (error) {
    console.log('\n❌ Неожиданная ошибка:', error.message);
    console.error(error);
    return false;
  }
}

// Запуск тестов
testConnection().then(success => {
  console.log('\n═══════════════════════════════════════════════════════════════');
  if (success) {
    console.log('  ✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!');
    console.log('  ✅ Регистрация работает корректно');
    console.log('  ✅ База данных настроена правильно');
    console.log('\n  → Можно запускать приложение: npm run dev');
    console.log('  → Регистрация: http://localhost:3000/register');
  } else {
    console.log('  ❌ ТЕСТЫ НЕ ПРОШЛИ');
    console.log('  → Проверьте ошибки выше');
  }
  console.log('═══════════════════════════════════════════════════════════════\n');
  process.exit(success ? 0 : 1);
});
