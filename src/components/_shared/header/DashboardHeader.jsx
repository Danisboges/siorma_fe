"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import CustomBadge from "../badge/CustomBadge";
import api from "@/lib/api";

export function DashboardHeader({ title }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await api.get("/api/me");
        const data = res.data?.data || res.data;

        setUser(data);
        setRole(data?.role);
      } catch (err) {
        console.error("Gagal memuat user:", err);
      }
    }

    fetchUser();
  }, []);

  return (
    <div className="sticky top-0 z-30 w-full border-b bg-[#E11B22] lg:px-6 lg:py-4 md:px-5 py-3.5 px-3">
      <div className="flex items-center space-x-2">
        <div className="flex items-center gap-4 md:hidden">
          <SidebarTrigger />
        </div>
        <div className="flex flex-1 items-start justify-between">
          <div className="space-y-1">

            {/* Judul Halaman */}
            <h1 className="font-bold lg:text-2xl md:text-xl text-lg text-white">
              {title}
            </h1>

            {/* User Info */}
            {user && (
              <div className="flex items-center md:gap-3 gap-1">
                <h3 className="md:text-base text-sm font-semibold text-white">
                  👋 Halo, {user.fullname || user.name}!
                </h3>

                {role && (
                  <CustomBadge
                    type="info"
                    rounded="full"
                    weight="semibold"
                    className="md:block hidden"
                  >
                    <p className="capitalize">{role}</p>
                  </CustomBadge>
                )}
              </div>
            )}

            {!user && (
              <p className="text-white text-sm">Memuat user...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
