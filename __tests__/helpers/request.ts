import { NextRequest } from "next/server";

const BASE = "http://localhost";

export function get(path: string): NextRequest {
  return new NextRequest(`${BASE}${path}`);
}

export function post(path: string, body: unknown): NextRequest {
  return new NextRequest(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function patch(path: string, body: unknown): NextRequest {
  return new NextRequest(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function del(path: string): NextRequest {
  return new NextRequest(`${BASE}${path}`, { method: "DELETE" });
}
