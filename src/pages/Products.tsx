import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Search, Plus, Check, FileDown, Eye, ShieldAlert } from 'lucide-react';

interface ProductItem {
  id: string;
  name: { vi: string; en: string };
  category: string;
  specs: { vi: string; en: string };
  origin: string;
  details: { vi: string; en: string };
  techParams: { label: { vi: string; en: string }; value: string }[];
}

interface ProductsProps {
  onAddProduct: (prod: any) => void;
  cartItems: any[];
  products?: any[];
  setProducts?: React.Dispatch<React.SetStateAction<any[]>>;
  isVisualEditing?: boolean;
}

export const PRODUCTS_DATA: ProductItem[] = [
  {
    id: 'lng-tank-1',
    name: { vi: 'Bồn Chứa Cryogenic LNG', en: 'Cryogenic LNG Storage Tank' },
    category: 'lng',
    specs: { vi: 'Dung tích: 5m³ - 150m³, Tiêu chuẩn ASME', en: 'Capacity: 5m³ - 150m³, ASME Standard' },
    origin: 'Korea / Japan',
    details: {
      vi: 'Bồn chứa siêu lạnh hai lớp cách nhiệt chân không nén bột Perlite siêu mịn. Được thiết kế chuyên dụng tồn chứa khí tự nhiên hóa lỏng LNG ở nhiệt độ cực thấp -162°C. Đáp ứng kiểm định nghiêm ngặt của Bộ Công Thương.',
      en: 'Double-walled vacuum insulated storage vessel with perlite powder filling. Specifically designed for storage of liquefied natural gas (LNG) at ultra-low temperature of -162°C. Certified under ASME Boiler & Pressure Vessel codes.'
    },
    techParams: [
      { label: { vi: 'Vật liệu vỏ trong', en: 'Inner vessel material' }, value: 'Stainless steel SUS304 / 9% Ni steel' },
      { label: { vi: 'Vật liệu vỏ ngoài', en: 'Outer jacket material' }, value: 'Carbon steel Q345R' },
      { label: { vi: 'Áp suất thiết kế', en: 'Design pressure' }, value: '8.0 bar / 12.0 bar' },
      { label: { vi: 'Độ chân không', en: 'Vacuum level' }, value: '< 5 Pa' }
    ]
  },
  {
    id: 'ambient-vap-1',
    name: { vi: 'Dàn Hóa Hơi LNG Dạng Cánh Nhôm', en: 'Ambient Air LNG Vaporizer' },
    category: 'lng',
    specs: { vi: 'Công suất: 100 Nm³/h - 8000 Nm³/h', en: 'Capacity: 100 Nm³/h - 8000 Nm³/h' },
    origin: 'Vietnam Manufacture / China',
    details: {
      vi: 'Thiết bị hóa hơi tận dụng nhiệt lượng tự nhiên từ không khí ngoài trời để gia nhiệt và hóa hơi LNG lỏng sang thể khí. Không tiêu hao năng lượng điện/nhiên liệu, thiết kế cánh nhôm ngôi sao gia tăng tối đa diện tích trao đổi nhiệt.',
      en: 'Vaporizer that utilizes natural convection of ambient air to heat and vaporize liquid cryogenic LNG into gas. Zero electricity consumption, star-shaped aluminum alloy tubes designed to maximize thermal transfer area.'
    },
    techParams: [
      { label: { vi: 'Áp suất thiết kế', en: 'Design pressure' }, value: '40 bar' },
      { label: { vi: 'Chất liệu ống', en: 'Tube material' }, value: 'Aluminum alloy LF21' },
      { label: { vi: 'Thời gian vận hành liên tục', en: 'Continuous duty cycle' }, value: '8 hours before switching' }
    ]
  },
  {
    id: 'lpg-vap-1',
    name: { vi: 'Bộ Hóa Hơi LPG Cưỡng Bức', en: 'Electric LPG Vaporizer' },
    category: 'lpg',
    specs: { vi: 'Công suất: 30kg/h - 1000kg/h', en: 'Capacity: 30kg/h - 1000kg/h' },
    origin: 'Algas-SDI (USA)',
    details: {
      vi: 'Bộ hóa hơi gia nhiệt gián tiếp bằng điện (Water-bath) chống cháy nổ tuyệt đối, cấp gas hóa hơi công suất lớn và ổn định cho các đầu đốt công nghiệp mà hóa hơi tự nhiên không đáp ứng nổi.',
      en: 'Explosion-proof indirect water bath electric heater. Delivers continuous, high-volume vaporized LPG to industrial burners where natural tank vaporization is insufficient.'
    },
    techParams: [
      { label: { vi: 'Công suất điện', en: 'Electrical power' }, value: '15 kW - 120 kW (3-Phase)' },
      { label: { vi: 'Tiêu chuẩn an toàn', en: 'Explosion safety class' }, value: 'Class I Div. 1 Group D' },
      { label: { vi: 'Áp suất tối đa', en: 'Maximum pressure' }, value: '17.2 bar' }
    ]
  },
  {
    id: 'prms-1',
    name: { vi: 'Cụm Công Nghệ Điều Áp & Đo Lường (PRMS)', en: 'Pressure Regulating & Metering Skid' },
    category: 'valves',
    specs: { vi: 'Thiết kế theo lưu lượng khách hàng, tích hợp lọc bụi', en: 'Customized flow rates, integrated filters' },
    origin: 'Vietnam Assembly / European Valves',
    details: {
      vi: 'Cụm skid lắp ráp đồng bộ bao gồm: bộ lọc tách bụi ẩm, van ngắt khẩn cấp thủy lực, bộ điều áp đôi (chạy-chờ), đồng hồ đo lưu lượng bù nhiệt áp PTZ, và hệ thống van thở xả áp an toàn.',
      en: 'Integrated modular skid containing dual-stage filters, safety slam-shut valves, redundant pilot-operated pressure regulators (active/standby), ultrasonic flowmeter with PTZ temperature-pressure corrector.'
    },
    techParams: [
      { label: { vi: 'Van điều áp chính', en: 'Main regulator' }, value: 'Fisher (USA) / Pietro Fiorentini (Italy)' },
      { label: { vi: 'Cấp chính xác đo lường', en: 'Flowmeter accuracy' }, value: '±0.5% with PTZ corrector' },
      { label: { vi: 'Hệ kiểm soát an toàn', en: 'Safety interlock' }, value: 'Pneumatic / Electric solenoid trip' }
    ]
  },
  {
    id: 'gas-det-1',
    name: { vi: 'Đầu Dò Phát Hiện Rò Rỉ Gas Chống Nổ', en: 'Explosion-Proof Gas Leak Detector' },
    category: 'valves',
    specs: { vi: 'Cảm biến xúc tác Catalytic, Ngõ ra 4-20mA', en: 'Catalytic bead sensor, 4-20mA output' },
    origin: 'Honeywell (USA) / Crowcon (UK)',
    details: {
      vi: 'Đầu dò khí gas cháy nổ LPG/LNG công nghiệp vỏ nhôm đúc nguyên khối chống cháy nổ. Đạt chuẩn ATEX, hiển thị nồng độ LEL tại chỗ và truyền tín hiệu về tủ trung tâm điều khiển.',
      en: 'Industrial explosive gas (LPG/LNG) leakage detector housed in cast aluminum explosion-proof enclosure. ATEX certified, local LEL percentage screen, transmits output to control panels.'
    },
    techParams: [
      { label: { vi: 'Dải đo', en: 'Measuring range' }, value: '0 - 100% LEL' },
      { label: { vi: 'Ngõ ra rơ le', en: 'Relay outputs' }, value: 'Fault, Alarm 1, Alarm 2' },
      { label: { vi: 'Tiêu chuẩn bảo vệ', en: 'Ingress protection' }, value: 'IP66' }
    ]
  },
  {
    id: 'cooking-range-1',
    name: { vi: 'Bếp Á 3 Họng Đốt Quạt Thổi', en: '3-Burner Wok Range with Blower' },
    category: 'kitchen',
    specs: { vi: 'Vật liệu: Inox 304 dày 1.2mm, Quạt thổi 220V', en: 'Material: Stainless Steel 304, 220V Blower' },
    origin: 'Ha Yen / Custom Made',
    details: {
      vi: 'Bếp Á công nghiệp chuyên dụng cho nhà hàng công suất nấu lớn. Họng đốt gang đúc chịu nhiệt cao kết hợp quạt thổi gia tốc luồng khí gas sinh ngọn lửa xanh cực mạnh, rút ngắn thời gian xào nấu thực phẩm.',
      en: 'Industrial Chinese wok range optimized for high-volume restaurants. Heavy cast-iron burner ring combined with forced air blower generates high-velocity flame, reducing stir-fry cooking times.'
    },
    techParams: [
      { label: { vi: 'Kích thước', en: 'Dimensions' }, value: '1800 x 950 x 800 mm' },
      { label: { vi: 'Công suất nhiệt', en: 'Gas consumption rating' }, value: '3 x 48,000 kcal/h' },
      { label: { vi: 'Blower fan', en: 'Electrical rating' }, value: '250W x 3' }
    ]
  },
  {
    id: 'stainless-table-1',
    name: { vi: 'Bàn Inox Sơ Chế 2 Tầng', en: '2-Tier Stainless Steel Prep Table' },
    category: 'inox',
    specs: { vi: 'Inox SUS304, Chân tròn phi 38 có tăng chỉnh', en: 'Stainless Steel SUS304, Round legs adjustable' },
    origin: 'Vietnam Fabrication',
    details: {
      vi: 'Bàn sơ chế và soạn chia thức ăn trong bếp công nghiệp. Mặt bàn gia cố gỗ lót chống rung cách âm dưới lớp inox. Toàn bộ các góc cạnh hàn mài nhẵn mịn bóng gương, đảm bảo vệ sinh an toàn thực phẩm.',
      en: 'Stainless steel preparation table with undershelf for commercial kitchens. Tabletop reinforced with sound-deadening wooden core. All edges welded and polished for hygiene and food safety standards.'
    },
    techParams: [
      { label: { vi: 'Chất liệu inox', en: 'Steel grade' }, value: 'SUS304 hairline finish' },
      { label: { vi: 'Độ dày mặt bàn', en: 'Top sheet thickness' }, value: '1.2 mm' },
      { label: { vi: 'Khả năng chịu tải', en: 'Load capacity' }, value: '150 kg' }
    ]
  }
];

