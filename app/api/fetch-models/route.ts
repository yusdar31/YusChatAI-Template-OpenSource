import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { baseURL, apiKey } = await req.json();

    if (!baseURL) {
      return NextResponse.json({ error: 'baseURL is required' }, { status: 400 });
    }

    let url = baseURL.trim();
    if (!url.endsWith('/')) url += '/';
    if (!url.includes('/v1')) url += 'v1';
    if (!url.endsWith('/')) url += '/';

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const res = await fetch(`${url}models`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `HTTP ${res.status}: ${errText.substring(0, 200)}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
