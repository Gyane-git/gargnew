import tls from "tls";

const stripQuotes = (value) => String(value || "").replace(/^["']|["']$/g, "");

const smtpConfig = () => ({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 465),
  user: process.env.MAIL_USERNAME,
  pass: stripQuotes(process.env.MAIL_PASSWORD),
  encryption: process.env.MAIL_ENCRYPTION || "ssl",
  fromAddress: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME,
  fromName: stripQuotes(process.env.MAIL_FROM_NAME || "Garg Dental"),
});

const encodeAddress = (name, email) => {
  const safeName = String(name || "").replace(/"/g, '\\"');
  return safeName ? `"${safeName}" <${email}>` : email;
};

const readResponse = (socket) =>
  new Promise((resolve, reject) => {
    let buffer = "";

    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };

    const onError = (error) => {
      cleanup();
      reject(error);
    };

    const onData = (chunk) => {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines[lines.length - 1] || "";

      if (/^\d{3}\s/.test(lastLine)) {
        cleanup();
        resolve(buffer);
      }
    };

    socket.on("data", onData);
    socket.on("error", onError);
  });

const sendCommand = async (socket, command, expectedCodes) => {
  socket.write(`${command}\r\n`);
  const response = await readResponse(socket);
  const code = Number(response.slice(0, 3));

  if (!expectedCodes.includes(code)) {
    throw new Error(`SMTP command failed with ${code}`);
  }

  return response;
};

const authenticate = async (socket, user, pass) => {
  const plainToken = Buffer.from(`\u0000${user}\u0000${pass}`).toString("base64");

  try {
    await sendCommand(socket, `AUTH PLAIN ${plainToken}`, [235]);
    return;
  } catch {}

  await sendCommand(socket, "AUTH LOGIN", [334]);
  await sendCommand(socket, Buffer.from(user).toString("base64"), [334]);
  await sendCommand(socket, Buffer.from(pass).toString("base64"), [235]);
};

const buildMessage = ({ from, to, subject, text, html }) => {
  const boundary = `garg-${Date.now()}`;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
};

export const sendMail = async ({ to, subject, text, html }) => {
  const config = smtpConfig();

  if (!config.host || !config.user || !config.pass || !config.fromAddress) {
    throw new Error("SMTP configuration is incomplete.");
  }

  const socket = tls.connect({
    host: config.host,
    port: config.port,
    servername: config.host,
    rejectUnauthorized: false,
  });

  try {
    await readResponse(socket);
    await sendCommand(socket, `EHLO ${config.host}`, [250]);
    await authenticate(socket, config.user, config.pass);
    await sendCommand(socket, `MAIL FROM:<${config.fromAddress}>`, [250]);
    await sendCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
    await sendCommand(socket, "DATA", [354]);

    const from = encodeAddress(config.fromName, config.fromAddress);
    const message = buildMessage({ from, to, subject, text, html });
    await sendCommand(socket, `${message}\r\n.`, [250]);
    await sendCommand(socket, "QUIT", [221]);
  } finally {
    socket.end();
  }
};

export const sendVerificationCodeEmail = async ({ email, code, fullName = "Customer" }) => {
  const subject = "Garg Dental account verification code";
  const text = `Hello ${fullName},\n\nYour Garg Dental verification code is ${code}.\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="color:#0072bc">Garg Dental Account Verification</h2>
      <p>Hello ${fullName},</p>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#0072bc">${code}</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendMail({ to: email, subject, text, html });
};

export const sendPasswordResetCodeEmail = async ({ email, code, fullName = "Customer" }) => {
  const subject = "Garg Dental password reset code";
  const text = `Hello ${fullName},\n\nYour Garg Dental password reset code is ${code}.\n\nIf you did not request this, please ignore this email.`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="color:#0072bc">Garg Dental Password Reset</h2>
      <p>Hello ${fullName},</p>
      <p>Your password reset code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;color:#0072bc">${code}</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;

  await sendMail({ to: email, subject, text, html });
};
