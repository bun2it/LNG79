import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Users, LayoutDashboard, Calendar, ClipboardList, 
  Activity, FileText, ChevronRight, LogOut, Search, Plus, Bell, Shield,
  X, Home, FileCheck, Settings
} from 'lucide-react';
import { type CmsProfile, supabase } from '../shared/supabase/supabase';
import { LeadInbox } from './components/LeadInbox';
import { CrmCompanies } from './components/CrmCompanies';
import { CrmContacts } from './components/CrmContacts';
import { CrmPipeline } from './components/CrmPipeline';
import { CrmTasks } from './components/CrmTasks';
import { CrmCalendar } from './components/CrmCalendar';
import { CrmQuotes } from './components/CrmQuotes';
import { CrmContracts } from './components/CrmContracts';
import { CrmDashboard } from './components/CrmDashboard';
import { CrmReports } from './components/CrmReports';
import { CrmActivities } from './components/CrmActivities';
import { CrmSettings } from './components/CrmSettings';

interface CrmAppProps {
  language: 'vi' | 'en';
  userProfile: CmsProfile | null;
  onLogout: () => void;
  onExitCrm: () => void;
}

interface MenuItem {
  id: string;
  label: { vi: string; en: string };
  icon: React.ComponentType<any>;
  roleRestricted?: boolean;
}

