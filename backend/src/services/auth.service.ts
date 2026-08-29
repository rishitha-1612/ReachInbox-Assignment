import { OAuth2Client } from "google-auth-library";
import { jwtVerify, SignJWT } from "jose";
import { encryptSecret } from "../utils/crypto.js";
import userRepository from "../repositories/user.repository.js";
import senderRepository from "../repositories/sender.repository.js";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

const googleClientId =
  getRequiredEnv("GOOGLE_CLIENT_ID");

const googleClientSecret =
  getRequiredEnv("GOOGLE_CLIENT_SECRET");

const googleCallbackUrl =
  getRequiredEnv("GOOGLE_CALLBACK_URL");

const jwtSecret =
  getRequiredEnv("JWT_SECRET");

const googleClient = new OAuth2Client(
  googleClientId,
  googleClientSecret,
  googleCallbackUrl,
);

const secret = new TextEncoder().encode(
  jwtSecret,
);

export function getGoogleAuthUrl(
  state: string,
): string {
  return googleClient.generateAuthUrl({
    access_type: "online",
    scope: [
      "openid",
      "email",
      "profile",
    ],
    state,
    prompt: "select_account",
  });
}

export async function handleGoogleCallback(
  code: string,
) {
  if (!code) {
    throw new Error(
      "Google authorization code is required",
    );
  }

  const { tokens } =
    await googleClient.getToken(code);

  if (!tokens.id_token) {
    throw new Error(
      "Google ID token missing",
    );
  }

  const ticket =
    await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: googleClientId,
    });

  const payload = ticket.getPayload();

  if (
    !payload ||
    !payload.sub ||
    !payload.email ||
    !payload.name
  ) {
    throw new Error(
      "Incomplete Google profile",
    );
  }

  /*
   * Create or update the authenticated user.
   */
  const user =
    await userRepository.upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      ...(payload.picture
        ? {
            avatar: payload.picture,
          }
        : {}),
    });

  if (!user) {
    throw new Error(
      "Unable to create or retrieve user",
    );
  }

  /*
   * Create a default sender the first time
   * this Google account logs in.
   */
  const existingSender =
    await senderRepository.findDefaultSender(
      user.id,
    );

  if (!existingSender) {
    const smtpHost =
      getRequiredEnv("SMTP_HOST");

    const smtpUser =
      getRequiredEnv("SMTP_USER");

    const smtpPass =
      getRequiredEnv("SMTP_PASS");

    const smtpPort = Number(
      process.env.SMTP_PORT ?? 587,
    );

    if (
      !Number.isInteger(smtpPort) ||
      smtpPort <= 0
    ) {
      throw new Error(
        "Invalid SMTP_PORT",
      );
    }

    const smtpFrom =
      getRequiredEnv("SMTP_FROM");

    /*
     * Supports:
     * ReachInbox <user@example.com>
     * or simply:
     * user@example.com
     */
    const emailMatch =
      smtpFrom.match(
        /<([^>]+)>/,
      );

    const senderEmail =
      emailMatch?.[1]?.trim() ??
      smtpFrom.trim();

    /*
     * NOTE:
     * The repository currently expects a field named
     * smtpPassEncrypted. Before production submission,
     * this value should be encrypted using the project's
     * encryption service instead of storing plaintext.
     */
    await senderRepository.createDefaultSender({
      userId: user.id,
      email: senderEmail,
      displayName: "ReachInbox",
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassEncrypted:
        encryptSecret(smtpPass),
    });
  }

  /*
   * Create the application session.
   */
  const sessionToken =
    await new SignJWT({
      userId: user.id,
    })
      .setProtectedHeader({
        alg: "HS256",
      })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

  return {
    user,
    sessionToken,
  };
}

export async function verifySession(
  token: string,
) {
  if (!token) {
    throw new Error(
      "Session token is required",
    );
  }

  const { payload } =
    await jwtVerify(
      token,
      secret,
    );

  if (
    typeof payload.userId !==
    "string"
  ) {
    throw new Error(
      "Invalid session payload",
    );
  }

  const user =
    await userRepository.findById(
      payload.userId,
    );

  if (!user) {
    throw new Error(
      "User associated with session was not found",
    );
  }

  return user;
}