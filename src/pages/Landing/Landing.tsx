// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import cmp_logo from "../../assets/img/Xb_logo.png";
import cmp_logo_white from "../../assets/img/Xb_logo_white.png";
import ViditAatrey from "../../assets/signup/images/ViditAatrey.png";
import VijayShekhar from "../../assets/signup/images/VijayShekhar.png";
import pardeep from "../../assets/signup/images/Pardeep.png";
import OtpLoginForm from "../../components/OtpLoginForm";
import EmailLoginForm from "../../components/EmailLoginForm";
import dashboardMockup from "../../assets/img/dashboard_mockup.png";
import storeIntegration from "../../assets/img/illustrations/store_integration.png";
import "./Landing.css";

const AnimatedCounter = ({
    target,
    duration = 2000,
    suffix = "",
    prefix = "",
    decimals = 0,
    format = false,
}) => {
    const [count, setCount] = useState(0);
    const elementRef = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    let startTime = null;

                    const animate = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        const progress = Math.min(
                            (timestamp - startTime) / duration,
                            1
                        );
                        const currentValue = progress * target;
                        setCount(currentValue);

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        } else {
                            setCount(target);
                        }
                    };

                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.1 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, [target, duration]);

    const formatNumber = (num) => {
        const fixed = num.toFixed(decimals);
        if (!format) return fixed;
        const parts = fixed.split(".");
        parts[0] = parseInt(parts[0], 10).toLocaleString();
        return parts.join(".");
    };

    return (
        <span ref={elementRef}>
            {prefix}
            {formatNumber(count)}
            {suffix}
        </span>
    );
};

