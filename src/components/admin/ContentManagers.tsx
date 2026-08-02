import React from 'react';
import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react';
import type { ArticleItem } from '../../pages/Knowledge';
import type { ProductItem } from '../../pages/Products';
import type { ProjectItem } from '../../pages/Projects';
import { CmsBadge, CmsConfirmDialog, CmsIconButton, CmsManagerShell, CmsStatusButton, CmsTable } from './CmsManagerShell';
import { MediaPickerDialog } from './MediaPickerDialog';

type Language = 'vi' | 'en';

export const ProductManager: React.FC<{
  language: Language;
  products: ProductItem[];
  onAdd: (product: ProductItem) => void;
  onEdit: (product: ProductItem) => void;
  onDelete: (product: ProductItem) => void;
  onToggle: (id: string) => void;
}> = ({ language, products, onAdd, onEdit, onDelete, onToggle }) => {
  const [editing, setEditing] = React.useState<ProductItem | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<ProductItem | null>(null);
  const [draft, setDraft] = React.useState<ProductItem | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredProducts = products
    .filter((product) => categoryFilter === 'all' || product.category === categoryFilter)
    .filter((product) => !normalizedQuery || [product.name[language], product.specs[language], product.origin].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const openCreate = () => {
    setEditing(null);
    setDraft({ id: `product-${Date.now()}`, name: { vi: '', en: '' }, category: 'lng', specs: { vi: '', en: '' }, origin: '', details: { vi: '', en: '' }, techParams: [], image: '', visible: true, sortOrder: products.length + 1 });
  };
  const openEdit = (product: ProductItem) => {
    setEditing(product);
    setDraft(structuredClone(product));
  };
  const updateLocalized = (field: 'name' | 'specs' | 'details', locale: Language, value: string) => {
    setDraft((current) => current ? { ...current, [field]: { ...current[field], [locale]: value } } : current);
  };
  const saveProduct = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const normalized = { ...draft, techParams: draft.techParams.filter((item) => item.label.vi || item.label.en || item.value) };
    if (editing) onEdit(normalized); else onAdd(normalized);
    setDraft(null);
    setEditing(null);
  };
  return <>
  <CmsManagerShell
    title={language === 'vi' ? 'Hệ Thống Thiết Bị Vật Tư (Catalog)' : 'Products Catalog Inventory'}
    description={language === 'vi' ? 'Danh sách thiết bị đang hiển thị trực tiếp ngoài trang Sản phẩm.' : 'Products currently rendered on the public catalog page.'}
    actionLabel={language === 'vi' ? 'Thêm thiết bị mới' : 'Add New Hardware'}
    ActionIcon={Plus}
    onAction={openCreate}
  >
    <div className="cms-manager-toolbar"><label><Search size={16} /><input className="form-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={language === 'vi' ? 'Tìm tên, thông số, xuất xứ...' : 'Search name, specs, origin...'} /></label><select className="form-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">{language === 'vi' ? 'Tất cả danh mục' : 'All categories'}</option><option value="lng">LNG</option><option value="lpg">LPG</option><option value="valves">{language === 'vi' ? 'Van & Điều áp' : 'Valves'}</option><option value="kitchen">{language === 'vi' ? 'Bếp công nghiệp' : 'Kitchen'}</option><option value="inox">Inox</option></select><small>{filteredProducts.length}/{products.length} {language === 'vi' ? 'sản phẩm' : 'products'}</small></div>
    <CmsTable headers={language === 'vi' ? ['Tên thiết bị', 'Chuyên mục', 'Thông số tiêu chuẩn', 'Xuất xứ', 'Hiển thị', 'Thao tác'] : ['Hardware Name', 'Category', 'Key Specs', 'Origin', 'Status', 'Actions']}>
      {filteredProducts.map((product) => (
        <tr key={product.id}>
          <td><strong>{product.name[language]}</strong></td>
          <td><CmsBadge value={product.category} /></td>
          <td><small>{product.specs[language]}</small></td>
          <td>{product.origin}</td>
          <td><CmsStatusButton visible={product.visible !== false} language={language} onClick={() => onToggle(product.id)} /></td>
          <td><div className="cms-row-actions"><CmsIconButton label="Edit" tone="edit" onClick={() => openEdit(product)}><Edit size={14} /></CmsIconButton><CmsIconButton label="Delete" tone="delete" onClick={() => setPendingDelete(product)}><Trash2 size={14} /></CmsIconButton></div></td>
        </tr>
      ))}
      {filteredProducts.length === 0 && <tr><td colSpan={6} className="cms-table-empty">{language === 'vi' ? 'Không tìm thấy sản phẩm phù hợp.' : 'No matching products.'}</td></tr>}
    </CmsTable>
  </CmsManagerShell>
  {draft && (
    <div className="cms-product-modal-backdrop" onMouseDown={() => setDraft(null)}>
      <form className="cms-product-modal" onSubmit={saveProduct} onMouseDown={(event) => event.stopPropagation()}>
        <div className="cms-product-modal__header">
          <div><h3>{editing ? (language === 'vi' ? 'Sửa sản phẩm' : 'Edit product') : (language === 'vi' ? 'Thêm sản phẩm' : 'Add product')}</h3><p>{language === 'vi' ? 'Thông tin sẽ được lưu trực tiếp vào Catalog.' : 'Changes are saved directly to the Catalog.'}</p></div>
          <button type="button" className="image-library-close" aria-label="Close" onClick={() => setDraft(null)}>×</button>
        </div>
        <div className="cms-product-form-grid">
          <label className="form-group"><span className="form-label">Tên sản phẩm (VI) *</span><input className="form-input" required value={draft.name.vi} onChange={(e) => updateLocalized('name', 'vi', e.target.value)} /></label>
          <label className="form-group"><span className="form-label">Product name (EN) *</span><input className="form-input" required value={draft.name.en} onChange={(e) => updateLocalized('name', 'en', e.target.value)} /></label>
          <label className="form-group"><span className="form-label">{language === 'vi' ? 'Danh mục' : 'Category'}</span><select className="form-select" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}><option value="lng">Thiết bị LNG</option><option value="lpg">Thiết bị LPG</option><option value="valves">Van & Điều áp</option><option value="kitchen">Bếp công nghiệp</option><option value="inox">Thiết bị Inox</option></select></label>
          <label className="form-group"><span className="form-label">{language === 'vi' ? 'Xuất xứ' : 'Origin'}</span><input className="form-input" value={draft.origin} onChange={(e) => setDraft({ ...draft, origin: e.target.value })} /></label>
          <label className="form-group"><span className="form-label">Thông số ngắn (VI) *</span><input className="form-input" required value={draft.specs.vi} onChange={(e) => updateLocalized('specs', 'vi', e.target.value)} /></label>
          <label className="form-group"><span className="form-label">Key specifications (EN) *</span><input className="form-input" required value={draft.specs.en} onChange={(e) => updateLocalized('specs', 'en', e.target.value)} /></label>
          <div className="form-group cms-form-span-2"><span className="form-label">{language === 'vi' ? 'Ảnh sản phẩm' : 'Product image'}</span><div className="cms-media-field">{draft.image ? <img src={draft.image} alt="" /> : <div className="cms-media-field__empty">{language === 'vi' ? 'Chưa có ảnh' : 'No image'}</div>}<button type="button" className="btn btn-outline" onClick={() => setMediaPickerOpen(true)}>{language === 'vi' ? 'Chọn từ Media Vault' : 'Choose from Media Vault'}</button></div><input className="form-input cms-image-url-input" placeholder="https://... hoặc /uploads/..." value={draft.image || ''} onChange={(e) => setDraft({ ...draft, image: e.target.value })} /></div>
          <label className="form-group cms-form-span-2"><span className="form-label">Mô tả chi tiết (VI)</span><textarea className="form-textarea" rows={4} value={draft.details.vi} onChange={(e) => updateLocalized('details', 'vi', e.target.value)} /></label>
          <label className="form-group cms-form-span-2"><span className="form-label">Detailed description (EN)</span><textarea className="form-textarea" rows={4} value={draft.details.en} onChange={(e) => updateLocalized('details', 'en', e.target.value)} /></label>
        </div>
        <div className="cms-tech-params">
          <div className="cms-tech-params__header"><h4>{language === 'vi' ? 'Thông số kỹ thuật' : 'Technical parameters'}</h4><button type="button" className="btn btn-outline btn-sm" onClick={() => setDraft({ ...draft, techParams: [...draft.techParams, { label: { vi: '', en: '' }, value: '' }] })}><Plus size={14} /> {language === 'vi' ? 'Thêm dòng' : 'Add row'}</button></div>
          {draft.techParams.map((param, index) => <div className="cms-tech-param-row" key={index}><input className="form-input" placeholder="Nhãn VI" value={param.label.vi} onChange={(e) => setDraft({ ...draft, techParams: draft.techParams.map((item, i) => i === index ? { ...item, label: { ...item.label, vi: e.target.value } } : item) })} /><input className="form-input" placeholder="Label EN" value={param.label.en} onChange={(e) => setDraft({ ...draft, techParams: draft.techParams.map((item, i) => i === index ? { ...item, label: { ...item.label, en: e.target.value } } : item) })} /><input className="form-input" placeholder="Value" value={param.value} onChange={(e) => setDraft({ ...draft, techParams: draft.techParams.map((item, i) => i === index ? { ...item, value: e.target.value } : item) })} /><CmsIconButton label="Delete row" tone="delete" onClick={() => setDraft({ ...draft, techParams: draft.techParams.filter((_, i) => i !== index) })}><Trash2 size={14} /></CmsIconButton></div>)}
        </div>
        <div className="cms-product-options"><label><input type="checkbox" checked={draft.visible !== false} onChange={(e) => setDraft({ ...draft, visible: e.target.checked })} /> {language === 'vi' ? 'Hiển thị ngoài website' : 'Visible on website'}</label><label>{language === 'vi' ? 'Thứ tự' : 'Order'} <input type="number" className="form-input" min="0" value={draft.sortOrder ?? 0} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) })} /></label></div>
        <div className="cms-product-modal__actions"><button type="button" className="btn btn-outline" onClick={() => setDraft(null)}>{language === 'vi' ? 'Hủy' : 'Cancel'}</button><button className="btn btn-primary" type="submit">{language === 'vi' ? 'Lưu sản phẩm' : 'Save product'}</button></div>
      </form>
    </div>
  )}
  <CmsConfirmDialog open={Boolean(pendingDelete)} title={language === 'vi' ? 'Xóa sản phẩm?' : 'Delete product?'} message={pendingDelete?.name[language] || ''} cancelLabel={language === 'vi' ? 'Hủy' : 'Cancel'} confirmLabel={language === 'vi' ? 'Đưa vào thùng rác' : 'Move to trash'} onCancel={() => setPendingDelete(null)} onConfirm={() => { if (pendingDelete) onDelete(pendingDelete); setPendingDelete(null); }} />
  <MediaPickerDialog open={mediaPickerOpen} value={draft?.image} language={language} onClose={() => setMediaPickerOpen(false)} onSelect={(url) => setDraft((current) => current ? { ...current, image: url } : current)} />
  </>;
};

