
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else {
        navigate("/");
      }
    }
  }, [user, loading, navigate]);

  return null;
};

export default Index;
