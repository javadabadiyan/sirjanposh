
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

const INITIAL_DATA = {
  products: [],
  partners: [
    { id: '1', name: 'شریک اول', investments: [{ id: 'init-1', amount: 10000000, date: '1403/01/01' }], date: '1403/01/01' },
    { id: '2', name: 'شریک دوم', investments: [{ id: 'init-2', amount: 30000000, date: '1403/01/01' }], date: '1403/01/01' }
  ],
  payments: [],
  invoices: [],
  users: [{ id: '1', username: 'admin', password: '5221157', role: 'admin', permissions: ['dashboard', 'inventory', 'partners', 'invoices', 'users', 'backup'] }]
};

export default async function handler(request: Request) {
  // در محیط Edge مستقیماً از متغیرهای تزریق شده توسط Vercel استفاده می‌کنیم
  const databaseUrl = 
    process.env.DATABASE_URL || 
    process.env.POSTGRES_URL || 
    process.env.STORAGE_DATABASE_URL ||
    process.env.STORAGE_URL;
  
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate'
  });

  if (!databaseUrl) {
    return new Response(JSON.stringify({ 
      error: 'اتصال به دیتابیس برقرار نیست',
      details: 'لطفاً اطمینان حاصل کنید که دیتابیس Neon در پنل Vercel به پروژه متصل شده است.' 
    }), { status: 500, headers });
  }

  const sql = neon(databaseUrl);

  try {
    // اطمینان از وجود جدول
    await sql`CREATE TABLE IF NOT EXISTS app_state (id INT PRIMARY KEY, content JSONB NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP)`;

    if (request.method === 'GET') {
      const rows = await sql`SELECT content FROM app_state WHERE id = 1 LIMIT 1`;
      const responseData = (rows && rows.length > 0) ? rows[0].content : INITIAL_DATA;
      return new Response(JSON.stringify(responseData), { status: 200, headers });
    }

    if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: 'فرمت داده‌های ارسالی نامعتبر است' }), { status: 400, headers });
      }

      await sql`
        INSERT INTO app_state (id, content, updated_at)
        VALUES (1, ${body}, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET content = ${body}, updated_at = CURRENT_TIMESTAMP
      `;
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  } catch (error: any) {
    console.error('Database Operation Error:', error);
    return new Response(JSON.stringify({ 
      error: 'خطای عملیاتی در دیتابیس', 
      details: error?.message || String(error) 
    }), { status: 500, headers });
  }
}
