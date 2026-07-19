import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Filter, MapPin, Zap } from 'lucide-react';

interface ProjectItem {
  id: string;
  name: { vi: string; en: string };
  category: 'lng' | 'lpg' | 'conversion' | 'kitchen';
  location: { vi: string; en: string };
  scope: { vi: string; en: string };
  capacity: { vi: string; en: string };
  result: { vi: string; en: string };
  equipments: string[];
}

const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'proj-1',
    name: { vi: 'Hệ thống LPG trung tâm cho nhà máy chế biến thực phẩm', en: 'Central LPG system for FDI Food Factory' },
    category: 'lpg',
    location: { vi: 'KCN Thuận Đạo, Long An, Việt Nam', en: 'Thuan Dao IP, Long An, Vietnam' },
    scope: { vi: 'Khảo sát hiện trường, thiết kế P&ID, cung cấp bồn chứa 30m³, thi công đường ống, chạy thử vận hành đầu đốt.', en: 'Site survey, P&ID engineering, supply 30m³ bulk storage tank, gas piping welding, burner commissioning.' },
    capacity: { vi: 'Tiêu thụ 25 tấn LPG / tháng', en: '25 tons LPG per month' },
    result: { vi: 'Hệ thống vận hành an toàn ổn định 100%, được Công an PCCC Long An nghiệm thu chất lượng.', en: '100% reliable gas supply, fully approved by Long An fire department.' },
    equipments: ['30m³ LPG Tank', '300 kg/h Vaporizer', 'Fisher Regulators', 'Honeywell Gas Detectors']
  },
  {
    id: 'proj-2',
    name: { vi: 'Trạm hóa hơi & Cấp khí tự nhiên hóa lỏng LNG', en: 'Industrial LNG Regasification Station' },
    category: 'lng',
    location: { vi: 'KCN Mỹ Phước 3, Bình Dương, Việt Nam', en: 'My Phuoc 3 IP, Binh Duong, Vietnam' },
    scope: { vi: 'Thi công móng bồn cryogenic, lắp bồn đứng 50m³, cụm điều áp đo lường PRMS, kiểm định thử kín Nitơ đường ống.', en: 'Cryogenic foundation civil works, install 50m³ vertical tank, PRMS regulating skid, Nitrogen pressure leak test.' },
    capacity: { vi: 'Lưu lượng khí cực đại 1,500 Nm³/h', en: 'Peak capacity 1,500 Nm³/h' },
    result: { vi: 'Tiết kiệm 22% chi phí năng lượng so với khi sử dụng dầu DO trước đây.', en: 'Achieved 22% fuel cost savings compared to previous diesel oil usage.' },
    equipments: ['50m³ Cryogenic Tank', '1500 Nm³/h Ambient Vaporizer', 'Ultrasonic Flowmeter', 'Slam-shut Safety Valves']
  },
  {
    id: 'proj-3',
    name: { vi: 'Chuyển đổi lò hơi từ dầu FO sang khí gas sạch LNG', en: 'Boiler Fuel Conversion from FO to LNG' },
    category: 'conversion',
    location: { vi: 'KCN Amata, Đồng Nai, Việt Nam', en: 'Amata IP, Dong Nai, Vietnam' },
    scope: { vi: 'Cải tạo buồng đốt lò hơi 10 tấn/giờ, thay đầu đốt dầu cũ sang đầu đốt gas lưỡng phẩm Weishaupt, lập trình điều khiển tỷ lệ O2 tự động.', en: 'Retrofit 10 T/h steam boiler, replace heavy oil burner with Weishaupt dual-fuel burner, program automated oxygen-trim control.' },
    capacity: { vi: 'Lò hơi công suất 10 tấn hơi / giờ', en: '10 Ton steam per hour capacity' },
    result: { vi: 'Cắt giảm 30% lượng khí phát thải CO2 nhà máy, loại bỏ hoàn toàn muội khói đen.', en: 'Reduced CO2 footprint by 30%, completely eliminated black soot emissions.' },
    equipments: ['Weishaupt Gas Burner', 'Double block solenoid valves', 'O2 Flue gas analyzer controller']
  },
  {
    id: 'proj-4',
    name: { vi: 'Thiết kế bếp và gas trung tâm cho khách sạn 5 sao', en: '5-Star Hotel Kitchen & Central Gas System' },
    category: 'kitchen',
    location: { vi: 'Bãi Bắc, Đà Nẵng, Việt Nam', en: 'Bai Bac, Da Nang, Vietnam' },
    scope: { vi: 'Thiết kế layout bếp ăn theo quy trình 1 chiều chống khuẩn chéo, thi công đường dẫn gas Inox đúc từ kho chứa chai gas trung tâm.', en: 'One-way layout design, seamless stainless steel gas piping routed from central cylinder manifold.' },
    capacity: { vi: 'Phục vụ tối đa 1,200 khách / ngày', en: 'Serves up to 1,200 guests daily' },
    result: { vi: 'Khu bếp được bàn giao đúng tiến độ, vận hành tiện lợi và an toàn tuyệt đối.', en: 'Kitchen delivered on schedule, high operational workflow, certified safety.' },
    equipments: ['Commercial Cooking Ranges', 'Exhaust canopy hoods', 'Central gas manifold', 'Gas solenoid safety valves']
  }
];

