import { Outlet } from "react-router";
import { DormitoryProvider } from "./DormitoryProvider";
import DashboardLayout from "@/components/layout/DashboardLayout"; // cheol

export default function Root() {
  return (
    <DashboardLayout> {/* cheol */}
      <DormitoryProvider>
        <div className="dormitory-app"> {/* cheol */}
          <Outlet />
        </div>
      </DormitoryProvider>
    </DashboardLayout>
  );
}
