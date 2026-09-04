import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
