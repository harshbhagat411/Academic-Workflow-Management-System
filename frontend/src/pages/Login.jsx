import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  EyeOff, 
  Lock, 
  User as UserIcon, 
  GraduationCap, 
  ShieldCheck, 
  Cpu, 
  Users,
  AlertCircle 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData,
      );
      // Security: Force Password Change Check (Disabled per user request)
      // if (res.data.forcePasswordChange) {
      //    navigate('/force-password-change');
      //    return;
      // }

      login(res.data);

      // Redirect with history replacement
      if (res.data.role === "Admin") {
        window.location.replace("/admin/dashboard");
      } else if (res.data.role === "Student") {
        window.location.replace("/student/dashboard");
      } else if (res.data.role === "Faculty") {
        window.location.replace("/faculty/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        .font-sans-custom {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-in-left {
          animation: slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Override Chrome/Safari input autofill backgrounds */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #0f172a !important;
          -webkit-box-shadow: 0 0 0px 1000px #ffffff inset !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
      `}</style>

      <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans-custom text-slate-800 antialiased overflow-x-hidden">
        {/* Left Section: Branding & Highlights (45% Width) */}
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-gradient-to-tr from-white via-blue-50/10 to-blue-50/30 border-r border-slate-100 relative overflow-hidden animate-slide-in-left">
          {/* Decorative Background Blobs */}
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-100/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -left-10 w-80 h-80 rounded-full bg-indigo-100/20 blur-3xl pointer-events-none" />

          {/* Logo Section */}
          <div className="flex items-center gap-3 z-10 font-sans-custom">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">AWMS</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">Academic Workflow Management</div>
            </div>
          </div>

          {/* Hero Content & Illustration */}
          <div className="my-auto py-8 z-10 flex flex-col justify-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight font-sans-custom">
              Empowering Education.<br />
              Streamlining <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Workflows</span>.
            </h1>
            <p className="mt-4 text-base text-slate-500 max-w-md leading-relaxed font-sans-custom">
              AWMS simplifies academic processes, enhances collaboration, and improves institutional efficiency.
            </p>

            {/* Custom Premium Educational SVG Illustration */}
            <svg viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto max-w-[390px] mx-auto my-6 drop-shadow-md pointer-events-none">
              <defs>
                <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
                <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.05"/>
                </filter>
              </defs>

              {/* Background decorative elements */}
              <circle cx="100" cy="80" r="40" fill="#e0f2fe" opacity="0.3" />
              <circle cx="420" cy="280" r="30" fill="#e0e7ff" opacity="0.4" />

              {/* Platform */}
              <ellipse cx="250" cy="270" rx="200" ry="20" fill="#f1f5f9" />
              <ellipse cx="250" cy="265" rx="180" ry="14" fill="#e2e8f0" />

              {/* Laptop Base */}
              <path d="M130 260 H370 L350 270 H150 Z" fill="#94a3b8" />
              <rect x="220" y="262" width="60" height="3" rx="1" fill="#cbd5e1" />

              {/* Laptop Screen */}
              <rect x="150" y="140" width="200" height="120" rx="8" fill="#cbd5e1" filter="url(#shadow)" />
              <rect x="158" y="148" width="184" height="104" rx="4" fill="#0f172a" />
              
              {/* Laptop Dashboard UI */}
              <rect x="168" y="158" width="50" height="8" rx="2" fill="#3b82f6" />
              <rect x="168" y="172" width="70" height="4" rx="1" fill="#475569" />
              <rect x="168" y="180" width="90" height="4" rx="1" fill="#334155" />
              <rect x="168" y="192" width="164" height="40" rx="3" fill="#1e293b" />
              <circle cx="188" cy="212" r="12" fill="url(#blueGrad)" />
              <rect x="210" y="206" width="60" height="4" rx="1" fill="#94a3b8" />
              <rect x="210" y="214" width="40" height="4" rx="1" fill="#475569" />

              {/* Stack of Academic Books (Left) */}
              <g filter="url(#shadow)">
                <path d="M60 220 H120 V235 H60 Z" fill="#6366f1" />
                <path d="M120 220 L125 224 V239 L120 235 Z" fill="#4f46e5" />
                <path d="M60 220 L65 224 H125 L120 220 Z" fill="#818cf8" />
                <rect x="65" y="225" width="50" height="3" fill="#ffffff" opacity="0.8" />

                <path d="M50 235 H130 V255 H50 Z" fill="#3b82f6" />
                <path d="M130 235 L135 239 V259 L130 255 Z" fill="#1d4ed8" />
                <path d="M50 235 L55 239 H135 L130 235 Z" fill="#60a5fa" />
                <rect x="55" y="242" width="65" height="4" fill="#ffffff" opacity="0.8" />
              </g>

              {/* Graduation Cap floating above Books */}
              <g filter="url(#shadow)">
                <path d="M90 155 L125 167 L90 179 L55 167 Z" fill="#1e1b4b" />
                <path d="M90 155 L125 167 L90 179 L55 167 Z" fill="#312e81" stroke="#4f46e5" strokeWidth="1" />
                <rect x="75" y="175" width="30" height="10" fill="#1e1b4b" />
                <path d="M75 185 C75 190 105 190 105 185" fill="#1e1b4b" />
                {/* Cap Tassel */}
                <path d="M90 167 L115 173 V185 L112 187 V185 Z" fill="#fbbf24" />
                <circle cx="90" cy="167" r="1.5" fill="#fbbf24" />
              </g>

              {/* Floating Workflow Checklist (Right) */}
              <g filter="url(#shadow)">
                <rect x="360" y="110" width="100" height="110" rx="8" fill="#ffffff" />
                <rect x="360" y="110" width="100" height="25" rx="8" fill="url(#indigoGrad)" />
                <rect x="395" y="105" width="30" height="8" rx="2" fill="#cbd5e1" />
                
                {/* Checklist items */}
                <circle cx="380" cy="155" r="5" fill="#10b981" />
                <path d="M377 155 L379 157 L383 153" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="395" y="152" width="50" height="6" rx="2" fill="#e2e8f0" />

                <circle cx="380" cy="175" r="5" fill="#10b981" />
                <path d="M377 175 L379 177 L383 173" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="395" y="172" width="50" height="6" rx="2" fill="#e2e8f0" />

                <circle cx="380" cy="195" r="5" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                <rect x="395" y="192" width="40" height="6" rx="2" fill="#f1f5f9" />
              </g>

              {/* Dotted Connection Lines */}
              <path d="M250 140 C 250 80, 380 90, 410 110" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" opacity="0.4" />
              <path d="M90 155 C 110 100, 200 90, 250 140" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" opacity="0.4" />

              {/* Floating nodes */}
              <circle cx="210" cy="80" r="15" fill="#dbeafe" />
              <path d="M205 80 H215 M210 75 V85" stroke="#1e40af" strokeWidth="2" />

              <circle cx="300" cy="70" r="18" fill="#e0e7ff" />
              <rect x="294" y="64" width="3" height="12" fill="#4f46e5" rx="0.5" />
              <rect x="299" y="60" width="3" height="16" fill="#4f46e5" rx="0.5" />
              <rect x="304" y="67" width="3" height="9" fill="#4f46e5" rx="0.5" />
            </svg>
          </div>

          {/* Feature Cards Grid (Bottom) */}
          <div className="grid grid-cols-3 gap-4 mt-auto z-10 font-sans-custom">
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Secure</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Protected academic data</p>
            </div>
            
            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform duration-300">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Efficient</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Streamlined workflows</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Collaborative</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Better communication</p>
            </div>
          </div>
        </div>

        {/* Right Section: Login Form (55% Width) */}
        <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden bg-slate-50 min-h-screen">
          {/* Subtle Blurred Circles */}
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-blue-200/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-indigo-200/20 blur-3xl pointer-events-none" />

          {/* Centered Login Card */}
          <div className="w-full max-w-[520px] bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/80 p-8 sm:p-12 z-10 animate-fade-in font-sans-custom">
            {/* Mobile Header (Hidden on Desktop) */}
            <div className="flex lg:hidden flex-col items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="text-center">
                <div className="font-extrabold text-lg text-slate-900 tracking-tight">AWMS</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Academic Workflow Management</div>
              </div>
            </div>

            {/* Main Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans-custom">Welcome Back!</h2>
              <p className="text-slate-400 text-sm mt-2">Sign in to continue to your account.</p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50/80 border border-red-100 text-red-700 flex items-start gap-3 text-sm animate-fade-in font-sans-custom">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <span className="font-medium leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Login ID Input */}
              <div className="space-y-2">
                <label htmlFor="loginId" className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans-custom">
                  Login ID
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    id="loginId"
                    value={formData.loginId}
                    onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                    placeholder="Enter your login ID"
                    className="w-full h-[56px] pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 transition-all duration-200 text-sm font-medium"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans-custom">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none font-sans-custom"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full h-[56px] pl-12 pr-12 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100/50 transition-all duration-200 text-sm font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-8 font-sans-custom text-base"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
