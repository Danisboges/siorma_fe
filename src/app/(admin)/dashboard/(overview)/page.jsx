"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardHeader } from "@/components/_shared/header/DashboardHeader";
import api from "@/lib/api";

export default function DashboardOverviewPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const ROLE = { ADMIN: "admin" };

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }

  function applyAuthHeader(token) {
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }

  function clearToken() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
  }

  useEffect(() => {
    async function guard() {
      try {
        setLoading(true);

        const token = getToken();
        if (!token) {
          router.replace("/auth/login");
          return;
        }

        applyAuthHeader(token);

        const res = await api.get("/api/me");
        const u = res.data?.data?.user || res.data?.user || res.data?.data || res.data;

        setUser(u);

        // BLOCK: selain admin, keluar dari dashboard
        if ((u?.role || "").toLowerCase() !== ROLE.ADMIN) {
          router.replace("/homepage"); // ganti ke halaman user kamu
          return;
        }
      } catch (err) {
        if (err?.response?.status === 401) {
          clearToken();
          router.replace("/auth/login");
          return;
        }

        router.replace("/homepage");
      } finally {
        setLoading(false);
      }
    }

    guard();
  }, [router]);

  if (loading) {
    return (
      <>
        <DashboardHeader title="Dashboard" />
        <main className="md:p-5 p-3 bg-red-100 min-h-screen">
          <p className="text-sm text-gray-600">Memuat...</p>
        </main>
      </>
    );
  }

  // sudah admin kalau sampai sini
  return (
    <>
      <DashboardHeader title="Dashboard" />

      <main className="md:p-5 p-3 bg-red-100 min-h-screen space-y-6">
        <section className="w-full bg-[#E11B22] text-white rounded-2xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-2">Selamat datang di Backoffice</h2>
          <p className="text-sm mb-4">
            Kelola semua aktivitas dan data sistem secara efisien melalui halaman ini.
            Backoffice dirancang untuk memudahkan admin dan organizer.
          </p>
        </section>

        <section className="grid md:grid-cols-2 grid-cols-1 gap-4">
          {String(user?.role || "").toLowerCase() === ROLE.ADMIN && (
            <div className="bg-red-50 rounded-2xl shadow-sm p-5 hover:shadow-md transition">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Manajemen User</h3>
              <p className="text-sm text-gray-600">
                Tambah, edit, atau hapus data pengguna, termasuk peran admin dan organizer.
              </p>
            </div>
          )}

          <div className="bg-red-50 rounded-2xl shadow-sm p-5 hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Postingan</h3>
            <p className="text-sm text-gray-600">
              Buat dan atur event atau kegiatan kampus agar selalu up-to-date.
            </p>
          </div>

          <div className="bg-red-50 rounded-2xl shadow-sm p-5 hover:shadow-md transition">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Manajemen Ormawa</h3>
            <p className="text-sm text-gray-600">
              Kelola organisasi mahasiswa dan struktur anggotanya dengan mudah.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
