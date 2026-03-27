import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BarChart2 } from "lucide-react";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#16181f] to-[#0e0f14]">
      <div className="w-full max-w-md bg-[#16181f] border border-[#2a2d3a] p-10 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-[#6c63ff]/20 rounded-2xl text-[#6c63ff]">
            <BarChart2 size={32} className="stroke-[2.5]" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-white mb-2 tracking-tight">Create Account</h1>
        <p className="text-center text-[#8a8fa8] mb-8">Join Talking BI to get started</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8a8fa8]">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0e0f14] border border-[#2a2d3a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#6c63ff] transition-all"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#8a8fa8]">Password</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0e0f14] border border-[#2a2d3a] text-white rounded-xl px-4 py-3 outline-none focus:border-[#6c63ff] transition-all"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="bg-[#ff5e5e]/10 border border-[#ff5e5e]/20 text-[#ff5e5e] text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-[#6c63ff] hover:bg-[#574fd6] text-white font-semibold py-3.5 rounded-xl transition-colors shadow-lg shadow-[#6c63ff]/20 disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-sm text-[#8a8fa8] mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-[#6c63ff] hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
