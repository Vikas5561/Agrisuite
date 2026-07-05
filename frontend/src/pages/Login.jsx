import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wheat, Lock, Mail, Eye, EyeOff, ShieldCheck, CheckCircle2, ChevronRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or connection issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#040d08',
      color: '#f3f4f6',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden'
    }}>
      {/* LEFT PANEL: MNC Branding and feature listing */}
      {!isMobile && (
        <div style={{
          flex: '1.2',
          background: 'radial-gradient(circle at 30% 30%, #0c2016 0%, #030805 100%)',
          padding: '4rem 5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(255,255,255,0.03)',
          position: 'relative'
        }}>
          {/* Subtle glowing orb */}
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: '300px',
            height: '300px',
            background: 'var(--accent-glow)',
            filter: 'blur(100px)',
            opacity: 0.15,
            pointerEvents: 'none'
          }} />

          {/* Logo & Slogan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--accent-glow)',
              color: 'var(--accent-primary)',
              padding: '0.6rem',
              borderRadius: '12px'
            }}>
              <Wheat size={26} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px' }}>SoftEdgeX AgriSuite</span>
          </div>

          {/* Core USP Content */}
          <div style={{ margin: '3rem 0' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: 'var(--accent-secondary)',
              background: 'rgba(245, 158, 11, 0.08)',
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              border: '1px solid rgba(245,158,11,0.15)'
            }}>
              Enterprise Grade Retail Cloud
            </span>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2, margin: '1.25rem 0 1.5rem 0', color: '#ffffff' }}>
              The Intelligent Operating System for Agriculture Retailers.
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              Empowering pesticide, seed, and fertilizer dealers with real-time billing, credit udhar tracking, agronomy advisory field visits, and automatic WhatsApp customer alerts.
            </p>

            {/* List items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { title: 'Partial Payments (Udhar / Credit Book)', desc: 'Farmers pay what they can today; the rest splits to a secure credit book instantly.' },
                { title: 'Crop Advisory & Field Visit Verifications', desc: 'Owner logs visits directly or verifies staff completions before recording timeline updates.' },
                { title: 'Pre-Resolved WhatsApp Dispatch Messages', desc: 'No manual typing. Templates fetch customer and retail details automatically.' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '0.15rem' }} />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secure details tag */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} style={{ color: 'var(--accent-primary)' }} />
            <span>MNC compliant security protocols, ISO 27001 data isolation & backup active.</span>
          </div>
        </div>
      )}

      {/* RIGHT PANEL: Auth Screen */}
      <div style={{
        flex: isMobile ? '1' : '0.8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: '#030805',
        position: 'relative'
      }}>
        {/* Subtle glow for mobile header */}
        {isMobile && (
          <div style={{
            position: 'absolute',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            maxWidth: '440px',
            padding: '2rem 0 0 0',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Wheat size={24} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>SoftEdgeX AgriSuite</span>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '440px',
            padding: '3rem 2.5rem',
            border: '1px solid var(--border-glass)',
            background: 'rgba(255, 255, 255, 0.01)',
            borderRadius: '20px'
          }}
        >
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 850, letterSpacing: '-0.5px', color: '#ffffff' }}>Sign In</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Enter your corporate credentials to access your store workspace
            </p>
          </div>

          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: 'var(--error)',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username or Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="text"
                  required
                  className="input-field"
                  style={{ paddingLeft: '2.75rem', height: '46px', background: '#0a100c' }}
                  placeholder="Enter login code or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 0 }}>Password</label>
                <Link to="/forgot-password" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                  Forgot Password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="input-field"
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem', height: '46px', background: '#0a100c' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '2rem',
              fontSize: '0.85rem'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: 'var(--accent-primary)', borderRadius: '4px' }} />
                Keep me signed in for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', height: '48px', fontSize: '0.95rem' }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ChevronRight size={16} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.5px' }}>
            © {new Date().getFullYear()} SoftEdgex Technologies. All rights reserved.
          </div>
        </motion.div>
      </div>
    </div>
  );
};
