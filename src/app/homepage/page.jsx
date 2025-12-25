"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import CardOrmawa from "@/components/ui/CardOrmawa";
import CardPendaftaran from "@/components/ui/CardPendaftaran";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [posts, setPosts] = useState([]);
  const [ormawa, setOrmawa] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("Semua");

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
    async function fetchUser() {
      try {
        setLoadingUser(true);

        const token = getToken();
        if (!token) {
          console.error("Gagal mengambil user login: token tidak ditemukan");
          router.replace("/auth/login");
          return;
        }

        applyAuthHeader(token);

        const res = await api.get("/api/me");
        const body = res.data;

        setUser(body?.data?.user || body?.user || body?.data || body);
      } catch (err) {
        console.error(
          "Gagal mengambil user login:",
          err?.response?.data || err?.message || err
        );

        if (err?.response?.status === 401) {
          clearToken();
          router.replace("/auth/login");
        }
      } finally {
        setLoadingUser(false);
      }
    }

    fetchUser();
  }, [router]);

  useEffect(() => {
    async function fetchHomeData() {
      try {
        setLoadingData(true);
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
          "Gagal memuat data homepage:",
          err?.response?.data || err?.message || err
        );

        if (err?.response?.status === 401) {
          setError("Sesi login berakhir. Silakan login ulang.");
          clearToken();
          router.replace("/auth/login");
          return;
        }

        setError("Gagal memuat data dari server.");
      } finally {
        setLoadingData(false);
      }
    }

    fetchHomeData();
  }, [router]);

  const namaUser = user?.name || user?.fullname || "Pengguna";

  function storageUrl(path) {
    if (!path) return null;

    const s = String(path);

    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    if (s.startsWith("/storage/")) return `${API_BASE}${s}`;
    if (s.startsWith("/")) return `${API_BASE}${s}`;

    const cleaned = s.replace(/^public\//, "");
    return `${API_BASE}/storage/${cleaned}`;
  }

  function postImageUrl(post) {
    const url =
      post?.poster_url ||
      storageUrl(post?.posterPath) ||
      storageUrl(post?.poster_path) ||
      storageUrl(post?.poster) ||
      storageUrl(post?.image_path) ||
      storageUrl(post?.image) ||
      null;

    return url || "/Logo.png";
  }

  function findOrmawaById(ormawaID) {
    const idNum = Number(ormawaID);
    return ormawa.find((o) => Number(o.id) === idNum) || null;
  }

  const filteredOrmawa = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();

    return ormawa.filter((o) => {
      const matchSearch =
        !t ||
        (o.name || "").toLowerCase().includes(t) ||
        (o.type_ormawa || "").toLowerCase().includes(t) ||
        (o.category_ormawa || "").toLowerCase().includes(t);

      const matchCategory =
        category === "Semua" ||
        (o.category_ormawa || "").toLowerCase() === category.toLowerCase();

      return matchSearch && matchCategory;
    });
  }, [ormawa, searchTerm, category]);

  const filteredPosts = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();

    return posts
      .filter((p) => {
        const status = (p.status || "").toLowerCase();
        if (status !== "published") return false;

        const postTitle = (p.title || "").toLowerCase();
        const postDesc = (p.description || "").toLowerCase();

        const o = findOrmawaById(p.ormawaID);
        const postCategory = (o?.category_ormawa || "").toLowerCase();

        const matchCategory =
          category === "Semua" || postCategory === category.toLowerCase();

        const matchSearch = !t || postTitle.includes(t) || postDesc.includes(t);

        return matchCategory && matchSearch;
      })
      .slice(0, 4);
  }, [posts, ormawa, searchTerm, category]);

  function mapPostToCard(post) {
    const o = findOrmawaById(post.ormawaID);

    const type = o?.type_ormawa || "Post";
    const cat = o?.category_ormawa || "Umum";
    const stat = (post.status || "draft").toUpperCase();

    return {
      tags: [type, stat, cat],
      title: post.title || "Judul tidak tersedia",
      subtitle: post.description || "",
      deadline: "-",
      lowongan: "-",
    };
  }

  return (
    <div className="min-h-screen bg-[#F8EDE9]">
      <header className="w-full bg-white border-b border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

          <nav className="flex items-center gap-10 text-[15px] font-medium">
            <Link
              href="/list-ormawa"
              className="text-black hover:text-[#A63E35] transition-colors"
            >
              Ormawa
            </Link>

            <Link
              href="/list-postingan"
              className="text-black hover:text-[#A63E35] transition-colors"
            >
              Post
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 mb-6 pb-28">
        <div className="w-full bg-red-600 rounded-4xl px-8 py-8 md:px-12 md:py-10">
          <h1 className="text-white text-3xl md:text-4xl font-bold">
            {loadingUser ? "Memuat..." : `Selamat Datang, ${namaUser}!`}
          </h1>

          <p className="text-white text-base md:text-lg mt-2 leading-relaxed">
            Temukan peluang untuk bergabung dengan berbagai organisasi dan
            laboratorium kampus.
          </p>
        </div>

        <div className="mt-6">
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

        <p className="text-[#3f1f1d] font-medium mt-3">Kategori</p>

        <div className="w-full grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 mt-3">
          {[
            "Semua",
            "Teknologi",
            "Sosial",
            "Seni & Budaya",
            "Akademik",
            "Olahraga",
          ].map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className="w-full px-5 py-2 bg-white rounded-full text-sm font-semibold shadow-sm border border-[#e6e0de] hover:bg-[#f5f0ef] transition text-center"
            >
              {item}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <p className="text-[#3f1f1d] font-medium mt-10 mb-4">
          Pendaftaran Tersedia ({filteredPosts.length})
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loadingData && <p className="text-sm text-gray-600">Memuat data...</p>}

          {!loadingData &&
            filteredPosts.map((post) => {
              const card = mapPostToCard(post);
              const href = `/homepage/registration_form?postID=${post.postID}&ormawaID=${post.ormawaID}`;

              return (
                <Link key={post.postID} href={href} className="block">
                  <CardPendaftaran
                    tags={card.tags}
                    title={card.title}
                    subtitle={card.subtitle}
                    deadline={card.deadline}
                    lowongan={card.lowongan}
                    image={postImageUrl(post)}
                  />
                </Link>
              );
            })}

          {!loadingData && filteredPosts.length === 0 && (
            <p className="text-sm text-gray-600">
              Tidak ada pendaftaran yang tersedia.
            </p>
          )}
        </div>

        <p className="text-[#3f1f1d] font-medium mt-10 mb-4">Ormawa</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {!loadingData &&
            filteredOrmawa.slice(0, 4).map((o) => (
              <CardOrmawa
                key={o.id}
                ormawaId={o.id}
                title={o.name}
                tags={[o.type_ormawa, o.category_ormawa]}
                imageUrl={storageUrl(o.photo_path) || "/Logo.png"}
              />
            ))}

          {!loadingData && filteredOrmawa.length === 0 && (
            <p className="text-sm text-gray-600">Data ormawa tidak ditemukan.</p>
          )}
        </div>
      </main>
    </div>
  );
}
