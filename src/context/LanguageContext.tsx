import React, { createContext, useContext, useState } from 'react';

type Language = 'vi' | 'en';

interface TranslationDict {
  [key: string]: {
    vi: string;
    en: string;
  };
}

export const translations: TranslationDict = {
  // Navigation & General
  navHome: { vi: 'Trang chủ', en: 'Home' },
  navSolutions: { vi: 'Giải pháp', en: 'Solutions' },
  navProducts: { vi: 'Sản phẩm', en: 'Products' },
  navProjects: { vi: 'Dự án', en: 'Projects' },
  navIndustries: { vi: 'Ngành phục vụ', en: 'Industries' },
  navServices: { vi: 'Dịch vụ kỹ thuật', en: 'Services' },
  navAbout: { vi: 'Về chúng tôi', en: 'About Us' },
  navKnowledge: { vi: 'Kiến thức', en: 'Knowledge' },
  navContact: { vi: 'Liên hệ', en: 'Contact' },
  btnConsult: { vi: 'Yêu cầu tư vấn', en: 'Request Consultation' },
  lngTurnkey: { vi: 'Giải pháp LNG Trọn gói', en: 'LNG Turnkey Solution' },
  lpgTurnkey: { vi: 'Giải pháp LPG Trọn gói', en: 'LPG Turnkey Solution' },
  fuelConv: { vi: 'Chuyển đổi Nhiên liệu', en: 'Fuel Conversion' },
  indGas: { vi: 'Hệ thống Gas Công nghiệp', en: 'Industrial Gas System' },
  centralGas: { vi: 'Hệ thống Gas Trung tâm', en: 'Central Gas System' },
  commKitchen: { vi: 'Giải pháp Bếp Công nghiệp', en: 'Commercial Kitchen Solution' },
  language: { vi: 'Ngôn ngữ', en: 'Language' },
  vietnamese: { vi: 'Tiếng Việt', en: 'Vietnamese' },
  english: { vi: 'English', en: 'English' },

  // Hero Section
  heroTitle: { vi: 'Giải Pháp LNG & LPG Trọn Gói', en: 'Turnkey LNG & LPG Solutions' },
  heroSubtitle: { vi: 'Từ Thiết Kế Kỹ Thuật Đến Vận Hành Tin Cậy', en: 'From Engineering to Reliable Operation' },
  heroDesc: { vi: 'Tư vấn, thiết kế, cung cấp thiết bị, thi công, chạy thử và bảo trì hệ thống LNG, LPG và bếp công nghiệp cho nhà máy, nhà hàng, khách sạn và các dự án thương mại.', en: 'Consultation, design, equipment procurement, construction, commissioning and maintenance of LNG, LPG and commercial kitchen systems for factories, restaurants, hotels and commercial projects.' },
  heroBtnConsult: { vi: 'Tư vấn dự án', en: 'Project Consultation' },
  heroBtnSolutions: { vi: 'Xem giải pháp', en: 'Explore Solutions' },
  heroBtnProfile: { vi: 'Tải Company Profile', en: 'Download Profile' },

  // Dual Business Sections
  bizTitle: { vi: 'Lĩnh Vực Hoạt Động Cốt Lõi', en: 'Core Business Divisions' },
  bizSubtitle: { vi: 'Hai mảng kinh doanh liên kết chặt chẽ trong hệ sinh thái năng lượng và nhiệt năng công nghiệp.', en: 'Two interconnected divisions serving the industrial energy and commercial thermal ecosystem.' },
  bizEnergyTitle: { vi: 'Giải Pháp Năng Lượng & Khí Hóa Lỏng', en: 'Energy & Liquefied Gas Solutions' },
  bizEnergyDesc: { vi: 'Hệ thống cung cấp nhiên liệu LNG/LPG công nghiệp từ trạm tồn chứa, hóa hơi, giảm áp đến đường ống dẫn khí đầu đốt.', en: 'Industrial LNG/LPG supply systems from bulk storage, vaporization, and pressure reduction skids to burner pipelines.' },
  bizKitchenTitle: { vi: 'Giải Pháp Bếp Công Nghiệp & Inox', en: 'Commercial Kitchen & Stainless Solutions' },
  bizKitchenDesc: { vi: 'Tư vấn layout, cung cấp thiết bị bếp Á-Âu công nghiệp, tủ lạnh công nghiệp, hệ thống hút khói và cấp gas trung tâm an toàn.', en: 'Layout consultation, high-end cooking ranges, industrial cooling, exhaust hoods, and integrated central gas piping.' },

  // 7-Step Turnkey Process
  processTitle: { vi: 'Quy Trình Triển Khai Trọn Gói (Turnkey)', en: 'Turnkey Project Execution Process' },
  processSubtitle: { vi: 'Chúng tôi chịu trách nhiệm đầu cuối (Single-point responsibility) xuyên suốt vòng đời dự án.', en: 'We deliver single-point responsibility and complete lifecycle support for your peace of mind.' },
  step1: { vi: '01. Khảo sát & Tư vấn', en: '01. Consultation' },
  step2: { vi: '02. Khảo sát Hiện trường', en: '02. Site Survey' },
  step3: { vi: '03. Thiết kế Kỹ thuật', en: '03. Concept & Engineering' },
  step4: { vi: '04. Cung ứng Thiết bị', en: '04. Procurement' },
  step5: { vi: '05. Thi công & Lắp đặt', en: '05. Construction' },
  step6: { vi: '06. Chạy thử & Bàn giao', en: '06. Commissioning' },
  step7: { vi: '07. Vận hành & Bảo trì', en: '07. Maintenance' },
  
  step1Desc: { vi: 'Đánh giá tính khả thi và phân tích nhu cầu nhiệt lượng ban đầu.', en: 'Perform initial feasibility studies and thermal energy requirements analysis.' },
  step2Desc: { vi: 'Đo đạc thực địa, xác định khoảng cách an toàn phòng cháy chữa cháy.', en: 'On-site dimensions survey, safety clearance definition, and location verification.' },
  step3Desc: { vi: 'Lập bản vẽ P&ID, mặt bằng bố trí thiết bị và thuyết minh kỹ thuật chi tiết.', en: 'Create P&ID schematics, equipment layout, and detailed engineering specifications.' },
  step4Desc: { vi: 'Nhập khẩu và chế tạo thiết bị áp lực, hóa hơi và an toàn đạt chuẩn ASME/EN.', en: 'Import and manufacture pressure vessels, vaporizers, and safety valves under ASME/EN.' },
  step5Desc: { vi: 'Hàn đường ống cao áp, đấu nối cơ khí, lắp ráp hệ thống điện điều khiển PLC.', en: 'High-pressure pipeline welding, mechanical hookup, and electrical PLC cabinet wiring.' },
  step6Desc: { vi: 'Kiểm định an toàn cháy nổ, thử áp lực Nitơ và tiến hành hóa hơi chạy thử đầu đốt.', en: 'Fire safety inspection, Nitrogen leak test, trial vaporization, and burner commissioning.' },
  step7Desc: { vi: 'Bảo dưỡng định kỳ, kiểm tra rò rỉ gas, hỗ trợ khẩn cấp 24/7 và cung ứng phụ tùng.', en: 'Preventive maintenance, leak detection, 24/7 emergency support, and spare parts supply.' },

  // Solutions Detail Section
  solLngDetailsTitle: { vi: 'Trạm Cấp Khí LNG Toàn Diện', en: 'Comprehensive LNG Regasification Station' },
  solLpgDetailsTitle: { vi: 'Hệ Thống Tồn Chứa & Phân Phối LPG', en: 'LPG Storage & Distribution System' },
  solConvDetailsTitle: { vi: 'Giải Pháp Chuyển Đổi Nhiên Liệu Sạch', en: 'Clean Fuel Conversion Solutions' },

  // Fuel Conversion Calculator
  calcTitle: { vi: 'Công Cụ Tính Toán Hiệu Quả Chuyển Đổi Nhiên Liệu', en: 'Fuel Conversion Saving Calculator' },
  calcSubtitle: { vi: 'Ước tính tiềm năng tiết kiệm chi phí và giảm lượng khí thải carbon khi chuyển sang LNG/LPG.', en: 'Estimate potential cost savings and carbon footprint reduction when transitioning to LNG/LPG.' },
  calcCurrentFuel: { vi: 'Nhiên liệu hiện tại', en: 'Current Fuel Type' },
  calcConsumption: { vi: 'Mức tiêu thụ mỗi tháng', en: 'Monthly Consumption' },
  calcPrice: { vi: 'Đơn giá nhiên liệu (VNĐ/Đơn vị)', en: 'Fuel Unit Price (VND/Unit)' },
  calcHours: { vi: 'Giờ vận hành mỗi ngày', en: 'Operating Hours per Day' },
  calcEfficiency: { vi: 'Hiệu suất lò hơi/đầu đốt hiện tại (%)', en: 'Current Boiler/Burner Efficiency (%)' },
  calcBtn: { vi: 'Tính Toán Kết Quả', en: 'Calculate Savings' },
  calcResults: { vi: 'Kết quả phân tích sơ bộ', en: 'Preliminary Assessment Results' },
  calcAnnualDemand: { vi: 'Nhu cầu năng lượng hàng năm', en: 'Annual Energy Demand' },
  calcEquivalentLng: { vi: 'Lượng LNG tương đương', en: 'Equivalent LNG Volume' },
  calcEquivalentLpg: { vi: 'Lượng LPG tương đương', en: 'Equivalent LPG Volume' },
  calcSavings: { vi: 'Tiết kiệm chi phí nhiên liệu ước tính', en: 'Estimated Fuel Cost Savings' },
  calcMonthly: { vi: 'mỗi tháng', en: 'per month' },
  calcYearly: { vi: 'mỗi năm', en: 'per year' },
  calcCo2: { vi: 'Giảm phát thải CO2 hàng năm', en: 'Annual CO2 Emission Reduction' },
  calcNote: { vi: 'Lưu ý: Kết quả trên chỉ mang tính tham khảo sơ bộ dựa trên nhiệt trị lý thuyết. Thiết kế chính thức đòi hỏi khảo sát chi tiết hiện trường.', en: 'Note: Results are preliminary estimates based on theoretical heat values. Official designs require on-site surveys and burner inspections.' },

  // Project Wizard
  wizardTitle: { vi: 'Khảo Sát & Thiết Kế Dự Án (Wizard)', en: 'Project Design & Specification Wizard' },
  wizardStep1: { vi: 'Ngành & Lĩnh vực', en: 'Industry & Sector' },
  wizardStep2: { vi: 'Nhu cầu Kỹ thuật', en: 'Technical Needs' },
  wizardStep3: { vi: 'Thông tin Liên hệ', en: 'Contact Information' },
  wizardNext: { vi: 'Tiếp theo', en: 'Next' },
  wizardPrev: { vi: 'Quay lại', en: 'Previous' },
  wizardSubmit: { vi: 'Gửi yêu cầu đánh giá', en: 'Submit Request' },
  wizardSuccess: { vi: 'Cảm ơn bạn! Yêu cầu khảo sát đã được ghi nhận. Đội ngũ kỹ sư của chúng tôi sẽ liên hệ trong vòng 24 giờ.', en: 'Thank you! Your survey request has been received. Our engineering team will contact you within 24 hours.' },

  // Product Catalog
  prodCenterTitle: { vi: 'Trung Tâm Sản Phẩm Kỹ Thuật', en: 'Engineering Product Center' },
  prodCenterDesc: { vi: 'Catalog thiết bị công nghiệp tiêu chuẩn quốc tế. Nhận báo giá & datasheet kỹ thuật.', en: 'International standard industrial equipment catalog. Select items to request technical datasheets & quotes.' },
  prodFilterAll: { vi: 'Tất cả thiết bị', en: 'All Equipment' },
  prodFilterLng: { vi: 'Thiết bị LNG', en: 'LNG Equipment' },
  prodFilterLpg: { vi: 'Thiết bị LPG', en: 'LPG Equipment' },
  prodFilterValves: { vi: 'Van & Điều áp', en: 'Valves & Regulators' },
  prodFilterKitchen: { vi: 'Bếp công nghiệp', en: 'Kitchen Equipment' },
  prodFilterInox: { vi: 'Thiết bị Inox', en: 'Stainless Steel' },
  prodAddQuote: { vi: 'Thêm vào yêu cầu báo giá', en: 'Add to Quote Request' },
  prodInQuote: { vi: 'Đã thêm vào yêu cầu', en: 'Added to Request' },
  prodSpec: { vi: 'Thông số kỹ thuật', en: 'Technical Specifications' },
  prodApplication: { vi: 'Ứng dụng', en: 'Application' },
  prodOrigin: { vi: 'Xuất xứ', en: 'Origin' },

  // Quote Drawer
  quoteTitle: { vi: 'Danh Sách Yêu Cầu Báo Giá', en: 'Quote Request List' },
  quoteEmpty: { vi: 'Chưa có sản phẩm nào được chọn.', en: 'No products selected yet.' },
  quoteSendBtn: { vi: 'Gửi danh sách báo giá', en: 'Submit Quote List' },

  // Case Studies / Projects
  projTitle: { vi: 'Dự Án EPC Tiêu Biểu', en: 'Featured EPC Projects' },
  projSubtitle: { vi: 'Minh chứng cho năng lực thiết kế, cung ứng và thi công trọn gói tại Việt Nam.', en: 'Demonstrating our end-to-end design, supply, and execution capabilities in Vietnam.' },
  projFilterAll: { vi: 'Tất cả dự án', en: 'All Projects' },
  projLocation: { vi: 'Địa điểm', en: 'Location' },
  projCapacity: { vi: 'Công suất', en: 'Capacity' },
  projScope: { vi: 'Phạm vi công việc', en: 'Scope of Work' },
  projResult: { vi: 'Kết quả vận hành', en: 'Operational Result' }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('lng_site_lang');
    return (saved === 'vi' || saved === 'en') ? saved : 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lng_site_lang', lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) {
      return key;
    }
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
