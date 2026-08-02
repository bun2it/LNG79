export const CMS_BACKUP_VERSION = 1;

const BACKUP_KEYS = [
  'cms_products', 'cms_articles', 'cms_projects', 'cms_pages', 'cms_contact_info',
  'cms_menu', 'cms_media', 'cms_redirects', 'cms_page_history', 'cms_trash_bin',
  'cms_audit_logs', 'cms_visual_text_overrides_v1', 'cms_visual_image_overrides_v1',
  'cms_leads', 'cms_fuel_settings', 'lng79_theme', 'lng_site_lang',
] as const;

export interface CmsBackupFile {
  format: 'lng79-cms-backup';
  version: number;
  exportedAt: string;
  origin: string;
  data: Record<string, string>;
}

export const createCmsBackup = (): CmsBackupFile => {
  const data: Record<string, string> = {};
  BACKUP_KEYS.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) data[key] = value;
  });
  return { format: 'lng79-cms-backup', version: CMS_BACKUP_VERSION, exportedAt: new Date().toISOString(), origin: window.location.origin, data };
};

export const validateCmsBackup = (value: unknown): CmsBackupFile => {
  if (!value || typeof value !== 'object') throw new Error('File backup không hợp lệ.');
  const backup = value as Partial<CmsBackupFile>;
  if (backup.format !== 'lng79-cms-backup') throw new Error('Đây không phải file backup của LNG79 CMS.');
  if (backup.version !== CMS_BACKUP_VERSION) throw new Error(`Phiên bản backup ${backup.version ?? '?'} chưa được hỗ trợ.`);
  if (!backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) throw new Error('Backup không có vùng dữ liệu hợp lệ.');
  Object.entries(backup.data).forEach(([key, storedValue]) => {
    if (!BACKUP_KEYS.includes(key as typeof BACKUP_KEYS[number])) throw new Error(`Backup chứa khóa không được phép: ${key}`);
    if (typeof storedValue !== 'string') throw new Error(`Dữ liệu ${key} không hợp lệ.`);
    if (key.startsWith('cms_')) JSON.parse(storedValue);
  });
  return backup as CmsBackupFile;
};

export const downloadCmsBackup = (backup = createCmsBackup(), prefix = 'lng79-cms-backup') => {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${prefix}-${backup.exportedAt.replace(/[:.]/g, '-')}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const restoreCmsBackup = (backup: CmsBackupFile) => {
  const previous = createCmsBackup().data;
  try {
    BACKUP_KEYS.forEach((key) => localStorage.removeItem(key));
    Object.entries(backup.data).forEach(([key, value]) => localStorage.setItem(key, value));
  } catch (error) {
    BACKUP_KEYS.forEach((key) => localStorage.removeItem(key));
    Object.entries(previous).forEach(([key, value]) => localStorage.setItem(key, value));
    throw error;
  }
};
