import { NextResponse } from 'next/server';

import { createConnectipsToken, postConnectipsJson } from '@/lib/connectips-server';

export const runtime = 'nodejs';

const MERCHANTID = process.env.NEXT_PUBLIC_CONNECTIPS_MERCHANTID;
const APPID = process.env.NEXT_PUBLIC_CONNECTIPS_APPID;
const DETAILS_URL = process.env.NEXT_PUBLIC_CONNECTIPS_GETDETAILS_URL;

const normalizeReferenceId = (body: Record<string, unknown>) =>
  String(body.REFERENCEID ?? body.referenceId ?? body.reference_id ?? '');

const normalizeAmount = (body: Record<string, unknown>) =>
  Number(body.TXNAMT ?? body.txnAmt ?? body.txn_amt ?? body.amount ?? 0);

export async function POST(request: Request) {
  try {
    if (!MERCHANTID || !APPID || !DETAILS_URL) {
      return NextResponse.json(
        {
          success: false,
          status: 'ERROR',
          statusDesc: 'ConnectIPS transaction details configuration is missing.',
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const payload = {
      merchantId: Number(MERCHANTID),
      appId: APPID,
      referenceId: normalizeReferenceId(body),
      txnAmt: normalizeAmount(body),
    };

    const token = await createConnectipsToken({
      MERCHANTID: payload.merchantId,
      APPID: payload.appId,
      REFERENCEID: payload.referenceId,
      TXNAMT: payload.txnAmt,
    });

    const { response, data } = await postConnectipsJson(DETAILS_URL, {
      ...payload,
      token,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: 'ERROR',
          statusDesc: 'ConnectIPS transaction-details request failed.',
          upstream: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 'ERROR',
        statusDesc: error instanceof Error ? error.message : 'Internal Error',
      },
      { status: 500 }
    );
  }
}
