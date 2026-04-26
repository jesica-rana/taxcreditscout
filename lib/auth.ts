import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

// In-memory user store. Mirrors lib/kv.ts pattern — attached to globalThis so
// Next.js HMR doesn't wipe accounts between hot reloads. Swap for a real DB
// (Postgres, Supabase, Vercel KV) before production.
const g = globalThis as unknown as {
  __userStore?: Map<string, User>;
  __userByEmail?: Map<string, string>;
};
const users: Map<string, User> = g.__userStore ?? new Map();
const byEmail: Map<string, string> = g.__userByEmail ?? new Map();
g.__userStore = users;
g.__userByEmail = byEmail;

const COOKIE_NAME = "cb_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const JWT_SECRET =
  process.env.AUTH_JWT_SECRET ?? "dev-only-secret-change-me-in-production";

function toPublic(u: User): PublicUser {
  return { id: u.id, email: u.email, name: u.name, created_at: u.created_at };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string | null;
}): Promise<PublicUser> {
  const email = normalizeEmail(input.email);
  if (byEmail.has(email)) {
    throw new Error("EMAIL_TAKEN");
  }
  const password_hash = await bcrypt.hash(input.password, 10);
  const user: User = {
    id: randomUUID(),
    email,
    password_hash,
    name: input.name?.trim() || null,
    created_at: new Date().toISOString(),
  };
  users.set(user.id, user);
  byEmail.set(email, user.id);
  return toPublic(user);
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<PublicUser | null> {
  const id = byEmail.get(normalizeEmail(email));
  if (!id) return null;
  const user = users.get(id);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? toPublic(user) : null;
}

export function getUserById(id: string): PublicUser | null {
  const u = users.get(id);
  return u ? toPublic(u) : null;
}

export function signSessionToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "30d" });
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const token = signSessionToken(userId);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  cookies().set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  return getUserById(userId);
}
