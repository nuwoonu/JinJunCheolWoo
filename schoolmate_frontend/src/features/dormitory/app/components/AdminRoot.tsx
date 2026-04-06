import { Outlet } from "react-router";
import AdminLayout from "@/shared/components/layout/admin/AdminLayout";
import { DormitoryProvider } from "./DormitoryProvider";

export default function AdminRoot() {
  return (
    <AdminLayout>
      <DormitoryProvider>
        <div className="dormitory-app">
          <Outlet />
        </div>
      </DormitoryProvider>
    </AdminLayout>
  );
}