export const ArticleManager: React.FC<{
  language: Language;
  articles: ArticleItem[];
  onAdd: () => void;
  onEdit: (article: ArticleItem) => void;
  onDelete: (article: ArticleItem) => void;
  onToggle: (id: string) => void;
}> = ({ language, articles, onAdd, onEdit, onDelete, onToggle }) => {
  const [pendingDelete, setPendingDelete] = React.useState<ArticleItem | null>(null);
  const [preview, setPreview] = React.useState<ArticleItem | null>(null);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredArticles = articles
    .filter((article) => category === 'all' || article.category === category)
    .filter((article) => !normalizedQuery || [article.title[language], article.excerpt[language], article.content[language]].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return <>
  <CmsManagerShell
    title={language === 'vi' ? 'Quản Lý Bài Viết Thư Viện Kiến Thức' : 'Manage Knowledge Library Articles'}
    description={language === 'vi' ? 'Thêm, sửa, xóa hoặc kiểm soát bài viết hiển thị ngoài trang Kiến thức.' : 'Create, edit, remove, or control articles shown in the Knowledge Library.'}
    actionLabel={language === 'vi' ? 'Thêm bài viết mới' : 'Add New Article'}
    ActionIcon={Plus}
    onAction={onAdd}
  >
    <div className="cms-manager-toolbar"><label><Search size={16} /><input className="form-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={language === 'vi' ? 'Tìm tiêu đề hoặc nội dung...' : 'Search title or content...'} /></label><select className="form-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">{language === 'vi' ? 'Tất cả chuyên mục' : 'All categories'}</option><option value="energy">{language === 'vi' ? 'Khí & Nhiệt' : 'Gas & Thermal'}</option><option value="safety">{language === 'vi' ? 'An toàn PCCC' : 'Safety'}</option><option value="kitchen">{language === 'vi' ? 'Bếp công nghiệp' : 'Kitchen'}</option></select><small>{filteredArticles.length}/{articles.length} {language === 'vi' ? 'bài' : 'articles'}</small></div>
    <CmsTable headers={language === 'vi' ? ['Tiêu đề', 'Chuyên mục', 'Ngày đăng', 'Hiển thị', 'Thao tác'] : ['Title', 'Category', 'Date', 'Status', 'Actions']}>
      {filteredArticles.map((article) => (
        <tr key={article.id}>
          <td><strong>{article.title[language]}</strong><small className="cms-row-summary">{article.excerpt[language]}</small></td>
          <td><CmsBadge value={article.category} /></td>
          <td>{article.date}</td>
          <td><CmsStatusButton visible={article.visible !== false} language={language} onClick={() => onToggle(article.id)} /></td>
          <td><div className="cms-row-actions"><CmsIconButton label="Preview" tone="view" onClick={() => setPreview(article)}><Eye size={14} /></CmsIconButton><CmsIconButton label="Edit" tone="edit" onClick={() => onEdit(article)}><Edit size={14} /></CmsIconButton><CmsIconButton label="Delete" tone="delete" onClick={() => setPendingDelete(article)}><Trash2 size={14} /></CmsIconButton></div></td>
        </tr>
      ))}
      {filteredArticles.length === 0 && <tr><td colSpan={5} className="cms-table-empty">{language === 'vi' ? 'Không tìm thấy bài viết phù hợp.' : 'No matching articles.'}</td></tr>}
    </CmsTable>
  </CmsManagerShell>
  <CmsConfirmDialog open={Boolean(pendingDelete)} title={language === 'vi' ? 'Xóa bài viết?' : 'Delete article?'} message={pendingDelete?.title[language] || ''} cancelLabel={language === 'vi' ? 'Hủy' : 'Cancel'} confirmLabel={language === 'vi' ? 'Đưa vào thùng rác' : 'Move to trash'} onCancel={() => setPendingDelete(null)} onConfirm={() => { if (pendingDelete) onDelete(pendingDelete); setPendingDelete(null); }} />
  {preview && <div className="cms-confirm-backdrop" onMouseDown={() => setPreview(null)}><article className="cms-article-preview" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="image-library-close" aria-label="Close" onClick={() => setPreview(null)}>×</button>{preview.image && <img className="cms-article-preview__cover" src={preview.image} alt="" />}<div><CmsBadge value={preview.category} /> <small>{preview.date}</small></div><h2>{preview.title[language]}</h2><strong>{preview.excerpt[language]}</strong><div className="cms-article-preview__content">{preview.content[language]}</div></article></div>}
  </>;
};

export const ProjectManager: React.FC<{
  language: Language;
  projects: ProjectItem[];
  onAdd: () => void;
  onEdit: (project: ProjectItem) => void;
  onDelete: (project: ProjectItem) => void;
  onToggle: (id: string) => void;
}> = ({ language, projects, onAdd, onEdit, onDelete, onToggle }) => {
  const [pendingDelete, setPendingDelete] = React.useState<ProjectItem | null>(null);
  const [preview, setPreview] = React.useState<ProjectItem | null>(null);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('all');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredProjects = projects
    .filter((project) => category === 'all' || project.category === category)
    .filter((project) => !normalizedQuery || [project.name[language], project.location[language], project.scope[language]].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return <>
  <CmsManagerShell
    title={language === 'vi' ? 'Quản Lý Danh Sách Dự Án Đã Làm' : 'Manage Case Studies & Projects'}
    description={language === 'vi' ? 'Quản lý nội dung và trạng thái hiển thị của các dự án đã thực hiện.' : 'Manage content and publishing state for completed projects.'}
    actionLabel={language === 'vi' ? 'Thêm dự án mới' : 'Add New Project'}
    ActionIcon={Plus}
    onAction={onAdd}
  >
    <div className="cms-manager-toolbar">
      <label><Search size={16} /><input className="form-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={language === 'vi' ? 'Tìm tên, địa điểm, phạm vi...' : 'Search title, location, scope...'} /></label>
      <select className="form-select" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">{language === 'vi' ? 'Tất cả chuyên mục' : 'All categories'}</option><option value="lng">LNG</option><option value="lpg">LPG</option><option value="conversion">{language === 'vi' ? 'Cải tạo nhiên liệu' : 'Fuel conversion'}</option><option value="kitchen">{language === 'vi' ? 'Bếp công nghiệp' : 'Commercial kitchen'}</option></select>
      <small>{filteredProjects.length}/{projects.length} {language === 'vi' ? 'dự án' : 'projects'}</small>
    </div>
    <CmsTable headers={language === 'vi' ? ['Hình ảnh', 'Tên dự án', 'Phân loại', 'Địa điểm', 'Hiển thị', 'Thao tác'] : ['Image', 'Project Title', 'Category', 'Location', 'Status', 'Actions']}>
      {filteredProjects.map((project) => (
        <tr key={project.id}>
          <td><img className="cms-row-thumbnail" src={project.image} alt="" /></td>
          <td><strong>{project.name[language]}</strong><small className="cms-row-summary">{project.scope[language]}</small></td>
          <td><CmsBadge value={project.category} /></td>
          <td>{project.location[language]}</td>
          <td><CmsStatusButton visible={project.visible !== false} language={language} onClick={() => onToggle(project.id)} /></td>
          <td><div className="cms-row-actions"><CmsIconButton label="Preview" tone="view" onClick={() => setPreview(project)}><Eye size={14} /></CmsIconButton><CmsIconButton label="Edit" tone="edit" onClick={() => onEdit(project)}><Edit size={14} /></CmsIconButton><CmsIconButton label="Delete" tone="delete" onClick={() => setPendingDelete(project)}><Trash2 size={14} /></CmsIconButton></div></td>
        </tr>
      ))}
      {filteredProjects.length === 0 && <tr><td colSpan={6} className="cms-table-empty">{language === 'vi' ? 'Không tìm thấy dự án phù hợp.' : 'No matching projects.'}</td></tr>}
    </CmsTable>
  </CmsManagerShell>
  <CmsConfirmDialog open={Boolean(pendingDelete)} title={language === 'vi' ? 'Xóa dự án?' : 'Delete project?'} message={pendingDelete?.name[language] || ''} cancelLabel={language === 'vi' ? 'Hủy' : 'Cancel'} confirmLabel={language === 'vi' ? 'Đưa vào thùng rác' : 'Move to trash'} onCancel={() => setPendingDelete(null)} onConfirm={() => { if (pendingDelete) onDelete(pendingDelete); setPendingDelete(null); }} />
  {preview && <div className="cms-confirm-backdrop" onMouseDown={() => setPreview(null)}><article className="cms-project-preview" onMouseDown={(event) => event.stopPropagation()}><button type="button" className="image-library-close" aria-label="Close" onClick={() => setPreview(null)}>×</button><div className="cms-project-preview__gallery">{(preview.images?.length ? preview.images : [preview.image]).filter(Boolean).map((url) => <img key={url} src={url} alt="" />)}</div><CmsBadge value={preview.category} /><h3>{preview.name[language]}</h3><p><strong>{preview.location[language]}</strong> · {preview.capacity[language]}</p><p>{preview.scope[language]}</p><p>{preview.result[language]}</p><div className="project-preview-tags">{preview.equipments.map((item) => <span key={item}>{item}</span>)}</div></article></div>}
  </>;
};
