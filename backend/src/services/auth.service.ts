import { OAuth2Client } from "google-auth-library";
import { jwtVerify, SignJWT } from "jose";

import userRepository from "../repositories/user.repository.js";

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

  /*
   * Verify the Google ID token before trusting
   * its user claims.
   */
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