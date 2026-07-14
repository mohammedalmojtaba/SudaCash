import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const agents = await kv.get('sudacash_agents') || [];
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { shop_name, phone, commission, cash, is_verified } = body;

    if (!shop_name || !phone) {
      return NextResponse.json({ error: 'Missing shop name or phone number' }, { status: 400 });
    }

    let agents = await kv.get('sudacash_agents') || [];
    if (!Array.isArray(agents)) agents = [];

    const updatedAgent = {
      id: phone,
      shop_name,
      phone,
      commission: Number(commission),
      cash: Number(cash),
      is_verified: Boolean(is_verified),
      last_updated: new Date().toISOString()
    };

    // Remove existing entry for this phone number and append the updated one to the top
    agents = agents.filter(agent => agent.phone !== phone);
    agents.unshift(updatedAgent);

    // Keep list capped to the latest 50 agents
    if (agents.length > 50) {
      agents = agents.slice(0, 50);
    }

    await kv.set('sudacash_agents', agents);
    return NextResponse.json({ success: true, agent: updatedAgent });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