export const Projects: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: t('projFilterAll') },
    { id: 'lng', label: 'LNG Solutions' },
    { id: 'lpg', label: 'LPG Solutions' },
    { id: 'conversion', label: t('fuelConv') },
    { id: 'kitchen', label: t('commKitchen') }
  ];

  const filteredProjects = PROJECTS_DATA.filter(proj => 
    activeFilter === 'all' || proj.category === activeFilter
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Banner */}
      <section style={styles.banner}>
        <div style={styles.bannerOverlay}></div>
        <div className="container" style={styles.bannerContainer}>
          <h1 style={styles.bannerTitle}>{t('projTitle')}</h1>
          <p style={styles.bannerSubtitle}>{t('projSubtitle')}</p>
        </div>
      </section>

      {/* Grid and filters */}
      <section className="section" style={{ backgroundColor: 'var(--color-white)' }}>
        <div className="container">
          {/* Filters */}
          <div style={styles.filterBar}>
            <Filter size={18} color="var(--color-teal)" />
            <div style={styles.btnGroup}>
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  style={{
                    ...styles.filterBtn,
                    ...(activeFilter === filter.id ? styles.filterBtnActive : {})
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project List Grid */}
          <div style={styles.list}>
            {filteredProjects.map((proj) => (
              <div key={proj.id} className="card" style={styles.projectCard}>
                <h3 style={styles.projectTitle}>{proj.name[language]}</h3>
                
                <div style={styles.metaRow}>
                  <div style={styles.metaItem}>
                    <MapPin size={16} color="var(--color-teal)" />
                    <span>{proj.location[language]}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <Zap size={16} color="var(--color-orange)" />
                    <span>{proj.capacity[language]}</span>
                  </div>
                </div>

                <div style={styles.detailsBox}>
                  <p><strong>{t('projScope')}:</strong> {proj.scope[language]}</p>
                  <p style={{ marginTop: '0.75rem' }}><strong>{t('projResult')}:</strong> {proj.result[language]}</p>
                </div>

                <div style={styles.eqBox}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-navy)', marginRight: '0.5rem' }}>
                    {language === 'vi' ? 'Thiết bị chính lắp đặt:' : 'Key installed equipment:'}
                  </span>
                  <div style={styles.tagWrap}>
                    {proj.equipments.map((eq, i) => (
                      <span key={i} style={styles.tag}>{eq}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  banner: {
    position: 'relative',
    backgroundImage: 'url("https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop")',
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
    alignItems: 'center',
    gap: '1.5rem',
    borderBottom: '1px solid var(--color-gray-border)',
    paddingBottom: '1.25rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  btnGroup: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  filterBtn: {
    background: 'none',
    border: '1px solid var(--color-gray-border)',
    padding: '0.4rem 1rem',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--color-text-main)',
    transition: 'var(--transition-fast)',
  },
  filterBtnActive: {
    backgroundColor: 'var(--color-teal)',
    color: 'var(--color-white)',
    borderColor: 'var(--color-teal)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  projectCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    textAlign: 'left',
    padding: '2rem',
  },
  projectTitle: {
    fontSize: '1.25rem',
    color: 'var(--color-navy)',
    marginBottom: '0.75rem',
  },
  metaRow: {
    display: 'flex',
    gap: '1.5rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  },
  detailsBox: {
    backgroundColor: 'var(--color-gray-bg)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '1.25rem',
    width: '100%',
    fontSize: '0.9rem',
    lineHeight: 1.6,
    border: '1px solid var(--color-gray-border)',
  },
  eqBox: {
    marginTop: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  tagWrap: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: '0.75rem',
    backgroundColor: 'var(--color-teal-light)',
    color: 'var(--color-teal)',
    padding: '0.2rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
    fontWeight: 600,
  }
};
