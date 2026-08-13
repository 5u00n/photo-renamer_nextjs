import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { findUserById } from '@/db';

import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface SessionPayload {
  userId: number;
  username: string;
  role: 'user' | 'admin';
}

async function getJwtSecret(): Promise<Uint8Array> {
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    try {
      const { env } = await getCloudflareContext({ async: true });
      const cfEnv = env as any;
      if (cfEnv?.JWT_SECRET) {
        secret = cfEnv.JWT_SECRET as string;
      }
    } catch (e) {
      // Fallback
    }
  }
  return new TextEncoder().encode(
    secret || 'photo-renamer-jwt-secret-key-change-in-production-2026'
  );
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const jwtSecret = await getJwtSecret();
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(jwtSecret);

  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

export async function verifySession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;

    const jwtSecret = await getJwtSecret();
    const verified = await jwtVerify(token, jwtSecret);
    const payload = verified.payload as unknown as SessionPayload;

    // Double check user still exists in database
    const user = await findUserById(payload.userId);
    if (!user) return null;

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
  } catch (error) {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}
