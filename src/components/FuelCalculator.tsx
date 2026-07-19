import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Calculator, ShieldCheck } from 'lucide-react';

interface FuelConfig {
  name: { vi: string; en: string };
  unit: string;
  lhv: number; // MJ per unit
  co2Factor: number; // kg CO2 per unit
  defaultPrice: number; // VND per unit
  defaultEff: number; // percentage
}

const FUEL_TYPES: { [key: string]: FuelConfig } = {
  DO: { name: { vi: 'Dầu Diesel (DO)', en: 'Diesel Oil (DO)' }, unit: 'Liters', lhv: 36, co2Factor: 2.68, defaultPrice: 20000, defaultEff: 82 },
  FO: { name: { vi: 'Dầu Mè / Dầu nặng (FO)', en: 'Fuel Oil (FO)' }, unit: 'kg', lhv: 40, co2Factor: 3.10, defaultPrice: 16000, defaultEff: 80 },
  COAL: { name: { vi: 'Than đá', en: 'Coal' }, unit: 'kg', lhv: 20, co2Factor: 2.40, defaultPrice: 4500, defaultEff: 68 },
  LPG_OLD: { name: { vi: 'LPG Hiện tại', en: 'Current LPG' }, unit: 'kg', lhv: 46, co2Factor: 3.00, defaultPrice: 26000, defaultEff: 85 },
  ELEC: { name: { vi: 'Điện công nghiệp', en: 'Electricity' }, unit: 'kWh', lhv: 3.6, co2Factor: 0.82, defaultPrice: 2200, defaultEff: 95 }
};

