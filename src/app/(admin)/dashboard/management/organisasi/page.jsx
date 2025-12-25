"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import api from "@/lib/api";

export default function ListOrmawaPage() {
  // =====================
  // DATA
  // =====================
  const [ormawa, setOrmawa] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================
  // MODAL
  // =====================
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrmawa, setEditingOrmawa] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingOrmawa, setDeletingOrmawa] = useState(null);

  const [saving, setSaving] = useState(false);

  // =====================
  // FORM
  // =====================
  const [name, setName] = useState("");
  const [type_ormawa, setTypeOrmawa] = useState("Organisasi");
  const [category_ormawa, setCategoryOrmawa] = useState("Teknologi");
  const [status_oprec, setStatusOprec] = useState("BUKA");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);

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
    setName("");
    setTypeOrmawa("Organisasi");
    setCategoryOrmawa("Teknologi");
    setStatusOprec("BUKA");
    setDescription("");
    setPhoto(null);
  }

  function getOrmawaID(item) {
    return item?.id ?? item?.ormawaID ?? item?.ormawaId ?? null;
  }

  // =====================
  // FETCH DATA
  // =====================
  async function fetchOrmawa() {
    try {
      setIsLoading(true);
      setError("");

      // kalau endpoint /api/ormawa public, auth header tidak wajib.
      // tapi aman dipasang kalau ada token.
      applyAuthHeader();

      const res = await api.get("/api/ormawa");
      const data = res.data?.data ?? res.data ?? [];
      setOrmawa(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data ormawa.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchOrmawa();
  }, []);

  // =====================
  // FILTER SEARCH
  // =====================
  const filtered = useMemo(() => {
    const t = (searchTerm || "").toLowerCase();
    return (ormawa || []).filter((o) => {
      const n = (o?.name || "").toLowerCase();
      const ty = (o?.type_ormawa || "").toLowerCase();
      const cat = (o?.category_ormawa || "").toLowerCase();
      const st = (o?.status_oprec || "").toLowerCase();
      return (
        n.includes(t) || ty.includes(t) || cat.includes(t) || st.includes(t)
      );
    });
  }, [ormawa, searchTerm]);

  // =====================
  // OPEN/CLOSE MODAL
  // =====================
  function openAdd() {
    setError("");
    resetForm();
    setIsAddOpen(true);
  }

  function closeAdd() {
    setIsAddOpen(false);
    resetForm();
  }

  function openEdit(item) {
    setError("");
    setEditingOrmawa(item);

    setName(item?.name || "");
    setTypeOrmawa(item?.type_ormawa || "Organisasi");
    setCategoryOrmawa(item?.category_ormawa || "Teknologi");
    setStatusOprec(item?.status_oprec || "BUKA");
    setDescription(item?.description || "");
    setPhoto(null);

    setIsEditOpen(true);
  }

  function closeEdit() {
    setIsEditOpen(false);
    setEditingOrmawa(null);
    resetForm();
  }

  function openDelete(item) {
    setError("");
    setDeletingOrmawa(item);
    setIsDeleteOpen(true);
  }

  function closeDelete() {
    setIsDeleteOpen(false);
    setDeletingOrmawa(null);
  }

  // =====================
  // CREATE
  // =====================
  async function handleCreate() {
    try {
      setError("");

      if (!applyAuthHeader()) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      if (!name.trim()) return setError("Nama ormawa wajib diisi.");

      setSaving(true);

      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("type_ormawa", type_ormawa);
      fd.append("category_ormawa", category_ormawa);
      fd.append("status_oprec", status_oprec);
      fd.append("description", description);
      if (photo) fd.append("photo", photo);

      await api.post("/api/admin/ormawa", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchOrmawa();
      closeAdd();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Gagal menyimpan data ormawa.");
    } finally {
      setSaving(false);
    }
  }

  // =====================
  // UPDATE (Laravel-friendly: POST + _method=PUT)
  // =====================
  async function handleUpdate() {
    try {
      setError("");

      if (!applyAuthHeader()) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      if (!editingOrmawa) return;

      const id = getOrmawaID(editingOrmawa);
      if (!id) return setError("ID ormawa tidak ditemukan.");

      if (!name.trim()) return setError("Nama ormawa wajib diisi.");

      setSaving(true);

      const fd = new FormData();
      fd.append("_method", "PUT");
      fd.append("name", name.trim());
      fd.append("type_ormawa", type_ormawa);
      fd.append("category_ormawa", category_ormawa);
      fd.append("status_oprec", status_oprec);
      fd.append("description", description);
      if (photo) fd.append("photo", photo);

      await api.post(`/api/admin/ormawa/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchOrmawa();
      closeEdit();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Gagal mengupdate ormawa.");
    } finally {
      setSaving(false);
    }
  }

  // =====================
  // DELETE
  // =====================
  async function handleDelete() {
    try {
      setError("");

      if (!applyAuthHeader()) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      if (!deletingOrmawa) return;

      const id = getOrmawaID(deletingOrmawa);
      if (!id) return setError("ID ormawa tidak ditemukan.");

      setSaving(true);

      await api.delete(`/api/admin/ormawa/${id}`);

      await fetchOrmawa();
      closeDelete();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Gagal menghapus ormawa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8EDE9]">
      {/* NAVBAR */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between">
          <div className="flex items-center gap-4">
            <Image src="/Logo.png" alt="SIORMA" width={48} height={48} />
            <div>
              <p className="font-semibold">Siorma</p>
              <p className="text-sm text-gray-500">
                Sistem Organisasi Mahasiswa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="bg-[#A63E35] text-white px-4 py-2 rounded-xl"
          >
            + Tambah Ormawa
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 mt-6 pb-20">
        <input
          placeholder="Cari ormawa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl border bg-white"
        />

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {isLoading && <p className="text-gray-600">Memuat...</p>}

        {!isLoading && (
          <div className="bg-white rounded-2xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr className="text-left">
                    <th className="p-4 w-[18%]">Nama</th>
                    <th className="p-4 w-[12%]">Tipe</th>
                    <th className="p-4 w-[14%]">Kategori</th>
                    <th className="p-4 w-[14%]">Status Oprec</th>
                    <th className="p-4">Deskripsi</th>
                    <th className="p-4 w-[16%] text-right">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td className="p-4 text-gray-500" colSpan={6}>
                        Tidak ada ormawa yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((o) => {
                      const id = getOrmawaID(o);
                      return (
                        <tr key={id} className="border-t align-top">
                          <td className="p-4 font-medium text-gray-900">
                            {o?.name ?? "-"}
                          </td>
                          <td className="p-4 text-gray-700">
                            {o?.type_ormawa ?? "-"}
                          </td>
                          <td className="p-4 text-gray-700">
                            {o?.category_ormawa ?? "-"}
                          </td>
                          <td className="p-4">
                            <span
                              className={[
                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                (o?.status_oprec || "").toUpperCase() === "BUKA"
                                  ? "bg-green-100 text-green-700"
                                  : (o?.status_oprec || "").toUpperCase() ===
                                    "SEGERA_DITUTUP"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700",
                              ].join(" ")}
                            >
                              {(o?.status_oprec || "-").toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4 text-gray-700">
                            <p className="line-clamp-3">
                              {o?.description ?? "-"}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(o)}
                                className="px-3 py-1.5 rounded-lg bg-[#A63E35] text-white hover:opacity-90"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => openDelete(o)}
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <p className="text-lg font-semibold mb-1">Tambah Ormawa</p>
            <p className="text-sm text-gray-500 mb-4">
              Lengkapi informasi ormawa dengan benar.
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border rounded-lg px-3 py-2 mb-3">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nama Ormawa</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                  placeholder="Masukkan nama ormawa"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Foto Ormawa</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="w-full mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Tipe</label>
                  <select
                    value={type_ormawa}
                    onChange={(e) => setTypeOrmawa(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border"
                  >
                    <option value="Organisasi">Organisasi</option>
                    <option value="LAB">LAB</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Kategori</label>
                  <select
                    value={category_ormawa}
                    onChange={(e) => setCategoryOrmawa(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border"
                  >
                    <option value="Teknologi">Teknologi</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Seni & Budaya">Seni & Budaya</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Olahraga">Olahraga</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status Oprec</label>
                <select
                  value={status_oprec}
                  onChange={(e) => setStatusOprec(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                >
                  <option value="BUKA">BUKA</option>
                  <option value="SEGERA_DITUTUP">SEGERA_DITUTUP</option>
                  <option value="TUTUP">TUTUP</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                  rows={4}
                  placeholder="Deskripsi singkat..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={closeAdd}
                className="px-4 py-2 border rounded-lg"
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreate}
                className="px-4 py-2 bg-[#A63E35] text-white rounded-lg"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <p className="text-lg font-semibold mb-1">Edit Ormawa</p>
            <p className="text-sm text-gray-500 mb-4">
              Perbarui data ormawa. (Foto opsional, isi jika ingin mengganti)
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border rounded-lg px-3 py-2 mb-3">
                {error}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nama Ormawa</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                  placeholder="Masukkan nama ormawa"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Foto Ormawa</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  className="w-full mt-1"
                />
                {editingOrmawa?.photo_path && (
                  <p className="text-xs text-gray-500 mt-1">
                    Foto saat ini tersimpan. Pilih file baru untuk mengganti.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Tipe</label>
                  <select
                    value={type_ormawa}
                    onChange={(e) => setTypeOrmawa(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border"
                  >
                    <option value="Organisasi">Organisasi</option>
                    <option value="LAB">LAB</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Kategori</label>
                  <select
                    value={category_ormawa}
                    onChange={(e) => setCategoryOrmawa(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg border"
                  >
                    <option value="Teknologi">Teknologi</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Seni & Budaya">Seni & Budaya</option>
                    <option value="Akademik">Akademik</option>
                    <option value="Olahraga">Olahraga</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status Oprec</label>
                <select
                  value={status_oprec}
                  onChange={(e) => setStatusOprec(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                >
                  <option value="BUKA">BUKA</option>
                  <option value="SEGERA_DITUTUP">SEGERA_DITUTUP</option>
                  <option value="TUTUP">TUTUP</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border"
                  rows={4}
                  placeholder="Deskripsi singkat..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={closeEdit}
                className="px-4 py-2 border rounded-lg"
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="px-4 py-2 bg-[#A63E35] text-white rounded-lg"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <p className="mb-4">
              Hapus ormawa <strong>{deletingOrmawa?.name}</strong>?
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border rounded-lg px-3 py-2 mb-3">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDelete}
                className="px-4 py-2 border rounded-lg"
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
                disabled={saving}
              >
                {saving ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
