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

export const AppContent: React.FC = () => {
  const [currentView, setView] = useState<string>('home');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState<boolean>(false);

  const handleAddProduct = (product: any) => {
    setCartItems((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
    setCartOpen(true); // Automatically open the quote request list when adding an item
  };

  const handleRemoveProduct = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
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
            <FuelCalculator />
          </div>
        );
      case 'knowledge':
        return <Knowledge />;
      case 'contact':
        return <Contact />;
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
