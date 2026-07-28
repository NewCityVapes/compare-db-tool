// src/app/admin/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ required to persist cookie
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Login failed");
    }
  }

  return (
    <main className="p-8 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Login</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter admin password"
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded"
        >
          Login
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </main>
  );
}