export const FuelCalculator: React.FC = () => {
  const { language, t } = useLanguage();
  const [selectedFuelKey, setSelectedFuelKey] = useState<string>('DO');
  const [consumption, setConsumption] = useState<number>(50000);
  const [customPrice, setCustomPrice] = useState<number>(20000);
  const [customEff, setCustomEff] = useState<number>(82);
  
  // Target constants
  const LNG_LHV = 50; // MJ/kg
  const LNG_CO2_FACTOR = 2.75; // kg CO2/kg
  const LNG_PRICE = 18500; // VND/kg
  const LNG_EFF = 92; // %

  const LPG_LHV = 46; // MJ/kg
  const LPG_CO2_FACTOR = 3.00; // kg CO2/kg
  const LPG_PRICE = 23000; // VND/kg
  const LPG_EFF = 90; // %

  const currentFuel = FUEL_TYPES[selectedFuelKey];

  // Calculations
  const monthlyEnergyDemand = consumption * currentFuel.lhv * (customEff / 100);
  const annualEnergyDemand = monthlyEnergyDemand * 12;
  const currentAnnualCost = consumption * customPrice * 12;
  const currentAnnualCo2 = (consumption * currentFuel.co2Factor * 12) / 1000; // tons

  // LNG Equivalents
  const annualLngNeeded = annualEnergyDemand / (LNG_LHV * (LNG_EFF / 100)); // kg
  const annualLngCost = annualLngNeeded * LNG_PRICE;
  const annualLngCo2 = (annualLngNeeded * LNG_CO2_FACTOR) / 1000; // tons
  const annualLngSavings = currentAnnualCost - annualLngCost;
  const annualLngCo2Reduction = Math.max(0, currentAnnualCo2 - annualLngCo2);

  // LPG Equivalents
  const annualLpgNeeded = annualEnergyDemand / (LPG_LHV * (LPG_EFF / 100)); // kg
  const annualLpgCost = annualLpgNeeded * LPG_PRICE;
  const annualLpgCo2 = (annualLpgNeeded * LPG_CO2_FACTOR) / 1000; // tons
  const annualLpgSavings = currentAnnualCost - annualLpgCost;
  const annualLpgCo2Reduction = Math.max(0, currentAnnualCo2 - annualLpgCo2);

  // System recommendations
  const monthlyLngNeeded = annualLngNeeded / 12;
  const hourlyVaporizerSize = Math.ceil((monthlyLngNeeded / (25 * 10)) * 1.5); // rule of thumb sizing
  const recommendedTankSize = Math.ceil((monthlyLngNeeded / 1000) * 0.4); // 40% of monthly storage buffer

  const handleFuelChange = (key: string) => {
    setSelectedFuelKey(key);
    setCustomPrice(FUEL_TYPES[key].defaultPrice);
    setCustomEff(FUEL_TYPES[key].defaultEff);
    // adjust default consumption based on energy scale
    if (key === 'ELEC') setConsumption(500000);
    else if (key === 'COAL') setConsumption(150000);
    else setConsumption(50000);
  };

  const formatVND = (value: number) => {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div style={styles.container}>
      <div style={styles.calculatorCard}>
        {/* Header */}
        <div style={styles.header}>
          <Calculator size={36} color="var(--color-orange)" />
          <div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t('calcTitle')}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', opacity: 0.8 }}>
              {t('calcSubtitle')}
            </p>
          </div>
        </div>

        <div className="calculator-grid">
          {/* Inputs Section */}
          <div style={styles.inputsSection}>
            <h4 style={styles.sectionHeader}>
              {language === 'vi' ? '1. Thông Số Hiện Tại' : '1. Current Operations'}
            </h4>

            <div className="form-group">
              <label className="form-label">{t('calcCurrentFuel')}</label>
              <select 
                className="form-select" 
                value={selectedFuelKey}
                onChange={(e) => handleFuelChange(e.target.value)}
              >
                {Object.keys(FUEL_TYPES).map((key) => (
                  <option key={key} value={key}>{FUEL_TYPES[key].name[language]}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('calcConsumption')} ({currentFuel.unit}/{language === 'vi' ? 'tháng' : 'month'})
              </label>
              <input 
                type="number" 
                className="form-input" 
                value={consumption}
                onChange={(e) => setConsumption(Math.max(0, parseFloat(e.target.value) || 0))}
              />
              <input 
                type="range" 
                min={selectedFuelKey === 'ELEC' ? 50000 : 5000} 
                max={selectedFuelKey === 'ELEC' ? 2000000 : 500000} 
                step={5000}
                value={consumption}
                onChange={(e) => setConsumption(parseInt(e.target.value))}
                style={styles.slider}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('calcPrice')} ({language === 'vi' ? 'VNĐ' : 'VND'} / {currentFuel.unit})
              </label>
              <input 
                type="number" 
                className="form-input" 
                value={customPrice}
                onChange={(e) => setCustomPrice(Math.max(0, parseFloat(e.target.value) || 0))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {t('calcEfficiency')}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input 
                  type="number" 
                  className="form-input" 
                  value={customEff}
                  max={98}
                  onChange={(e) => setCustomEff(Math.min(98, Math.max(10, parseFloat(e.target.value) || 0)))}
                  style={{ width: '80px' }}
                />
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  {language === 'vi' 
                    ? '(Boiler/Burner cũ thường đạt từ 65% - 85%)' 
                    : '(Old boiler/burner ranges from 65% to 85%)'}
                </span>
              </div>
            </div>
          </div>

          {/* Outputs Section */}
          <div style={styles.outputsSection}>
            <h4 style={styles.sectionHeader}>
              {language === 'vi' ? '2. Dự Báo Lợi Ích Kinh Tế & Môi Trường' : '2. Estimated Savings & Carbon Impact'}
            </h4>

            {/* Current Metrics */}
            <div style={styles.metricRow}>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>{language === 'vi' ? 'Chi phí hiện tại / năm' : 'Current Cost / Year'}</span>
                <span style={styles.metricValue}>{formatVND(currentAnnualCost)}</span>
              </div>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>{language === 'vi' ? 'Khí thải CO2 / năm' : 'CO2 Footprint / Year'}</span>
                <span style={styles.metricValue}>{currentAnnualCo2.toFixed(1)} TCo2</span>
              </div>
            </div>

            {/* LNG Saving Banner */}
            <div style={styles.savingsBannerLng}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={styles.solutionTagLng}>LNG Solution</span>
                <span style={styles.savingsTag}>{language === 'vi' ? 'Tiết kiệm ~' : 'Save ~'}{((annualLngSavings/currentAnnualCost)*100).toFixed(0)}%</span>
              </div>
              <div style={styles.savingValue}>{formatVND(annualLngSavings)} <span style={{ fontSize: '1rem', fontWeight: 500 }}>/ {language === 'vi' ? 'năm' : 'year'}</span></div>
              <div style={styles.impactFooter}>
                <span>🌱 CO2 Reduction: <strong>{annualLngCo2Reduction.toFixed(1)} Tons/year</strong></span>
                <span>Demand: <strong>{(annualLngNeeded/1000).toFixed(0)} Tons LNG/yr</strong></span>
              </div>
            </div>

            {/* LPG Saving Banner */}
            <div style={styles.savingsBannerLpg}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={styles.solutionTagLpg}>LPG Solution</span>
                <span style={styles.savingsTag}>{language === 'vi' ? 'Tiết kiệm ~' : 'Save ~'}{((annualLpgSavings/currentAnnualCost)*100).toFixed(0)}%</span>
              </div>
              <div style={styles.savingValue}>{formatVND(annualLpgSavings)} <span style={{ fontSize: '1rem', fontWeight: 500 }}>/ {language === 'vi' ? 'năm' : 'year'}</span></div>
              <div style={styles.impactFooter}>
                <span>🌱 CO2 Reduction: <strong>{annualLpgCo2Reduction.toFixed(1)} Tons/year</strong></span>
                <span>Demand: <strong>{(annualLpgNeeded/1000).toFixed(0)} Tons LPG/yr</strong></span>
              </div>
            </div>

            {/* Equipment Recommendation */}
            <div style={styles.recommendationBox}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <ShieldCheck size={20} color="var(--color-teal)" />
                <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-navy)' }}>
                  {language === 'vi' ? 'Đề Xuất Quy Mô Trạm Hóa Hơi LNG Sơ Bộ' : 'Recommended Preliminary LNG Station Scale'}
                </h5>
              </div>
              <ul style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', paddingLeft: '1.25rem', margin: 0 }}>
                <li>{language === 'vi' ? `Công suất hóa hơi yêu cầu: tối thiểu ${hourlyVaporizerSize} Nm³/h` : `Required Vaporizer Capacity: min ${hourlyVaporizerSize} Nm³/h`}</li>
                <li>{language === 'vi' ? `Dung tích bồn chứa LNG đề xuất: ${recommendedTankSize} m³` : `Proposed Cryogenic LNG Storage Tank Size: ${recommendedTankSize} m³`}</li>
                <li>{language === 'vi' ? 'Quy trình an toàn: Trạm thiết kế khoảng cách an toàn tối thiểu 15m' : 'Safety Standard: Station requires minimum 15m clearance boundaries'}</li>
              </ul>
            </div>

            <p style={styles.disclaimer}>{t('calcNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    width: '100%',
    padding: '2rem 0',
  },
  calculatorCard: {
    backgroundColor: 'var(--color-gray-card)',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--color-gray-border)',
    boxShadow: 'var(--shadow-premium)',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
    padding: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    textAlign: 'left',
  },

  inputsSection: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  sectionHeader: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--color-gray-border)',
    paddingBottom: '0.5rem',
  },
  slider: {
    width: '100%',
    marginTop: '0.75rem',
    cursor: 'pointer',
    accentColor: 'var(--color-teal)',
  },
  outputsSection: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
    backgroundColor: '#F8FAFC',
    padding: '1.5rem',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--color-gray-border)',
  },
  metricRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-gray-border)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    flexDirection: 'column',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  metricValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    marginTop: '0.25rem',
  },
  savingsBannerLng: {
    backgroundColor: 'rgba(13, 148, 136, 0.06)',
    border: '1px solid rgba(13, 148, 136, 0.2)',
    borderRadius: 'var(--border-radius-md)',
    padding: '1.25rem',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
  },
  savingsBannerLpg: {
    backgroundColor: 'rgba(234, 88, 12, 0.06)',
    border: '1px solid rgba(234, 88, 12, 0.2)',
    borderRadius: 'var(--border-radius-md)',
    padding: '1.25rem',
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
  },
  solutionTagLng: {
    backgroundColor: 'var(--color-teal)',
    color: 'var(--color-white)',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
    textTransform: 'uppercase',
  },
  solutionTagLpg: {
    backgroundColor: 'var(--color-orange)',
    color: 'var(--color-white)',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
    textTransform: 'uppercase',
  },
  savingsTag: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  savingValue: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--color-navy)',
    margin: '0.5rem 0',
  },
  impactFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: 'var(--color-text-main)',
    borderTop: '1px dashed rgba(0,0,0,0.1)',
    paddingTop: '0.5rem',
    marginTop: '0.25rem',
  },
  recommendationBox: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-sm)',
    padding: '1rem',
    marginBottom: '1rem',
  },
  disclaimer: {
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    lineHeight: 1.5,
    fontStyle: 'italic',
  }
};
