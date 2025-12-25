"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import CardOrmawa from "@/components/ui/CardOrmawa";
import api from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ListOrmawaPage() {
  const router = useRouter();

  const [ormawa, setOrmawa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  // =========================
  // TOKEN HELPERS
  // =========================
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

  // =========================
  // HELPERS
  // =========================
  function storageUrl(path) {
    if (!path) return null;
    return `${API_BASE}/storage/${path}`;
  }

  // =========================
  // FETCH ORMAWA: GET /api/ormawa
  // =========================
  useEffect(() => {
    async function fetchOrmawa() {
      try {
        setLoading(true);
        setError("");

        const token = getToken();
        if (!token) {
          setError("Sesi belum login. Silakan login terlebih dahulu.");
          router.replace("/auth/login");
          return;
        }

        applyAuthHeader(token);

        const res = await api.get("/api/ormawa");
        const body = res.data;
        const data = body?.data ?? body ?? [];

        setOrmawa(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(
          "Gagal memuat list ormawa:",
          err?.response?.data || err?.message || err
        );

        if (err?.response?.status === 401) {
          setError("Sesi login berakhir. Silakan login ulang.");
          clearToken();
          router.replace("/auth/login");
          return;
        }

        setError("Gagal memuat data ormawa dari server.");
      } finally {
        setLoading(false);
      }
    }

    fetchOrmawa();
  }, [router]);

  // =========================
  // FILTERING (SEARCH)
  // =========================
  const filteredOrmawa = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return ormawa;

    return ormawa.filter((o) => {
      const name = (o?.name || "").toLowerCase();
      const type = (o?.type_ormawa || "").toLowerCase();
      const category = (o?.category_ormawa || "").toLowerCase();
      return name.includes(t) || type.includes(t) || category.includes(t);
    });
  }, [ormawa, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F8EDE9]">
      {/* Navbar */}
      <header className="w-full bg-white border-b border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* kiri - logo + text */}
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
              <p className="text-sm text-gray-500">
                Sistem Organisasi Mahasiswa
              </p>
            </div>
          </div>

          {/* kanan - menu */}
          <nav className="flex items-center gap-10 text-[15px] font-medium">
            {/* (optional) arahkan ke logout page / implement logout */}
            <Link
              href="/homepage"
              className="text-black hover:text-[#A63E35] transition-colors"
            >
              Kembali
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 mb-6 pb-28">
        {/* Title */}
        <p className="text-[#3f1f1d] font-medium mt-3">List Ormawa</p>

        {/* Search Bar */}
        <div className="mt-2">
          <div className="w-full bg-white rounded-2xl px-6 py-4 shadow-sm border border-[#ebe3e3] flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#9b4c48]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
              />
            </svg>

            <input
              type="text"
              placeholder="Cari organisasi atau Laboratorium.."
              className="w-full outline-none text-[#7e3c3a] placeholder-[#9b4c48] bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        {/* Grid Ormawa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          {loading && (
            <p className="text-sm text-gray-600">Memuat data ormawa...</p>
          )}

          {!loading &&
            filteredOrmawa.map((o) => (
              <CardOrmawa
                key={o.id}
                ormawaId={o.id}
                title={o.name}
                tags={[o.type_ormawa, o.category_ormawa]}
                image={storageUrl(o.photo_path) || "/placeholder.png"}
              />
            ))}

          {!loading && filteredOrmawa.length === 0 && (
            <p className="text-sm text-gray-600">
              Data ormawa tidak ditemukan.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
