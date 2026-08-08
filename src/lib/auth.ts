import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { findUserById } from '@/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'photo-renamer-jwt-secret-key-change-in-production-2026'
);

export interface SessionPayload {
  userId: number;
  username: string;
  role: 'user' | 'admin';
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

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

    const verified = await jwtVerify(token, JWT_SECRET);
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
