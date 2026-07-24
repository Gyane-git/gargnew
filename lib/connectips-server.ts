import fs from "fs";
import path from "path";
import crypto from "crypto";

import NodeRSA from "node-rsa";
import pem, { type Pkcs12ReadResult } from "pem";

import { objectToKeyValueString } from "@/utils/payments/objectToKeyValueString";

const CONNECTIPS_PFX_PATH = path.join(process.cwd(), "signatures", "CREDITOR.pfx");

const normalizeSecret = (value?: string | null) => value?.trim().replace(/^['"]|['"]$/g, "") || "";

const getConnectipsPasswordCandidates = () => {
  const candidates = [process.env.CONNECTIPS_CREDITOR_PASSWORD, process.env.CONNECTIPS_PFX_PASSWORD, process.env.CONNECTIPS_CERT_PASSWORD, process.env.CONNECTIPS_MERCHANT_USER_PASSWORD, process.env.CONNECTIPS_AUTH_PASSWORD].map(normalizeSecret).filter(Boolean);

  if (!candidates.length) {
    throw new Error("No ConnectIPS certificate password is configured. Please set CONNECTIPS_CREDITOR_PASSWORD or CONNECTIPS_PFX_PASSWORD.");
  }

  return [...new Set(candidates)];
};

const getConnectipsPrivateKey = async (): Promise<Pkcs12ReadResult["key"]> => {
  const pfx = fs.readFileSync(CONNECTIPS_PFX_PATH);
  const passwords = getConnectipsPasswordCandidates();

  let lastError: unknown = null;

  for (const p12Password of passwords) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const key = await new Promise<Pkcs12ReadResult["key"]>((resolve, reject) => {
        pem.readPkcs12(pfx, { p12Password }, (err, cert) => {
          if (cert?.key) {
            resolve(cert.key);
            return;
          }

          reject(err || new Error("Unable to read ConnectIPS private key."));
        });
      });

      return key;
    } catch (error) {
      lastError = error;
    }
  }

  const attempted = passwords.length ? passwords.join(", ") : "none";
  throw new Error(`Unable to open ConnectIPS PFX with the configured password candidates (${attempted}). ${lastError instanceof Error ? lastError.message : "Invalid password?"}`);
};

export const createConnectipsToken = async (payload: Record<string, unknown>) => {
  const message = objectToKeyValueString(Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, value === undefined || value === null ? "" : String(value)])));

  const privateKey = await getConnectipsPrivateKey();
  const key = new NodeRSA(privateKey).exportKey("pkcs8");
  const sign = crypto.createSign("SHA256");

  sign.update(message);
  sign.end();

  return sign.sign(key, "base64");
};

const buildBasicAuth = () => {
  const appId = process.env.NEXT_PUBLIC_CONNECTIPS_APPID;
  const password = process.env.CONNECTIPS_AUTH_PASSWORD;

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
