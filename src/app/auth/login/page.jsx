"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // PANGGIL BACKEND: POST http://127.0.0.1:8000/api/login
      const res = await api.post("/api/login", {
        email,
        password,
      });

      const body = res.data;
      const token = body?.data?.token;
      const user = body?.data?.user;

      if (!token) {
        throw new Error("Token tidak ditemukan di response API");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        if (user) {
          localStorage.setItem("siorma_user", JSON.stringify(user));
        }

        if (remember) {
          localStorage.setItem("remember_login", "1");
        } else {
          localStorage.removeItem("remember_login");
        }
      }

      if (user?.role === "admin") {
        router.push("/dashboard");
      } else {
        router.push("/homepage");
      }
    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err?.response?.status,
        err?.response?.data || err?.message
      );

      const msg =
        err?.response?.data?.message ||
        "Email atau password salah / server bermasalah.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 border border-red-100 shadow-red-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-[#B53A3A]/10">
            <Image
              src="/Logo.png"
              alt="Logo SIORMA"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>

          <h1 className="text-[#B53A3A] text-2xl font-bold mt-3">SIORMA</h1>
          <p className="text-gray-600 -mt-1">Sistem Organisasi Mahasiswa</p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-2">
            Email
          </label>
          <input
            type="email"
            placeholder="abcd@gmail.com"
            className="
              w-full 
              px-5 py-3 
              text-[#9F5555] 
              placeholder-[#C7A5A5] 
              bg-white
              border border-red-600
              rounded-xl
              shadow-[0_6px_12px_rgba(229,113,113,0.35)]
              focus:outline-none
              focus:ring-2 focus:ring-[#E38D8D]
              focus:border-[#D06C6C]
              transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="Masukkan Password Anda"
            className="
              w-full 
              px-5 py-3 
              text-[#9F5555] 
              placeholder-[#C7A5A5] 
              bg-white
              border border-red-600
              rounded-xl
              shadow-[0_6px_12px_rgba(229,113,113,0.35)]
              focus:outline-none
              focus:ring-2 focus:ring-[#E38D8D]
              focus:border-[#D06C6C]
              transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-600 font-medium mb-2">{error}</p>
        )}

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between w-full mt-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 text-red-600 border-red-600 rounded"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="text-gray-800">Ingat Saya</span>
          </label>

          <Link
            href="/auth/forgot-password"
            className="text-red-600 font-semibold hover:underline"
          >
            Lupa Password?
          </Link>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center text-gray-400 my-4">
          <span className="flex-1 h-px bg-gray-300"></span>
          <span className="px-2 text-sm">Atau</span>
          <span className="flex-1 h-px bg-gray-300"></span>
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-white border border-red-600 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
