import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import cmp_logo from "../../assets/img/Xb_logo.png";
import SignupForm from "../../components/SignupForm";
import "../Landing/Landing.css"; // Reuse styling

const SignupPage = () => {
    const navigate = useNavigate();
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = React.useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
                setIsHeaderVisible(false);
            } else {
                setIsHeaderVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="landing-wrapper" style={{ backgroundColor: "#FAFAFA", minHeight: "100vh" }}>
            {/* ==================== NAVBAR ==================== */}
            <header
                className={`xb-navbar ${
                    !isHeaderVisible ? "xb-navbar-hidden" : ""
                }`}
            >
                <div className="xb-navbar-container">
                    <Link to="/login" className="xb-logo-link">
                        <img
                            src={cmp_logo}
                            alt="Xpressbees Logo"
                            className="xb-navbar-logo"
                        />
                    </Link>

                    {/* Desktop Nav */}
                    <div className="xb-navbar-right">
                        <nav>
                            <ul className="xb-navbar-menu">
                                <li>
                                    <a
                                        href="/login#features"
                                        className="xb-navbar-link"
                                    >
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/login#integrations"
                                        className="xb-navbar-link"
                                    >
                                        Integrations
                                    </a>
                                </li>
                            </ul>
                        </nav>
                        <div className="xb-navbar-actions">
                            <button
                                className="xb-btn xb-btn-primary xb-navbar-cta"
                                onClick={() => navigate("/login")}
                            >
                                Log In
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ==================== CONTENT ==================== */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#fafafa", paddingTop: "100px", paddingBottom: "60px" }}>
                <div 
                    style={{ 
                        backgroundColor: "#ffffff", 
                        borderRadius: "16px", 
                        padding: "32px 40px", 
                        width: "480px", 
                        boxShadow: "0px 10px 40px rgba(0,0,0,0.05)",
                        border: "1px solid #f2f4f7"
                    }}
                >
                    <SignupForm />
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
