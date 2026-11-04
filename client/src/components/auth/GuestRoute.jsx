
import { Navigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";

const GuestRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  return isAuthenticated
    ? <Navigate to="/" replace />
    : children;
};

export default GuestRoute;
