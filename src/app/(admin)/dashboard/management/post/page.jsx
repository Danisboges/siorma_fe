"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import CardPendaftaran from "@/components/ui/CardPendaftaran";
import api from "@/lib/api";

export default function ListPostPage() {
  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ORMAWA (dropdown tambah post)
  const [ormawas, setOrmawas] = useState([]);
  const [selectedOrmawaID, setSelectedOrmawaID] = useState("");

  // MODAL
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);

  // FORM
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [posterFile, setPosterFile] = useState(null);

  function applyAuthHeader() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return true;
    }
    return false;
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus("draft");
    setPosterFile(null);
    setSelectedOrmawaID("");
  }

  function getPostID(post) {
    return post?.postID ?? post?.id;
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

  // =========================
  // FETCH ORMAWA (untuk admin)
  // Endpoint: GET /api/admin/ormawa
  // Response: { data: [{id,name,...}, ...] }
  // =========================
  async function fetchOrmawas(forceOpenModal = false) {
    try {
      setError("");
      if (!applyAuthHeader()) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await api.get("/api/admin/ormawa");
      const data = res.data?.data ?? res.data?.ormawas ?? res.data ?? [];
      const list = Array.isArray(data) ? data : [];

      setOrmawas(list);

      // set default pilihan (kalau belum ada)
      if (list.length > 0) {
        setSelectedOrmawaID((prev) => prev || String(list[0].id));
      } else {
        setSelectedOrmawaID("");
      }

      // buka modal setelah data siap (opsional)
      if (forceOpenModal) setIsAddOpen(true);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat daftar ormawa untuk admin.");
    }
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
      const data = res.data?.data ?? res.data?.posts ?? res.data ?? [];
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
    fetchOrmawas(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // FILTER
  const filteredPosts = useMemo(() => {
    const t = (searchTerm || "").toLowerCase();
    return (posts || []).filter(
      (p) =>
        (p?.title || "").toLowerCase().includes(t) ||
        (p?.description || "").toLowerCase().includes(t) ||
        (p?.status || "").toLowerCase().includes(t)
    );
  }, [posts, searchTerm]);

  // DELETE
  function openDelete(post) {
    setDeletingPost(post);
    setIsDeleteOpen(true);
  }

  async function handleDelete() {
    try {
      setError("");
      if (!applyAuthHeader()) return;
      if (!deletingPost) return;

      const id = getPostID(deletingPost);
      if (!id) {
        setError("ID postingan tidak ditemukan.");
        return;
      }

      await api.delete(`/api/admin/posts/${id}`);
      await fetchPosts();
      setIsDeleteOpen(false);
      setDeletingPost(null);
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus postingan.");
    }
  }

  // =========================
  // CREATE POST (sesuai kebutuhan)
  // kirim: ormawaID, title, description, status, poster(optional)
  // =========================
  async function handleCreate() {
    try {
      setError("");

      if (!applyAuthHeader()) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const ormawaID = String(selectedOrmawaID || "").trim();
      if (!ormawaID) {
        setError("Silakan pilih Ormawa terlebih dahulu.");
        return;
      }

      const t = title.trim();
      const d = description.trim();
      if (!t) {
        setError("Judul wajib diisi.");
        return;
      }
      if (!d) {
        setError("Deskripsi wajib diisi.");
        return;
      }

      const fd = new FormData();
      fd.append("ormawaID", ormawaID); // backend validate exists:ormawa,id
      fd.append("title", t);
      fd.append("description", d);
      fd.append("status", status);
      if (posterFile) fd.append("poster", posterFile);

      await api.post("/api/admin/posts", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchPosts();
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Gagal menambah postingan.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F8EDE9]">
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
            type="button"
            onClick={() => {
              resetForm();
              fetchOrmawas(true); // ambil ormawa lalu buka modal
            }}
            className="bg-[#A63E35] text-white px-4 py-2 rounded-xl"
          >
            + Tambah Postingan
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6 pb-20">
        <p className="font-semibold mb-3">List Postingan</p>

        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cari postingan..."
          className="w-full mb-6 px-4 py-3 rounded-xl border"
        />

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {isLoading && <p className="text-gray-600">Memuat data...</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {!isLoading &&
            filteredPosts.map((post) => {
              const card = mapPostToCard(post);
              return (
                <div key={getPostID(post)} className="relative">
                  <div className="pr-20">
                    <CardPendaftaran {...card} />
                  </div>

                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                      type="button"
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

      {/* ADD MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <p className="text-lg font-semibold mb-1">Tambah Postingan</p>
            <p className="text-sm text-gray-500 mb-4">
              Admin dapat memilih ormawa target sesuai akses.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Pilih Ormawa</label>
                <select
                  value={selectedOrmawaID}
                  onChange={(e) => setSelectedOrmawaID(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                  disabled={ormawas.length === 0}
                >
                  <option value="">
                    {ormawas.length === 0
                      ? "Tidak ada ormawa tersedia"
                      : "-- Pilih Ormawa --"}
                  </option>
                  {ormawas.map((o) => (
                    <option key={o.id} value={String(o.id)}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Judul</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                  placeholder="Masukkan judul"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                  rows={4}
                  placeholder="Masukkan deskripsi"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                >
                  <option value="draft">draft</option>
                  <option value="published">published</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Poster (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                  className="w-full mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-2 bg-[#A63E35] text-white rounded-lg"
                disabled={ormawas.length === 0}
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <p className="mb-4">
              Hapus postingan <strong>{deletingPost?.title}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
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
