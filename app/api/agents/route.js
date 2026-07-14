import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Retrieve agents list from Vercel KV database
    const agents = await kv.get('sudacash_agents') || [];
    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { shop_name, phone, commission, cash, starlink, is_verified } = body;

    if (!shop_name || !phone) {
      return NextResponse.json({ error: 'Missing shop name or phone number' }, { status: 400 });
    }

    // Retrieve existing list, fallback to an empty array
    let agents = await kv.get('sudacash_agents') || [];
    if (!Array.isArray(agents)) agents = [];

    const updatedAgent = {
      id: phone, // Phone acts as unique identifier
      shop_name,
      phone,
      commission: Number(commission),
      cash: Number(cash),
      starlink: Boolean(starlink),
      is_verified: Boolean(is_verified),
      last_updated: new Date().toISOString()
    };

    // Filter out old entry if this phone number already exists
    agents = agents.filter(agent => agent.phone !== phone);
    
    // Add the new update to the top of the array
    agents.unshift(updatedAgent);

    // Limit array to latest 50 entries to remain light on memory and limits
    if (agents.length > 50) {
      agents = agents.slice(0, 50);
    }

    // Save state back to Vercel Redis DB
    await kv.set('sudacash_agents', agents);
    return NextResponse.json({ success: true, agent: updatedAgent });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
