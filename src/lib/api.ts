import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400, errors?: Record<string, string>) {
  return NextResponse.json({ error: message, ...(errors ? { errors } : {}) }, { status });
}

export const unauthorized = () => fail("You must be signed in to do that", 401);
export const notFound = (what = "Resource") => fail(`${what} not found`, 404);
