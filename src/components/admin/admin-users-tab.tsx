'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Search,
  Check,
  X,
  Power,
  KeyRound,
  Trash2,
  AlertTriangle,
  UserCheck,
  UserX,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface AdminUserItem {
  id: string;
  username: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersTabProps {
  currentAdminEmail?: string;
  onNotify: (msg: string) => void;
}

export function AdminUsersTab({ currentAdminEmail, onNotify }: AdminUsersTabProps) {
  const [admins, setAdmins] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'admin'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'superadmin'>('admin');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Edit / Reset Password Modal State
  const [editingAdmin, setEditingAdmin] = useState<AdminUserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Delete State
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all admins
  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/users');
      if (!res.ok) throw new Error('Gagal memuat data administrator');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotify(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Toggle active/inactive status
  const handleToggleStatus = async (admin: AdminUserItem) => {
    const newStatus = !admin.isActive;
    const actionText = newStatus ? 'mengaktifkan' : 'menonaktifkan';

    if (
      !confirm(
        `Apakah Anda yakin ingin ${actionText} akun administrator "${admin.username}" (${admin.email})?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal mengubah status admin');
      }

      onNotify(
        newStatus
          ? `Akun ${admin.username} berhasil diaktifkan. Admin kini bisa login.`
          : `Akun ${admin.username} berhasil dinonaktifkan. Admin tidak bisa login.`
      );
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotify(`Gagal mengubah status: ${msg}`);
    }
  };

  // Submit new admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername || !formEmail || !formPassword) {
      onNotify('Username, email, dan password wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formUsername.trim(),
          name: formName.trim() || formUsername.trim(),
          email: formEmail.trim(),
          password: formPassword,
          role: formRole,
          isActive: formIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal menambahkan admin baru');
      }

      onNotify(`Admin "${data.admin.username}" berhasil ditambahkan.`);
      setIsCreateModalOpen(false);
      // Reset form
      setFormUsername('');
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('admin');
      setFormIsActive(true);
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotify(`Error: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !newPassword || newPassword.length < 6) {
      onNotify('Password baru minimal 6 karakter.');
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${editingAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal memperbarui kata sandi');
      }

      onNotify(`Kata sandi admin "${editingAdmin.username}" berhasil diperbarui.`);
      setEditingAdmin(null);
      setNewPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotify(`Error: ${msg}`);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Delete admin
  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${deletingAdmin.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal menghapus admin');
      }

      onNotify(`Admin "${deletingAdmin.username}" berhasil dihapus.`);
      setDeletingAdmin(null);
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotify(`Error: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered admins
  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      a.username.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.name && a.name.toLowerCase().includes(q));

    const matchRole =
      roleFilter === 'all' ||
      (roleFilter === 'superadmin' ? a.role === 'superadmin' : a.role !== 'superadmin');

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? a.isActive : !a.isActive);

    return matchQuery && matchRole && matchStatus;
  });

  const totalActive = admins.filter((a) => a.isActive).length;
  const totalInactive = admins.filter((a) => !a.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted">Total Admin</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mt-1">{admins.length}</p>
          <span className="text-[11px] text-foreground-muted">Terdaftar di database</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-status-success/30 bg-status-success/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-status-success font-medium">Admin Aktif</span>
            <UserCheck className="w-4 h-4 text-status-success" />
          </div>
          <p className="text-xl font-bold text-status-success mt-1">{totalActive}</p>
          <span className="text-[11px] text-status-success/80">Bisa login ke panel</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-status-error/30 bg-status-error/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-status-error font-medium">Non-Aktif</span>
            <UserX className="w-4 h-4 text-status-error" />
          </div>
          <p className="text-xl font-bold text-status-error mt-1">{totalInactive}</p>
          <span className="text-[11px] text-status-error/80">Akses login ditolak</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted">Super Admin</span>
            <ShieldAlert className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mt-1">
            {admins.filter((a) => a.role === 'superadmin').length}
          </p>
          <span className="text-[11px] text-foreground-muted">Akses penuh sistem</span>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="p-4 rounded-xl bg-surface border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari admin (username, nama, email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs bg-surface-raised border-border h-9"
            />
          </div>

          {/* Role Filter using Reusable Radix Select */}
          <div className="w-[140px]">
            <Select value={roleFilter} onValueChange={(val: string) => setRoleFilter(val as 'all' | 'superadmin' | 'admin')}>
              <SelectTrigger className="h-9 text-xs bg-surface-raised border-border">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter using Reusable Radix Select */}
          <div className="w-[150px]">
            <Select value={statusFilter} onValueChange={(val: string) => setStatusFilter(val as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="h-9 text-xs bg-surface-raised border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif (Bisa Login)</SelectItem>
                <SelectItem value="inactive">Non-Aktif (Ditolak)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdmins}
            disabled={isLoading}
            className="h-9 text-xs gap-1.5 border-border hover:bg-surface-hover"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-9 text-xs gap-1.5 font-medium shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Admin</span>
          </Button>
        </div>
      </div>

      {/* Admin Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
              <tr>
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status Login</th>
                <th className="py-3 px-4 hidden md:table-cell">Terdaftar Sejak</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-foreground-muted">
                    Memuat daftar akun administrator...
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-foreground-muted">
                    Tidak ada administrator yang cocok dengan filter atau kata kunci.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => {
                  const isCurrent = currentAdminEmail?.toLowerCase() === admin.email.toLowerCase();
                  return (
                    <tr
                      key={admin.id}
                      className="hover:bg-surface-hover/50 transition-colors group"
                    >
                      {/* Name & Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${
                              admin.isActive
                                ? 'bg-primary/10 text-primary ring-primary/20'
                                : 'bg-status-error/10 text-status-error ring-status-error/20'
                            }`}
                          >
                            {admin.name
                              ? admin.name.charAt(0).toUpperCase()
                              : admin.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">
                                {admin.name || admin.username}
                              </span>
                              {isCurrent && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 border-primary/30 text-primary bg-primary/5"
                                >
                                  Anda
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-foreground-muted">
                              @{admin.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-foreground-muted">
                        {admin.email}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {admin.role === 'superadmin' ? (
                          <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-medium">
                            Super Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal text-foreground-muted"
                          >
                            Admin
                          </Badge>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {admin.isActive ? (
                          <Badge className="bg-status-success/15 text-status-success border-status-success/30 text-[11px] font-medium inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                            Aktif (Bisa Login)
                          </Badge>
                        ) : (
                          <Badge className="bg-status-error/15 text-status-error border-status-error/30 text-[11px] font-medium inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
                            Non-Aktif (Ditolak)
                          </Badge>
                        )}
                      </td>

                      {/* Created date */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-[11px] text-foreground-muted">
                        {new Date(admin.createdAt).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active Switch/Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(admin)}
                            className={`h-7 px-2 text-[11px] gap-1 font-medium transition-colors ${
                              admin.isActive
                                ? 'text-status-warning hover:bg-status-warning/10 hover:text-status-warning'
                                : 'text-status-success hover:bg-status-success/10 hover:text-status-success'
                            }`}
                            title={
                              admin.isActive
                                ? 'Nonaktifkan akun admin ini'
                                : 'Aktifkan akun admin ini agar bisa login'
                            }
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {admin.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </span>
                          </Button>

                          {/* Reset Password Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAdmin(admin);
                              setNewPassword('');
                            }}
                            className="h-7 w-7 p-0 text-foreground-muted hover:text-foreground"
                            title="Ganti Kata Sandi"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingAdmin(admin)}
                            disabled={isCurrent}
                            className={`h-7 w-7 p-0 ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-foreground-muted'
                                : 'text-foreground-muted hover:text-status-error hover:bg-status-error/10'
                            }`}
                            title={
                              isCurrent
                                ? 'Tidak bisa menghapus akun Anda sendiri'
                                : 'Hapus Akun Administrator'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
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

      {/* MODAL: Tambah Admin Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-raised">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">
                  Tambah Administrator Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-4 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Username <span className="text-status-error">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="misal: admin_keuangan"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  required
                  className="text-xs bg-surface-raised border-border"
                />
                <span className="text-[11px] text-foreground-muted">
                  Digunakan untuk login (huruf kecil, tanpa spasi).
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Nama Lengkap</label>
                <Input
                  type="text"
                  placeholder="misal: Iqbal Administrator"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="text-xs bg-surface-raised border-border"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Alamat Email <span className="text-status-error">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="admin@asterra.store"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="text-xs bg-surface-raised border-border"
                />
                <span className="text-[11px] text-foreground-muted">
                  Bisa juga dipakai untuk login ke panel admin.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Kata Sandi <span className="text-status-error">*</span>
                </label>
                <Input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required
                  minLength={6}
                  className="text-xs bg-surface-raised border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Peran / Role</label>
                  <Select value={formRole} onValueChange={(val: string) => setFormRole(val as 'admin' | 'superadmin')}>
                    <SelectTrigger className="text-xs bg-surface-raised border-border h-9">
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin Standar</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Status Awal</label>
                  <Select
                    value={formIsActive ? 'active' : 'inactive'}
                    onValueChange={(val) => setFormIsActive(val === 'active')}
                  >
                    <SelectTrigger className="text-xs bg-surface-raised border-border h-9">
                      <SelectValue placeholder="Pilih Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif (Bisa Login)</SelectItem>
                      <SelectItem value="inactive">Non-Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs border-border"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs font-medium gap-1.5"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Admin</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ganti Kata Sandi */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-raised">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Ganti Kata Sandi</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-4 space-y-3.5">
              <p className="text-xs text-foreground-muted">
                Atur kata sandi baru untuk administrator{' '}
                <strong className="text-foreground">{editingAdmin.username}</strong> (
                {editingAdmin.email}).
              </p>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Kata Sandi Baru</label>
                <Input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="text-xs bg-surface-raised border-border"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingAdmin(null)}
                  className="text-xs border-border"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isResettingPassword}
                  className="text-xs font-medium gap-1.5"
                >
                  {isResettingPassword ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Perbarui Sandi</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Admin */}
      {deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-4 space-y-3">
              <div className="w-10 h-10 rounded-full bg-status-error/15 text-status-error flex items-center justify-center mx-auto">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-sm text-foreground">Hapus Administrator?</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun admin{' '}
                  <strong className="text-foreground">{deletingAdmin.username}</strong> (
                  {deletingAdmin.email})? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingAdmin(null)}
                  className="text-xs border-border"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAdmin}
                  disabled={isDeleting}
                  className="text-xs font-medium gap-1.5"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Ya, Hapus Admin</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
