"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import CardPendaftaran from "@/components/ui/CardPendaftaran";
import api from "@/lib/api";

export default function ListPostPage() {
  // =========================
  // STATE DATA
  // =========================
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // MODAL STATE
  // =========================
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [editingPost, setEditingPost] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);

  // =========================
  // FORM STATE
  // =========================
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [ormawaID, setOrmawaID] = useState("");
  const [posterFile, setPosterFile] = useState(null);

  // =========================
  // AUTH HELPER
  // =========================
  function applyAuthHeader() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return true;
    }
    return false;
  }

  // =========================
  // FETCH POSTS
  // =========================
  async function fetchPosts() {
    try {
      setIsLoading(true);
      setError("");

      if (!applyAuthHeader()) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await api.get("/api/admin/posts");
      const data =
        res.data?.data ??
        res.data?.posts ??
        res.data ??
        [];

      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat postingan.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  // =========================
  // FILTER
  // =========================
  const filteredPosts = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return posts.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(t) ||
        (p.description || "").toLowerCase().includes(t) ||
        (p.status || "").toLowerCase().includes(t)
    );
  }, [posts, searchTerm]);

  // =========================
  // HELPERS
  // =========================
  function getPostID(post) {
    return post.postID ?? post.id;
  }

  function mapPostToCard(post) {
    return {
      tags: [
        "Post",
        (post.status || "draft").toUpperCase(),
        `OrmawaID: ${post.ormawaID}`,
      ],
      title: post.title,
      subtitle: post.description,
      deadline: "-",
      lowongan: "-",
    };
  }

  // =========================
  // EDIT / DELETE HANDLER
  // =========================
  function openEdit(post) {
    setEditingPost(post);
    setTitle(post.title || "");
    setDescription(post.description || "");
    setStatus(post.status || "draft");
    setOrmawaID(post.ormawaID || "");
    setPosterFile(null);
    setIsEditOpen(true);
  }

  function openDelete(post) {
    setDeletingPost(post);
    setIsDeleteOpen(true);
  }

  async function handleDelete() {
    try {
      if (!applyAuthHeader()) return;
      await api.delete(`/api/admin/posts/${getPostID(deletingPost)}`);
      await fetchPosts();
      setIsDeleteOpen(false);
      setDeletingPost(null);
    } catch {
      setError("Gagal menghapus postingan.");
    }
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="min-h-screen bg-[#F8EDE9]">
      {/* HEADER */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
          <div className="flex items-center gap-4">
            <Image src="/Logo.png" alt="Logo" width={48} height={48} />
            <div>
              <p className="font-bold">SIORMA</p>
              <p className="text-sm text-gray-500">
                Sistem Organisasi Mahasiswa
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#A63E35] text-white px-4 py-2 rounded-xl"
          >
            + Tambah Postingan
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 mt-6 pb-20">
        <p className="font-semibold mb-3">List Postingan</p>

        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari postingan..."
          className="w-full mb-6 px-4 py-3 rounded-xl border"
        />

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!isLoading &&
            filteredPosts.map((post) => {
              const card = mapPostToCard(post);
              return (
                <div key={getPostID(post)} className="relative">
                  {/* Padding kanan agar aman */}
                  <div className="pr-20">
                    <CardPendaftaran {...card} />
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                      onClick={() => openEdit(post)}
                      className="px-3 py-1.5 rounded-lg bg-white border text-xs font-semibold hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDelete(post)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </main>

      {/* DELETE CONFIRM */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <p className="mb-4">
              Hapus postingan{" "}
              <strong>{deletingPost?.title}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
