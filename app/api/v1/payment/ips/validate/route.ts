import { NextResponse } from 'next/server';

import { createConnectipsToken, postConnectipsJson } from '@/lib/connectips-server';

export const runtime = 'nodejs';

const MERCHANTID = process.env.NEXT_PUBLIC_CONNECTIPS_MERCHANTID;
const APPID = process.env.NEXT_PUBLIC_CONNECTIPS_APPID;
const VALIDATION_URL = process.env.CONNECTIPS_VALIDATION_API_URL;

const normalizeReferenceId = (body: Record<string, unknown>) =>
  String(body.REFERENCEID ?? body.referenceId ?? body.reference_id ?? '');

const normalizeAmount = (body: Record<string, unknown>) =>
  Number(body.TXNAMT ?? body.txnAmt ?? body.txn_amt ?? body.amount ?? 0);

/**
 * @swagger
 * /api/v1/payment/ips/validate:
 *   post:
 *     tags: [Payment]
 *     summary: Validate a ConnectIPS transaction
 *     description: >
 *       Signs and forwards a transaction validation request to the ConnectIPS gateway's
 *       validation API, then returns the upstream response to the caller. This endpoint is
 *       intended to be called by the ConnectIPS gateway/app (server-to-server) after a payment
 *       redirect, not by arbitrary clients — there is no customer-facing authentication enforced.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: >
 *               Reference id and amount may be supplied under either the ConnectIPS-style
 *               uppercase keys or their camelCase/snake_case equivalents.
 *             properties:
 *               REFERENCEID:
 *                 type: string
 *                 description: ConnectIPS merchant transaction reference id.
 *               referenceId:
 *                 type: string
 *                 description: Alternate key for REFERENCEID.
 *               reference_id:
 *                 type: string
 *                 description: Alternate key for REFERENCEID.
 *               TXNAMT:
 *                 type: number
 *                 description: Transaction amount.
 *               txnAmt:
 *                 type: number
 *                 description: Alternate key for TXNAMT.
 *               txn_amt:
 *                 type: number
 *                 description: Alternate key for TXNAMT.
 *               amount:
 *                 type: number
 *                 description: Alternate key for TXNAMT.
 *             example:
 *               REFERENCEID: "REF12345"
 *               TXNAMT: 1500.00
 *     responses:
 *       200:
 *         description: >
 *           Validation succeeded. Body is the parsed JSON response returned as-is by the
 *           upstream ConnectIPS validation API (shape is defined by ConnectIPS, not this service).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       500:
 *         description: >
 *           Configuration is missing (merchant id / app id / validation URL env vars not set)
 *           or an unexpected internal error occurred while building/signing the request.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 status:
 *                   type: string
 *                   example: ERROR
 *                 statusDesc:
 *                   type: string
 *       default:
 *         description: >
 *           The upstream ConnectIPS validation request failed. The response status code mirrors
 *           the HTTP status returned by ConnectIPS.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 status:
 *                   type: string
 *                   example: ERROR
 *                 statusDesc:
 *                   type: string
 *                 upstream:
 *                   description: Parsed (or raw text) body returned by the upstream ConnectIPS API.
 *                   type: object
 *                   additionalProperties: true
 */
export async function POST(request: Request) {
  try {
    if (!MERCHANTID || !APPID || !VALIDATION_URL) {
      return NextResponse.json(
        {
          success: false,
          status: 'ERROR',
          statusDesc: 'ConnectIPS validation configuration is missing.',
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

    const { response, data } = await postConnectipsJson(VALIDATION_URL, {
      ...payload,
      token,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          status: 'ERROR',
          statusDesc: 'ConnectIPS validation request failed.',
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

