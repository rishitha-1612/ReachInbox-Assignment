import crypto from "node:crypto";

function getEncryptionKey(): Buffer {
  const value = process.env.SMTP_ENCRYPTION_KEY;

  if (!value) {
    throw new Error(
      "SMTP_ENCRYPTION_KEY is not configured",
    );
  }

  const key = Buffer.from(value, "base64");

  if (key.length !== 32) {
    throw new Error(
      "SMTP_ENCRYPTION_KEY must decode to exactly 32 bytes",
    );
  }

  return key;
}

export function encryptSecret(
  plaintext: string,
): string {
  const key = getEncryptionKey();

  const iv = crypto.randomBytes(12);

  const cipher =
    crypto.createCipheriv(
      "aes-256-gcm",
      key,
      iv,
    );

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag =
    cipher.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptSecret(
  encryptedValue: string,
): string {
  const key = getEncryptionKey();

  const [
    ivBase64,
    authTagBase64,
    encryptedBase64,
  ] = encryptedValue.split(".");

  if (
    !ivBase64 ||
    !authTagBase64 ||
    !encryptedBase64
  ) {
    throw new Error(
      "Invalid encrypted secret format",
    );
  }

  const iv =
    Buffer.from(
      ivBase64,
      "base64",
    );

  const authTag =
    Buffer.from(
      authTagBase64,
      "base64",
    );

  const encrypted =
    Buffer.from(
      encryptedBase64,
      "base64",
    );

  const decipher =
    crypto.createDecipheriv(
      "aes-256-gcm",
      key,
      iv,
    );

  decipher.setAuthTag(authTag);

  const decrypted =
    Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

  return decrypted.toString("utf8");
}