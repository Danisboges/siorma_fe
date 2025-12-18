"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CardOrmawa from "@/components/ui/CardOrmawa";
import api from "@/lib/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function ListOrmawaPage() {
  // =====================
  // DATA
  // =====================
  const [ormawa, setOrmawa] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================
  // MODAL & FORM
  // =====================
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const [name, setName] = useState("");
  const [type_ormawa, setTypeOrmawa] = useState("Organisasi");
  const [category_ormawa, setCategoryOrmawa] = useState("Teknologi");
  const [status_oprec, setStatusOprec] = useState("BUKA");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);

  // =====================
  // FETCH DATA
  // =====================
  async function fetchOrmawa() {
    try {
      setIsLoading(true);
      const res = await api.get("/api/ormawa");
      setOrmawa(res.data?.data || []);
    } catch (err) {
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
    const t = searchTerm.toLowerCase();
    return ormawa.filter(
      (o) =>
        o.name?.toLowerCase().includes(t) ||
        o.type_ormawa?.toLowerCase().includes(t) ||
        o.category_ormawa?.toLowerCase().includes(t)
    );
  }, [ormawa, searchTerm]);

  // =====================
  // FORM HELPER
  // =====================
  function resetForm() {
    setName("");
    setTypeOrmawa("Organisasi");
    setCategoryOrmawa("Teknologi");
    setStatusOprec("BUKA");
    setDescription("");
    setPhoto(null);
  }

  function openAdd() {
    setError("");              // FIX: bersihkan error lama
    resetForm();
    setSelected(null);
    setIsEditing(false);
    setIsModalOpen(true);
  }

  function openEdit(item) {
    setError("");              // FIX: bersihkan error lama
    setSelected(item);
    setIsEditing(true);

    setName(item?.name || "");
    setTypeOrmawa(item?.type_ormawa || "Organisasi");
    setCategoryOrmawa(item?.category_ormawa || "Teknologi");
    setStatusOprec(item?.status_oprec || "BUKA");
    setDescription(item?.description || "");
    setPhoto(null);

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setIsEditing(false);       // FIX: reset mode edit
    setSelected(null);         // FIX: reset selected
    resetForm();
  }

  // =====================
  // CREATE / UPDATE
  // =====================
  async function handleSave(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Nama ormawa wajib diisi.");
      return;
    }

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("name", name);
      fd.append("type_ormawa", type_ormawa);
      fd.append("category_ormawa", category_ormawa);
      fd.append("status_oprec", status_oprec);
      fd.append("description", description);
      if (photo) fd.append("photo", photo);

      if (isEditing && selected) {
        const id = selected.id; // FIX: PK pakai id
        await api.post(`/api/admin/ormawa/${id}?_method=PUT`, fd);
      } else {
        await api.post("/api/admin/ormawa", fd);
      }

      await fetchOrmawa();
      closeModal();
    } catch (err) {
      // biar mudah debug kalau validasi backend
      console.log("SAVE ERR STATUS:", err?.response?.status);
      console.log("SAVE ERR DATA:", err?.response?.data);
      setError(
        err?.response?.data?.message || "Gagal menyimpan data ormawa."
      );
    } finally {
      setSaving(false);
    }
  }

  // =====================
  // DELETE
  // =====================
  async function handleDelete() {
    if (!selected) return;
    if (!confirm(`Hapus ormawa "${selected.name}"?`)) return;

    try {
      setSaving(true);
      setError("");

      const id = selected.id; // FIX: PK pakai id
      await api.delete(`/api/admin/ormawa/${id}`); // FIX: hapus 1x saja

      await fetchOrmawa();
      closeModal();
    } catch (err) {
      console.log("DEL ERR STATUS:", err?.response?.status);
      console.log("DEL ERR DATA:", err?.response?.data);
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

          <div className="flex gap-3">
            <button
              onClick={openAdd}
              className="bg-[#A63E35] text-white px-4 py-2 rounded-xl"
            >
              + Tambah Ormawa
            </button>
            <Link href="#">Keluar</Link>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        <input
          placeholder="Cari ormawa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mb-4 px-4 py-3 rounded-xl border"
        />

        {isLoading && <p>Memuat...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filtered.map((o) => (
            <div
              key={o.id} // FIX: key pakai id
              onClick={() => openEdit(o)}
              className="cursor-pointer"
            >
              <CardOrmawa
                title={o.name}
                tags={[o.type_ormawa, o.category_ormawa]}
                image={
                  o.photo_path
                    ? `${API_BASE}/storage/${o.photo_path}`
                    : "/placeholder.png"
                }
              />
            </div>
          ))}
        </div>
      </main>

      {/* ================= MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6 space-y-5"
          >
            <div>
              <h2 className="text-xl font-bold">
                {isEditing ? "Edit Ormawa" : "Tambah Ormawa"}
              </h2>
              <p className="text-sm text-gray-500">
                Lengkapi informasi ormawa dengan benar.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label className="text-sm font-semibold">Nama Ormawa</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-semibold">Foto Ormawa</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select
                value={type_ormawa}
                onChange={(e) => setTypeOrmawa(e.target.value)}
                className="px-4 py-2 border rounded-xl"
              >
                <option>Organisasi</option>
                <option>LAB</option>
              </select>

              <select
                value={category_ormawa}
                onChange={(e) => setCategoryOrmawa(e.target.value)}
                className="px-4 py-2 border rounded-xl"
              >
                <option>Teknologi</option>
                <option>Sosial</option>
                <option>Seni & Budaya</option>
                <option>Akademik</option>
                <option>Olahraga</option>
              </select>
            </div>

            <select
              value={status_oprec}
              onChange={(e) => setStatusOprec(e.target.value)}
              className="px-4 py-2 border rounded-xl"
            >
              <option>BUKA</option>
              <option>SEGERA_DITUTUP</option>
              <option>TUTUP</option>
            </select>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat..."
              className="w-full px-4 py-2 border rounded-xl min-h-[90px]"
            />

            <div className="flex justify-between items-center pt-4 border-t">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-red-600 font-semibold"
                  disabled={saving}
                >
                  Hapus
                </button>
              ) : (
                <span />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border rounded-xl"
                  disabled={saving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#A63E35] text-white rounded-xl"
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
