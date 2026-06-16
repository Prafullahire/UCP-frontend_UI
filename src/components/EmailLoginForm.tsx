// @ts-nocheck
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function EmailLoginForm() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOtpStep, setShowOtpStep] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [otp, setOtp] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value });
    };

    const loginHandler = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setIsSubmitting(true);
        
        // Trim inputs just in case there are accidental spaces
        const payload = {
            email: formData.email.trim(),
            password: formData.password
        };

        try {
            // Hardcoding preprod URL to ensure it doesn't accidentally hit the local backend
            const response = await axios.post(`https://preprod-unified-clientportal-wallet-api.xbees.in/api/v1/users/login-2fa/init`, payload);
            if (response?.data?.status === false) {
                setErrorMsg(response?.data?.message || "Invalid Email and Password");
                return;
            }
            setShowOtpStep(true);
        } catch (error) {
            setErrorMsg(error?.response?.data?.message || "Unable to initiate login.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const verifyOtpHandler = async (e) => {
        e?.preventDefault();
        if (!otp || otp.trim().length !== 6) {
            setErrorMsg("Please enter a valid 6-digit OTP.");
            return;
        }
        setErrorMsg("");
        setIsSubmitting(true);
        try {
            const response = await axios.post(
                `https://preprod-unified-clientportal-wallet-api.xbees.in/api/v1/users/login-2fa/verify`,
                {
                    email: formData.email.trim(),
                    otp: otp.trim(),
                }
            );

            const token = response?.data?.token;
            if (!token) {
                setErrorMsg(response?.data?.message || "OTP verification failed.");
                return;
            }

            if (response?.data?.kavachToken) {
                localStorage.setItem("kavachToken", response.data.kavachToken);
            }
            localStorage.setItem("token", token);
            // Save email/username/role to localstorage if needed so Topbar can pick it up
            localStorage.setItem("email", formData.email);
            
            navigate("/dashboard");
        } catch (error) {
            setErrorMsg(error?.response?.data?.message || "Invalid OTP.");
            if (error?.response?.data?.message?.toLowerCase().includes("locked")) {
                setShowOtpStep(false);
                setOtp("");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const forgotPasswordHandler = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        setSuccessMsg("");
        
        if (!formData.email.trim()) {
            setErrorMsg("Please enter your registered email address.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            // Replace with the exact backend endpoint if different
            const response = await axios.post(`https://preprod-unified-clientportal-wallet-api.xbees.in/api/v1/users/forgot-password`, {
                email: formData.email.trim()
            });
            
            setSuccessMsg(response?.data?.message || "Password reset instructions sent to your email.");
            // Optionally, reset state after a delay:
            // setTimeout(() => setIsForgotPassword(false), 3000);
        } catch (error) {
            setErrorMsg(error?.response?.data?.message || "Unable to process forgot password request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Forgot Password View ---
    if (isForgotPassword) {
        return (
            <div className="w-full">
                <form onSubmit={forgotPasswordHandler}>
                    <div style={{ marginBottom: "16px", textAlign: "left" }}>
                        <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#1A190F", margin: "0 0 8px 0" }}>Forgot Password</h4>
                        <p style={{ fontSize: "12px", color: "#667085", margin: 0 }}>Enter your email address and we'll send you instructions to reset your password.</p>
                    </div>

                    {errorMsg && <div style={{ color: "red", marginBottom: "10px", fontSize: "12px", textAlign: "left" }}>{errorMsg}</div>}
                    {successMsg && <div style={{ color: "green", marginBottom: "10px", fontSize: "12px", textAlign: "left" }}>{successMsg}</div>}

                    <div className="mb-3" style={{ textAlign: "left", marginBottom: "16px" }}>
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                            Email Id <span className="text-danger" style={{ color: "#E53E3E" }}>*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="enter your mail id"
                            value={formData.email}
                            onChange={handleInputChange}
                            style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box" }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn xb_button w-full" 
                        disabled={isSubmitting}
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "#FF6E00",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            cursor: "pointer",
                            marginTop: "8px",
                            opacity: isSubmitting ? 0.7 : 1
                        }}
                    >
                        {isSubmitting ? "Sending..." : "Reset Password"}
                    </button>
                    
                    <div style={{ textAlign: "center", marginTop: "16px" }}>
                        <button 
                            type="button" 
                            onClick={() => { setIsForgotPassword(false); setErrorMsg(""); setSuccessMsg(""); }}
                            style={{ background: "none", border: "none", color: "#667085", fontSize: "12px", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
                        >
                            Back to Login
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    // --- Standard Login View ---
    return (
        <div className="w-full">
            <form onSubmit={!showOtpStep ? loginHandler : verifyOtpHandler}>
                {errorMsg && <div style={{ color: "red", marginBottom: "10px", fontSize: "12px", textAlign: "left" }}>{errorMsg}</div>}
                
                {!showOtpStep ? (
                    <>
                        <div className="mb-3" style={{ textAlign: "left", marginBottom: "16px" }}>
                            <label className="form-label" style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                                Email Id <span className="text-danger" style={{ color: "#E53E3E" }}>*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                className="form-control"
                                placeholder="enter your mail id"
                                value={formData.email}
                                onChange={handleInputChange}
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box" }}
                            />
                        </div>

                        <div className="mb-3" style={{ textAlign: "left", marginBottom: "16px" }}>
                            <label className="form-label" style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                                Password <span className="text-danger" style={{ color: "#E53E3E" }}>*</span>
                            </label>

                            <div className="input-group" style={{ position: "relative" }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="form-control"
                                    placeholder="Enter Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box" }}
                                />
                                <span
                                    className="input-group-text cursor-pointer"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#6B6960" }}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </span>
                            </div>

                            <div className="text-end mt-2" style={{ textAlign: "right", marginTop: "8px" }}>
                                <button 
                                    type="button"
                                    onClick={() => { setIsForgotPassword(true); setErrorMsg(""); }}
                                    className="hreflink" 
                                    style={{ background: "none", border: "none", color: "#FF6E00", fontSize: "12px", textDecoration: "none", cursor: "pointer", padding: 0 }}
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="mb-3" style={{ textAlign: "left", marginBottom: "16px" }}>
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                            Enter OTP <span className="text-danger" style={{ color: "#E53E3E" }}>*</span>
                        </label>
                        <input
                            type="text"
                            maxLength={6}
                            className="form-control"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box", textAlign: "center", letterSpacing: "4px", fontSize: "18px" }}
                        />
                    </div>
                )}

                <button 
                    type="submit" 
                    className="btn xb_button w-full" 
                    disabled={isSubmitting}
                    style={{
                        width: "100%",
                        padding: "12px",
                        background: "#FF6E00",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        marginTop: "8px",
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? (showOtpStep ? "Verifying..." : "Logging in...") : (showOtpStep ? "Verify OTP" : "Login")}
                </button>
            </form>
        </div>
    );
}