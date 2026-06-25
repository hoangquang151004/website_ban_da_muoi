import AdminSidebar from "@/components/admin/Sidebar";
import Chatbot from "@/components/shop/Chatbot";
import AuthGuard from "@/components/ui/AuthGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="admin">
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">{children}</div>
      </div>
      <Chatbot />
    </AuthGuard>
  );
}
