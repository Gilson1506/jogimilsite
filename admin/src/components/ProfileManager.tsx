import { useEffect, useRef, useState } from 'react';
import { AdminIcon3D } from './AdminIcon3D';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  Save,
  Lock,
  Bell,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  RefreshCw,
  Camera,
  Trash2,
} from 'lucide-react';
import { apiFetch, resizeImageToAvatarDataUrl, type SessionUser } from '../lib/api';
import { BrandLoader } from './BrandLoader';

interface ProfileManagerProps {
  onProfileUpdated?: (user: SessionUser) => void;
}

const ROLE_LABELS: Record<string, { label: string; desc: string; cls: string }> = {
  admin: {
    label: 'Administrador Geral',
    desc: 'Acesso total a todos os contactos, atendimentos, utilizadores, partilhas e monitorização online.',
    cls: 'border-brand/40 bg-brand/15 text-brand',
  },
  gestor: {
    label: 'Gestor Comercial',
    desc: 'Gere os seus próprios contactos, eventos, campanhas e atendimentos partilhados consigo.',
    cls: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
  },
  agente: {
    label: 'Agente / Operador',
    desc: 'Acesso isolado apenas aos seus próprios contactos, eventos e atendimentos partilhados pelo Admin.',
    cls: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  visualizador: {
    label: 'Consultor (Leitura)',
    desc: 'Consulta apenas os contactos e atendimentos atribuídos ao seu perfil.',
    cls: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
};

export function ProfileManager({ onProfileUpdated }: ProfileManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<SessionUser | null>(null);
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(15);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; profile: SessionUser }>('/api/v1/admin/profile');
      if (res.profile) {
        setProfile(res.profile);
        setName(res.profile.name || '');
        setJobTitle(res.profile.jobTitle || '');
        setWhatsapp(res.profile.whatsapp || '');
        setAvatarUrl(res.profile.avatarUrl || '');
        setNotifyWhatsapp(res.profile.notifyWhatsapp !== false);
        setNotifyEmail(res.profile.notifyEmail !== false);
        setReminderMinutesBefore(Number(res.profile.reminderMinutesBefore ?? 15));
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao carregar o seu perfil.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice({ type: 'error', text: 'Selecione uma imagem válida (JPG, PNG ou WebP).' });
      return;
    }
    try {
      const dataUrl = await resizeImageToAvatarDataUrl(file, 240);
      setAvatarUrl(dataUrl);
      setNotice({ type: 'success', text: 'Foto carregada! Clique em "Guardar Alterações do Perfil" para confirmar.' });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Falha ao processar foto.' });
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (newPassword && newPassword.length < 4) {
      setNotice({ type: 'error', text: 'A nova palavra-passe deve ter pelo menos 4 caracteres.' });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setNotice({ type: 'error', text: 'As palavras-passe não coincidem.' });
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch<{ success: boolean; profile: SessionUser; message?: string }>(
        '/api/v1/admin/profile',
        {
          method: 'PUT',
          body: JSON.stringify({
            name: name.trim(),
            jobTitle: jobTitle.trim(),
            whatsapp: whatsapp.trim(),
            avatarUrl,
            notifyWhatsapp,
            notifyEmail,
            reminderMinutesBefore,
            newPassword: newPassword.trim() || undefined,
          }),
        }
      );

      if (res.success && res.profile) {
        setProfile(res.profile);
        setNewPassword('');
        setConfirmPassword('');
        onProfileUpdated?.(res.profile);
        setNotice({
          type: 'success',
          text: res.message || 'Perfil guardado! As notificações de eventos serão enviadas para o seu WhatsApp.',
        });
      }
    } catch (err) {
      setNotice({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao atualizar perfil.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="py-20 flex justify-center">
        <BrandLoader size="md" />
      </div>
    );
  }

  const roleMeta = ROLE_LABELS[profile?.role || 'agente'] || ROLE_LABELS.agente;
  const initials = (name || profile?.name || 'JG')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="profile" size={26} />
            <span>Meu Perfil</span>
          </h1>
        </div>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 px-4 py-3 border text-xs ${
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Cartão Resumo do Utilizador com Foto de Perfil */}
      <div className="ds-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFile}
              className="hidden"
            />
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name || profile?.name || 'Perfil'}
                className="h-16 w-16 rounded-full object-cover border-2 border-brand/40"
              />
            ) : (
              <div className="h-16 w-16 rounded-full flex items-center justify-center bg-brand/15 text-brand font-bold text-lg border-2 border-brand/30">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              title="Alterar foto de perfil"
              className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold truncate">{profile?.name}</h2>
              <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase border ${roleMeta.cls}`}>
                {roleMeta.label}
              </span>
            </div>
            <p className="text-xs ds-muted mt-0.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> {profile?.email}
            </p>
            <p className="text-[11px] ds-subtle mt-1">{roleMeta.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="btn btn-secondary btn-sm"
          >
            <Camera className="h-3.5 w-3.5 text-brand" />
            <span>{avatarUrl ? 'Trocar Foto' : 'Adicionar Foto'}</span>
          </button>
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl('')}
              className="btn btn-ghost btn-icon h-8 w-8 text-rose-400 hover:text-rose-300"
              title="Remover foto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Formulário de Edição */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 ds-card">
          <div className="ds-card-header">
            <div>
              <h3 className="ds-title">Dados Pessoais & WhatsApp</h3>
              <p className="ds-subtitle">Usado na assinatura e nas notificações do Calendário</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="label">Nome Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Cargo / Função</label>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ds-subtle" />
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ex.: Gestor de Conta, Diretor Comercial"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="label">Número WhatsApp para Notificações *</label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex.: +244 942 775 559 ou 244942775559"
                  className="input pl-9 font-mono"
                />
              </div>
              <p className="text-[11px] ds-muted mt-1">
                Sempre que agendar um evento num contacto no CRM ou no Calendário, receberá uma notificação automática neste WhatsApp.
              </p>
            </div>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border ds-divider ds-surface-2 cursor-pointer">
              <span className="flex items-center gap-2.5 text-xs">
                <Bell className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong className="block">Lembretes da Agenda via WhatsApp</strong>
                  <span className="ds-muted text-[11px]">
                    Receber alerta no meu WhatsApp ao agendar e antes dos eventos
                  </span>
                </span>
              </span>
              <input
                type="checkbox"
                checked={notifyWhatsapp}
                onChange={(e) => setNotifyWhatsapp(e.target.checked)}
                className="h-4 w-4 accent-[rgb(var(--brand))]"
              />
            </label>

            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border ds-divider ds-surface-2 cursor-pointer">
              <span className="flex items-center gap-2.5 text-xs">
                <Mail className="h-4 w-4 text-brand shrink-0" />
                <span>
                  <strong className="block">Lembretes da Agenda via Email</strong>
                  <span className="ds-muted text-[11px]">
                    Receber lembrete no meu email corporativo ({profile?.email})
                  </span>
                </span>
              </span>
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="h-4 w-4 accent-[rgb(var(--brand))]"
              />
            </label>

            <div>
              <label className="label">Antecedência do Lembrete da Agenda</label>
              <select
                value={reminderMinutesBefore}
                onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                className="input"
              >
                <option value={5}>5 minutos antes do evento</option>
                <option value={15}>15 minutos antes do evento</option>
                <option value={30}>30 minutos antes do evento</option>
                <option value={60}>1 hora antes do evento</option>
                <option value={120}>2 horas antes do evento</option>
                <option value={1440}>1 dia antes do evento</option>
              </select>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 ds-card flex flex-col justify-between">
          <div>
            <div className="ds-card-header">
              <div>
                <h3 className="ds-title">Segurança & Acesso</h3>
                <p className="ds-subtitle">Alterar palavra-passe (opcional)</p>
              </div>
              <ShieldCheck className="h-4 w-4 text-brand" />
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Nova Palavra-passe</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ds-subtle" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Deixe vazio para manter atual"
                    className="input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="label">Confirmar Nova Palavra-passe</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ds-subtle" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova palavra-passe"
                    className="input pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 border-t ds-divider flex justify-end">
            <button type="submit" disabled={saving} className="btn btn-primary w-full">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? 'A guardar...' : 'Guardar Alterações do Perfil'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