export const CrmApp: React.FC<CrmAppProps> = ({ language, userProfile, onLogout, onExitCrm }) => {
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'inbox' | 'companies' | 'contacts' | 'pipeline' | 'tasks' | 'calendar' | 'activities' | 'quotes' | 'contracts' | 'reports' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ companies: any[]; contacts: any[]; opportunities: any[] }>({ companies: [], contacts: [], opportunities: [] });
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [triggerCreateTime, setTriggerCreateTime] = useState<{ companies?: number; contacts?: number; pipeline?: number }>({});

  // Global Search logic
  useEffect(() => {
    const client = supabase;
    if (!client || !searchQuery.trim()) {
      setSearchResults({ companies: [], contacts: [], opportunities: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const query = `%${searchQuery.trim()}%`;
        
        // 1. Search Companies
        const { data: companies } = await client
          .from('crm_companies')
          .select('id, name, company_number')
          .ilike('name', query)
          .limit(3);

        // 2. Search Contacts
        const { data: contacts } = await client
          .from('crm_contacts')
          .select('id, name, email, phone')
          .or(`name.ilike.${query},email.ilike.${query},phone.ilike.${query}`)
          .limit(3);

        // 3. Search Opportunities
        const { data: opportunities } = await client
          .from('crm_opportunities')
          .select('id, title, opportunity_number')
          .ilike('title', query)
          .limit(3);

        setSearchResults({
          companies: companies || [],
          contacts: contacts || [],
          opportunities: opportunities || []
        });
      } catch (err) {
        console.error('Error during global search:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: { vi: 'Bảng điều khiển', en: 'Dashboard' }, icon: LayoutDashboard },
    { id: 'inbox', label: { vi: 'Hộp thư Lead', en: 'Lead Inbox' }, icon: Bell },
    { id: 'companies', label: { vi: 'Doanh nghiệp', en: 'Companies' }, icon: Briefcase },
    { id: 'contacts', label: { vi: 'Người liên hệ', en: 'Contacts' }, icon: Users },
    { id: 'pipeline', label: { vi: 'Quy trình Deal', en: 'Sales Pipeline' }, icon: ChevronRight },
    { id: 'tasks', label: { vi: 'Đầu việc & Lịch hẹn', en: 'Tasks & Followups' }, icon: ClipboardList },
    { id: 'calendar', label: { vi: 'Lịch hoạt động', en: 'Calendar' }, icon: Calendar },
    { id: 'activities', label: { vi: 'Nhật ký chăm sóc', en: 'Activity Log' }, icon: Activity },
    { id: 'quotes', label: { vi: 'Báo giá', en: 'Quotations' }, icon: FileText },
    { id: 'contracts', label: { vi: 'Hợp đồng', en: 'Contracts' }, icon: FileCheck },
    { id: 'reports', label: { vi: 'Báo cáo doanh số', en: 'Sales Reports' }, icon: LayoutDashboard, roleRestricted: true },
    { id: 'settings', label: { vi: 'Cấu hình CRM', en: 'CRM Settings' }, icon: Settings },
  ];

  const isManagerOrOwner = userProfile?.account_type === 'admin' || userProfile?.account_type === 'user';

  const renderActiveView = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <CrmDashboard
            language={language}
            userProfile={userProfile}
            onNavigate={(menuId) => setActiveMenu(menuId)}
          />
        );
      case 'reports':
        return (
          <CrmReports
            language={language}
          />
        );
      case 'inbox':
        return (
          <LeadInbox 
            language={language} 
            onNavigateToDeal={(_id) => setActiveMenu('pipeline')}
            onLogAction={(msg) => console.log('CRM Log:', msg)}
          />
        );
      case 'companies':
        return (
          <CrmCompanies 
            language={language}
            onLogAction={(msg) => console.log('CRM Log:', msg)}
            triggerCreate={triggerCreateTime.companies}
          />
        );
      case 'contacts':
        return (
          <CrmContacts 
            language={language}
            onLogAction={(msg) => console.log('CRM Log:', msg)}
            triggerCreate={triggerCreateTime.contacts}
          />
        );
      case 'pipeline':
        return (
          <CrmPipeline
            language={language}
            userProfile={userProfile}
            onLogAction={(msg) => console.log('CRM Log:', msg)}
            triggerCreate={triggerCreateTime.pipeline}
          />
        );
      case 'tasks':
        return (
          <CrmTasks
            language={language}
            userProfile={userProfile}
            onLogAction={(msg) => console.log('CRM Log:', msg)}
          />
        );
      case 'calendar':
        return (
          <CrmCalendar
            language={language}
            userProfile={userProfile}
            onNavigateToTasks={() => setActiveMenu('tasks')}
          />
        );
      case 'quotes':
        return (
          <CrmQuotes
            language={language}
            userProfile={userProfile}
            onLogAction={(msg) => console.log('CRM Log:', msg)}
          />
        );
      case 'contracts':
        return (
          <CrmContracts
            language={language}
            userProfile={userProfile}
            onLogAction={(msg) => console.log('CRM Log:', msg)}
          />
        );
      case 'activities':
        return (
          <CrmActivities
            language={language}
            userProfile={userProfile}
            onLogAction={(msg) => console.log('CRM Log:', msg)}
          />
        );
      case 'settings':
        return (
          <CrmSettings
            language={language}
            userProfile={userProfile}
            onLogAction={(msg) => console.log('CRM Log:', msg)}
          />
        );
      default:
        return (
          <div style={styles.cardShell} className="animate-fade-in">
            <h2 style={styles.pageTitle}>
              {menuItems.find((m) => m.id === activeMenu)?.label[language]}
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              {language === 'vi' ? 'Mô-đun đang trong lộ trình phát triển. Vui lòng quay lại sau.' : 'Module layout is being mapped. Please check back later.'}
            </p>
            <div style={styles.placeholderContainer}>
              <Briefcase size={48} color="#e2e8f0" style={{ marginBottom: '1rem' }} />
              <h4>{language === 'vi' ? 'Đang triển khai module' : 'Module Implementation'}</h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', maxWidth: '360px', textAlign: 'center', marginTop: '0.5rem' }}>
                {language === 'vi' 
                  ? 'Giao diện đang được lập trình chi tiết cho giai đoạn tiếp theo.' 
                  : 'Interface is being carefully designed for the next stage.'}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={styles.crmContainer}>
      {/* SIDEBAR */}
      <aside style={{
        ...styles.sidebar,
        width: sidebarCollapsed ? '70px' : '260px'
      }}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logoBox}>
            <Briefcase size={20} color="var(--color-navy)" />
            {!sidebarCollapsed && <span style={styles.logoText}>LNG79 CRM</span>}
          </div>
          <button 
            style={styles.collapseBtn} 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* PROFILE INFO */}
        {!sidebarCollapsed && (
          <div style={styles.profileBox}>
            <div style={styles.avatar}>
              {(userProfile?.name || userProfile?.email || 'A')[0].toUpperCase()}
            </div>
            <div style={styles.profileMeta}>
              <div style={styles.profileName}>{userProfile?.name || 'CRM User'}</div>
              <div style={styles.profileRole}>
                {userProfile?.account_type === 'admin' ? 'System Admin' : 
                 userProfile?.company ? `${userProfile.company} (${userProfile.department || 'CRM'})` : 'CRM User'}
              </div>
            </div>
          </div>
        )}

        {/* MENU */}
        <nav style={styles.navMenu}>
          {menuItems.map((item) => {
            if (item.roleRestricted && !isManagerOrOwner) return null;
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id as any)}
                style={{
                  ...styles.menuItem,
                  backgroundColor: isActive ? 'rgba(20, 184, 166, 0.1)' : 'transparent',
                  color: isActive ? 'var(--color-teal)' : '#94a3b8',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  padding: sidebarCollapsed ? '0.75rem 0' : '0.75rem 1.25rem'
                }}
              >
                <Icon size={18} style={{ color: isActive ? 'var(--color-teal)' : '#64748b' }} />
                {!sidebarCollapsed && <span>{item.label[language]}</span>}
              </button>
            );
          })}
        </nav>

        {/* BOTTOM NAV */}
        <div style={styles.bottomNav}>
          <button 
            onClick={onExitCrm} 
            style={{
              ...styles.menuItem,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              padding: sidebarCollapsed ? '0.75rem 0' : '0.75rem 1.25rem'
            }}
          >
            <Home size={18} style={{ color: '#ffffffff' }} />
            {!sidebarCollapsed && <span style={{ color: '#8a8a8aff' }}>{language === 'vi' ? 'Quay lại Website' : 'Exit to Website'}</span>}
          </button>
          <button 
            onClick={onLogout} 
            style={{
              ...styles.logoutItem,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              padding: sidebarCollapsed ? '0.75rem 0' : '0.75rem 1.25rem'
            }}
          >
            <LogOut size={18} style={{ color: '#f43f5e' }} />
            {!sidebarCollapsed && <span>{language === 'vi' ? 'Đăng xuất' : 'Sign Out'}</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div style={styles.mainArea}>
        {/* HEADER */}
        <header style={styles.header}>
          <div style={styles.headerLeft}>
            {/* Global Search Bar */}
            <div style={styles.searchWrapper}>
              <Search size={16} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder={language === 'vi' ? 'Tìm kiếm nhanh (Công ty, Cơ hội, Người liên hệ)...' : 'Global search (Companies, Deals, Contacts)...'} 
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(e.target.value.length > 0);
                }}
                onFocus={() => setSearchQuery.length > 0 && setSearchOpen(true)}
              />
              {searchOpen && (
                <div style={styles.searchDropdown}>
                  <div style={styles.searchDropdownHeader}>
                    <span>{language === 'vi' ? 'Kết quả tìm kiếm' : 'Search Results'}</span>
                    <button style={styles.closeSearchBtn} onClick={() => setSearchOpen(false)}>×</button>
                  </div>
                  <div style={styles.searchDropdownBody}>
                    {/* Companies Section */}
                    {searchResults.companies.length > 0 && (
                      <div style={styles.searchSection}>
                        <div style={styles.searchSectionTitle}>{language === 'vi' ? 'DOANH NGHIỆP' : 'COMPANIES'}</div>
                        {searchResults.companies.map((c) => (
                          <div key={c.id} style={styles.searchItem} onClick={() => { setActiveMenu('companies'); setSearchOpen(false); }}>
                            <strong>{c.name}</strong> <small style={{ color: 'var(--color-teal)' }}>({c.company_number})</small>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Contacts Section */}
                    {searchResults.contacts.length > 0 && (
                      <div style={styles.searchSection}>
                        <div style={styles.searchSectionTitle}>{language === 'vi' ? 'LIÊN HỆ' : 'CONTACTS'}</div>
                        {searchResults.contacts.map((c) => (
                          <div key={c.id} style={styles.searchItem} onClick={() => { setActiveMenu('contacts'); setSearchOpen(false); }}>
                            <strong>{c.name}</strong> - <small>{c.phone} | {c.email}</small>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Opportunities Section */}
                    {searchResults.opportunities.length > 0 && (
                      <div style={styles.searchSection}>
                        <div style={styles.searchSectionTitle}>{language === 'vi' ? 'CƠ HỘI' : 'OPPORTUNITIES'}</div>
                        {searchResults.opportunities.map((o) => (
                          <div key={o.id} style={styles.searchItem} onClick={() => { setActiveMenu('pipeline'); setSearchOpen(false); }}>
                            <strong>{o.title}</strong> <small style={{ color: 'var(--color-teal)' }}>({o.opportunity_number})</small>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.companies.length === 0 && searchResults.contacts.length === 0 && searchResults.opportunities.length === 0 && (
                      <div style={styles.noSearch}>{language === 'vi' ? 'Không tìm thấy dữ liệu nào' : 'No records found'}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={styles.headerRight}>
            {/* Quick Create menu */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setQuickCreateOpen(!quickCreateOpen)}
                style={styles.quickCreateBtn}
              >
                <Plus size={16} />
                <span>{language === 'vi' ? 'Tạo nhanh' : 'Create New'}</span>
              </button>
              {quickCreateOpen && (
                <div style={styles.quickCreateDropdown}>
                  <button onClick={() => { setQuickCreateOpen(false); setActiveMenu('companies'); setTriggerCreateTime(prev => ({ ...prev, companies: Date.now() })); }} style={styles.quickCreateOption}>{language === 'vi' ? '+ Doanh nghiệp' : '+ Company'}</button>
                  <button onClick={() => { setQuickCreateOpen(false); setActiveMenu('contacts'); setTriggerCreateTime(prev => ({ ...prev, contacts: Date.now() })); }} style={styles.quickCreateOption}>{language === 'vi' ? '+ Người liên hệ' : '+ Contact'}</button>
                  <button onClick={() => { setQuickCreateOpen(false); setActiveMenu('pipeline'); setTriggerCreateTime(prev => ({ ...prev, pipeline: Date.now() })); }} style={styles.quickCreateOption}>{language === 'vi' ? '+ Cơ hội bán hàng' : '+ Opportunity'}</button>
                </div>
              )}
            </div>
            
            {/* View status */}
            <div style={styles.roleBadge}>
              <Shield size={12} />
              <span>{(userProfile?.account_type || 'user').toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* INNER PAGE COMPONENT ROUTING */}
        <main style={styles.innerPage}>
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

const styles = {
  crmContainer: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  },
  sidebar: {
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    color: '#ffffff',
    borderRight: '1px solid #1e293b',
    transition: 'width 0.2s ease',
    overflowY: 'auto',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1rem',
    borderBottom: '1px solid #1e293b',
  },
  logoBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  logoText: {
    fontWeight: 700,
    fontSize: '1rem',
    letterSpacing: '0.05em',
    color: 'var(--color-white)',
  },
  collapseBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '4px',
  },
  profileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #1e293b',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-teal)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  profileMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  profileName: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#f8fafc',
  },
  profileRole: {
    fontSize: '0.7rem',
    color: '#94a3b8',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '1rem 0.5rem',
    flexGrow: 1,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'none',
    border: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: '6px',
    width: '100%',
    transition: 'all 0.15s ease',
  },
  logoutItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    background: 'none',
    border: 'none',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: '6px',
    width: '100%',
    color: '#f43f5e',
    transition: 'all 0.15s ease',
  },
  bottomNav: {
    padding: '0.75rem 0.5rem',
    borderTop: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  mainArea: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
  },
  header: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1.5rem',
  },
  headerLeft: {
    flexGrow: 1,
    maxWidth: '450px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: '#94a3b8',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 0.75rem 0.5rem 2.25rem',
    fontSize: '0.825rem',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  },
  searchDropdown: {
    position: 'absolute',
    top: '40px',
    left: 0,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    border: '1px solid #cbd5e1',
    zIndex: 1000,
    maxHeight: '350px',
    overflowY: 'auto',
  },
  searchDropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #e2e8f0',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#64748b',
  },
  closeSearchBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1rem',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  searchDropdownBody: {
    padding: '0.5rem 0',
  },
  searchSection: {
    padding: '0.5rem 0',
    borderBottom: '1px solid #f1f5f9',
  },
  searchSectionTitle: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#94a3b8',
    padding: '0.25rem 1rem',
    letterSpacing: '0.05em',
  },
  searchItem: {
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    '&:hover': {
      backgroundColor: '#f8fafc',
    }
  },
  noSearch: {
    padding: '1rem',
    fontSize: '0.8rem',
    color: '#94a3b8',
    textAlign: 'center',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  quickCreateBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: 'var(--color-teal)',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 0.875rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  quickCreateDropdown: {
    position: 'absolute',
    top: '38px',
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e2e8f0',
    zIndex: 1000,
    width: '180px',
    padding: '0.25rem 0',
  },
  quickCreateOption: {
    width: '100%',
    padding: '0.5rem 1rem',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    fontSize: '0.8rem',
    cursor: 'pointer',
    color: '#334155',
    '&:hover': {
      backgroundColor: '#f1f5f9',
    }
  },
  roleBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.25rem 0.5rem',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '4px',
  },
  innerPage: {
    flexGrow: 1,
    padding: '1.5rem',
    overflowY: 'auto',
  },
  cardShell: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '1.5rem',
    minHeight: 'calc(100vh - 120px)',
    display: 'flex',
    flexDirection: 'column',
  },
  pageTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  placeholderContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
  },
} as const;
