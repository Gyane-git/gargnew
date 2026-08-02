import fs from "fs";
import path from "path";
import crypto from "crypto";

import pem, { type Pkcs12ReadResult } from 'pem';

import { objectToKeyValueString } from "@/utils/payments/objectToKeyValueString";

const CONNECTIPS_PEM_PATH = path.join(process.cwd(), 'storage', 'app', 'certificates', 'CREDITOR.pem');
const CONNECTIPS_PFX_PATH = path.join(process.cwd(), 'signatures', 'CREDITOR.pfx');

const normalizeSecret = (value?: string | null) => value?.trim().replace(/^['"]|['"]$/g, "") || "";

const env = (...keys: string[]) => {
  for (const key of keys) {
    const value = normalizeSecret(process.env[key]);
    if (value) return value;
  }
  return '';
};

const getConnectipsPasswordCandidates = () => {
  const candidates = [
    env('CONNECT_IPS_CERT_PASSWORD'),
    process.env.CONNECTIPS_CREDITOR_PASSWORD,
    process.env.CONNECTIPS_PFX_PASSWORD,
    process.env.CONNECTIPS_CERT_PASSWORD,
    process.env.CONNECT_IPS_PASSWORD,
    process.env.CONNECT_IPS_APP_PASSWORD,
    process.env.CONNECTIPS_MERCHANT_USER_PASSWORD,
    process.env.CONNECTIPS_AUTH_PASSWORD,
  ]
    .map(normalizeSecret)
    .filter(Boolean);

  if (!candidates.length) {
    throw new Error(
      'No ConnectIPS certificate password is configured. Please set CONNECT_IPS_CERT_PASSWORD or CONNECTIPS_CREDITOR_PASSWORD.'
    );
  }

  return [...new Set(candidates)];
};

const readPrivateKeyFromPem = async (pemContent: string, passwords: Array<string | undefined>) => {
  let lastError: unknown = null;

  for (const passphrase of passwords) {
    try {
      const keyObject = crypto.createPrivateKey(
        passphrase
          ? { key: pemContent, format: 'pem', passphrase }
          : { key: pemContent, format: 'pem' }
      );

      return keyObject;
    } catch (error) {
      lastError = error;
    }
  }

  const attempted = passwords.map((value) => (value ? '[provided]' : '[empty]')).join(', ');
  throw new Error(
    `Unable to open ConnectIPS PEM with the configured passphrases (${attempted}). ${
      lastError instanceof Error ? lastError.message : 'Invalid password?'
    }`
  );
};

const readPrivateKeyFromPfx = async (pfx: Buffer, passwords: string[]) => {
  let lastError: unknown = null;

  for (const p12Password of passwords) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const privateKey = await new Promise<Pkcs12ReadResult['key']>((resolve, reject) => {
        pem.readPkcs12(pfx, { p12Password }, (err, cert) => {
          if (cert?.key) {
            resolve(cert.key);
            return;
          }

          reject(err || new Error("Unable to read ConnectIPS private key."));
        });
      });

      return crypto.createPrivateKey(privateKey);
    } catch (error) {
      lastError = error;
    }
  }

  const attempted = passwords.length ? passwords.join(", ") : "none";
  throw new Error(`Unable to open ConnectIPS PFX with the configured password candidates (${attempted}). ${lastError instanceof Error ? lastError.message : "Invalid password?"}`);
};

const getConnectipsPrivateKey = async (): Promise<crypto.KeyObject> => {
  const passwords = getConnectipsPasswordCandidates();
  const pemPassphrases = [undefined, ...passwords];

  if (fs.existsSync(CONNECTIPS_PEM_PATH)) {
    const pemContent = fs.readFileSync(CONNECTIPS_PEM_PATH, 'utf8');
    return readPrivateKeyFromPem(pemContent, pemPassphrases);
  }

  if (fs.existsSync(CONNECTIPS_PFX_PATH)) {
    const pfx = fs.readFileSync(CONNECTIPS_PFX_PATH);
    return readPrivateKeyFromPfx(pfx, passwords);
  }

  throw new Error(
    `ConnectIPS certificate not found. Expected PEM at ${CONNECTIPS_PEM_PATH} or PFX at ${CONNECTIPS_PFX_PATH}.`
  );
};

export const createConnectipsToken = async (payload: Record<string, unknown>) => {
  const message = objectToKeyValueString(Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, value === undefined || value === null ? "" : String(value)])));

  const privateKey = await getConnectipsPrivateKey();
  const signature = crypto.sign('sha256', Buffer.from(message, 'utf8'), privateKey);

  return signature.toString('base64');
};

const buildBasicAuth = () => {
  const appId = env('CONNECT_IPS_APP_ID', 'CONNECTIPS_APPID', 'NEXT_PUBLIC_CONNECTIPS_APPID');
  const password = env('CONNECT_IPS_PASSWORD', 'CONNECTIPS_AUTH_PASSWORD');

  if (!appId || !password) {
    throw new Error("ConnectIPS auth credentials are not configured.");
  }

  return Buffer.from(`${appId}:${password}`).toString("base64");
};

export const postConnectipsJson = async (url: string, payload: Record<string, unknown>) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${buildBasicAuth()}`,
    },
    body: JSON.stringify(payload),
    cache: "no-cache",
  });

  const rawText = await response.text();
  let data: unknown = rawText;

  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    // Keep raw text when the upstream response is not JSON.
  }

  return { response, data };
};
