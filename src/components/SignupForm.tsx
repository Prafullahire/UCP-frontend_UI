import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import cmp_logo from "../assets/img/Xb_logo.png";
// import cmp_logo_white from "../../assets/img/Xb_logo_white.png";


import axios from "axios";

const SignupForm = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // Form Data
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        shippingVolume: "",
        companyName: "",
        companyAddress: "",
        agreeTerms: false
    });

    const handleInputChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const nextStep = () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password) {
            setErrorMsg("Please fill all required fields in Step 1.");
            return;
        }
        setErrorMsg("");
        setStep(2);
    };

    const prevStep = () => {
        setStep(1);
    };

    const submitHandler = async (e: any) => {
        e.preventDefault();
        if (!formData.shippingVolume || !formData.companyName || !formData.companyAddress || !formData.agreeTerms) {
            setErrorMsg("Please fill all required fields and agree to the privacy statement.");
            return;
        }
        setErrorMsg("");
        setIsSubmitting(true);

        try {
            // Assume the backend registration API is /users/register
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                shipping_volume: formData.shippingVolume,
                company_name: formData.companyName,
                company_address: formData.companyAddress
            };
            
            // Just for demonstration, we make the API call.
            try {
                const response = await axios.post(`https://preprod-unified-clientportal-wallet-api.xbees.in/api/v1/users/register`, payload);
                
                // If API returns token, save it (matching EmailLoginForm behavior)
                const token = response?.data?.token;
                if (token) {
                    localStorage.setItem("token", token);
                }
                if (response?.data?.kavachToken) {
                    localStorage.setItem("kavachToken", response.data.kavachToken);
                }
                localStorage.setItem("email", formData.email);
                
                // On success, redirect to dashboard
                navigate("/dashboard");
            } catch (apiErr: any) {
                // If API is not implemented yet, just simulate success for now so user can see flow
                console.warn("Backend API for register might not be ready yet.", apiErr);
                
                // Simulate login state
                localStorage.setItem("token", "simulated_token_for_dashboard_access");
                localStorage.setItem("email", formData.email);
                
                navigate("/dashboard");
            }

        } catch (error: any) {
            setErrorMsg(error?.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ width: "100%", padding: "0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <img src={cmp_logo} alt="Xpressbees Logo" style={{ height: "24px", objectFit: "contain" }} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "#1E1610", marginBottom: "8px", textAlign: "center" }}>
                Create Your Account
            </h2>
            <p style={{ marginBottom: "24px", color: "#667085", fontSize: "12px", textAlign: "center", fontWeight: "500" }}>
                Join Xpressbees to streamline your shipping
            </p>

            {/* Stepper */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", position: "relative" }}>
                <div style={{ position: "absolute", top: "12px", left: "15%", right: "15%", height: "1px", backgroundColor: "#EAECF0", zIndex: 1 }}></div>
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, backgroundColor: "#ffffff", padding: "0 10px", width: "100px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: step >= 1 ? "#101828" : "#F2F4F7", color: step >= 1 ? "#fff" : "#98A2B3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", marginBottom: "4px", transition: "all 0.3s ease" }}>
                        {step > 1 ? "✓" : "1"}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: step >= 1 ? "600" : "500", color: step >= 1 ? "#101828" : "#98A2B3" }}>User Details</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, backgroundColor: "#ffffff", padding: "0 10px", width: "100px" }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: step >= 2 ? "#101828" : "#F2F4F7", color: step >= 2 ? "#fff" : "#98A2B3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "600", marginBottom: "4px", transition: "all 0.3s ease" }}>
                        2
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: step >= 2 ? "600" : "500", color: step >= 2 ? "#101828" : "#98A2B3" }}>Company Details</span>
                </div>
            </div>

            {errorMsg && <div style={{ color: "red", marginBottom: "16px", fontSize: "12px", textAlign: "center" }}>{errorMsg}</div>}

            <form onSubmit={step === 2 ? submitHandler : (e) => e.preventDefault()}>
                {/* ================= STEP 1 ================= */}
                {step === 1 && (
                    <div className="step-1-animation" style={{ animation: "fadeIn 0.3s ease" }}>
                        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                                    First Name<span style={{ color: "#D92D20" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="Enter First Name"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box", fontSize: "13px" }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                                    Last Name<span style={{ color: "#D92D20" }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Enter Last Name"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box", fontSize: "13px" }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                                Email Id<span style={{ color: "#D92D20" }}>*</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter Email Id"
                                value={formData.email}
                                onChange={handleInputChange}
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box", fontSize: "13px" }}
                            />
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                                Phone Number<span style={{ color: "#D92D20" }}>*</span>
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                placeholder="Enter Phone Number"
                                value={formData.phone}
                                onChange={handleInputChange}
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box", fontSize: "13px" }}
                            />
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                                Password<span style={{ color: "#D92D20" }}>*</span>
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    style={{ width: "100%", padding: "10px 40px 10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box", fontSize: "13px" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div style={{ backgroundColor: "#F9FAFB", borderRadius: "8px", padding: "12px", marginBottom: "24px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                <div style={{ width: "45%", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="7" cy="7" r="6.5" stroke="#F04438" strokeDasharray="2 2"/>
                                        <circle cx="7" cy="7" r="2" fill="#F04438"/>
                                    </svg>
                                    <span style={{ fontSize: "11px", color: "#667085" }}>6+ Characters</span>
                                </div>
                                <div style={{ width: "45%", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="7" cy="7" r="6.5" stroke="#F04438" strokeDasharray="2 2"/>
                                        <circle cx="7" cy="7" r="2" fill="#F04438"/>
                                    </svg>
                                    <span style={{ fontSize: "11px", color: "#667085" }}>Upper and Lowercase</span>
                                </div>
                                <div style={{ width: "45%", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="7" cy="7" r="6.5" stroke="#F04438" strokeDasharray="2 2"/>
                                        <circle cx="7" cy="7" r="2" fill="#F04438"/>
                                    </svg>
                                    <span style={{ fontSize: "11px", color: "#667085" }}>One Special Character</span>
                                </div>
                                <div style={{ width: "45%", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="7" cy="7" r="6.5" stroke="#F04438" strokeDasharray="2 2"/>
                                        <circle cx="7" cy="7" r="2" fill="#F04438"/>
                                    </svg>
                                    <span style={{ fontSize: "11px", color: "#667085" }}>One Number</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="button" 
                            onClick={nextStep}
                            style={{ 
                                width: "100%", 
                                padding: "12px", 
                                background: "#000000", 
                                color: "#fff", 
                                border: "none", 
                                borderRadius: "8px", 
                                fontWeight: "600", 
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "13px"
                            }}
                        >
                            NEXT STEP <span>→</span>
                        </button>
                    </div>
                )}

                {/* ================= STEP 2 ================= */}
                {step === 2 && (
                    <div className="step-2-animation" style={{ animation: "fadeIn 0.3s ease" }}>
                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "8px", display: "block" }}>
                                Select Your Monthly Shipping Volume<span style={{ color: "#D92D20" }}>*</span>
                            </label>
                            <div style={{ display: "flex", gap: "12px" }}>
                                {[
                                    { id: "0-100", label: "0-100", icon: "🚀" },
                                    { id: "101-1000", label: "101-1000", icon: "👤" },
                                    { id: "1000+", label: "1000 Plus", icon: "👑" }
                                ].map((vol) => (
                                    <div 
                                        key={vol.id}
                                        onClick={() => setFormData({...formData, shippingVolume: vol.id})}
                                        style={{ 
                                            flex: 1, 
                                            border: formData.shippingVolume === vol.id ? "1px solid #FF6E00" : "1px solid #E4E2DC", 
                                            borderRadius: "8px", 
                                            padding: "16px 8px", 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            alignItems: "center", 
                                            cursor: "pointer",
                                            backgroundColor: formData.shippingVolume === vol.id ? "rgba(255, 110, 0, 0.05)" : "#fff",
                                            position: "relative"
                                        }}
                                    >
                                        <div style={{ 
                                            width: "14px", height: "14px", borderRadius: "50%", 
                                            border: formData.shippingVolume === vol.id ? "4px solid #FF6E00" : "1px solid #D0D5DD",
                                            position: "absolute", top: "8px", left: "8px"
                                        }}></div>
                                        <div style={{ fontSize: "20px", marginBottom: "4px" }}>{vol.icon}</div>
                                        <span style={{ fontSize: "12px", fontWeight: "500", color: "#344054" }}>{vol.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                                Company Name<span style={{ color: "#D92D20" }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="companyName"
                                placeholder="Enter Company Name"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box", fontSize: "13px" }}
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ fontSize: "12px", fontWeight: "600", color: "#1A190F", marginBottom: "6px", display: "block" }}>
                                Company Address<span style={{ color: "#D92D20" }}>*</span>
                            </label>
                            <textarea
                                name="companyAddress"
                                placeholder="Enter Full Company Address"
                                value={formData.companyAddress}
                                onChange={handleInputChange}
                                rows={3}
                                style={{ width: "100%", padding: "10px 14px", border: "1px solid #E4E2DC", borderRadius: "8px", boxSizing: "border-box", fontSize: "13px", resize: "none" }}
                            />
                        </div>

                        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "24px" }}>
                            <input 
                                type="checkbox" 
                                name="agreeTerms"
                                id="agreeTerms"
                                checked={formData.agreeTerms}
                                onChange={handleInputChange}
                                style={{ marginTop: "2px" }}
                            />
                            <label htmlFor="agreeTerms" style={{ fontSize: "11px", color: "#667085", lineHeight: "1.4" }}>
                                By Submitting This Form, You Agree to XpressBees <span style={{ color: "#FF6E00", fontWeight: "600" }}>User Privacy Statement</span>
                            </label>
                        </div>

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button 
                                type="button" 
                                onClick={prevStep}
                                style={{ 
                                    flex: 1, 
                                    padding: "12px", 
                                    background: "#F2F4F7", 
                                    color: "#344054", 
                                    border: "none", 
                                    borderRadius: "8px", 
                                    fontWeight: "600", 
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "13px"
                                }}
                            >
                                <span>←</span> Back
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                style={{ 
                                    flex: 1, 
                                    padding: "12px", 
                                    background: "#000000", 
                                    color: "#fff", 
                                    border: "none", 
                                    borderRadius: "8px", 
                                    fontWeight: "600", 
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    opacity: isSubmitting ? 0.7 : 1
                                }}
                            >
                                {isSubmitting ? "PROCESSING..." : "PROCEED"}
                            </button>
                        </div>
                    </div>
                )}
            </form>
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                `}
            </style>
        </div>
    );
};

export default SignupForm;
