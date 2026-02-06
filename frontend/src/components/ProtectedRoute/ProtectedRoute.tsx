import { Navigate, Outlet } from "react-router-dom";
import { getCookie } from "@/utils/cookies";

const ProtectedRoute = () => {
const token = getCookie("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
