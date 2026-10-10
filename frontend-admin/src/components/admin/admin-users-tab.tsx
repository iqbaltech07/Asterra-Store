'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faUserPlus,
  faArrowsRotate,
  faMagnifyingGlass,
  faCheck,
  faXmark,
  faPowerOff,
  faKey,
  faTrash,
  faTriangleExclamation,
  faUserCheck,
  faUserXmark,
  faPen,
  faUserGear,
  faUsers,
  faUserTie,
  faBriefcase,
} from '@fortawesome/free-solid-svg-icons';
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
  const [activeSegment, setActiveSegment] = useState<'all' | 'admin' | 'sales'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'superadmin' | 'admin' | 'sales'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'admin' | 'sales'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'superadmin' | 'sales'>('admin');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Edit Details Modal State
  const [editModalAdmin, setEditModalAdmin] = useState<AdminUserItem | null>(null);
  const [editFormName, setEditFormName] = useState('');
  const [editFormRole, setEditFormRole] = useState<'admin' | 'superadmin' | 'sales'>('admin');
  const [editFormIsActive, setEditFormIsActive] = useState<boolean>(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Reset Password Modal State
  const [editingAdmin, setEditingAdmin] = useState<AdminUserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Delete State
  const [deletingAdmin, setDeletingAdmin] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper to construct dual-layer admin auth headers (Token + Content-Type)
  const getAdminHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  // Fetch all admins
  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/admin/users', {
        headers: getAdminHeaders(),
        credentials: 'include',
      });
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
  }, [getAdminHeaders, onNotify]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Open Create Modal for specific type
  const openCreateModal = (type: 'admin' | 'sales') => {
    setCreateModalType(type);
    setFormRole(type === 'sales' ? 'sales' : 'admin');
    setFormUsername('');
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormIsActive(true);
    setIsCreateModalOpen(true);
  };

  // Toggle active/inactive status with instant feedback
  const handleToggleStatus = async (admin: AdminUserItem) => {
    const newStatus = !admin.isActive;
    try {
      const res = await fetch(`/api/v1/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal mengubah status akun');
      }

      onNotify(
        newStatus
          ? `Akun "${admin.username}" berhasil diaktifkan. Pengguna kini bisa login.`
          : `Akun "${admin.username}" dinonaktifkan. Pengguna tidak bisa login.`
      );
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotify(`Gagal mengubah status: ${msg}`);
    }
  };

  // Change user role (Super Admin vs Admin vs Sales)
  const handleChangeRole = async (
    admin: AdminUserItem,
    newRole: 'admin' | 'superadmin' | 'sales'
  ) => {
    if (admin.role === newRole) return;
    try {
      const res = await fetch(`/api/v1/admin/users/${admin.id}`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        credentials: 'include',
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal mengubah peran akun');
      }

      const roleLabels: Record<string, string> = {
        superadmin: 'Super Admin',
        admin: 'Admin',
        sales: 'Sales',
      };

      onNotify(
        `Peran akun "${admin.username}" berhasil diubah menjadi ${roleLabels[newRole] || newRole}.`
      );
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotify(`Gagal mengubah jenis peran: ${msg}`);
    }
  };

  // Submit full admin edits from modal
  const handleSaveEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalAdmin) return;

    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${editModalAdmin.id}`, {
        method: 'PATCH',
        headers: getAdminHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          name: editFormName.trim() || editModalAdmin.username,
          role: editFormRole,
          isActive: editFormIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal memperbarui data akun');
      }

      onNotify(`Data akun "${editModalAdmin.username}" berhasil diperbarui.`);
      setEditModalAdmin(null);
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotify(`Gagal memperbarui akun: ${msg}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Submit new admin or sales
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
        headers: getAdminHeaders(),
        credentials: 'include',
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
        throw new Error(data.error?.message || 'Gagal menambahkan akun baru');
      }

      const roleLabels: Record<string, string> = {
        superadmin: 'Super Admin',
        admin: 'Admin',
        sales: 'Sales',
      };

      onNotify(`Akun "${data.admin.username}" berhasil ditambahkan sebagai ${roleLabels[formRole] || formRole}.`);
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
        headers: getAdminHeaders(),
        credentials: 'include',
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal memperbarui kata sandi');
      }

      onNotify(`Kata sandi akun "${editingAdmin.username}" berhasil diperbarui.`);
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
        headers: getAdminHeaders(),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Gagal menghapus akun');
      }

      onNotify(`Akun "${deletingAdmin.username}" berhasil dihapus.`);
      setDeletingAdmin(null);
      fetchAdmins();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      onNotify(`Error: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter criteria logic
  const filterUser = (a: AdminUserItem) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      a.username.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.name && a.name.toLowerCase().includes(q));

    const matchRole =
      roleFilter === 'all' || a.role === roleFilter;

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? a.isActive : !a.isActive);

    return matchQuery && matchRole && matchStatus;
  };

  // Separate Admin/Superadmin from Sales
  const adminUsers = admins.filter((a) => a.role === 'superadmin' || a.role === 'admin');
  const salesUsers = admins.filter((a) => a.role === 'sales');

  const filteredAdminUsers = adminUsers.filter(filterUser);
  const filteredSalesUsers = salesUsers.filter(filterUser);

  const totalActive = admins.filter((a) => a.isActive).length;
  const totalInactive = admins.filter((a) => !a.isActive).length;

  // Render a specific table section (Admin Table or Sales Table)
  const renderUserTable = (
    userList: AdminUserItem[],
    tableType: 'admin' | 'sales',
    title: string,
    badgeText: string,
    subtitle: string,
    onAddClick: () => void
  ) => {
    const isSales = tableType === 'sales';

    return (
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-xs space-y-0">
        {/* Table Header Section */}
        <div className="p-4 border-b border-border bg-surface-raised flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div
              className={`p-2 rounded-lg shrink-0 ${
                isSales ? 'bg-status-success/15 text-status-success' : 'bg-primary/15 text-primary'
              }`}
            >
              <FontAwesomeIcon icon={isSales ? faUserTie : faShieldHalved} className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground tracking-tight">{title}</h3>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono font-semibold ${
                    isSales
                      ? 'border-status-success/30 text-status-success bg-status-success/5'
                      : 'border-primary/30 text-primary bg-primary/5'
                  }`}
                >
                  {badgeText}
                </Badge>
              </div>
              <p className="text-[11px] text-foreground-muted mt-0.5">{subtitle}</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onAddClick}
            className={`text-xs gap-1.5 font-medium shadow-xs shrink-0 ${
              isSales ? 'bg-status-success hover:bg-status-success/90 text-white' : ''
            }`}
          >
            <FontAwesomeIcon icon={faUserPlus} className="w-3.5 h-3.5" />
            <span>{isSales ? 'Tambah Akun Sales' : 'Tambah Admin'}</span>
          </Button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised/50 border-b border-border text-foreground-muted font-medium">
              <tr>
                <th className="py-3 px-4">{isSales ? 'Anggota Tim Sales' : 'Administrator'}</th>
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
                  <td colSpan={6} className="py-10 text-center text-foreground-muted">
                    Memuat data {isSales ? 'tim sales' : 'administrator'}...
                  </td>
                </tr>
              ) : userList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-foreground-muted">
                    Tidak ada {isSales ? 'akun sales' : 'administrator'} yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              ) : (
                userList.map((admin) => {
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
                              !admin.isActive
                                ? 'bg-status-error/10 text-status-error ring-status-error/20'
                                : isSales
                                ? 'bg-status-success/10 text-status-success ring-status-success/20'
                                : 'bg-primary/10 text-primary ring-primary/20'
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
                              {admin.role === 'sales' && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 border-status-success/30 text-status-success bg-status-success/5 font-mono"
                                >
                                  Sales
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-foreground-muted font-mono">
                              @{admin.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-foreground-muted">
                        {admin.email}
                      </td>

                      {/* Role Selector */}
                      <td className="py-3.5 px-4">
                        <div className="w-[130px]">
                          <Select
                            value={admin.role}
                            onValueChange={(val: string) =>
                              handleChangeRole(admin, val as 'admin' | 'superadmin' | 'sales')
                            }
                          >
                            <SelectTrigger className="h-7 text-[11px] bg-surface-raised border-border px-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="start">
                              <SelectItem value="superadmin" className="text-xs">
                                <span className="text-primary font-semibold">Super Admin</span>
                              </SelectItem>
                              <SelectItem value="admin" className="text-xs">
                                <span className="font-medium text-foreground">Admin</span>
                              </SelectItem>
                              <SelectItem value="sales" className="text-xs">
                                <span className="text-status-success font-semibold">Sales</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(admin)}
                          className="group/status focus:outline-none"
                          title="Klik untuk mengubah status aktif/non-aktif"
                        >
                          {admin.isActive ? (
                            <Badge className="bg-status-success/15 text-status-success border-status-success/30 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer hover:bg-status-success/25 transition-colors">
                              <span>Aktif (Bisa Login)</span>
                              <span className="text-[10px] opacity-60 group-hover/status:opacity-100">
                                ⇄
                              </span>
                            </Badge>
                          ) : (
                            <Badge className="bg-status-error/15 text-status-error border-status-error/30 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer hover:bg-status-error/25 transition-colors">
                              <span>Non-Aktif (Ditolak)</span>
                              <span className="text-[10px] opacity-60 group-hover/status:opacity-100">
                                ⇄
                              </span>
                            </Badge>
                          )}
                        </button>
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
                          {/* Edit Details Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditModalAdmin(admin);
                              setEditFormName(admin.name || '');
                              setEditFormRole((admin.role as 'admin' | 'superadmin' | 'sales') || 'admin');
                              setEditFormIsActive(admin.isActive);
                            }}
                            className="h-7 w-7 p-0 text-foreground-muted hover:text-foreground"
                            title="Edit Data Akun"
                          >
                            <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5" />
                          </Button>

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
                                ? 'Nonaktifkan akun ini'
                                : 'Aktifkan akun ini agar bisa login'
                            }
                          >
                            <FontAwesomeIcon icon={faPowerOff} className="w-3.5 h-3.5" />
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
                            <FontAwesomeIcon icon={faKey} className="w-3.5 h-3.5" />
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
                                : 'Hapus Akun Pengguna'
                            }
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
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
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted">Administrator</span>
            <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground mt-1">{adminUsers.length}</p>
          <span className="text-[11px] text-foreground-muted">Super Admin & Admin</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-status-success font-medium">Tim Sales</span>
            <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 text-status-success" />
          </div>
          <p className="text-xl font-bold text-status-success mt-1">{salesUsers.length}</p>
          <span className="text-[11px] text-foreground-muted">Portal Sales & Afiliasi</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-status-success/30 bg-status-success/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-status-success font-medium">Akun Aktif</span>
            <FontAwesomeIcon icon={faUserCheck} className="w-4 h-4 text-status-success" />
          </div>
          <p className="text-xl font-bold text-status-success mt-1">{totalActive}</p>
          <span className="text-[11px] text-status-success/80">Bisa login ke sistem</span>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-status-error/30 bg-status-error/5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-status-error font-medium">Non-Aktif</span>
            <FontAwesomeIcon icon={faUserXmark} className="w-4 h-4 text-status-error" />
          </div>
          <p className="text-xl font-bold text-status-error mt-1">{totalInactive}</p>
          <span className="text-[11px] text-status-error/80">Akses login ditolak</span>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="p-4 rounded-xl bg-surface border border-border space-y-3.5">
        {/* Segment Switcher (Semua / Administrator / Sales) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-surface-raised border border-border rounded-xl w-fit text-xs">
            <button
              type="button"
              onClick={() => setActiveSegment('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeSegment === 'all'
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <FontAwesomeIcon icon={faUsers} className="w-3.5 h-3.5" />
              <span>Semua Akun ({admins.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSegment('admin')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeSegment === 'admin'
                  ? 'bg-primary text-white shadow-xs font-semibold'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5" />
              <span>Administrator ({adminUsers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSegment('sales')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeSegment === 'sales'
                  ? 'bg-status-success text-white shadow-xs font-semibold'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <FontAwesomeIcon icon={faUserTie} className="w-3.5 h-3.5" />
              <span>Tim Sales ({salesUsers.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdmins}
              disabled={isLoading}
              className="h-8 text-xs gap-1.5 border-border hover:bg-surface-hover"
            >
              <FontAwesomeIcon icon={faArrowsRotate} className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1 border-t border-border/60">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px]">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari akun (username, nama, email)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs bg-surface-raised border-border h-8"
            />
          </div>

          {/* Role Filter */}
          <div className="w-[140px]">
            <Select value={roleFilter} onValueChange={(val: string) => setRoleFilter(val as 'all' | 'superadmin' | 'admin' | 'sales')}>
              <SelectTrigger className="h-8 text-xs bg-surface-raised border-border">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="all">Semua Role</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-[150px]">
            <Select value={statusFilter} onValueChange={(val: string) => setStatusFilter(val as 'all' | 'active' | 'inactive')}>
              <SelectTrigger className="h-8 text-xs bg-surface-raised border-border">
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
      </div>

      {/* SEPARATED TABLES */}
      <div className="space-y-6">
        {/* Table 1: Administrator & Super Admin */}
        {(activeSegment === 'all' || activeSegment === 'admin') &&
          renderUserTable(
            filteredAdminUsers,
            'admin',
            'Administrator & Super Admin',
            `${filteredAdminUsers.length} Admin`,
            'Akun pengelola internal dengan hak akses manajemen sistem dan operasional toko.',
            () => openCreateModal('admin')
          )}

        {/* Table 2: Tim Sales */}
        {(activeSegment === 'all' || activeSegment === 'sales') &&
          renderUserTable(
            filteredSalesUsers,
            'sales',
            'Akun Tim Sales',
            `${filteredSalesUsers.length} Sales`,
            'Akun login portal sales (@sales-*) untuk monitoring performa referral, omzet afiliasi, dan komisi.',
            () => openCreateModal('sales')
          )}
      </div>

      {/* MODAL: Edit Data Administrator */}
      {editModalAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-raised">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={editModalAdmin.role === 'sales' ? faUserTie : faUserGear}
                  className={`w-4 h-4 ${editModalAdmin.role === 'sales' ? 'text-status-success' : 'text-primary'}`}
                />
                <h3 className="font-semibold text-sm text-foreground">
                  Edit Data {editModalAdmin.role === 'sales' ? 'Akun Tim Sales' : 'Administrator'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalAdmin(null)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-md"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAdmin} className="p-4 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground-muted">Username</label>
                <Input
                  type="text"
                  value={`@${editModalAdmin.username}`}
                  disabled
                  className="text-xs bg-surface-raised/50 border-border text-foreground-muted cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground-muted">Alamat Email</label>
                <Input
                  type="email"
                  value={editModalAdmin.email}
                  disabled
                  className="text-xs bg-surface-raised/50 border-border text-foreground-muted cursor-not-allowed font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Nama Lengkap</label>
                <Input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={editFormName}
                  onChange={(e) => setEditFormName(e.target.value)}
                  className="text-xs bg-surface-raised border-border"
                />
              </div>

              {/* Peran / Hak Akses */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Peran / Hak Akses</label>
                <Select
                  value={editFormRole}
                  onValueChange={(val: string) => setEditFormRole(val as 'admin' | 'superadmin' | 'sales')}
                >
                  <SelectTrigger className="text-xs bg-surface-raised border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="superadmin">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-primary block">Super Admin</span>
                        <span className="text-[10px] text-foreground-muted block">
                          Akses penuh sistem, kelola produk, transaksi, dan akun admin lain
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="space-y-0.5">
                        <span className="font-semibold block">Admin</span>
                        <span className="text-[10px] text-foreground-muted block">
                          Kelola pesanan, verifikasi manual, dan monitoring katalog
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sales">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-status-success block">Sales</span>
                        <span className="text-[10px] text-foreground-muted block">
                          Akses portal sales (@sales-*), referral tracking, omzet afiliasi, dan komisi
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Akun Aktif / Non-Aktif */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Status Akun Login</label>
                <Select
                  value={editFormIsActive ? 'active' : 'inactive'}
                  onValueChange={(val: string) => setEditFormIsActive(val === 'active')}
                >
                  <SelectTrigger className="text-xs bg-surface-raised border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-status-success">Aktif (Bisa Login ke Admin)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-status-error">Non-Aktif (Akses Login Ditolak)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalAdmin(null)}
                  className="text-xs border-border"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSavingEdit}
                  className="text-xs font-medium gap-1.5"
                >
                  {isSavingEdit ? (
                    <FontAwesomeIcon icon={faArrowsRotate} className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Perubahan</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Admin Baru */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-raised">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={createModalType === 'sales' ? faUserTie : faUserPlus}
                  className={`w-4 h-4 ${createModalType === 'sales' ? 'text-status-success' : 'text-primary'}`}
                />
                <h3 className="font-semibold text-sm text-foreground">
                  {createModalType === 'sales' ? 'Tambah Akun Tim Sales Baru' : 'Tambah Administrator Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-md"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-4 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Username <span className="text-status-error">*</span>
                </label>
                <Input
                  type="text"
                  placeholder={createModalType === 'sales' ? 'misal: sales-budi atau budi' : 'misal: admin_keuangan'}
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  required
                  className="text-xs bg-surface-raised border-border"
                />
                <span className="text-[11px] text-foreground-muted">
                  {createModalType === 'sales'
                    ? 'ID login akun sales (bisa awalan sales- atau username unik).'
                    : 'Digunakan untuk login (huruf kecil, tanpa spasi).'}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Nama Lengkap</label>
                <Input
                  type="text"
                  placeholder={createModalType === 'sales' ? 'misal: Budi Santoso' : 'misal: Iqbal Administrator'}
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
                  placeholder={createModalType === 'sales' ? 'sales.budi@asterra.store' : 'admin@asterra.store'}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="text-xs bg-surface-raised border-border"
                />
                <span className="text-[11px] text-foreground-muted">
                  {createModalType === 'sales'
                    ? 'Email yang digunakan untuk login portal sales.'
                    : 'Bisa juga dipakai untuk login ke panel admin.'}
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
                  <Select
                    value={formRole}
                    onValueChange={(val: string) => setFormRole(val as 'admin' | 'superadmin' | 'sales')}
                  >
                    <SelectTrigger className="text-xs bg-surface-raised border-border h-9">
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin Standar</SelectItem>
                      <SelectItem value="superadmin">
                        <span className="text-primary font-medium">Super Admin</span>
                      </SelectItem>
                      <SelectItem value="sales">
                        <span className="text-status-success font-medium">Tim Sales</span>
                      </SelectItem>
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
                  className={`text-xs font-medium gap-1.5 ${
                    formRole === 'sales'
                      ? 'bg-status-success hover:bg-status-success/90 text-white'
                      : ''
                  }`}
                >
                  {isSubmitting ? (
                    <FontAwesomeIcon icon={faArrowsRotate} className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                  )}
                  <span>{formRole === 'sales' ? 'Simpan Akun Sales' : 'Simpan Admin'}</span>
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
                <FontAwesomeIcon icon={faKey} className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Ganti Kata Sandi</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-md"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
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
                    <FontAwesomeIcon icon={faArrowsRotate} className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
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
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-semibold text-sm text-foreground">
                  Hapus {deletingAdmin.role === 'sales' ? 'Akun Sales' : 'Administrator'}?
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun{' '}
                  <strong className="text-foreground">@{deletingAdmin.username}</strong> (
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
                    <FontAwesomeIcon icon={faArrowsRotate} className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                  )}
                  <span>Ya, Hapus {deletingAdmin.role === 'sales' ? 'Sales' : 'Admin'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
