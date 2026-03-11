import { Outlet } from "react-router";
import { DormitoryProvider } from "./DormitoryProvider";

export default function Root() {
  return (
    <DormitoryProvider>
      <Outlet />
    </DormitoryProvider>
  );
}
