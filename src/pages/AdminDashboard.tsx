import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Users, Layers, Settings, FileSpreadsheet, 
  Trash2, Plus, Edit, RefreshCw, TrendingUp, Flame, ChefHat, FileText, Briefcase, History 
} from 'lucide-react';
import type { ArticleItem } from './Knowledge';
import type { ProjectItem } from './Projects';
import type { ProductItem } from './Products';
import { ArticleManager, ProductManager, ProjectManager } from '../components/admin/ContentManagers';
import { MediaPickerDialog } from '../components/admin/MediaPickerDialog';
import { SOLUTIONS_PAGE_DATA } from './Solutions';
import { createCmsBackup, downloadCmsBackup, restoreCmsBackup, validateCmsBackup } from '../features/cms/backup';
import { authFetch } from '../features/auth/authFetch';
import { getCurrentCmsProfile, getSupabaseClient, supabaseConfiguration, supabase } from '../lib/supabase';

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

interface AdminDashboardProps {
  leads: LeadItem[];
  onUpdateStatus: (id: string, status: LeadItem['status']) => void;
  onDeleteLead: (id: string) => void;
  fuelSettings: { lngPrice: number; lpgPrice: number };
  onUpdateSettings: (settings: { lngPrice: number; lpgPrice: number }) => void;
  products: ProductItem[];
  onAddProduct: (product: ProductItem) => void;
  onEditProduct: (product: ProductItem) => void;
  onDeleteProduct: (id: string) => void;
  onToggleProduct: (id: string) => void;
  onTranslateAllContent: (onProgress: (done: number, total: number) => void) => Promise<void>;
  articles: ArticleItem[];
  onAddArticle: (article: ArticleItem) => void;
  onDeleteArticle: (id: string) => void;
  onToggleArticle: (id: string) => void;
  projects: ProjectItem[];
  onAddProject: (project: ProjectItem) => void;
  onDeleteProject: (id: string) => void;
  onToggleProject: (id: string) => void;
  onEditProject: (project: ProjectItem) => void;
  onEditArticle: (article: ArticleItem) => void;
  onAddLead: (lead: LeadItem) => void;
  pages: any[];
  onUpdatePages: React.Dispatch<React.SetStateAction<any[]>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  guiSettings: { 
    darkColor: string; 
    darkOpacity: number; 
    lightColor: string; 
    lightOpacity: number; 
    logoUrl?: string; 
    logoHeight?: number; 
    darkGradientType?: string; 
    lightGradientType?: string;
    darkBaseColor?: string;
    darkCustomMesh?: Array<{ color: string; opacity: number; x: number; y: number; size: number }>;
    lightBaseColor?: string;
    lightCustomMesh?: Array<{ color: string; opacity: number; x: number; y: number; size: number }>;
  };
  onUpdateGuiSettings: (settings: { 
    darkColor: string; 
    darkOpacity: number; 
    lightColor: string; 
    lightOpacity: number; 
    logoUrl?: string; 
    logoHeight?: number; 
    darkGradientType?: string; 
    lightGradientType?: string;
    darkBaseColor?: string;
    darkCustomMesh?: Array<{ color: string; opacity: number; x: number; y: number; size: number }>;
    lightBaseColor?: string;
    lightCustomMesh?: Array<{ color: string; opacity: number; x: number; y: number; size: number }>;
  }) => void;
  onExitCms?: () => void;
}

const AUDIT_FUELS: { [key: string]: { name: { vi: string; en: string }; lhv: number; co2Factor: number; defaultPrice: number; defaultEff: number } } = {
  DO: { name: { vi: 'Dầu Diesel (DO)', en: 'Diesel Oil (DO)' }, lhv: 36, co2Factor: 2.68, defaultPrice: 20000, defaultEff: 82 },
  FO: { name: { vi: 'Dầu Mè / Dầu nặng (FO)', en: 'Fuel Oil (FO)' }, lhv: 40, co2Factor: 3.10, defaultPrice: 16000, defaultEff: 80 },
  COAL: { name: { vi: 'Than đá', en: 'Coal' }, lhv: 20, co2Factor: 2.40, defaultPrice: 4500, defaultEff: 68 },
  LPG_OLD: { name: { vi: 'LPG Hiện tại', en: 'Current LPG' }, lhv: 46, co2Factor: 3.00, defaultPrice: 26000, defaultEff: 85 },
  ELEC: { name: { vi: 'Điện công nghiệp', en: 'Electricity' }, lhv: 3.6, co2Factor: 0.82, defaultPrice: 2200, defaultEff: 95 }
};

const TRANSLATION_DICT: { [key: string]: string } = {
  "trạm khí": "gas station hub",
  "trạm cấp khí": "central gas supply station",
  "bồn chứa": "bulk storage tank",
  "bồn cryogenic": "cryogenic storage tank",
  "hóa hơi": "vaporizer regasification",
  "thiết kế": "engineering design specs",
  "thi công": "piping welding construction",
  "đầu đốt": "combustion thermal burner",
  "cải tạo lò hơi": "boiler conversion conversions",
  "tiêu chuẩn": "TCVN compliance standard",
  "an toàn": "operational safety regulations",
  "bếp ăn công nghiệp": "commercial food kitchen layout",
  "thiết bị nhập khẩu": "certified imported hardware equipment",
  "năng lượng sạch": "clean alternative energy resource",
  "tiết kiệm": "reduce annual energy cost",
  "nghiệm thu": "fire department inspection approvals",
  "đường ống": "gas supply logistics pipeline",
  "vận hành": "engineering operations management",
  "khảo sát": "engineering site survey inspection"
};

const translateViToEn = (text: string): string => {
  if (!text) return "";
  let translated = text.toLowerCase();
  Object.entries(TRANSLATION_DICT).forEach(([vi, en]) => {
    const regex = new RegExp(vi, 'g');
    translated = translated.replace(regex, en);
  });
  return translated.charAt(0).toUpperCase() + translated.slice(1);
};

const translateEnToVi = (text: string): string => {
  if (!text) return "";
  let translated = text.toLowerCase();
  Object.entries(TRANSLATION_DICT).forEach(([vi, en]) => {
    const regex = new RegExp(en, 'g');
    translated = translated.replace(regex, vi);
  });
  return translated.charAt(0).toUpperCase() + translated.slice(1);
};

