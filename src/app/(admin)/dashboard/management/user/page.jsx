"use client";

import { useState, useEffect } from "react";

import AddButton from "@/components/_shared/AddButton";
import SearchBox from "@/components/_shared/SearchBox";
import { Pagination } from "@/components/ui/pagination";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ✅ IMPORTANT: sesuaikan import ini dengan export DashboardHeader kamu
// Jika DashboardHeader export default -> pakai: import DashboardHeader from ...
// Jika named export -> pakai: import { DashboardHeader } from ...
import { DashboardHeader } from "@/components/_shared/header/DashboardHeader";

import api from "@/lib/api";

// ROLE mengikuti backend
const ROLE = {
  ADMIN: "admin",
  USER: "user",
  BENDAHARA: "bendahara",
  SALES: "sales",
};

export default function UsersPage() {
  // DATA DARI BACKEND
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // FILTER / PAGINATION
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // STATE POPUP
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // STATE FORM POPUP USER
  const [formFullname, setFormFullname] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPasswordConfirmation, setFormPasswordConfirmation] =
    useState("");

  // ========================
  // FETCH USERS DARI BACKEND
  // ========================
  async function fetchUsers() {
    try {
      setIsLoading(true);
      setError("");

      const res = await api.get("/api/admin/users");
      const body = res.data;
      const payload = body.data || {};

      const apiUsers = payload.users || [];
      const apiRoles = payload.roles || [];

      const mappedUsers = apiUsers.map((u) => ({
        id: u.id,
        fullname: u.name,
        email: u.email,
        role: u.role,
      }));

      setUsers(mappedUsers);
      setRoles(apiRoles);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        setError("Akses hanya untuk admin.");
      } else if (status === 401) {
        setError("Sesi login berakhir. Silakan login ulang sebagai admin.");
      } else {
        setError("Gagal memuat data user dari server.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // ========================
  // FILTER & SEARCH
  // ========================
  useEffect(() => {
    if (!Array.isArray(users)) return;
    const term = searchTerm.toLowerCase();

    const filtered = users.filter(
      (user) =>
        user.fullname.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
    );

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, searchTerm]);

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;

  // ========================
  // POPULASI FORM SAAT POPUP DIBUKA
  // ========================
  useEffect(() => {
    if (!isUserDialogOpen) return;

    if (isEditing && selectedUser) {
      setFormFullname(selectedUser.fullname || "");
      setFormEmail(selectedUser.email || "");
      setFormRole(selectedUser.role || "");
      setFormPassword("");
      setFormPasswordConfirmation("");
    } else {
      setFormFullname("");
      setFormEmail("");
      setFormRole("");
      setFormPassword("");
      setFormPasswordConfirmation("");
    }
  }, [isUserDialogOpen, isEditing, selectedUser]);

  // ========================
  // ✅ FIX: OPEN EDIT
  // ========================
  function openEdit(user) {
    setSelectedUser(user);
    setIsEditing(true);
    setIsUserDialogOpen(true);
  }

  // ========================
  // ✅ FIX: OPEN DELETE
  // ========================
  function handleDelete(user) {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  }

  // ========================
  // SAVE (ADD / EDIT)
  // ========================
  async function handleSaveUser(userData) {
    try {
      setIsLoading(true);
      setError("");

      if (isEditing && selectedUser?.id) {
        // ✅ UPDATE USER
        await api.put(`/api/admin/users/${selectedUser.id}`, {
          name: userData.fullname,
          email: userData.email,
          role: userData.role, // kalau backend tidak mengizinkan ubah role, hapus baris ini
        });
      } else {
        // CREATE USER
        const payload = {
          name: userData.fullname,
          email: userData.email,
          role: userData.role,
        };

        if (userData.password) {
          payload.password = userData.password;
          payload.password_confirmation =
            userData.password_confirmation || userData.password;
        } else {
          payload.password = "password123";
          payload.password_confirmation = "password123";
        }

        await api.post("/api/admin/users", payload);
      }

      await fetchUsers();
    } catch (err) {
      const status = err.response?.status;
      if (status === 422) {
        setError("Validasi gagal. Mohon cek kembali data yang diinput.");
      } else if (status === 403) {
        setError("Akses hanya untuk admin.");
      } else {
        setError("Gagal menyimpan data user. Coba beberapa saat lagi.");
      }
    } finally {
      setIsUserDialogOpen(false);
      setSelectedUser(null);
      setIsEditing(false);
      setIsLoading(false);
    }
  }

  function handleSubmitUserForm(e) {
    e.preventDefault();

    handleSaveUser({
      fullname: formFullname,
      email: formEmail,
      role: formRole,
      password: formPassword,
      password_confirmation: formPasswordConfirmation,
    });
  }

  // ========================
  // ✅ DELETE USER (CONFIRM)
  // ========================
  async function handleConfirmDelete() {
    if (!selectedUser?.id) return;

    try {
      setIsLoading(true);
      setError("");

      await api.delete(`/api/admin/users/${selectedUser.id}`);
      await fetchUsers();
    } catch (err) {
      setError("Gagal menghapus user.");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      setIsLoading(false);
    }
  }

  // ========================
  // RENDER
  // ========================
  return (
    <>
      <DashboardHeader title="Manajemen User" />
      <main className="md:p-5 p-3 bg-[#f5e4e4] min-h-screen md:space-y-5 space-y-3">
        <Card className="w-full gap-3 bg-[#fbfbfb] border border-[#f3b5b5]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-[#3b1111]">
                  Kelola Data User
                </CardTitle>
                <CardDescription className="text-[#8c4b4b]">
                  Daftar user yang tersimpan
                </CardDescription>
                {error && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {error}
                  </p>
                )}
              </div>
              {/* <div className="flex items-center gap-2">
                <AddButton
                  onClick={() => {
                    setSelectedUser(null);
                    setIsEditing(false);
                    setIsUserDialogOpen(true);
                  }}
                >
                  Tambah
                </AddButton>
              </div> */}
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4">
              <SearchBox
                value={searchTerm}
                onChange={(value) => setSearchTerm(value)}
                placeholder="Search by name, email or role..."
                className="bg-[#f4aaaa] border-[#f19494] text-[#4b1a1a] placeholder:text-[#f8d1d1]"
              />
            </div>

            <div className="rounded-xl border border-[#f3b5b5] overflow-hidden bg-[#fbe1e1]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f7b5b5]">
                    <TableHead className="text-[#5b1a1a] font-semibold uppercase tracking-wide py-4">
                      Nama
                    </TableHead>
                    <TableHead className="text-[#5b1a1a] font-semibold uppercase tracking-wide py-4">
                      Email
                    </TableHead>
                    <TableHead className="text-[#5b1a1a] font-semibold uppercase tracking-wide py-4">
                      Role
                    </TableHead>
                    <TableHead className="text-right text-[#5b1a1a] font-semibold uppercase tracking-wide py-4">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-10 text-sm text-[#8c4b4b]"
                      >
                        Memuat data user...
                      </TableCell>
                    </TableRow>
                  )}

                  {!isLoading &&
                    currentUsers.map((u, index) => (
                      <TableRow
                        key={u.id}
                        className={`
                          transition
                          ${
                            index % 2 === 0
                              ? "bg-[#fce5e5]"
                              : "bg-[#fbe1e1]"
                          }
                          hover:bg-[#ffecec]
                        `}
                      >
                        <TableCell className="py-4 text-[#4b1a1a] font-medium">
                          {u.fullname}
                        </TableCell>

                        <TableCell className="py-4 text-[#4b1a1a]">
                          {u.email}
                        </TableCell>

                        <TableCell className="py-4">
                          <Badge
                            className={`rounded-full px-3 py-1 text-xs font-semibold text-white ${
                              u.role === ROLE.ADMIN
                                ? "bg-[#66c47b]"
                                : "bg-[#ffb347]"
                            }`}
                          >
                            {u.role.toUpperCase()}
                          </Badge>
                        </TableCell>

                        <TableCell className="py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-[#ffe7e7]"
                              >
                                <MoreHorizontal className="text-[#b63636]" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-[#ffe5e5] border-[#f3b5b5]"
                            >
                              <DropdownMenuItem onClick={() => openEdit(u)}>
                                <Pencil className="mr-2 h-4 w-4 text-[#b63636]" />
                                Edit
                              </DropdownMenuItem>

                              {u.role !== ROLE.ADMIN && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDelete(u)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}

                  {!isLoading && currentUsers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-10 text-center text-sm text-[#8c4b4b]"
                      >
                        Tidak ada user yang cocok dengan pencarian.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </CardContent>
        </Card>

        {/* =============== POPUP FORM USER (ADD + EDIT) =============== */}
        {isUserDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold mb-1">
                {isEditing ? "Edit User" : "Tambah User"}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {isEditing
                  ? "Perbarui data user berikut."
                  : "Isi data user baru di bawah ini."}
              </p>

              <form onSubmit={handleSubmitUserForm} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formFullname}
                    onChange={(e) => setFormFullname(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-lg"
                    // ✅ optional: kalau saat edit role tidak boleh diubah, aktifkan ini:
                    // disabled={isEditing}
                  >
                    <option value="">Pilih role</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {!isEditing && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Password (opsional)
                      </label>
                      <input
                        type="password"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Kosongkan untuk password default"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-1">
                        Konfirmasi Password
                      </label>
                      <input
                        type="password"
                        value={formPasswordConfirmation}
                        onChange={(e) =>
                          setFormPasswordConfirmation(e.target.value)
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Samakan dengan password"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsUserDialogOpen(false);
                      setSelectedUser(null);
                      setIsEditing(false);
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    {isEditing ? "Simpan Perubahan" : "Simpan"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =============== POPUP KONFIRMASI DELETE =============== */}
        {isDeleteDialogOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <h2 className="text-lg font-bold mb-2 text-red-700">
                Hapus User
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Apakah Anda yakin ingin menghapus user{" "}
                <span className="font-semibold">{selectedUser.fullname}</span>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedUser(null);
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirmDelete}
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
