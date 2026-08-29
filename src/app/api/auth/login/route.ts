import { NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
    const user = await authenticate(email, password);
    if (!user || !["SUPER_ADMIN", "TEAM_ADMIN", "ADMIN"].includes(user.role)) return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
    await createSession(user);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}
