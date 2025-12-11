"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // PANGGIL BACKEND: POST /api/register
      const res = await api.post("/api/register", {
        name,
        username,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      const body = res.data; // { success, message, data: { token, user } }
      const token = body?.data?.token;
      const user = body?.data?.user;

      if (typeof window !== "undefined" && token) {
        localStorage.setItem("token", token);
        localStorage.setItem("siorma_user", JSON.stringify(user));
      }

      // setelah daftar langsung arahkan ke dashboard / homepage
      router.push("/homepage");
    } catch (err) {
      console.error(
        "REGISTER ERROR:",
        err?.response?.status,
        err?.response?.data || err?.message
      );

      const msg =
        err?.response?.data?.message ||
        "Pendaftaran gagal. Silakan cek data yang diisi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f5e4e4]">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 border border-red-100 shadow-red-200">
        <h1 className="text-2xl font-bold text-[#B53A3A] mb-4">Daftar Akun</h1>

        {error && (
          <p className="mb-3 text-sm text-red-600 font-medium">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-1">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2 rounded-lg bg-[#B53A3A] text-white font-semibold disabled:opacity-60"
          >
            {loading ? "Mendaftar..." : "Daftar"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Sudah punya akun?{" "}
          <Link href="/auth/login" className="text-[#B53A3A] font-semibold">
            Login di sini
          </Link>
        </p>
      </div>
    </main>
  );
}
