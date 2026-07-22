"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { getAdminLandingPath } from "@/utils/adminAccess";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function checkLogin() {
      try {
        const res = await fetch("/api/v1/admin/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();

        if (!ignore && data?.success && data?.admin) {
          router.replace(getAdminLandingPath(data.admin.role));
          return;
        }
      } catch (e) {
        console.log(e);
      }

      if (!ignore) {
        setLoading(false);
      }
    }

    checkLogin();

    return () => {
      ignore = true;
    };
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please fill all fields.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/admin/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      router.replace(getAdminLandingPath(data.admin?.role));
      router.refresh();
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking login...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-3xl font-bold">
            Welcome Back
          </h1>

          <p className="text-gray-600">
            Sign in to your admin account
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 border border-red-300 p-3 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="mb-4">
            <label>Email</label>

            <div className="relative">

              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400"/>

              <input
                type="email"
                required
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                className="w-full border rounded-lg pl-10 py-3"
              />

            </div>
          </div>

          <div className="mb-6">
            <label>Password</label>

            <div className="relative">

              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400"/>

              <input
                type={showPassword ? "text":"password"}
                required
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                className="w-full border rounded-lg pl-10 pr-10 py-3"
              />

              <button
                type="button"
                onClick={()=>setShowPassword(!showPassword)}
                className="absolute right-3 top-3"
              >
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>

            </div>
          </div>

          <button
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white rounded-lg py-3"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
}