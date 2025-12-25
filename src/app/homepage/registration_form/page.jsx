"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/lib/api";

export default function RegistrationFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ambil postID dari URL (case-sensitive)
  const postID = useMemo(() => searchParams.get("postID"), [searchParams]);
  const ormawaID = useMemo(() => searchParams.get("ormawaID"), [searchParams]);

  // =========================
  // STATE: POST DETAIL
  // =========================
  const [post, setPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(true);

  // =========================
  // STATE: FORM (sesuai tabel registrations)
  // =========================
  const [fullName, setFullName] = useState("");
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");

  // ✅ NEW: CV FILE
  const [cvFile, setCvFile] = useState(null);

  // =========================
  // UI STATE
  // =========================
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  function getAuthHeaders() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }

  // =========================
  // HELPER: ambil nama Ormawa dari Post
  // =========================
  function getOrmawaNameFromPost(p) {
    const name1 = p?.ormawa?.name;
    if (name1) return name1;

    const name2 = p?.ormawa?.nama;
    if (name2) return name2;

    const id = p?.ormawaID ?? p?.ormawa_id ?? p?.ormawaId;
    if (id) return `Ormawa #${id}`;

    return "";
  }

  const organizationAuto = useMemo(() => getOrmawaNameFromPost(post), [post]);

  // =========================
  // FETCH POST DETAIL
  // GET /api/posts/{postID}
  // =========================
  async function fetchPostDetail() {
    try {
      setLoadingPost(true);
      setError("");

      if (!postID) {
        setError("postID tidak ditemukan di URL.");
        setPost(null);
        return;
      }

      const res = await api.get(`/api/posts/${postID}`);
      const data = res.data?.data ?? res.data?.post ?? res.data ?? null;
      setPost(data);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat detail postingan.");
      setPost(null);
    } finally {
      setLoadingPost(false);
    }
  }

  useEffect(() => {
    fetchPostDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postID]);

  // =========================
  // SUBMIT REGISTRATION
  // POST /api/posts/{postID}/registrations
  // organization otomatis dari post->ormawa
  // + CV upload multipart
  // =========================
  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");
      setSuccessMsg("");

      const headers = getAuthHeaders();
      if (!headers) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      if (!postID) {
        setError("postID tidak ditemukan.");
        return;
      }

      if (!fullName.trim()) {
        setError("Nama lengkap wajib diisi.");
        return;
      }
      if (!nim.trim()) {
        setError("NIM wajib diisi.");
        return;
      }
      if (!email.trim()) {
        setError("Email wajib diisi.");
        return;
      }
      if (!phone.trim()) {
        setError("No. Telp wajib diisi.");
        return;
      }

      // ✅ Validasi CV (wajib/opsional tinggal kamu pilih)
      // Kalau CV wajib:
      if (!cvFile) {
        setError("CV wajib diupload.");
        return;
      }

      // Validasi tipe & ukuran (sesuaikan dengan backend kamu)
      if (cvFile) {
        const allowed = [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowed.includes(cvFile.type)) {
          setError("Format CV harus PDF.");
          return;
        }

        const maxBytes = 2 * 1024 * 1024; // 2MB (samakan dengan rule backend)
        if (cvFile.size > maxBytes) {
          setError("Ukuran CV maksimal 2MB.");
          return;
        }
      }

      // ✅ multipart/form-data via FormData
      const formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("nim", nim);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("organization", organizationAuto || "");
      if (reason) formData.append("reason", reason);

      // field name harus sama dengan backend (misal: "cv" atau "cv_file")
      // Saya pakai "cv" (sesuaikan dengan validation backend yang kamu buat)
      if (cvFile) formData.append("cv", cvFile);

      await api.post(`/api/posts/${postID}/registrations`, formData, {
        headers: {
          ...headers,
          // penting: axios akan set boundary otomatis,
          // tapi aman menambahkan ini
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg("Pendaftaran berhasil dikirim.");
      // opsional: reset form
      // setFullName(""); setNim(""); setEmail(""); setPhone(""); setReason(""); setCvFile(null);
      // opsional: redirect
      // router.push("/user/dashboard");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Gagal mengirim pendaftaran.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-screen bg-[#F8EDE9]">
      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Image src="/Logo.png" alt="Logo" width={48} height={48} />
          <div>
            <p className="font-bold">SIORMA</p>
            <p className="text-sm text-gray-500">Sistem Organisasi Mahasiswa</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {loadingPost ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-gray-600">Memuat detail postingan...</p>
          </div>
        ) : !postID ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-red-600">postID tidak ditemukan di URL.</p>
            <button
              type="button"
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 rounded-lg bg-gray-900 text-white"
            >
              Kembali
            </button>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={fetchPostDetail}
              className="mt-4 px-4 py-2 rounded-lg bg-gray-900 text-white"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
           {/* INFO POST */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border mb-6">
              <p className="text-sm text-gray-500 mb-1">Pendaftaran untuk:</p>
              <h1 className="text-xl font-semibold text-gray-900">
                {post?.title || "-"}
              </h1>

              <div className="text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">
                {post?.description || "-"}
              </div>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold">
                Ormawa: {organizationAuto || "-"}
              </div>
            </div>


            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-6 shadow-sm border"
            >
              <h2 className="text-lg font-semibold mb-4">Form Pendaftaran</h2>

              {successMsg && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
                  {successMsg}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Nama Lengkap <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    NIM <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border"
                    placeholder="Masukkan NIM"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border"
                    placeholder="Masukkan email"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    No. Telp <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border"
                    placeholder="Masukkan nomor telepon"
                  />
                </div>

                {/* Organization/Lab AUTO dari post->ormawa */}
                <div>
                  <label className="text-sm font-medium">
                    Organisasi/Laboratorium{" "}
                    <span className="text-red-600">*</span>
                  </label>
                  <input
                    value={organizationAuto || ""}
                    disabled
                    className="w-full mt-1 px-4 py-3 rounded-xl border bg-gray-100 cursor-not-allowed"
                    placeholder="Pilih organisasi atau laboratorium"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Diambil otomatis dari ormawa yang membuat postingan.
                  </p>
                </div>

                {/* ✅ NEW: Upload CV */}
                <div>
                  <label className="text-sm font-medium">
                    Upload CV <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setCvFile(f);
                    }}
                    className="w-full mt-1 px-4 py-3 rounded-xl border bg-white"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    Format: PDF. Maks 2MB.
                    {cvFile ? (
                      <span className="block mt-1 text-gray-700">
                        File dipilih: <strong>{cvFile.name}</strong>
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Alasan Bergabung</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full mt-1 px-4 py-3 rounded-xl border"
                    rows={4}
                    placeholder="Tulis alasan bergabung (opsional)"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 rounded-lg border"
                  disabled={isSubmitting}
                >
                  Kembali
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#A63E35] text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Pendaftaran"}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
