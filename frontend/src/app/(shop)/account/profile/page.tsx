"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/store/authStore";

type PasswordVisibility = {
  current: boolean;
  new: boolean;
  confirm: boolean;
};

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [addressForm, setAddressForm] = useState({
    address: "",
    ward: "",
    district: "",
    city: "",
    postal_code: "",
    address_note: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState<PasswordVisibility>({
    current: false,
    new: false,
    confirm: false,
  });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
    authService
      .getMe()
      .then((freshUser) => {
        updateUser(freshUser);
        setProfileForm({
          full_name: freshUser.name ?? "",
          phone: freshUser.phone ?? "",
          date_of_birth: freshUser.date_of_birth ?? "",
          gender: freshUser.gender ?? "",
        });
        setAddressForm({
          address: freshUser.address ?? "",
          ward: freshUser.ward ?? "",
          district: freshUser.district ?? "",
          city: freshUser.city ?? "",
          postal_code: freshUser.postal_code ?? "",
          address_note: freshUser.address_note ?? "",
        });
      })
      .catch(() => {
        if (user) {
          setProfileForm({
            full_name: user.name ?? "",
            phone: user.phone ?? "",
            date_of_birth: user.date_of_birth ?? "",
            gender: user.gender ?? "",
          });
          setAddressForm({
            address: user.address ?? "",
            ward: user.ward ?? "",
            district: user.district ?? "",
            city: user.city ?? "",
            postal_code: user.postal_code ?? "",
            address_note: user.address_note ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await authService.updateProfile({
        full_name: profileForm.full_name,
        phone: profileForm.phone || undefined,
        date_of_birth: profileForm.date_of_birth || null,
        gender: (profileForm.gender as "male" | "female" | "other") || null,
      });
      updateUser(updated);
      toast.success("Cập nhật thông tin thành công!");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail ?? "Cập nhật thất bại");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      const updated = await authService.updateProfile({
        address: addressForm.address || undefined,
        ward: addressForm.ward || undefined,
        district: addressForm.district || undefined,
        city: addressForm.city || undefined,
        postal_code: addressForm.postal_code || undefined,
        address_note: addressForm.address_note || undefined,
      });
      updateUser(updated);
      toast.success("Lưu địa chỉ thành công!");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail ?? "Lưu địa chỉ thất bại");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current_password || !passwordForm.new_password) {
      toast.error("Vui lòng điền đầy đủ mật khẩu");
      return;
    }
    if (passwordForm.new_password.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      toast.success("Đổi mật khẩu thành công!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const msg = err?.response?.data?.detail ?? "Đổi mật khẩu thất bại";
      toast.error(
        msg === "current_password is incorrect"
          ? "Mật khẩu hiện tại không đúng"
          : msg,
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const formatMemberSince = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm py-2.5 px-3 bg-slate-50 outline-none transition";

  if (!mounted) return null;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 w-full">
      {/* Profile Header */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="size-32 md:size-40 rounded-full border-4 border-primary/10 p-1 shrink-0">
              <img
                alt="Avatar người dùng"
                className="w-full h-full rounded-full object-cover"
                src={
                  user?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? "U")}&background=E07B39&color=fff&size=160`
                }
              />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            {loading ? (
              <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg mb-2" />
            ) : (
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
                {user?.name ?? "—"}
              </h2>
            )}
            <p className="text-slate-500 flex items-center justify-center md:justify-start gap-2">
              <span className="material-symbols-outlined text-[18px]">
                calendar_today
              </span>
              Thành viên từ:{" "}
              {loading ? "..." : formatMemberSince(user?.createdAt)}
            </p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                {user?.role === "admin" ? "Admin" : "Thành viên"}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
                Đã xác minh
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Thông tin cá nhân */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary">
              person
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              Thông tin cá nhân
            </h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Họ và tên
              </label>
              <input
                className={inputClass}
                type="text"
                value={profileForm.full_name}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, full_name: e.target.value }))
                }
                placeholder="Nhập họ và tên"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Email
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 text-sm py-2.5 px-3 bg-slate-100 text-slate-500 cursor-not-allowed outline-none"
                type="email"
                value={user?.email ?? ""}
                readOnly
              />
              <p className="text-xs text-slate-400">Email không thể thay đổi</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Số điện thoại
              </label>
              <input
                className={inputClass}
                type="tel"
                value={profileForm.phone}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="VD: 0901 234 567"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Ngày sinh
                </label>
                <input
                  className={inputClass}
                  type="date"
                  value={profileForm.date_of_birth}
                  onChange={(e) =>
                    setProfileForm((p) => ({
                      ...p,
                      date_of_birth: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Giới tính
                </label>
                <select
                  className={inputClass}
                  value={profileForm.gender}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, gender: e.target.value }))
                  }
                >
                  <option value="">-- Chọn giới tính --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
            <div className="pt-4">
              <button
                className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-shadow shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Lưu thay đổi
              </button>
            </div>
          </div>
        </section>

        {/* Bảo mật */}
        <div className="space-y-8">
          <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">
                lock
              </span>
              <h3 className="text-lg font-bold text-slate-900">Đổi mật khẩu</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-10`}
                    placeholder="••••••••"
                    type={passwordVisible.current ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        current_password: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() =>
                      setPasswordVisible((v) => ({ ...v, current: !v.current }))
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {passwordVisible.current
                        ? "visibility_off"
                        : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-10`}
                    placeholder="••••••••"
                    type={passwordVisible.new ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        new_password: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() =>
                      setPasswordVisible((v) => ({ ...v, new: !v.new }))
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {passwordVisible.new ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    className={`${inputClass} pr-10`}
                    placeholder="••••••••"
                    type={passwordVisible.confirm ? "text" : "password"}
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm((p) => ({
                        ...p,
                        confirm_password: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() =>
                      setPasswordVisible((v) => ({ ...v, confirm: !v.confirm }))
                    }
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {passwordVisible.confirm
                        ? "visibility_off"
                        : "visibility"}
                    </span>
                  </button>
                </div>
                {passwordForm.confirm_password &&
                  passwordForm.new_password !==
                    passwordForm.confirm_password && (
                    <p className="text-xs text-red-500">
                      Mật khẩu xác nhận không khớp
                    </p>
                  )}
              </div>
              <div className="pt-4">
                <button
                  className="w-full border-2 border-primary/20 text-primary font-bold py-2.5 rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  type="button"
                  onClick={handleChangePassword}
                  disabled={savingPassword}
                >
                  {savingPassword && (
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  Cập nhật mật khẩu
                </button>
              </div>
            </div>
          </section>

          {/* 2FA */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">
                  security
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Bảo mật 2 lớp (2FA)
                </h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Thêm một lớp bảo mật cho tài khoản của bạn bằng cách yêu cầu mã
              xác thực từ ứng dụng di động khi đăng nhập.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-lg flex items-center gap-3">
              <span className="material-symbols-outlined text-green-500">
                check_circle
              </span>
              <span className="text-xs font-medium text-slate-700">
                Đang hoạt động: Google Authenticator
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* Địa chỉ giao hàng */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary">
            location_on
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            Địa chỉ giao hàng
          </h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-600">
              Địa chỉ cụ thể (số nhà, tên đường)
            </label>
            <input
              className={inputClass}
              type="text"
              placeholder="VD: 123 Đường Láng"
              value={addressForm.address}
              onChange={(e) =>
                setAddressForm((a) => ({ ...a, address: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Phường / Xã
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="VD: Phường Láng Thượng"
                value={addressForm.ward}
                onChange={(e) =>
                  setAddressForm((a) => ({ ...a, ward: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Quận / Huyện
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="VD: Quận Đống Đa"
                value={addressForm.district}
                onChange={(e) =>
                  setAddressForm((a) => ({ ...a, district: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Tỉnh / Thành phố
              </label>
              <select
                className={inputClass}
                value={addressForm.city}
                onChange={(e) =>
                  setAddressForm((a) => ({ ...a, city: e.target.value }))
                }
              >
                <option value="">-- Chọn tỉnh / thành phố --</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Hải Phòng">Hải Phòng</option>
                <option value="Cần Thơ">Cần Thơ</option>
                <option value="An Giang">An Giang</option>
                <option value="Bình Dương">Bình Dương</option>
                <option value="Đồng Nai">Đồng Nai</option>
                <option value="Khánh Hòa">Khánh Hòa</option>
                <option value="Khác">Tỉnh / Thành phố khác</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-600">
                Mã bưu chính
              </label>
              <input
                className={inputClass}
                type="text"
                placeholder="VD: 100000"
                maxLength={6}
                value={addressForm.postal_code}
                onChange={(e) =>
                  setAddressForm((a) => ({ ...a, postal_code: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-600">
              Ghi chú địa chỉ
            </label>
            <textarea
              className={`${inputClass} resize-none`}
              placeholder="VD: Giao hàng giờ hành chính, gọi trước khi đến..."
              rows={3}
              value={addressForm.address_note}
              onChange={(e) =>
                setAddressForm((a) => ({ ...a, address_note: e.target.value }))
              }
            />
          </div>
          <div className="pt-4">
            <button
              className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary/90 transition-shadow shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              type="button"
              onClick={handleSaveAddress}
              disabled={savingAddress}
            >
              {savingAddress && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Lưu địa chỉ
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
