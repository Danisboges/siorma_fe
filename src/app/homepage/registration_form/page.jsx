"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";

export default function RegistrationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // ambil postID dari query: /homepage/registration_form?postID=123
  const postID = useMemo(() => searchParams.get("postID"), [searchParams]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // form state (sesuai BE)
  const [full_name, setFullName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [statusMahasiswa, setStatusMahasiswa] = useState(""); // UI saja (tidak dikirim ke BE)
  const [reason, setReason] = useState("");

  // OPTIONAL: prefilling dari user login
  useEffect(() => {
    async function prefill() {
      try {
        const res = await api.get("/api/me");
        const u = res.data?.data || res.data;

        // isi otomatis kalau ada
        if (u?.name && !full_name) setFullName(u.name);
        if (u?.email && !email) setEmail(u.email);
      } catch {
        // kalau gagal, abaikan (user mungkin belum login)
      }
    }
    prefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!postID) {
      setError("postID tidak ditemukan. Silakan kembali dan pilih postingan dari halaman sebelumnya.");
      return;
    }

    // validasi frontend sederhana (backend tetap validasi)
    if (!full_name.trim() || !nim.trim() || !email.trim() || !phone.trim()) {
      setError("Mohon lengkapi field wajib (Nama, NIM, Email, Nomor Telepon).");
      return;
    }

    if (reason.trim().length > 0 && reason.trim().length < 20) {
      setError("Alasan bergabung minimal 20 karakter (atau kosongkan).");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        full_name: full_name.trim(),
        nim: nim.trim(),
        email: email.trim(),
        phone: phone.trim(),
        organization: organization.trim() ? organization.trim() : null,
        reason: reason.trim() ? reason.trim() : null,
      };

      await api.post(`/api/posts/${postID}/registrations`, payload);

      setSuccessMsg("Pendaftaran berhasil dikirim. Silakan tunggu proses verifikasi.");
      // reset form (opsional)
      // setNim(""); setPhone(""); setOrganization(""); setStatusMahasiswa(""); setReason("");
    } catch (err) {
      const code = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Terjadi kesalahan.";

      if (code === 401) {
        setError("Anda belum login / sesi habis. Silakan login terlebih dahulu.");
      } else if (code === 404) {
        setError("Event/post tidak ditemukan atau belum dipublish.");
      } else if (code === 409) {
        setError("Anda sudah terdaftar pada event ini.");
      } else if (code === 422) {
        setError("Validasi gagal. Pastikan data yang diisi sudah benar.");
      } else {
        setError(`Gagal mengirim pendaftaran: ${msg}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8EDE9]">
      {/* Navbar */}
      <header className="w-full bg-white border-b border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Kiri - Logo + Text */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[#A63E35] rounded-xl flex items-center justify-center">
              <Image
                src="/Logo.png"
                alt="Logo SIORMA"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </div>

            <div className="leading-tight">
              <p className="text-[17px] font-semibold text-black">Siorma</p>
              <p className="text-sm text-gray-500">Sistem Organisasi Mahasiswa</p>
            </div>
          </div>

          <nav className="flex items-center gap-10 text-[15px] font-medium">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-black hover:text-[#A63E35] transition-colors"
            >
              Kembali
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 mb-6 pb-28">
        {/* Red Banner */}
        <div className="w-full bg-red-600 rounded-4xl px-8 py-8 md:px-12 md:py-10">
          <h1 className="text-white text-3xl md:text-4xl font-bold">
            Form Pendaftaran Organisasi & Laboratorium
          </h1>

          <p className="text-white text-base md:text-lg mt-2 leading-relaxed">
            Isi formulir di bawah ini untuk bergabung dengan organisasi atau laboratorium pilihan Anda
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
          {/* pesan */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-green-700">{successMsg}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="Masukkan nama lengkap Anda"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                NIM <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nim"
                name="nim"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="1234567890"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="nama@gmail.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nomor Telepon <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="081234567890"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Organisasi/Laboratorium <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="Pilih organisasi atau laboratorium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status Mahasiswa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="status"
                name="status"
                value={statusMahasiswa}
                onChange={(e) => setStatusMahasiswa(e.target.value)}
                className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                placeholder="Pilih status Anda sebagai mahasiswa"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-semibold text-gray-700 mb-2">
                Alasan Bergabung <span className="text-[#A63E35]">*</span>
              </label>
              <textarea
                id="reason"
                name="reason"
                rows="5"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A63E35] focus:border-transparent transition-all resize-none"
                placeholder="Ceritakan alasan Anda ingin bergabung dengan organisasi/laboratorium ini (minimal 20 karakter)"
              />
              <p className="mt-1 text-sm text-gray-500">Minimal 20 karakter (boleh kosong)</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-linear-to-r from-[#A63E35] to-[#C14D42] text-white font-semibold py-4 px-6 rounded-xl hover:from-[#8B3329] hover:to-[#A63E35] focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting ? "Mengirim..." : "Daftar Sekarang"}
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">ℹ️ Info:</span> Setelah mendaftar, tim kami akan meninjau aplikasi Anda dan menghubungi melalui email atau WhatsApp dalam 2-3 hari kerja.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
