import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface CmsManagerShellProps {
  title: string;
  description: string;
  actionLabel: string;
  ActionIcon: LucideIcon;
  onAction: () => void;
  children: React.ReactNode;
}

export const CmsManagerShell: React.FC<CmsManagerShellProps> = ({
  title, description, actionLabel, ActionIcon, onAction, children,
}) => (
  <section className="cms-manager animate-fade-in">
    <header className="cms-manager__header">
      <div>
        <h3 className="cms-manager__title">{title}</h3>
        <p className="cms-manager__description">{description}</p>
      </div>
      <button className="btn btn-teal btn-sm" onClick={onAction}>
        <ActionIcon size={16} /> {actionLabel}
      </button>
    </header>
    {children}
  </section>
);

export const CmsTable: React.FC<{ headers: string[]; children: React.ReactNode }> = ({ headers, children }) => (
  <div className="cms-table-wrap">
    <table className="cms-table">
      <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const CmsStatusButton: React.FC<{ visible: boolean; onClick: () => void; language: 'vi' | 'en' }> = ({ visible, onClick, language }) => (
  <button className={`btn btn-sm ${visible ? 'btn-teal' : 'btn-outline'} cms-status-button`} onClick={onClick}>
    {visible ? (language === 'vi' ? 'Đang hiện' : 'Visible') : (language === 'vi' ? 'Đang ẩn' : 'Hidden')}
  </button>
);

export const CmsIconButton: React.FC<{
  label: string;
  tone: 'edit' | 'delete' | 'view';
  onClick: () => void;
  children: React.ReactNode;
}> = ({ label, tone, onClick, children }) => (
  <button type="button" className={`cms-icon-button cms-icon-button--${tone}`} aria-label={label} title={label} onClick={onClick}>
    {children}
  </button>
);

export const CmsBadge: React.FC<{ value: string }> = ({ value }) => (
  <span className={`cms-badge cms-badge--${value.toLowerCase()}`}>{value.toUpperCase()}</span>
);

export const CmsConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ open, title, message, cancelLabel, confirmLabel, onCancel, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="cms-confirm-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="cms-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="cms-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <h3 id="cms-confirm-title">{title}</h3>
        <p>{message}</p>
        <div className="cms-confirm-actions">
          <button className="btn btn-outline btn-sm" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-primary btn-sm" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};
