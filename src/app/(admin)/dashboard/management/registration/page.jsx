"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import api from "@/lib/api";

export default function AdminRegistrationsPage() {
  // DATA
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // UI FILTER
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | pending | approved | rejected

  // MODAL DELETE
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingRow, setDeletingRow] = useState(null);

  function getAuthHeaders() {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }

  async function fetchRegistrations() {
    try {
      setIsLoading(true);
      setError("");

      const headers = getAuthHeaders();
      if (!headers) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      // Opsional: backend Anda mendukung query status -> /admin/registrations?status=pending
      const url = statusFilter
        ? `/api/admin/registrations?status=${encodeURIComponent(statusFilter)}`
        : "/api/admin/registrations";

      const res = await api.get(url, { headers });

      // Sesuaikan extractor response (karena BaseApiController biasanya { success, message, data })
      const data = res.data?.data ?? res.data?.registrations ?? res.data ?? [];
      setRegistrations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data registrations.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // FILTER CLIENT-SIDE (search)
  const filtered = useMemo(() => {
    const t = (searchTerm || "").toLowerCase();
    return (registrations || []).filter((r) => {
      const fullName = (r?.full_name || "").toLowerCase();
      const nim = (r?.nim || "").toLowerCase();
      const email = (r?.email || "").toLowerCase();
      const org = (r?.organization || "").toLowerCase();
      const status = (r?.status || "").toLowerCase();

      return (
        fullName.includes(t) ||
        nim.includes(t) ||
        email.includes(t) ||
        org.includes(t) ||
        status.includes(t)
      );
    });
  }, [registrations, searchTerm]);

  // STATISTIK STATUS (dinamis)
  const stats = useMemo(() => {
    const total = filtered.length;

    const count = (s) =>
      filtered.filter((r) => (r?.status || "").toLowerCase() === s).length;

    return {
      total,
      pending: count("pending"),
      approved: count("approved"),
      rejected: count("rejected"),
    };
  }, [filtered]);

  function statusBadge(status) {
    const s = (status || "").toLowerCase();

    if (s === "approved") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Approved
        </span>
      );
    }

    if (s === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Rejected
        </span>
      );
    }

    // default pending
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
        Pending
      </span>
    );
  }

  // UPDATE STATUS (PATCH)
  async function updateStatus(id, newStatus) {
    try {
      setError("");
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      await api.patch(
        `/api/admin/registrations/${id}/status`,
        { status: newStatus },
        { headers }
      );

      await fetchRegistrations();
    } catch (err) {
      console.error(err);
      setError("Gagal mengubah status registration.");
    }
  }

  // =========================
  // CV: VIEW & DOWNLOAD (AUTH via Bearer -> harus pakai blob)
  // Endpoint:
  // - GET /api/admin/registrations/{id}/cv
  // - GET /api/admin/registrations/{id}/cv/download
  // =========================
  async function viewCv(id) {
    try {
      setError("");
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await api.get(`/api/admin/registrations/${id}/cv`, {
        headers,
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/pdf",
      });

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");

      // optional: revoke belakangan (biar tab sempat load)
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Gagal membuka CV.";
      setError(msg);
    }
  }

  async function downloadCv(id, fallbackName = "CV") {
    try {
      setError("");
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await api.get(`/api/admin/registrations/${id}/cv/download`, {
        headers,
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });

      // coba ambil filename dari header content-disposition kalau ada
      const cd = res.headers["content-disposition"];
      let filename = `${fallbackName}_${id}`;
      if (cd && typeof cd === "string") {
        const match =
          cd.match(/filename\*=UTF-8''([^;]+)/i) || cd.match(/filename="([^"]+)"/i);
        if (match?.[1]) filename = decodeURIComponent(match[1]);
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Gagal download CV.";
      setError(msg);
    }
  }

  // DELETE
  function openDelete(row) {
    setDeletingRow(row);
    setIsDeleteOpen(true);
  }

  async function handleDelete() {
    try {
      setError("");
      const headers = getAuthHeaders();
      if (!headers) return;
      if (!deletingRow?.id) return;

      await api.delete(`/api/admin/registrations/${deletingRow.id}`, { headers });
      setIsDeleteOpen(false);
      setDeletingRow(null);

      await fetchRegistrations();
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus registration.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-red-600 text-white px-8 py-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="bg-white/10 p-2 rounded-lg">
            <Image
              src="/Logo.png"
              alt="Logo SIORMA"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Manajemen Registrations</h2>
            <p className="text-red-100 text-sm">
              Kelola pendaftaran mahasiswa
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Search & Filter */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari full_name, nim, email, organisasi..."
                  className="w-full outline-none text-[#7e3c3a] placeholder-[#9b4c48] bg-transparent"
                />
              </div>

              <div className="w-full md:w-auto flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none bg-white"
                >
                  <option value="">Semua Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                <button
                  type="button"
                  onClick={fetchRegistrations}
                  className="px-4 py-3 rounded-lg bg-gray-900 text-white hover:bg-black"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span>
                Total: <strong>{stats.total}</strong>
              </span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>
                Approved:{" "}
                <strong className="text-green-600">{stats.approved}</strong>
              </span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>
                Pending:{" "}
                <strong className="text-yellow-600">{stats.pending}</strong>
              </span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>
                Rejected:{" "}
                <strong className="text-red-600">{stats.rejected}</strong>
              </span>
            </div>

            {error && <p className="mt-4 text-red-600">{error}</p>}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      NIM
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>

                    {/* ✅ NEW: CV COLUMN */}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      CV
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {isLoading && (
                    <tr>
                      <td
                        className="px-6 py-6 text-sm text-gray-600"
                        colSpan={10}
                      >
                        Memuat data...
                      </td>
                    </tr>
                  )}

                  {!isLoading && filtered.length === 0 && (
                    <tr>
                      <td
                        className="px-6 py-6 text-sm text-gray-600"
                        colSpan={10}
                      >
                        Data kosong.
                      </td>
                    </tr>
                  )}

                  {!isLoading &&
                    filtered.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {r.id}
                          </span>
                          <div className="text-xs text-gray-500">
                            user_id: {r.user_id} | post_id: {r.post_id}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {r.full_name}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {r.nim}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {r.email}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {r.phone}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-red-600">
                            {r.organization || "-"}
                          </span>
                        </td>

                        <td className="px-6 py-4 max-w-xs">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {r.reason || "-"}
                          </p>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {statusBadge(r.status)}
                        </td>

                        {/* ✅ NEW: CV ACTIONS */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {r?.cv_path ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => viewCv(r.id)}
                                className="px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                title="Lihat CV"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadCv(r.id, r.nim || "CV")}
                                className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-black"
                                title="Download CV"
                              >
                                Download
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* QUICK STATUS BUTTONS */}
                            <button
                              type="button"
                              onClick={() => updateStatus(r.id, "approved")}
                              className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700"
                              title="Set Approved"
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() => updateStatus(r.id, "rejected")}
                              className="px-3 py-2 text-xs font-semibold rounded-lg bg-yellow-600 text-white hover:bg-yellow-700"
                              title="Set Rejected"
                            >
                              Reject
                            </button>

                            <button
                              type="button"
                              onClick={() => openDelete(r)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRM */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-sm">
            <p className="mb-4">
              Hapus registration ID <strong>{deletingRow?.id}</strong>?
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
