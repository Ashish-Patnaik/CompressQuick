import React, { useState, useEffect } from 'react';
import './App.css'; // Assuming you might have some base styles here
import { GiHamburgerMenu } from 'react-icons/gi'; // Hamburger icon
import { AiOutlineClose } from 'react-icons/ai';  // Close icon

function App() {
  const [originalImage, setOriginalImage] = useState(null); // Will hold blob URL
  const [compressedImage, setCompressedImage] = useState(null); // Will hold blob URL
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [originalFileName, setOriginalFileName] = useState(''); // Store original filename

  // Close mobile menu if window resizes to desktop view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) { // Only close if open
        setIsMobileMenuOpen(false);
         document.body.classList.remove('mobile-menu-active'); // Ensure body scroll is re-enabled
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]); // Add dependency

  // Toggle mobile menu and body class for scroll lock
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (!isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-active');
    } else {
      document.body.classList.remove('mobile-menu-active');
    }
  };

  // Close mobile menu when a link is clicked
  const handleNavLinkClick = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      document.body.classList.remove('mobile-menu-active'); // Remove class on link click
    }
  }

  // Image Upload Handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

     // Basic type check client-side (optional but good UX)
     const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
     if (!acceptedTypes.includes(file.type)) {
         alert(`Unsupported file type: ${file.type}. Please upload JPG, PNG, GIF, or WebP.`);
         return;
     }

     // Size check client-side (optional) - align with server limit (10MB)
     if (file.size > 10 * 1024 * 1024) {
         alert('File is too large. Maximum size is 10MB.');
         return;
     }

    // Create Object URL immediately for display
    const objectUrl = URL.createObjectURL(file);
    setOriginalImage(objectUrl); // Use the created URL
    setOriginalSize(file.size);
    setOriginalFileName(file.name); // Store filename for download
    setCompressedImage(null); // Clear previous compressed image
    setCompressedSize(0);
    setLoading(true);
    setIsMobileMenuOpen(false); // Close menu on action
    document.body.classList.remove('mobile-menu-active'); // Ensure scroll unlocked on action

    const formData = new FormData();
    formData.append('image', file);

    // --- CORRECTED URL CONSTRUCTION ---
    const backendUrl = import.meta.env.VITE_BACKEND_URL; // Access VITE_ variable

    console.log("VITE_BACKEND_URL:", backendUrl); // Check if the variable is loaded

    if (!backendUrl) {
      console.error("ERROR: VITE_BACKEND_URL is not defined. Make sure it's set in Vercel Environment Variables and prefixed with VITE_.");
      alert("Configuration error: Cannot connect to the backend service.");
      setLoading(false);
      // Clean up the originally created Object URL if fetch fails early
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setOriginalImage(null); // Reset image display
      setOriginalSize(0);
      setOriginalFileName('');
      return; // Stop execution
    }

    const fetchUrl = `${backendUrl}/compress`; // Use backticks for interpolation
    console.log("Attempting to fetch:", fetchUrl);
    // --- END CORRECTION ---

    let compressedObjectUrl = null; // Define here to use in finally if needed

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server responded with status: ${response.status}. Body: ${errorText}`);
        // Check for specific backend error messages if possible
        if (errorText.includes('File size limit exceeded')) {
            throw new Error('File size limit exceeded (max 10MB).');
        }
        throw new Error(`Server Error: ${response.status}. ${errorText || 'Failed to compress image.'}`);
      }

      const blob = await response.blob();
      compressedObjectUrl = URL.createObjectURL(blob); // Create blob URL for compressed image
      const compressedFileSize = blob.size;

      setCompressedImage(compressedObjectUrl);
      setCompressedSize(compressedFileSize);

      // Trigger automatic download
      const link = document.createElement('a');
      link.href = compressedObjectUrl;
      const extension = originalFileName.split('.').pop();
      const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.') > 0 ? originalFileName.lastIndexOf('.') : originalFileName.length);
      link.download = extension ? `compressed-${baseName}.${extension}` : `compressed-${baseName || 'image'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Object URLs are now primarily cleaned up by the useEffect hook

    } catch (err) {
      console.error('Compression failed:', err); // Log the full error
      let userMessage = 'Compression failed. Please try again later.';
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
           userMessage = 'Could not connect to the compression service. Please check your internet connection.';
      } else if (err.message.includes('Server Error')) {
          userMessage = `Compression failed: ${err.message}`;
      } else if (err.message.includes('File size limit exceeded')) {
          userMessage = 'Upload failed: The image is too large (max 10MB).';
      } else if (err.message.includes('Unsupported file type')) {
          userMessage = `Upload failed: ${err.message}`;
      }
      alert(userMessage);

      // Clean up the original image if compression failed
       if (objectUrl) URL.revokeObjectURL(objectUrl);
       setOriginalImage(null);
       setOriginalSize(0);
       setOriginalFileName('');
       // Ensure any potential compressed URL is also cleaned if error happened after its creation but before state update
       if (compressedObjectUrl) URL.revokeObjectURL(compressedObjectUrl);
       setCompressedImage(null);
       setCompressedSize(0);


    } finally {
      setLoading(false);
    }
  };

  // Download Handler (uses state)
  const downloadCompressedImage = () => {
    if (!compressedImage) return; // compressedImage holds the blob URL
    const link = document.createElement('a');
    link.href = compressedImage;

    // Use the stored original filename to create a better download name
    const extension = originalFileName.split('.').pop();
    const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.') > 0 ? originalFileName.lastIndexOf('.') : originalFileName.length);
    link.download = extension ? `compressed-${baseName}.${extension}` : `compressed-${baseName || 'image'}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compression Percentage Calculation
  const compressionPercentage = originalSize > 0 && compressedSize > 0
    ? Math.max(0, (100 - (compressedSize / originalSize) * 100)).toFixed(1)
    : 0;

  // Effect for Cleaning Up Object URLs
  useEffect(() => {
    const currentOriginalUrl = originalImage;
    const currentCompressedUrl = compressedImage;

    // Return a cleanup function that will be called:
    // 1. When the component unmounts
    // 2. Before the effect runs again (due to dependency changes)
    return () => {
      if (currentOriginalUrl) {
        // console.log("Revoking original URL:", currentOriginalUrl);
        URL.revokeObjectURL(currentOriginalUrl);
      }
      if (currentCompressedUrl) {
        // console.log("Revoking compressed URL:", currentCompressedUrl);
        URL.revokeObjectURL(currentCompressedUrl);
      }
    };
    // Dependencies: Run effect if either image URL changes
  }, [originalImage, compressedImage]);


  // --- JSX Structure ---
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      fontFamily: "'Arial', sans-serif",
      color: 'white',
      position: 'relative',
      overflowX: 'hidden', // Prevent horizontal scroll only if needed
    }}>
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        overflow: 'hidden', zIndex: 0, pointerEvents: 'none'
      }}>
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(103, 58, 183, 0.4), rgba(103, 58, 183, 0))', top: '5%', right: '-100px', filter: 'blur(50px)', animation: 'float 15s ease-in-out infinite alternate' }}></div>
        <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(233, 30, 99, 0.25), rgba(233, 30, 99, 0))', bottom: '10%', left: '-150px', filter: 'blur(60px)', animation: 'float 18s ease-in-out infinite alternate-reverse' }}></div>
        <div style={{ position: 'absolute', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(33, 150, 243, 0.3), rgba(33, 150, 243, 0))', top: '30%', left: '10%', filter: 'blur(40px)', animation: 'float 12s ease-in-out infinite' }}></div>
      </div>

      {/* Main Content Container */}
      <div style={{
        position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', minHeight: '100vh', width: '100%',
      }}>

        {/* === Navbar === */}
        <nav style={{
          width: '100%',
          padding: '16px clamp(16px, 5vw, 32px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: 'rgba(25, 25, 45, 0.6)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          zIndex: 1000,
        }}>
          {/* Logo and Title */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img
              src="/icon.ico" // Path from public folder
              alt="CompressQuick Logo"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                objectFit: 'contain',
                boxShadow: '0 7px 30px rgba(248, 87, 166, 0.3)',
              }}
            />
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
            cursor: 'pointer', display: 'none',
            fontSize: '1.8rem', zIndex: 1100, // Ensure button is above overlay
            color: 'rgba(255, 255, 255, 0.9)',
            position: 'relative', // Needed for z-index
          }}>
            {isMobileMenuOpen ? <AiOutlineClose /> : <GiHamburgerMenu />}
          </div>

          {/* Navigation Links */}
          <div className={`nav-links ${isMobileMenuOpen ? 'open' : ''}`} style={{
             // Base styles removed, controlled by CSS below
             gap: 'clamp(15px, 4vw, 25px)', // Keep gap for desktop
          }}>
            {/* Links */}
            <a href="#features" className="nav-link" onClick={handleNavLinkClick} style={{ color: 'rgba(255, 255, 255, 0.85)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.3s', padding: '8px 5px' }}>
              Features
              <span className="nav-link-underline"></span>
            </a>
            <a href="#how-it-works" className="nav-link" onClick={handleNavLinkClick} style={{ color: 'rgba(255, 255, 255, 0.85)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.3s', padding: '8px 5px' }}>
              How it Works
              <span className="nav-link-underline"></span>
            </a>
            <a href="https://github.com/Sankalp-Srivastava-07/CompressQuick-Frontend" target="_blank" rel="noopener noreferrer" className="nav-link" onClick={handleNavLinkClick} style={{ color: 'rgba(255, 255, 255, 0.85)', textDecoration: 'none', fontWeight: '500', transition: 'color 0.3s', padding: '8px 5px' }}>
              GitHub
              <span className="nav-link-underline"></span>
            </a>
          </div>
        </nav>

        {/* === Hero Section === */}
        <main style={{
          width: '100%',
          padding: 'clamp(40px, 10vh, 80px) clamp(16px, 5vw, 32px) clamp(60px, 12vh, 100px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', textAlign: 'center', position: 'relative',
          overflow: 'hidden', flexGrow: 1, // Allow main to grow
        }}>
          {/* Animated Gradient Background for Hero */}
          <div style={{
            position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%',
            background: 'linear-gradient(45deg, rgba(103, 58, 183, 0.2), rgba(33, 150, 243, 0.2), rgba(233, 30, 99, 0.2), rgba(103, 58, 183, 0.2))',
            backgroundSize: '400% 400%', filter: 'blur(60px)', opacity: '0.5',
            animation: 'gradientBG 15s ease infinite', zIndex: '-1',
          }}></div>

          {/* === Embedded Styles === */}
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
            .nav-link:focus .nav-link-underline { width: 100%; }
            .nav-link:hover, .nav-link:focus { color: white; outline: none; }

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

            /* Body class for scroll lock */
             body.mobile-menu-active {
               overflow: hidden;
             }

            /* --- DESKTOP Navbar Styles --- */
             .nav-links {
                display: flex; /* Default for desktop */
                align-items: center;
             }
             .mobile-menu-button {
                display: none; /* Hidden on desktop */
             }


            /* --- MOBILE Navbar Styles --- */
            @media (max-width: 768px) {
              .nav-links {
                position: fixed; /* Cover viewport */
                top: 0;
                left: 0;
                width: 100%;
                height: 100%; /* Full height */
                background: rgba(15, 12, 41, 0.95);
                backdrop-filter: blur(10px);
                flex-direction: column; /* Stack links vertically */
                align-items: center;
                justify-content: center;
                padding: 60px 20px 20px; /* Padding around links */
                gap: 30px; /* Space between links */
                transform: translateX(100%); /* Start off-screen */
                transition: transform 0.3s ease-in-out;
                z-index: 1050; /* Below menu button */
                overflow-y: auto; /* Allow scroll if needed */
                display: flex; /* Always flex, visibility controlled by transform */
              }

              .nav-links.open {
                transform: translateX(0); /* Slide in */
              }

              .nav-links a { /* Mobile link styles */
                 font-size: 1.4rem;
                 color: rgba(255, 255, 255, 0.9);
              }
              .nav-links a .nav-link-underline {
                 height: 3px; /* Thicker underline */
              }

              .mobile-menu-button {
                display: block !important; /* Show mobile button */
              }

              main { /* Adjust main padding */
                 padding: clamp(30px, 8vh, 60px) clamp(16px, 5vw, 24px) clamp(50px, 10vh, 80px);
              }

              .how-it-works-step { /* Stack "How it Works" vertically */
                flex-direction: column !important;
                text-align: center;
              }
              .how-it-works-step > div:first-child { /* Style number circle */
                 margin-bottom: 20px;
                 width: clamp(70px, 13vw, 90px);
                 height: clamp(70px, 13vw, 90px);
                 border-radius: 20px;
              }
              .how-it-works-step > div:first-child > div { /* Style number */
                 font-size: clamp(1.8rem, 5vw, 2.5rem);
              }
              .how-it-works-step > div:last-child { /* Ensure text takes full width */
                 min-width: unset;
                 width: 100%;
              }

              footer > div { /* Stack footer items vertically */
                   flex-direction: column;
                   align-items: center;
                   text-align: center;
                   gap: 25px;
               }
               footer .footer-links { /* Center footer links */
                   gap: 20px;
                   justify-content: center;
                   width: 100%;
               }
               footer p[style*="order: 3"] { /* Space above copyright */
                   margin-top: 15px;
               }
            }
          `}</style>

          {/* Hero Content */}
          <h1 style={{
            fontSize: 'clamp(2.2rem, 6vw, 3.8rem)',
            fontWeight: '800', marginBottom: '20px',
            background: 'linear-gradient(135deg, #ff6b6b, #f857a6, #18FFFF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textShadow: '0px 2px 4px rgba(0,0,0,0.15)', letterSpacing: '0.5px',
            maxWidth: '900px',
          }}>
            Compress Your Images <br />Without Losing Quality
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            color: 'rgba(255, 255, 255, 0.8)', maxWidth: '700px',
            marginBottom: '40px', lineHeight: '1.6',
            textShadow: '0 1px 5px rgba(0, 0, 0, 0.2)',
          }}>
            Reduce file sizes significantly while preserving visual clarity. Perfect for web performance, social media, and faster sharing.
          </p>

          {/* Upload Area */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '15px', width: '100%', maxWidth: '450px',
            position: 'relative',
          }}>
            <input
              type="file" accept="image/jpeg, image/png, image/gif, image/webp"
              onChange={handleImageUpload} id="imageInput"
              style={{ display: 'none' }}
              aria-label="Upload Image"
            />
            <label htmlFor="imageInput" className="upload-btn" style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              gap: '12px',
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #ff6b6b, #f857a6)',
              color: 'white', borderRadius: '50px', cursor: 'pointer',
              fontSize: 'clamp(1.1rem, 3vw, 1.2rem)',
              fontWeight: '600',
              boxShadow: '0 6px 18px rgba(248, 87, 166, 0.35)',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              width: '100%', maxWidth: '320px',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 8 12 3 7 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Upload Image
            </label>
            <p style={{
              fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '6px 14px', borderRadius: '15px', backdropFilter: 'blur(3px)',
            }}>
              Supports JPG, PNG, GIF, WebP (Max 10MB)
            </p>
          </div>
        </main>

        {/* === Loading Indicator === */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '40px 0', padding: '0 20px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%',
              border: '4px solid rgba(255, 255, 255, 0.2)',
              borderLeftColor: '#f857a6', borderTopColor: '#ff6b6b',
              animation: 'spin 1s linear infinite', marginBottom: '20px',
            }}></div>
            <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.2rem', fontWeight: '500' }}>
              Compressing... Please wait
            </p>
          </div>
        )}

        {/* === Image Display Area === */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 'clamp(20px, 5vw, 40px)',
          justifyContent: 'center', width: '100%', maxWidth: '1100px',
          padding: '0 clamp(16px, 5vw, 32px)',
          marginBottom: '60px',
        }}>
          {/* Original Image Card */}
          {originalImage && (
            <div className="image-card" style={{
              background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)',
              borderRadius: '16px', boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.1)', padding: '20px',
              width: '100%', maxWidth: '420px',
              textAlign: 'center', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              position: 'relative', overflow: 'hidden', flex: '1 1 300px'
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
              width: '100%', maxWidth: '420px',
              textAlign: 'center', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              position: 'relative', overflow: 'hidden', flex: '1 1 300px'
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
                fontSize: '1rem', fontWeight: '700',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                boxShadow: '0 6px 18px rgba(0, 230, 118, 0.3)', width: '80%',
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'clamp(20px, 4vw, 30px)', width: '100%',
            }}>
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
        {/* Corrected syntax: removed extra ')' after the closing '}' */}
        {!originalImage && !loading && (
           <section id="how-it-works" style={{
                width: '100%', maxWidth: '1000px',
                padding: '60px clamp(16px, 5vw, 32px) 80px',
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
         )} {/* <-- Only the closing curly brace */}

        {/* === Footer === */}
        <footer style={{
          width: '100%', padding: '30px clamp(16px, 5vw, 32px)',
          background: 'rgba(15, 12, 41, 0.5)',
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
               <img
                 src="/icon.ico" // Path from public folder
                 alt="CompressQuick Logo"
                 style={{
                   width: '30px',
                   height: '30px',
                   objectFit: 'contain',
                 }}
               />
               <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: '600', fontSize: '1.1rem' }}>
                  CompressQuick
               </span>
             </div>
             {/* Footer Links */}
             <div className="footer-links" style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', justifyContent: 'center' }}>
               <a href="#" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Privacy</a>
               <a href="#" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Terms</a>
               <a href="#" style={{ color: 'rgba(255, 255, 255, 0.7)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Contact</a>
             </div>
            {/* Copyright */}
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', margin: 0, fontSize: '0.85rem', textAlign: 'center', width: '100%', order: 3 }}>
              © {new Date().getFullYear()} CompressQuick. All Rights Reserved.
            </p>
          </div>
        </footer>
      </div> {/* End Main Content Container */}
    </div> // End Outermost Div
  );
}

export default App;
