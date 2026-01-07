"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X, LayoutGrid, UserRoundCog, Menu } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import api from "@/lib/api";

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { open, setOpen, toggleSidebar } = useSidebar();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [openSections, setOpenSections] = React.useState({
    management: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const closeAllSections = () => {
    setOpenSections({
      management: false,
    });
  };

  const handleSetOpen = (value) => {
    setOpen(value);
    if (!value) closeAllSections();
  };

  // ==========================
  // LOGOUT FUNCTION
  // ==========================
  const handleLogout = async () => {
    try {
      // Ambil token kalau ada (untuk attempt logout ke backend)
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // OPTIONAL: panggil backend logout kalau route tersedia
      // Jika route tidak ada / error, tetap lanjut logout FE.
      try {
        await api.post("/api/logout");
      } catch (_) {}

      // Hapus storage
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");

      // Hapus header axios
      delete api.defaults.headers.common["Authorization"];

      // Tutup sidebar mobile jika perlu
      if (isMobile) toggleSidebar();

      // Redirect ke login
      router.replace("/auth/login");
      router.refresh();
    } catch (err) {
      // fallback tetap bersih-bersih & redirect
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
      delete api.defaults.headers.common["Authorization"];

      router.replace("/auth/login");
      router.refresh();
    }
  };

  // ==========================
  // MENU
  // ==========================
  const sidebarMenus = [
    {
      type: "single",
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutGrid,
      isActive: pathname === "/dashboard",
    },
    {
      type: "collapsible",
      name: "Management",
      icon: UserRoundCog,
      section: "management",
      isOpen: openSections.management,
      isActive:
        pathname.startsWith("/dashboard/management") ||
        pathname.startsWith("/dashboard/registration"),
      items: [
        {
          name: "User",
          href: "/dashboard/management/user",
          isActive: pathname.startsWith("/dashboard/management/user"),
        },
        {
          name: "Ormawa",
          href: "/dashboard/management/organisasi",
          isActive: pathname.startsWith("/dashboard/management/organisasi"),
        },
        {
          name: "Post",
          href: "/dashboard/management/post",
          isActive: pathname.startsWith("/dashboard/management/post"),
        },
        {
          name: "List Pendaftar",
          href: "/dashboard/management/registration",
          isActive: pathname.startsWith("/dashboard/management/registration"),
        },
      ],
    },
    // {
    //   type: "single",
    //   name: "Home",
    //   href: "/homepage",
    //   icon: LayoutGrid,
    //   isActive: pathname === "/homepage",
    // },
  ];

  return (
    <Sidebar collapsible="icon" className={"!bg-white"}>
      <SidebarHeader className="pt-6 pb-3 bg-white">
        <div
          className={`flex items-center ${
            open ? "gap-2 px-3 justify-between" : "justify-center"
          } transition-all duration-300 ease-in-out`}
        >
          <div
            onClick={() => {
              if (isMobile) toggleSidebar();
              else handleSetOpen(!open);
            }}
            className={`flex items-center gap-2 ${!open && "cursor-pointer"}`}
          >
            {!open && <Menu className="h-6 w-6" />}

            {open && (
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="/assets/logos/logo-telkom-university-v.png"
                  alt="Tel-Or Logo"
                />
                <AvatarFallback>PB</AvatarFallback>
              </Avatar>
            )}

            {open && (
              <h2 className="md:text-base text-sm font-semibold">
                Siorma Backoffice
              </h2>
            )}
          </div>

          <X
            onClick={() => {
              if (isMobile) toggleSidebar();
              else handleSetOpen(!open);
            }}
            className={`cursor-pointer ${!open && "hidden"}`}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-2 w-full bg-white">
        <SidebarMenu>
          {sidebarMenus.map((menu) => (
            <React.Fragment key={menu.name}>
              {menu.type === "single" ? (
                <SidebarMenuItem className="mx-auto w-full">
                  <SidebarMenuButton
                    asChild
                    isActive={menu.isActive}
                    tooltip={menu.name}
                    onClick={() => router.push(menu.href)}
                    className={`mx-auto !py-5 cursor-pointer transition ${
                      menu.isActive
                        ? "bg-[#F5F5F5] border border-[#D6D6D6]"
                        : "bg-[#FCFCFC] hover:bg-[#F5F5F5]"
                    }`}
                  >
                    <div className="w-full flex justify-start items-center">
                      <menu.icon
                        className={`${
                          open ? "mr-1" : "mx-auto"
                        } md:size-5 size-4 transition-all duration-300 ease-in-out stroke-2`}
                      />
                      <p
                        className={`${
                          !open && "hidden"
                        } transition-all duration-300 ease-in-out text-sm font-medium`}
                      >
                        {menu.name}
                      </p>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : menu.type === "collapsible" ? (
                <SidebarMenuItem key={menu.name}>
                  <Collapsible
                    open={menu.isOpen}
                    onOpenChange={() => toggleSection(menu.section)}
                    className="w-full"
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        className={`w-full cursor-pointer mx-auto transition !py-5 ${
                          menu.isActive
                            ? "bg-[#F5F5F5] border border-[#D6D6D6]"
                            : "bg-[#FCFCFC] hover:bg-[#F5F5F5]"
                        } ${open ? "justify-between" : "justify-center"}`}
                        tooltip={menu.name}
                      >
                        <div className="flex items-center">
                          <menu.icon
                            className={`${
                              open ? "mr-2" : "mx-auto"
                            } md:size-5 size-4 transition-all duration-300 ease-in-out stroke-2`}
                          />
                          <p
                            className={`${
                              !open && "hidden"
                            } transition-all duration-300 ease-in-out text-sm font-medium`}
                          >
                            {menu.name}
                          </p>
                        </div>
                        {open && (
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-300 ease-in-out ${
                              menu.isOpen ? "rotate-180" : ""
                            }`}
                          />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent
                      className={`${
                        open ? "pl-6" : "pl-0"
                      } pt-2 transition-all duration-300 ease-in-out bg-[#FCFCFC] rounded-md`}
                    >
                      <SidebarMenu>
                        {menu.items.map((item) => (
                          <SidebarMenuItem
                            key={item.name}
                            className="mx-auto w-full"
                          >
                            <SidebarMenuButton
                              asChild
                              isActive={pathname === item.href}
                              tooltip={item.name}
                              onClick={() => router.push(item.href)}
                              className={`mx-auto cursor-pointer py-3 transition ${
                                item.isActive
                                  ? "bg-[#F5F5F5] border border-[#D6D6D6]"
                                  : "hover:bg-[#F5F5F5]"
                              }`}
                            >
                              <p
                                className={`${
                                  !open && "hidden"
                                } transition-all duration-300 ease-in-out font-medium text-xs`}
                              >
                                {item.name}
                              </p>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              ) : null}
            </React.Fragment>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3 bg-white">
        <Button
          type="button"
          onClick={handleLogout}
          variant="ghostDestructive"
          className={`w-full ${open ? "justify-center" : "justify-center"} py-3 cursor-pointer`}
          size="md"
        >
          <LogOut className={`${open ? "mr-2" : ""} size-5`} />
          {open && <p className="text-sm">Keluar Aplikasi</p>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}