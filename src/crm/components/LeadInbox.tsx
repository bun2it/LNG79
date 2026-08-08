import React, { useEffect, useState } from 'react';
import { supabase } from '../../shared/supabase/supabase';
import { type LeadItem, type CrmLeadSource } from '../../shared/types/crm';
import { 
  Inbox, ShieldAlert, CheckCircle, XCircle, UserCheck, 
  Phone, Mail, MapPin, Building2, Plus
} from 'lucide-react';

interface LeadInboxProps {
  language: 'vi' | 'en';
  onNavigateToDeal?: (opportunityId: string) => void;
  onLogAction?: (msg: string) => void;
}

export const LeadInbox: React.FC<LeadInboxProps> = ({ language, onNavigateToDeal, onLogAction }) => {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [leadSources, setLeadSources] = useState<CrmLeadSource[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection/Drawer State
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [duplicates, setDuplicates] = useState<{ companies: any[]; contacts: any[]; leads: any[] }>({ companies: [], contacts: [], leads: [] });
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  // Convert Form state
  const [companyName, setCompanyName] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactPosition, setContactPosition] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [dealValue, setDealValue] = useState(0);
  const [solutionType, setSolutionType] = useState<'lng' | 'lpg' | 'conversion' | 'kitchen'>('lng');
  const [assignedTo, setAssignedTo] = useState('');

  const [industries, setIndustries] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('new');
  const [actionLoading, setActionLoading] = useState(false);

  // --- Manual Lead Creation State ---
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadLocation, setNewLeadLocation] = useState('');
  const [newLeadType, setNewLeadType] = useState<'contact' | 'quote' | 'survey' | 'wizard'>('contact');
  const [newLeadSourceId, setNewLeadSourceId] = useState('');
  const [newLeadDetails, setNewLeadDetails] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Fetch leads and master data
  const fetchData = async () => {
    setLoading(true);
    const client = supabase;
    if (!client) return;

    try {
      // 1. Fetch leads
      const { data: leadsData } = await client
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      // Parse dates and match models
      const mappedLeads: LeadItem[] = (leadsData || []).map((l: any) => ({
        id: l.id,
        type: l.type,
        company: l.company || '',
        name: l.name || '',
        phone: l.phone || '',
        email: l.email || '',
        location: l.location || '',
        date: new Date(l.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        status: l.status,
        details: l.details || '',
        converted_company_id: l.converted_company_id,
        converted_contact_id: l.converted_contact_id,
        converted_opportunity_id: l.converted_opportunity_id
      }));
      setLeads(mappedLeads);

      // 2. Fetch industries
      const { data: indData } = await client.from('crm_industries').select('*').eq('is_active', true);
      setIndustries(indData || []);

      // 3. Fetch lead sources
      const { data: srcData } = await client.from('crm_lead_sources').select('*').eq('is_active', true);
      setLeadSources(srcData || []);

      // 4. Fetch profiles for assignment
      const { data: profData } = await client.from('users').select('id, name, email').eq('status', 'active');
      setProfiles((profData || []).map(p => ({ id: p.id, display_name: p.name, email: p.email })));
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [language]);

  // --- Generate LEAD-YYYYMMDD-XXXX ID ---
  const generateLeadId = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `LEAD-${datePart}-${randPart}`;
  };

  // --- Handle Manual Lead Creation ---
  const handleCreateManualLead = async () => {
    const client = supabase;
    if (!client || !newLeadName.trim() || !newLeadPhone.trim()) return;
    setCreateLoading(true);
    try {
      // Find the matching source name if sourceId is selected
      const sourceObj = leadSources.find(s => s.id === newLeadSourceId);
      const detailsWithSource = newLeadDetails.trim()
        ? newLeadDetails.trim()
        : `[Manual input${sourceObj ? ` via ${sourceObj.name}` : ''}]`;

      const leadId = generateLeadId();
      const { error } = await client.from('leads').insert({
        id: leadId,
        type: newLeadType,
        name: newLeadName.trim(),
        phone: newLeadPhone.trim(),
        email: newLeadEmail.trim(),
        company: newLeadCompany.trim(),
        location: newLeadLocation.trim(),
        details: detailsWithSource,
        status: 'new',
      });
      if (error) throw error;

      // Add to local state so the list updates immediately
      const newLead: LeadItem = {
        id: leadId,
        type: newLeadType,
        name: newLeadName.trim(),
        phone: newLeadPhone.trim(),
        email: newLeadEmail.trim(),
        company: newLeadCompany.trim(),
        location: newLeadLocation.trim(),
        details: detailsWithSource,
        status: 'new',
        date: new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }),
        converted_company_id: undefined,
        converted_contact_id: undefined,
        converted_opportunity_id: undefined,
      };
      setLeads(prev => [newLead, ...prev]);

      // Reset form
      setNewLeadName(''); setNewLeadPhone(''); setNewLeadEmail('');
      setNewLeadCompany(''); setNewLeadLocation('');
      setNewLeadType('contact'); setNewLeadSourceId(''); setNewLeadDetails('');
      setCreateModalOpen(false);
      setFilterStatus('new');
      if (onLogAction) onLogAction(`Manual lead created: ${newLeadName} (${leadId})`);
    } catch (err: any) {
      alert(language === 'vi' ? `Lỗi tạo lead: ${err.message}` : `Failed to create lead: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  // Scan duplicates when a lead is selected
  useEffect(() => {
    if (!selectedLead || !supabase) {
      setDuplicates({ companies: [], contacts: [], leads: [] });
      return;
    }

    const checkDuplicates = async () => {
      const client = supabase;
      if (!client) return;

      try {
        const companyNameQuery = selectedLead.company.trim();
        const emailQuery = selectedLead.email.trim();
        const phoneQuery = selectedLead.phone.trim();

        // 1. Check companies by name
        let matchedCompanies: any[] = [];
        if (companyNameQuery) {
          const { data: comp } = await client
            .from('crm_companies')
            .select('id, name, company_number, status')
            .ilike('name', `%${companyNameQuery}%`);
          matchedCompanies = comp || [];
        }

        // 2. Check contacts by email or phone
        let matchedContacts: any[] = [];
        if (emailQuery || phoneQuery) {
          const conditions = [];
          if (emailQuery) conditions.push(`email.eq.${emailQuery}`);
          if (phoneQuery) conditions.push(`phone.eq.${phoneQuery}`);
          
          const { data: cont } = await client
            .from('crm_contacts')
            .select('id, name, phone, email, company_id')
            .or(conditions.join(','));
          matchedContacts = cont || [];
        }

        // 3. Check other leads
        let matchedLeads: any[] = [];
        const leadConditions = [];
        if (emailQuery) leadConditions.push(`email.eq.${emailQuery}`);
        if (phoneQuery) leadConditions.push(`phone.eq.${phoneQuery}`);
        
        if (leadConditions.length > 0) {
          const { data: ld } = await client
            .from('leads')
            .select('id, name, company, created_at, status')
            .neq('id', selectedLead.id)
            .or(leadConditions.join(','));
          matchedLeads = ld || [];
        }

        setDuplicates({
          companies: matchedCompanies,
          contacts: matchedContacts,
          leads: matchedLeads
        });
      } catch (err) {
        console.error('Error checking duplicates:', err);
      }
    };

    checkDuplicates();
  }, [selectedLead]);

  const handleUpdateStatus = async (leadId: string, status: LeadItem['status']) => {
    const client = supabase;
    if (!client) return;
    setActionLoading(true);
    try {
      const { error } = await client
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
      if (selectedLead && selectedLead.id === leadId) {
        setSelectedLead({ ...selectedLead, status });
      }
      if (onLogAction) onLogAction(`Updated lead ${leadId} status to ${status}`);
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenConvertModal = () => {
    if (!selectedLead) return;
    setCompanyName(selectedLead.company || selectedLead.name + ' (Personal)');
    setAddress(selectedLead.location || '');
    setContactName(selectedLead.name);
    setContactEmail(selectedLead.email);
    setContactPhone(selectedLead.phone);
    setContactPosition(language === 'vi' ? 'Đại diện mua hàng' : 'Purchasing Agent');
    
    // Deduce solution from lead details/type
    let type: 'lng' | 'lpg' | 'conversion' | 'kitchen' = 'lng';
    if (selectedLead.details.toLowerCase().includes('lpg')) type = 'lpg';
    else if (selectedLead.details.toLowerCase().includes('conversion') || selectedLead.details.toLowerCase().includes('dầu')) type = 'conversion';
    else if (selectedLead.details.toLowerCase().includes('bếp') || selectedLead.details.toLowerCase().includes('kitchen')) type = 'kitchen';
    setSolutionType(type);

    setDealTitle(`${selectedLead.company || selectedLead.name} - ${type.toUpperCase()} Solution`);
    setDealValue(0);
    setAssignedTo(profiles[0]?.id || '');
    setConvertModalOpen(true);
  };

  // One-click B2B Conversion Transaction
  const handleConvertLead = async () => {
    const client = supabase;
    if (!client || !selectedLead) return;
    setActionLoading(true);

    try {
      // 1. Create crm_companies
      const { data: company, error: compErr } = await client
        .from('crm_companies')
        .insert({
          name: companyName.trim(),
          industry_id: industryId || null,
          tax_code: taxCode.trim(),
          address: address.trim(),
          status: 'prospect'
        })
        .select('id, company_number')
        .single();
      
      if (compErr) throw compErr;

      // 2. Create crm_contacts
      const { data: contact, error: contErr } = await client
        .from('crm_contacts')
        .insert({
          company_id: company.id,
          name: contactName.trim(),
          position: contactPosition.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          is_decision_maker: true
        })
        .select('id')
        .single();

      if (contErr) throw contErr;

      // Find matched source code for Lead sources mapping
      const websiteSource = leadSources.find(s => s.code === `website_${selectedLead.type}`) || leadSources.find(s => s.code === 'website_contact');

      // 3. Create crm_opportunities
      const { data: opportunity, error: oppErr } = await client
        .from('crm_opportunities')
        .insert({
          title: dealTitle.trim(),
          company_id: company.id,
          primary_contact_id: contact.id,
          solution_type: solutionType,
          deal_value: dealValue,
          currency: 'VND',
          probability: 10,
          assigned_to: assignedTo || null,
          source_id: websiteSource?.id || null,
          stage: 'new'
        })
        .select('id, opportunity_number')
        .single();

      if (oppErr) throw oppErr;

      // 4. Create timeline activity log
      await client.from('crm_activities').insert({
        entity_type: 'opportunity',
        entity_id: opportunity.id,
        activity_type: 'status_change',
        content: language === 'vi' 
          ? `Cơ hội kinh doanh được khởi tạo từ việc chuyển đổi Lead #${selectedLead.id}` 
          : `Opportunity generated from Lead qualification #${selectedLead.id}`,
        created_by: assignedTo || null
      });

      // 5. Update parent lead status to qualified
      await client
        .from('leads')
        .update({
          status: 'qualified',
          converted_company_id: company.id,
          converted_contact_id: contact.id,
          converted_opportunity_id: opportunity.id
        })
        .eq('id', selectedLead.id);

      // Clean UI state
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { 
        ...l, 
        status: 'qualified',
        converted_company_id: company.id,
        converted_contact_id: contact.id,
        converted_opportunity_id: opportunity.id
      } : l));
      
      setSelectedLead(null);
      setConvertModalOpen(false);
      
      if (onLogAction) onLogAction(`Lead ${selectedLead.name} qualified and converted to Company/Opportunity successfully`);
      
      // Auto redirect if callback is set
      if (onNavigateToDeal && opportunity.id) {
        onNavigateToDeal(opportunity.id);
      } else {
        alert(language === 'vi' ? 'Chuyển đổi thành công!' : 'Lead qualified and converted successfully!');
      }
    } catch (err: any) {
      console.error('Error during B2B conversion:', err);
      alert(language === 'vi' ? `Lỗi chuyển đổi: ${err.message}` : `Conversion failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa Lead này không?' : 'Are you sure you want to delete this Lead?')) return;
    const client = supabase;
    if (!client) return;
    setActionLoading(true);
    try {
      const { error } = await client
        .from('leads')
        .delete()
        .eq('id', leadId);
      if (error) throw error;
      
      alert(language === 'vi' ? 'Đã xóa Lead thành công' : 'Lead deleted successfully');
      setSelectedLead(null);
      fetchData(); // reload list
      if (onLogAction) onLogAction(`Lead ${leadId} deleted`);
    } catch (err: any) {
      alert('Error deleting lead: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMergeLead = async (targetCompanyId: string) => {
    const client = supabase;
    if (!client || !selectedLead) return;
    if (!confirm(language === 'vi' ? 'Bạn có muốn gộp thông tin lead này vào doanh nghiệp đã chọn không?' : 'Do you want to merge this lead into the selected company?')) return;

    setActionLoading(true);
    try {
      // 1. Create a polymorphic note under the target company
      await client.from('crm_activities').insert({
        entity_type: 'company',
        entity_id: targetCompanyId,
        activity_type: 'note',
        content: `[Merged Lead - ${selectedLead.date}] Name: ${selectedLead.name} | Phone: ${selectedLead.phone} | Details: ${selectedLead.details}`
      });

      // 2. Set lead status as merged
      await client.from('leads').update({
        status: 'merged',
        converted_company_id: targetCompanyId
      }).eq('id', selectedLead.id);

      setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, status: 'merged', converted_company_id: targetCompanyId } : l));
      setSelectedLead(null);
      alert(language === 'vi' ? 'Gộp Lead thành công!' : 'Lead merged successfully!');
    } catch (err: any) {
      alert('Merge failed');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLeads = leads.filter(l => l.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return { label: language === 'vi' ? 'Mới nhận' : 'New', color: '#3B82F6', bg: '#EFF6FF' };
      case 'contacted': return { label: language === 'vi' ? 'Đang liên hệ' : 'Contacted', color: '#F59E0B', bg: '#FEF3C7' };
      case 'qualified': return { label: language === 'vi' ? 'Đã chuyển đổi' : 'Qualified', color: '#10B981', bg: '#ECFDF5' };
      case 'rejected': return { label: language === 'vi' ? 'Từ chối' : 'Rejected', color: '#EF4444', bg: '#FEF2F2' };
      case 'merged': return { label: language === 'vi' ? 'Đã gộp' : 'Merged', color: '#6B7280', bg: '#F3F4F6' };
      default: return { label: status, color: '#000', bg: '#fff' };
    }
  };

  return (
    <div style={styles.inboxLayout}>
      {/* FILTER BAR */}
      <div style={{ ...styles.filterBar, justifyContent: 'space-between' }}>
        <div style={styles.tabs}>
          {(['new', 'contacted', 'qualified', 'rejected', 'merged'] as const).map((s) => {
            const label = getStatusBadge(s).label;
            const count = leads.filter(l => l.status === s).length;
            const active = filterStatus === s;
            return (
              <button 
                key={s} 
                onClick={() => setFilterStatus(s)}
                style={{
                  ...styles.tab,
                  borderBottomColor: active ? 'var(--color-teal)' : 'transparent',
                  color: active ? 'var(--color-teal)' : '#64748b',
                  fontWeight: active ? 600 : 400
                }}
              >
                <span>{label}</span>
                <span style={{
                  ...styles.tabCount,
                  backgroundColor: active ? 'var(--color-teal)' : '#e2e8f0',
                  color: active ? '#ffffff' : '#475569'
                }}>{count}</span>
              </button>
            );
          })}
        </div>
        {/* Add Lead Button */}
        <button
          onClick={() => setCreateModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            backgroundColor: 'var(--color-teal)', border: 'none', color: '#fff',
            padding: '0.45rem 0.9rem', borderRadius: '6px',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={14} />
          {language === 'vi' ? 'Thêm Lead' : 'Add Lead'}
        </button>
      </div>

      <div style={styles.contentGrid}>
        {/* LEADS LIST */}
        <div style={styles.listContainer}>
          {loading ? (
            <div style={styles.loading}>{language === 'vi' ? 'Đang tải danh sách...' : 'Loading inbox...'}</div>
          ) : filteredLeads.length === 0 ? (
            <div style={styles.emptyInbox}>
              <Inbox size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
              <p>{language === 'vi' ? 'Hộp thư trống trong trạng thái này' : 'No leads found in this state'}</p>
            </div>
          ) : (
            <div style={styles.leadsList}>
              {filteredLeads.map((lead) => {
                const badge = getStatusBadge(lead.status);
                return (
                  <div 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    style={{
                      ...styles.leadCard,
                      borderColor: selectedLead?.id === lead.id ? 'var(--color-teal)' : '#e2e8f0',
                      boxShadow: selectedLead?.id === lead.id ? '0 4px 12px rgba(20, 184, 166, 0.08)' : 'none'
                    }}
                  >
                    <div style={styles.leadCardHeader}>
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#1e293b' }}>{lead.name}</strong>
                        {lead.company && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lead.company}</div>}
                      </div>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: '4px',
                        backgroundColor: badge.bg, color: badge.color
                      }}>
                        {badge.label}
                      </span>
                    </div>

                    <div style={styles.leadCardBody}>
                      <div style={{ fontSize: '0.75rem', color: '#475569' }}>📞 {lead.phone} | ✉️ {lead.email}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>📍 {lead.location}</div>
                    </div>

                    <div style={styles.leadCardFooter}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{lead.date}</span>
                      <span style={{
                        fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '3px',
                        backgroundColor: lead.type === 'calculator' ? '#FEF3C7' : lead.type === 'wizard' ? '#E0F2FE' : '#F5F3FF',
                        color: lead.type === 'calculator' ? '#B45309' : lead.type === 'wizard' ? '#0369A1' : '#6D28D9'
                      }}>
                        {lead.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DETAILS DRAWER */}
        <div style={styles.detailContainer}>
          {selectedLead ? (
            <div style={styles.detailCard} className="animate-fade-in">
              <div style={styles.detailHeader}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>{language === 'vi' ? 'Chi Tiết Lead' : 'Lead Details'}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button 
                    style={{ ...styles.closeBtn, color: '#f43f5e', fontSize: '0.85rem', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    title={language === 'vi' ? 'Xóa Lead này' : 'Delete this Lead'}
                  >
                    🗑️
                  </button>
                  <button style={styles.closeBtn} onClick={() => setSelectedLead(null)}>×</button>
                </div>
              </div>

              <div style={styles.detailBody}>
                {/* Meta details */}
                <div style={styles.metaRow}>
                  <Building2 size={16} color="#64748b" />
                  <div>
                    <div style={styles.metaLabel}>{language === 'vi' ? 'Doanh nghiệp / Đơn vị' : 'Company'}</div>
                    <div style={styles.metaVal}>{selectedLead.company || '—'}</div>
                  </div>
                </div>

                <div style={styles.metaRow}>
                  <Phone size={16} color="#64748b" />
                  <div>
                    <div style={styles.metaLabel}>{language === 'vi' ? 'Điện thoại' : 'Phone'}</div>
                    <div style={styles.metaVal}>{selectedLead.phone || '—'}</div>
                  </div>
                </div>

                <div style={styles.metaRow}>
                  <Mail size={16} color="#64748b" />
                  <div>
                    <div style={styles.metaLabel}>Email</div>
                    <div style={styles.metaVal}>{selectedLead.email || '—'}</div>
                  </div>
                </div>

                <div style={styles.metaRow}>
                  <MapPin size={16} color="#64748b" />
                  <div>
                    <div style={styles.metaLabel}>{language === 'vi' ? 'Khu vực / Địa chỉ' : 'Location'}</div>
                    <div style={styles.metaVal}>{selectedLead.location || '—'}</div>
                  </div>
                </div>

                <div style={styles.detailsBox}>
                  <strong>{language === 'vi' ? 'Nội dung yêu cầu:' : 'Customer Enquiry Details:'}</strong>
                  <div style={styles.detailsContent}>{selectedLead.details}</div>
                </div>

                {/* DUPLICATE DETECTOR CARD */}
                {(duplicates.companies.length > 0 || duplicates.contacts.length > 0 || duplicates.leads.length > 0) && (
                  <div style={styles.duplicateCard}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <ShieldAlert size={16} color="#EF4444" />
                      <strong style={{ fontSize: '0.8rem', color: '#991B1B' }}>
                        {language === 'vi' ? 'Cảnh báo trùng lặp!' : 'Possible Duplicates Detected'}
                      </strong>
                    </div>

                    {duplicates.companies.map(c => (
                      <div key={c.id} style={styles.dupItem}>
                        <span>🏢 {c.name} ({c.company_number})</span>
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleMergeLead(c.id)}
                          style={styles.mergeBtn}
                        >
                          {language === 'vi' ? 'Gộp Lead' : 'Merge Lead'}
                        </button>
                      </div>
                    ))}

                    {duplicates.contacts.map(c => (
                      <div key={c.id} style={styles.dupItem}>
                        <span>👤 {c.name} - {c.phone} | {c.email}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ACTIONS BAR */}
                <div style={styles.actionsBar}>
                  {selectedLead.status === 'new' && (
                    <>
                      <button 
                        style={styles.contactedBtn}
                        disabled={actionLoading}
                        onClick={() => handleUpdateStatus(selectedLead.id, 'contacted')}
                      >
                        {language === 'vi' ? 'Đã liên hệ' : 'Mark Contacted'}
                      </button>
                      <button 
                        style={styles.qualifyBtn}
                        disabled={actionLoading}
                        onClick={handleOpenConvertModal}
                      >
                        <UserCheck size={14} />
                        <span>{language === 'vi' ? 'Duyệt B2B (Convert)' : 'Qualify B2B'}</span>
                      </button>
                    </>
                  )}

                  {selectedLead.status === 'contacted' && (
                    <button 
                      style={styles.qualifyBtn}
                      disabled={actionLoading}
                      onClick={handleOpenConvertModal}
                    >
                      <UserCheck size={14} />
                      <span>{language === 'vi' ? 'Duyệt B2B (Convert)' : 'Qualify B2B'}</span>
                    </button>
                  )}

                  {selectedLead.status !== 'qualified' && selectedLead.status !== 'rejected' && selectedLead.status !== 'merged' && (
                    <button 
                      style={styles.rejectBtn}
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedLead.id, 'rejected')}
                    >
                      <XCircle size={14} />
                      <span>{language === 'vi' ? 'Từ chối' : 'Reject Lead'}</span>
                    </button>
                  )}

                  {selectedLead.status === 'qualified' && (
                    <div style={styles.qualifiedAlert}>
                      <CheckCircle size={16} color="#10B981" />
                      <span>
                        {language === 'vi' ? 'Đã duyệt thành công đối tác B2B!' : 'Qualified into B2B account successfully!'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyDetail}>
              <Inbox size={32} color="#cbd5e1" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {language === 'vi' ? 'Chọn một lead từ danh sách để xem chi tiết' : 'Select a lead to review contact details'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CONVERT TO B2B DIALOG MODAL */}
      {convertModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-white)' }}>
                {language === 'vi' ? 'Xác Nhận Chuyển Đổi Lead Thành B2B' : 'Convert Lead to B2B Pipeline'}
              </h3>
              <button style={styles.modalClose} onClick={() => setConvertModalOpen(false)}>×</button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalFormGrid}>
                {/* COMPANY SECTION */}
                <div style={styles.formSection}>
                  <div style={styles.formSectionTitle}>🏢 {language === 'vi' ? '1. Đăng Ký Công Ty' : '1. Company Registration'}</div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Tên doanh nghiệp *' : 'Company Name *'}</label>
                    <input type="text" className="form-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">{language === 'vi' ? 'Ngành nghề' : 'Industry'}</label>
                      <select className="form-select" value={industryId} onChange={(e) => setIndustryId(e.target.value)}>
                        <option value="">— Select Industry —</option>
                        {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{language === 'vi' ? 'Mã số thuế' : 'Tax Code'}</label>
                      <input type="text" className="form-input" value={taxCode} onChange={(e) => setTaxCode(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Địa chỉ' : 'Address'}</label>
                    <input type="text" className="form-input" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                </div>

                {/* CONTACT SECTION */}
                <div style={styles.formSection}>
                  <div style={styles.formSectionTitle}>👤 {language === 'vi' ? '2. Đại Diện Đầu Mối' : '2. Key Contact'}</div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Họ và tên *' : 'Contact Name *'}</label>
                    <input type="text" className="form-input" value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Phone *</label>
                      <input type="text" className="form-input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{language === 'vi' ? 'Chức vụ' : 'Position'}</label>
                      <input type="text" className="form-input" value={contactPosition} onChange={(e) => setContactPosition(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* OPPORTUNITY SECTION */}
                <div style={{ ...styles.formSection, gridColumn: 'span 2' }}>
                  <div style={styles.formSectionTitle}>📐 {language === 'vi' ? '3. Cơ Hội Bán Hàng & Phân Công' : '3. Opportunity Configuration'}</div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Tiêu đề Deal / Dự án *' : 'Opportunity Title *'}</label>
                    <input type="text" className="form-input" value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">{language === 'vi' ? 'Giải pháp nhiên liệu' : 'Solution type'}</label>
                      <select className="form-select" value={solutionType} onChange={(e) => setSolutionType(e.target.value as any)}>
                        <option value="lng">LNG Solution</option>
                        <option value="lpg">LPG Solution</option>
                        <option value="conversion">Boiler Conversion</option>
                        <option value="kitchen">Commercial Kitchen</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{language === 'vi' ? 'Giá trị dự toán (VNĐ)' : 'Deal value (VND)'}</label>
                      <input type="number" className="form-input" value={dealValue} onChange={(e) => setDealValue(Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{language === 'vi' ? 'Người phụ trách' : 'Owner'}</label>
                      <select className="form-select" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                        <option value="">— Select Owner —</option>
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.display_name} ({p.email})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button className="btn btn-outline" disabled={actionLoading} onClick={() => setConvertModalOpen(false)}>
                {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button className="btn btn-teal" disabled={actionLoading || !companyName || !contactName || !contactPhone || !dealTitle} onClick={handleConvertLead}>
                {actionLoading ? (language === 'vi' ? 'Đang chuyển đổi...' : 'Converting...') : (language === 'vi' ? 'Xác Nhận & Mở Deal' : 'Qualify & Open Deal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL CREATE LEAD MODAL */}
      {createModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: '560px' }} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>
                <Plus size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                {language === 'vi' ? 'Thêm Lead Mới' : 'Create New Lead'}
              </h3>
              <button style={styles.modalClose} onClick={() => setCreateModalOpen(false)}>×</button>
            </div>

            <div style={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* Row 1: Name + Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Họ và tên *' : 'Full Name *'}</label>
                    <input
                      type="text" className="form-input" autoFocus
                      value={newLeadName} onChange={e => setNewLeadName(e.target.value)}
                      placeholder={language === 'vi' ? 'Nguyễn Văn A' : 'John Doe'}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Điện thoại *' : 'Phone *'}</label>
                    <input
                      type="tel" className="form-input"
                      value={newLeadPhone} onChange={e => setNewLeadPhone(e.target.value)}
                      placeholder="0901 234 567"
                    />
                  </div>
                </div>

                {/* Row 2: Email + Company */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email" className="form-input"
                      value={newLeadEmail} onChange={e => setNewLeadEmail(e.target.value)}
                      placeholder="contact@company.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Tên công ty' : 'Company'}</label>
                    <input
                      type="text" className="form-input"
                      value={newLeadCompany} onChange={e => setNewLeadCompany(e.target.value)}
                      placeholder={language === 'vi' ? 'Công ty TNHH ABC' : 'ABC Co. Ltd'}
                    />
                  </div>
                </div>

                {/* Row 3: Location */}
                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Tỉnh / Khu vực' : 'Province / Location'}</label>
                  <input
                    type="text" className="form-input"
                    value={newLeadLocation} onChange={e => setNewLeadLocation(e.target.value)}
                    placeholder={language === 'vi' ? 'TP. Hồ Chí Minh' : 'Ho Chi Minh City'}
                  />
                </div>

                {/* Row 4: Lead Type + Source */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Loại Lead' : 'Lead Type'}</label>
                    <select className="form-select" value={newLeadType} onChange={e => setNewLeadType(e.target.value as any)}>
                      <option value="contact">{language === 'vi' ? 'Liên hệ chung' : 'General Contact'}</option>
                      <option value="quote">{language === 'vi' ? 'Yêu cầu báo giá' : 'Quote Request'}</option>
                      <option value="survey">{language === 'vi' ? 'Khảo sát dự án' : 'Project Survey'}</option>
                      <option value="wizard">{language === 'vi' ? 'Wizard dự án' : 'Project Wizard'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Nguồn tiếp cận' : 'Lead Source'}</label>
                    <select className="form-select" value={newLeadSourceId} onChange={e => setNewLeadSourceId(e.target.value)}>
                      <option value="">{language === 'vi' ? '— Chọn nguồn —' : '— Select source —'}</option>
                      {leadSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 5: Details / Notes */}
                <div className="form-group">
                  <label className="form-label">{language === 'vi' ? 'Nội dung / Ghi chú' : 'Details / Notes'}</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    value={newLeadDetails}
                    onChange={e => setNewLeadDetails(e.target.value)}
                    placeholder={language === 'vi'
                      ? 'Nhu cầu chuyển đổi từ dầu DO sang LNG, công suất lò hơi ~3 tấn/h...'
                      : 'Customer needs fuel conversion from diesel to LNG, boiler capacity ~3 t/h...'}
                  />
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button className="btn btn-outline" disabled={createLoading} onClick={() => setCreateModalOpen(false)}>
                {language === 'vi' ? 'Hủy' : 'Cancel'}
              </button>
              <button
                className="btn btn-teal"
                disabled={createLoading || !newLeadName.trim() || !newLeadPhone.trim()}
                onClick={handleCreateManualLead}
              >
                {createLoading
                  ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                  : (language === 'vi' ? 'Tạo Lead' : 'Create Lead')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  inboxLayout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  filterBar: {
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    padding: '0 1rem',
    display: 'flex',
    alignItems: 'center',
  },
  tabs: {
    display: 'flex',
    gap: '1.5rem',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    padding: '1rem 0.5rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.15s ease',
  },
  tabCount: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.1rem 0.4rem',
    borderRadius: '10px',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '1.5rem',
    flexGrow: 1,
    paddingTop: '1rem',
    height: 'calc(100vh - 200px)',
    overflow: 'hidden',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  leadsList: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  leadCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '0.875rem',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    transition: 'all 0.15s ease',
    '&:hover': {
      borderColor: 'var(--color-teal)',
      transform: 'translateY(-1px)',
    }
  },
  leadCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leadCardBody: {
    marginTop: '0.5rem',
  },
  leadCardFooter: {
    marginTop: '0.75rem',
    borderTop: '1px dashed #f1f5f9',
    paddingTop: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  detailCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  detailHeader: {
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    cursor: 'pointer',
    color: '#94a3b8',
  },
  detailBody: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  metaRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metaVal: {
    fontSize: '0.85rem',
    color: '#334155',
    fontWeight: 500,
  },
  detailsBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '1rem',
    fontSize: '0.825rem',
  },
  detailsContent: {
    color: '#475569',
    marginTop: '0.5rem',
    whiteSpace: 'pre-wrap',
    lineHeight: '1.4',
  },
  actionsBar: {
    marginTop: '1.5rem',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '1.25rem',
    display: 'flex',
    gap: '0.75rem',
  },
  contactedBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#475569',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: 600,
    cursor: 'pointer',
    flexGrow: 1,
  },
  qualifyBtn: {
    backgroundColor: 'var(--color-teal)',
    border: 'none',
    color: '#ffffff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    flexGrow: 2,
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#B91C1C',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  qualifiedAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ECFDF5',
    border: '1px solid #A7F3D0',
    color: '#065F46',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    fontSize: '0.825rem',
    width: '100%',
  },
  duplicateCard: {
    backgroundColor: '#FEF2F2',
    border: '1px solid #FCA5A5',
    borderRadius: '6px',
    padding: '0.75rem 1rem',
  },
  dupItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: '#7F1D1D',
    marginTop: '0.4rem',
    borderTop: '1px solid rgba(239, 68, 68, 0.1)',
    paddingTop: '0.4rem',
  },
  mergeBtn: {
    backgroundColor: '#EF4444',
    border: 'none',
    color: '#ffffff',
    padding: '0.2rem 0.4rem',
    borderRadius: '3px',
    fontSize: '0.65rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loading: {
    padding: '2rem',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '0.85rem',
  },
  emptyInbox: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    color: '#94a3b8',
    fontSize: '0.85rem',
  },
  emptyDetail: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    width: '100%',
    maxWidth: '750px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh',
  },
  modalHeader: {
    backgroundColor: '#0f172a',
    padding: '1rem 1.25rem',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '1.25rem',
    overflowY: 'auto',
  },
  modalFormGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '1rem',
  },
  formSectionTitle: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#334155',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '0.4rem',
    marginBottom: '0.25rem',
  },
  modalFooter: {
    borderTop: '1px solid #e2e8f0',
    padding: '1rem 1.25rem',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
} as const;
