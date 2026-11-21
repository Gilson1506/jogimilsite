import { useState, useEffect, useCallback } from 'react';
import { AdminIcon3D } from './AdminIcon3D';
import { MetaSocialSettingsSection } from './MetaSocialSettingsSection';
import {
  Settings2,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Mail,
  ShieldCheck,
  QrCode,
  LogOut,
  AlertCircle,
  Send,
  Smartphone,
  Wifi,
  WifiOff,
  Bell,
  CalendarClock,
  Save,
} from 'lucide-react';
import { apiFetch, getSessionUser } from '../lib/api';
import { ContactImporter } from './ContactImporter';

interface ReminderUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  whatsapp: string;
  notifyWhatsapp: boolean;
  notifyEmail: boolean;
  reminderMinutesBefore: number;
}

interface SettingsManagerProps {
  theme?: 'dark' | 'light';
  onSetTheme?: (t: 'dark' | 'light') => void;
  sidebarMode?: 'inverted' | 'match' | 'dark' | 'light';
  onChangeSidebarMode?: (m: 'inverted' | 'match' | 'dark' | 'light') => void;
  sidebarCollapsed?: boolean;
  onToggleSidebarCollapsed?: () => void;
}

interface WhatsappStatus {
  online: boolean;
  exists: boolean;
  connected?: boolean;
  state: string;
  instance: string;
  message?: string;
}

interface EmailStatus {
  emailAddress?: string;
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    configured: boolean;
    verified?: boolean;
    verifyMessage?: string;
    destination?: string;
  };
  imap: {
    connected: boolean;
    authenticated?: boolean;
    host: string;
    port: number;
    user?: string;
    latencyMs?: number;
    protocol?: string;
    status: string;
    message: string;
  };
}

