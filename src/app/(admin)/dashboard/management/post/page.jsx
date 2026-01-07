"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingPost, setDeletingPost] = useState(null);

  // FORM (dipakai untuk Add & Edit)
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
    return post?.postID ?? post?.id ?? null;
  }

  function getPosterUrl(post) {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

    const raw =
      post?.poster_url ??
      post?.posterUrl ??
      post?.posterPath ??
      post?.poster_path ??
      post?.poster ??
      post?.posterFile ??
      null;

    if (!raw) return null;

    if (typeof raw === "string" && /^https?:\/\//i.test(raw)) return raw;

    const str = String(raw);
    const path = str.startsWith("/") ? str : `/${str}`;

    // Jika BE mengirim sudah /storage/...
    if (path.startsWith("/storage/")) return `${base}${path}`;

    // Jika BE mengirim mis. posters/abc.jpg atau /posters/abc.jpg
    return `${base}/storage${path}`;
  }

  // =========================
  // FETCH ORMAWA (untuk admin)
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

      if (list.length > 0) {
        setSelectedOrmawaID((prev) => prev || String(list[0].id));
      } else {
        setSelectedOrmawaID("");
      }

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
      const list = Array.isArray(data) ? data : [];
      setPosts(list);
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
    return (posts || []).filter((p) => {
      const ttl = (p?.title || "").toLowerCase();
      const desc = (p?.description || "").toLowerCase();
      const st = (p?.status || "").toLowerCase();
      const oid = String(p?.ormawaID ?? "").toLowerCase();
      return (
        ttl.includes(t) || desc.includes(t) || st.includes(t) || oid.includes(t)
      );
    });
  }, [posts, searchTerm]);

  // =========================
  // DELETE
  // =========================
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
  // CREATE POST
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
      if (!t) return setError("Judul wajib diisi.");
      if (!d) return setError("Deskripsi wajib diisi.");

      const fd = new FormData();
      fd.append("ormawaID", ormawaID);
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

  // =========================
  // EDIT / UPDATE POST
  // =========================
  async function openEdit(post) {
    if (ormawas.length === 0) {
      await fetchOrmawas(false);
    }

    setEditingPost(post);

    setTitle(post?.title ?? "");
    setDescription(post?.description ?? "");
    setStatus(post?.status ?? "draft");
    setPosterFile(null);

    const oid = post?.ormawaID ?? "";
    setSelectedOrmawaID(oid ? String(oid) : "");

    setIsEditOpen(true);
  }

  function closeEdit() {
    setIsEditOpen(false);
    setEditingPost(null);
    resetForm();
  }

  async function handleUpdate() {
    try {
      setError("");

      if (!applyAuthHeader()) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      if (!editingPost) return;

      const id = getPostID(editingPost);

      if (!id) {
        setError("ID postingan tidak ditemukan.");
        return;
      }

      const ormawaID = String(selectedOrmawaID || "").trim();
      if (!ormawaID) return setError("Silakan pilih Ormawa terlebih dahulu.");

      const t = title.trim();
      const d = description.trim();
      if (!t) return setError("Judul wajib diisi.");
      if (!d) return setError("Deskripsi wajib diisi.");

      const fd = new FormData();
      fd.append("_method", "PUT"); // <-- penting untuk Laravel multipart update
      fd.append("ormawaID", ormawaID);
      fd.append("title", t);
      fd.append("description", d);
      fd.append("status", status);
      if (posterFile) fd.append("poster", posterFile);

      // Laravel-friendly: POST + _method=PUT
      await api.post(`/api/admin/posts/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchPosts();
      closeEdit();
    } catch (err) {
      console.error(err);
      setError("Gagal mengupdate postingan.");
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
              fetchOrmawas(true);
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
          className="w-full mb-6 px-4 py-3 rounded-xl border bg-white"
        />

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {isLoading && <p className="text-gray-600">Memuat data...</p>}

        {!isLoading && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr className="text-left">
                    <th className="p-4 w-[12%]">Poster</th>
                    <th className="p-4 w-[22%]">Judul</th>
                    <th className="p-4 w-[12%]">Status</th>
                    <th className="p-4 w-[12%]">Ormawa ID</th>
                    <th className="p-4">Deskripsi</th>
                    <th className="p-4 w-[14%] text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td className="p-4 text-gray-500" colSpan={6}>
                        Tidak ada postingan yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => {
                      const id = getPostID(post);
                      const posterUrl = getPosterUrl(post);

                      return (
                        <tr key={id} className="border-t align-top">
                          <td className="p-4">
                            {posterUrl ? (
                              <div className="relative w-20 h-14 rounded-lg overflow-hidden border bg-gray-50">
                                <Image
                                  src={posterUrl}
                                  alt="Poster"
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                No image
                              </span>
                            )}
                          </td>

                          <td className="p-4 font-medium text-gray-900">
                            {post?.title ?? "-"}
                          </td>

                          <td className="p-4">
                            <span
                              className={[
                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                (post?.status || "draft") === "published"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700",
                              ].join(" ")}
                            >
                              {(post?.status || "draft").toUpperCase()}
                            </span>
                          </td>

                          <td className="p-4 text-gray-700">
                            {post?.ormawaID ?? "-"}
                          </td>

                          <td className="p-4 text-gray-700">
                            <p className="line-clamp-3">
                              {post?.description ?? "-"}
                            </p>
                          </td>

                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(post)}
                                className="px-3 py-1.5 rounded-lg bg-[#A63E35] text-white hover:opacity-90"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => openDelete(post)}
                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <p className="text-lg font-semibold mb-1">Edit Postingan</p>
            <p className="text-sm text-gray-500 mb-4">
              Perbarui data postingan. (Poster opsional, isi jika ingin
              mengganti)
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
                {editingPost?.posterPath && (
                  <p className="text-xs text-gray-500 mt-1">
                    Poster saat ini tersimpan. Pilih file baru untuk mengganti.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={closeEdit}
                className="px-4 py-2 border rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="px-4 py-2 bg-[#A63E35] text-white rounded-lg"
                disabled={ormawas.length === 0}
              >
                Simpan Perubahan
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
