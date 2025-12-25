"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import CardPendaftaran from "@/components/ui/CardPendaftaran";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function OrmawaDetailPage() {
  const router = useRouter();
  const params = useParams();

  // ✅ amankan id (kadang bisa array / undefined)
  const rawId = params?.id;
  const ormawaId = Array.isArray(rawId) ? rawId[0] : rawId; // string

  const [ormawa, setOrmawa] = useState(null);
  const [posts, setPosts] = useState([]);

  const [isLoadingOrmawa, setIsLoadingOrmawa] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // ✅ pisahkan error supaya nggak saling overwrite
  const [errorOrmawa, setErrorOrmawa] = useState("");
  const [errorPosts, setErrorPosts] = useState("");

  function applyAuthHeader() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return true;
    }
    return false;
  }

  function getPostID(post) {
    return post?.postID ?? post?.id ?? null;
  }

  function mapPostToCard(post) {
    return {
      tags: [
        "Post",
        (post?.status || "draft").toUpperCase(),
        `OrmawaID: ${post?.ormawaID ?? "-"}`,
      ],
      title: post?.title ?? "-",
      subtitle: post?.description ?? "-",
      deadline: "-",
      lowongan: "-",
    };
  }

  async function fetchOrmawaDetail(id) {
    try {
      setIsLoadingOrmawa(true);
      setErrorOrmawa("");

      const res = await api.get(`/api/ormawa/${encodeURIComponent(String(id))}`);
      const data = res.data?.data ?? res.data ?? null;

      if (!data) {
        setOrmawa(null);
        setErrorOrmawa("Data ormawa tidak ditemukan.");
        return;
      }

      setOrmawa(data);
    } catch (err) {
      console.error("FETCH ORMAWA DETAIL ERR:", err);
      setOrmawa(null);
      setErrorOrmawa(
        err?.response?.data?.message || "Gagal memuat detail ormawa."
      );
    } finally {
      setIsLoadingOrmawa(false);
    }
  }

  async function fetchPostsByOrmawaID(id) {
    try {
      setIsLoadingPosts(true);
      setErrorPosts("");

      const ok = applyAuthHeader();
      if (!ok) {
        // jangan ganggu detail ormawa, hanya set error posts
        setPosts([]);
        setErrorPosts("Token tidak ditemukan. Silakan login ulang untuk melihat postingan.");
        return;
      }

      const res = await api.get("/api/admin/posts");
      const data = res.data?.data ?? res.data?.posts ?? res.data ?? [];
      const list = Array.isArray(data) ? data : [];

      setPosts(list.filter((p) => String(p?.ormawaID) === String(id)));
    } catch (err) {
      console.error("FETCH POSTS ERR:", err);
      setPosts([]);
      setErrorPosts(
        err?.response?.data?.message || "Gagal memuat postingan ormawa."
      );
    } finally {
      setIsLoadingPosts(false);
    }
  }

  useEffect(() => {
    // ✅ guard id
    if (!ormawaId || String(ormawaId).trim() === "") {
      setIsLoadingOrmawa(false);
      setIsLoadingPosts(false);
      setErrorOrmawa("ID ormawa tidak ditemukan di URL.");
      return;
    }

    // optional debug
    // console.log("ORMAWA DETAIL ID:", ormawaId);

    fetchOrmawaDetail(ormawaId);
    fetchPostsByOrmawaID(ormawaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ormawaId]);

  const photoUrl = useMemo(() => {
    const path = ormawa?.photo_path || ormawa?.photoPath || null; // ✅ jaga-jaga beda nama
    return path ? `${API_BASE}/storage/${path}` : null;
  }, [ormawa]);

  const loading = isLoadingOrmawa || isLoadingPosts;

  return (
    <div className="min-h-screen bg-[#F8EDE9]">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Image src="/Logo.png" alt="SIORMA" width={48} height={48} />
            <div>
              <p className="font-semibold">SIORMA</p>
              <p className="text-sm text-gray-500">Sistem Organisasi Mahasiswa</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50"
          >
            Kembali
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6 pb-20 space-y-6">
        {/* ✅ Error detail ormawa */}
        {errorOrmawa && (
          <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {errorOrmawa}
          </p>
        )}

        {/* ORMAWA DETAIL */}
        <section className="bg-white rounded-2xl border p-6 flex flex-col md:flex-row gap-5 items-start">
          <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={`Logo ${ormawa?.name || "Ormawa"}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-gray-500">
                {(ormawa?.name || "O").charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {isLoadingOrmawa ? "Memuat..." : ormawa?.name || "-"}
            </h1>
            <p className="text-gray-700 text-sm leading-relaxed">
              {isLoadingOrmawa
                ? "Memuat deskripsi..."
                : ormawa?.description || "Belum ada deskripsi."}
            </p>
          </div>
        </section>

        {/* POSTS ORMAWA */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Postingan Ormawa</h2>
            <span className="text-sm text-gray-500">
              {isLoadingPosts ? "Memuat..." : `${posts.length} postingan`}
            </span>
          </div>

          {/* ✅ Error posts terpisah */}
          {errorPosts && (
            <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              {errorPosts}
            </p>
          )}

          {loading ? (
            <p className="text-gray-600">Memuat data...</p>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border p-6 text-gray-600">
              Belum ada postingan untuk ormawa ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => {
                const pid =
                  getPostID(post) || `${post?.ormawaID}-${post?.title}`;
                return (
                  <div key={pid}>
                    <CardPendaftaran {...mapPostToCard(post)} />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
