import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { QuoteDrawer } from './components/QuoteDrawer';
import { Home } from './pages/Home';
import { Solutions } from './pages/Solutions';
import { Products } from './pages/Products';
import { Projects } from './pages/Projects';
import { FuelCalculator } from './components/FuelCalculator';
import { Knowledge } from './pages/Knowledge';
import { Contact } from './pages/Contact';
import { AdminDashboard } from './pages/AdminDashboard';

interface LeadItem {
  id: string;
  type: 'calculator' | 'wizard' | 'quote';
  company: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  date: string;
  status: 'new' | 'contacted' | 'survey' | 'closed';
  details: string;
}

const initialLeads: LeadItem[] = [
  {
    id: 'lead-1',
    type: 'wizard',
    company: 'VinaMilk Binh Duong',
    name: 'Nguyễn Văn Hùng',
    phone: '0987654321',
    email: 'hung.nguyen@vinamilk.com.vn',
    location: 'Bình Dương',
    date: '2026-07-15',
    status: 'new',
    details: 'Ngành: Thực phẩm & Đồ uống\nGiải pháp quan tâm: Turnkey LNG Solution\nNhu cầu tiêu thụ: 45 tấn/tháng\nLoại dự án: Đầu tư mới\nTimeline: 3-6 tháng'
  },
  {
    id: 'lead-2',
    type: 'quote',
    company: 'Hoa Sen Group',
    name: 'Trần Minh Đức',
    phone: '0909123456',
    email: 'duc.tran@hoasengroup.vn',
    location: 'Vũng Tàu',
    date: '2026-07-18',
    status: 'contacted',
    details: 'Yêu cầu báo giá thiết bị:\n- Bồn Chứa Cryogenic LNG (Dung tích: 5m³ - 150m³, Tiêu chuẩn ASME)\n- Dàn Hóa Hơi LNG Dạng Cánh Nhôm (Công suất: 100 Nm³/h - 8000 Nm³/h)'
  }
];

export const AppContent: React.FC = () => {
  const [currentView, setView] = useState<string>('home');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [leads, setLeads] = useState<LeadItem[]>(initialLeads);
  const [fuelSettings, setFuelSettings] = useState({ lngPrice: 18500, lpgPrice: 23000 });

  const handleAddProduct = (product: any) => {
    setCartItems((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
    setCartOpen(true);
  };

  const handleRemoveProduct = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleCreateLead = (type: 'calculator' | 'wizard' | 'quote', data: any) => {
    const newLead: LeadItem = {
      id: 'lead-' + Date.now(),
      type,
      company: data.company || 'N/A',
      name: data.contactName || 'N/A',
      phone: data.phone || 'N/A',
      email: data.email || 'N/A',
      location: data.location || data.province || 'Bình Dương',
      date: new Date().toISOString().split('T')[0],
      status: 'new',
      details: data.details || ''
    };
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleUpdateLeadStatus = (id: string, status: LeadItem['status']) => {
    setLeads((prev) => 
      prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
    );
  };

  const handleDeleteLead = (id: string) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  };

  // Render the current view page
  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home setView={setView} onAddProduct={handleAddProduct} cartItems={cartItems} />;
      case 'lng-solution':
        return <Solutions subView="lng-solution" setView={setView} />;
      case 'lpg-solution':
        return <Solutions subView="lpg-solution" setView={setView} />;
      case 'conversion':
        return <Solutions subView="conversion" setView={setView} />;
      case 'kitchen-solution':
        return <Solutions subView="kitchen-solution" setView={setView} />;
      case 'products':
        return <Products onAddProduct={handleAddProduct} cartItems={cartItems} />;
      case 'projects':
        return <Projects />;
      case 'calculator':
        return (
          <div className="container" style={{ padding: '4rem 1.5rem' }}>
            <FuelCalculator lngPrice={fuelSettings.lngPrice} lpgPrice={fuelSettings.lpgPrice} />
          </div>
        );
      case 'knowledge':
        return <Knowledge />;
      case 'contact':
        return <Contact onSubmitLead={(data: any) => handleCreateLead('wizard', data)} />;
      case 'admin':
        return (
          <AdminDashboard 
            leads={leads}
            onUpdateStatus={handleUpdateLeadStatus}
            onDeleteLead={handleDeleteLead}
            fuelSettings={fuelSettings}
            onUpdateSettings={setFuelSettings}
          />
        );
      default:
        return <Home setView={setView} onAddProduct={handleAddProduct} cartItems={cartItems} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar 
        currentView={currentView} 
        setView={setView} 
        cartCount={cartItems.length} 
        toggleCart={() => setCartOpen(!cartOpen)} 
      />
      
      <main style={{ flex: 1 }}>
        {renderView()}
      </main>

      <Footer setView={setView} />

      <QuoteDrawer 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
        cartItems={cartItems} 
        onRemoveItem={handleRemoveProduct} 
        onClearCart={handleClearCart} 
        onSubmitLead={(data: any) => handleCreateLead('quote', data)}
      />
    </div>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
