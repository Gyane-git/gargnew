import { NextResponse } from 'next/server';

import { createConnectipsToken } from '@/lib/connectips-server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token = await createConnectipsToken(body);

    return NextResponse.json({ TOKEN: token });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 'ERROR',
        statusDesc: error instanceof Error ? error.message : 'Failed to generate ConnectIPS token.',
      },
      { status: 500 }
    );
  }
}
