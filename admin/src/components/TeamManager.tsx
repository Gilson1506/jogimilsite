import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Users, Plus, Trash2, RefreshCw, X, Mail, Phone, Globe, Image as ImageIcon, Pencil } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Pagination } from './Pagination';
import { BrandLoader } from './BrandLoader';
import { ConfirmModal, FeedbackPopup } from './ConfirmModal';
import { AdminIcon3D } from './AdminIcon3D';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  bio?: string;
  photo?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
}

interface TeamManagerProps {
  theme?: 'dark' | 'light';
}

function compressImageFile(file: File, maxDim = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const isPng = file.type === 'image/png';
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', isPng ? undefined : 0.84));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

export function TeamManager(_props: TeamManagerProps) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Engenharia de Software');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4000);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setRole('');
    setDepartment('Engenharia de Software');
    setEmail('');
    setPhone('');
    setLinkedin('');
    setBio('');
    setPhoto('');
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (m: TeamMember) => {
    setEditingId(m.id);
    setName(m.name || '');
    setRole(m.role || '');
    setDepartment(m.department || 'Engenharia de Software');
    setEmail(m.email || '');
    setPhone(m.phone || m.whatsapp || '');
    setLinkedin(m.linkedin || '');
    setBio(m.bio || '');
    setPhoto(m.photo || '');
    setModalOpen(true);
  };

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ team?: TeamMember[]; data?: TeamMember[] }>('/api/v1/admin/team');
      setTeam(res.team || res.data || []);
    } catch {
      setTeam([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handlePhotoFile = async (file: File) => {
    try {
      const dataUrl = await compressImageFile(file, 800);
      setPhoto(dataUrl);
    } catch {
      showNotice('error', 'Não foi possível processar a imagem.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/v1/admin/team', {
        method: 'POST',
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          name: name.trim(),
          role: role.trim(),
          department: department.trim() || 'Equipa JOGIMIL',
          email: email.trim(),
          phone: phone.trim(),
          whatsapp: phone.trim(),
          linkedin: linkedin.trim(),
          bio: bio.trim(),
          photo: photo.trim(),
        }),
      });
      resetForm();
      setModalOpen(false);
      showNotice('success', editingId ? 'Membro atualizado com sucesso.' : 'Membro adicionado à equipa.');
      await loadTeam();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao guardar membro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/admin/team/${encodeURIComponent(deleteId)}`, { method: 'DELETE' });
      setTeam((prev) => prev.filter((m) => m.id !== deleteId));
      showNotice('success', 'Membro removido com sucesso.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao remover.');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="users" size={26} />
            <span>Equipa</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={loadTeam} disabled={loading} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={openCreateModal} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Novo Membro
          </button>
        </div>
      </div>

      {loading && team.length === 0 ? (
        <div className="ds-card">
          <BrandLoader size="md" />
        </div>
      ) : team.length === 0 ? (
        <div className="ds-card p-12 text-center space-y-3">
          <p className="text-sm ds-muted">Nenhum membro registado na equipa.</p>
          <button type="button" onClick={openCreateModal} className="btn btn-primary">
            <Plus className="h-4 w-4" /> Adicionar membro
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {team.slice((page - 1) * pageSize, page * pageSize).map((m) => (
              <div key={m.id} className="ds-card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3.5">
                  {m.photo ? (
                    <img src={m.photo} alt={m.name} className="h-14 w-14 rounded-none object-cover border ds-divider shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-none border ds-divider ds-surface-2 flex items-center justify-center font-mono font-semibold text-sm shrink-0">
                      {m.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{m.name}</p>
                    <p className="text-xs text-brand font-medium truncate">{m.role}</p>
                    {m.department && <p className="text-[11px] ds-subtle truncate">{m.department}</p>}
                  </div>
                </div>

                {m.bio && <p className="text-xs ds-muted line-clamp-3 flex-1">{m.bio}</p>}

                <div className="space-y-1 text-[11px] ds-muted">
                  {m.email && (
                    <p className="inline-flex items-center gap-1.5 truncate w-full">
                      <Mail className="h-3 w-3 shrink-0 text-brand" /> {m.email}
                    </p>
                  )}
                  {(m.phone || m.whatsapp) && (
                    <p className="inline-flex items-center gap-1.5 truncate w-full">
                      <Phone className="h-3 w-3 shrink-0 text-emerald-400" /> {m.phone || m.whatsapp}
                    </p>
                  )}
                  {m.linkedin && (
                    <p className="inline-flex items-center gap-1.5 truncate w-full">
                      <Globe className="h-3 w-3 shrink-0 text-sky-400" /> {m.linkedin}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t ds-divider flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(m)}
                    className="btn btn-ghost btn-sm"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="btn btn-ghost btn-sm text-rose-500 hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="ds-card">
            <Pagination
              page={page}
              pageSize={pageSize}
              totalItems={team.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}

      {modalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
            onClick={() => setModalOpen(false)}
          >
            <form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              className="ds-card w-full max-w-xl max-h-[88vh] flex flex-col border-[rgb(var(--border-strong))] shadow-2xl animate-fadeIn"
            >
              <div className="ds-card-header">
                <div>
                  <h2 className="ds-title">{editingId ? 'Editar Membro da Equipa' : 'Adicionar Membro da Equipa'}</h2>
                  <p className="ds-subtitle">Visível automaticamente na página Sobre Nós do website</p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-ghost btn-icon h-8 w-8">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4">
                {photo && (
                  <div className="flex items-center gap-3 p-3 rounded-none ds-surface-2 border ds-divider">
                    <img src={photo} alt="Pré-visualização" className="h-16 w-16 rounded-none object-cover border ds-divider" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Pré-visualização da foto</p>
                      <p className="text-[11px] ds-muted truncate">Será exibida no cartão do membro no site.</p>
                    </div>
                    <button type="button" onClick={() => setPhoto('')} className="btn btn-ghost btn-sm text-rose-400">
                      Limpar
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Nome Completo *</label>
                    <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="label">Cargo / Função *</label>
                    <input className="input" value={role} onChange={(e) => setRole(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Departamento</label>
                    <input className="input" value={department} onChange={(e) => setDepartment(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Email Corporativo</label>
                    <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@jogimil.ao" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label">Telefone / WhatsApp</label>
                    <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+244 923 000 000" />
                  </div>
                  <div>
                    <label className="label">LinkedIn (opcional)</label>
                    <input className="input" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
                  </div>
                </div>

                <div>
                  <label className="label">Fotografia (URL ou carregar ficheiro)</label>
                  <div className="flex gap-2">
                    <input
                      className="input flex-1"
                      value={photo}
                      onChange={(e) => setPhoto(e.target.value)}
                      placeholder="https://..."
                    />
                    <label className="btn btn-secondary cursor-pointer">
                      <ImageIcon className="h-4 w-4" /> Ficheiro
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePhotoFile(f);
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="label">Descrição / Biografia Curta</label>
                  <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Resumo da experiência e especialidade..." />
                </div>
              </div>

              <div className="px-5 py-3 border-t ds-divider flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" disabled={saving || !name.trim() || !role.trim()} className="btn btn-primary">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>{editingId ? 'Atualizar' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      <ConfirmModal
        isOpen={Boolean(deleteId)}
        title="Remover Membro da Equipa"
        description="Tem a certeza que pretende remover este colaborador da página de Equipa do website?"
        loading={deleting}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
      <FeedbackPopup notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}