export const Products: React.FC<ProductsProps> = ({ onAddProduct, cartItems, products = [], setProducts, isVisualEditing }) => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const tabs = [
    { id: 'all', label: t('prodFilterAll') },
    { id: 'lng', label: t('prodFilterLng') },
    { id: 'lpg', label: t('prodFilterLpg') },
    { id: 'valves', label: t('prodFilterValves') },
    { id: 'kitchen', label: t('prodFilterKitchen') },
    { id: 'inox', label: t('prodFilterInox') }
  ];

  const listData = products && products.length > 0 ? products : PRODUCTS_DATA;
  const filteredProducts = listData.filter((prod) => {
    const matchesTab = activeTab === 'all' || prod.category === activeTab;
    const matchesSearch = prod.name[language].toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.specs[language].toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ width: '100%' }}>
      {/* Banner */}
      <section style={styles.banner}>
        <div style={styles.bannerOverlay}></div>
        <div className="container" style={styles.bannerContainer}>
          <h1 style={styles.bannerTitle}>{t('prodCenterTitle')}</h1>
          <p style={styles.bannerSubtitle}>{t('prodCenterDesc')}</p>
        </div>
      </section>

      {/* Main Filter & Grid section */}
      <section className="section" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="container">
          {/* Filters Bar */}
          <div style={styles.filterBar}>
            {/* Tabs */}
            <div style={styles.tabsContainer}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === tab.id ? styles.tabButtonActive : {})
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="products-search-box">
              <Search size={18} color="var(--color-text-muted)" style={styles.searchIcon} />
              <input
                type="text"
                placeholder={language === 'vi' ? 'Tìm tên thiết bị, công suất...' : 'Search hardware name, spec...'}
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid-3" style={{ marginTop: '2rem' }}>
            {filteredProducts.map((prod) => {
              const inCart = cartItems.some(i => i.id === prod.id);
              return (
                <div key={prod.id} className="card" style={styles.productCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={styles.prodCat}>{prod.category.toUpperCase()}</span>
                    {isVisualEditing && setProducts ? (
                      <span
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => {
                          const text = e.currentTarget.innerText;
                          const list = listData.map((p: any) => p.id === prod.id ? { ...p, origin: text } : p);
                          setProducts(list);
                        }}
                        style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                      >
                        {prod.origin}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 6 }}>
                        {prod.origin}
                      </span>
                    )}
                  </div>
                  
                  {isVisualEditing && setProducts ? (
                    <h4
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const text = e.currentTarget.innerText;
                        const list = listData.map((p: any) => p.id === prod.id ? { ...p, name: { ...p.name, [language]: text } } : p);
                        setProducts(list);
                      }}
                      style={{ ...styles.prodName, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {prod.name[language]}
                    </h4>
                  ) : (
                    <h4 style={styles.prodName}>{prod.name[language]}</h4>
                  )}
                  
                  {isVisualEditing && setProducts ? (
                    <p
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => {
                        const text = e.currentTarget.innerText;
                        const list = listData.map((p: any) => p.id === prod.id ? { ...p, specs: { ...p.specs, [language]: text } } : p);
                        setProducts(list);
                      }}
                      style={{ ...styles.prodSpecText, outline: 'none', border: '1px dashed var(--color-teal)', padding: '0.1rem 0.2rem', backgroundColor: 'rgba(13,148,136,0.05)', cursor: 'text' }}
                    >
                      {prod.specs[language]}
                    </p>
                  ) : (
                    <p style={styles.prodSpecText}>{prod.specs[language]}</p>
                  )}

                  <div style={styles.cardActions}>
                    <button 
                      className="btn btn-outline btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => setSelectedProduct(prod)}
                    >
                      <Eye size={14} /> {language === 'vi' ? 'Xem chi tiết' : 'Technical Specifications'}
                    </button>
                    
                    <button 
                      className={`btn ${inCart ? 'btn-outline' : 'btn-teal'} btn-sm`}
                      style={{ flexShrink: 0 }}
                      onClick={() => !inCart && onAddProduct(prod)}
                      title={inCart ? t('prodInQuote') : t('prodAddQuote')}
                    >
                      {inCart ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div style={styles.notFound}>
              <ShieldAlert size={48} color="var(--color-text-muted)" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'var(--color-text-muted)' }}>
                {language === 'vi' ? 'Không tìm thấy thiết bị nào khớp với từ khóa của bạn.' : 'No equipment matched your search term.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade-in">
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{selectedProduct.name[language]}</h3>
              <button onClick={() => setSelectedProduct(null)} style={styles.modalCloseBtn}>Close</button>
            </div>

            {/* Modal Body */}
            <div style={styles.modalBody}>
              <span style={styles.prodCat}>{selectedProduct.category.toUpperCase()}</span>
              <p style={{ margin: '1rem 0 1.5rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
                {selectedProduct.details[language]}
              </p>

              {/* Specs Table */}
              <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--color-navy)' }}>
                {t('prodSpec')}
              </h4>
              <table style={styles.table}>
                <tbody>
                  {selectedProduct.techParams.map((param, i) => (
                    <tr key={i} style={styles.tableRow}>
                      <td style={styles.tableCellLabel}>{param.label[language]}</td>
                      <td style={styles.tableCellVal}>{param.value}</td>
                    </tr>
                  ))}
                  <tr style={styles.tableRow}>
                    <td style={styles.tableCellLabel}>{language === 'vi' ? 'Xuất xứ hàng hóa' : 'Country of origin'}</td>
                    <td style={styles.tableCellVal}>{selectedProduct.origin}</td>
                  </tr>
                </tbody>
              </table>

              {/* Action Box */}
              <div style={styles.modalFooter}>
                <button 
                  className="btn btn-outline"
                  onClick={() => alert(language === 'vi' ? 'Đang tải file PDF Datasheet kỹ thuật...' : 'Downloading datasheet PDF details...')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FileDown size={18} /> {language === 'vi' ? 'Tải Catalogue' : 'Technical Datasheet'}
                </button>
                <button 
                  className={`btn ${cartItems.some(i => i.id === selectedProduct.id) ? 'btn-outline' : 'btn-teal'}`}
                  onClick={() => {
                    const inCart = cartItems.some(i => i.id === selectedProduct.id);
                    if (!inCart) {
                      onAddProduct(selectedProduct);
                    }
                    setSelectedProduct(null);
                  }}
                  style={{ flex: 1 }}
                >
                  {cartItems.some(i => i.id === selectedProduct.id) ? t('prodInQuote') : t('prodAddQuote')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  banner: {
    position: 'relative',
    backgroundImage: 'url("https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2070&auto=format&fit=crop")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '5rem 0 4rem',
    color: 'var(--color-white)',
    textAlign: 'left',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    zIndex: 1,
  },
  bannerContainer: {
    position: 'relative',
    zIndex: 2,
  },
  bannerTitle: {
    fontSize: '2.5rem',
    fontWeight: 800,
    marginBottom: '0.5rem',
    fontFamily: 'var(--font-heading)',
  },
  bannerSubtitle: {
    fontSize: '1.1rem',
    opacity: 0.85,
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1.5rem',
    flexWrap: 'wrap',
    borderBottom: '1px solid var(--color-gray-border)',
    paddingBottom: '1.25rem',
  },
  tabsContainer: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  tabButton: {
    background: 'none',
    border: '1px solid transparent',
    padding: '0.5rem 1rem',
    borderRadius: 'var(--border-radius-full)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    transition: 'var(--transition-fast)',
  },
  tabButtonActive: {
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
  },

  searchIcon: {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '0.5rem 1rem 0.5rem 2.25rem',
    borderRadius: 'var(--border-radius-full)',
    border: '1px solid var(--color-gray-border)',
    fontSize: '0.875rem',
    outline: 'none',
  },
  productCard: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    padding: '1.5rem',
  },
  prodCat: {
    fontSize: '0.65rem',
    fontWeight: 700,
    backgroundColor: 'var(--color-teal-light)',
    color: 'var(--color-teal)',
    padding: '0.2rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
    textTransform: 'uppercase',
  },
  prodName: {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: '0.5rem',
  },
  prodSpecText: {
    fontSize: '0.8rem',
    color: 'var(--color-text-muted)',
    marginBottom: '1.5rem',
    minHeight: '40px',
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
  },
  notFound: {
    padding: '4rem 2rem',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 2500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '550px',
    backgroundColor: 'var(--color-gray-card)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: 'var(--shadow-premium)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-white)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    opacity: 0.8,
  },
  modalBody: {
    padding: '1.5rem',
    textAlign: 'left',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
  },
  tableRow: {
    borderBottom: '1px solid var(--color-gray-border)',
  },
  tableCellLabel: {
    padding: '0.5rem 0',
    color: 'var(--color-text-muted)',
    fontWeight: 500,
    width: '40%',
  },
  tableCellVal: {
    padding: '0.5rem 0',
    color: 'var(--color-navy)',
    fontWeight: 600,
  },
  modalFooter: {
    display: 'flex',
    gap: '0.75rem',
    borderTop: '1px solid var(--color-gray-border)',
    paddingTop: '1.25rem',
  }
};
// Make table text clean
styles.tableCellLabel = {
  ...styles.tableCellLabel,
  textAlign: 'left',
};
styles.tableCellVal = {
  ...styles.tableCellVal,
  textAlign: 'left',
};
