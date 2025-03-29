import React, { useState, useEffect } from 'react';
import './App.css'; // Assuming you might have some base styles here
import { GiHamburgerMenu } from 'react-icons/gi'; // Hamburger icon
import { AiOutlineClose } from 'react-icons/ai';  // Close icon

function App() {
  const [originalImage, setOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu

  // Close mobile menu if window resizes to desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when a link is clicked (optional but good UX)
  const handleNavLinkClick = () => {
    if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset state for new upload
    setOriginalImage(URL.createObjectURL(file));
    setOriginalSize(file.size);
    setCompressedImage(null);
    setCompressedSize(0);
    setLoading(true);
    setIsMobileMenuOpen(false); // Close menu on action

    const formData = new FormData();
    formData.append('image', file);

    try {
      // Replace with your actual backend endpoint if different
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch('${backendUrl}/compress', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const blob = await response.blob();
      const compressedUrl = URL.createObjectURL(blob);
      const compressedFileSize = blob.size;

      setCompressedImage(compressedUrl);
      setCompressedSize(compressedFileSize);

      // Trigger automatic download
      const link = document.createElement('a');
      link.href = compressedUrl;
      // Ensure filename includes extension if possible, fallback otherwise
      const extension = file.name.split('.').pop();
      const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
      link.download = extension ? `compressed-${baseName}.${extension}` : `compressed-${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URLs after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(originalImage); // Revoke previous if exists
        URL.revokeObjectURL(compressedUrl); // Revoke newly created
      }, 100); // Adjust delay if needed

    } catch (err) {
      console.error('Compression failed:', err.message, err);
      alert('Compression failed. Check console or ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCompressedImage = () => {
    if (!compressedImage) return;
    const link = document.createElement('a');
    link.href = compressedImage;
    // Try to determine a reasonable download name
    const originalFileName = originalImage ? originalImage.split('/').pop() : 'image';
    link.download = `compressed-${originalFileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const compressionPercentage = originalSize > 0 && compressedSize > 0
    ? Math.max(0, (100 - (compressedSize / originalSize) * 100)).toFixed(1)
    : 0;

  // Cleanup Object URLs on component unmount
  useEffect(() => {
    return () => {
      if (originalImage) URL.revokeObjectURL(originalImage);
      if (compressedImage) URL.revokeObjectURL(compressedImage);
    };
  }, [originalImage, compressedImage]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      fontFamily: "'Arial', sans-serif", // Consider using a more modern font stack
      color: 'white',
      position: 'relative',
      overflowX: 'hidden', // Prevent horizontal scroll
    }}>
      {/* Animated Background Elements (Consider performance impact on low-end devices) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        overflow: 'hidden', zIndex: 0, pointerEvents: 'none' // Make sure they don't interfere
      }}>
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(103, 58, 183, 0.4), rgba(103, 58, 183, 0))', top: '5%', right: '-100px', filter: 'blur(50px)', animation: 'float 15s ease-in-out infinite alternate' }}></div>
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(233, 30, 99, 0.25), rgba(233, 30, 99, 0))', bottom: '10%', left: '-150px', filter: 'blur(60px)', animation: 'float 18s ease-in-out infinite alternate-reverse' }}></div>
        <div style={{ position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(33, 150, 243, 0.3), rgba(33, 150, 243, 0))', top: '30%', left: '10%', filter: 'blur(40px)', animation: 'float 12s ease-in-out infinite' }}></div>
        {/* Add more shapes if desired, but be mindful of performance */}
      </div>

      {/* Main Content Container */}
      <div style={{
        position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', minHeight: '100vh', width: '100%',
      }}>

        {/* === Navbar === */}
        <nav style={{
          width: '100%',
          padding: '16px clamp(16px, 5vw, 32px)', // Responsive padding
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'rgba(25, 25, 45, 0.6)', // Slightly darker, less transparent
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)', // Softer shadow
          zIndex: 1000, // Ensure it's above other content
        }}>
          {/* Logo and Title */}
            <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img
                src="/icon.ico" // Path relative to the public folder root
                alt="CompressQuick Logo"
                style={{
                  width: '36px',      // Keep the original size
                  height: '36px',     // Keep the original size
                  borderRadius: '12px', // Keep the original rounding
                  objectFit: 'contain', // Ensures the icon fits well
                  boxShadow: '0 7px 30px rgba(248, 87, 166, 0.3)', // Keep the original shadow
                  // Note: background, color, font styles etc. are removed as they don't apply to <img>
                }}
              />

              {/* Keep the h2 title */}
              <h2 style={{
                background: 'linear-gradient(135deg, #fff, #ddd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '700', fontSize: 'clamp(1.2rem, 4vw, 1.4rem)',
                margin: 0, letterSpacing: '0.5px',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              }}>
                CompressQuick
              </h2>
            </a>

          {/* Mobile Menu Button */}
          <div className="mobile-menu-button" onClick={toggleMobileMenu} style={{
            cursor: 'pointer', display: 'none', // Hidden by default, shown via CSS
            fontSize: '1.8rem', zIndex: 1100, // Above the slide-out menu background
            color: 'rgba(255, 255, 255, 0.9)',
          }}>
            {isMobileMenuOpen ? <AiOutlineClose /> : <GiHamburgerMenu />}
          </div>

          {/* Navigation Links */}
          <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`} style={{
             // Base styles for desktop flex layout are here
             display: 'flex', // This gets overridden by CSS for mobile
             gap: 'clamp(15px, 4vw, 25px)', // Responsive gap
          }}>
            <a href="#features" className="nav-link" onClick={handleNavLinkClick} style={{ color: 'rgba(255, 255, 255, 0.85)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.3s', padding: '8px 5px' }}>
              Features
              <span className="nav-link-underline"></span>
            </a>
            <a href="#how-it-works" className="nav-link" onClick={handleNavLinkClick} style={{ color: 'rgba(255, 255, 255, 0.85)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.3s', padding: '8px 5px' }}>
              How it Works
              <span className="nav-link-underline"></span>
            </a>
            <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="nav-link" onClick={handleNavLinkClick} style={{ color: 'rgba(255, 255, 255, 0.85)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.3s', padding: '8px 5px' }}>
              GitHub {/* Replace with your actual GitHub link */}
              <span className="nav-link-underline"></span>
            </a>
          </div>
        </nav>

        {/* === Hero Section === */}
        <main style={{
          width: '100%',
          padding: 'clamp(40px, 10vh, 80px) clamp(16px, 5vw, 32px) clamp(60px, 12vh, 100px)', // Responsive padding
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center', position: 'relative',
          overflow: 'hidden', // Clip the gradient animation
        }}>
          {/* Animated Gradient Background for Hero */}
          <div style={{
            position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%',
            background: 'linear-gradient(45deg, rgba(103, 58, 183, 0.2), rgba(33, 150, 243, 0.2), rgba(233, 30, 99, 0.2), rgba(103, 58, 183, 0.2))',
            backgroundSize: '400% 400%', filter: 'blur(60px)', opacity: '0.5',
            animation: 'gradientBG 15s ease infinite', zIndex: '-1',
          }}></div>

          {/* === Embedded Styles (Including Responsive Navbar CSS) === */}
          <style>{`
            /* General Animations */
            @keyframes gradientBG { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
            @keyframes float { 0%{transform:translateY(0px)} 50%{transform:translateY(-15px)} 100%{transform:translateY(0px)} }
            @keyframes pulse { 0%{transform:scale(1)} 50%{transform:scale(1.03)} 100%{transform:scale(1)} }
            @keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }

            /* Link Underline Effect */
            .nav-link { position: relative; }
            .nav-link-underline {
              position: absolute; bottom: 0; left: 0; width: 0%; height: 2px;
              background: linear-gradient(90deg, #ff6b6b, #f857a6);
              transition: width 0.3s ease;
            }
            .nav-link:hover .nav-link-underline,
            .nav-link:focus .nav-link-underline { /* Added focus for accessibility */
              width: 100%;
            }
            .nav-link:hover, .nav-link:focus { /* Added focus style */
               color: white;
               outline: none; /* Remove default focus outline if customizing */
            }


            /* Button Hover Effects */
            .upload-btn:hover, .upload-btn:focus {
              transform: translateY(-4px);
              box-shadow: 0 10px 20px rgba(248, 87, 166, 0.4);
              outline: none;
            }
            .download-btn:hover, .download-btn:focus {
              transform: translateY(-4px);
              box-shadow: 0 10px 20px rgba(0, 230, 118, 0.4);
              outline: none;
            }

            /* Card Hover Effects */
            .image-card:hover { transform: translateY(-8px); }
            .feature-card:hover {
              transform: translateY(-6px);
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            }

            /* --- Mobile Navbar Styles --- */
            @media (max-width: 768px) {
              .nav-links {
                position: absolute;
                top: 0; /* Align to top */
                left: 0;
                width: 100%;
                height: 100vh; /* Full height overlay */
                background: rgba(15, 12, 41, 0.95); /* Darker, more opaque background */
                backdrop-filter: blur(10px);
                flex-direction: column;
                align-items: center;
                justify-content: center; /* Center links vertically */
                padding: 60px 20px 20px; /* Add padding top for close button */
                gap: 30px; /* Increase gap for vertical layout */
                display: none; /* Hidden by default */
                transform: translateX(100%); /* Start off-screen */
                transition: transform 0.3s ease-in-out, display 0.3s ease-in-out;
                z-index: 1050; /* Below the close button */
              }

              .nav-links.open {
                display: flex;
                transform: translateX(0); /* Slide in */
              }

              .nav-links a { /* Style mobile links */
                 font-size: 1.4rem;
                 color: rgba(255, 255, 255, 0.9);
              }
              .nav-links a .nav-link-underline { /* Make underline thicker on mobile */
                 height: 3px;
              }

              .mobile-menu-button {
                display: block !important; /* Force display */
              }

              /* Adjust Hero padding */
              main {
                 padding: clamp(30px, 8vh, 60px) clamp(16px, 5vw, 24px) clamp(50px, 10vh, 80px);
              }

              /* Adjust "How it works" flex direction */
              .how-it-works-step {
                flex-direction: column !important; /* Stack icon and text */
                text-align: center;
              }
              .how-it-works-step > div:first-child { /* Margin for the number circle */
                 margin-bottom: 20px;
              }
              .how-it-works-step > div:last-child { /* Ensure text takes full width */
                 min-width: unset;
                 width: 100%;
              }

               /* Adjust Footer layout */
               footer > div {
                   flex-direction: column;
                   align-items: center;
                   text-align: center;
                   gap: 25px;
               }
               footer .footer-links {
                   gap: 20px; /* Adjust gap for vertical layout */
               }
            }
          `}</style>

          {/* Hero Content */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 6vw, 3.8rem)', // Slightly adjusted clamp
            fontWeight: '800', marginBottom: '20px',
            background: 'linear-gradient(135deg, #ff6b6b, #f857a6, #18FFFF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textShadow: '0px 2px 4px rgba(0,0,0,0.15)', letterSpacing: '0.5px',
            maxWidth: '900px', // Limit width
          }}>
            Compress Your Images <br />Without Losing Quality
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', // Responsive paragraph
            color: 'rgba(255, 255, 255, 0.8)', maxWidth: '700px',
            marginBottom: '40px', lineHeight: '1.6',
            textShadow: '0 1px 5px rgba(0, 0, 0, 0.2)',
          }}>
            Reduce file sizes significantly while preserving visual clarity. Perfect for web performance, social media, and faster sharing.
          </p>

          {/* Upload Area */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '15px', width: '100%', maxWidth: '450px', // Limit width
            position: 'relative',
          }}>
            <input
              type="file" accept="image/jpeg, image/png, image/gif, image/webp" // Be specific
              onChange={handleImageUpload} id="imageInput"
              style={{ display: 'none' }}
              aria-label="Upload Image" // Accessibility
            />
            <label htmlFor="imageInput" className="upload-btn" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', // Use flex for icon+text
              gap: '12px', // Gap between icon and text
              padding: '16px 32px', // Slightly smaller padding
              background: 'linear-gradient(135deg, #ff6b6b, #f857a6)',
              color: 'white', borderRadius: '50px', cursor: 'pointer',
              fontSize: 'clamp(1.1rem, 3vw, 1.2rem)', // Responsive font size
              fontWeight: '600',
              boxShadow: '0 6px 18px rgba(248, 87, 166, 0.35)', // Adjusted shadow
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              width: '100%', maxWidth: '320px', // Limit button width
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"> {/* Slightly smaller icon */}
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 8 12 3 7 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Upload Image
            </label>
            <p style={{
              fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', // Responsive hint text
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '6px 14px', borderRadius: '15px', backdropFilter: 'blur(3px)',
            }}>
              Supports JPG, PNG, GIF, WebP
            </p>
          </div>
        </main>

        {/* === Loading Indicator === */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '40px 0', padding: '0 20px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%',
              border: '4px solid rgba(255, 255, 255, 0.2)',
              borderLeftColor: '#f857a6', borderTopColor: '#ff6b6b', // Dual color spin
              animation: 'spin 1s linear infinite', marginBottom: '20px',
            }}></div>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.2rem', fontWeight: '500' }}>
              Compressing... Please wait
            </p>
          </div>
        )}

        {/* === Image Display Area === */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 'clamp(20px, 5vw, 40px)', // Responsive gap
          justifyContent: 'center', width: '100%', maxWidth: '1100px', // Container width
          padding: '0 clamp(16px, 5vw, 32px)', // Responsive padding
          marginBottom: '60px',
        }}>
          {/* Original Image Card */}
          {originalImage && (
            <div className="image-card" style={{
              background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
              borderRadius: '16px', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px',
              width: '100%', maxWidth: '420px', // Max card width
              textAlign: 'center', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              position: 'relative', overflow: 'hidden', flex: '1 1 300px' // Flex grow/shrink
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #ff6b6b, #f857a6)' }}></div>
              <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.3rem', fontWeight: '600' }}>Original</h3>
              <div style={{ width: '100%', height: '250px', overflow: 'hidden', borderRadius: '12px', marginBottom: '15px', backgroundColor: 'rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={originalImage} alt="Original Uploaded" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.15)', padding: '10px 18px', borderRadius: '25px' }}>
                <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
                  Size: {(originalSize / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          {/* Compressed Image Card */}
          {compressedImage && (
            <div className="image-card" style={{
              background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
              borderRadius: '16px', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px',
              width: '100%', maxWidth: '420px', // Max card width
              textAlign: 'center', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              position: 'relative', overflow: 'hidden', flex: '1 1 300px' // Flex grow/shrink
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #00E676, #1DE9B6)' }}></div>
              <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1.3rem', fontWeight: '600' }}>Compressed</h3>
              <div style={{ width: '100%', height: '250px', overflow: 'hidden', borderRadius: '12px', marginBottom: '15px', backgroundColor: 'rgba(0, 0, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={compressedImage} alt="Compressed Result" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.15)', padding: '10px 18px', borderRadius: '25px' }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.1rem', fontWeight: '500', margin: 0 }}>
                    Size: {(compressedSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div style={{ background: 'rgba(0, 230, 118, 0.15)', padding: '10px 18px', borderRadius: '25px', animation: 'pulse 2.5s infinite ease-in-out' }}>
                  <p style={{ color: '#00E676', fontSize: '1.1rem', fontWeight: '700', margin: 0, textShadow: '0 0 8px rgba(0, 230, 118, 0.4)' }}>
                    {compressionPercentage}% Savings!
                  </p>
                </div>
              </div>
              <button onClick={downloadCompressedImage} className="download-btn" style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px 24px', background: 'linear-gradient(135deg, #00E676, #1DE9B6)',
                color: '#1a2a3a', border: 'none', borderRadius: '30px', cursor: 'pointer',
                fontSize: '1rem', fontWeight: '700', // Dark text on light green
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                boxShadow: '0 6px 18px rgba(0, 230, 118, 0.3)', width: '80%', // Slightly less width
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#1a2a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7 10 12 15 17 10" stroke="#1a2a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="#1a2a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download Again
              </button>
            </div>
          )}
        </div>

        {/* === Features Section (Only show if no images are loaded) === */}
        {!originalImage && !loading && (
          <section id="features" style={{
            width: '100%', maxWidth: '1200px',
            padding: '60px clamp(16px, 5vw, 32px)', marginTop: '40px',
          }}>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', textAlign: 'center', marginBottom: '50px',
              color: 'white', fontWeight: '700', letterSpacing: '1px',
              background: 'linear-gradient(135deg, #fff, #ddd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Why Choose CompressQuick?
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', // Responsive grid
              gap: 'clamp(20px, 4vw, 30px)', width: '100%',
            }}>
              {/* Feature Cards - Add more or modify as needed */}
              {[
                { title: 'Lightning Fast', desc: 'Compress images in seconds. Our efficient algorithms work quickly without sacrificing quality.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, gradient: 'linear-gradient(135deg, #ff6b6b, #f857a6)', shadowColor: 'rgba(248, 87, 166, 0.3)' },
                { title: 'Quality Preserved', desc: 'Achieve significant size reduction with minimal visual impact using smart lossy compression.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 12.5l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, gradient: 'linear-gradient(135deg, #00E676, #1DE9B6)', shadowColor: 'rgba(0, 230, 118, 0.3)' },
                { title: 'Multiple Formats', desc: 'Supports all popular image types including JPG, PNG, GIF, and WebP for versatile use.', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 4v16H4V4h16zm-2 2H6v12h12V6z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 10h-4v4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, gradient: 'linear-gradient(135deg, #18FFFF, #00B0FF)', shadowColor: 'rgba(0, 176, 255, 0.3)' }
              ].map((feature, index) => (
                <div key={index} className="feature-card" style={{
                  background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
                  borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '25px', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.1)', display: 'flex',
                  flexDirection: 'column', alignItems: 'flex-start',
                }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: feature.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', boxShadow: `0 6px 12px ${feature.shadowColor}` }}>
                    {feature.icon}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', color: 'white', marginBottom: '10px', fontWeight: '600' }}>{feature.title}</h3>
                  <p style={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: '1.6', margin: 0 }}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === How It Works Section (Only show if no images are loaded) === */}
        {!originalImage && !loading && (
           <section id="how-it-works" style={{
                width: '100%', maxWidth: '1000px',
                padding: '60px clamp(16px, 5vw, 32px) 80px', // Added bottom padding
            }}>
             <h2 style={{
               fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', textAlign: 'center', marginBottom: '60px',
               color: 'white', fontWeight: '700', letterSpacing: '1px',
               background: 'linear-gradient(135deg, #fff, #ddd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
             }}>
               How It Works
             </h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '50px', width: '100%' }}>
               {[
                 { num: 1, title: "Upload Image", desc: "Drag & drop or click to select JPG, PNG, GIF, or WebP files from your device.", gradient: 'linear-gradient(135deg, #ff6b6b, #f857a6)', shadowColor: 'rgba(248, 87, 166, 0.3)', reverse: false },
                 { num: 2, title: "Automatic Compression", desc: "Our smart algorithms analyze and apply optimal compression settings instantly.", gradient: 'linear-gradient(135deg, #00E676, #1DE9B6)', shadowColor: 'rgba(0, 230, 118, 0.3)', reverse: true },
                 { num: 3, title: "Download & Use", desc: "Your optimized image downloads automatically, ready for web, social media, or sharing.", gradient: 'linear-gradient(135deg, #18FFFF, #00B0FF)', shadowColor: 'rgba(0, 176, 255, 0.3)', reverse: false }
               ].map((step) => (
                 <div key={step.num} className="how-it-works-step" style={{ display: 'flex', alignItems: 'center', gap: '30px', flexDirection: step.reverse ? 'row-reverse' : 'row' }}>
                   <div style={{
                     width: 'clamp(80px, 15vw, 100px)', height: 'clamp(80px, 15vw, 100px)',
                     borderRadius: '24px', background: step.gradient, display: 'flex',
                     alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                     boxShadow: `0 8px 18px ${step.shadowColor}`,
                   }}>
                     <div style={{ fontSize: 'clamp(2rem, 6vw, 2.8rem)', fontWeight: '700', color: 'white', lineHeight: 1 }}>{step.num}</div>
                   </div>
                   <div style={{ flex: '1', minWidth: '250px' }}>
                     <h3 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.6rem)', color: 'white', marginBottom: '10px', fontWeight: '600' }}>{step.title}</h3>
                     <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1rem)', color: 'rgba(255, 255, 255, 0.8)', lineHeight: '1.7', margin: 0 }}>{step.desc}</p>
                   </div>
                 </div>
               ))}
             </div>
           </section>
         )}

        {/* === Footer === */}
        <footer style={{
          width: '100%', padding: '30px clamp(16px, 5vw, 32px)',
          background: 'rgba(15, 12, 41, 0.5)', // Match dark background tone
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          marginTop: 'auto', // Push footer to bottom
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap', gap: '20px',
          }}>
            {/* Footer Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               {/* Replace this div... */}
               {/* <div style={{
                 width: '30px', height: '30px', borderRadius: '10px',
                 background: 'linear-gradient(135deg, #ff6b6b, #f857a6)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 color: 'white', fontWeight: 'bold', fontSize: '14px',
               }}>PS</div> */}

               {/* ...with this img tag: */}
               <img
                 src="/icon.ico" // Path relative to the public folder root
                 alt="CompressQuick Logo"
                 style={{
                   width: '30px',      // Keep the original size
                   height: '30px',     // Keep the original size
                   objectFit: 'contain', // Ensures the icon fits well
                   // Optional: Add a slight border radius if you like
                   // borderRadius: '6px',
                 }}
               />

               {/* Keep the text span */}
               <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600', fontSize: '1.1rem' }}>
                  CompressQuick
               </span>
            </div>
             {/* Footer Links */}
             <div className="footer-links" style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', justifyContent: 'center' }}>
               {/* Add actual links later */}
               <a href="#" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Privacy</a>
               <a href="#" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Terms</a>
               <a href="#" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Contact</a>
             </div>
            {/* Copyright */}
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', margin: 0, fontSize: '0.85rem', textAlign: 'center', width: '100%', order: 3 }}> {/* Ensure copyright is last on mobile */}
              © {new Date().getFullYear()} CompressQuick. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div> {/* End Main Content Container */}
    </div>
  );
}

export default App;