const Landing = () => {
    const navigate = useNavigate();
    const [loginMode, setLoginMode] = useState("email");
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [showRateModal, setShowRateModal] = useState(false);
    const [pickupPincode, setPickupPincode] = useState("");
    const [deliveryPincode, setDeliveryPincode] = useState("");
    const [weight, setWeight] = useState(0.5);
    const [estimatedRate, setEstimatedRate] = useState(null);
    const [activeFaq, setActiveFaq] = useState(null);
    const [showAllFaqs, setShowAllFaqs] = useState(false);
    const [rateError, setRateError] = useState("");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    const location = useLocation();

    const handleCalculateRate = (e) => {
        e.preventDefault();
        setRateError("");
        setEstimatedRate(null);

        if (!pickupPincode || !deliveryPincode) {
            setRateError("Please enter both Pickup and Delivery Pincodes.");
            return;
        }
        if (pickupPincode.length !== 6 || deliveryPincode.length !== 6) {
            setRateError("Please enter valid 6-digit Pincodes.");
            return;
        }

        const basePrice = 45;
        const perKg = 25;
        const randomFactor =
            Math.abs(parseInt(pickupPincode) - parseInt(deliveryPincode)) % 50;
        const total = basePrice + weight * perKg + randomFactor;

        setEstimatedRate({
            surface: Math.round(total),
            air: Math.round(total * 1.6),
            codCharge: 15,
        });
    };

    useEffect(() => {
        document.title = "Xpressbees - Delivering Happiness";
        
        if (location.state && location.state.scrollTo) {
            setTimeout(() => {
                const element = document.getElementById(location.state.scrollTo);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                }
            }, 100);
            
            // Clear the state so it doesn't re-trigger on subsequent renders if not navigating
            window.history.replaceState({}, document.title)
        } else if (!location.hash) {
            // Smooth scroll reset only if no hash
            window.scrollTo(0, 0);
        }

        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [location]);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
                // Scrolling down and past the header
                setIsHeaderVisible(false);
            } else {
                // Scrolling up
                setIsHeaderVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const testimonials = [
        {
            quote: "The most advantageous aspect is the comprehensive support provided through end-to-end logistics and transparency, resulting in reduced shipping friction.",
            name: "Liam Johnson",
            title: "Brand Strategist at SkyTech",
            avatar: ViditAatrey,
        },
        {
            quote: "XpressBees provides exceptional service that exceeds my expectations, offering support for shipping and helping me manage my business effectively.",
            name: "Anika Patel",
            title: "Digital Marketing Expert at Cloud Innovations",
            avatar: ViditAatrey,
        },
        {
            quote: "Our relationship with XpressBees has been great for the last 2 years. Very responsive to business needs, open to feedback, and great service.",
            name: "Vidit Aatrey",
            title: "Founder & CEO - Meesho",
            avatar: ViditAatrey,
        },
        {
            quote: "XpressBees has been a key partner for PayTM Mall since inception. Its reach and service quality ensures that millions of our customers receive their orders on time, every time.",
            name: "Vijay Shekhar Sharma",
            title: "Founder & CEO - PayTM",
            avatar: VijayShekhar,
        },
        {
            quote: "Netmeds.com has depended on Xpressbees since our inception. They are an important courier partner and help us satisfy millions of customers in thousands of PIN codes all across India.",
            name: "Pradeep Dadha",
            title: "Founder & CEO - Netmeds.com",
            avatar: pardeep,
        },
    ];

    const faqItems = [
        {
            question:
                "What is the best logistics partner for D2C and eCommerce brands in India?",
            answer: "XpressBees is one of India’s fastest-growing logistics partners for D2C brands, online sellers, and eCommerce businesses. With nationwide delivery coverage, multiple shipping options, COD support, and real-time tracking, businesses can streamline shipping operations and improve customer experience.",
        },
        {
            question: "How can I start shipping with XpressBees?",
            answer: "You can start shipping with XpressBees in just a few simple steps. Sign up on the platform, complete the automated KYC process, integrate your online store or marketplace, and begin shipping across India within 24 hours.",
        },
        {
            question:
                "Does XpressBees provide shipping integration with Shopify, WooCommerce, and other platforms?",
            answer: "Yes, XpressBees offers seamless integrations with Shopify, WooCommerce, Wix, Instamojo, and custom APIs. This allows businesses to automate order syncing, shipment tracking, and delivery management from a single dashboard.",
        },
        {
            question:
                "What shipping services does XpressBees offer for online businesses?",
            answer: "XpressBees offers multiple logistics solutions including Air Express, Surface Shipping, Hyperlocal Delivery, Next Day Delivery, Part Truck Load (PTL), and bulk shipping services for eCommerce and D2C brands across India.",
        },
        {
            question: "How does COD remittance work with XpressBees?",
            answer: "XpressBees provides early and reliable Cash on Delivery (COD) remittance to help businesses maintain smooth cash flow. Sellers can track payments and shipment status directly through the centralized dashboard.",
        },
        {
            question:
                "Can small businesses and social sellers use XpressBees logistics services?",
            answer: "Absolutely. XpressBees is designed for social sellers, micro entrepreneurs, small businesses, marketplace sellers, and growing D2C brands looking for scalable and affordable shipping solutions.",
        },
        {
            question: "Does XpressBees provide real-time shipment tracking?",
            answer: "Yes, XpressBees offers real-time shipment tracking through a centralized dashboard. Businesses and customers can monitor orders from pickup to final delivery with live status updates and tracking notifications.",
        },
        {
            question: "What is the delivery coverage of XpressBees in India?",
            answer: "XpressBees delivers across 19,000+ pincodes and locations in India, helping businesses expand their reach with reliable logistics and fast delivery services.",
        },
        {
            question:
                "Why should eCommerce businesses choose XpressBees for shipping?",
            answer: "XpressBees helps eCommerce businesses improve delivery speed, reduce shipping friction, automate logistics operations, and manage orders efficiently through a technology-driven logistics platform built for growth.",
        },
        {
            question:
                "Does XpressBees offer logistics solutions for high-volume shipping?",
            answer: "Yes, XpressBees supports bulk order creation and scalable shipping operations for businesses handling high shipment volumes during sales, festive seasons, and business expansion phases.",
        },
    ];

    const handleNextTestimonial = () => {
        if (activeTestimonial < testimonials.length - 1) {
            setActiveTestimonial((prev) => prev + 1);
        }
    };

    const handlePrevTestimonial = () => {
        if (activeTestimonial > 0) {
            setActiveTestimonial((prev) => prev - 1);
        }
    };

    const triggerLogin = () => {
        setShowLoginModal(true);
    };

    const triggerSignUp = () => {
        setLoginMode("otp");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleFooterLinkClick = (e, targetId) => {
        e.preventDefault();
        const element = document.getElementById(targetId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        } else {
            navigate("/support");
        }
    };

    return (
        <div className="landing-wrapper">
            {/* ==================== NAVBAR ==================== */}
            <header className={`xb-navbar ${!isHeaderVisible ? 'xb-navbar-hidden' : ''}`}>
                <div className="xb-navbar-container">
                    <Link to="/home" className="xb-logo-link">
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
                                        href="#features"
                                        className="xb-navbar-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document
                                                .getElementById("dashboard")
                                                ?.scrollIntoView({
                                                    behavior: "smooth",
                                                });
                                        }}
                                    >
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#integrations"
                                        className="xb-navbar-link"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            document
                                                .getElementById("integrations")
                                                ?.scrollIntoView({
                                                    behavior: "smooth",
                                                });
                                        }}
                                    >
                                        Integrations
                                    </a>
                                </li>
                            </ul>
                        </nav>
                        <div className="xb-navbar-actions">
                            <button
                                className="xb-btn xb-btn-primary xb-navbar-cta"
                                onClick={triggerSignUp}
                            >
                                Start Shipping Now
                            </button>
                        </div>
                    </div>

                    {/* Hamburger Button — mobile only */}
                    <button
                        className="xb-hamburger"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? (
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#222"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        ) : (
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#222"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Mobile Dropdown Menu */}
                {mobileMenuOpen && (
                    <div className="xb-mobile-menu">
                        <a
                            href="#features"
                            className="xb-mobile-link"
                            onClick={(e) => {
                                e.preventDefault();
                                setMobileMenuOpen(false);
                                document
                                    .getElementById("dashboard")
                                    ?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Features
                        </a>
                        <a
                            href="#integrations"
                            className="xb-mobile-link"
                            onClick={(e) => {
                                e.preventDefault();
                                setMobileMenuOpen(false);
                                document
                                    .getElementById("integrations")
                                    ?.scrollIntoView({ behavior: "smooth" });
                            }}
                        >
                            Integrations
                        </a>
                        <button
                            className="xb-mobile-cta"
                            onClick={() => {
                                setMobileMenuOpen(false);
                                triggerSignUp();
                            }}
                        >
                            Start Shipping Now
                        </button>
                    </div>
                )}
            </header>

            {/* ==================== HERO SECTION (SPLIT LAYOUT) ==================== */}
            <section className="hero-section">
                <div className="landing-container">
                    <div className="hero-container-split">
                        {/* Left Column Slogan Content */}
                        <div className="hero-left-content">
                            <div className="hero-pill">
                                <span className="hero-pill-dot"></span>
                                INDIA’S FASTEST GROWING LOGISTICS PARTNER
                            </div>
                            <h1 className="hero-title-main">
                                Ship Smarter.
                                <br />
                                <span>Grow Faster.</span>
                            </h1>
                            <p className="hero-subtext-main">
                                The all-in-one logistics platform for D2C brands
                                and
                                <br />
                                e-commerce businesses.
                            </p>

                            {/* Ratings Block using robust local bundle assets */}
                            <div className="hero-rating-block">
                                <div className="hero-avatars">
                                    <img
                                        className="hero-avatar"
                                        src={ViditAatrey}
                                        alt="Meesho CEO"
                                    />
                                    <img
                                        className="hero-avatar"
                                        src={VijayShekhar}
                                        alt="PayTM CEO"
                                    />
                                    <img
                                        className="hero-avatar"
                                        src={pardeep}
                                        alt="Netmeds CEO"
                                    />
                                    <img
                                        className="hero-avatar"
                                        src={ViditAatrey}
                                        alt="Partner CEO"
                                    />
                                </div>
                                <div className="hero-stars-col">
                                    <div className="hero-stars">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                            >
                                                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                            </svg>
                                        ))}
                                    </div>
                                    <span className="hero-rating-text">
                                        Trusted by 4,000+ Sellers
                                    </span>
                                </div>
                            </div>

                            {/* Continuously sliding partner logos marquee */}
                            <div className="hero-partners-marquee">
                                <div className="hero-partners-track">
                                    {/* ── Set 1 ────────────────────────────────── */}
                                    {/* Wanderlooms */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 800,
                                                color: "#101828",
                                                fontSize: "15px",
                                                letterSpacing: "1.5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            WANDERLOOMS
                                        </span>
                                    </div>

                                    {/* firstcry */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 800,
                                                fontSize: "15px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                                display: "inline-flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span style={{ color: "#FF6E00" }}>
                                                first
                                            </span>
                                            <span style={{ color: "#00A8CA" }}>
                                                cry
                                            </span>
                                            <span
                                                style={{
                                                    backgroundColor: "#E60067",
                                                    color: "#FFFFFF",
                                                    fontSize: "7.5px",
                                                    padding: "1px 3.5px",
                                                    borderRadius: "2px",
                                                    marginLeft: "3px",
                                                    verticalAlign: "middle",
                                                    fontWeight: 800,
                                                    fontFamily: "sans-serif",
                                                    lineHeight: 1,
                                                }}
                                            >
                                                com
                                            </span>
                                        </span>
                                    </div>

                                    {/* SAMSUNG */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#1A1A1A",
                                                fontSize: "15px",
                                                letterSpacing: "1.5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            SAMSUNG
                                        </span>
                                    </div>

                                    {/* NYKAA */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#E91E8C",
                                                fontSize: "16px",
                                                letterSpacing: "0.5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            NYKAA
                                        </span>
                                    </div>

                                    {/* lenskart */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 800,
                                                color: "#00274D",
                                                fontSize: "15px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            lenskart
                                            <svg
                                                width="20"
                                                height="10"
                                                viewBox="0 0 20 10"
                                                fill="none"
                                                style={{
                                                    transform:
                                                        "translateY(0.5px)",
                                                }}
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <circle
                                                    cx="5"
                                                    cy="5"
                                                    r="4.2"
                                                    stroke="#00274D"
                                                    strokeWidth="1.6"
                                                />
                                                <circle
                                                    cx="15"
                                                    cy="5"
                                                    r="4.2"
                                                    stroke="#00274D"
                                                    strokeWidth="1.6"
                                                />
                                                <path
                                                    d="M9.2 5H10.8"
                                                    stroke="#00274D"
                                                    strokeWidth="1.6"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </span>
                                    </div>

                                    {/* Meesho */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#9C27B0",
                                                fontSize: "16px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            meesho
                                        </span>
                                    </div>

                                    {/* Myntra */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#FF3F6C",
                                                fontSize: "15px",
                                                letterSpacing: "0.5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            myntra
                                        </span>
                                    </div>

                                    {/* Flipkart */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                fontSize: "15px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "3px",
                                            }}
                                        >
                                            <span style={{ color: "#2874F0" }}>
                                                flip
                                            </span>
                                            <span style={{ color: "#F6C100" }}>
                                                kart
                                            </span>
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 10 10"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M5 0L6.2 3.8H10L6.9 6.2L8.1 10L5 7.6L1.9 10L3.1 6.2L0 3.8H3.8L5 0Z"
                                                    fill="#F6C100"
                                                />
                                            </svg>
                                        </span>
                                    </div>

                                    {/* Amazon */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#1A1A1A",
                                                fontSize: "15px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                                display: "inline-flex",
                                                flexDirection: "column",
                                                alignItems: "flex-start",
                                                lineHeight: 1,
                                            }}
                                        >
                                            <span>amazon</span>
                                            <svg
                                                width="55"
                                                height="8"
                                                viewBox="0 0 55 8"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{ marginTop: "-1px" }}
                                            >
                                                <path
                                                    d="M3 4C12 8 42 8 52 4"
                                                    stroke="#FF9900"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M46 1L52 4L47 7"
                                                    stroke="#FF9900"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </span>
                                    </div>

                                    {/* ── Set 2 (duplicate for seamless loop) ── */}
                                    {/* Wanderlooms */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 800,
                                                color: "#101828",
                                                fontSize: "15px",
                                                letterSpacing: "1.5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            WANDERLOOMS
                                        </span>
                                    </div>

                                    {/* firstcry */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 800,
                                                fontSize: "15px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                                display: "inline-flex",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span style={{ color: "#FF6E00" }}>
                                                first
                                            </span>
                                            <span style={{ color: "#00A8CA" }}>
                                                cry
                                            </span>
                                            <span
                                                style={{
                                                    backgroundColor: "#E60067",
                                                    color: "#FFFFFF",
                                                    fontSize: "7.5px",
                                                    padding: "1px 3.5px",
                                                    borderRadius: "2px",
                                                    marginLeft: "3px",
                                                    verticalAlign: "middle",
                                                    fontWeight: 800,
                                                    fontFamily: "sans-serif",
                                                    lineHeight: 1,
                                                }}
                                            >
                                                com
                                            </span>
                                        </span>
                                    </div>

                                    {/* SAMSUNG */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#1A1A1A",
                                                fontSize: "15px",
                                                letterSpacing: "1.5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            SAMSUNG
                                        </span>
                                    </div>

                                    {/* NYKAA */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#E91E8C",
                                                fontSize: "16px",
                                                letterSpacing: "0.5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            NYKAA
                                        </span>
                                    </div>

                                    {/* lenskart */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 800,
                                                color: "#00274D",
                                                fontSize: "15px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            lenskart
                                            <svg
                                                width="20"
                                                height="10"
                                                viewBox="0 0 20 10"
                                                fill="none"
                                                style={{
                                                    transform:
                                                        "translateY(0.5px)",
                                                }}
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <circle
                                                    cx="5"
                                                    cy="5"
                                                    r="4.2"
                                                    stroke="#00274D"
                                                    strokeWidth="1.6"
                                                />
                                                <circle
                                                    cx="15"
                                                    cy="5"
                                                    r="4.2"
                                                    stroke="#00274D"
                                                    strokeWidth="1.6"
                                                />
                                                <path
                                                    d="M9.2 5H10.8"
                                                    stroke="#00274D"
                                                    strokeWidth="1.6"
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </span>
                                    </div>

                                    {/* Meesho */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#9C27B0",
                                                fontSize: "16px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            meesho
                                        </span>
                                    </div>

                                    {/* Myntra */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#FF3F6C",
                                                fontSize: "15px",
                                                letterSpacing: "0.5px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                            }}
                                        >
                                            myntra
                                        </span>
                                    </div>

                                    {/* Flipkart */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                fontSize: "15px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "3px",
                                            }}
                                        >
                                            <span style={{ color: "#2874F0" }}>
                                                flip
                                            </span>
                                            <span style={{ color: "#F6C100" }}>
                                                kart
                                            </span>
                                            <svg
                                                width="10"
                                                height="10"
                                                viewBox="0 0 10 10"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M5 0L6.2 3.8H10L6.9 6.2L8.1 10L5 7.6L1.9 10L3.1 6.2L0 3.8H3.8L5 0Z"
                                                    fill="#F6C100"
                                                />
                                            </svg>
                                        </span>
                                    </div>

                                    {/* Amazon */}
                                    <div className="hero-partner-logo">
                                        <span
                                            style={{
                                                fontWeight: 900,
                                                color: "#1A1A1A",
                                                fontSize: "15px",
                                                fontFamily:
                                                    '"IBM Plex Sans", sans-serif',
                                                display: "inline-flex",
                                                flexDirection: "column",
                                                alignItems: "flex-start",
                                                lineHeight: 1,
                                            }}
                                        >
                                            <span>amazon</span>
                                            <svg
                                                width="55"
                                                height="8"
                                                viewBox="0 0 55 8"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                                style={{ marginTop: "-1px" }}
                                            >
                                                <path
                                                    d="M3 4C12 8 42 8 52 4"
                                                    stroke="#FF9900"
                                                    strokeWidth="2.5"
                                                    strokeLinecap="round"
                                                />
                                                <path
                                                    d="M46 1L52 4L47 7"
                                                    stroke="#FF9900"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column Embedded Login Card with spec-exact toggle buttons */}
                        <div className="hero-login-card-wrapper">
                            <div className="hero-login-card">
                                <h3 className="hero-login-card-title">
                                    {loginMode === "otp" ? "Login / Register" : "Log In"}
                                </h3>
                                <p className="hero-login-card-subtitle">
                                    For Business
                                </p>

                                <div className="xb-hero-login-toggle">
                                    <button
                                        className={`xb-hero-toggle-btn ${
                                            loginMode === "otp" ? "active" : ""
                                        }`}
                                        onClick={() => setLoginMode("otp")}
                                    >
                                        OTP
                                    </button>
                                    <button
                                        className={`xb-hero-toggle-btn ${
                                            loginMode === "email"
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() => setLoginMode("email")}
                                    >
                                        Email
                                    </button>
                                </div>

                                {loginMode === "otp" ? (
                                    <OtpLoginForm />
                                ) : (
                                    <EmailLoginForm />
                                )}

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        marginTop: "16px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "13px",
                                            color: "#667085",
                                            fontFamily: '"Inter", sans-serif',
                                            fontWeight: 500,
                                        }}
                                    >
                                        New to Xpressbees?{" "}
                                        <button
                                            type="button"
                                            onClick={() => setLoginMode("otp")}
                                            style={{
                                                color: "#FF6E00",
                                                textDecoration: "none",
                                                fontWeight: 600,
                                                background: "none",
                                                border: "none",
                                                padding: 0,
                                                cursor: "pointer",
                                                fontFamily: '"Inter", sans-serif',
                                                fontSize: "13px"
                                            }}
                                        >
                                            Create Account
                                        </button>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Calculate Rates Banner - In-place expanding container */}
                    {!showRateModal ? (
                        <div className="rates-banner">
                            <h3 className="rates-banner-text">
                                Calculate Shipping Rates Now
                            </h3>

                            {/* Figma-matching isometric dots decoration */}
                            <div
                                className="rates-banner-dots"
                                aria-hidden="true"
                            >
                                <svg
                                    width="200"
                                    height="70"
                                    viewBox="0 0 200 70"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    {Array.from({ length: 8 }).map((_, row) =>
                                        Array.from({ length: 14 }).map(
                                            (_, col) => {
                                                const x =
                                                    col * 14 +
                                                    (row % 2 === 0 ? 0 : 7);
                                                const y = row * 9;
                                                return (
                                                    <circle
                                                        key={`${row}-${col}`}
                                                        cx={x}
                                                        cy={y}
                                                        r="2"
                                                        fill="rgba(255,255,255,0.18)"
                                                    />
                                                );
                                            }
                                        )
                                    )}
                                </svg>
                            </div>

                            <button
                                className="rates-banner-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowRateModal(true);
                                }}
                            >
                                Calculate{" "}
                                <span
                                    style={{
                                        fontSize: "9px",
                                        transform: "translateY(-0.5px)",
                                    }}
                                >
                                    ▲
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div
                            className="rates-banner expanded"
                            style={{ cursor: "default" }}
                        >
                            <button
                                className="xb-pricing-close-btn"
                                onClick={() => {
                                    setShowRateModal(false);
                                    setEstimatedRate(null);
                                    setRateError("");
                                }}
                                aria-label="Close Calculator"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2.5"
                                        d="M6 18 18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>

                            <div className="xb-pricing-header">
                                <h2 className="xb-pricing-title">
                                    Transparent Pricing,{" "}
                                    <span style={{ color: "#FF6E00" }}>
                                        No Hidden Fees.
                                    </span>
                                </h2>
                                <p className="xb-pricing-subtitle">
                                    Calculate your shipping costs instantly. We
                                    offer the most competitive rates in the
                                    industry with zero subscription fees.
                                </p>
                            </div>

                            <div className="xb-pricing-grid">
                                {/* Left Column */}
                                <div className="xb-pricing-left">
                                    <div className="xb-pricing-accent-heading">
                                        <span
                                            className="xb-pricing-accent-bar"
                                            style={{
                                                backgroundColor: "#FFFFFF",
                                            }}
                                        ></span>
                                        <h3 style={{ color: "#FF6E00" }}>
                                            Why Sellers Choose Us
                                        </h3>
                                    </div>

                                    <ul className="xb-pricing-benefits-list">
                                        <li>
                                            <span className="xb-benefit-check-icon">
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                >
                                                    <path
                                                        d="M20 6L9 17L4 12"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                            <span>
                                                Zero subscription or setup fees
                                            </span>
                                        </li>
                                        <li>
                                            <span className="xb-benefit-check-icon">
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                >
                                                    <path
                                                        d="M20 6L9 17L4 12"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                            <span>
                                                Volume-based discounts available
                                            </span>
                                        </li>
                                        <li>
                                            <span className="xb-benefit-check-icon">
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                >
                                                    <path
                                                        d="M20 6L9 17L4 12"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                            <span>Daily COD remittance</span>
                                        </li>
                                        <li>
                                            <span className="xb-benefit-check-icon">
                                                <svg
                                                    width="12"
                                                    height="12"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="3"
                                                >
                                                    <path
                                                        d="M20 6L9 17L4 12"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </span>
                                            <span>
                                                Dedicated account manager
                                            </span>
                                        </li>
                                    </ul>

                                    <div className="xb-pricing-secure-card">
                                        <div className="xb-secure-shield-icon">
                                            <svg
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="#FF6E00"
                                                strokeWidth="2"
                                            >
                                                <path
                                                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                            </svg>
                                        </div>
                                        <div className="xb-secure-text-group">
                                            <h4>100% Secure</h4>
                                            <p>End-to-End encryption</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="xb-pricing-right">
                                    <div className="xb-estimator-card">
                                        <div
                                            className="xb-pricing-accent-heading"
                                            style={{ marginBottom: "24px" }}
                                        >
                                            <span
                                                className="xb-pricing-accent-bar"
                                                style={{
                                                    backgroundColor: "#FF6E00",
                                                }}
                                            ></span>
                                            <h3
                                                style={{
                                                    color: "#1E1610",
                                                    margin: 0,
                                                }}
                                            >
                                                Shipping Cost Estimator
                                            </h3>
                                        </div>

                                        <form onSubmit={handleCalculateRate}>
                                            <div className="xb-estimator-group">
                                                <label
                                                    style={{
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        color: "#1E1610",
                                                        marginBottom: "6px",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    PICKUP PINCODE
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength="6"
                                                    placeholder="e.g. 110001"
                                                    value={pickupPincode}
                                                    onChange={(e) =>
                                                        setPickupPincode(
                                                            e.target.value.replace(
                                                                /\D/g,
                                                                ""
                                                            )
                                                        )
                                                    }
                                                    style={{
                                                        height: "40px",
                                                        border: "1px solid transparent",
                                                        borderRadius: "8px",
                                                        padding: "0 16px",
                                                        fontSize: "14px",
                                                        backgroundColor:
                                                            "#F5F5F5",
                                                        color: "#1E1610",
                                                        width: "100%",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>

                                            <div
                                                className="xb-estimator-group"
                                                style={{ marginTop: "16px" }}
                                            >
                                                <label
                                                    style={{
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        color: "#1E1610",
                                                        marginBottom: "6px",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    DELIVERY PINCODE
                                                </label>
                                                <input
                                                    type="text"
                                                    maxLength="6"
                                                    placeholder="e.g. 110001"
                                                    value={deliveryPincode}
                                                    onChange={(e) =>
                                                        setDeliveryPincode(
                                                            e.target.value.replace(
                                                                /\D/g,
                                                                ""
                                                            )
                                                        )
                                                    }
                                                    style={{
                                                        height: "40px",
                                                        border: "1px solid transparent",
                                                        borderRadius: "8px",
                                                        padding: "0 16px",
                                                        fontSize: "14px",
                                                        backgroundColor:
                                                            "#F5F5F5",
                                                        color: "#1E1610",
                                                        width: "100%",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>

                                            <div
                                                className="xb-estimator-group"
                                                style={{ marginTop: "16px" }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "center",
                                                        marginBottom: "8px",
                                                    }}
                                                >
                                                    <label
                                                        style={{
                                                            margin: 0,
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            color: "#1E1610",
                                                        }}
                                                    >
                                                        WEIGHT (KG)
                                                    </label>
                                                    <span
                                                        style={{
                                                            color: "#FF6E00",
                                                            fontWeight: "700",
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {weight} KG
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0.5"
                                                    max="20"
                                                    step="0.5"
                                                    value={weight}
                                                    onChange={(e) =>
                                                        setWeight(
                                                            parseFloat(
                                                                e.target.value
                                                            )
                                                        )
                                                    }
                                                    className="xb-weight-slider"
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="xb-calculate-btn"
                                            >
                                                Calculate Rate
                                            </button>
                                        </form>

                                        {rateError && (
                                            <div
                                                className="xb-rate-error"
                                                style={{
                                                    color: "#E53E3E",
                                                    fontSize: "13px",
                                                    fontWeight: "600",
                                                    marginTop: "14px",
                                                    textAlign: "left",
                                                    backgroundColor: "#FFF5F5",
                                                    padding: "10px 14px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #FED7D7",
                                                }}
                                            >
                                                ⚠️ {rateError}
                                            </div>
                                        )}

                                        {estimatedRate && (
                                            <div
                                                className="xb-estimator-results"
                                                style={{
                                                    marginTop: "20px",
                                                    padding: "16px",
                                                    background: "#FAF7F2",
                                                    borderRadius: "8px",
                                                    border: "1px solid #ECE7E1",
                                                }}
                                            >
                                                <h4
                                                    style={{
                                                        color: "#1E1610",
                                                        margin: "0 0 12px 0",
                                                        fontSize: "14px",
                                                        fontWeight: "700",
                                                        textAlign: "left",
                                                    }}
                                                >
                                                    Estimated Shipping Rates:
                                                </h4>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        marginBottom: "6px",
                                                        fontSize: "13px",
                                                        color: "#605248",
                                                    }}
                                                >
                                                    <span>
                                                        Surface Shipping:
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontWeight: "700",
                                                            color: "#1E1610",
                                                        }}
                                                    >
                                                        ₹{estimatedRate.surface}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        marginBottom: "6px",
                                                        fontSize: "13px",
                                                        color: "#605248",
                                                    }}
                                                >
                                                    <span>
                                                        Air Shipping (Express):
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontWeight: "700",
                                                            color: "#FF6E00",
                                                        }}
                                                    >
                                                        ₹{estimatedRate.air}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        fontSize: "11px",
                                                        color: "#8A8179",
                                                        borderTop:
                                                            "1px solid #E3DED9",
                                                        paddingTop: "6px",
                                                        marginTop: "6px",
                                                    }}
                                                >
                                                    <span>COD Charges:</span>
                                                    <span>
                                                        ₹
                                                        {
                                                            estimatedRate.codCharge
                                                        }{" "}
                                                        included
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
            {/* ==================== SINGLE DASHBOARD SECTION ==================== */}
            <section
                className="dashboard-section landing-section"
                id="dashboard"
            >
                <div className="landing-container">
                    <h2
                        className="xb-title"
                        style={{
                            textAlign: "left",
                            margin: "0 0 16px 0",
                            color: "#101828",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "48px",
                            fontWeight: "700",
                            lineHeight: "52px",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Single dashboard for all your{" "}
                        <span style={{ color: "#FF7A00" }}>shipping needs</span>
                    </h2>
                    <p
                        className="xb-subtext"
                        style={{
                            margin: "0 0 40px 0",
                            textAlign: "left",
                            maxWidth: "none",
                            color: "#101828",
                            fontFamily: "Inter, sans-serif",
                            fontSize: "16px",
                            fontWeight: "400",
                            lineHeight: "28px",
                        }}
                    >
                        We enable businesses to fasttrack their logistics and
                        increase shipping efficiency by providing a single
                        window platform integrated with multiple channels.
                    </p>

                    {/* Dashboard Visual Area - High Fidelity Mockup Image */}
                    <div
                        className="dashboard-mockup-image-container"
                        style={{
                            display: "flex",
                            justifyContent: "flex-start",
                            width: "100%",
                            marginBottom: "60px",
                        }}
                    >
                        <img
                            src={dashboardMockup}
                            alt="Single dashboard for all your shipping needs mockup"
                            style={{
                                width: "100%",
                                maxWidth: "100%",
                                height: "auto",
                                display: "block",
                                borderRadius: "20px",
                            }}
                        />
                    </div>

                    {/* Features columns */}
                    <div className="feature-cols-grid">
                        <div className="feature-col">
                            <div className="feature-col-line"></div>
                            <h4 className="feature-col-title">
                                Self-Serve Portal
                            </h4>
                            <p className="feature-col-text">
                                Designed for total independence. Sign Up,
                                integrate, and ship instantly.
                            </p>
                        </div>
                        <div className="feature-col">
                            <div className="feature-col-line"></div>
                            <h4 className="feature-col-title">
                                Centralised Dashboard
                            </h4>
                            <p className="feature-col-text">
                                Track every shipment from pickup to doorstep.
                                Get clear, real-time status updates for you and
                                your customers.
                            </p>
                        </div>
                        <div className="feature-col">
                            <div className="feature-col-line"></div>
                            <h4 className="feature-col-title">
                                Bulk order creation
                            </h4>
                            <p className="feature-col-text">
                                Handle order surges easily by adding multiple
                                orders instantly.
                            </p>
                        </div>
                        <div className="feature-col">
                            <div className="feature-col-line"></div>
                            <h4 className="feature-col-title">
                                Early COD remittance
                            </h4>
                            <p className="feature-col-text">
                                Get guaranteed COD payments, take better control
                                of your cash flow.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== MULTIPLE SHIPPING OPTIONS ==================== */}
            <section className="shipping-section landing-section" id="shipping">
                <div className="landing-container">
                    <h2 className="xb-title">
                        Multiple <span>Shipping Options</span>
                    </h2>
                    <div className="shipping-grid">
                        {/* Air */}
                        <div className="shipping-card-wrapper">
                            <div className="shipping-card-box">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="67"
                                    height="64"
                                    viewBox="0 0 67 64"
                                    fill="none"
                                >
                                    <path
                                        d="M1.5 58H65.5"
                                        stroke="black"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M9.25011 40.5002L1.96118 27.7799C3.49431 26.8881 11.0807 29.5547 13.9049 31.0149L29.2348 25.486L16.1276 2.61204L22.629 2.21887L43.8029 22.0577L56.8391 17.9C62.6123 16.236 64.433 19.4134 64.7966 20.0481C66.9813 23.8607 62.5669 26.4285 61.9363 26.7953C56.8914 29.73 9.25011 40.5002 9.25011 40.5002Z"
                                        fill="#F8C6AC"
                                        stroke="#E8520A"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">Air</h4>
                        </div>

                        {/* Express */}
                        <div className="shipping-card-wrapper">
                            <div className="shipping-card-box">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="64"
                                    height="51"
                                    viewBox="0 0 64 51"
                                    fill="none"
                                >
                                    <g clip-path="url(#clip0_704_6825)">
                                        <path
                                            opacity="0.3"
                                            d="M25.6 8.34778C26.9913 10.2956 27.8261 12.8 27.8261 15.3043C27.8261 22.2608 22.2608 27.826 15.3043 27.826C11.4087 27.826 7.79127 25.8782 5.56519 23.0956V38.9565H11.9652C12.8 37.2869 14.7478 36.1739 16.6956 36.1739C18.6434 36.1739 20.5913 37.2869 21.4261 38.9565H41.7391V8.34778H25.6ZM53.9826 13.913H41.7391V38.9565H45.3565C46.1913 37.2869 48.1391 36.1739 50.0869 36.1739C52.0348 36.1739 53.9826 37.2869 54.8174 38.9565H61.2174V28.3826L53.9826 13.913Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M63.9999 41.7392H55.6521V36.174H58.4347V29.2174L52.3129 16.6957H41.739V11.1305H55.6521L63.9999 27.8261V41.7392Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M50.087 38.1218C52.0349 38.1218 53.7044 39.7914 53.7044 41.7392C53.7044 43.687 52.0349 45.3566 50.087 45.3566C48.1392 45.3566 46.4696 43.687 46.4696 41.7392C46.4696 39.7914 48.1392 38.1218 50.087 38.1218ZM50.087 33.3914C45.3566 33.3914 41.7392 37.0088 41.7392 41.7392C41.7392 46.4696 45.3566 50.087 50.087 50.087C54.8175 50.087 58.4349 46.4696 58.4349 41.7392C58.4349 37.0088 54.8175 33.3914 50.087 33.3914ZM16.6957 38.1218C18.6436 38.1218 20.3131 39.7914 20.3131 41.7392C20.3131 43.687 18.6436 45.0783 16.6957 45.0783C14.7479 45.0783 13.3566 43.687 13.3566 41.7392C13.3566 39.7914 14.7479 38.1218 16.6957 38.1218ZM16.6957 33.3914C11.9653 33.3914 8.3479 37.0088 8.3479 41.7392C8.3479 46.4696 11.9653 50.087 16.6957 50.087C21.4262 50.087 25.0436 46.4696 25.0436 41.7392C25.0436 37.0088 21.4262 33.3914 16.6957 33.3914Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M44.5218 36.1739H38.9566V11.1304H25.0436V5.56519H44.5218V36.1739ZM11.1305 41.7391H2.78271V23.0956H8.34793V36.1739H11.1305V41.7391ZM22.261 36.1739H44.5218V41.7391H22.261V36.1739Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M15.3043 0C23.6522 0 30.6087 6.95652 30.6087 15.3043C30.6087 23.6522 23.6522 30.6087 15.3043 30.6087C6.95652 30.6087 0 23.6522 0 15.3043C0 6.95652 6.95652 0 15.3043 0ZM15.3043 4.73043C9.46087 4.73043 4.73043 9.46087 4.73043 15.3043C4.73043 21.1478 9.46087 25.8783 15.3043 25.8783C21.1478 25.8783 25.8783 21.1478 25.8783 15.3043C25.8783 9.46087 21.1478 4.73043 15.3043 4.73043Z"
                                            fill="#1C2433"
                                        />
                                        <path
                                            d="M17.8087 20.8696L12.8 15.8609L15.3044 8.6261L19.2 10.0174L17.8087 14.7478L20.8696 17.8087L17.8087 20.8696Z"
                                            fill="#1C2433"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_704_6825">
                                            <rect
                                                width="64"
                                                height="51"
                                                fill="white"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">Express</h4>
                        </div>

                        {/* Hyperlocal */}
                        <div className="shipping-card-wrapper">
                            <div className="shipping-card-box">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="64"
                                    height="62"
                                    viewBox="0 0 64 62"
                                    fill="none"
                                >
                                    <g clip-path="url(#clip0_704_6843)">
                                        <path
                                            d="M64 35.5294H55.0982L49.6582 20.8235C51.8691 20.8235 55.2727 20.8235 55.2727 20.8235V12C55.2727 12 50.4145 12 48 12C45.5855 12 43.6364 13.9706 43.6364 16.4118C43.6364 16.9412 43.7527 17.4118 43.8982 17.8824H37.8182V23.7647H44.5382L45.1491 25.4118L33.8036 35.5294H26.1818V29.6471H32V23.7647H2.90909V29.6471H7.24364C6.83636 30.1765 6.4 30.7059 5.90545 31.2647C3.40364 34.1765 0 38.1471 0 44.3529C0 45.1471 0.32 45.8824 0.843636 46.4412L1.30909 46.8824C0.552727 48.3235 0.0581818 49.9706 0.0581818 51.7059C0.0581818 57.3824 4.62545 62 10.2109 62C15.3018 62 19.52 58.1471 20.2182 53.1765H43.84C44.5673 58.1471 48.7564 62 53.8473 62C59.4618 62 64 57.3824 64 51.7059C64 47.3529 61.3236 43.6471 57.5709 42.1471L57.28 41.4118H64V35.5294ZM10.2109 56.1176C7.82545 56.1176 5.87636 54.1471 5.87636 51.7059C5.87636 49.2647 7.82545 47.2941 10.2109 47.2941C12.5964 47.2941 14.5455 49.2647 14.5455 51.7059C14.5455 54.1471 12.5964 56.1176 10.2109 56.1176ZM44.7127 47.2941H19.3455C17.7164 43.8235 14.2545 41.4118 10.2109 41.4118C8.75636 41.4118 7.36 41.7353 6.08 42.3235C6.69091 39.4412 8.40727 37.3235 10.2982 35.1176C11.7527 33.4412 13.2073 31.7059 13.9927 29.6471H20.3636V35.5294C20.3636 39.3824 22.3709 41.4118 26.1818 41.4118H34.9091C35.6073 41.4118 36.3055 41.1471 36.8291 40.6765L47.3309 31.3235L51.2291 41.7941C48.3491 42.5882 45.9927 44.6176 44.7127 47.2941ZM58.1818 51.7059C58.1818 54.1471 56.2327 56.1176 53.8473 56.1176C51.4618 56.1176 49.5127 54.1471 49.5127 51.7059C49.5127 49.2647 51.4618 47.2941 53.8473 47.2941C56.2327 47.2941 58.1818 49.2647 58.1818 51.7059Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            opacity="0.3"
                                            d="M51.2292 41.7942C48.3492 42.5883 45.9928 44.6177 44.7128 47.2942H19.3455C17.7164 43.8236 14.2546 41.4118 10.211 41.4118C8.75644 41.4118 7.36008 41.7353 6.08008 42.3236C6.69099 39.4412 8.40735 37.3236 10.2983 35.1177C11.7528 33.4412 13.2074 31.7059 13.9928 29.6471H20.3637V35.5294C20.3637 39.3824 22.371 41.4118 26.1819 41.4118H34.9092C35.6074 41.4118 36.3055 41.1471 36.8292 40.6765L47.331 31.3236L51.2292 41.7942Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M12.3335 1.33337H17.6668V8.00004H12.3335V1.33337Z"
                                            fill="#1C2433"
                                        />
                                        <path
                                            d="M24.3333 24H5.66667C4.2 24 3 22.8 3 21.3333V2.66667C3 1.2 4.2 0 5.66667 0H24.3333C25.8 0 27 1.2 27 2.66667V21.3333C27 22.8 25.8 24 24.3333 24ZM7 4V20H23V4H7Z"
                                            fill="#1C2433"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_704_6843">
                                            <rect
                                                width="64"
                                                height="62"
                                                fill="white"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">Hyperlocal</h4>
                        </div>

                        {/* Bulk */}
                        <div className="shipping-card-wrapper">
                            <div className="shipping-card-box">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="62"
                                    height="64"
                                    viewBox="0 0 62 64"
                                    fill="none"
                                >
                                    <g clip-path="url(#clip0_704_6860)">
                                        <path
                                            opacity="0.3"
                                            d="M56.4888 15.6054L30.9999 4.18921L5.511 15.6054C4.13322 16.2973 3.44434 17.3352 3.44434 18.7189V59.5406H17.2221V45.7027H24.111V31.8649H37.8888V45.7027H44.7777V59.5406H58.5555V18.7189C58.5555 17.3352 57.8666 16.2973 56.4888 15.6054Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M41.3332 45.7027H34.4443V35.3243H27.5554V45.7027H20.6665V28.4054H41.3332V45.7027Z"
                                            fill="#1C2433"
                                        />
                                        <path
                                            d="M48.2223 59.5406H41.3334V49.1622H20.6667V59.5406H13.7778V42.2433H48.2223V59.5406Z"
                                            fill="#1C2433"
                                        />
                                        <path
                                            d="M27.5557 45.7028H34.4446V59.5406H27.5557V45.7028Z"
                                            fill="#1C2433"
                                        />
                                        <path
                                            d="M62 63H0V18.7189C0 15.9514 1.72222 13.5297 4.13333 12.4919L31 0.383789L57.8667 12.4919C60.2778 13.5297 62 15.9514 62 18.7189V63ZM6.88889 56.0811H55.1111V18.7189L31 7.9946L6.88889 18.7189V56.0811Z"
                                            fill="#E8520A"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_704_6860">
                                            <rect
                                                width="62"
                                                height="64"
                                                fill="white"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">Bulk</h4>
                        </div>

                        {/* Next day */}
                        <div className="shipping-card-wrapper">
                            <div className="shipping-card-box">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="58"
                                    height="64"
                                    viewBox="0 0 58 64"
                                    fill="none"
                                >
                                    <g clip-path="url(#clip0_704_6877)">
                                        <path
                                            d="M41.8887 0H48.3332V12.8H41.8887V0ZM9.6665 0H16.1109V12.8H9.6665V0Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M51.5556 57.6H6.44444V51.2H0V57.6C0 61.12 2.9 64 6.44444 64H51.5556C55.1 64 58 61.12 58 57.6V12.8C58 9.28002 55.1 6.40002 51.5556 6.40002H6.44444C2.9 6.40002 0 9.28002 0 12.8V32H6.44444V25.6H51.5556V57.6ZM51.5556 19.2H6.44444V12.8H51.5556V19.2Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M22.5557 32L32.2223 41.6L22.5557 51.2V32Z"
                                            fill="#1C2433"
                                        />
                                        <path
                                            d="M29 41.6H0"
                                            stroke="#1C2433"
                                            stroke-width="4"
                                        />
                                        <path
                                            opacity="0.3"
                                            d="M3.22217 9.59998H54.7777V22.4H3.22217V9.59998Z"
                                            fill="#E8520A"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_704_6877">
                                            <rect
                                                width="58"
                                                height="64"
                                                fill="white"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">Next day</h4>
                        </div>

                        {/* Part truck */}
                        <div className="shipping-card-wrapper">
                            <div className="shipping-card-box">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="64"
                                    height="47"
                                    viewBox="0 0 64 47"
                                    fill="none"
                                >
                                    <g clip-path="url(#clip0_704_6894)">
                                        <path
                                            opacity="0.3"
                                            d="M61.0909 32H14.5454V0H43.6363V8.72727H52.3636L61.0909 23.2727V32Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M64 37.8182H55.2727V32H58.1818V24.6458L51.6771 11.6364H40.7273V5.81818H51.6771C53.8822 5.81818 55.8953 7.06327 56.8815 9.03564L64 23.2727V37.8182ZM20.3636 32H43.6364V37.8182H20.3636V32ZM14.5455 14.5455H20.3636V23.2727H14.5455V14.5455ZM14.5455 0H20.3636V8.72727H14.5455V0ZM0 14.5455H5.81818V23.2727H0V14.5455Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M17.4546 0V5.81818H37.8182V32H43.6364V0H17.4546Z"
                                            fill="#E8520A"
                                        />
                                        <path
                                            d="M0 0V8.72727H5.81818V5.81818H8.72727V0H0ZM5.81818 29.0909H0V37.8182H8.72727V32H5.81818V29.0909Z"
                                            fill="#1C2433"
                                        />
                                        <path
                                            fill-rule="evenodd"
                                            clip-rule="evenodd"
                                            d="M0 14.5454H5.81818V23.2727H0V14.5454Z"
                                            fill="#1C2433"
                                        />
                                        <path
                                            d="M49.4547 34.1819C51.4591 34.1819 53.0911 35.8138 53.0911 37.8182C53.0911 39.8226 51.4591 41.4546 49.4547 41.4546C47.4504 41.4546 45.8184 39.8226 45.8184 37.8182C45.8184 35.8138 47.4504 34.1819 49.4547 34.1819ZM49.4547 29.0909C44.6344 29.0909 40.7274 32.9978 40.7274 37.8182C40.7274 42.6386 44.6344 46.5455 49.4547 46.5455C54.2751 46.5455 58.182 42.6386 58.182 37.8182C58.182 32.9978 54.2751 29.0909 49.4547 29.0909ZM14.5456 34.1819C16.55 34.1819 18.182 35.8138 18.182 37.8182C18.182 39.8226 16.55 41.4546 14.5456 41.4546C12.5413 41.4546 10.9093 39.8226 10.9093 37.8182C10.9093 35.8138 12.5413 34.1819 14.5456 34.1819ZM14.5456 29.0909C9.72527 29.0909 5.81836 32.9978 5.81836 37.8182C5.81836 42.6386 9.72527 46.5455 14.5456 46.5455C19.366 46.5455 23.2729 42.6386 23.2729 37.8182C23.2729 32.9978 19.366 29.0909 14.5456 29.0909Z"
                                            fill="#E8520A"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_704_6894">
                                            <rect
                                                width="64"
                                                height="47"
                                                fill="white"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">Part truck</h4>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== DARK STORE CONNECTION ==================== */}
            <section
                className="integration-section landing-section"
                id="integrations"
            >
                <div className="landing-container">
                    <div className="integration-card">
                        {/* Section Title */}
                        <h2 className="integration-title">
                            Connect Your Store in Minutes
                        </h2>

                        <div className="integration-content-grid">
                            {/* Visual mockup block left */}
                            <div className="integration-visual-wrapper">
                                <img
                                    src={storeIntegration}
                                    alt="Connect Your Store in Minutes Mockup"
                                    className="integration-mockup-img"
                                />
                            </div>

                            {/* Descriptive Right Columns */}
                            <div className="integration-list">
                                <div className="integration-item">
                                    <div className="integration-item-line"></div>
                                    <div className="integration-item-content">
                                        <h4 className="integration-item-title">
                                            Shopify Sync
                                        </h4>
                                        <p className="integration-item-desc">
                                            Your orders flow directly from
                                            Shopify to our dashboard. No more
                                            manual data entry or missed
                                            shipments.
                                        </p>
                                    </div>
                                </div>

                                <div className="integration-item">
                                    <div className="integration-item-line"></div>
                                    <div className="integration-item-content">
                                        <h4 className="integration-item-title">
                                            WooCommerce Setup
                                        </h4>
                                        <p className="integration-item-desc">
                                            Link your WordPress store instantly
                                            to manage shipping, tracking, and
                                            returns all in one place.
                                        </p>
                                    </div>
                                </div>

                                <div className="integration-item">
                                    <div className="integration-item-line"></div>
                                    <div className="integration-item-content">
                                        <h4 className="integration-item-title">
                                            Wix & Instamojo Small Business Ready
                                        </h4>
                                        <p className="integration-item-desc">
                                            Built for growing brands. Easily
                                            connect your storefront and start
                                            reaching customers nationwide.
                                        </p>
                                    </div>
                                </div>

                                <div className="integration-item">
                                    <div className="integration-item-line"></div>
                                    <div className="integration-item-content">
                                        <h4 className="integration-item-title">
                                            Custom API Total Flexibility
                                        </h4>
                                        <p className="integration-item-desc">
                                            Use our developer-friendly tools to
                                            connect any website or custom-built
                                            app to our logistics network.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/*Ship at any scale for all types of business section  */}
            <section className="shipping-section landing-section" id="shipping">
                <div className="landing-container">
                    <h2 className="xb-title">
                        Ship at any scale for <span>all types of business</span>
                    </h2>
                    <div className="shipping-grid-2">
                        {/* Card 1 - Social Sellers */}
                        <div className="shipping-card-wrapper">
                            <div
                                className="shipping-card-box"
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: "8px",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {/* WhatsApp */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="47"
                                    height="47"
                                    viewBox="0 0 47 47"
                                    fill="none"
                                    style={{
                                        width: "27.87px",
                                        height: "27.87px",
                                    }}
                                >
                                    <path
                                        d="M39.4827 6.75863C37.3531 4.60823 34.8168 2.90318 32.0216 1.74285C29.2265 0.582514 26.2283 -0.00990125 23.2019 0.000125172C10.521 0.000125172 0.185801 10.3353 0.185801 23.0162C0.185801 27.0806 1.25416 31.0289 3.25151 34.5126L0 46.4503L12.1932 43.2453C15.5608 45.08 19.3465 46.0555 23.2019 46.0555C35.8828 46.0555 46.2179 35.7203 46.2179 23.0394C46.2179 16.8848 43.8258 11.1017 39.4827 6.75863ZM23.2019 42.1537C19.7646 42.1537 16.3969 41.2247 13.4473 39.4828L12.7506 39.0647L5.50435 40.9692L7.43203 33.9088L6.96753 33.1888C5.05738 30.1395 4.04331 26.6144 4.04117 23.0162C4.04117 12.472 12.6345 3.87872 23.1786 3.87872C28.2882 3.87872 33.0958 5.87608 36.6957 9.49919C38.4785 11.2733 39.8912 13.3837 40.8521 15.708C41.8129 18.0324 42.3027 20.5243 42.2929 23.0394C42.3394 33.5836 33.7461 42.1537 23.2019 42.1537ZM33.6996 27.847C33.119 27.5683 30.2855 26.1748 29.7746 25.9658C29.2404 25.78 28.8688 25.6871 28.474 26.2445C28.0791 26.8251 26.9876 28.1257 26.6624 28.4973C26.3373 28.8921 25.9889 28.9386 25.4083 28.6367C24.8276 28.358 22.9696 27.7309 20.7865 25.78C19.0678 24.2471 17.9298 22.3659 17.5814 21.7853C17.2562 21.2046 17.5349 20.9027 17.8369 20.6008C18.0923 20.3453 18.4175 19.9273 18.6962 19.6021C18.9749 19.277 19.091 19.0215 19.2768 18.6499C19.4626 18.2551 19.3697 17.9299 19.2304 17.6512C19.091 17.3725 17.9298 14.539 17.4653 13.3778C17.0008 12.263 16.513 12.4023 16.1647 12.3791H15.0499C14.655 12.3791 14.0512 12.5185 13.517 13.0991C13.0061 13.6797 11.5196 15.0732 11.5196 17.9067C11.5196 20.7401 13.5867 23.4807 13.8654 23.8523C14.1441 24.2471 17.9298 30.0534 23.6896 32.5385C25.0599 33.1423 26.1282 33.4907 26.9643 33.7462C28.3346 34.1875 29.5888 34.1178 30.5875 33.9784C31.7023 33.8159 34.0015 32.5849 34.466 31.2379C34.9538 29.8908 34.9538 28.7528 34.7912 28.4973C34.6286 28.2418 34.2802 28.1257 33.6996 27.847Z"
                                        fill="#E8520A"
                                    />
                                </svg>
                                {/* Instagram */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="56"
                                    height="56"
                                    viewBox="0 0 56 56"
                                    fill="none"
                                    style={{
                                        width: "27.87px",
                                        height: "27.87px",
                                    }}
                                >
                                    <path
                                        d="M18.1156 4.64502H37.6247C45.0567 4.64502 51.0952 10.6835 51.0952 18.1156V37.6247C51.0952 41.1973 49.676 44.6236 47.1498 47.1498C44.6236 49.676 41.1973 51.0952 37.6247 51.0952H18.1156C10.6835 51.0952 4.64502 45.0567 4.64502 37.6247V18.1156C4.64502 14.543 6.06424 11.1167 8.59045 8.59045C11.1167 6.06424 14.543 4.64502 18.1156 4.64502ZM17.6511 9.29004C15.4336 9.29004 13.3069 10.1709 11.7389 11.7389C10.1709 13.3069 9.29004 15.4336 9.29004 17.6511V38.0892C9.29004 42.711 13.0293 46.4502 17.6511 46.4502H38.0892C40.3066 46.4502 42.4333 45.5693 44.0013 44.0013C45.5693 42.4333 46.4502 40.3066 46.4502 38.0892V17.6511C46.4502 13.0293 42.711 9.29004 38.0892 9.29004H17.6511ZM40.0633 12.7738C40.8333 12.7738 41.5717 13.0797 42.1161 13.6241C42.6606 14.1686 42.9664 14.907 42.9664 15.6769C42.9664 16.4469 42.6606 17.1853 42.1161 17.7298C41.5717 18.2742 40.8333 18.5801 40.0633 18.5801C39.2933 18.5801 38.5549 18.2742 38.0105 17.7298C37.466 17.1853 37.1602 16.4469 37.1602 15.6769C37.1602 14.907 37.466 14.1686 38.0105 13.6241C38.5549 13.0797 39.2933 12.7738 40.0633 12.7738ZM27.8701 16.2576C30.95 16.2576 33.9037 17.481 36.0814 19.6588C38.2592 21.8366 39.4827 24.7903 39.4827 27.8701C39.4827 30.95 38.2592 33.9037 36.0814 36.0814C33.9037 38.2592 30.95 39.4827 27.8701 39.4827C24.7903 39.4827 21.8366 38.2592 19.6588 36.0814C17.481 33.9037 16.2576 30.95 16.2576 27.8701C16.2576 24.7903 17.481 21.8366 19.6588 19.6588C21.8366 17.481 24.7903 16.2576 27.8701 16.2576ZM27.8701 20.9026C26.0222 20.9026 24.25 21.6367 22.9433 22.9433C21.6367 24.25 20.9026 26.0222 20.9026 27.8701C20.9026 29.718 21.6367 31.4902 22.9433 32.7969C24.25 34.1036 26.0222 34.8376 27.8701 34.8376C29.718 34.8376 31.4902 34.1036 32.7969 32.7969C34.1036 31.4902 34.8376 29.718 34.8376 27.8701C34.8376 26.0222 34.1036 24.25 32.7969 22.9433C31.4902 21.6367 29.718 20.9026 27.8701 20.9026Z"
                                        fill="#E8520A"
                                    />
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">
                                Social Sellers
                            </h4>
                        </div>

                        {/* Card 2 - Micro Entrepreneurs */}
                        <div className="shipping-card-wrapper">
                            <div className="shipping-card-box">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="64"
                                    height="62"
                                    viewBox="0 0 64 62"
                                    fill="none"
                                    style={{ width: "64px", height: "51px" }}
                                >
                                    <mask
                                        id="mask0_704_7037"
                                        style={{ maskType: "luminance" }}
                                        maskUnits="userSpaceOnUse"
                                        x="4"
                                        y="0"
                                        width="56"
                                        height="62"
                                    >
                                        <path
                                            d="M32.0001 25.1111C38.3821 25.1111 43.5557 19.9375 43.5557 13.5556C43.5557 7.1736 38.3821 2 32.0001 2C25.6182 2 20.4446 7.1736 20.4446 13.5556C20.4446 19.9375 25.6182 25.1111 32.0001 25.1111Z"
                                            fill="#555555"
                                            stroke="white"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M58 59.7778C58 45.4186 46.3592 33.7778 32 33.7778C17.6408 33.7778 6 45.4186 6 59.7778"
                                            stroke="white"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M31.9999 59.7778L37.7777 52.5556L31.9999 33.7778L26.2222 52.5556L31.9999 59.7778Z"
                                            fill="#555555"
                                            stroke="white"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </mask>
                                    <g mask="url(#mask0_704_7037)">
                                        <path
                                            d="M-2.66675 -3.77783H66.6666V65.5555H-2.66675V-3.77783Z"
                                            fill="#E8520A"
                                        />
                                    </g>
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">
                                Micro Entrepreneurs
                            </h4>
                        </div>

                        {/* Card 3 - Market Shippers */}
                        <div className="shipping-card-wrapper">
                            <div className="shipping-card-box">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="65"
                                    height="66"
                                    viewBox="0 0 65 66"
                                    fill="none"
                                    style={{ width: "64px", height: "62px" }}
                                >
                                    <path
                                        d="M4.77273 29.7273H18.6364M18.6364 29.7273V21.4091M18.6364 29.7273H32.5M32.5 29.7273V21.4091M32.5 29.7273H46.3636M46.3636 29.7273V21.4091M46.3636 29.7273H60.2273M24.1818 40.8182H29.7273M35.2727 40.8182H40.8182M35.2727 49.1364H40.8182M24.1818 49.1364H29.7273M7.54545 63V29.7273H2V18.6364L10.3182 2H54.6818L63 18.6364V29.7273H57.4545V63H7.54545Z"
                                        stroke="#E8520A"
                                        strokeWidth="4"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">
                                Market Shippers
                            </h4>
                        </div>

                        {/* Card 4 - eCommerce D2C Brands */}
                        <div className="shipping-card-wrapper">
                            <div
                                className="shipping-card-box"
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    gap: "6px",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {/* WooCommerce icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="50"
                                    height="50"
                                    viewBox="0 0 50 50"
                                    fill="none"
                                    style={{ width: "25px", height: "25px" }}
                                >
                                    <path
                                        d="M3.125 15.625V30.2083C3.125 31.0371 3.45424 31.832 4.04029 32.418C4.62634 33.0041 5.4212 33.3333 6.25 33.3333H22.9167L32.2917 38.5417L30.2083 33.3333H43.75C44.5788 33.3333 45.3737 33.0041 45.9597 32.418C46.5458 31.832 46.875 31.0371 46.875 30.2083V15.625C46.875 14.7962 46.5458 14.0013 45.9597 13.4153C45.3737 12.8292 44.5788 12.5 43.75 12.5H6.25C5.4212 12.5 4.62634 12.8292 4.04029 13.4153C3.45424 14.0013 3.125 14.7962 3.125 15.625Z"
                                        stroke="#E8520A"
                                        strokeWidth="2.5"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M8.0835 16.6104C9.03141 24.9667 10.596 29.5771 10.596 29.5771L15.971 19.5542C16.321 23.3729 17.6272 26.7209 20.1877 29.5792C19.7585 24.8709 20.3689 20.3584 22.4522 16.1167M31.4835 23.3709C32.0147 20.75 30.9522 18.325 29.1085 17.9521C27.2689 17.5771 25.346 19.4 24.8147 22.0188C24.2835 24.6375 25.346 27.0646 27.1897 27.4375C29.0293 27.8125 30.9522 25.9896 31.4835 23.3709ZM41.9585 23.4959C42.5002 20.8271 41.4939 18.3709 39.7085 18.0104C37.9189 17.6521 36.0293 19.525 35.4856 22.1938C34.9418 24.8625 35.9481 27.3209 37.7356 27.6813C39.5231 28.0396 41.4127 26.1667 41.9585 23.4959Z"
                                        stroke="#E8520A"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {/* Shopify/bag icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="48"
                                    height="48"
                                    viewBox="0 0 48 48"
                                    fill="none"
                                    style={{ width: "25px", height: "25px" }}
                                >
                                    <g clipPath="url(#clip0_704_7062)">
                                        <path
                                            d="M32 46V8M32 8L35 10.296H38.26L40.802 27.09C41.6 32.356 42 37.674 42 43L32 46L6 41L8 15L32 8Z"
                                            stroke="#E8520A"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M26.004 9.75008C26.018 5.71608 24.478 2.52608 22.004 2.05808C18.882 1.46808 15.454 5.44008 14.348 10.9301C14.1907 11.7181 14.088 12.4881 14.04 13.2401"
                                            stroke="#E8520A"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M29.7341 8.65999C29.1461 6.29799 27.9061 4.62599 26.2181 4.29599C23.4521 3.75599 20.4381 7.01399 19.1101 11.76M25.5801 18.848C23.5801 18.008 18.3801 16.492 17.0081 20.532C16.2681 22.712 17.5961 25.036 20.4341 27.266C24.4081 30.386 23.7341 33.048 23.0061 34C20.4361 37.368 15.2921 35.404 13.5781 34"
                                            stroke="#E8520A"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip0_704_7062">
                                            <rect
                                                width="48"
                                                height="48"
                                                fill="white"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">
                                eCommerce D2C Brands
                            </h4>
                        </div>

                        {/* Card 5 - Omnichannel Brands */}
                        <div className="shipping-card-wrapper">
                            <div className="shipping-card-box">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="53"
                                    height="51"
                                    viewBox="0 0 53 51"
                                    fill="none"
                                    style={{
                                        width: "50px",
                                        height: "47.222px",
                                    }}
                                >
                                    <path
                                        d="M1.5 48.7222V12.6111L26.5 1.5L51.5 12.6111V48.7222"
                                        stroke="#E8520A"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M29.278 26.5H40.3891V48.7222H12.6113V32.0556H29.278"
                                        stroke="#E8520A"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M29.2776 48.7221V23.7221C29.2776 22.9854 28.985 22.2789 28.464 21.7579C27.9431 21.237 27.2365 20.9443 26.4998 20.9443H20.9443C20.2076 20.9443 19.501 21.237 18.9801 21.7579C18.4592 22.2789 18.1665 22.9854 18.1665 23.7221V32.0554"
                                        stroke="#E8520A"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <h4 className="shipping-card-label">
                                Omnichannel Brands
                            </h4>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== TESTIMONIALS & STATS SECTION ==================== */}
            <section className="testimonials-section">
                <div className="landing-container">
                    {/* Header Row: Heading LEFT, Nav Arrows RIGHT */}
                    <div className="testimonials-header-row">
                        <h2 className="xb-title testimonials-heading">
                            <span>90% of our customers</span> say that their
                            focus on expanding the business has increased
                            because of Xpressbees.
                        </h2>
                        <div className="testimonials-nav">
                            <button
                                className={`testimonial-nav-btn${
                                    activeTestimonial > 0
                                        ? " testimonial-nav-btn--active"
                                        : ""
                                }`}
                                onClick={handlePrevTestimonial}
                                disabled={activeTestimonial === 0}
                                aria-label="Previous Testimonial"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="14"
                                    viewBox="0 0 16 14"
                                    fill="none"
                                >
                                    <g clipPath="url(#clip_prev)">
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M6.7 0.299805L8.1 1.6998L3.8 5.9998H16V7.9998H3.8L8.1 12.2998L6.7 13.6998L0 6.9998L6.7 0.299805Z"
                                            fill={
                                                activeTestimonial > 0
                                                    ? "#1C2433"
                                                    : "#1C2433"
                                            }
                                            fillOpacity={
                                                activeTestimonial > 0
                                                    ? "1"
                                                    : "0.4"
                                            }
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip_prev">
                                            <rect
                                                width="16"
                                                height="14"
                                                fill="white"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </button>
                            <button
                                className={`testimonial-nav-btn${
                                    activeTestimonial < testimonials.length - 1
                                        ? " testimonial-nav-btn--active"
                                        : ""
                                }`}
                                onClick={handleNextTestimonial}
                                disabled={
                                    activeTestimonial ===
                                    testimonials.length - 1
                                }
                                aria-label="Next Testimonial"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="14"
                                    viewBox="0 0 16 14"
                                    fill="none"
                                >
                                    <g clipPath="url(#clip_next)">
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M9.3 0.299805L7.9 1.6998L12.2 5.9998H0V7.9998H12.2L7.9 12.2998L9.3 13.6998L16 6.9998L9.3 0.299805Z"
                                            fill={
                                                activeTestimonial <
                                                testimonials.length - 1
                                                    ? "#1C2433"
                                                    : "#1C2433"
                                            }
                                            fillOpacity={
                                                activeTestimonial <
                                                testimonials.length - 1
                                                    ? "1"
                                                    : "0.4"
                                            }
                                        />
                                    </g>
                                    <defs>
                                        <clipPath id="clip_next">
                                            <rect
                                                width="16"
                                                height="14"
                                                fill="white"
                                            />
                                        </clipPath>
                                    </defs>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Multi-card Carousel */}
                    <div className="testimonials-carousel-wrapper">
                        <div
                            className="testimonials-track"
                            style={{
                                transform: `translateX(-${
                                    activeTestimonial * (isMobile ? 100 : 43)
                                }%)`,
                            }}
                        >
                            {testimonials.map((item, idx) => (
                                <div className="testimonial-slide" key={idx}>
                                    <div className="testimonial-card-premium">
                                        <div>
                                            <span className="testimonial-card-quote-icon">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="48"
                                                    height="32"
                                                    viewBox="0 0 48 32"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M14.7078 32L24.171 3.9278L14.7078 0L0 26.5704L14.7078 32ZM38.5368 32L48 3.9278L38.5368 0L23.829 26.5704L38.5368 32Z"
                                                        fill="#FF8246"
                                                    />
                                                </svg>
                                            </span>
                                            <p className="testimonial-text-premium">
                                                "{item.quote}"
                                            </p>
                                        </div>
                                        <div className="testimonial-profile">
                                            <img
                                                src={item.avatar}
                                                alt={item.name}
                                                className="testimonial-avatar"
                                                onError={(e) => {
                                                    e.target.src =
                                                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop";
                                                }}
                                            />
                                            <div>
                                                <h4 className="testimonial-author-name">
                                                    {item.name},
                                                </h4>
                                                <p className="testimonial-author-title">
                                                    {item.title}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats Counter Row */}
                    <div className="stats-bar-container">
                        <div className="stats-grid">
                            <div className="stat-item">
                                <span className="stat-number">
                                    <AnimatedCounter target={2} suffix=" m+" />
                                </span>
                                <span className="stat-label">
                                    Shipments processed
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    <AnimatedCounter
                                        target={4000}
                                        suffix=" +"
                                    />
                                </span>
                                <span className="stat-label">
                                    Sellers across Pan India
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    <AnimatedCounter
                                        target={19000}
                                        suffix="+"
                                        format={true}
                                    />
                                </span>
                                <span className="stat-label">
                                    Pincodes and locations
                                </span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-number">
                                    <AnimatedCounter target={26} suffix="k" />
                                </span>
                                <span className="stat-label">
                                    Next Day Delivery
                                </span>
                            </div>
                            <button className="stats-action-btn" onClick={triggerSignUp}>
                                Get Started for Free
                            </button>
                        </div>
                    </div>
                </div>

                {/* Diagonal background stripes decoration */}
                <div className="testimonials-bg-stripes">
                    <svg
                        className="stripe-svg stripe-1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="204"
                        height="296"
                        viewBox="0 0 204 296"
                        fill="none"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M0 296L148.87 130.791L87.3718 0H139.403L203.074 138.658L61.1608 296H0Z"
                            fill="url(#paint0_linear_704_7082)"
                            fillOpacity="0.26"
                        />
                        <defs>
                            <linearGradient
                                id="paint0_linear_704_7082"
                                x1="101.537"
                                y1="0"
                                x2="101.537"
                                y2="296"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="white" />
                                <stop offset="1" stopColor="#F07C00" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <svg
                        className="stripe-svg stripe-2"
                        xmlns="http://www.w3.org/2000/svg"
                        width="204"
                        height="296"
                        viewBox="0 0 204 296"
                        fill="none"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M0 296L148.87 130.791L87.3718 0H139.403L203.074 138.658L61.1608 296H0Z"
                            fill="url(#paint0_linear_704_7082_2)"
                            fillOpacity="0.26"
                        />
                        <defs>
                            <linearGradient
                                id="paint0_linear_704_7082_2"
                                x1="101.537"
                                y1="0"
                                x2="101.537"
                                y2="296"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="white" />
                                <stop offset="1" stopColor="#F07C00" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <svg
                        className="stripe-svg stripe-3"
                        xmlns="http://www.w3.org/2000/svg"
                        width="204"
                        height="296"
                        viewBox="0 0 204 296"
                        fill="none"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M0 296L148.87 130.791L87.3718 0H139.403L203.074 138.658L61.1608 296H0Z"
                            fill="url(#paint0_linear_704_7082_3)"
                            fillOpacity="0.26"
                        />
                        <defs>
                            <linearGradient
                                id="paint0_linear_704_7082_3"
                                x1="101.537"
                                y1="0"
                                x2="101.537"
                                y2="296"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop stopColor="white" />
                                <stop offset="1" stopColor="#F07C00" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </section>

            {/* ==================== FREQUENTLY ASKED QUESTIONS ==================== */}
            <section className="faq-section" id="faq">
                <div className="faq-container">
                    <div className="faq-header">
                        <h2 className="faq-title">
                            Frequently Asked <span>Questions</span>
                        </h2>
                    </div>

                    <div className="faq-list">
                        {(showAllFaqs ? faqItems : faqItems.slice(0, 4)).map(
                            (item, idx) => (
                                <div
                                    key={idx}
                                    className={`faq-item ${
                                        activeFaq === idx ? "active" : ""
                                    }`}
                                    onClick={() =>
                                        setActiveFaq(
                                            activeFaq === idx ? null : idx
                                        )
                                    }
                                >
                                    <div className="faq-question-row">
                                        <h4 className="faq-question">
                                            {item.question}
                                        </h4>
                                        <div className="faq-icon">
                                            <svg
                                                className="faq-icon-svg"
                                                width="24"
                                                height="24"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div
                                        className="faq-answer-wrapper"
                                        style={{
                                            maxHeight:
                                                activeFaq === idx
                                                    ? "200px"
                                                    : "0",
                                        }}
                                    >
                                        <p className="faq-answer">
                                            {item.answer}
                                        </p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* View More Button */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginTop: "40px",
                        }}
                    >
                        <button
                            className="xb-faq-view-btn"
                            onClick={() => setShowAllFaqs(!showAllFaqs)}
                        >
                            {showAllFaqs ? "View Less" : "View More"}
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{
                                    marginLeft: "6px",
                                    transform: showAllFaqs
                                        ? "rotate(90deg)"
                                        : "rotate(0deg)",
                                    transition: "transform 0.2s ease",
                                }}
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* ==================== CTA SECTION ==================== */}
            <section className="cta-section">
                <div className="landing-container">
                    <div className="cta-card">
                        <div className="cta-content">
                            <h2 className="cta-title">
                                Ready to Scale Your
                                <br />
                                Shipping Operations?
                            </h2>
                            <p className="cta-subtitle">
                                Join 4,000+ sellers who trust XpressBees for
                                their daily logistics. Sign up today and get
                                your first 5 shipments at discounted rates.
                            </p>
                            <div className="cta-buttons" style={{ justifyContent: "center" }}>
                                <button className="cta-btn cta-btn-dark" onClick={triggerSignUp}>
                                    Start Shipping Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ==================== FOOTER ==================== */}
            <footer className="xb-footer">
                <div className="landing-container">
                    <div className="xb-footer-grid">
                        {/* Brand info column */}
                        <div className="xb-footer-brand-col">
                            <img
                                src={cmp_logo_white}
                                alt="Xpressbees Logo"
                                className="xb-footer-logo"
                            />
                            <p className="xb-footer-desc">
                                India's leading end-to-end logistics and supply
                                chain solutions provider. Empowering eCommerce
                                sellers with technology-driven shipping.
                            </p>
                        </div>

                        {/* Solutions column */}
                        <div className="xb-footer-menu-col">
                            <h4 className="xb-footer-col-title">SOLUTIONS</h4>
                            <ul className="xb-footer-links">
                                <li>
                                    <a
                                        href="#shipping"
                                        onClick={(e) =>
                                            handleFooterLinkClick(e, "shipping")
                                        }
                                    >
                                        B2C Logistics
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#shipping"
                                        onClick={(e) =>
                                            handleFooterLinkClick(e, "shipping")
                                        }
                                    >
                                        B2B Logistics
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#shipping"
                                        onClick={(e) =>
                                            handleFooterLinkClick(e, "shipping")
                                        }
                                    >
                                        Cross Border Shipping
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#integrations"
                                        onClick={(e) =>
                                            handleFooterLinkClick(
                                                e,
                                                "integrations"
                                            )
                                        }
                                    >
                                        3PL Fulfillment
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Company column */}
                        <div className="xb-footer-menu-col">
                            <h4 className="xb-footer-col-title">COMPANY</h4>
                            <ul className="xb-footer-links">
                                <li>
                                    <a
                                        href="#dashboard"
                                        onClick={(e) =>
                                            handleFooterLinkClick(
                                                e,
                                                "dashboard"
                                            )
                                        }
                                    >
                                        About Us
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#dashboard"
                                        onClick={(e) =>
                                            handleFooterLinkClick(
                                                e,
                                                "dashboard"
                                            )
                                        }
                                    >
                                        Careers
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#dashboard"
                                        onClick={(e) =>
                                            handleFooterLinkClick(
                                                e,
                                                "dashboard"
                                            )
                                        }
                                    >
                                        Newsroom
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/support"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate("/support");
                                        }}
                                    >
                                        Contact Us
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Support column */}
                        <div className="xb-footer-menu-col">
                            <h4 className="xb-footer-col-title">SUPPORT</h4>
                            <ul className="xb-footer-links">
                                <li>
                                    <a
                                        href="#dashboard"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate("/help-center");
                                        }}
                                    >
                                        Help Center
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#integrations"
                                        onClick={(e) =>
                                            handleFooterLinkClick(
                                                e,
                                                "integrations"
                                            )
                                        }
                                    >
                                        API Documentation
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/support"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            navigate("/support");
                                        }}
                                    >
                                        Shipping Policy
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#dashboard"
                                        onClick={(e) =>
                                            handleFooterLinkClick(
                                                e,
                                                "dashboard"
                                            )
                                        }
                                    >
                                        Track Order
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom row (copyright) */}
                    <div className="xb-footer-bottom">
                        <p className="xb-footer-copy">
                            © {new Date().getFullYear()} Xpressbees. All rights
                            reserved.
                        </p>
                    </div>
                </div>
            </footer>

            {/* ==================== GLASSMORPHIC LOGIN MODAL ==================== */}
            <div
                className={`xb-modal-overlay ${showLoginModal ? "active" : ""}`}
                onClick={() => setShowLoginModal(false)}
            >
                <div
                    className="xb-modal-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="xb-modal-close-btn"
                        onClick={() => setShowLoginModal(false)}
                        aria-label="Close Modal"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>

                    <div className="login-card login_tittle w-100">
                        <div className="text-center mb-3">
                            <h5
                                className="mb-0 mt-0 xb-title-heading"
                                style={{
                                    fontSize: "20px",
                                    fontWeight: "800",
                                    color: "#1E1610",
                                }}
                            >
                                {loginMode === "otp" ? "Login / Register" : "Log In"}
                            </h5>
                            <small
                                className="text-muted"
                                style={{ fontSize: "12px" }}
                            >
                                Access your secure franchise dashboard
                            </small>
                        </div>
                        <div className="login-toggle mb-4">
                            <button
                                className={`toggle-btn ${
                                    loginMode === "otp" ? "active" : ""
                                }`}
                                onClick={() => setLoginMode("otp")}
                            >
                                OTP
                            </button>
                            <button
                                className={`toggle-btn ${
                                    loginMode === "email" ? "active" : ""
                                }`}
                                onClick={() => setLoginMode("email")}
                            >
                                Email & Password
                            </button>
                        </div>

                        {loginMode === "otp" ? (
                            <OtpLoginForm />
                        ) : (
                            <EmailLoginForm />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
