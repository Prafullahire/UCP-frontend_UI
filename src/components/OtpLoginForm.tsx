// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function OtpLoginForm() {
    const navigate = useNavigate();
    const [mobileNumber, setMobileNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpStep, setShowOtpStep] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");
        try {
            const response = await axios.post(`https://preprod-unified-clientportal-wallet-api.xbees.in/api/v1/auth/get-otp`, {
                mobileNumber: mobileNumber
            });
            if (response.status === 200) {
                setShowOtpStep(true);
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || "Failed to send OTP.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg("");
        try {
            const response = await axios.post(`https://preprod-unified-clientportal-wallet-api.xbees.in/api/v1/auth/verify-otp`, {
                mobileNumber: mobileNumber,
                otp: otp
            });
            if (response.status === 200 && response.data.token) {
                localStorage.setItem("token", response.data.token);
                if (response.data.kavachToken) {
                    localStorage.setItem("kavachToken", response.data.kavachToken);
                }
                navigate("/dashboard");
            } else {
                setErrorMsg(response.data.message || "OTP Verification failed.");
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || "Invalid OTP or Verification Failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full">
            {!showOtpStep ? (
                <form onSubmit={handleSendOtp}>
                    {errorMsg && <div style={{ color: "red", marginBottom: "10px", fontSize: "12px", textAlign: "left" }}>{errorMsg}</div>}
                    <div className="mb-3" style={{ textAlign: "left", marginBottom: "16px" }}>
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                            Mobile Number <span className="text-danger" style={{ color: "#E53E3E" }}>*</span>
                        </label>
                        <input
                            type="text"
                            maxLength="10"
                            className="form-control"
                            placeholder="Enter 10-digit mobile number"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                            style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box" }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn xb_button w-full" 
                        disabled={isSubmitting || mobileNumber.length !== 10}
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "#FF6E00",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            cursor: "pointer",
                            opacity: (isSubmitting || mobileNumber.length !== 10) ? 0.7 : 1
                        }}
                    >
                        {isSubmitting ? "Sending OTP..." : "Get OTP"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp}>
                    {errorMsg && <div style={{ color: "red", marginBottom: "10px", fontSize: "12px", textAlign: "left" }}>{errorMsg}</div>}
                    <div className="mb-3" style={{ textAlign: "left", marginBottom: "16px" }}>
                        <label className="form-label" style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                            Enter OTP <span className="text-danger" style={{ color: "#E53E3E" }}>*</span>
                        </label>
                        <input
                            type="text"
                            maxLength="6"
                            className="form-control"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                            style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box", textAlign: "center", letterSpacing: "4px", fontSize: "18px" }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="btn xb_button w-full" 
                        disabled={isSubmitting || otp.length !== 6}
                        style={{
                            width: "100%",
                            padding: "12px",
                            background: "#FF6E00",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            cursor: "pointer",
                            opacity: (isSubmitting || otp.length !== 6) ? 0.7 : 1
                        }}
                    >
                        {isSubmitting ? "Verifying..." : "Verify OTP"}
                    </button>
                    
                    <div style={{ textAlign: "center", marginTop: "12px" }}>
                        <button 
                            type="button" 
                            onClick={() => setShowOtpStep(false)}
                            style={{ background: "none", border: "none", color: "#FF6E00", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                        >
                            Change Mobile Number
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
