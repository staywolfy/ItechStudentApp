import React from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/store";

function Logout({ setUser }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    fetch("http://studentapp.i-tech.net.in/api/v1/routes/logout", {
      method: "POST",
      credentials: "include",
    })
      .then(response => response.json())
      .then(() => {
        dispatch(logout());
        if (setUser) setUser(null);
        navigate("/login");
      })
      .catch(error => console.error("Logout failed:", error));
  };

  return (
    <button
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      onClick={handleLogout}
    >
      Logout
    </button>
  );
}

export default Logout;