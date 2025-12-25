"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      const res = await api.post("/api/register", {
        name,
        username,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      const body = res.data; // { success, message, data: { token, user } }
      const token =
        body?.data?.token || body?.token || body?.access_token || null;
      const user = body?.data?.user || body?.user || null;

      if (typeof window !== "undefined" && token) {
        localStorage.setItem("token", token);
        localStorage.setItem("siorma_user", JSON.stringify(user || {}));
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      router.push("/homepage");
    } catch (err) {
      console.error(
        "REGISTER ERROR:",
        err?.response?.status,
        err?.response?.data || err?.message
      );

      // coba ambil pesan validasi pertama (kalau Laravel kirim errors)
      const errors = err?.response?.data?.errors || err?.response?.data?.data;
      if (errors && typeof errors === "object") {
        const firstKey = Object.keys(errors)[0];
        const firstMsg = Array.isArray(errors[firstKey])
          ? errors[firstKey][0]
          : String(errors[firstKey]);
        setError(firstMsg || "Pendaftaran gagal. Silakan cek data yang diisi.");
      } else {
        const msg =
          err?.response?.data?.message ||
          "Pendaftaran gagal. Silakan cek data yang diisi.";
        setError(msg);
      }
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
        <h1 className="text-[#B53A3A] text-2xl font-bold mt-3">
          Daftar Akun Anda
        </h1>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Nama lengkap */}
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-2">
            Nama Lengkap
          </label>
          <input
            type="text"
            placeholder="Masukkan Nama Lengkap"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
              transition
            "
            required
          />
        </div>

        {/* Username */}
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-2">
            Username
          </label>
          <input
            type="text"
            placeholder="Masukkan Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
              transition
            "
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-2">Email</label>
          <input
            type="email"
            placeholder="nama@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              transition
            "
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
            placeholder="Minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
              transition
            "
            required
          />
        </div>

        {/* Konfirmasi Password */}
        <div className="mb-4">
          <label className="block font-semibold text-gray-800 mb-2">
            Konfirmasi Password
          </label>
          <input
            type="password"
            placeholder="Konfirmasi Password Anda"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
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
              transition
            "
            required
          />
        </div>

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-3 w-full bg-red-700 text-white font-semibold py-3 rounded-xl hover:bg-red-800 transition-all duration-200 mb-4 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Mendaftar..." : "Daftar"}
        </button>
      </form>

      {/* Have Account Already */}
      <div className="text-center">
        <span className="text-gray-600">Sudah punya akun?</span>
        <Link
          href="/auth/login"
          className="text-red-700 font-semibold hover:text-red-800 transition-colors"
        >
          {" "}
          Login di sini
        </Link>
      </div>
    </div>
  );
}
