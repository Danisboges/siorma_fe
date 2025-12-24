"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState(""); // email atau NIM
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Email+ dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        email: identifier.trim(),
        password,
      };

      const res = await api.post("/api/login", payload);

      const token =
        res.data?.data?.token ||
        res.data?.token ||
        res.data?.access_token ||
        res.data?.data?.access_token ||
        null;

      const user = res.data?.data?.user || res.data?.user || null;

      if (!token) {
        setError("Login berhasil, tetapi token tidak ditemukan dari response backend.");
        return;
      }

      // simpan token
      if (remember) {
        localStorage.setItem("token", token);
        sessionStorage.removeItem("token");
      } else {
        sessionStorage.setItem("token", token);
        localStorage.removeItem("token");
      }

      // set header axios untuk request berikutnya
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // simpan user jika ada
      const storage = remember ? localStorage : sessionStorage;
      if (user) storage.setItem("user", JSON.stringify(user));

      // ===== ROLE-BASED REDIRECT =====
      const role =
        user?.role ||
        user?.data?.role ||
        res.data?.data?.role ||
        res.data?.role ||
        "";

      if (String(role).toLowerCase() === "admin") {
        router.replace("/dashboard"); // ganti jika rute admin kamu beda
      } else {
        router.replace("/homepage");
      }
    } catch (err) {
      const code = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login gagal.";

      if (code === 401) setError("Email atau password salah.");
      else if (code === 422) setError("Validasi gagal. Periksa kembali input.");
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8 border border-red-100 shadow-red-200">
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

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin}>
        {/* Email */}
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-2">
            Email
          </label>
          <input
            type="text"
            placeholder="abcd@gmail.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="
              w-full px-5 py-3 text-[#9F5555] placeholder-[#C7A5A5] bg-white
              border border-red-600 rounded-xl
              shadow-[0_6px_12px_rgba(229,113,113,0.35)]
              focus:outline-none focus:ring-2 focus:ring-[#E38D8D]
              focus:border-[#D06C6C] transition"
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full px-5 py-3 text-[#9F5555] placeholder-[#C7A5A5] bg-white
              border border-red-600 rounded-xl
              shadow-[0_6px_12px_rgba(229,113,113,0.35)]
              focus:outline-none focus:ring-2 focus:ring-[#E38D8D]
              focus:border-[#D06C6C] transition"
          />
        </div>

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between w-full mt-4">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              id="remember"
              className="hidden"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />

            <div
              className="
                w-6 h-6 rounded-md border border-red-600 
                flex items-center justify-center
                group-has-checked:bg-red-600 
                group-has-checked:border-red-600
                transition-all"
            >
              <svg
                className="
                  w-6 h-6 text-white 
                  opacity-0 
                  group-has-checked:opacity-100
                  transition-opacity"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-gray-800">Ingat Saya</span>
          </label>

          <Link
            href="/auth/forgot-password"
            className="text-red-600 font-semibold hover:underline"
          >
            Lupa Password?
          </Link>
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 mb-4 w-full py-3 bg-white border border-red-600 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center">
        <span className="text-gray-600">Belum punya akun?</span>
        <a
          href="/auth/register"
          className="text-red-700 font-semibold hover:text-red-800 transition-colors"
        >
          {" "}
          Daftar Sekarang
        </a>
      </div>
    </div>
  );
}
