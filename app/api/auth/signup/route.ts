import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUser, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

const SignupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().max(80).nullable().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const user = await createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      name: parsed.data.name ?? null,
    });
    await setSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (err: any) {
    if (err?.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }
    console.error("signup error", err);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