const calculateSEOScore = (
  title: string,
  excerpt: string,
  content: string,
  image: string,
  focusKeyword: string
) => {
  const rules = [
    {
      id: 'title-len',
      labelVi: 'Độ dài tiêu đề (15 - 60 ký tự)',
      labelEn: 'Title length (15 - 60 chars)',
      passed: title.length >= 15 && title.length <= 60
    },
    {
      id: 'excerpt-len',
      labelVi: 'Độ dài mô tả ngắn (50 - 160 ký tự)',
      labelEn: 'Excerpt length (50 - 160 chars)',
      passed: excerpt.length >= 50 && excerpt.length <= 160
    },
    {
      id: 'content-len',
      labelVi: 'Nội dung bài viết tối thiểu 150 từ',
      labelEn: 'Article body minimum 150 words',
      passed: content.split(/\s+/).filter(Boolean).length >= 150
    },
    {
      id: 'has-image',
      labelVi: 'Có ảnh đại diện bài viết',
      labelEn: 'Cover image is configured',
      passed: !!image
    },
    {
      id: 'keyword-in-title',
      labelVi: 'Từ khóa xuất hiện trong tiêu đề',
      labelEn: 'Target keyword in title',
      passed: !!focusKeyword && title.toLowerCase().includes(focusKeyword.toLowerCase())
    },
    {
      id: 'keyword-in-excerpt',
      labelVi: 'Từ khóa xuất hiện trong mô tả ngắn',
      labelEn: 'Target keyword in excerpt',
      passed: !!focusKeyword && excerpt.toLowerCase().includes(focusKeyword.toLowerCase())
    },
    {
      id: 'keyword-density',
      labelVi: 'Từ khóa xuất hiện trong nội dung',
      labelEn: 'Target keyword in body text',
      passed: !!focusKeyword && content.toLowerCase().includes(focusKeyword.toLowerCase())
    }
  ];

  const passedCount = rules.filter(r => r.passed).length;
  const score = Math.round((passedCount / rules.length) * 100);

  return { score, rules };
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  leads, onUpdateStatus, onDeleteLead, onAddLead, fuelSettings, onUpdateSettings,
  products, onAddProduct, onEditProduct, onDeleteProduct, onToggleProduct, onTranslateAllContent,
  articles, onAddArticle, onDeleteArticle, onToggleArticle,
  projects, onAddProject, onDeleteProject, onToggleProject, onEditProject,
  onEditArticle, pages, onUpdatePages: setPages, isLoggedIn, setIsLoggedIn,
  guiSettings, onUpdateGuiSettings, onExitCms
}) => {
  const { language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [guiLogoPickerOpen, setGuiLogoPickerOpen] = useState(false);
  const [blockHeroImagePickerOpen, setBlockHeroImagePickerOpen] = useState(false);
  const [pageBannerImagePickerOpen, setPageBannerImagePickerOpen] = useState(false);
  const [pickerForPageId, setPickerForPageId] = useState<string | null>(null);
  const [expandedBannerPageId, setExpandedBannerPageId] = useState<string | null>(null);
  const [expandedFaqPageId, setExpandedFaqPageId] = useState<string | null>(null);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState(0);
  const [previewLayout, setPreviewLayout] = useState<'canvas' | 'hero' | 'banner'>('canvas');
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'navigation' | 'media' | 'leads' | 'products' | 'settings' | 'articles' | 'projects' | 'seo' | 'logs' | 'trash' | 'gui'>('overview');
  const showLegacyManagers = sessionStorage.getItem('cms_debug_legacy_managers') === 'true';
  const [lngInput, setLngInput] = useState(fuelSettings.lngPrice);
  const [lpgInput, setLpgInput] = useState(fuelSettings.lpgPrice);
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [translationProgress, setTranslationProgress] = useState<{ done: number; total: number } | null>(null);
  const [translationMessage, setTranslationMessage] = useState('');
  const [backupMessage, setBackupMessage] = useState('');

  const [menuItems, setMenuItems] = useState<any[]>(() => {
    const saved = localStorage.getItem('cms_menu');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'm-1', label: { vi: 'Trang chủ', en: 'Home' }, link: 'home', visible: true, target: '_self' },
      { id: 'm-2', label: { vi: 'Giải pháp', en: 'Solutions' }, link: '#', visible: true, target: '_self', children: [
        { id: 'm-2-1', label: { vi: 'Giải pháp LNG', en: 'LNG Solutions' }, link: 'lng-solution', visible: true, target: '_self' },
        { id: 'm-2-2', label: { vi: 'Giải pháp LPG', en: 'LPG Solutions' }, link: 'lpg-solution', visible: true, target: '_self' },
        { id: 'm-2-3', label: { vi: 'Cải tạo đầu đốt', en: 'Boiler Conversion' }, link: 'conversion', visible: true, target: '_self' },
        { id: 'm-2-4', label: { vi: 'Thiết kế bếp & Central Gas', en: 'Commercial Kitchen' }, link: 'kitchen-solution', visible: true, target: '_self' }
      ]},
      { id: 'm-3', label: { vi: 'Sản phẩm', en: 'Products' }, link: 'products', visible: true, target: '_self' },
      { id: 'm-4', label: { vi: 'Dự án', en: 'Projects' }, link: 'projects', visible: true, target: '_self' },
      { id: 'm-5', label: { vi: 'Thư viện', en: 'Knowledge' }, link: 'knowledge', visible: true, target: '_self' },
      { id: 'm-6', label: { vi: 'Liên hệ', en: 'Contact' }, link: 'contact', visible: true, target: '_self' }
    ];
  });

  const [mediaAssets, setMediaAssets] = useState<any[]>(() => {
    const saved = localStorage.getItem('cms_media');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'med-1', fileName: 'lng_vaporizer_station.jpg', title: 'LNG Vaporizer Station', altText: 'Trạm hóa hơi LNG công nghiệp', url: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?q=80&w=800&auto=format&fit=crop', fileSize: 182400, fileType: 'image/jpeg', uploadedAt: '2026-07-15' },
      { id: 'med-2', fileName: 'lpg_central_gas.jpg', title: 'LPG Central Gas Pipeline', altText: 'Đường ống dẫn LPG trung tâm', url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop', fileSize: 245100, fileType: 'image/jpeg', uploadedAt: '2026-07-16' },
      { id: 'med-3', fileName: 'commercial_kitchen_cooking.jpg', title: 'Commercial Kitchen Gas Ranges', altText: 'Thiết bị bếp á bếp âu bếp ga', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop', fileSize: 312000, fileType: 'image/jpeg', uploadedAt: '2026-07-17' }
    ];
  });
  const [mediaQuery, setMediaQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'pdf'>('all');
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);

  const fileTypeFromName = (name: string) => {
    const extension = name.split('.').pop()?.toLowerCase();
    return extension === 'pdf' ? 'application/pdf' : extension === 'svg' ? 'image/svg+xml' : extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : extension === 'gif' ? 'image/gif' : 'image/jpeg';
  };

  const loadMediaAssets = React.useCallback(async () => {
    try {
      const client = supabase;
      if (client) {
        const { data: dbAssets, error: dbError } = await client
          .from('media_assets')
          .select('id, bucket_id, storage_path, mime_type, file_size, title, alt_text, created_at')
          .order('created_at', { ascending: false });
        
        if (dbError) throw dbError;

        const mapped = (dbAssets || []).map((asset) => {
          const { data: { publicUrl } } = client.storage
            .from(asset.bucket_id)
            .getPublicUrl(asset.storage_path);
          return {
            id: asset.id,
            fileName: asset.storage_path.replace(/^\d+-/, ''),
            title: asset.title || asset.storage_path.replace(/^\d+-/, '').replace(/\.[^.]+$/, ''),
            altText: asset.alt_text || '',
            url: publicUrl,
            fileSize: Number(asset.file_size),
            fileType: asset.mime_type,
            uploadedAt: asset.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
            hosted: true,
            storagePath: asset.storage_path,
            bucketId: asset.bucket_id
          };
        });
        setMediaAssets(mapped);
      } else {
        const response = await authFetch('/api/uploads');
        if (response.ok) {
          const hosted = await response.json();
          setMediaAssets((current) => {
            const additions = hosted
              .filter((file: any) => !current.some((asset) => asset.url === file.url))
              .map((file: any) => ({
                id: `host-${file.name}`,
                fileName: file.name,
                title: file.name.replace(/\.[^.]+$/, ''),
                altText: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
                url: file.url,
                fileSize: file.size || 0,
                fileType: fileTypeFromName(file.name),
                uploadedAt: file.uploadedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                hosted: true,
              }));
            return additions.length ? [...additions, ...current] : current;
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  React.useEffect(() => {
    if (!isLoggedIn) return;
    void loadMediaAssets();
  }, [isLoggedIn, loadMediaAssets]);

  React.useEffect(() => {
    if (!isLoggedIn) return;
    const fetchNavigation = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from('navigation_items')
          .select('*')
          .order('sort_order', { ascending: true });
        
        if (error) throw error;
        if (data && data.length > 0) {
          const roots = data.filter((item) => !item.parent_id);
          const children = data.filter((item) => item.parent_id);
          const hierarchy = roots.map((root) => {
            const sub = children
              .filter((child) => child.parent_id === root.id)
              .map((child) => ({
                id: child.id,
                label: child.label,
                link: child.path,
                visible: child.visible,
                target: child.target
              }));
            
            return {
              id: root.id,
              label: root.label,
              link: root.path,
              visible: root.visible,
              target: root.target,
              ...(sub.length > 0 ? { children: sub } : {})
            };
          });
          setMenuItems(hierarchy);
          localStorage.setItem('cms_menu', JSON.stringify(hierarchy));
        }
      } catch (err) {
        console.error('Failed to load navigation items from Supabase:', err);
      }
    };
    void fetchNavigation();
  }, [isLoggedIn]);

  const uploadMediaFiles = async (files: FileList) => {
    try {
      const client = supabase;
      if (client) {
        const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']);
        const uploaded: any[] = [];

        for (const file of Array.from(files)) {
          if (!allowedTypes.has(file.type)) {
            throw new Error(language === 'vi' ? `Chỉ hỗ trợ JPG, PNG, WebP, GIF hoặc PDF: ${file.name}` : `Only JPG, PNG, WebP, GIF, or PDF are supported: ${file.name}`);
          }
          if (file.size > 10 * 1024 * 1024) {
            throw new Error(language === 'vi' ? `File ${file.name} vượt quá 10 MB.` : `File ${file.name} exceeds 10 MB.`);
          }

          const fileExt = file.name.split('.').pop() || '';
          const cleanBaseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60);
          const storagePath = `${Date.now()}-${cleanBaseName}.${fileExt}`;

          let dimensions: { width: number; height: number } | null = null;
          if (file.type.startsWith('image/')) {
            dimensions = await new Promise<{ width: number; height: number } | null>((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
              img.onerror = () => resolve(null);
              img.src = URL.createObjectURL(file);
            });
          }

          const { error: uploadError } = await client.storage
            .from('website-media')
            .upload(storagePath, file, { cacheControl: '3600', upsert: false });
          
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = client.storage
            .from('website-media')
            .getPublicUrl(storagePath);

          const { data: userData } = await client.auth.getUser();
          const { data: dbAsset, error: dbError } = await client
            .from('media_assets')
            .insert({
              bucket_id: 'website-media',
              storage_path: storagePath,
              mime_type: file.type,
              file_size: file.size,
              width: dimensions?.width || null,
              height: dimensions?.height || null,
              title: file.name.replace(/\.[^.]+$/, ''),
              alt_text: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
              uploaded_by: userData?.user?.id || null
            })
            .select()
            .single();

          if (dbError) throw dbError;

          uploaded.push({
            id: dbAsset.id,
            fileName: storagePath.replace(/^\d+-/, ''),
            title: dbAsset.title || file.name.replace(/\.[^.]+$/, ''),
            altText: dbAsset.alt_text || '',
            url: publicUrl,
            fileSize: file.size,
            fileType: file.type,
            uploadedAt: new Date().toISOString().slice(0, 10),
            hosted: true,
            storagePath: storagePath,
            bucketId: 'website-media'
          });
        }

        setMediaAssets((current) => [...uploaded, ...current]);
        logAction(`Uploaded ${files.length} assets to Supabase Storage`);
      } else {
        const uploaded = await Promise.all(Array.from(files).map(async (file) => {
          const response = await authFetch('/api/uploads', {
            method: 'POST',
            headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) },
            body: file,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || `Upload ${file.name} thất bại`);
          return { name: result.name, url: result.url, size: file.size, type: file.type, hosted: true };
        }));
        setMediaAssets((current) => [
          ...uploaded.map((file) => ({
            id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            fileName: file.name,
            title: file.name.replace(/\.[^.]+$/, ''),
            altText: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
            url: file.url,
            fileSize: file.size,
            fileType: file.type,
            uploadedAt: new Date().toISOString().slice(0, 10),
            hosted: file.hosted,
          })),
          ...current,
        ]);
        logAction(`Uploaded ${files.length} assets to Media Vault`);
      }
    } catch (reason: any) {
      alert(reason.message || 'Upload file thất bại');
    }
  };

  const deleteMediaAsset = async (asset: any) => {
    const usages = [...products.map((item) => item.image), ...projects.flatMap((item) => [item.image, ...(item.images || [])]), ...articles.flatMap((item) => [item.image, ...(item.images || [])])].filter((url) => url === asset.url).length;
    const warning = usages > 0
      ? `${language === 'vi' ? 'File đang được sử dụng tại' : 'This file is used in'} ${usages} ${language === 'vi' ? 'nội dung. Xóa vẫn tiếp tục?' : 'content items. Delete anyway?'}`
      : (language === 'vi' ? 'Xóa file này khỏi Media Vault?' : 'Delete this file from Media Vault?');
    if (!window.confirm(warning)) return;

    try {
      if (supabase && asset.id && !asset.id.startsWith('host-') && !asset.id.startsWith('med-')) {
        const storagePath = asset.storagePath || asset.fileName;
        const bucketId = asset.bucketId || 'website-media';
        
        const { error: storageError } = await supabase.storage
          .from(bucketId)
          .remove([storagePath]);

        if (storageError) throw storageError;

        const { error: dbError } = await supabase
          .from('media_assets')
          .delete()
          .eq('id', asset.id);

        if (dbError) throw dbError;

        setMediaAssets((current) => current.filter((item) => item.id !== asset.id));
        logAction(`Deleted media asset "${asset.fileName}" from Supabase`);
      } else {
        if (asset.url?.startsWith('/uploads/')) {
          const response = await authFetch(`/api/uploads?name=${encodeURIComponent(asset.fileName)}`, { method: 'DELETE' });
          if (!response.ok) throw new Error(language === 'vi' ? 'Không thể xóa file trên host.' : 'Could not delete hosted file.');
        }
        setMediaAssets((current) => current.filter((item) => item.id !== asset.id));
        logAction(`Deleted media asset "${asset.fileName}"`);
      }
    } catch (reason: any) {
      alert(reason.message || 'Xóa file thất bại');
    }
  };

  const filteredMediaAssets = mediaAssets.filter((asset) => {
    const matchesType = mediaTypeFilter === 'all' || (mediaTypeFilter === 'image' ? asset.fileType?.startsWith('image/') : asset.fileType === 'application/pdf');
    const haystack = `${asset.fileName} ${asset.title || ''} ${asset.altText || ''}`.toLocaleLowerCase();
    return matchesType && haystack.includes(mediaQuery.trim().toLocaleLowerCase());
  });

  const updateMediaMetadata = async (id: string, field: 'title' | 'altText', value: string) => {
    setMediaAssets((current) => current.map((asset) => asset.id === id ? { ...asset, [field]: value } : asset));
    try {
      if (supabase && !id.startsWith('host-') && !id.startsWith('med-')) {
        const dbField = field === 'title' ? 'title' : 'alt_text';
        const { error } = await supabase
          .from('media_assets')
          .update({ [dbField]: value })
          .eq('id', id);
        if (error) throw error;
      }
    } catch (e: any) {
      console.error('Failed to update media metadata:', e.message);
    }
  };

  const [auditLogs, setAuditLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('cms_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'log-1', timestamp: '2026-07-19T08:12:00Z', user: 'admin', action: 'Published page: LNG Solutions', status: 'success' },
      { id: 'log-2', timestamp: '2026-07-19T10:15:00Z', user: 'admin', action: 'Modified calculation price factors', status: 'success' },
      { id: 'log-3', timestamp: '2026-07-19T10:30:00Z', user: 'admin', action: 'Added new case study project: LPG food factory', status: 'success' },
      { id: 'log-4', timestamp: '2026-07-19T14:15:00Z', user: 'admin', action: 'Uploaded image assets to Media Vault', status: 'success' }
    ];
  });

  const [redirects, setRedirects] = useState<any[]>(() => {
    const saved = localStorage.getItem('cms_redirects');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'red-1', from: '/lng-old', to: '/solutions/lng', type: '301' },
      { id: 'red-2', from: '/kitchen-old', to: '/solutions/kitchen', type: '301' }
    ];
  });

  const [editingBlocksPageId, setEditingBlocksPageId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [articleKeyword, setArticleKeyword] = useState('LNG');
  const [projectKeyword, setProjectKeyword] = useState('LPG');
  const [isTranslatingArticle, setIsTranslatingArticle] = useState(false);
  const [isTranslatingProject, setIsTranslatingProject] = useState(false);

  const [pageHistory, setPageHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('cms_page_history');
    if (saved) return JSON.parse(saved);
    return [];
  });

  React.useEffect(() => {
    const fetchRevisions = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const { data, error } = await client
          .from('page_revisions')
          .select('*')
          .order('timestamp', { ascending: false });
        if (error) throw error;
        if (data) {
          const mapped = data.map(r => ({
            id: r.id,
            pageId: r.page_id,
            timestamp: r.timestamp,
            author: r.author,
            blocks: r.blocks
          }));
          setPageHistory(mapped);
        }
      } catch (err) {
        console.error('Failed to load page revisions from Supabase:', err);
      }
    };
    void fetchRevisions();
  }, []);

  const [trashBin, setTrashBin] = useState<any[]>(() => {
    const saved = localStorage.getItem('cms_trash_bin');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Keep localStorage updated on edits
  React.useEffect(() => {
    localStorage.setItem('cms_page_history', JSON.stringify(pageHistory));
  }, [pageHistory]);

  React.useEffect(() => {
    localStorage.setItem('cms_trash_bin', JSON.stringify(trashBin));
  }, [trashBin]);

  React.useEffect(() => {
    localStorage.setItem('cms_menu', JSON.stringify(menuItems));
    const saveNavigation = async () => {
      const client = supabase;
      if (!client) return;
      try {
        const flattened: any[] = [];
        menuItems.forEach((item, rootIdx) => {
          flattened.push({
            id: item.id,
            label: item.label,
            path: item.link,
            sort_order: rootIdx,
            visible: item.visible !== false,
            target: item.target || '_self',
            parent_id: null
          });
          if (item.children) {
            item.children.forEach((child: any, childIdx: number) => {
              flattened.push({
                id: child.id,
                label: child.label,
                path: child.link,
                sort_order: childIdx,
                visible: child.visible !== false,
                target: child.target || '_self',
                parent_id: item.id
              });
            });
          }
        });
        
        const { data: existing } = await client
          .from('navigation_items')
          .select('id');
        
        const currentIds = new Set(flattened.map((f) => f.id));
        const toDelete = (existing || [])
          .map((row) => row.id)
          .filter((id) => !currentIds.has(id));
        
        if (toDelete.length > 0) {
          await client
            .from('navigation_items')
            .delete()
            .in('id', toDelete);
        }
        
        if (flattened.length > 0) {
          const { error } = await client
            .from('navigation_items')
            .upsert(flattened);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Failed to sync navigation menu to Supabase:', err);
      }
    };
    void saveNavigation();
  }, [menuItems]);
  React.useEffect(() => {
    localStorage.setItem('cms_media', JSON.stringify(mediaAssets));
  }, [mediaAssets]);
  React.useEffect(() => {
    localStorage.setItem('cms_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  React.useEffect(() => {
    localStorage.setItem('cms_redirects', JSON.stringify(redirects));
  }, [redirects]);

  const logAction = (actionStr: string) => {
    const newLog = {
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      user: 'admin',
      action: actionStr,
      status: 'success'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const getPageBlocks = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page && page.blocks) return page.blocks;

    // Default blocks for each page
    if (pageId === 'p-1') {
      return [
        {
          id: 'b-hero',
          type: 'hero',
          titleVi: 'Tổng Thầu Thiết Kế Thi Công Trạm Khí LNG/LPG',
          titleEn: 'EPC Turnkey LNG/LPG Terminal Station Contractor',
          subtitleVi: 'Đảm bảo tiến độ thi công vượt trội, thiết bị nhập khẩu chính hãng, tiêu chuẩn an toàn PCCC.',
          subtitleEn: 'Outstanding construction engineering, premium certified imported components, TCVN safety compliant.',
          image: 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?q=80&w=800&auto=format&fit=crop',
          ctaVi: 'Nhận Báo Giá Thiết Kế',
          ctaEn: 'Request Engineering Estimate'
        },
        {
          id: 'b-clients',
          type: 'stats',
          titleVi: 'ĐỐI TÁC CHIẾN LƯỢC & KHÁCH HÀNG',
          titleEn: 'STRATEGIC PARTNERS & CLIENTS',
          itemsVi: 'COCA-COLA VN, SABECO BREWERY, HYUNDAI STEEL, VINPEARL RESORTS, CJ FOODS, SAMSUNG ELECTRONICS',
          itemsEn: 'COCA-COLA VN, SABECO BREWERY, HYUNDAI STEEL, VINPEARL RESORTS, CJ FOODS, SAMSUNG ELECTRONICS'
        },
        {
          id: 'b-divisions',
          type: 'features',
          titleVi: 'Lĩnh Vực Hoạt Động Chính',
          titleEn: 'Core Business Divisions',
          itemsVi: 'Giải Pháp Năng Lượng Khí LNG/LPG: Cung cấp trạm hóa hơi và bồn chứa; Hệ Thống Bếp Công Nghiệp: Thiết kế bếp nhà hàng khách sạn một chiều',
          itemsEn: 'LNG/LPG Gas Energy: regasification skids and storage tanks; Commercial Kitchen Systems: one-way food preparation flows'
        },
        {
          id: 'b-process',
          type: 'features',
          titleVi: 'Quy Trình Thi Công Trọn Gói EPC',
          titleEn: 'Turnkey EPC Workflow Steps',
          itemsVi: 'Khảo sát hiện trạng, Thiết kế P&ID bản vẽ, Thi công lắp đặt thiết bị, Nghiệm thu PCCC an toàn, Chạy thử vận hành, Bàn giao kỹ thuật, Bảo dưỡng định kỳ',
          itemsEn: 'Site survey, P&ID drawing design, Equipment installation, Safety approvals, Trial runs, Operations handover, Routine maintenance'
        },
        {
          id: 'b-industries',
          type: 'features',
          titleVi: 'Ngành Nghề Phục Vụ',
          titleEn: 'Industries We Serve',
          itemsVi: 'Nhà máy sản xuất FDI: Trạm cấp gas trung tâm; Luyện kim & Gốm sứ: Năng lượng lò nung hiệu năng cao; Chuyển đổi lò hơi: Chuyển đổi từ dầu FO/than sang gas LNG sạch',
          itemsEn: 'FDI Manufacturing: centralized gas infrastructure; Metallurgy & Ceramics: high-efficiency thermal kilns; Boiler Fuel Conversion: converting FO/coal to clean LNG'
        },
        {
          id: 'b-stats',
          type: 'stats',
          titleVi: 'LNG79 Qua Những Con Số',
          titleEn: 'LNG79 By The Numbers',
          itemsVi: '85+ Dự án đã cấp khí, 100% Đạt kiểm định PCCC, 15+ Năm kinh nghiệm vận hành',
          itemsEn: '85+ Gas stations running, 100% Certified safety audits, 15+ Years expert crew'
        },
        {
          id: 'b-cta',
          type: 'hero',
          titleVi: 'Bạn Cần Tư Vấn Thiết Kế Hoặc Nhận Báo Giá?',
          titleEn: 'Need Design Consultation or Custom Quote?',
          subtitleVi: 'Chúng tôi sẵn sàng khảo sát thực tế và đưa ra bài toán kinh tế tiết kiệm nhất cho doanh nghiệp.',
          subtitleEn: 'We offer free site survey audits and cost saving projections tailored for your facility.',
          ctaVi: 'Gửi yêu cầu ngay',
          ctaEn: 'Submit RFQ Now'
        }
      ];
    }
    
    // Default fallback
    return [
      { id: 'b-1', type: 'hero', titleVi: 'Giải Pháp Năng Lượng Công Nghiệp Sạch', titleEn: 'Clean Industrial Energy Solutions', subtitleVi: 'Đơn vị uy tín hàng đầu cung cấp giải pháp trạm khí hóa lỏng và bếp ăn tập thể.', subtitleEn: 'Leading B2B turnkey provider for cryogenic stations and commercial kitchens.', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=800&auto=format&fit=crop', ctaVi: 'Liên hệ tư vấn', ctaEn: 'Contact Us' }
    ];
  };

  const handleSavePageBlocks = (pageId: string, blocksList: any[]) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, blocks: blocksList } : p));
    logAction(`Saved page blocks layout for page ID: ${pageId}`);
  };

  const persistFaqsToSupabase = async (pageId: string, faqsList: any[]) => {
    const client = supabase;
    if (!client) return;
    const pageObj = pages.find(p => p.id === pageId);
    const pageSlug = pageObj?.slug;
    if (!pageSlug) return;
    try {
      await client
        .from('site_texts')
        .delete()
        .like('content_key', `${pageSlug}.faq.%`);
      if (faqsList && faqsList.length > 0) {
        const rowsToInsert = [];
        for (let i = 0; i < faqsList.length; i++) {
          const item = faqsList[i];
          rowsToInsert.push({
            content_key: `${pageSlug}.faq.${i}.q`,
            value_vi: item.q?.vi || '',
            value_en: item.q?.en || '',
            status: 'published'
          });
          rowsToInsert.push({
            content_key: `${pageSlug}.faq.${i}.a`,
            value_vi: item.a?.vi || '',
            value_en: item.a?.en || '',
            status: 'published'
          });
        }
        const { error } = await client.from('site_texts').insert(rowsToInsert);
        if (error) throw error;
      }
    } catch (err) {
      console.error('Failed to save FAQs to Supabase:', err);
    }
  };

  const handleRestoreFromTrash = (item: any) => {
    if (item.type === 'article') {
      onAddArticle(item.originalData);
      logAction(`Restored technical article from Trash Bin: "${item.name}"`);
    } else if (item.type === 'project') {
      onAddProject(item.originalData);
      logAction(`Restored project case study from Trash Bin: "${item.name}"`);
    } else if (item.type === 'lead') {
      onAddLead(item.originalData);
      logAction(`Restored client lead from Trash Bin: "${item.name}"`);
    } else if (item.type === 'product') {
      onAddProduct(item.originalData);
      logAction(`Restored product from Trash Bin: "${item.name}"`);
    }
    setTrashBin(prev => prev.filter(i => i.id !== item.id));
    alert(language === 'vi' ? 'Đã khôi phục mục này thành công!' : 'Item restored successfully!');
  };

  const handlePermanentDelete = (item: any) => {
    if (confirm(language === 'vi' ? 'Bạn có muốn xoá vĩnh viễn mục này không? Thao tác này không thể khôi phục.' : 'Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      setTrashBin(prev => prev.filter(i => i.id !== item.id));
      logAction(`Permanently deleted "${item.name}" (${item.type}) from Trash Bin`);
    }
  };

  const [auditFuel, setAuditFuel] = useState('DO');
  const [auditCons, setAuditCons] = useState(50000);
  const [auditEff, setAuditEff] = useState(82);
  const [auditPrice, setAuditPrice] = useState(20000);



  // Articles management state
  const [showAddArticleModal, setShowAddArticleModal] = useState(false);
  const [showArticleDraftPreview, setShowArticleDraftPreview] = useState(false);
  const [articleMediaPickerOpen, setArticleMediaPickerOpen] = useState(false);
  const [blockLogoPickerOpen, setBlockLogoPickerOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null);
  const [newArt, setNewArt] = useState({
    titleVi: '',
    titleEn: '',
    category: 'energy' as 'energy' | 'safety' | 'kitchen',
    excerptVi: '',
    excerptEn: '',
    contentVi: '',
    contentEn: '',
    imageURL: '',
    galleryImages: [] as string[],
    publishDate: new Date().toISOString().split('T')[0],
    sortOrder: 0
  });

  const handleEditArticleClick = (art: ArticleItem) => {
    setEditingArticle(art);
    setNewArt({
      titleVi: art.title.vi,
      titleEn: art.title.en,
      category: art.category,
      excerptVi: art.excerpt.vi,
      excerptEn: art.excerpt.en,
      contentVi: art.content.vi,
      contentEn: art.content.en,
      imageURL: art.image || art.images?.[0] || '',
      galleryImages: art.images || (art.image ? [art.image] : []),
      publishDate: art.date,
      sortOrder: art.sortOrder ?? 0
    });
    setShowAddArticleModal(true);
  };

  const handleArticleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const artData = {
      title: { vi: newArt.titleVi, en: newArt.titleEn },
      category: newArt.category,
      excerpt: { vi: newArt.excerptVi, en: newArt.excerptEn },
      content: { vi: newArt.contentVi, en: newArt.contentEn },
      image: newArt.imageURL || undefined,
      images: Array.from(new Set([newArt.imageURL, ...newArt.galleryImages].filter(Boolean))),
      date: newArt.publishDate,
      sortOrder: newArt.sortOrder,
      visible: editingArticle ? editingArticle.visible : true
    };

    if (editingArticle) {
      onEditArticle({
        ...editingArticle,
        ...artData
      });
    } else {
      onAddArticle({
        id: 'art-' + Date.now(),
        ...artData,
        date: newArt.publishDate
      });
    }
    
    setShowAddArticleModal(false);
    setEditingArticle(null);
    setNewArt({
      titleVi: '',
      titleEn: '',
      category: 'energy',
      excerptVi: '',
      excerptEn: '',
      contentVi: '',
      contentEn: '',
      imageURL: '',
      galleryImages: [],
      publishDate: new Date().toISOString().split('T')[0],
      sortOrder: 0
    });
  };

  // Projects management state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [projectMediaPickerOpen, setProjectMediaPickerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [newProj, setNewProj] = useState({
    nameVi: '',
    nameEn: '',
    category: 'lng' as 'lng' | 'lpg' | 'conversion' | 'kitchen',
    locationVi: '',
    locationEn: '',
    scopeVi: '',
    scopeEn: '',
    capacityVi: '',
    capacityEn: '',
    resultVi: '',
    resultEn: '',
    equipmentsInput: '',
    imageURL: '',
    galleryImages: [] as string[],
    sortOrder: 0
  });

  const handleEditClick = (proj: ProjectItem) => {
    setEditingProject(proj);
    setNewProj({
      nameVi: proj.name.vi,
      nameEn: proj.name.en,
      category: proj.category,
      locationVi: proj.location.vi,
      locationEn: proj.location.en,
      scopeVi: proj.scope.vi,
      scopeEn: proj.scope.en,
      capacityVi: proj.capacity.vi,
      capacityEn: proj.capacity.en,
      resultVi: proj.result.vi,
      resultEn: proj.result.en,
      equipmentsInput: proj.equipments.join(', '),
      imageURL: proj.image || proj.images?.[0] || '',
      galleryImages: proj.images || (proj.image ? [proj.image] : []),
      sortOrder: proj.sortOrder ?? 0
    });
    setShowAddProjectModal(true);
  };

  const handleProjectFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const projData = {
      name: { vi: newProj.nameVi, en: newProj.nameEn },
      category: newProj.category,
      location: { vi: newProj.locationVi, en: newProj.locationEn },
      scope: { vi: newProj.scopeVi, en: newProj.scopeEn },
      capacity: { vi: newProj.capacityVi, en: newProj.capacityEn },
      result: { vi: newProj.resultVi, en: newProj.resultEn },
      equipments: newProj.equipmentsInput.split(',').map(s => s.trim()).filter(Boolean),
      image: newProj.imageURL || 'https://images.unsplash.com/photo-1581094128547-1388d1397865?q=80&w=600&auto=format&fit=crop',
      images: Array.from(new Set([newProj.imageURL, ...newProj.galleryImages].filter(Boolean))),
      sortOrder: newProj.sortOrder,
      visible: editingProject ? editingProject.visible : true
    };

    if (editingProject) {
      onEditProject({
        ...editingProject,
        ...projData
      });
    } else {
      onAddProject({
        id: 'proj-' + Date.now(),
        ...projData
      });
    }

    setShowAddProjectModal(false);
    setEditingProject(null);
    setNewProj({
      nameVi: '',
      nameEn: '',
      category: 'lng',
      locationVi: '',
      locationEn: '',
      scopeVi: '',
      scopeEn: '',
      capacityVi: '',
      capacityEn: '',
      resultVi: '',
      resultEn: '',
      equipmentsInput: '',
      imageURL: '',
      galleryImages: [],
      sortOrder: 0
    });
  };

  const currentAuditFuel = AUDIT_FUELS[auditFuel];
  const monthlyEnergy = auditCons * currentAuditFuel.lhv * (auditEff / 100);
  const annualEnergy = monthlyEnergy * 12;
  const annualOldCost = auditCons * auditPrice * 12;
  const oldCo2 = (auditCons * currentAuditFuel.co2Factor * 12) / 1000;

  const lngNeeded = annualEnergy / (50 * 0.92);
  const lngCost = lngNeeded * fuelSettings.lngPrice;
  const lngCo2 = (lngNeeded * 2.75) / 1000;
  const lngSavings = annualOldCost - lngCost;
  const co2Saved = Math.max(0, oldCo2 - lngCo2);



  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      maximumFractionDigits: 0
    }).format(val);
  };
  const formatNumber = (val: number, decimals = 0) => {
    return new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');
    try {
      if (supabaseConfiguration.configured) {
        const { error } = await getSupabaseClient().auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        const profile = await getCurrentCmsProfile();
        if (!profile) {
          await getSupabaseClient().auth.signOut({ scope: 'local' });
          throw new Error(language === 'vi' ? 'Tài khoản chưa được kích hoạt quyền CMS.' : 'This account has not been activated for CMS access.');
        }
        setIsLoggedIn(true);
        setPassword('');
        logAction('Administrator logged in successfully');
        return;
      }
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: email, password }) });
      const result = await response.json();
      if (!response.ok || !result.authenticated) throw new Error(result.error || (language === 'vi' ? 'Sai tài khoản hoặc mật khẩu.' : 'Invalid credentials.'));
      setIsLoggedIn(true);
      setPassword('');
      logAction('Administrator logged in with legacy fallback');
    } catch (reason) {
      setAuthError(reason instanceof Error ? reason.message : (language === 'vi' ? 'Không thể kết nối máy chủ đăng nhập.' : 'Could not connect to the authentication server.'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    if (supabaseConfiguration.configured) await getSupabaseClient().auth.signOut().catch(() => undefined);
    else await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setIsLoggedIn(false);
  };

  // Statistics
  const newLeads = leads.filter(l => l.status === 'new').length;


  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ lngPrice: lngInput, lpgPrice: lpgInput });
    alert(language === 'vi' ? 'Đã cập nhật hệ số giá nhiên liệu thành công!' : 'Fuel calculator settings updated successfully!');
  };

  const handleExportBackup = () => {
    const backup = createCmsBackup();
    downloadCmsBackup(backup);
    setBackupMessage(language === 'vi' ? `Đã xuất ${Object.keys(backup.data).length} nhóm dữ liệu lúc ${new Date(backup.exportedAt).toLocaleString('vi-VN')}.` : `Exported ${Object.keys(backup.data).length} data groups.`);
    logAction('Exported a full CMS JSON backup');
  };

  const handleImportBackup = async (file?: File) => {
    if (!file) return;
    setBackupMessage('');
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error(language === 'vi' ? 'File backup không được vượt quá 20 MB.' : 'Backup file must not exceed 20 MB.');
      const backup = validateCmsBackup(JSON.parse(await file.text()));
      const summary = `${Object.keys(backup.data).length} ${language === 'vi' ? 'nhóm dữ liệu, tạo lúc' : 'data groups, created at'} ${new Date(backup.exportedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}`;
      if (!window.confirm(`${language === 'vi' ? 'Khôi phục backup này?' : 'Restore this backup?'}\n${summary}\n${language === 'vi' ? 'Hệ thống sẽ tự tải một bản sao lưu hiện tại trước khi thay thế.' : 'The current state will be downloaded before replacement.'}`)) return;
      downloadCmsBackup(createCmsBackup(), 'lng79-before-restore');
      restoreCmsBackup(backup);
      window.location.reload();
    } catch (reason) {
      setBackupMessage(reason instanceof Error ? reason.message : (language === 'vi' ? 'Không thể đọc file backup.' : 'Could not read backup file.'));
    }
  };

  const getStatusLabel = (status: LeadItem['status']) => {
    const labels = {
      new: { vi: 'Mới nhận', en: 'New Lead', color: '#3B82F6', bg: '#EFF6FF' },
      contacted: { vi: 'Đã liên hệ', en: 'Contacted', color: '#F59E0B', bg: '#FEF3C7' },
      survey: { vi: 'Lịch khảo sát', en: 'Site Survey', color: '#8B5CF6', bg: '#F5F3FF' },
      closed: { vi: 'Thành công', en: 'Closed Won', color: '#10B981', bg: '#ECFDF5' }
    };
    return labels[status];
  };

  if (!isLoggedIn) {
    return (
      <div style={styles.loginOverlay}>
        <div style={styles.loginCard} className="animate-fade-in">
          <div style={styles.loginHeader}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Flame size={24} color="var(--color-orange)" />
              <ChefHat size={24} color="var(--color-teal)" />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-navy)', textAlign: 'center', margin: 0 }}>
              {language === 'vi' ? 'Cổng Bảo Mật CMS' : 'CMS Security Portal'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '0.25rem', marginBottom: 0 }}>
              {language === 'vi' ? 'Đăng nhập quyền quản trị trạm cấp khí & bếp' : 'Sign in to access energy & kitchen controls'}
            </p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
            {authError && (
              <div style={styles.errorAlert}>
                <span>⚠️ {authError}</span>
              </div>
            )}
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{language === 'vi' ? 'Email quản trị *' : 'Admin email *'}</label>
              <input 
                type="email"
                className="form-input" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="admin@domain.com"
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
  }

  const renderMeshEditor = (mode: 'dark' | 'light') => {
    const baseColor = mode === 'dark' 
      ? (guiSettings.darkBaseColor || '#070a13') 
      : (guiSettings.lightBaseColor || '#ffffff');
    const nodes = (mode === 'dark' ? guiSettings.darkCustomMesh : guiSettings.lightCustomMesh) || (mode === 'dark' ? [
      { color: '#14b8a6', opacity: 20, x: 20, y: 30, size: 60 },
      { color: '#3b82f6', opacity: 25, x: 80, y: 70, size: 70 },
      { color: '#a855f7', opacity: 15, x: 50, y: 50, size: 65 }
    ] : [
      { color: '#06b6d4', opacity: 35, x: 15, y: 20, size: 55 },
      { color: '#6366f1', opacity: 25, x: 80, y: 80, size: 60 },
      { color: '#d946ef', opacity: 20, x: 50, y: 40, size: 50 }
    ]);

    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result 
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 7, g: 10, b: 19 };
    };

    const baseRgb = hexToRgb(baseColor);
    const globalOpacity = mode === 'dark' ? (guiSettings.darkOpacity ?? 85) : (guiSettings.lightOpacity ?? 30);
    const baseVal = `rgba(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b}, ${globalOpacity / 100})`;

    const radialGradients = nodes.map(node => {
      const rgb = hexToRgb(node.color);
      const alpha = node.opacity / 100;
      return `radial-gradient(circle at ${node.x}% ${node.y}%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha}) 0%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0) ${node.size}%)`;
    });

    const meshGradientBackground = `${radialGradients.join(', ')}, ${baseVal}`;

    const updateNodes = (newNodes: any[]) => {
      if (mode === 'dark') {
        onUpdateGuiSettings({ ...guiSettings, darkCustomMesh: newNodes });
      } else {
        onUpdateGuiSettings({ ...guiSettings, lightCustomMesh: newNodes });
      }
    };

    const handleAddNode = () => {
      const colors = ['#14b8a6', '#3b82f6', '#a855f7', '#f43f5e', '#eab308', '#10b981'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newNode = {
        color: randomColor,
        opacity: 30,
        x: Math.floor(Math.random() * 60) + 20,
        y: Math.floor(Math.random() * 60) + 20,
        size: Math.floor(Math.random() * 30) + 40
      };
      const newNodes = [...nodes, newNode];
      updateNodes(newNodes);
      setSelectedNodeIndex(newNodes.length - 1);
    };

    const handleDeleteNode = () => {
      if (nodes.length <= 1) return;
      const newNodes = nodes.filter((_, idx) => idx !== selectedNodeIndex);
      updateNodes(newNodes);
      setSelectedNodeIndex(Math.max(0, selectedNodeIndex - 1));
    };

    const handleNodeChange = (field: string, val: any) => {
      const updated = [...nodes];
      updated[selectedNodeIndex] = { ...updated[selectedNodeIndex], [field]: val };
      updateNodes(updated);
    };

    const activeNode = nodes[selectedNodeIndex] || nodes[0] || { color: '#14b8a6', opacity: 30, x: 50, y: 50, size: 50 };

    const handleHandleMouseDown = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setSelectedNodeIndex(index);

      const handleElement = e.currentTarget as HTMLElement;
      const canvasElement = handleElement.parentElement;
      if (!canvasElement) return;

      const rect = canvasElement.getBoundingClientRect();

      const onMouseMove = (moveEvent: MouseEvent) => {
        let newX = Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100);
        let newY = Math.round(((moveEvent.clientY - rect.top) / rect.height) * 100);

        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        const updated = [...nodes];
        updated[index] = { ...updated[index], x: newX, y: newY };
        updateNodes(updated);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    const homePage = pages.find((p: any) => p.slug === 'home' || p.id === 'p-1');
    const heroBlock = homePage?.blocks?.find((b: any) => b.type === 'hero' || b.id === 'b-hero');
    const actualHeroImage = heroBlock?.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop';

    const previewContainerStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      height: '240px',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid var(--color-gray-border)',
      backgroundColor: '#0a0d16',
      userSelect: 'none',
      backgroundImage: previewLayout === 'hero'
        ? `url("${actualHeroImage}")`
        : previewLayout === 'banner'
          ? 'url("https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=2070&auto=format&fit=crop")'
          : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };

    const backgroundLayerStyle: React.CSSProperties = {
      position: 'absolute',
      top: '-15%',
      left: '-15%',
      width: '130%',
      height: '130%',
      background: meshGradientBackground,
      filter: 'blur(30px)',
      transform: 'scale(1.1)',
      zIndex: 1
    };

    return (
      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem', padding: '1.25rem', backgroundColor: 'var(--color-gray-bg)', borderRadius: 'var(--border-radius-md)', border: '1px dashed var(--color-gray-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎨 {language === 'vi' ? 'Công cụ Thiết kế Mesh Gradient (Mesher)' : 'Custom Mesh Gradient Builder'}
          </h5>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              className={`btn btn-sm ${previewLayout === 'canvas' ? 'btn-teal' : 'btn-outline'}`}
              onClick={() => setPreviewLayout('canvas')}
            >
              {language === 'vi' ? 'Nền trơn' : 'Canvas'}
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${previewLayout === 'hero' ? 'btn-teal' : 'btn-outline'}`}
              onClick={() => setPreviewLayout('hero')}
            >
              {language === 'vi' ? 'Trang chủ Hero' : 'Home Hero'}
            </button>
            <button 
              type="button" 
              className={`btn btn-sm ${previewLayout === 'banner' ? 'btn-teal' : 'btn-outline'}`}
              onClick={() => setPreviewLayout('banner')}
            >
              {language === 'vi' ? 'Trang con Banner' : 'Inner Banner'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }} className="mesher-layout-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={previewContainerStyle}>
              {/* Layer 1: Raw Canvas Mesh or Warped Mesh Overlay */}
              {previewLayout === 'canvas' ? (
                <div style={{ position: 'absolute', width: '100%', height: '100%', background: meshGradientBackground, zIndex: 1 }} />
              ) : (
                <div style={backgroundLayerStyle} />
              )}



              {/* Layer 3: Text Content */}
              {previewLayout === 'hero' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3, display: 'flex', flexDirection: 'column', padding: '1rem', color: mode === 'dark' ? '#fff' : '#070a13', justifyContent: 'center', textAlign: 'left' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0.4rem 1rem', borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)', fontSize: '0.65rem', fontWeight: 600 }}>
                    <span>⚡ LNG 79</span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span>Trang Chủ</span>
                      <span>Thiết Kế</span>
                      <span>Dự Án</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'var(--color-teal)', letterSpacing: '0.05em' }}>CÔNG NGHỆ BẾP & CENTRAL GAS</span>
                    <h4 style={{ margin: '0.1rem 0', fontSize: '0.85rem', fontWeight: 800, lineHeight: 1.2 }}>THIẾT KẾ BẾP CÔNG NGHIỆP HIỆN ĐẠI</h4>
                    <p style={{ margin: '0.2rem 0', fontSize: '0.55rem', opacity: 0.8, maxWidth: '200px' }}>Tối ưu hóa hiệu năng, tiết kiệm nhiên liệu cho hệ thống nhà hàng lớn.</p>
                    <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.5rem', padding: '0.15rem 0.4rem', backgroundColor: 'var(--color-teal)', color: '#fff', borderRadius: '2px', fontWeight: 600 }}>Khảo Sát</span>
                      <span style={{ fontSize: '0.5rem', padding: '0.15rem 0.4rem', border: '1px solid currentColor', borderRadius: '2px' }}>Liên Hệ</span>
                    </div>
                  </div>
                </div>
              )}

              {previewLayout === 'banner' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem', color: mode === 'dark' ? '#fff' : '#070a13', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>Trang chủ / Giải pháp</span>
                  <h3 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 800 }}>Thiết Kế Central Gas</h3>
                </div>
              )}

              {previewLayout === 'canvas' && nodes.map((node, index) => (
                <div
                  key={index}
                  onMouseDown={(e) => handleHandleMouseDown(index, e)}
                  style={{
                    position: 'absolute',
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    width: index === selectedNodeIndex ? '20px' : '16px',
                    height: index === selectedNodeIndex ? '20px' : '16px',
                    backgroundColor: node.color,
                    border: '2px solid #ffffff',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'move',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
                    zIndex: 10,
                    transition: 'width 0.1s, height 0.1s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '7px', fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
            <small style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              💡 {language === 'vi' ? 'Kéo các nút số (1, 2, 3...) trực tiếp trên Canvas để thay đổi vị trí màu' : 'Drag the numbered dots directly on the Canvas to move color spots'}
            </small>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>{language === 'vi' ? 'Màu nền chính (Base Color)' : 'Base Background Color'}</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={baseColor}
                    onChange={(e) => {
                      if (mode === 'dark') {
                        onUpdateGuiSettings({ ...guiSettings, darkBaseColor: e.target.value });
                      } else {
                        onUpdateGuiSettings({ ...guiSettings, lightBaseColor: e.target.value });
                      }
                    }}
                    style={{ width: '36px', height: '36px', padding: 0, border: '1px solid var(--color-gray-border)', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    value={baseColor}
                    onChange={(e) => {
                      if (mode === 'dark') {
                        onUpdateGuiSettings({ ...guiSettings, darkBaseColor: e.target.value });
                      } else {
                        onUpdateGuiSettings({ ...guiSettings, lightBaseColor: e.target.value });
                      }
                    }}
                    style={{ height: '36px', padding: '0 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '0.25rem' }}>
                <button
                  type="button"
                  className="btn btn-teal btn-sm"
                  onClick={handleAddNode}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                >
                  ➕ {language === 'vi' ? 'Thêm màu' : 'Add Spot'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={nodes.length <= 1}
                  onClick={handleDeleteNode}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', opacity: nodes.length <= 1 ? 0.5 : 1 }}
                >
                  🗑️ {language === 'vi' ? 'Xóa màu' : 'Delete'}
                </button>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-gray-border)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--color-navy)' }}>
                  {language === 'vi' ? `Hiệu chỉnh Điểm màu #${selectedNodeIndex + 1}` : `Editing Color Spot #${selectedNodeIndex + 1}`}
                </strong>
                <span style={{ fontSize: '0.75rem', backgroundColor: activeNode.color, color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '3px', fontWeight: 700, textShadow: '0 1px 1px rgba(0,0,0,0.5)' }}>
                  {activeNode.color}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>{language === 'vi' ? 'Màu sắc' : 'Color'}</label>
                  <input
                    type="color"
                    value={activeNode.color}
                    onChange={(e) => handleNodeChange('color', e.target.value)}
                    style={{ width: '100%', height: '32px', padding: 0, border: '1px solid var(--color-gray-border)', borderRadius: '4px', cursor: 'pointer' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>{language === 'vi' ? `Kích cỡ: ${activeNode.size}%` : `Size: ${activeNode.size}%`}</label>
                  <input
                    type="range"
                    min="10"
                    max="120"
                    value={activeNode.size}
                    onChange={(e) => handleNodeChange('size', parseInt(e.target.value))}
                    className="slider"
                    style={{ width: '100%', height: '6px', marginTop: '8px', cursor: 'pointer' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>{language === 'vi' ? `Độ mờ: ${activeNode.opacity}%` : `Opacity: ${activeNode.opacity}%`}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeNode.opacity}
                    onChange={(e) => handleNodeChange('opacity', parseInt(e.target.value))}
                    className="slider"
                    style={{ width: '100%', height: '6px', marginTop: '8px', cursor: 'pointer' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>{language === 'vi' ? `Tọa độ X: ${activeNode.x}%` : `X Position: ${activeNode.x}%`}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeNode.x}
                    onChange={(e) => handleNodeChange('x', parseInt(e.target.value))}
                    className="slider"
                    style={{ width: '100%', height: '6px', marginTop: '8px', cursor: 'pointer' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0, gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>{language === 'vi' ? `Tọa độ Y: ${activeNode.y}%` : `Y Position: ${activeNode.y}%`}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeNode.y}
                    onChange={(e) => handleNodeChange('y', parseInt(e.target.value))}
                    className="slider"
                    style={{ width: '100%', height: '6px', marginTop: '8px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '90vh', backgroundColor: '#F8FAFC', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-premium)', border: '1px solid var(--color-gray-border)', width: '100%', textAlign: 'left' }}>
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <div style={{ width: '280px', backgroundColor: 'var(--color-navy)', color: 'var(--color-white)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
        <div>
          {/* Brand branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.25rem' }}>
            <Flame size={28} color="var(--color-orange)" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-white)', lineHeight: 1.2 }}>LNG79 CMS</h4>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.5px' }}>ADMIN CONTROL UNIT</span>
            </div>
          </div>

          {onExitCms && (
            <button
              onClick={onExitCms}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)',
                color: 'var(--color-white)', padding: '0.6rem 1rem', width: '100%', cursor: 'pointer',
                fontSize: '0.85rem', fontWeight: 700, borderRadius: 'var(--border-radius-sm)',
                marginBottom: '1.5rem', transition: 'var(--transition-fast)'
              }}
            >
              🌐 {language === 'vi' ? 'Quay lại Website' : 'Back to Website'}
            </button>
          )}

          {/* Links list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {/* Overview */}
            <button 
              onClick={() => setActiveTab('overview')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'overview' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'overview' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <TrendingUp size={16} />
              <span>{language === 'vi' ? 'Tổng quan' : 'Overview'}</span>
            </button>

            {/* Pages */}
            <button 
              onClick={() => setActiveTab('pages')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'pages' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'pages' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <FileText size={16} />
              <span>{language === 'vi' ? 'Trang nội dung' : 'Pages Manager'}</span>
            </button>

            {/* Menus */}
            <button 
              onClick={() => setActiveTab('navigation')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'navigation' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'navigation' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <Layers size={16} />
              <span>{language === 'vi' ? 'Thanh điều hướng' : 'Menus & Nav'}</span>
            </button>

            {/* Media */}
            <button 
              onClick={() => setActiveTab('media')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'media' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'media' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <Plus size={16} />
              <span>{language === 'vi' ? 'Thư viện file' : 'Media Vault'}</span>
            </button>

            {/* Leads */}
            <button 
              onClick={() => setActiveTab('leads')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'leads' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'leads' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <Users size={16} />
              <span>{language === 'vi' ? 'Yêu cầu tư vấn' : 'Leads CRM'}</span>
            </button>

            {/* Products */}
            <button 
              onClick={() => setActiveTab('products')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'products' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'products' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <Layers size={16} />
              <span>{language === 'vi' ? 'Sản phẩm' : 'Products catalog'}</span>
            </button>

            {/* Projects */}
            <button 
              onClick={() => setActiveTab('projects')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'projects' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'projects' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <Briefcase size={16} />
              <span>{language === 'vi' ? 'Dự án đã làm' : 'Projects Done'}</span>
            </button>

            {/* Articles */}
            <button 
              onClick={() => setActiveTab('articles')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'articles' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'articles' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <FileText size={16} />
              <span>{language === 'vi' ? 'Thư viện bài viết' : 'Knowledge Manuals'}</span>
            </button>

            {/* Settings */}
            <button 
              onClick={() => setActiveTab('settings')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'settings' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'settings' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <Settings size={16} />
              <span>{language === 'vi' ? 'Hệ số tính toán' : 'Calculator tuning'}</span>
            </button>

            {/* SEO */}
            <button 
              onClick={() => setActiveTab('seo')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'seo' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'seo' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <Settings size={16} />
              <span>{language === 'vi' ? 'SEO & Redirects' : 'SEO & Redirects'}</span>
            </button>

            {/* GUI */}
            <button 
              onClick={() => setActiveTab('gui')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'gui' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'gui' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <Layers size={16} />
              <span>GUI</span>
            </button>

            {/* Logs */}
            <button 
              onClick={() => setActiveTab('logs')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'logs' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'logs' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <RefreshCw size={16} />
              <span>{language === 'vi' ? 'Nhật ký audit' : 'Security Logs'}</span>
            </button>

            {/* Trash Bin */}
            <button 
              onClick={() => setActiveTab('trash')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', padding: '0.75rem 1rem', width: '100%', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left', borderRadius: 'var(--border-radius-sm)', transition: 'var(--transition-fast)',
                color: activeTab === 'trash' ? 'var(--color-white)' : 'rgba(255, 255, 255, 0.7)',
                backgroundColor: activeTab === 'trash' ? 'var(--color-teal)' : 'transparent'
              }}
            >
              <Trash2 size={16} />
              <span>{language === 'vi' ? 'Thùng rác' : 'Trash Bin'}</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>v1.2 MVP Build</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--color-teal)', fontWeight: 700, backgroundColor: 'rgba(13,148,136,0.15)', padding: '0.1rem 0.4rem', borderRadius: 'var(--border-radius-sm)' }}>Active</span>
          </div>
          <button 
            className="btn btn-outline" 
            onClick={handleLogout}
            style={{ width: '100%', borderColor: 'rgba(255,255,255,0.2)', color: 'var(--color-white)', fontSize: '0.85rem' }}
          >
            {language === 'vi' ? 'Đăng xuất' : 'Sign Out'}
          </button>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', overflowX: 'hidden' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', color: 'var(--color-navy)', margin: 0 }}>
                {language === 'vi' ? 'Tổng Quan Hoạt Động Hệ Thống' : 'System Overview & Diagnostics'}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {language === 'vi' ? 'Cập nhật số liệu truy cập, trạng thái trang và cảnh báo nội dung.' : 'Real-time counters, publishing states, and SEO integrity audit alerts.'}
              </p>
            </div>

            <div className="cms-ai-translate-card">
              <div>
                <span className="cms-ai-translate-card__eyebrow">GROQ AI</span>
                <h4>{language === 'vi' ? 'Dịch toàn bộ nội dung VI → EN' : 'Translate all VI content to EN'}</h4>
                <p>{language === 'vi' ? 'Dịch Pages, Catalog, Dự án, Kiến thức và thông tin liên hệ. Nội dung tiếng Việt được giữ nguyên.' : 'Translate Pages, Catalog, Projects, Articles, and contact details. Vietnamese source text is preserved.'}</p>
                {translationProgress && <div className="cms-translation-progress"><span style={{ width: `${translationProgress.total ? (translationProgress.done / translationProgress.total) * 100 : 0}%` }} /></div>}
                {translationMessage && <small className="cms-translation-message">{translationMessage}</small>}
              </div>
              <button
                className="btn btn-primary"
                disabled={Boolean(translationProgress)}
                onClick={async () => {
                  if (!confirm(language === 'vi' ? 'AI sẽ ghi đè toàn bộ nội dung tiếng Anh hiện tại. Tiếp tục?' : 'AI will overwrite all current English content. Continue?')) return;
                  setTranslationMessage('');
                  setTranslationProgress({ done: 0, total: 1 });
                  try {
                    await onTranslateAllContent((done, total) => setTranslationProgress({ done, total }));
                    setTranslationMessage(language === 'vi' ? 'Đã dịch và lưu toàn bộ nội dung.' : 'All content translated and saved.');
                    logAction('Translated all website content from VI to EN with Groq AI');
                  } catch (error) {
                    setTranslationMessage(error instanceof Error ? error.message : 'Groq translation failed');
                  } finally {
                    setTranslationProgress(null);
                  }
                }}
              >
                {translationProgress ? (language === 'vi' ? 'Đang dịch…' : 'Translating…') : (language === 'vi' ? 'Dịch toàn bộ bằng AI' : 'Translate all with AI')}
              </button>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
              <div style={styles.statCard}>
                <TrendingUp size={24} color="var(--color-teal)" />
                <div>
                  <span style={styles.statLabel}>{language === 'vi' ? 'Tổng số trang' : 'Total Pages'}</span>
                  <span style={styles.statValue}>{pages.length}</span>
                </div>
              </div>
              <div style={styles.statCard}>
                <Users size={24} color="#3B82F6" />
                <div>
                  <span style={styles.statLabel}>{language === 'vi' ? 'Yêu cầu Leads mới' : 'New Leads'}</span>
                  <span style={styles.statValue}>{newLeads}</span>
                </div>
              </div>
              <div style={styles.statCard}>
                <FileText size={24} color="#8B5CF6" />
                <div>
                  <span style={styles.statLabel}>{language === 'vi' ? 'Bài viết thư viện' : 'Published Articles'}</span>
                  <span style={styles.statValue}>{articles.length}</span>
                </div>
              </div>
              <div style={styles.statCard}>
                <Plus size={24} color="#10B981" />
                <div>
                  <span style={styles.statLabel}>{language === 'vi' ? 'Kho ảnh & file (Media)' : 'Media Vault Files'}</span>
                  <span style={styles.statValue}>{mediaAssets.length}</span>
                </div>
              </div>
            </div>

            {/* Diagnostic split row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
              {/* Health checks */}
              <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-navy)', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.75rem' }}>
                  ⚠️ {language === 'vi' ? 'Cảnh Báo Nội Dung (SEO / Hình Ảnh)' : 'SEO & Content Health Alerts'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem' }}>
                    <span>💡</span>
                    <span>{language === 'vi' ? 'Có 2 trang nội dung chưa điền thẻ Meta Description.' : '2 pages are missing custom SEO Meta Descriptions.'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem' }}>
                    <span>❌</span>
                    <span>{language === 'vi' ? 'Bài viết "LPG Safety Guidelines" chưa cấu hình thẻ Alt Text cho ảnh bìa.' : 'Article "LPG Safety Guidelines" is missing descriptive Alt Text tags.'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.85rem' }}>
                    <span>ℹ️</span>
                    <span>{language === 'vi' ? 'Đã kích hoạt chế độ tự động tối ưu hóa nén ảnh WebP.' : 'Automatic WebP image compression engine is online.'}</span>
                  </div>
                </div>
              </div>

              {/* Quick info logs */}
              <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-navy)', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.75rem' }}>
                  ⚡ {language === 'vi' ? 'Cập Nhật Gần Đây' : 'Recent Administrator Operations'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {auditLogs.slice(0, 3).map((log) => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--color-text-main)' }}>{log.action}</span>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{log.timestamp.split('T')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* PAGES MANAGER TAB */}
        {activeTab === 'pages' && !editingBlocksPageId && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', margin: 0 }}>
                {language === 'vi' ? 'Quản Lý Danh Sách Trang Nội Dung' : 'Manage Content Pages'}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {language === 'vi' ? 'Cấu hình tiêu đề, đường dẫn tĩnh (Slug), và trạng thái hiển thị của các trang chính.' : 'Configure route URLs, localized page content records, and index options.'}
              </p>
            </div>

            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>{language === 'vi' ? 'Tên Trang (VI / EN)' : 'Page Title (VI / EN)'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Đường Dẫn URL' : 'Slug / Route'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Trạng Thái' : 'Status'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Menu' : 'On Menu'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Search Index' : 'Indexed'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Thao Tác' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p) => {
                    const titleVi = p.title?.vi || p.titleVi || p.name || '';
                    const titleEn = p.title?.en || p.titleEn || p.name || '';
                    return (
                      <React.Fragment key={p.id}>
                        <tr style={styles.tr}>
                          <td style={styles.td}>
                            <strong>{titleVi}</strong> / <span style={{ color: 'var(--color-text-muted)' }}>{titleEn}</span>
                          </td>
                          <td style={styles.td}>
                            <code style={{ backgroundColor: '#F1F5F9', padding: '0.1rem 0.3rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.8rem' }}>/{p.slug}</code>
                          </td>
                          <td style={styles.td}>
                            <select 
                              value={p.status}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                setPages(prev => prev.map(item => item.id === p.id ? { ...item, status: newStatus } : item));
                                logAction(`Changed page "${titleVi}" status to ${newStatus}`);
                              }}
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.8rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-gray-border)' }}
                            >
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                              <option value="hidden">Hidden</option>
                            </select>
                          </td>
                          <td style={styles.td}>
                            <input 
                              type="checkbox" 
                              checked={p.onMenu !== false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPages(prev => prev.map(item => item.id === p.id ? { ...item, onMenu: checked } : item));
                                logAction(`Changed page "${titleVi}" menu option to ${checked}`);
                              }}
                            />
                          </td>
                          <td style={styles.td}>
                            <input 
                              type="checkbox" 
                              checked={p.searchable !== false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setPages(prev => prev.map(item => item.id === p.id ? { ...item, searchable: checked } : item));
                                logAction(`Changed page "${titleVi}" search indexing to ${checked}`);
                              }}
                            />
                          </td>
                          <td style={styles.td}>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                              onClick={() => {
                                const newTitle = prompt('Nhập tên trang tiếng Việt:', titleVi);
                                if (newTitle) {
                                  setPages(prev => prev.map(item => item.id === p.id ? { ...item, title: { ...(item.title || {}), vi: newTitle } } : item));
                                  logAction(`Renamed page to "${newTitle}"`);
                                }
                              }}
                            >
                              Sửa tên
                            </button>
                            <button 
                              className="btn btn-teal btn-sm"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}
                              onClick={() => {
                                setEditingBlocksPageId(p.id);
                                const blocks = getPageBlocks(p.id);
                                if (blocks.length > 0) {
                                  setSelectedBlockId(blocks[0].id);
                                } else {
                                  setSelectedBlockId(null);
                                }
                              }}
                            >
                              {language === 'vi' ? 'Thiết kế block' : 'Page Blocks'}
                            </button>
                            {p.id !== 'p-1' && (
                              <button 
                                className={`btn btn-sm ${expandedBannerPageId === p.id ? 'btn-teal' : 'btn-outline'}`}
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}
                                onClick={() => {
                                  setExpandedBannerPageId(expandedBannerPageId === p.id ? null : p.id);
                                  setExpandedFaqPageId(null);
                                }}
                              >
                                🖼️ {language === 'vi' ? 'Ảnh bìa' : 'Banner'}
                              </button>
                            )}
                            {['p-2', 'p-3', 'p-4', 'p-5'].includes(p.id) && (
                              <button 
                                className={`btn btn-sm ${expandedFaqPageId === p.id ? 'btn-teal' : 'btn-outline'}`}
                                style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}
                                onClick={() => {
                                  setExpandedFaqPageId(expandedFaqPageId === p.id ? null : p.id);
                                  setExpandedBannerPageId(null);
                                }}
                              >
                                ❓ FAQ
                              </button>
                            )}
                          </td>
                        </tr>
                      {expandedBannerPageId === p.id && (
                        <tr style={{ backgroundColor: '#F8FAFC' }}>
                          <td colSpan={6} style={{ padding: '1rem', borderBottom: '1px solid var(--color-gray-border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '500px' }}>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--color-navy)' }}>
                                {language === 'vi' ? 'Cấu hình Ảnh bìa (Banner) của trang' : 'Page Banner Configuration'}
                              </strong>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{
                                  width: '120px',
                                  height: '40px',
                                  borderRadius: 'var(--border-radius-sm)',
                                  border: '1px solid var(--color-gray-border)',
                                  backgroundImage: `url(${p.bannerImage || (
                                    p.id === 'p-2' || p.id === 'p-3' || p.id === 'p-4' || p.id === 'p-5'
                                      ? 'https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=2070&auto=format&fit=crop'
                                      : p.id === 'p-6'
                                        ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop'
                                        : p.id === 'p-7'
                                          ? 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop'
                                          : p.id === 'p-8'
                                            ? 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop'
                                            : 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=2070&auto=format&fit=crop'
                                  )})`,
                                  backgroundSize: p.bannerScale !== undefined ? `${p.bannerScale}%` : 'cover',
                                  backgroundPosition: `center ${p.bannerAlignmentY !== undefined ? p.bannerAlignmentY : 50}%`
                                }} />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button 
                                    type="button" 
                                    className="btn btn-teal btn-sm"
                                    onClick={() => {
                                      setPickerForPageId(p.id);
                                      setPageBannerImagePickerOpen(true);
                                    }}
                                  >
                                    {language === 'vi' ? 'Chọn từ Media Vault' : 'Choose from Media'}
                                  </button>
                                  {p.bannerImage && (
                                    <button 
                                      type="button" 
                                      className="btn btn-outline btn-sm"
                                      onClick={() => {
                                        setPages(prev => prev.map(item => item.id === p.id ? { ...item, bannerImage: undefined, bannerScale: undefined } : item));
                                        logAction(`Reset banner image for page ID: ${p.id}`);
                                      }}
                                    >
                                      {language === 'vi' ? 'Xóa (Dùng mặc định)' : 'Reset to Default'}
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {p.bannerImage && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {/* Focal Y */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', marginBottom: 0 }}>
                                      <span>{language === 'vi' ? 'Cắt & Căn dọc ảnh bìa (Ultrawide Crop)' : 'Vertical Crop & Focus'}</span>
                                      <span style={{ fontWeight: 'bold', color: 'var(--color-teal)' }}>{p.bannerAlignmentY !== undefined ? p.bannerAlignmentY : 50}%</span>
                                    </label>
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="100" 
                                      value={p.bannerAlignmentY !== undefined ? p.bannerAlignmentY : 50}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setPages(prev => prev.map(item => item.id === p.id ? { ...item, bannerAlignmentY: val } : item));
                                      }}
                                      style={{ width: '100%', cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8' }}>
                                      <span>{language === 'vi' ? 'Trên (Top)' : 'Top'}</span>
                                      <span>{language === 'vi' ? 'Giữa' : 'Center'}</span>
                                      <span>{language === 'vi' ? 'Dưới (Bottom)' : 'Bottom'}</span>
                                    </div>
                                  </div>

                                  {/* Scale / Zoom */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '0.5rem' }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', marginBottom: 0 }}>
                                      <span>{language === 'vi' ? 'Thu phóng hình ảnh (Zoom)' : 'Zoom / Scale'}</span>
                                      <span style={{ fontWeight: 'bold', color: 'var(--color-teal)' }}>{p.bannerScale !== undefined ? p.bannerScale : 100}%</span>
                                    </label>
                                    <input 
                                      type="range" 
                                      min="100" 
                                      max="200" 
                                      value={p.bannerScale !== undefined ? p.bannerScale : 100}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setPages(prev => prev.map(item => item.id === p.id ? { ...item, bannerScale: val } : item));
                                      }}
                                      style={{ width: '100%', cursor: 'pointer' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8' }}>
                                      <span>100% (Cover)</span>
                                      <span>150%</span>
                                      <span>200%</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      {expandedFaqPageId === p.id && (
                        <tr style={{ backgroundColor: '#F8FAFC' }}>
                          <td colSpan={6} style={{ padding: '1rem', borderBottom: '1px solid var(--color-gray-border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '0.9rem', color: 'var(--color-navy)' }}>
                                  {language === 'vi' ? 'Quản lý danh sách Câu hỏi thường gặp (FAQ)' : 'Manage Frequently Asked Questions'}
                                </strong>
                                <button 
                                  type="button" 
                                  className="btn btn-teal btn-sm"
                                  onClick={() => {
                                    const newFaq = { 
                                      q: { vi: 'Câu hỏi mới', en: 'New question' }, 
                                      a: { vi: 'Nội dung trả lời mới', en: 'New answer details' } 
                                    };
                                    const updated = [...(p.faqs || []), newFaq];
                                    setPages(prev => prev.map(item => item.id === p.id ? { ...item, faqs: updated } : item));
                                    logAction(`Added new FAQ item to page ID: ${p.id}`);
                                    void persistFaqsToSupabase(p.id, updated);
                                  }}
                                >
                                  + {language === 'vi' ? 'Thêm câu hỏi' : 'Add FAQ'}
                                </button>
                              </div>
                              
                              {(!p.faqs || p.faqs.length === 0) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                    {language === 'vi' ? 'Chưa có câu hỏi nào được cấu hình cho trang này.' : 'No FAQs configured for this page.'}
                                  </p>
                                  {p.id === 'p-2' && (
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      style={{ width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                      onClick={() => {
                                        const defaultFaqs = SOLUTIONS_PAGE_DATA['lng-solution']?.faqs || [];
                                        setPages(prev => prev.map(item => item.id === p.id ? { ...item, faqs: defaultFaqs } : item));
                                        logAction(`Seeded default LNG FAQs locally`);
                                        void persistFaqsToSupabase(p.id, defaultFaqs);
                                      }}
                                    >
                                      📥 {language === 'vi' ? 'Khởi tạo 10 câu hỏi mẫu từ mã nguồn lên database' : 'Seed 10 default LNG FAQs to database'}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {(p.faqs || []).map((faq: any, faqIdx: number) => (
                                    <div 
                                      key={faqIdx} 
                                      style={{ 
                                        backgroundColor: '#fff', 
                                        padding: '1rem', 
                                        borderRadius: 'var(--border-radius-sm)', 
                                        border: '1px solid var(--color-gray-border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                      }}
                                    >
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-teal)' }}>FAQ #{faqIdx + 1}</span>
                                        <button 
                                          type="button"
                                          className="btn btn-sm"
                                          style={{ color: '#EF4444', border: 'none', padding: '0.1rem 0.3rem', fontSize: '0.75rem', cursor: 'pointer' }}
                                          onClick={() => {
                                            if (confirm(language === 'vi' ? 'Bạn có muốn xóa câu hỏi này không?' : 'Delete this FAQ?')) {
                                              const updated = (p.faqs || []).filter((_: any, idx: number) => idx !== faqIdx);
                                              setPages(prev => prev.map(item => item.id === p.id ? { ...item, faqs: updated } : item));
                                              logAction(`Deleted FAQ #${faqIdx + 1} for page ID: ${p.id}`);
                                              void persistFaqsToSupabase(p.id, updated);
                                            }
                                          }}
                                        >
                                          {language === 'vi' ? 'Xóa' : 'Delete'}
                                        </button>
                                      </div>
                                      
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                          <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{language === 'vi' ? 'Câu hỏi (Tiếng Việt)' : 'Question (VI)'}</label>
                                          <input 
                                            type="text" 
                                            className="form-input" 
                                            style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem' }} 
                                            value={faq.q?.vi || ''}
                                            onBlur={() => persistFaqsToSupabase(p.id, p.faqs || [])}
                                            onChange={(e) => {
                                              const updated = [...(p.faqs || [])];
                                              updated[faqIdx] = { ...faq, q: { ...(faq.q || {}), vi: e.target.value } };
                                              setPages(prev => prev.map(item => item.id === p.id ? { ...item, faqs: updated } : item));
                                            }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                          <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{language === 'vi' ? 'Câu hỏi (Tiếng Anh)' : 'Question (EN)'}</label>
                                          <input 
                                            type="text" 
                                            className="form-input" 
                                            style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem' }} 
                                            value={faq.q?.en || ''}
                                            onBlur={() => persistFaqsToSupabase(p.id, p.faqs || [])}
                                            onChange={(e) => {
                                              const updated = [...(p.faqs || [])];
                                              updated[faqIdx] = { ...faq, q: { ...(faq.q || {}), en: e.target.value } };
                                              setPages(prev => prev.map(item => item.id === p.id ? { ...item, faqs: updated } : item));
                                            }}
                                          />
                                        </div>
                                      </div>

                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                          <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{language === 'vi' ? 'Câu trả lời (Tiếng Việt)' : 'Answer (VI)'}</label>
                                          <textarea 
                                            className="form-input" 
                                            style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', height: '60px', resize: 'vertical' }} 
                                            value={faq.a?.vi || ''}
                                            onBlur={() => persistFaqsToSupabase(p.id, p.faqs || [])}
                                            onChange={(e) => {
                                              const updated = [...(p.faqs || [])];
                                              updated[faqIdx] = { ...faq, a: { ...(faq.a || {}), vi: e.target.value } };
                                              setPages(prev => prev.map(item => item.id === p.id ? { ...item, faqs: updated } : item));
                                            }}
                                          />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                          <label style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{language === 'vi' ? 'Câu trả lời (Tiếng Anh)' : 'Answer (EN)'}</label>
                                          <textarea 
                                            className="form-input" 
                                            style={{ fontSize: '0.85rem', padding: '0.25rem 0.5rem', height: '60px', resize: 'vertical' }} 
                                            value={faq.a?.en || ''}
                                            onBlur={() => persistFaqsToSupabase(p.id, p.faqs || [])}
                                            onChange={(e) => {
                                              const updated = [...(p.faqs || [])];
                                              updated[faqIdx] = { ...faq, a: { ...(faq.a || {}), en: e.target.value } };
                                              setPages(prev => prev.map(item => item.id === p.id ? { ...item, faqs: updated } : item));
                                            }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PAGES BLOCK BUILDER WORKSPACE */}
        {activeTab === 'pages' && editingBlocksPageId && (() => {
          const currentPage = pages.find(p => p.id === editingBlocksPageId);
          const blocksList = getPageBlocks(editingBlocksPageId);
          const selectedBlock = blocksList.find((b: any) => b.id === selectedBlockId) || blocksList[0];

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
              {/* Workspace Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '1rem' }}>
                <div>
                  <button 
                    className="btn btn-outline btn-sm"
                    style={{ marginBottom: '0.5rem' }}
                    onClick={() => {
                      setEditingBlocksPageId(null);
                      setSelectedBlockId(null);
                    }}
                  >
                    ← {language === 'vi' ? 'Quay lại danh sách trang' : 'Back to Pages List'}
                  </button>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--color-navy)' }}>
                    {language === 'vi' ? 'Thiết kế Block nội dung:' : 'Block Layout Architect:'} <span style={{ color: 'var(--color-teal)' }}>{currentPage?.title[language === 'vi' ? 'vi' : 'en']}</span>
                  </h3>
                </div>

                {/* Device switches & Save */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', backgroundColor: '#E2E8F0', padding: '0.2rem', borderRadius: 'var(--border-radius-sm)', gap: '0.2rem' }}>
                    {(['desktop', 'tablet', 'mobile'] as const).map(device => (
                      <button
                        key={device}
                        onClick={() => setPreviewDevice(device)}
                        style={{
                          border: 'none', background: previewDevice === device ? 'var(--color-white)' : 'transparent',
                          padding: '0.35rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: 'var(--border-radius-xs)',
                          cursor: 'pointer', color: 'var(--color-navy)', display: 'flex', alignItems: 'center', gap: '0.25rem',
                          boxShadow: previewDevice === device ? 'var(--shadow-sm)' : 'none'
                        }}
                      >
                        {device.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-outline"
                    style={{ borderColor: 'var(--color-teal)', color: 'var(--color-teal)', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}
                    onClick={() => setShowHistoryModal(true)}
                  >
                    <History size={14} />
                    <span>{language === 'vi' ? 'Lịch sử' : 'History'}</span>
                  </button>

                  <button 
                    className="btn btn-teal"
                    onClick={async () => {
                      if (editingBlocksPageId) {
                        const pageObj = pages.find(p => p.id === editingBlocksPageId);
                        const currentBlocks = getPageBlocks(editingBlocksPageId);
                        const newCommit = {
                          id: 'rev-' + Date.now(),
                          pageId: editingBlocksPageId,
                          timestamp: new Date().toISOString(),
                          author: 'admin',
                          blocks: currentBlocks
                        };
                        const client = supabase;
                        if (client) {
                          try {
                            const { error } = await client
                              .from('page_revisions')
                              .insert({
                                id: newCommit.id,
                                page_id: newCommit.pageId,
                                timestamp: newCommit.timestamp,
                                author: newCommit.author,
                                blocks: newCommit.blocks
                              });
                            if (error) throw error;
                          } catch (err) {
                            console.error('Failed to save page revision to Supabase:', err);
                          }
                        }
                        setPageHistory(prev => [newCommit, ...prev]);
                        logAction(`Created page revision backup for: "${pageObj?.name || editingBlocksPageId}"`);
                      }
                      alert(language === 'vi' ? 'Đã lưu cấu trúc block trang vào lịch sử phiên bản!' : 'Saved page blocks layout to version history!');
                    }}
                  >
                    {language === 'vi' ? 'Lưu thay đổi' : 'Save Blocks'}
                  </button>
                </div>
              </div>

              {/* Split screen content */}
              <div style={{ display: 'flex', gap: '2rem', flex: 1, minHeight: '65vh' }}>
                {/* Left panel: block editor */}
                <div style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem', overflowY: 'auto', maxHeight: '70vh' }}>
                  
                  {/* Selector: Add new block */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {language === 'vi' ? 'Thêm Block Mới' : 'Insert Content Block'}
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select 
                        id="newBlockTypeSelect"
                        className="form-select" 
                        style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
                      >
                        <option value="hero">Hero Banner Block</option>
                        <option value="text">Text Column Block</option>
                        <option value="stats">Hotspots Stats Row</option>
                        <option value="features">Features Matrix Grid</option>
                      </select>
                      <button 
                        className="btn btn-teal btn-sm"
                        onClick={() => {
                          const type = (document.getElementById('newBlockTypeSelect') as HTMLSelectElement).value;
                          const newBlock = {
                            id: 'b-' + Date.now(),
                            type,
                            titleVi: type === 'hero' ? 'Tiêu đề trạm khí sạch' : type === 'text' ? 'Giới thiệu giải pháp' : type === 'stats' ? '50+ Dự án, 100% Đạt PCCC' : 'Dịch vụ EPC',
                            titleEn: type === 'hero' ? 'Clean Energy Headline' : type === 'text' ? 'Solutions Editorial' : type === 'stats' ? '50+ Projects, 100% Safety' : 'EPC Service List',
                            subtitleVi: 'Mô tả tóm tắt nội dung block...',
                            subtitleEn: 'Brief summary block description...',
                            contentVi: 'Nội dung chi tiết...',
                            contentEn: 'Detailed descriptions...',
                            ctaVi: 'Xem thêm',
                            ctaEn: 'Learn more',
                            itemsVi: 'Linh kiện trạm gas, Cấp phép PCCC, Đầu đốt lò hơi',
                            itemsEn: 'Gas pipeline hardware, Safety audits, Boiler retrofits',
                            image: 'https://images.unsplash.com/photo-1581094128547-1388d1397865?q=80&w=600&auto=format&fit=crop'
                          };
                          const updated = [...blocksList, newBlock];
                          handleSavePageBlocks(editingBlocksPageId, updated);
                          setSelectedBlockId(newBlock.id);
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Block list order */}
                  <div>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--color-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {language === 'vi' ? 'Cấu trúc khối trang' : 'Page Outline Structure'}
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {blocksList.map((block: any, idx: number) => (
                        <div 
                          key={block.id} 
                          onClick={() => setSelectedBlockId(block.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem',
                            backgroundColor: selectedBlockId === block.id ? 'var(--color-teal-glow)' : '#F8FAFC',
                            border: selectedBlockId === block.id ? '1px solid var(--color-teal)' : '1px solid #E2E8F0',
                            borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', transition: 'var(--transition-fast)'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-teal)', textTransform: 'uppercase', backgroundColor: 'rgba(13,148,136,0.1)', padding: '0.1rem 0.3rem', borderRadius: 'var(--border-radius-xs)', marginRight: '0.5rem' }}>
                              {block.type}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{block.titleVi || block.titleEn}</span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.15rem 0.3rem', fontSize: '0.7rem' }}
                              onClick={() => {
                                if (idx > 0) {
                                  const list = [...blocksList];
                                  const tmp = list[idx];
                                  list[idx] = list[idx - 1];
                                  list[idx - 1] = tmp;
                                  handleSavePageBlocks(editingBlocksPageId, list);
                                }
                              }}
                            >
                              ▲
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.15rem 0.3rem', fontSize: '0.7rem' }}
                              onClick={() => {
                                if (idx < blocksList.length - 1) {
                                  const list = [...blocksList];
                                  const tmp = list[idx];
                                  list[idx] = list[idx + 1];
                                  list[idx + 1] = tmp;
                                  handleSavePageBlocks(editingBlocksPageId, list);
                                }
                              }}
                            >
                              ▼
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.15rem 0.3rem', fontSize: '0.7rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                              onClick={() => {
                                const list = blocksList.filter((b: any) => b.id !== block.id);
                                handleSavePageBlocks(editingBlocksPageId, list);
                                if (selectedBlockId === block.id) {
                                  setSelectedBlockId(list.length > 0 ? list[0].id : null);
                                }
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Editor form fields */}
                  {selectedBlock && (
                    <div style={{ borderTop: '1px solid var(--color-gray-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-navy)' }}>
                        📝 {language === 'vi' ? `Chỉnh sửa Block: ${selectedBlock.type.toUpperCase()}` : `Edit Block fields: ${selectedBlock.type.toUpperCase()}`}
                      </h4>

                      {/* Title input */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">{language === 'vi' ? 'Tiêu đề (VI)' : 'Title (VI)'}</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={selectedBlock.titleVi || ''}
                            onChange={(e) => {
                              const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, titleVi: e.target.value } : b);
                              handleSavePageBlocks(editingBlocksPageId, list);
                            }}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">{language === 'vi' ? 'Tiêu đề (EN)' : 'Title (EN)'}</label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={selectedBlock.titleEn || ''}
                            onChange={(e) => {
                              const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, titleEn: e.target.value } : b);
                              handleSavePageBlocks(editingBlocksPageId, list);
                            }}
                          />
                        </div>
                      </div>

                      {/* Subtitle / Excerpt inputs */}
                      {selectedBlock.type === 'hero' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{language === 'vi' ? 'Mô tả ngắn (VI)' : 'Subtitle (VI)'}</label>
                            <textarea 
                              className="form-input" 
                              style={{ height: '55px', resize: 'vertical' }}
                              value={selectedBlock.subtitleVi || ''}
                              onChange={(e) => {
                                const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, subtitleVi: e.target.value } : b);
                                handleSavePageBlocks(editingBlocksPageId, list);
                              }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{language === 'vi' ? 'Mô tả ngắn (EN)' : 'Subtitle (EN)'}</label>
                            <textarea 
                              className="form-input" 
                              style={{ height: '55px', resize: 'vertical' }}
                              value={selectedBlock.subtitleEn || ''}
                              onChange={(e) => {
                                const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, subtitleEn: e.target.value } : b);
                                handleSavePageBlocks(editingBlocksPageId, list);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* CTA Button Text inputs */}
                      {selectedBlock.type === 'hero' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{language === 'vi' ? 'Nút bấm CTA (VI)' : 'CTA Button (VI)'}</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={selectedBlock.ctaVi || ''}
                              onChange={(e) => {
                                const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, ctaVi: e.target.value } : b);
                                handleSavePageBlocks(editingBlocksPageId, list);
                              }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{language === 'vi' ? 'Nút bấm CTA (EN)' : 'CTA Button (EN)'}</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={selectedBlock.ctaEn || ''}
                              onChange={(e) => {
                                const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, ctaEn: e.target.value } : b);
                                handleSavePageBlocks(editingBlocksPageId, list);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Content block inputs */}
                      {selectedBlock.type === 'text' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{language === 'vi' ? 'Nội dung (VI)' : 'Content (VI)'}</label>
                            <textarea 
                              className="form-input" 
                              style={{ height: '100px', resize: 'vertical' }}
                              value={selectedBlock.contentVi || ''}
                              onChange={(e) => {
                                const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, contentVi: e.target.value } : b);
                                handleSavePageBlocks(editingBlocksPageId, list);
                              }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{language === 'vi' ? 'Nội dung (EN)' : 'Content (EN)'}</label>
                            <textarea 
                              className="form-input" 
                              style={{ height: '100px', resize: 'vertical' }}
                              value={selectedBlock.contentEn || ''}
                              onChange={(e) => {
                                const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, contentEn: e.target.value } : b);
                                handleSavePageBlocks(editingBlocksPageId, list);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Items (stats, features lists) */}
                      {(selectedBlock.type === 'stats' || selectedBlock.type === 'features') && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{language === 'vi' ? 'Danh sách mục (VI) [Dấu phẩy phân cách]' : 'Items List (VI) [Comma sep]'}</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={selectedBlock.itemsVi || ''}
                              onChange={(e) => {
                                const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, itemsVi: e.target.value } : b);
                                handleSavePageBlocks(editingBlocksPageId, list);
                              }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">{language === 'vi' ? 'Danh sách mục (EN) [Dấu phẩy phân cách]' : 'Items List (EN) [Comma sep]'}</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={selectedBlock.itemsEn || ''}
                              onChange={(e) => {
                                const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, itemsEn: e.target.value } : b);
                                handleSavePageBlocks(editingBlocksPageId, list);
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {selectedBlock.id === 'b-clients' && <div className="cms-logo-manager"><div className="cms-tech-params__header"><div><h4>{language === 'vi' ? 'Logo đối tác từ Media Vault' : 'Partner logos from Media Vault'}</h4><small>{language === 'vi' ? 'Ảnh được hiển thị trong khung vuông và chạy ngang trên trang chủ.' : 'Images appear in square tiles and scroll across the homepage.'}</small></div><button type="button" className="btn btn-outline btn-sm" onClick={() => setBlockLogoPickerOpen(true)}><Plus size={14} /> {language === 'vi' ? 'Thêm logo' : 'Add logo'}</button></div><div className="cms-logo-manager__grid">{(selectedBlock.logos || []).map((url: string, logoIndex: number) => <div key={`${url}-${logoIndex}`}><img src={url} alt="" /><button type="button" aria-label={language === 'vi' ? 'Xóa logo' : 'Remove logo'} onClick={async () => { const client = supabase; if (client) { try { const path = decodeURIComponent(url.split('/').pop() || ''); await client.from('media_assets').update({ media_role: null }).eq('storage_path', path); } catch (err) { console.error('Failed to remove partner logo in Supabase:', err); } } const logos = (selectedBlock.logos || []).filter((_: string, index: number) => index !== logoIndex); handleSavePageBlocks(editingBlocksPageId, blocksList.map((block: any) => block.id === selectedBlock.id ? { ...block, logos } : block)); }}>×</button></div>)}{!(selectedBlock.logos || []).length && <p>{language === 'vi' ? 'Chưa có logo. Bấm “Thêm logo” để chọn từ Media Vault.' : 'No logos yet. Choose Add logo to select from Media Vault.'}</p>}</div></div>}

                      {/* Hero Image Loader */}
                      {selectedBlock.type === 'hero' && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">{language === 'vi' ? 'Hình ảnh nền trạm khí' : 'Hero Background Image'}</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => setBlockHeroImagePickerOpen(true)}
                              >
                                {language === 'vi' ? 'Chọn từ Media Vault' : 'Choose from Media Vault'}
                              </button>
                              {selectedBlock.image && (
                                <img src={selectedBlock.image} alt="Thumbnail preview" style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: 'var(--border-radius-xs)', border: '1px solid var(--color-gray-border)' }} />
                              )}
                            </div>
                            
                            {selectedBlock.image && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-gray-border)' }}>
                                {/* Focal Y */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>{language === 'vi' ? 'Cắt & Căn dọc ảnh bìa (Ultrawide Crop)' : 'Vertical Crop & Focus'}</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--color-teal)' }}>{selectedBlock.imageAlignmentY !== undefined ? selectedBlock.imageAlignmentY : 50}%</span>
                                  </label>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={selectedBlock.imageAlignmentY !== undefined ? selectedBlock.imageAlignmentY : 50}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, imageAlignmentY: val } : b);
                                      handleSavePageBlocks(editingBlocksPageId, list);
                                    }}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                  />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8' }}>
                                    <span>{language === 'vi' ? 'Trên (Top)' : 'Top'}</span>
                                    <span>{language === 'vi' ? 'Giữa' : 'Center'}</span>
                                    <span>{language === 'vi' ? 'Dưới (Bottom)' : 'Bottom'}</span>
                                  </div>
                                </div>

                                {/* Zoom / Scale */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '0.5rem' }}>
                                  <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <span>{language === 'vi' ? 'Thu phóng hình ảnh (Zoom)' : 'Zoom / Scale'}</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--color-teal)' }}>{selectedBlock.imageScale !== undefined ? selectedBlock.imageScale : 100}%</span>
                                  </label>
                                  <input
                                    type="range"
                                    min="100"
                                    max="200"
                                    value={selectedBlock.imageScale !== undefined ? selectedBlock.imageScale : 100}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value);
                                      const list = blocksList.map((b: any) => b.id === selectedBlock.id ? { ...b, imageScale: val } : b);
                                      handleSavePageBlocks(editingBlocksPageId, list);
                                    }}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                  />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8' }}>
                                    <span>100% (Cover)</span>
                                    <span>150%</span>
                                    <span>200%</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right panel: Visual interactive device previewer frame */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#E2E8F0', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1rem', overflowY: 'auto', maxHeight: '70vh' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', width: '100%', height: '100%' }}>
                    
                    {/* Centered Device Canvas */}
                    <div 
                      style={{
                        width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '375px',
                        backgroundColor: 'var(--color-white)', borderRadius: 'var(--border-radius-sm)', overflowY: 'auto',
                        boxShadow: 'var(--shadow-md)', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid #CBD5E1',
                        display: 'flex', flexDirection: 'column', minHeight: '100%'
                      }}
                    >
                      {/* Simulated Page Header */}
                      <div style={{ backgroundColor: 'var(--color-navy)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Flame size={18} color="var(--color-orange)" />
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-white)', fontWeight: 800 }}>LNG79</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)' }}>
                          <span>{language === 'vi' ? 'Giải Pháp' : 'Solutions'}</span>
                          <span>{language === 'vi' ? 'Sản Phẩm' : 'Products'}</span>
                          <span>{language === 'vi' ? 'Dự Án' : 'Projects'}</span>
                        </div>
                      </div>

                      {/* Blocks List Renderer inside Device */}
                      <div style={{ flex: 1 }}>
                        {blocksList.map((block: any) => {
                          const title = language === 'vi' ? block.titleVi : block.titleEn;
                          const subtitle = language === 'vi' ? block.subtitleVi : block.subtitleEn;
                          const content = language === 'vi' ? block.contentVi : block.contentEn;
                          const cta = language === 'vi' ? block.ctaVi : block.ctaEn;
                          const rawItems = language === 'vi' ? block.itemsVi : block.itemsEn;
                          const itemsList = rawItems ? rawItems.split(',').map((s: string) => s.trim()) : [];

                          if (block.type === 'hero') {
                            return (
                              <div 
                                key={block.id} 
                                style={{
                                  position: 'relative', height: '220px', background: `linear-gradient(rgba(15,23,42,0.8), rgba(15,23,42,0.75)), url(${block.image || 'https://images.unsplash.com/photo-1605647540924-852290f6b0d5?q=80&w=800&auto=format&fit=crop'})`,
                                  backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column',
                                  justifyContent: 'center', alignItems: 'center', padding: '1.5rem', color: 'var(--color-white)', textAlign: 'center',
                                  border: selectedBlockId === block.id ? '2px dashed var(--color-teal)' : 'none'
                                }}
                              >
                                <h1 style={{ fontSize: previewDevice === 'mobile' ? '1.1rem' : '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-white)' }}>{title}</h1>
                                <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.5rem', maxWidth: '500px', lineHeight: 1.4 }}>{subtitle}</p>
                                <button style={{ marginTop: '0.75rem', backgroundColor: 'var(--color-orange)', color: 'var(--color-white)', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: 'var(--border-radius-xs)' }}>
                                  {cta}
                                </button>
                              </div>
                            );
                          }

                          if (block.type === 'text') {
                            return (
                              <div 
                                key={block.id} 
                                style={{
                                  padding: '1.5rem', backgroundColor: 'var(--color-white)', borderBottom: '1px solid #E2E8F0',
                                  border: selectedBlockId === block.id ? '2px dashed var(--color-teal)' : 'none'
                                }}
                              >
                                <h3 style={{ fontSize: '1rem', color: 'var(--color-navy)', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{title}</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-main)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{content}</p>
                              </div>
                            );
                          }

                          if (block.type === 'stats') {
                            return (
                              <div 
                                key={block.id} 
                                style={{
                                  padding: '1.5rem', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0',
                                  border: selectedBlockId === block.id ? '2px dashed var(--color-teal)' : 'none',
                                  display: 'grid', gridTemplateColumns: previewDevice === 'mobile' ? '1fr' : `repeat(${itemsList.length || 1}, 1fr)`, gap: '1rem', textAlign: 'center'
                                }}
                              >
                                {itemsList.map((stat: string, i: number) => {
                                  const [val, ...lblParts] = stat.split(' ');
                                  const lbl = lblParts.join(' ');
                                  return (
                                    <div key={i} style={{ backgroundColor: 'var(--color-white)', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: 'var(--border-radius-sm)' }}>
                                      <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-teal)' }}>{val}</span>
                                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{lbl}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }

                          if (block.type === 'features') {
                            return (
                              <div 
                                key={block.id} 
                                style={{
                                  padding: '1.5rem', backgroundColor: 'var(--color-white)', borderBottom: '1px solid #E2E8F0',
                                  border: selectedBlockId === block.id ? '2px dashed var(--color-teal)' : 'none'
                                }}
                              >
                                <h3 style={{ fontSize: '0.95rem', color: 'var(--color-navy)', fontWeight: 800, margin: '0 0 1rem 0', textAlign: 'center' }}>{title}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: previewDevice === 'mobile' ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>
                                  {itemsList.map((feat: string, i: number) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.5rem', backgroundColor: '#F8FAFC', borderRadius: 'var(--border-radius-sm)', border: '1px solid #E2E8F0' }}>
                                      <span style={{ color: 'var(--color-teal)', fontSize: '0.85rem' }}>✔</span>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-main)' }}>{feat}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          return null;
                        })}
                      </div>

                      {/* Simulated Footer */}
                      <div style={{ backgroundColor: '#1E293B', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6rem', color: '#94A3B8' }}>
                        <span>© 2026 LNG79 Energy</span>
                        <span>TCVN 7441</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* MENUS & NAVIGATION TAB */}
        {activeTab === 'navigation' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', margin: 0 }}>
                {language === 'vi' ? 'Quản Trị Hệ Thống Thanh Điều Hướng (Menu)' : 'Manage Navigation Menus'}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {language === 'vi' ? 'Tùy chỉnh các liên kết xuất hiện trên Header và Footer website.' : 'Reorganize link blocks and parent-child categories on navigation bars.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Menu items list */}
              <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--color-navy)' }}>
                  Header Menu Links
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {menuItems.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--border-radius-sm)' }}>
                      <div>
                        <strong>{item.label.vi}</strong> / <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.label.en}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-teal)', marginTop: '0.2rem' }}>Link: {item.link}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.15rem 0.3rem', fontSize: '0.7rem' }}
                          onClick={() => {
                            if (idx > 0) {
                              const newMenu = [...menuItems];
                              const temp = newMenu[idx];
                              newMenu[idx] = newMenu[idx - 1];
                              newMenu[idx - 1] = temp;
                              setMenuItems(newMenu);
                              logAction(`Shifted menu item "${temp.label.vi}" up`);
                            }
                          }}
                        >
                          ▲
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.15rem 0.3rem', fontSize: '0.7rem' }}
                          onClick={() => {
                            if (idx < menuItems.length - 1) {
                              const newMenu = [...menuItems];
                              const temp = newMenu[idx];
                              newMenu[idx] = newMenu[idx + 1];
                              newMenu[idx + 1] = temp;
                              setMenuItems(newMenu);
                              logAction(`Shifted menu item "${temp.label.vi}" down`);
                            }
                          }}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Menu Link form */}
              <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-navy)' }}>
                  {language === 'vi' ? 'Thêm liên kết mới' : 'Add New Link'}
                </h4>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{language === 'vi' ? 'Nhãn tiếng Việt *' : 'Label (VI) *'}</label>
                  <input type="text" className="form-input" id="menuLabelVi" placeholder="Ví dụ: Dịch vụ" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{language === 'vi' ? 'Nhãn tiếng Anh *' : 'Label (EN) *'}</label>
                  <input type="text" className="form-input" id="menuLabelEn" placeholder="Example: Services" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">{language === 'vi' ? 'Đường dẫn liên kết *' : 'Destination URL *'}</label>
                  <input type="text" className="form-input" id="menuLinkDest" placeholder="contact / solutions" />
                </div>
                <button 
                  className="btn btn-teal"
                  onClick={() => {
                    const labelVi = (document.getElementById('menuLabelVi') as HTMLInputElement)?.value;
                    const labelEn = (document.getElementById('menuLabelEn') as HTMLInputElement)?.value;
                    const dest = (document.getElementById('menuLinkDest') as HTMLInputElement)?.value;
                    if (labelVi && labelEn && dest) {
                      setMenuItems(prev => [...prev, {
                        id: 'm-' + Date.now(),
                        label: { vi: labelVi, en: labelEn },
                        link: dest,
                        visible: true,
                        target: '_self'
                      }]);
                      logAction(`Added new navigation link: "${labelVi}"`);
                      alert('Đã thêm liên kết vào menu Header thành công!');
                    } else {
                      alert('Vui lòng điền đầy đủ các thông tin!');
                    }
                  }}
                >
                  {language === 'vi' ? 'Lưu liên kết' : 'Save Link'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MEDIA VAULT TAB */}
        {activeTab === 'media' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', margin: 0 }}>
                {language === 'vi' ? 'Thư Viện Ảnh & Tập Tin (Media Vault)' : 'Media Vault Asset Library'}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {language === 'vi' ? 'Tải lên hình ảnh trạm khí, thiết bị nhà bếp và tài liệu hướng dẫn kỹ thuật.' : 'Upload drawings, project screenshots, and PDF brochures.'}
              </p>
            </div>

            {/* Upload Zone */}
            <div style={{ border: '2px dashed var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '2.5rem', textAlign: 'center', backgroundColor: 'var(--color-gray-bg)' }}>
              <input 
                type="file" 
                multiple 
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                id="mediaUploadInput"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    void uploadMediaFiles(files).catch((error) => alert(error instanceof Error ? error.message : 'Upload thất bại'));
                    e.target.value = '';
                  }
                }}
              />
              <button 
                className="btn btn-teal"
                onClick={() => document.getElementById('mediaUploadInput')?.click()}
              >
                {language === 'vi' ? 'Chọn hình ảnh hoặc PDF để tải lên' : 'Select Files to Upload'}
              </button>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                {language === 'vi' ? 'Hỗ trợ JPG, PNG, WebP, GIF và PDF tối đa 10 MB; tất cả được lưu trong public/uploads trên host.' : 'Supports JPG, PNG, WebP, GIF and PDF up to 10 MB; all files are stored in public/uploads on the host.'}
              </div>
            </div>

            <div className="cms-manager-toolbar cms-media-toolbar"><label><input className="form-input" placeholder={language === 'vi' ? 'Tìm tên file, tiêu đề hoặc alt text...' : 'Search filename, title, or alt text...'} value={mediaQuery} onChange={(event) => setMediaQuery(event.target.value)} /></label><select className="form-select" value={mediaTypeFilter} onChange={(event) => setMediaTypeFilter(event.target.value as 'all' | 'image' | 'pdf')}><option value="all">{language === 'vi' ? 'Tất cả file' : 'All files'}</option><option value="image">{language === 'vi' ? 'Hình ảnh' : 'Images'}</option><option value="pdf">PDF</option></select><small>{filteredMediaAssets.length}/{mediaAssets.length} file</small></div>

            {/* Assets Grid */}
            <div className="cms-media-assets-grid">
              {filteredMediaAssets.map((asset) => (
                <div key={asset.id} className="cms-media-asset-card">
                  <div style={{ height: '110px', backgroundColor: '#F1F5F9', overflow: 'hidden', position: 'relative' }}>
                    {asset.fileType.includes('image') ? (
                      <img src={asset.url} alt={asset.altText} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontWeight: 700, color: 'var(--color-navy)' }}>
                        PDF
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{asset.fileName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{Math.round(asset.fileSize / 1024)} KB · {asset.uploadedAt}</span>
                    {editingMediaId === asset.id ? <><input className="form-input cms-media-meta-input" value={asset.title || ''} placeholder={language === 'vi' ? 'Tiêu đề' : 'Title'} onChange={(event) => updateMediaMetadata(asset.id, 'title', event.target.value)} /><input className="form-input cms-media-meta-input" value={asset.altText || ''} placeholder="Alt text" onChange={(event) => updateMediaMetadata(asset.id, 'altText', event.target.value)} /></> : <small className="cms-media-alt" title={asset.altText}>{asset.altText || (language === 'vi' ? 'Chưa có alt text' : 'No alt text')}</small>}
                    <div className="cms-media-card-actions"><button type="button" onClick={() => setEditingMediaId(editingMediaId === asset.id ? null : asset.id)}>{editingMediaId === asset.id ? (language === 'vi' ? 'Xong' : 'Done') : (language === 'vi' ? 'Sửa' : 'Edit')}</button><button type="button" onClick={() => void navigator.clipboard.writeText(asset.url)}>{language === 'vi' ? 'Sao chép URL' : 'Copy URL'}</button><button type="button" className="is-delete" onClick={() => void deleteMediaAsset(asset).catch((error) => alert(error instanceof Error ? error.message : 'Delete failed'))}>{language === 'vi' ? 'Xóa' : 'Delete'}</button></div>
                  </div>
                </div>
              ))}
              {filteredMediaAssets.length === 0 && <div className="image-library-empty">{language === 'vi' ? 'Không tìm thấy file phù hợp.' : 'No matching files.'}</div>}
            </div>
          </div>
        )}

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div className="animate-fade-in">
            <div style={styles.tableHeader}>
              <h3 style={{ fontSize: '1.2rem' }}>{language === 'vi' ? 'Danh Sách Lead Khách Hàng' : 'Customer Inquiries & Leads'}</h3>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => alert(language === 'vi' ? 'Đang xuất báo cáo CSV...' : 'Exporting leads to CSV...')}
              >
                <FileSpreadsheet size={16} /> {language === 'vi' ? 'Xuất Excel (CSV)' : 'Export CSV'}
              </button>
            </div>
            
            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>{language === 'vi' ? 'Khách hàng' : 'Customer'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Loại' : 'Type'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Thông tin liên lạc' : 'Contact'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Ngày gửi' : 'Date'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const status = getStatusLabel(lead.status);
                    return (
                      <tr key={lead.id} style={styles.tr}>
                        <td style={styles.td}>
                          <strong>{lead.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                            {lead.company}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: 'var(--border-radius-sm)',
                            backgroundColor: lead.type === 'calculator' ? '#FEF3C7' : lead.type === 'wizard' ? '#E0F2FE' : '#F5F3FF',
                            color: lead.type === 'calculator' ? '#B45309' : lead.type === 'wizard' ? '#0369A1' : '#6D28D9'
                          }}>
                            {lead.type === 'calculator' ? 'CALC' : lead.type === 'wizard' ? 'WIZ' : 'QUOTE'}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontSize: '0.85rem' }}>📞 {lead.phone}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>✉️ {lead.email}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>📍 {lead.location}</div>
                        </td>
                        <td style={styles.td}>{lead.date}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            backgroundColor: status.bg,
                            color: status.color
                          }}>
                            {status[language === 'vi' ? 'vi' : 'en']}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                              onClick={() => setSelectedLead(lead)}
                            >
                              Chi tiết
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ color: '#EF4444', padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderColor: '#FCA5A5' }}
                              onClick={() => {
                                if (confirm(language === 'vi' ? 'Bạn có muốn xoá lead này không?' : 'Do you want to delete this lead?')) {
                                  const trashItem = {
                                    id: 'trash-' + Date.now(),
                                    type: 'lead',
                                    name: lead.company + " (" + lead.name + ")",
                                    deletedAt: new Date().toISOString(),
                                    originalData: lead
                                  };
                                  setTrashBin(prev => [trashItem, ...prev]);
                                  onDeleteLead(lead.id);
                                  logAction(`Deleted client lead from ${lead.name}`);
                                }
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Lead details Modal */}
            {selectedLead && (
              <div style={styles.modalOverlay}>
                <div style={styles.modalCard} className="animate-fade-in">
                  <div style={styles.modalHeader}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-white)' }}>
                      {language === 'vi' ? 'Chi Tiết Yêu Cầu Tư Vấn' : 'Lead Enquiry Details'}
                    </h3>
                    <button onClick={() => setSelectedLead(null)} style={styles.closeBtn}>Close</button>
                  </div>
                  
                  <div style={{ padding: '1.5rem' }}>
                    <div style={styles.modalMetaGrid}>
                      <div>
                        <strong>{language === 'vi' ? 'Tên khách hàng' : 'Name'}:</strong>
                        <div>{selectedLead.name}</div>
                      </div>
                      <div>
                        <strong>{language === 'vi' ? 'Tên công ty' : 'Company'}:</strong>
                        <div>{selectedLead.company}</div>
                      </div>
                      <div>
                        <strong>Email:</strong>
                        <div>{selectedLead.email}</div>
                      </div>
                      <div>
                        <strong>{language === 'vi' ? 'Số điện thoại' : 'Phone'}:</strong>
                        <div>{selectedLead.phone}</div>
                      </div>
                      <div>
                        <strong>{language === 'vi' ? 'Địa điểm' : 'Location'}:</strong>
                        <div>{selectedLead.location}</div>
                      </div>
                      <div>
                        <strong>{language === 'vi' ? 'Ngày gửi' : 'Enquiry Date'}:</strong>
                        <div>{selectedLead.date}</div>
                      </div>
                    </div>

                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-gray-border)', paddingTop: '1rem' }}>
                      <strong>{language === 'vi' ? 'Chi tiết yêu cầu kỹ thuật' : 'Technical Specifications / Details'}:</strong>
                      <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: 'var(--border-radius-sm)', marginTop: '0.5rem', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                        {selectedLead.details}
                      </div>
                    </div>

                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--color-gray-border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{language === 'vi' ? 'Trạng thái xử lý' : 'Progress State'}:</span>
                        <select 
                          className="form-select"
                          style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.85rem' }}
                          value={selectedLead.status}
                          onChange={(e) => {
                            onUpdateStatus(selectedLead.id, e.target.value as any);
                            setSelectedLead({ ...selectedLead, status: e.target.value as any });
                            logAction(`Updated lead status for ${selectedLead.name} to ${e.target.value}`);
                          }}
                        >
                          <option value="new">New Lead</option>
                          <option value="contacted">Contacted</option>
                          <option value="survey">Site Survey Scheduled</option>
                          <option value="closed">Closed Won</option>
                        </select>
                      </div>
                      <button className="btn btn-teal btn-sm" onClick={() => setSelectedLead(null)}>
                        OK
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <ProductManager
            language={language}
            products={products}
            onAdd={onAddProduct}
            onEdit={onEditProduct}
            onToggle={onToggleProduct}
            onDelete={(product) => {
              setTrashBin((current) => [{ id: `trash-${Date.now()}`, type: 'product', name: product.name.vi, deletedAt: new Date().toISOString(), originalData: product }, ...current]);
              onDeleteProduct(product.id);
              logAction(`Deleted product: "${product.name.vi}"`);
            }}
          />
        )}

        {/* Legacy product table retained temporarily for Phase 2 field migration. */}
        {showLegacyManagers && activeTab === 'products' && (
          <div className="animate-fade-in">
            <div style={styles.tableHeader}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)' }}>
                {language === 'vi' ? 'Hệ Thống Thiết Bị Vật Tư (Catalog)' : 'Products Catalog Inventory'}
              </h3>
              <button 
                className="btn btn-teal btn-sm"
                onClick={() => alert(language === 'vi' ? 'Chức năng thêm thiết bị vào catalog sẽ cập nhật ở bản database tới!' : 'Add Product wizard will be enabled in database update phase')}
              >
                <Plus size={16} /> {language === 'vi' ? 'Thêm thiết bị mới' : 'Add New Hardware'}
              </button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              {language === 'vi' 
                ? 'Danh sách linh kiện trạm gas LNG/LPG và đầu đốt công nghiệp hiện thị ngoài trang Sản phẩm.' 
                : 'Configure safety valves, vaporizers, and kitchen hardware lists visible on products page.'}
            </p>

            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>{language === 'vi' ? 'Tên thiết bị' : 'Hardware Name'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Chuyên mục' : 'Category'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Thông số tiêu chuẩn' : 'Key Specs'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Trạng thái' : 'Availability'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={styles.tr}>
                    <td style={styles.td}><strong>Bồn chứa khí hóa lỏng Cryogenic LPG/LNG</strong></td>
                    <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: '#E0F2FE', color: '#0369A1' }}>GAS HARDWARE</span></td>
                    <td style={styles.td}><small>Capacity: 5m³ to 100m³, ASME Section VIII Div 1</small></td>
                    <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: '#D1FAE5', color: '#047857' }}>In Stock</span></td>
                    <td style={styles.td}>
                      <button className="btn btn-outline btn-sm" style={{ color: '#EF4444', padding: '0.25rem' }} onClick={() => alert('Demo only')}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  <tr style={styles.tr}>
                    <td style={styles.td}><strong>Dàn hóa hơi tự nhiên Ambient Air Vaporizer</strong></td>
                    <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: '#E0F2FE', color: '#0369A1' }}>GAS HARDWARE</span></td>
                    <td style={styles.td}><small>Flow rate: 200 Nm³/h to 5000 Nm³/h, MAWP 40 bar</small></td>
                    <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: '#D1FAE5', color: '#047857' }}>In Stock</span></td>
                    <td style={styles.td}>
                      <button className="btn btn-outline btn-sm" style={{ color: '#EF4444', padding: '0.25rem' }} onClick={() => alert('Demo only')}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                  <tr style={styles.tr}>
                    <td style={styles.td}><strong>Bếp Á đôi công nghiệp có quạt thổi</strong></td>
                    <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: '#F5F3FF', color: '#6D28D9' }}>KITCHEN HARDWARE</span></td>
                    <td style={styles.td}><small>2 burners, SUS304 Stainless steel, blower fan 220V</small></td>
                    <td style={styles.td}><span style={{ ...styles.badge, backgroundColor: '#D1FAE5', color: '#047857' }}>In Stock</span></td>
                    <td style={styles.td}>
                      <button className="btn btn-outline btn-sm" style={{ color: '#EF4444', padding: '0.25rem' }} onClick={() => alert('Demo only')}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', marginBottom: '1.5rem' }}>
              {language === 'vi' ? 'Điều Chỉnh Đơn Giá Nhiên Liệu (Calculator Tuning)' : 'Fuel Price Calculator Tuning'}
            </h3>

            <section className="cms-backup-panel cms-backup-panel--prominent"><div><span className="cms-ai-translate-card__eyebrow">BACKUP & RESTORE</span><h4>{language === 'vi' ? 'Sao lưu và khôi phục dữ liệu CMS' : 'CMS backup and restore'}</h4><p>{language === 'vi' ? 'Xuất nội dung, menu, Media Vault metadata, lịch sử, cấu hình, lead và các chỉnh sửa trực quan thành một file JSON.' : 'Export content, menus, Media Vault metadata, history, settings, leads, and visual edits to one JSON file.'}</p><small>{language === 'vi' ? 'Lưu ý: ảnh/PDF trong public/uploads không được nhúng vào JSON; hãy sao lưu thư mục này khi chuyển host.' : 'Note: public/uploads files are not embedded; copy that folder when moving hosts.'}</small></div><div className="cms-backup-actions"><button type="button" className="btn btn-teal" onClick={handleExportBackup}>{language === 'vi' ? 'Tải file sao lưu' : 'Download backup'}</button><label className="btn btn-outline">{language === 'vi' ? 'Chọn file để khôi phục' : 'Choose backup to restore'}<input type="file" accept="application/json,.json" hidden onChange={(event) => { void handleImportBackup(event.target.files?.[0]); event.target.value = ''; }} /></label></div>{backupMessage && <p className="cms-backup-message">{backupMessage}</p>}</section>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }} className="admin-settings-grid">
              {/* Settings Form */}
              <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--color-navy)' }}>
                  {language === 'vi' ? 'Đơn giá nhiên liệu bán ra' : 'Target LNG & LPG Prices'}
                </h4>
                <form onSubmit={handleSaveSettings}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Đơn giá LNG (VND/kg) *' : 'LNG Reference Price (VND/kg) *'}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={lngInput}
                      onChange={(e) => setLngInput(Number(e.target.value))}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Đơn giá LPG (VND/kg) *' : 'LPG Reference Price (VND/kg) *'}</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={lpgInput}
                      onChange={(e) => setLpgInput(Number(e.target.value))}
                      required 
                    />
                  </div>
                  <button type="submit" className="btn btn-teal" style={{ marginTop: '0.5rem' }}>
                    {language === 'vi' ? 'Cập nhật hệ số' : 'Save Parameters'}
                  </button>
                </form>
              </div>

              {/* Reference details */}
              <div>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: 'var(--color-navy)' }}>
                  {language === 'vi' ? 'Hệ số quy đổi nhiệt lượng cơ sở' : 'Base Lower Heating Values (LHV)'}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {language === 'vi' 
                    ? 'Các hệ số nhiệt lượng dưới đây được cài đặt cứng dựa trên tiêu chuẩn khí đốt Việt Nam làm cơ sở tính toán so sánh:' 
                    : 'The calculation conversion metrics are based on the standard Vietnam Ministry of Energy benchmarks:'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.4rem' }}>
                    <strong>LNG (Methane)</strong>
                    <span>50.0 MJ/kg (Eff: 90%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.4rem' }}>
                    <strong>LPG (Propane/Butane)</strong>
                    <span>46.1 MJ/kg (Eff: 88%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.4rem' }}>
                    <strong>Dầu DO (Diesel)</strong>
                    <span>36.0 MJ/L (Eff: 82%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.4rem' }}>
                    <strong>Dầu FO (Fuel Oil)</strong>
                    <span>40.0 MJ/kg (Eff: 80%)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.4rem' }}>
                    <strong>Than đá (Coal)</strong>
                    <span>20.0 MJ/kg (Eff: 68%)</span>
                  </div>
                </div>

                <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--color-teal-light)', border: '1px solid rgba(13,148,136,0.15)', borderRadius: 'var(--border-radius-sm)' }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-teal)', fontSize: '0.85rem', fontWeight: 700 }}>
                    🧪 {language === 'vi' ? 'Công Cụ Giả Lập & Kiểm Tra' : 'Calculator Formula Sandbox'}
                  </h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-main)', margin: '0 0 1rem 0', lineHeight: 1.4 }}>
                    {language === 'vi' 
                      ? 'Dùng bảng bên dưới để kiểm tra tính toán trước khi áp dụng hệ số giá.' 
                      : 'Use this sandbox unit to simulate cost-benefits calculations before modifying parameters.'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>{language === 'vi' ? 'Nhiên liệu gốc' : 'Base Fuel'}</label>
                        <select className="form-select" style={{ padding: '0.2rem', fontSize: '0.8rem' }} value={auditFuel} onChange={(e) => {
                          const f = e.target.value;
                          setAuditFuel(f);
                          setAuditEff(AUDIT_FUELS[f].defaultEff);
                          setAuditPrice(AUDIT_FUELS[f].defaultPrice);
                        }}>
                          <option value="DO">Diesel Oil (DO)</option>
                          <option value="FO">Fuel Oil (FO)</option>
                          <option value="COAL">Coal (Than)</option>
                          <option value="LPG_OLD">Current LPG</option>
                          <option value="ELEC">Electricity</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>{language === 'vi' ? 'Sản lượng/tháng' : 'Consumption'}</label>
                        <input type="number" className="form-input" style={{ padding: '0.2rem', fontSize: '0.8rem' }} value={auditCons} onChange={(e) => setAuditCons(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>{language === 'vi' ? 'Hiệu suất (%)' : 'Efficiency (%)'}</label>
                        <input type="number" className="form-input" style={{ padding: '0.2rem', fontSize: '0.8rem' }} value={auditEff} onChange={(e) => setAuditEff(Number(e.target.value))} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>{language === 'vi' ? 'Giá hiện tại (đ)' : 'Price (VND)'}</label>
                        <input type="number" className="form-input" style={{ padding: '0.2rem', fontSize: '0.8rem' }} value={auditPrice} onChange={(e) => setAuditPrice(Number(e.target.value))} />
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', borderTop: '1px dashed rgba(13,148,136,0.2)', paddingTop: '0.75rem', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div>
                        <strong>{language === 'vi' ? 'Nhu cầu nhiệt hữu ích:' : 'Effective Heat Needed:'}</strong> {formatNumber(monthlyEnergy)} MJ/tháng
                      </div>
                      <div style={{ color: 'var(--color-teal)' }}>
                        <strong>{language === 'vi' ? 'Khối lượng LNG cần:' : 'LNG Needed:'}</strong> {formatNumber(lngNeeded / 12)} kg/tháng
                      </div>
                      <div style={{ color: 'var(--color-orange)' }}>
                        <strong>{language === 'vi' ? 'Tiết kiệm ước tính:' : 'Estimated Savings:'}</strong> {formatCurrency(lngSavings / 12)} VND ({formatNumber((lngSavings / Math.max(1, annualOldCost)) * 100, 1)}%)
                      </div>
                      <div>
                        <strong>{language === 'vi' ? 'Giảm phát thải CO2:' : 'CO2 Reduced:'}</strong> {formatNumber(co2Saved)} tấn/năm
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'articles' && (
          <ArticleManager
            language={language}
            articles={articles}
            onAdd={() => {
              setEditingArticle(null);
              setNewArt({ titleVi: '', titleEn: '', category: 'energy', excerptVi: '', excerptEn: '', contentVi: '', contentEn: '', imageURL: '', galleryImages: [], publishDate: new Date().toISOString().split('T')[0], sortOrder: articles.length + 1 });
              setShowAddArticleModal(true);
            }}
            onEdit={handleEditArticleClick}
            onToggle={onToggleArticle}
            onDelete={(article) => {
              setTrashBin((current) => [{ id: `trash-${Date.now()}`, type: 'article', name: article.title.vi, deletedAt: new Date().toISOString(), originalData: article }, ...current]);
              onDeleteArticle(article.id);
              logAction(`Deleted technical manual: "${article.title.vi}"`);
            }}
          />
        )}

        {/* Legacy article list retained temporarily while its modal is migrated. */}
        {showLegacyManagers && activeTab === 'articles' && (
          <div className="animate-fade-in">
            <div style={styles.tableHeader}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)' }}>
                {language === 'vi' ? 'Quản Lý Bài Viết Thư Viện Kiến Thức' : 'Manage Knowledge Library Articles'}
              </h3>
              <button 
                className="btn btn-teal btn-sm"
                onClick={() => {
                  setEditingArticle(null);
                  setNewArt({
                    titleVi: '',
                    titleEn: '',
                    category: 'energy',
                    excerptVi: '',
                    excerptEn: '',
                    contentVi: '',
                    contentEn: '',
                    imageURL: '',
                    galleryImages: [],
                    publishDate: new Date().toISOString().split('T')[0],
                    sortOrder: articles.length + 1
                  });
                  setShowAddArticleModal(true);
                }}
              >
                <Plus size={16} /> {language === 'vi' ? 'Thêm bài viết mới' : 'Add New Article'}
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              {language === 'vi' 
                ? 'Thêm, xóa hoặc tắt/bật quyền hiển thị các bài viết kỹ thuật và tiêu chuẩn an toàn PCCC ngoài trang Thư viện.' 
                : 'Add, delete, or enable/disable public visibility of safety and engineering articles in the Library.'}
            </p>

            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>{language === 'vi' ? 'Tiêu đề' : 'Title'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Chuyên mục' : 'Category'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Ngày đăng' : 'Date'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Hiển thị' : 'Status'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((art) => (
                    <tr key={art.id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{art.title[language === 'vi' ? 'vi' : 'en']}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          {art.excerpt[language === 'vi' ? 'vi' : 'en']}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: art.category === 'energy' ? '#FFE4E6' : art.category === 'safety' ? '#FEF3C7' : '#E0F2FE',
                          color: art.category === 'energy' ? '#9F1239' : art.category === 'safety' ? '#D97706' : '#0369A1'
                        }}>
                          {art.category.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>{art.date}</td>
                      <td style={styles.td}>
                        <button
                          className={`btn btn-sm ${art.visible !== false ? 'btn-teal' : 'btn-outline'}`}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => onToggleArticle(art.id)}
                        >
                          {art.visible !== false 
                            ? (language === 'vi' ? 'Đang hiện' : 'Visible') 
                            : (language === 'vi' ? 'Đang ẩn' : 'Hidden')}
                        </button>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--color-teal)', padding: '0.25rem' }}
                            onClick={() => handleEditArticleClick(art)}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-outline btn-sm"
                            style={{ color: '#EF4444', padding: '0.25rem' }}
                            onClick={() => {
                              const trashItem = {
                                id: 'trash-' + Date.now(),
                                type: 'article',
                                name: art.title.vi,
                                deletedAt: new Date().toISOString(),
                                originalData: art
                              };
                              setTrashBin(prev => [trashItem, ...prev]);
                              onDeleteArticle(art.id);
                              logAction(`Deleted technical manual: "${art.title.vi}"`);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <ProjectManager
            language={language}
            projects={projects}
            onAdd={() => {
              setEditingProject(null);
              setNewProj({ nameVi: '', nameEn: '', category: 'lng', locationVi: '', locationEn: '', scopeVi: '', scopeEn: '', capacityVi: '', capacityEn: '', resultVi: '', resultEn: '', equipmentsInput: '', imageURL: '', galleryImages: [], sortOrder: projects.length + 1 });
              setShowAddProjectModal(true);
            }}
            onEdit={handleEditClick}
            onToggle={onToggleProject}
            onDelete={(project) => {
              setTrashBin((current) => [{ id: `trash-${Date.now()}`, type: 'project', name: project.name.vi, deletedAt: new Date().toISOString(), originalData: project }, ...current]);
              onDeleteProject(project.id);
              logAction(`Deleted project: "${project.name.vi}"`);
            }}
          />
        )}

        {/* Legacy project list retained temporarily while its modal is migrated. */}
        {showLegacyManagers && activeTab === 'projects' && (
          <div className="animate-fade-in">
            <div style={styles.tableHeader}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)' }}>
                {language === 'vi' ? 'Quản Lý Danh Sách Dự Án Đã Làm' : 'Manage Case Studies & Projects'}
              </h3>
              <button 
                className="btn btn-teal btn-sm"
                onClick={() => {
                  setEditingProject(null);
                  setNewProj({
                    nameVi: '',
                    nameEn: '',
                    category: 'lng',
                    locationVi: '',
                    locationEn: '',
                    scopeVi: '',
                    scopeEn: '',
                    capacityVi: '',
                    capacityEn: '',
                    resultVi: '',
                    resultEn: '',
                    equipmentsInput: '',
                    imageURL: '',
                    galleryImages: [],
                    sortOrder: projects.length + 1
                  });
                  setShowAddProjectModal(true);
                }}
              >
                <Plus size={16} /> {language === 'vi' ? 'Thêm dự án mới' : 'Add New Project'}
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              {language === 'vi' 
                ? 'Thêm, xóa hoặc tắt/bật quyền hiển thị các dự án cơ sở hạ tầng gas và bếp công nghiệp ngoài trang Dự án.' 
                : 'Add, delete, or toggle public visibility of central gas and commercial kitchen projects.'}
            </p>

            <div style={styles.tableResponsive}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thRow}>
                    <th style={styles.th}>{language === 'vi' ? 'Hình ảnh' : 'Image'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Tên dự án' : 'Project Title'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Phân loại' : 'Category'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Địa điểm' : 'Location'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Hiển thị' : 'Status'}</th>
                    <th style={styles.th}>{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj) => (
                    <tr key={proj.id} style={styles.tr}>
                      <td style={styles.td}>
                        <img 
                          src={proj.image || "https://images.unsplash.com/photo-1581094128547-1388d1397865?q=80&w=100&auto=format&fit=crop"} 
                          alt="Project preview"
                          style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-gray-border)' }}
                        />
                      </td>
                      <td style={styles.td}>
                        <strong>{proj.name[language === 'vi' ? 'vi' : 'en']}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          {proj.scope[language === 'vi' ? 'vi' : 'en']}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: proj.category === 'lng' ? '#E0F2FE' : proj.category === 'lpg' ? '#D1FAE5' : proj.category === 'conversion' ? '#FEF3C7' : '#F5F3FF',
                          color: proj.category === 'lng' ? '#0369A1' : proj.category === 'lpg' ? '#047857' : proj.category === 'conversion' ? '#B45309' : '#6D28D9'
                        }}>
                          {proj.category.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>{proj.location[language === 'vi' ? 'vi' : 'en']}</td>
                      <td style={styles.td}>
                        <button
                          className={`btn btn-sm ${proj.visible !== false ? 'btn-teal' : 'btn-outline'}`}
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => onToggleProject(proj.id)}
                        >
                          {proj.visible !== false 
                            ? (language === 'vi' ? 'Đang hiện' : 'Visible') 
                            : (language === 'vi' ? 'Đang ẩn' : 'Hidden')}
                        </button>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--color-teal)', padding: '0.25rem' }}
                            onClick={() => handleEditClick(proj)}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-outline btn-sm"
                            style={{ color: '#EF4444', padding: '0.25rem' }}
                            onClick={() => {
                              const trashItem = {
                                id: 'trash-' + Date.now(),
                                type: 'project',
                                name: proj.name.vi,
                                deletedAt: new Date().toISOString(),
                                originalData: proj
                              };
                              setTrashBin(prev => [trashItem, ...prev]);
                              onDeleteProject(proj.id);
                              logAction(`Deleted project case study: "${proj.name.vi}"`);
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEO & REDIRECTS TAB */}
        {activeTab === 'seo' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', margin: 0 }}>
                {language === 'vi' ? 'Cấu Hùi SEO & Bảng Chuyển Hướng Link (Redirects)' : 'SEO Metadata & URL Redirect Manager'}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {language === 'vi' ? 'Thiết lập thẻ Google Analytics ID và quản lý các liên kết chuyển hướng 301/302.' : 'Configure Google Analytics tags and setup permanent URL rewrites.'}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
              {/* Global SEO form */}
              <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-navy)' }}>Global SEO Tags</h4>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Default SEO Title *</label>
                  <input type="text" className="form-input" defaultValue="LNG79 - Industrial Energy & Kitchen Solutions" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Google Analytics ID (G-XXXXXX)</label>
                  <input type="text" className="form-input" placeholder="G-A1B2C3D4" />
                </div>
                <button 
                  className="btn btn-teal"
                  onClick={() => {
                    logAction('Updated Google Analytics Tag and global SEO configurations');
                    alert('Đã cập nhật SEO thành công!');
                  }}
                >
                  Save Settings
                </button>
              </div>

              {/* Redirect table */}
              <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-navy)' }}>URL Redirects List</h4>
                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={styles.th}>From URL</th>
                        <th style={styles.th}>To Destination</th>
                        <th style={styles.th}>Type</th>
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {redirects.map((r) => (
                        <tr key={r.id} style={styles.tr}>
                          <td style={styles.td}><code>{r.from}</code></td>
                          <td style={styles.td}><code>{r.to}</code></td>
                          <td style={styles.td}><span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '0.1rem 0.3rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.75rem' }}>{r.type}</span></td>
                          <td style={styles.td}>
                            <button 
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.1rem 0.25rem', fontSize: '0.7rem', color: '#EF4444', borderColor: '#FCA5A5' }}
                              onClick={() => {
                                setRedirects(prev => prev.filter(item => item.id !== r.id));
                                logAction(`Deleted redirect link "${r.from}"`);
                              }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add redirect */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input type="text" id="newRedFrom" placeholder="/old-path" className="form-input" style={{ flex: 1 }} />
                  <input type="text" id="newRedTo" placeholder="/new-destination" className="form-input" style={{ flex: 1 }} />
                  <button 
                    className="btn btn-teal"
                    onClick={() => {
                      const from = (document.getElementById('newRedFrom') as HTMLInputElement)?.value;
                      const to = (document.getElementById('newRedTo') as HTMLInputElement)?.value;
                      if (from && to) {
                        setRedirects(prev => [...prev, { id: 'red-' + Date.now(), from, to, type: '301' }]);
                        logAction(`Added redirect from "${from}" to "${to}"`);
                        (document.getElementById('newRedFrom') as HTMLInputElement).value = '';
                        (document.getElementById('newRedTo') as HTMLInputElement).value = '';
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GUI TAB */}
        {activeTab === 'gui' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', margin: 0 }}>
                {language === 'vi' ? 'Cấu Hình Giao Diện (GUI Settings)' : 'GUI Customization Settings'}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {language === 'vi' 
                  ? 'Điều chỉnh các thông số hiển thị trực quan của website như màu sắc và độ phủ của ảnh bìa (banner).' 
                  : 'Tune visual display variables of the website such as banner overlay colors and opacities.'}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Logo Settings */}
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--color-navy)', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🖼️ {language === 'vi' ? 'Logo Website (Header Brand)' : 'Header Logo'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ width: '180px', height: '60px', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: '0.5rem' }}>
                      {guiSettings.logoUrl ? (
                        <img src={guiSettings.logoUrl} alt="Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{language === 'vi' ? 'Không có Logo (Dùng chữ)' : 'No Logo (Using text)'}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-teal"
                        onClick={() => setGuiLogoPickerOpen(true)}
                      >
                        {language === 'vi' ? 'Chọn từ Media Vault' : 'Choose from Media'}
                      </button>
                      {guiSettings.logoUrl && (
                        <button 
                          type="button" 
                          className="btn btn-outline"
                          onClick={() => onUpdateGuiSettings({ ...guiSettings, logoUrl: '' })}
                        >
                          {language === 'vi' ? 'Xóa Logo (Dùng chữ)' : 'Remove Logo'}
                        </button>
                      )}
                    </div>
                  </div>

                  {guiSettings.logoUrl && (
                    <div style={{ width: '100%', maxWidth: '300px' }}>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>{language === 'vi' ? 'Chiều cao Logo (Logo Height)' : 'Logo Height'}</span>
                        <span style={{ fontWeight: 700, color: 'var(--color-teal)' }}>{guiSettings.logoHeight ?? 42}px</span>
                      </label>
                      <input 
                        type="range" 
                        min="20" 
                        max="80" 
                        value={guiSettings.logoHeight ?? 42} 
                        onChange={(e) => onUpdateGuiSettings({ ...guiSettings, logoHeight: parseInt(e.target.value) })}
                        className="slider"
                        style={{ width: '100%', height: '8px', cursor: 'pointer', accentColor: 'var(--color-teal)' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Dark Theme Settings */}
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--color-navy)', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🌙 {language === 'vi' ? 'Chế độ tối (Dark Mode)' : 'Dark Mode Banners'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Kiểu lớp phủ (Overlay Style)' : 'Overlay Style'}</label>
                    <select
                      className="form-select"
                      value={guiSettings.darkGradientType || 'solid'}
                      onChange={(e) => onUpdateGuiSettings({ ...guiSettings, darkGradientType: e.target.value })}
                    >
                      <option value="solid">{language === 'vi' ? 'Màu đơn sắc (Solid Color)' : 'Solid Color'}</option>
                      <option value="aurora">{language === 'vi' ? 'Cực quang xanh ngọc (Aurora)' : 'Aurora Preset'}</option>
                      <option value="volcano">{language === 'vi' ? 'Núi lửa nồng ấm (Volcano)' : 'Volcano Preset'}</option>
                      <option value="steel">{language === 'vi' ? 'Ánh thép công nghệ (Techno Steel)' : 'Techno Steel Preset'}</option>
                      <option value="custom">{language === 'vi' ? 'Tự thiết kế (Custom Mesh)' : 'Custom Mesh Builder'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Màu sắc lớp phủ (Overlay Color)' : 'Overlay Mask Color'}</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={guiSettings.darkColor || '#070a13'} 
                        disabled={(guiSettings.darkGradientType || 'solid') !== 'solid'}
                        onChange={(e) => onUpdateGuiSettings({ ...guiSettings, darkColor: e.target.value })}
                        style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', opacity: (guiSettings.darkGradientType || 'solid') !== 'solid' ? 0.5 : 1 }}
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={guiSettings.darkColor || '#070a13'} 
                        disabled={(guiSettings.darkGradientType || 'solid') !== 'solid'}
                        onChange={(e) => onUpdateGuiSettings({ ...guiSettings, darkColor: e.target.value })}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {language === 'vi' ? `Độ mờ lớp phủ (Opacity): ${guiSettings.darkOpacity ?? 85}%` : `Overlay Opacity: ${guiSettings.darkOpacity ?? 85}%`}
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={guiSettings.darkOpacity ?? 85} 
                      onChange={(e) => onUpdateGuiSettings({ ...guiSettings, darkOpacity: parseInt(e.target.value) })}
                      className="slider"
                      style={{ width: '100%', height: '8px', cursor: 'pointer', accentColor: 'var(--color-teal)' }}
                    />
                  </div>
                </div>
                {guiSettings.darkGradientType === 'custom' && renderMeshEditor('dark')}
              </div>

              {/* Light Theme Settings */}
              <div>
                <h4 style={{ fontSize: '1rem', color: 'var(--color-navy)', borderBottom: '1px solid var(--color-gray-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ☀️ {language === 'vi' ? 'Chế độ sáng (Light Mode)' : 'Light Mode Banners'}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Kiểu lớp phủ (Overlay Style)' : 'Overlay Style'}</label>
                    <select
                      className="form-select"
                      value={guiSettings.lightGradientType || 'solid'}
                      onChange={(e) => onUpdateGuiSettings({ ...guiSettings, lightGradientType: e.target.value })}
                    >
                      <option value="solid">{language === 'vi' ? 'Màu đơn sắc (Solid Color)' : 'Solid Color'}</option>
                      <option value="sky">{language === 'vi' ? 'Bầu trời ban mai (Morning Sky)' : 'Morning Sky Preset'}</option>
                      <option value="summer">{language === 'vi' ? 'Nắng ấm mùa hè (Summer Sun)' : 'Summer Sun Preset'}</option>
                      <option value="sage">{language === 'vi' ? 'Xanh lá xô thơm (Soft Sage)' : 'Soft Sage Preset'}</option>
                      <option value="custom">{language === 'vi' ? 'Tự thiết kế (Custom Mesh)' : 'Custom Mesh Builder'}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'vi' ? 'Màu sắc lớp phủ (Overlay Color)' : 'Overlay Mask Color'}</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={guiSettings.lightColor || '#ffffff'} 
                        disabled={(guiSettings.lightOpacity ?? 0) === 0 || (guiSettings.lightGradientType || 'solid') !== 'solid'}
                        onChange={(e) => onUpdateGuiSettings({ ...guiSettings, lightColor: e.target.value })}
                        style={{ width: '50px', height: '40px', padding: '0', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-sm)', cursor: 'pointer', opacity: ((guiSettings.lightOpacity ?? 0) === 0 || (guiSettings.lightGradientType || 'solid') !== 'solid') ? 0.5 : 1 }}
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={guiSettings.lightColor || '#ffffff'} 
                        disabled={(guiSettings.lightOpacity ?? 0) === 0 || (guiSettings.lightGradientType || 'solid') !== 'solid'}
                        onChange={(e) => onUpdateGuiSettings({ ...guiSettings, lightColor: e.target.value })}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {language === 'vi' ? `Độ mờ lớp phủ (Opacity): ${guiSettings.lightOpacity ?? 0}%` : `Overlay Opacity: ${guiSettings.lightOpacity ?? 0}%`}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={guiSettings.lightOpacity ?? 0} 
                        onChange={(e) => onUpdateGuiSettings({ ...guiSettings, lightOpacity: parseInt(e.target.value) })}
                        className="slider"
                        style={{ flex: 1, height: '8px', cursor: 'pointer', accentColor: 'var(--color-teal)' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm"
                        onClick={() => onUpdateGuiSettings({ ...guiSettings, lightOpacity: (guiSettings.lightOpacity ?? 0) === 0 ? 30 : 0 })}
                      >
                        {(guiSettings.lightOpacity ?? 0) === 0 ? (language === 'vi' ? 'Bật' : 'Enable') : (language === 'vi' ? 'Tắt' : 'Disable')}
                      </button>
                    </div>
                  </div>
                </div>
                {guiSettings.lightGradientType === 'custom' && renderMeshEditor('light')}
              </div>

            </div>
          </div>
        )}

        {/* SECURITY & LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', margin: 0 }}>
                {language === 'vi' ? 'Nhật Ký Thao Tác Hệ Thống (Audit Logs)' : 'Security Audit Trail Logs'}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {language === 'vi' ? 'Xem lịch sử thao tác chỉnh sửa dữ liệu và đăng nhập của quản trị viên.' : 'Browse history logs of data mutations and administrator login states.'}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Logs count: {auditLogs.length}</span>
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn xoá toàn bộ lịch sử nhật ký?')) {
                      setAuditLogs([]);
                      localStorage.setItem('cms_audit_logs', JSON.stringify([]));
                    }
                  }}
                >
                  Clear Logs
                </button>
              </div>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Timestamp</th>
                      <th style={styles.th}>User</th>
                      <th style={styles.th}>Operation Details</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={styles.tr}>
                        <td style={styles.td}><small style={{ color: 'var(--color-text-muted)' }}>{log.timestamp}</small></td>
                        <td style={styles.td}><strong>{log.user}</strong></td>
                        <td style={styles.td}>{log.action}</td>
                        <td style={styles.td}><span style={{ backgroundColor: '#D1FAE5', color: '#047857', padding: '0.1rem 0.3rem', borderRadius: 'var(--border-radius-sm)', fontSize: '0.75rem' }}>{log.status.toUpperCase()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TRASH BIN TAB */}
        {activeTab === 'trash' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', margin: 0 }}>
                {language === 'vi' ? 'Thùng Rác Hệ Thống (Trash Bin)' : 'System Trash Bin'}
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {language === 'vi' 
                  ? 'Xem danh sách các mục đã xóa tạm thời. Khôi phục lại hoặc xóa vĩnh viễn chúng khỏi bộ nhớ.' 
                  : 'Manage soft-deleted records. Restore them back or delete them permanently from database storage.'}
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--color-gray-card)', border: '1px solid var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  {language === 'vi' ? 'Tổng số mục:' : 'Total items:'} {trashBin.length}
                </span>
                {trashBin.length > 0 && (
                  <button 
                    className="btn btn-outline btn-sm"
                    style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                    onClick={() => {
                      if (confirm(language === 'vi' ? 'Dọn sạch thùng rác? Thao tác này không thể khôi phục.' : 'Empty the trash bin? This cannot be undone.')) {
                        setTrashBin([]);
                        logAction('Emptied all items in system Trash Bin');
                      }
                    }}
                  >
                    {language === 'vi' ? 'Dọn sạch thùng rác' : 'Empty Trash Bin'}
                  </button>
                )}
              </div>

              {trashBin.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)', border: '1px dashed var(--color-gray-border)', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-white)' }}>
                  <Trash2 size={48} style={{ color: '#CBD5E1', marginBottom: '1rem' }} />
                  <div>{language === 'vi' ? 'Thùng rác hiện đang trống.' : 'Trash bin is currently empty.'}</div>
                </div>
              ) : (
                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.thRow}>
                        <th style={styles.th}>{language === 'vi' ? 'Tên Nội Dung' : 'Title / Record'}</th>
                        <th style={styles.th}>{language === 'vi' ? 'Loại' : 'Type'}</th>
                        <th style={styles.th}>{language === 'vi' ? 'Ngày Xóa' : 'Deleted Date'}</th>
                        <th style={styles.th}>{language === 'vi' ? 'Thao Tác' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trashBin.map((item) => (
                        <tr key={item.id} style={styles.tr}>
                          <td style={styles.td}><strong>{item.name}</strong></td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: item.type === 'article' ? '#E0F2FE' : item.type === 'project' ? '#FEF3C7' : '#D1FAE5',
                              color: item.type === 'article' ? '#0369A1' : item.type === 'project' ? '#B45309' : '#047857'
                            }}>
                              {item.type.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}><small style={{ color: 'var(--color-text-muted)' }}>{new Date(item.deletedAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}</small></td>
                          <td style={styles.td}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                type="button"
                                className="btn btn-teal btn-sm"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => handleRestoreFromTrash(item)}
                              >
                                {language === 'vi' ? 'Khôi phục' : 'Restore'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ color: '#EF4444', borderColor: '#FCA5A5', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                onClick={() => handlePermanentDelete(item)}
                              >
                                {language === 'vi' ? 'Xóa vĩnh viễn' : 'Xóa vĩnh viễn'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Article Modal */}
      {showAddArticleModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: '1200px', width: '95%' }} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-white)' }}>
                {editingArticle 
                  ? (language === 'vi' ? 'Chỉnh Sửa Bài Viết Kỹ Thuật' : 'Edit Technical Article') 
                  : (language === 'vi' ? 'Tạo Bài Viết Kỹ Thuật Mới' : 'Create New Technical Article')}
              </h3>
              <button onClick={() => setShowAddArticleModal(false)} style={styles.closeBtn}>Close</button>
            </div>
            <form onSubmit={handleArticleFormSubmit} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                {/* COLUMN LEFT: Form fields (65%) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Tiêu đề (Tiếng Việt) *' : 'Title (Vietnamese) *'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={newArt.titleVi}
                        onChange={(e) => setNewArt({ ...newArt, titleVi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Tiêu đề (Tiếng Anh) *' : 'Title (English) *'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={newArt.titleEn}
                        onChange={(e) => setNewArt({ ...newArt, titleEn: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{language === 'vi' ? 'Chuyên mục *' : 'Category *'}</label>
                    <select 
                      className="form-select"
                      value={newArt.category}
                      onChange={(e) => setNewArt({ ...newArt, category: e.target.value as any })}
                      required
                    >
                      <option value="energy">{language === 'vi' ? 'Công nghệ Khí & Nhiệt' : 'Gas & Thermal Tech'}</option>
                      <option value="safety">{language === 'vi' ? 'An toàn PCCC' : 'Fire & Safety'}</option>
                      <option value="kitchen">{language === 'vi' ? 'Thiết kế Bếp công nghiệp' : 'Kitchen Design'}</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}><div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">{language === 'vi' ? 'Ngày xuất bản' : 'Publish date'}</label><input type="date" className="form-input" value={newArt.publishDate} onChange={(event) => setNewArt({ ...newArt, publishDate: event.target.value })} required /></div><div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">{language === 'vi' ? 'Thứ tự hiển thị' : 'Display order'}</label><input type="number" min="0" className="form-input" value={newArt.sortOrder} onChange={(event) => setNewArt({ ...newArt, sortOrder: Number(event.target.value) })} /></div></div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Ảnh đại diện' : 'Cover image'}</label>
                      <div className="cms-media-field">{newArt.imageURL ? <img src={newArt.imageURL} alt="" /> : <div className="cms-media-field__empty">{language === 'vi' ? 'Chưa có ảnh' : 'No image'}</div>}<button type="button" className="btn btn-outline" onClick={() => setArticleMediaPickerOpen(true)}>{language === 'vi' ? 'Chọn từ Media Vault' : 'Choose from Media Vault'}</button></div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Đường dẫn hình ảnh (URL)' : 'Image URL'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="https://images.unsplash.com/..."
                        value={newArt.imageURL}
                        onChange={(e) => setNewArt({ ...newArt, imageURL: e.target.value })}
                      />
                    </div>
                  </div>

                  {newArt.galleryImages.length > 0 && <div className="cms-project-gallery-editor">{newArt.galleryImages.map((url) => <div key={url} className={url === newArt.imageURL ? 'is-cover' : ''}><img src={url} alt="" /><div><button type="button" onClick={() => setNewArt((current) => ({ ...current, imageURL: url }))}>{language === 'vi' ? 'Đặt ảnh bìa' : 'Set cover'}</button><button type="button" onClick={() => setNewArt((current) => { const galleryImages = current.galleryImages.filter((item) => item !== url); return { ...current, galleryImages, imageURL: current.imageURL === url ? (galleryImages[0] || '') : current.imageURL }; })}>×</button></div></div>)}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Mô tả ngắn (Tiếng Việt) *' : 'Excerpt (Vietnamese) *'}</label>
                      <textarea 
                        className="form-input" 
                        style={{ height: '60px', resize: 'vertical' }}
                        value={newArt.excerptVi}
                        onChange={(e) => setNewArt({ ...newArt, excerptVi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Mô tả ngắn (Tiếng Anh) *' : 'Excerpt (English) *'}</label>
                      <textarea 
                        className="form-input" 
                        style={{ height: '60px', resize: 'vertical' }}
                        value={newArt.excerptEn}
                        onChange={(e) => setNewArt({ ...newArt, excerptEn: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Nội dung chi tiết (Tiếng Việt) *' : 'Content (Vietnamese) *'}</label>
                      <textarea 
                        className="form-input" 
                        style={{ height: '140px', resize: 'vertical' }}
                        value={newArt.contentVi}
                        onChange={(e) => setNewArt({ ...newArt, contentVi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Nội dung chi tiết (Tiếng Anh) *' : 'Content (English) *'}</label>
                      <textarea 
                        className="form-input" 
                        style={{ height: '140px', resize: 'vertical' }}
                        value={newArt.contentEn}
                        onChange={(e) => setNewArt({ ...newArt, contentEn: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* COLUMN RIGHT: AI Copywriter & SEO Auditor (35%) */}
                <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid var(--color-gray-border)', paddingLeft: '1.5rem' }}>
                  {/* AI Copilot Panel */}
                  <div style={{ backgroundColor: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 'var(--border-radius-md)', padding: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#0F766E', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      ✨ AI Copilot Translation
                    </h4>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#115E59' }}>
                      {language === 'vi' 
                        ? 'Tự động dịch tiêu đề, mô tả và nội dung giữa tiếng Việt và tiếng Anh.' 
                        : 'Automatically translate title, excerpt, and content between Vietnamese and English.'}
                    </p>
                    <button
                      type="button"
                      className="btn btn-teal"
                      style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                      disabled={isTranslatingArticle}
                      onClick={() => {
                        setIsTranslatingArticle(true);
                        setTimeout(() => {
                          setIsTranslatingArticle(false);
                          if (newArt.titleVi && !newArt.titleEn) {
                            setNewArt(prev => ({
                              ...prev,
                              titleEn: translateViToEn(prev.titleVi),
                              excerptEn: translateViToEn(prev.excerptVi),
                              contentEn: translateViToEn(prev.contentVi)
                            }));
                          } else if (newArt.titleEn && !newArt.titleVi) {
                            setNewArt(prev => ({
                              ...prev,
                              titleVi: translateEnToVi(prev.titleEn),
                              excerptVi: translateEnToVi(prev.excerptEn),
                              contentVi: translateEnToVi(prev.contentEn)
                            }));
                          } else {
                            setNewArt(prev => ({
                              ...prev,
                              titleEn: translateViToEn(prev.titleVi) || prev.titleEn,
                              excerptEn: translateViToEn(prev.excerptVi) || prev.excerptEn,
                              contentEn: translateViToEn(prev.contentVi) || prev.contentEn
                            }));
                          }
                          logAction(`Triggered AI Translation for article: "${newArt.titleVi || 'New'}"`);
                        }, 800);
                      }}
                    >
                      {isTranslatingArticle 
                        ? (language === 'vi' ? 'Đang dịch thuật AI...' : 'AI Translating...') 
                        : (language === 'vi' ? 'Dịch Tự Động (AI Translate)' : 'AI Auto-Translate')}
                    </button>
                  </div>

                  {/* SEO Auditor Panel */}
                  {(() => {
                    const seo = calculateSEOScore(newArt.titleVi, newArt.excerptVi, newArt.contentVi, newArt.imageURL, articleKeyword);
                    const scoreColor = seo.score >= 80 ? '#10B981' : seo.score >= 50 ? '#F59E0B' : '#EF4444';
                    const scoreBg = seo.score >= 80 ? '#ECFDF5' : seo.score >= 50 ? '#FFFBEB' : '#FEF2F2';
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                            📊 Real-Time SEO Analyzer
                          </span>
                          <span style={{ 
                            fontSize: '0.8rem', fontWeight: 800, color: scoreColor, 
                            backgroundColor: scoreBg, padding: '0.2rem 0.6rem', 
                            borderRadius: 'var(--border-radius-full)', border: `1px solid ${scoreColor}40`
                          }}>
                            {seo.score}/100
                          </span>
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>
                            {language === 'vi' ? 'Từ khóa mục tiêu' : 'SEO Focus Keyword'}
                          </label>
                          <input 
                            type="text" 
                            className="form-input" 
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                            value={articleKeyword}
                            onChange={(e) => setArticleKeyword(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--color-gray-border)', paddingTop: '0.75rem' }}>
                          {seo.rules.map(rule => (
                            <div key={rule.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.75rem' }}>
                              <span>{rule.passed ? '✅' : '❌'}</span>
                              <span style={{ color: rule.passed ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                                {language === 'vi' ? rule.labelVi : rule.labelEn}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-gray-border)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowArticleDraftPreview(true)}>{language === 'vi' ? 'Xem trước' : 'Preview'}</button>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowAddArticleModal(false)}
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-teal">
                  {editingArticle 
                    ? (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes') 
                    : (language === 'vi' ? 'Tạo bài viết' : 'Create Article')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showArticleDraftPreview && <div className="cms-confirm-backdrop" style={{ zIndex: 4000 }} onMouseDown={() => setShowArticleDraftPreview(false)}><article className="cms-article-preview" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="image-library-close" aria-label="Close" onClick={() => setShowArticleDraftPreview(false)}>×</button>{newArt.imageURL && <img className="cms-article-preview__cover" src={newArt.imageURL} alt="" />}<div><span className={`cms-badge cms-badge--${newArt.category}`}>{newArt.category.toUpperCase()}</span> <small>{newArt.publishDate}</small></div><h2>{language === 'vi' ? newArt.titleVi : newArt.titleEn}</h2><strong>{language === 'vi' ? newArt.excerptVi : newArt.excerptEn}</strong><div className="cms-article-preview__content">{language === 'vi' ? newArt.contentVi : newArt.contentEn}</div></article></div>}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: '1200px', width: '95%' }} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-white)' }}>
                {editingProject 
                  ? (language === 'vi' ? 'Chỉnh Sửa Dự Án Đã Thực Hiện' : 'Edit Case Study Project') 
                  : (language === 'vi' ? 'Thêm Dự Án Mới Đã Thực Hiện' : 'Add New Case Study Project')}
              </h3>
              <button onClick={() => setShowAddProjectModal(false)} style={styles.closeBtn}>Close</button>
            </div>
            <form onSubmit={handleProjectFormSubmit} style={{ padding: '1.5rem' }}>
              <div className="admin-settings-grid" style={{ gap: '2rem', marginBottom: '1.5rem' }}>
                
                {/* Cột trái: Thông tin nhận dạng & Hình ảnh */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Tên dự án (Tiếng Việt) *' : 'Project Title (Vietnamese) *'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={newProj.nameVi}
                        onChange={(e) => setNewProj({ ...newProj, nameVi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Tên dự án (Tiếng Anh) *' : 'Project Title (English) *'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={newProj.nameEn}
                        onChange={(e) => setNewProj({ ...newProj, nameEn: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Chuyên mục *' : 'Category *'}</label>
                      <select 
                        className="form-select"
                        value={newProj.category}
                        onChange={(e) => setNewProj({ ...newProj, category: e.target.value as any })}
                        required
                      >
                        <option value="lng">LNG Solutions</option>
                        <option value="lpg">LPG Solutions</option>
                        <option value="conversion">{language === 'vi' ? 'Cải tạo đầu đốt' : 'Boiler Conversion'}</option>
                        <option value="kitchen">{language === 'vi' ? 'Thiết kế bếp và Central gas' : 'Commercial Kitchen'}</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Thư viện ảnh dự án' : 'Project gallery'}</label>
                      <div className="cms-media-field">{newProj.imageURL ? <img src={newProj.imageURL} alt="" /> : <div className="cms-media-field__empty">{language === 'vi' ? 'Chưa có ảnh' : 'No image'}</div>}<button type="button" className="btn btn-outline" onClick={() => setProjectMediaPickerOpen(true)}>{language === 'vi' ? 'Thêm từ Media Vault' : 'Add from Media Vault'}</button></div>
                    </div>
                  </div>

                  {newProj.galleryImages.length > 0 && <div className="cms-project-gallery-editor">{newProj.galleryImages.map((url) => <div key={url} className={url === newProj.imageURL ? 'is-cover' : ''}><img src={url} alt="" /><div><button type="button" onClick={() => setNewProj((current) => ({ ...current, imageURL: url }))}>{language === 'vi' ? 'Đặt ảnh bìa' : 'Set cover'}</button><button type="button" onClick={() => setNewProj((current) => { const galleryImages = current.galleryImages.filter((item) => item !== url); return { ...current, galleryImages, imageURL: current.imageURL === url ? (galleryImages[0] || '') : current.imageURL }; })}>×</button></div></div>)}</div>}

                  <div className="form-group" style={{ marginBottom: 0 }}><label className="form-label">{language === 'vi' ? 'Thứ tự hiển thị' : 'Display order'}</label><input type="number" min="0" className="form-input" value={newProj.sortOrder} onChange={(event) => setNewProj({ ...newProj, sortOrder: Number(event.target.value) })} /></div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{language === 'vi' ? 'Đường dẫn hình ảnh (URL)' : 'Project Image URL'}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="https://images.unsplash.com/..."
                      value={newProj.imageURL}
                      onChange={(e) => setNewProj({ ...newProj, imageURL: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Địa điểm (Tiếng Việt) *' : 'Location (Vietnamese) *'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="KCN Mỹ Phước 3, Bình Dương"
                        value={newProj.locationVi}
                        onChange={(e) => setNewProj({ ...newProj, locationVi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Địa điểm (Tiếng Anh) *' : 'Location (English) *'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="My Phuoc 3 IP, Binh Duong"
                        value={newProj.locationEn}
                        onChange={(e) => setNewProj({ ...newProj, locationEn: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Quy mô công suất (Tiếng Việt) *' : 'Capacity (Vietnamese) *'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Tiêu thụ 25 tấn LPG / tháng"
                        value={newProj.capacityVi}
                        onChange={(e) => setNewProj({ ...newProj, capacityVi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Quy mô công suất (Tiếng Anh) *' : 'Capacity (English) *'}</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="25 tons LPG per month"
                        value={newProj.capacityEn}
                        onChange={(e) => setNewProj({ ...newProj, capacityEn: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* AI Copilot Panel */}
                  <div style={{ backgroundColor: '#F0FDFA', border: '1px solid #99F6E4', borderRadius: 'var(--border-radius-sm)', padding: '0.75rem 1rem', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F766E' }}>✨ AI Translate Assistant</span>
                      <button
                        type="button"
                        className="btn btn-teal btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                        disabled={isTranslatingProject}
                        onClick={() => {
                          setIsTranslatingProject(true);
                          setTimeout(() => {
                            setIsTranslatingProject(false);
                            if (newProj.nameVi && !newProj.nameEn) {
                              setNewProj(prev => ({
                                ...prev,
                                nameEn: translateViToEn(prev.nameVi),
                                locationEn: translateViToEn(prev.locationVi),
                                scopeEn: translateViToEn(prev.scopeVi),
                                capacityEn: translateViToEn(prev.capacityVi),
                                resultEn: translateViToEn(prev.resultVi)
                              }));
                            } else {
                              setNewProj(prev => ({
                                ...prev,
                                nameEn: translateViToEn(prev.nameVi) || prev.nameEn,
                                locationEn: translateViToEn(prev.locationVi) || prev.locationEn,
                                scopeEn: translateViToEn(prev.scopeVi) || prev.scopeEn,
                                capacityEn: translateViToEn(prev.capacityVi) || prev.capacityEn,
                                resultEn: translateViToEn(prev.resultVi) || prev.resultEn
                              }));
                            }
                            logAction(`Triggered AI Translation for project: "${newProj.nameVi || 'New'}"`);
                          }, 800);
                        }}
                      >
                        {isTranslatingProject ? 'Translating...' : 'Dịch tự động'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cột phải: Phạm vi, kết quả & thiết bị */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Phạm vi công việc (Tiếng Việt) *' : 'Scope of Work (Vietnamese) *'}</label>
                      <textarea 
                        className="form-input" 
                        style={{ height: '80px', resize: 'vertical' }}
                        value={newProj.scopeVi}
                        onChange={(e) => setNewProj({ ...newProj, scopeVi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Phạm vi công việc (Tiếng Anh) *' : 'Scope of Work (English) *'}</label>
                      <textarea 
                        className="form-input" 
                        style={{ height: '80px', resize: 'vertical' }}
                        value={newProj.scopeEn}
                        onChange={(e) => setNewProj({ ...newProj, scopeEn: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Kết quả đạt được (Tiếng Việt) *' : 'Result (Vietnamese) *'}</label>
                      <textarea 
                        className="form-input" 
                        style={{ height: '80px', resize: 'vertical' }}
                        value={newProj.resultVi}
                        onChange={(e) => setNewProj({ ...newProj, resultVi: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">{language === 'vi' ? 'Kết quả đạt được (Tiếng Anh) *' : 'Result (English) *'}</label>
                      <textarea 
                        className="form-input" 
                        style={{ height: '80px', resize: 'vertical' }}
                        value={newProj.resultEn}
                        onChange={(e) => setNewProj({ ...newProj, resultEn: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{language === 'vi' ? 'Thiết bị chính lắp đặt (Phân cách bằng dấu phẩy) *' : 'Key Equipment (Comma separated) *'}</label>
                    <textarea 
                      className="form-input" 
                      style={{ height: '65px', resize: 'vertical' }}
                      placeholder="30m³ LPG Tank, 300 kg/h Vaporizer, Fisher Regulators"
                      value={newProj.equipmentsInput}
                      onChange={(e) => setNewProj({ ...newProj, equipmentsInput: e.target.value })}
                      required
                    />
                  </div>

                  {/* SEO Analyzer Panel */}
                  {(() => {
                    const seo = calculateSEOScore(newProj.nameVi, newProj.scopeVi, newProj.resultVi, newProj.imageURL, projectKeyword);
                    const scoreColor = seo.score >= 80 ? '#10B981' : seo.score >= 50 ? '#F59E0B' : '#EF4444';
                    const scoreBg = seo.score >= 80 ? '#ECFDF5' : seo.score >= 50 ? '#FFFBEB' : '#FEF2F2';
                    return (
                      <div style={{ borderTop: '1px dashed var(--color-gray-border)', paddingTop: '0.75rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-navy)' }}>📊 Live SEO Score</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              style={{ width: '80px', padding: '0.2rem 0.4rem', fontSize: '0.7rem', height: '24px' }}
                              placeholder="Keyword"
                              value={projectKeyword}
                              onChange={(e) => setProjectKeyword(e.target.value)}
                            />
                            <span style={{ 
                              fontSize: '0.75rem', fontWeight: 800, color: scoreColor, 
                              backgroundColor: scoreBg, padding: '0.1rem 0.4rem', 
                              borderRadius: 'var(--border-radius-full)', border: `1px solid ${scoreColor}40`
                            }}>
                              {seo.score}/100
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                          {seo.rules.map(rule => (
                            <div key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem' }}>
                              <span>{rule.passed ? '✅' : '❌'}</span>
                              <span style={{ color: rule.passed ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>
                                {language === 'vi' ? rule.labelVi : rule.labelEn}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--color-gray-border)', paddingTop: '1.25rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setShowAddProjectModal(false)}
                >
                  {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
                </button>
                <button type="submit" className="btn btn-teal">
                  {editingProject 
                    ? (language === 'vi' ? 'Lưu thay đổi' : 'Save Changes') 
                    : (language === 'vi' ? 'Thêm dự án' : 'Add Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVISION HISTORY MODAL */}
      {showHistoryModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, maxWidth: '600px', width: '90%' }} className="animate-fade-in">
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-white)' }}>
                {language === 'vi' ? 'Lịch Sử Phiên Bản Block' : 'Page Revision History'}
              </h3>
              <button onClick={() => setShowHistoryModal(false)} style={styles.closeBtn}>Close</button>
            </div>
            
            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                {language === 'vi' 
                  ? 'Chọn một phiên bản trước đó để khôi phục lại cấu trúc blocks của trang này.' 
                  : 'Select a previous backup commit to rollback layout blocks for this page.'}
              </p>

              {pageHistory.filter(h => h.pageId === editingBlocksPageId).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', border: '1px dashed var(--color-gray-border)', borderRadius: 'var(--border-radius-sm)' }}>
                  {language === 'vi' ? 'Chưa có bản lưu lịch sử nào cho trang này.' : 'No backup versions saved for this page.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {pageHistory.filter(h => h.pageId === editingBlocksPageId).map((rev) => (
                    <div 
                      key={rev.id} 
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '0.75rem 1rem', border: '1px solid var(--color-gray-border)', 
                        borderRadius: 'var(--border-radius-sm)', backgroundColor: 'var(--color-white)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-navy)' }}>
                          {new Date(rev.timestamp).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                          ID: <code style={{ backgroundColor: '#F1F5F9', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>{rev.id}</code> | {language === 'vi' ? 'Số blocks:' : 'Blocks count:'} {rev.blocks.length}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-teal btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => {
                            if (confirm(language === 'vi' ? 'Bạn có muốn khôi phục bản lưu này không?' : 'Do you want to rollback to this version?')) {
                              if (editingBlocksPageId) {
                                handleSavePageBlocks(editingBlocksPageId, rev.blocks);
                                logAction(`Restored page blocks layout to version from: ${new Date(rev.timestamp).toLocaleString()}`);
                                setShowHistoryModal(false);
                                alert(language === 'vi' ? 'Đã khôi phục phiên bản thành công!' : 'Version restored successfully!');
                              }
                            }
                          }}
                        >
                          {language === 'vi' ? 'Khôi phục' : 'Rollback'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ color: '#EF4444', borderColor: '#FCA5A5', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={async () => {
                            if (confirm(language === 'vi' ? 'Bạn có muốn xoá bản lưu này không?' : 'Delete this backup?')) {
                              const client = supabase;
                              if (client) {
                                try {
                                  const { error } = await client
                                    .from('page_revisions')
                                    .delete()
                                    .eq('id', rev.id);
                                  if (error) throw error;
                                } catch (err) {
                                  console.error('Failed to delete page revision from Supabase:', err);
                                }
                              }
                              setPageHistory(prev => prev.filter(h => h.id !== rev.id));
                            }
                          }}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid var(--color-gray-border)' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowHistoryModal(false)}
              >
                {language === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
      <MediaPickerDialog open={articleMediaPickerOpen} value={newArt.imageURL} language={language} onClose={() => setArticleMediaPickerOpen(false)} onSelect={(url) => setNewArt((current) => ({ ...current, imageURL: current.imageURL || url, galleryImages: Array.from(new Set([...current.galleryImages, url])) }))} />
      <MediaPickerDialog open={projectMediaPickerOpen} value={newProj.imageURL} language={language} onClose={() => setProjectMediaPickerOpen(false)} onSelect={(url) => setNewProj((current) => ({ ...current, imageURL: current.imageURL || url, galleryImages: Array.from(new Set([...current.galleryImages, url])) }))} />
      <MediaPickerDialog open={blockLogoPickerOpen} language={language} onClose={() => setBlockLogoPickerOpen(false)} onSelect={async (url) => { if (!editingBlocksPageId || !selectedBlockId) return; const blocksList = getPageBlocks(editingBlocksPageId); const selectedBlock = blocksList.find((b: any) => b.id === selectedBlockId); const client = supabase; if (client) { try { const path = decodeURIComponent(url.split('/').pop() || ''); const currentLogosLength = selectedBlock?.logos?.length || 0; await client.from('media_assets').update({ media_role: 'logo', visible: true, sort_order: currentLogosLength }).eq('storage_path', path); } catch (err) { console.error('Failed to save partner logo to Supabase:', err); } } handleSavePageBlocks(editingBlocksPageId, blocksList.map((block: any) => block.id === selectedBlockId ? { ...block, logos: Array.from(new Set([...(block.logos || []), url])) } : block)); }} />
      <MediaPickerDialog open={guiLogoPickerOpen} language={language} onClose={() => setGuiLogoPickerOpen(false)} onSelect={(url) => { onUpdateGuiSettings({ ...guiSettings, logoUrl: url }); setGuiLogoPickerOpen(false); }} />
      <MediaPickerDialog 
        open={blockHeroImagePickerOpen} 
        language={language} 
        onClose={() => setBlockHeroImagePickerOpen(false)} 
        onSelect={(url) => {
          if (!editingBlocksPageId || !selectedBlockId) return;
          const blocksList = getPageBlocks(editingBlocksPageId);
          const list = blocksList.map((b: any) => b.id === selectedBlockId ? { ...b, image: url } : b);
          handleSavePageBlocks(editingBlocksPageId, list);
          setBlockHeroImagePickerOpen(false);
        }} 
      />
      <MediaPickerDialog 
        open={pageBannerImagePickerOpen} 
        language={language} 
        onClose={() => {
          setPageBannerImagePickerOpen(false);
          setPickerForPageId(null);
        }} 
        onSelect={(url) => {
          if (!pickerForPageId) return;
          setPages(prev => prev.map(item => item.id === pickerForPageId ? { ...item, bannerImage: url } : item));
          logAction(`Selected banner image from Media Vault for page ID: ${pickerForPageId}`);
          setPageBannerImagePickerOpen(false);
          setPickerForPageId(null);
        }} 
      />
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    borderBottom: '2px solid var(--color-gray-border)',
    paddingBottom: '1.5rem',
  },
  versionBadge: {
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
    fontSize: '0.75rem',
    fontWeight: 700,
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '1rem',
    marginBottom: '2.5rem',
  },
  statCard: {
    backgroundColor: 'var(--color-gray-card)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: 'var(--shadow-sm)',
  },
  statLabel: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  },
  statValue: {
    display: 'block',
    fontSize: '1.5rem',
    fontWeight: 800,
    color: 'var(--color-navy)',
    marginTop: '0.15rem',
  },
  tabBar: {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid var(--color-gray-border)',
    paddingBottom: '0.75rem',
    marginBottom: '2rem',
  },
  tabBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'none',
    border: 'none',
    padding: '0.6rem 1.25rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    borderRadius: 'var(--border-radius-sm)',
    transition: 'var(--transition-fast)',
  },
  tabBtnActive: {
    backgroundColor: 'var(--color-teal-glow)',
    color: 'var(--color-teal)',
  },
  tabContent: {
    backgroundColor: 'var(--color-gray-card)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    padding: '2rem',
    boxShadow: 'var(--shadow-sm)',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  tableResponsive: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thRow: {
    borderBottom: '2px solid var(--color-gray-border)',
    backgroundColor: 'var(--color-gray-bg)',
  },
  th: {
    padding: '0.75rem 1rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--color-navy)',
    textTransform: 'uppercase',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid var(--color-gray-border)',
    transition: 'background var(--transition-fast)',
  },
  td: {
    padding: '1rem',
    fontSize: '0.85rem',
    color: 'var(--color-text-main)',
  },
  badge: {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.2rem 0.4rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--border-radius-full)',
  },
  emptyBox: {
    padding: '4rem 2rem',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputHelp: {
    display: 'block',
    fontSize: '0.75rem',
    color: 'var(--color-text-muted)',
    marginTop: '0.25rem',
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
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '2rem 1rem',
    overflowY: 'auto',
  },
  modalCard: {
    width: '100%',
    maxWidth: '650px',
    backgroundColor: 'var(--color-gray-card)',
    borderRadius: 'var(--border-radius-lg)',
    boxShadow: 'var(--shadow-premium)',
    overflow: 'hidden',
    margin: '2rem 0',
  },
  modalHeader: {
    padding: '1.25rem 1.5rem',
    backgroundColor: 'var(--color-navy)',
    color: 'var(--color-white)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-white)',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  modalBody: {
    padding: '1.5rem',
  },
  modalMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.75rem',
    fontSize: '0.85rem',
    color: 'var(--color-text-main)',
    borderBottom: '1px solid var(--color-gray-border)',
    paddingBottom: '1rem',
  },
  messageBox: {
    backgroundColor: 'var(--color-gray-bg)',
    border: '1px solid var(--color-gray-border)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.8rem',
    whiteSpace: 'pre-wrap',
    maxHeight: '150px',
    overflowY: 'auto',
  },
  statusUpdateBox: {
    marginTop: '1.5rem',
    borderTop: '1px solid var(--color-gray-border)',
    paddingTop: '1.25rem',
  },
  loginOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '60vh',
    padding: '2rem 0',
  },
  loginCard: {
    width: '100%',
    maxWidth: '360px',
    backgroundColor: 'var(--color-gray-card)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    boxShadow: 'var(--shadow-premium)',
    overflow: 'hidden',
  },
  loginHeader: {
    padding: '1.5rem',
    backgroundColor: 'var(--color-gray-bg)',
    borderBottom: '1px solid var(--color-gray-border)',
    textAlign: 'center',
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    border: '1px solid #FCA5A5',
    color: '#B91C1C',
    padding: '0.5rem 0.75rem',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.8rem',
    fontWeight: 600,
    textAlign: 'center',
  },
  credentialsHint: {
    fontSize: '0.7rem',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: '0.5rem',
  },
  configCol: {},
  auditorCol: {
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-gray-border)',
    borderRadius: 'var(--border-radius-md)',
    padding: '1.5rem',
    boxShadow: 'var(--shadow-sm)',
  },
  auditorInputsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    backgroundColor: 'var(--color-gray-bg)',
    padding: '1rem',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--color-gray-border)',
  },
  mathAuditBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  mathLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  mathFormula: {
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-text-muted)',
    fontSize: '0.7rem',
    backgroundColor: 'var(--color-gray-bg)',
    padding: '0.15rem 0.3rem',
    borderRadius: 'var(--border-radius-sm)',
  },
  mathValue: {
    fontWeight: 600,
    color: 'var(--color-navy)',
  }
};
