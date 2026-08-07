import React, { useState } from 'react';
import { Flame, ChefHat, ShieldAlert, KeyRound } from 'lucide-react';
import { supabaseConfiguration, getSupabaseClient, getCurrentCmsProfile } from '../supabase/supabase';

interface LoginPortalProps {
  portalType: 'cms' | 'crm';
  language: 'vi' | 'en';
  onLoginSuccess: (profile: any) => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ portalType, language, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');
    try {
      if (supabaseConfiguration.configured) {
        const { error } = await getSupabaseClient().auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        const profile = await getCurrentCmsProfile();
        if (!profile) {
          await getSupabaseClient().auth.signOut({ scope: 'local' });
          throw new Error(
            language === 'vi'
              ? 'Tài khoản chưa được kích hoạt quyền hệ thống.'
              : 'This account has not been activated for access.'
          );
        }

        // Check portal authorization
        const isCrmAuthorized = ['owner', 'admin', 'manager', 'sales'].includes(profile.role);
        const isCmsAuthorized = ['owner', 'admin', 'editor', 'translator', 'marketing'].includes(profile.role);

        if (portalType === 'crm' && !isCrmAuthorized) {
          await getSupabaseClient().auth.signOut({ scope: 'local' });
          throw new Error(
            language === 'vi'
              ? 'Tài khoản không có quyền truy cập CRM.'
              : 'This account does not have permission to access CRM.'
          );
        }

        if (portalType === 'cms' && !isCmsAuthorized) {
          await getSupabaseClient().auth.signOut({ scope: 'local' });
          throw new Error(
            language === 'vi'
              ? 'Tài khoản không có quyền truy cập CMS.'
              : 'This account does not have permission to access CMS.'
          );
        }

        onLoginSuccess(profile);
        return;
      }

      // Legacy fallback
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      const result = await response.json();
      if (!response.ok || !result.authenticated) {
        throw new Error(
          result.error ||
            (language === 'vi' ? 'Sai tài khoản hoặc mật khẩu.' : 'Invalid credentials.')
        );
      }
      
      // Seed a mock profile for legacy local fallback
      const mockProfile = {
        id: 'legacy-admin',
        email: email,
        display_name: 'System Admin (Local)',
        role: 'owner',
        status: 'active'
      };
      onLoginSuccess(mockProfile);
    } catch (reason: any) {
      setAuthError(
        reason instanceof Error
          ? reason.message
          : language === 'vi'
          ? 'Không thể kết nối máy chủ đăng nhập.'
          : 'Could not connect to the authentication server.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div style={styles.loginOverlay}>
      <div style={styles.loginCard} className="animate-fade-in">
        <div style={styles.loginHeader}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {portalType === 'crm' ? (
              <KeyRound size={24} color="var(--color-teal)" />
            ) : (
              <>
                <Flame size={24} color="var(--color-orange)" />
                <ChefHat size={24} color="var(--color-teal)" />
              </>
            )}
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-navy)', textAlign: 'center', margin: 0 }}>
            {portalType === 'crm' 
              ? (language === 'vi' ? 'Cổng Bảo Mật B2B CRM' : 'B2B CRM Security Portal')
              : (language === 'vi' ? 'Cổng Bảo Mật CMS' : 'CMS Security Portal')}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.25rem', marginBottom: 0 }}>
            {portalType === 'crm'
              ? (language === 'vi' ? 'Đăng nhập phân hệ quản trị kinh doanh' : 'Sign in to access business pipelines')
              : (language === 'vi' ? 'Đăng nhập quyền quản trị trạm cấp khí & bếp' : 'Sign in to access energy & kitchen controls')}
          </p>
        </div>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
          {authError && (
            <div style={styles.errorAlert}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <span>{authError}</span>
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{language === 'vi' ? 'Email tài khoản *' : 'Account email *'}</label>
            <input 
              type="email"
              className="form-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="admin@lng79.com.vn"
              required
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{language === 'vi' ? 'Mật khẩu *' : 'Password *'}</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          
          <button type="submit" disabled={isAuthenticating} className="btn btn-teal" style={{ width: '100%', marginTop: '0.5rem' }}>
            {isAuthenticating ? (language === 'vi' ? 'Đang xác thực…' : 'Authenticating…') : (language === 'vi' ? 'Đăng Nhập' : 'Sign In')}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  loginOverlay: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    background: 'radial-gradient(circle at 10% 20%, #070a13 0%, #111827 90%)',
    padding: '2rem 1rem',
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  loginHeader: {
    borderBottom: '1px solid #f1f5f9',
    padding: '1.75rem 1.5rem 1.25rem 1.5rem',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#B91C1C',
    padding: '0.75rem 1rem',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.8rem',
    lineHeight: '1.25rem',
  },
} as const;
