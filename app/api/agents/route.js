export const dynamic = 'force-dynamic'; 

import { createClient } from '@vercel/kv';
import { NextResponse } from 'next/server';

// إنشاء اتصال مرن يدعم البادئة الافتراضية KV_ أو البادئة المخصصة STORAGE_ التي ظهرت في إعداداتك
const kv = createClient({
  url: process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN,
});

// دالة التحقق الذكي من وجود أي من المفاتيح المتاحة
function verifyDatabaseConfig() {
  const url = process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;
  
  if (!url || !token) {
    throw new Error("مفاتيح اتصال قاعدة البيانات غير متوفرة. تأكد من وجود KV_REST_API_URL أو STORAGE_REST_API_URL في إعدادات فيرسيل.");
  }
}

// جلب قائمة الوكلاء بالكامل
export async function GET() {
  try {
    verifyDatabaseConfig();
    const agents = await kv.get('sudacash_agents');
    return NextResponse.json(agents || []);
  } catch (error) {
    console.error("Database GET Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch agents" }, { status: 500 });
  }
}

// إضافة أو تحديث بيانات وكيل
export async function POST(request) {
  try {
    verifyDatabaseConfig();
    const body = await request.json();
    const { shop_name, phone, commission, cash, provides_cash, provides_mbok, is_verified } = body;

    if (!shop_name || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // جلب القائمة الحالية من قاعدة البيانات
    let agents = await kv.get('sudacash_agents');
    if (!Array.isArray(agents)) {
      agents = [];
    }

    // تجهيز بيانات الوكيل الجديد/المحدث
    const updatedAgent = {
      id: phone, 
      shop_name,
      phone,
      commission: Number(commission),
      cash: Number(cash),
      provides_cash: provides_cash !== false,
      provides_mbok: provides_mbok === true,
      is_verified: !!is_verified,
      last_updated: new Date().toISOString()
    };

    // تحديث البيانات إذا كان الوكيل موجوداً مسبقاً، أو إضافته كجديد
    const existingIndex = agents.findIndex(a => a.id === phone);
    if (existingIndex > -1) {
      agents[existingIndex] = updatedAgent;
    } else {
      agents.push(updatedAgent);
    }

    // حفظ القائمة المحدثة بالكامل في قاعدة البيانات
    await kv.set('sudacash_agents', agents);

    return NextResponse.json({ success: true, agent: updatedAgent });
  } catch (error) {
    console.error("Database POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save agent to database" }, { status: 500 });
  }
}