export function SettingsManager({
  theme = 'dark',
  onSetTheme,
  sidebarMode = 'inverted',
  onChangeSidebarMode,
  sidebarCollapsed = false,
  onToggleSidebarCollapsed,
}: SettingsManagerProps) {

  const [waStatus, setWaStatus] = useState<WhatsappStatus | null>(null);
  const [waLoading, setWaLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);

  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [emailLoading, setEmailLoading] = useState(true);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');

  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lembretes Automáticos da Agenda por Utilizador (WhatsApp & Email)
  const currentUser = getSessionUser();
  const isAdmin = !currentUser || currentUser.role === 'admin' || currentUser.role === 'Administrador Executivo';
  const [reminderUsers, setReminderUsers] = useState<ReminderUserRow[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [testingUserId, setTestingUserId] = useState<string | null>(null);
  const [globalCalEnabled, setGlobalCalEnabled] = useState(true);
  const [globalDefaultLead, setGlobalDefaultLead] = useState(15);
  const [savingGlobalCal, setSavingGlobalCal] = useState(false);

  const loadReminderConfig = useCallback(async () => {
    setRemindersLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        apiFetch<{ success: boolean; users?: Array<Record<string, unknown>> }>('/api/v1/admin/users').catch(() => ({
          success: false,
          users: [],
        })),
        apiFetch<{ success: boolean; settings?: { calendarReminders?: { enabled?: boolean; defaultMinutesBefore?: number } } }>(
          '/api/v1/admin/settings'
        ).catch(() => ({
          success: false,
          settings: {} as { calendarReminders?: { enabled?: boolean; defaultMinutesBefore?: number } },
        })),
      ]);

      const calRem = sRes?.settings?.calendarReminders;
      if (calRem) {
        setGlobalCalEnabled(calRem.enabled !== false);
        setGlobalDefaultLead(Number(calRem.defaultMinutesBefore ?? 15));
      }

      const list = (uRes.users || []).map((u) => ({
        id: String(u.id || ''),
        name: String(u.name || ''),
        email: String(u.email || ''),
        role: String(u.role || 'agente'),
        whatsapp: String(u.whatsapp || ''),
        notifyWhatsapp: u.notifyWhatsapp !== false,
        notifyEmail: u.notifyEmail !== false,
        reminderMinutesBefore: Number(u.reminderMinutesBefore ?? 15),
      }));
      setReminderUsers(list);
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  const handleSaveGlobalCalendarSettings = async () => {
    setSavingGlobalCal(true);
    try {
      await apiFetch('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          calendarReminders: {
            enabled: globalCalEnabled,
            defaultMinutesBefore: globalDefaultLead,
          },
        }),
      });
      showNotice('success', 'Definições globais de lembretes da Agenda guardadas.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao guardar definições da Agenda.');
    } finally {
      setSavingGlobalCal(false);
    }
  };

  const handleSaveUserReminder = async (row: ReminderUserRow) => {
    setSavingUserId(row.id);
    try {
      const isSelf = row.id === currentUser?.id;
      const endpoint = isAdmin ? `/api/v1/admin/users/${row.id}` : '/api/v1/admin/profile';
      await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify({
          whatsapp: row.whatsapp.trim(),
          notifyWhatsapp: row.notifyWhatsapp,
          notifyEmail: row.notifyEmail,
          reminderMinutesBefore: row.reminderMinutesBefore,
        }),
      });
      showNotice(
        'success',
        `Lembretes da Agenda de ${isSelf ? 'seu perfil' : row.name} guardados (WhatsApp: ${
          row.notifyWhatsapp ? 'Ativo' : 'Desativado'
        } · Email: ${row.notifyEmail ? 'Ativo' : 'Desativado'}).`
      );
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao guardar preferências do utilizador.');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleTestUserReminder = async (row: ReminderUserRow) => {
    setTestingUserId(row.id);
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>('/api/v1/admin/calendar/test-reminder', {
        method: 'POST',
        body: JSON.stringify({ userId: row.id }),
      });
      showNotice(res.success ? 'success' : 'error', res.message || 'Teste executado.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Falha ao testar lembrete.');
    } finally {
      setTestingUserId(null);
    }
  };

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 6000);
  };

  const loadWhatsappStatus = useCallback(async () => {
    setWaLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; status: WhatsappStatus }>('/api/v1/admin/whatsapp/status');
      if (res.status) {
        setWaStatus(res.status);
        if (res.status.connected) {
          setQrCode(null);
          setPairingCode(null);
        }
      }
    } catch (err) {
      setWaStatus({
        online: false,
        exists: false,
        connected: false,
        state: 'error',
        instance: 'jogimil',
        message: err instanceof Error ? err.message : 'Erro ao consultar estado do WhatsApp no servidor.',
      });
    } finally {
      setWaLoading(false);
    }
  }, []);

  const loadEmailStatus = useCallback(async () => {
    setEmailLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; status: EmailStatus }>('/api/v1/admin/email/status');
      if (res.status) {
        setEmailStatus(res.status);
      }
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao consultar estado SMTP/IMAP.');
    } finally {
      setEmailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWhatsappStatus();
    loadEmailStatus();
    loadReminderConfig();
  }, [loadWhatsappStatus, loadEmailStatus, loadReminderConfig]);

  // Auto-poll enquanto aguarda leitura do QR Code
  useEffect(() => {
    if (!qrCode || waStatus?.connected) return;
    const id = setInterval(loadWhatsappStatus, 4000);
    return () => clearInterval(id);
  }, [qrCode, waStatus?.connected, loadWhatsappStatus]);

  const handleConnectDevice = async () => {
    setQrLoading(true);
    try {
      const res = await apiFetch<{
        success: boolean;
        qrcode?: string | null;
        pairingCode?: string | null;
        message?: string;
        error?: string;
      }>('/api/v1/admin/whatsapp/qrcode');

      if (!res.success || (!res.qrcode && !res.pairingCode)) {
        showNotice('error', res.message || res.error || 'Não foi possível obter o QR Code da Evolution API.');
        return;
      }

      const rawQr = res.qrcode || null;
      const normalizedQr =
        rawQr && !rawQr.startsWith('data:image') && !rawQr.startsWith('http')
          ? `data:image/png;base64,${rawQr}`
          : rawQr;

      setQrCode(normalizedQr);
      setPairingCode(res.pairingCode || null);
      showNotice('success', 'QR Code gerado. Leia com o WhatsApp do dispositivo da empresa.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Evolution API indisponível no servidor.');
    } finally {
      setQrLoading(false);
    }
  };

  const handleDisconnectDevice = async () => {
    setWaLoading(true);
    try {
      const res = await apiFetch<{ success: boolean }>('/api/v1/admin/whatsapp/logout', { method: 'POST' });
      if (res.success) {
        showNotice('success', 'Dispositivo WhatsApp desconectado com sucesso.');
      } else {
        showNotice('error', 'Não foi possível desconectar a instância.');
      }
      await loadWhatsappStatus();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao desconectar WhatsApp.');
    } finally {
      setWaLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const res = await apiFetch<{ success: boolean; destination?: string; message?: string }>(
        '/api/v1/admin/email/test-send',
        {
          method: 'POST',
          body: JSON.stringify({ email: testEmailTo.trim() || undefined }),
        }
      );
      if (res.success) {
        showNotice('success', `Email de teste enviado para ${res.destination || 'destinatário configurado'}.`);
      } else {
        showNotice('error', res.message || 'Falha ao enviar email de teste.');
      }
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'Erro ao enviar email de teste.');
    } finally {
      setSendingTestEmail(false);
    }
  };

  const isWaConnected = Boolean(waStatus?.connected);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="settings" size={26} />
            <span>Definições &amp; Canais</span>
          </h1>
        </div>
      </div>

      {notice && (
        <div
          className={`flex items-center gap-2 p-3 border text-xs ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* APARÊNCIA DO PAINEL & SIDEBAR */}
      <div className="ds-card">
        <div className="ds-card-header">
          <div className="flex items-center gap-2.5">
            <Settings2 className="h-4 w-4 text-sky-500 shrink-0" />
            <div>
              <h3 className="ds-title">Aparência do Painel &amp; Sidebar</h3>
              <p className="ds-subtitle">
                Configure o tema geral e o contraste do menu lateral (branco ou escuro).
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 grid gap-5 md:grid-cols-3">
          {/* Tema Geral */}
          <div>
            <p className="text-xs font-semibold mb-2">Tema do Painel</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'dark', label: 'Modo Escuro' },
                  { id: 'light', label: 'Modo Claro' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSetTheme?.(opt.id)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    theme === opt.id
                      ? 'border-sky-500 bg-sky-500/15 text-sky-400'
                      : 'ds-divider hover:border-sky-500/40 ds-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modo do Sidebar */}
          <div>
            <p className="text-xs font-semibold mb-2">Estilo do Sidebar</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'inverted', label: 'Contraste Invertido' },
                  { id: 'match', label: 'Seguir Tema' },
                  { id: 'dark', label: 'Sempre Escuro' },
                  { id: 'light', label: 'Sempre Branco' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeSidebarMode?.(opt.id)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    sidebarMode === opt.id
                      ? 'border-sky-500 bg-sky-500/15 text-sky-400'
                      : 'ds-divider hover:border-sky-500/40 ds-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Largura do Sidebar */}
          <div>
            <p className="text-xs font-semibold mb-2">Largura do Sidebar</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (sidebarCollapsed) onToggleSidebarCollapsed?.();
                }}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  !sidebarCollapsed
                    ? 'border-sky-500 bg-sky-500/15 text-sky-400'
                    : 'ds-divider hover:border-sky-500/40 ds-muted'
                }`}
              >
                Expandido
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!sidebarCollapsed) onToggleSidebarCollapsed?.();
                }}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  sidebarCollapsed
                    ? 'border-sky-500 bg-sky-500/15 text-sky-400'
                    : 'ds-divider hover:border-sky-500/40 ds-muted'
                }`}
              >
                Compacto
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* IMPORTAÇÃO DE CONTACTOS EM EXCEL / CSV */}
      <ContactImporter />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. WHATSAPP: APENAS CONECTAR / DESCONECTAR DISPOSITIVO */}
        <div className="ds-card flex flex-col">
          <div className="ds-card-header">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <h3 className="ds-title">WhatsApp · Conectar Dispositivo</h3>
                <p className="ds-subtitle">
                  Instância no servidor: <span className="font-mono">{waStatus?.instance || '—'}</span>
                </p>
              </div>
            </div>

            <span
              className={`badge ${
                isWaConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : waStatus?.online
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {isWaConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isWaConnected
                ? 'Conectado'
                : waStatus?.online
                ? `Desconectado (${waStatus.state})`
                : 'Servidor Offline'}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="p-4 border ds-divider ds-surface-2 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <Smartphone className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>
                  {isWaConnected
                    ? 'Dispositivo WhatsApp emparelhado e operacional.'
                    : waStatus?.message || 'Nenhum dispositivo conectado neste momento.'}
                </span>
              </div>
              <p className="ds-muted text-[11px]">
                No WhatsApp do telemóvel, abra <strong>Dispositivos Associados → Associar um Dispositivo</strong> e leia o QR Code abaixo.
              </p>
            </div>

            {qrCode && !isWaConnected && (
              <div className="flex flex-col items-center gap-3 p-5 bg-white text-slate-900 border ds-divider">
                <img src={qrCode} alt="QR Code WhatsApp Evolution API" className="w-56 h-56 object-contain" />
                {pairingCode && (
                  <div className="text-center">
                    <p className="text-[11px] text-slate-500 uppercase font-semibold">Código de Emparelhamento</p>
                    <p className="text-lg font-mono font-bold tracking-widest text-slate-900">{pairingCode}</p>
                  </div>
                )}
                <p className="text-[11px] text-slate-500">A verificar ligação automaticamente...</p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              {!isWaConnected ? (
                <button
                  type="button"
                  onClick={handleConnectDevice}
                  disabled={qrLoading}
                  className="btn btn-primary"
                >
                  {qrLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                  <span>{qrCode ? 'Atualizar QR Code' : 'Conectar Dispositivo'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDisconnectDevice}
                  disabled={waLoading}
                  className="btn btn-danger"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Desconectar Dispositivo</span>
                </button>
              )}

              <button
                type="button"
                onClick={loadWhatsappStatus}
                disabled={waLoading}
                className="btn btn-secondary"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${waLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar Estado</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. EMAIL SMTP & IMAP (ESTADO REAL DO SERVIDOR) */}
        <div className="ds-card flex flex-col">
          <div className="ds-card-header">
            <div className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-brand shrink-0" />
              <div>
                <h3 className="ds-title">Correio Corporativo (SMTP & IMAP)</h3>
                <p className="ds-subtitle">Credenciais configuradas no servidor (ENV)</p>
              </div>
            </div>

            <span
              className={`badge ${
                emailStatus?.smtp?.verified || emailStatus?.imap?.connected
                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {emailStatus?.smtp?.verified ? 'SMTP Verificado' : emailStatus?.smtp?.configured ? 'Configurado' : 'Pendente ENV'}
            </span>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 border ds-divider ds-surface-2 space-y-1">
                <p className="text-[11px] uppercase tracking-wider ds-subtle font-semibold">SMTP (Envio)</p>
                <p className="font-mono font-semibold">
                  {emailStatus?.smtp ? `${emailStatus.smtp.host}:${emailStatus.smtp.port}` : '—'}
                </p>
                <p className="text-[11px] ds-muted">{emailStatus?.smtp?.user || '—'}</p>
                <p className={`text-[11px] ${emailStatus?.smtp?.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {emailStatus?.smtp?.verifyMessage || (emailLoading ? 'A verificar...' : 'Sem verificação')}
                </p>
              </div>

              <div className="p-3.5 border ds-divider ds-surface-2 space-y-1">
                <p className="text-[11px] uppercase tracking-wider ds-subtle font-semibold">IMAP (Entrada)</p>
                <p className="font-mono font-semibold">
                  {emailStatus?.imap ? `${emailStatus.imap.host}:${emailStatus.imap.port}` : '—'}
                </p>
                <p className="text-[11px] ds-muted">
                  {emailStatus?.imap?.latencyMs ? `Latência: ${emailStatus.imap.latencyMs}ms` : 'SSL/TLS 993'}
                </p>
                <p
                  className={`text-[11px] ${
                    emailStatus?.imap?.authenticated
                      ? 'text-emerald-400'
                      : emailStatus?.imap?.connected
                      ? 'text-sky-400'
                      : 'text-rose-400'
                  }`}
                >
                  {emailStatus?.imap?.message || (emailLoading ? 'A verificar...' : '—')}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="email"
                value={testEmailTo}
                onChange={(e) => setTestEmailTo(e.target.value)}
                placeholder="Email destino para teste (opcional)"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTestEmail}
                className="btn btn-primary"
              >
                {sendingTestEmail ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>Enviar Teste</span>
              </button>
              <button
                type="button"
                onClick={loadEmailStatus}
                disabled={emailLoading}
                className="btn btn-secondary"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${emailLoading ? 'animate-spin' : ''}`} />
                <span>Verificar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lembretes Automáticos da Agenda por Utilizador (WhatsApp & Email) */}
      <div className="ds-card overflow-hidden">
        <div className="ds-card-header flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="h-4 w-4 text-brand shrink-0" />
            <div>
              <h2 className="ds-title">Lembretes da Agenda por Utilizador</h2>
              <p className="ds-subtitle">
                Envio automático via WhatsApp e/ou Email de cada utilizador antes dos eventos agendados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={globalCalEnabled}
                onChange={(e) => setGlobalCalEnabled(e.target.checked)}
                className="h-4 w-4 accent-[rgb(var(--brand))]"
              />
              <span>Lembretes automáticos ativos</span>
            </label>
            <select
              value={globalDefaultLead}
              onChange={(e) => setGlobalDefaultLead(Number(e.target.value))}
              className="input h-8 w-auto text-xs"
              title="Antecedência padrão"
            >
              <option value={5}>Padrão: 5 min antes</option>
              <option value={15}>Padrão: 15 min antes</option>
              <option value={30}>Padrão: 30 min antes</option>
              <option value={60}>Padrão: 1 hora antes</option>
              <option value={120}>Padrão: 2 horas antes</option>
              <option value={1440}>Padrão: 1 dia antes</option>
            </select>
            <button
              type="button"
              disabled={savingGlobalCal}
              onClick={handleSaveGlobalCalendarSettings}
              className="btn btn-secondary btn-sm"
            >
              <Save className="h-3.5 w-3.5 text-brand" />
              <span>{savingGlobalCal ? 'A guardar...' : 'Guardar Padrão'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {remindersLoading && reminderUsers.length === 0 ? (
            <p className="text-xs ds-muted text-center py-8">A carregar utilizadores...</p>
          ) : reminderUsers.length === 0 ? (
            <p className="text-xs ds-muted text-center py-8">Nenhum utilizador encontrado.</p>
          ) : (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Utilizador</th>
                  <th>WhatsApp</th>
                  <th className="text-center">Via WhatsApp</th>
                  <th className="text-center">Via Email</th>
                  <th>Antecedência</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {reminderUsers.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <p className="text-xs font-semibold">{row.name}</p>
                      <p className="text-[11px] ds-muted font-mono">{row.email}</p>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.whatsapp}
                        onChange={(e) =>
                          setReminderUsers((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, whatsapp: e.target.value } : item
                            )
                          )
                        }
                        placeholder="2449XXXXXXXX"
                        className="input h-8 text-xs font-mono w-40"
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={row.notifyWhatsapp}
                        onChange={(e) =>
                          setReminderUsers((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, notifyWhatsapp: e.target.checked } : item
                            )
                          )
                        }
                        className="h-4 w-4 accent-[rgb(var(--brand))] cursor-pointer"
                        title="Receber lembretes da Agenda via WhatsApp"
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={row.notifyEmail}
                        onChange={(e) =>
                          setReminderUsers((prev) =>
                            prev.map((item) =>
                              item.id === row.id ? { ...item, notifyEmail: e.target.checked } : item
                            )
                          )
                        }
                        className="h-4 w-4 accent-[rgb(var(--brand))] cursor-pointer"
                        title="Receber lembretes da Agenda via Email"
                      />
                    </td>
                    <td>
                      <select
                        value={row.reminderMinutesBefore}
                        onChange={(e) =>
                          setReminderUsers((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? { ...item, reminderMinutesBefore: Number(e.target.value) }
                                : item
                            )
                          )
                        }
                        className="input h-8 text-xs w-36"
                      >
                        <option value={5}>5 min antes</option>
                        <option value={15}>15 min antes</option>
                        <option value={30}>30 min antes</option>
                        <option value={60}>1 hora antes</option>
                        <option value={120}>2 horas antes</option>
                        <option value={1440}>1 dia antes</option>
                      </select>
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={savingUserId === row.id}
                          onClick={() => handleSaveUserReminder(row)}
                          className="btn btn-primary btn-sm"
                        >
                          <Save className="h-3.5 w-3.5" />
                          <span>{savingUserId === row.id ? '...' : 'Guardar'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={testingUserId === row.id}
                          onClick={() => handleTestUserReminder(row)}
                          className="btn btn-secondary btn-sm"
                          title="Enviar lembrete de teste para o WhatsApp e/ou Email deste utilizador"
                        >
                          <Bell className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{testingUserId === row.id ? '...' : 'Testar'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Redes Sociais · Microserviço Meta (Facebook, Instagram & Threads · OAuth + Webhooks) */}
      <MetaSocialSettingsSection onNotice={showNotice} />
    </div>
  );
}
