"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import CardPendaftaran from "@/components/ui/CardPendaftaran";
import api from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ListPostPage() {
  const router = useRouter();

  const [posts, setPosts] = useState([]);
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

    const s = String(path);

    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("/storage/")) return `${API_BASE}${s}`;
    if (s.startsWith("/")) return `${API_BASE}${s}`;

    const cleaned = s.replace(/^public\//, "");
    return `${API_BASE}/storage/${cleaned}`;
  }

  function findOrmawaById(ormawaID) {
    const idNum = Number(ormawaID);
    return ormawa.find((o) => Number(o.id) === idNum) || null;
  }

  // mapping post => props CardPendaftaran (tanpa ubah CardPendaftaran)
  function mapPostToCard(post) {
    const o = findOrmawaById(post.ormawaID);

    const type = o?.type_ormawa || "Post";
    const cat = o?.category_ormawa || "Umum";

    const statusRaw = (post.status || "draft").toLowerCase();
    const statusTag =
      statusRaw === "published"
        ? "BUKA"
        : statusRaw === "closed"
        ? "DITUTUP"
        : statusRaw.toUpperCase();

    const deadline =
      post.deadline || post.deadline_date || post.end_date || "-";

    const lowongan =
      post.quota || post.slot || post.lowongan
        ? `${post.quota || post.slot || post.lowongan} Lowongan`
        : "-";

    return {
      tags: [type, statusTag, cat],
      title: post.title || "Judul tidak tersedia",
      subtitle: post.description || "",
      deadline: deadline,
      lowongan: lowongan,
    };
  }

  // =========================
  // FETCH POSTS + ORMAWA
  // =========================
  useEffect(() => {
    async function fetchData() {
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

        const [postsRes, ormawaRes] = await Promise.all([
          api.get("/api/posts"),
          api.get("/api/ormawa"),
        ]);

        const postsBody = postsRes.data;
        const postsData = postsBody?.data ?? postsBody ?? [];
        setPosts(Array.isArray(postsData) ? postsData : []);

        const ormawaBody = ormawaRes.data;
        const ormawaData = ormawaBody?.data ?? ormawaBody ?? [];
        setOrmawa(Array.isArray(ormawaData) ? ormawaData : []);
      } catch (err) {
        console.error(
          "Gagal memuat list postingan:",
          err?.response?.data || err?.message || err
        );

        if (err?.response?.status === 401) {
          setError("Sesi login berakhir. Silakan login ulang.");
          clearToken();
          router.replace("/auth/login");
          return;
        }

        setError("Gagal memuat data postingan dari server.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  // =========================
  // FILTERING (SEARCH)
  // =========================
  const filteredPosts = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    if (!t) return posts;

    return posts.filter((p) => {
      const title = (p?.title || "").toLowerCase();
      const desc = (p?.description || "").toLowerCase();
      const o = findOrmawaById(p?.ormawaID);
      const ormawaName = (o?.name || "").toLowerCase();

      return title.includes(t) || desc.includes(t) || ormawaName.includes(t);
    });
  }, [posts, ormawa, searchTerm]);

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
              <p className="text-[17px] font-semibold text-black">SIORMA</p>
              <p className="text-sm text-gray-500">
                Sistem Organisasi Mahasiswa
              </p>
            </div>
          </div>

          {/* Kanan - Menu */}
          <nav className="flex items-center gap-10 text-[15px] font-medium">
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
        <p className="text-[#3f1f1d] font-medium mt-3">List Postingan</p>

        {/* Search Bar */}
        <div className="mt-2 mb-4">
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
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>

            <input
              type="text"
              placeholder="Cari postingan..."
              className="w-full outline-none text-sm text-gray-600 placeholder:text-gray-400 bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        {/* Daftar Postingan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading && (
            <p className="text-sm text-gray-600">Memuat data postingan...</p>
          )}

          {!loading &&
            filteredPosts.map((post) => {
              const card = mapPostToCard(post);

              const postId = post.postID ?? post.id;
              const href = `/homepage/registration_form?postID=${encodeURIComponent(
                String(postId)
              )}&ormawaID=${encodeURIComponent(String(post.ormawaID))}`;

              // Controller kamu mengirim: poster_url (full URL) dan juga punya posterPath (path)
              const img =
                post?.poster_url ||
                storageUrl(post?.posterPath) ||
                "/Logo.png";

              return (
                <Link key={String(postId)} href={href} className="block">
                  <CardPendaftaran
                    tags={card.tags}
                    title={card.title}
                    subtitle={card.subtitle}
                    deadline={card.deadline}
                    lowongan={card.lowongan}
                    image={img}
                  />
                </Link>
              );
            })}

          {!loading && filteredPosts.length === 0 && (
            <p className="text-sm text-gray-600">
              Tidak ada postingan yang ditemukan.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
