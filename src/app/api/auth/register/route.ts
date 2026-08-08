import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { findUserByUsername, createUser } from '@/db';
import { createSession } from '@/lib/auth';

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      const errorMsg = Object.values(validation.error.flatten().fieldErrors)
        .flat()
        .join(' ');
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { username, password } = validation.data;
    const normalizedUsername = username.trim().toLowerCase();

    const existingUser = await findUserByUsername(normalizedUsername);
    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const newUser = await createUser(normalizedUsername, passwordHash, 'user');

    await createSession({
      userId: newUser.id,
      username: newUser.username,
      role: newUser.role,
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API Register] Error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
