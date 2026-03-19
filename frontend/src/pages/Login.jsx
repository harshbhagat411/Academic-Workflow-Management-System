import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  Paper,
} from "@mui/material";
import { Eye, EyeOff, Lock, User as UserIcon } from "lucide-react";
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
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: { xs: 4, sm: 5 },
          borderRadius: 4,
          width: "100%",
          maxWidth: 400,
          bgcolor: "background.paper",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            color="primary.main"
            gutterBottom
          >
            Academic Workflow
          </Typography>
          <Typography variant="h5" color="primary.main">
            Management System
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 3 }}
        >
          <TextField
            fullWidth
            label="Login ID"
            variant="outlined"
            value={formData.loginId}
            onChange={(e) =>
              setFormData({ ...formData, loginId: e.target.value })
            }
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <UserIcon size={20} className="text-gray-400" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            variant="outlined"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock size={20} className="text-gray-400" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -1 }}>
            <Typography
              variant="body2"
              color="primary.main"
              sx={{
                cursor: "pointer",
                fontWeight: "medium",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </Typography>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontSize: "1rem",
              fontWeight: "bold",
              textTransform: "none",
              mt: 1,
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
