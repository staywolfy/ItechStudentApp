import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/store";
import Logo from "./Logo";
import Image from "./Image";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("https://studentapp.i-tech.net.in/api/v1/routes/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(loginSuccess(data));
        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="inset-0 h-screen w-screen flex flex-col md:flex-row">
      <div className="w-full md:w-[60%] flex flex-col items-center bg-gray-100 shadow-md h-full">
        <Logo />
        <div className="flex flex-col items-center justify-center w-full max-w-md mt-auto mb-auto px-4 sm:px-6">
          <h1 className="text-3xl text-black font-bold text-center mb-6 font-mono">
            Login
          </h1>
          <form className="w-full" onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-black font-mono mb-2">
                Username
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="text"
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-black font-mono mb-2">
                Password
              </label>
              <input
                className="w-full p-2 border border-gray-300 rounded-md"
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              className="w-full bg-blue-600 text-white py-2 rounded-md text-lg font-mono hover:bg-blue-700 transition-all"
              type="submit"
            >
              Login
            </button>
          </form>
        </div>
      </div>
      <Image />
    </div>
  );
}

export default Login;