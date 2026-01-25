"use client";
import { signIn } from "next-auth/react";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">SoloStasher</h1>
      <a
        href="/api/auth/signin/google"
        className="inline-block px-5 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Sign in with Google
      </a>
    </main>
  );
}

