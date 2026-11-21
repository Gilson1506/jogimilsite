import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  RefreshCw,
  Save,
  ShieldCheck,
  Unlink,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

interface MetaAccountStatus {
  connected: boolean;
  pageId?: string;
  pageName?: string;
  igUserId?: string;
  userId?: string;
  username?: string;
  hasToken?: boolean;
  loginHost?: string;
  connectedAt?: string | null;
}

interface MetaStatusResponse {
  service?: string;
  mode?: string;
  graphVersion?: string;
  authMode: 'facebook_unified' | 'instagram_direct' | 'threads' | 'manual_token';
  appConfigured: boolean;
  appId: string;
  hasAppSecret: boolean;
  verifyToken: string;
  redirectUri: string;
  facebook: MetaAccountStatus;
  instagram: MetaAccountStatus;
  threads: MetaAccountStatus;
}

const AUTH_OPTIONS = [
  {
    id: 'facebook_unified',
    title: 'Facebook Login Unificado (Recomendado)',
    host: 'graph.facebook.com',
    desc: 'Um único login conecta Página do Facebook, Instagram Business, Messenger e Instagram Direct.',
    scopes: 'pages_manage_posts · pages_messaging · instagram_content_publish · instagram_manage_messages',
  },
  {
    id: 'instagram_direct',
    title: 'Instagram Login Direto',
    host: 'graph.instagram.com',
    desc: 'Conecta conta Instagram Profissional diretamente sem precisar de Página do Facebook vinculada.',
    scopes: 'instagram_business_basic · instagram_business_content_publish · instagram_business_manage_messages',
  },
  {
    id: 'threads',
    title: 'Threads API (OAuth)',
    host: 'graph.threads.net',
    desc: 'Publicação e respostas orgânicas no Threads (até 250 posts e 1.000 respostas / 24h).',
    scopes: 'threads_basic · threads_content_publish · threads_manage_replies',
  },
  {
    id: 'manual_token',
    title: 'Token Manual / System User',
    host: 'Meta Business Suite',
    desc: 'Cole Page Access Token, Page ID e IG User ID diretamente para desenvolvimento ou uso interno.',
    scopes: 'System User Token permanente',
  },
] as const;

export function MetaSocialSettingsSection({
  onNotice,
}: {
  onNotice: (type: 'success' | 'error', text: string) => void;
}) {
  const [status, setStatus] = useState<MetaStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  const [authMode, setAuthMode] = useState<MetaStatusResponse['authMode']>('facebook_unified');
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageAccessToken, setPageAccessToken] = useState('');
  const [igUserId, setIgUserId] = useState('');
  const [igUsername, setIgUsername] = useState('');
  const [igAccessToken, setIgAccessToken] = useState('');
  const [threadsUserId, setThreadsUserId] = useState('');
  const [threadsAccessToken, setThreadsAccessToken] = useState('');

  const loadMetaStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<MetaStatusResponse>('/api/v1/admin/meta/status');
      setStatus(res);
      setAuthMode(res.authMode || 'facebook_unified');
      setAppId(res.appId || '');
      setAppSecret(res.hasAppSecret ? '••••••••' : '');
      setVerifyToken(res.verifyToken || '');
      setRedirectUri(res.redirectUri || `${window.location.origin}/api/v1/meta/auth/callback`);
      setPageId(res.facebook?.pageId || '');
      setPageName(res.facebook?.pageName || '');
      setPageAccessToken(res.facebook?.hasToken ? '••••••••' : '');
      setIgUserId(res.instagram?.igUserId || '');
      setIgUsername(res.instagram?.username || '');
      setIgAccessToken(res.instagram?.hasToken ? '••••••••' : '');
      setThreadsUserId(res.threads?.userId || '');
      setThreadsAccessToken(res.threads?.hasToken ? '••••••••' : '');
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetaStatus();
  }, [loadMetaStatus]);

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.data?.type === 'JOGIMIL_META_AUTH_OK') {
        onNotice('success', 'Conta Meta autenticada e sincronizada com sucesso!');
        loadMetaStatus();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [loadMetaStatus, onNotice]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<MetaStatusResponse>('/api/v1/admin/meta/config', {
        method: 'POST',
        body: JSON.stringify({
          authMode,
          appId,
          appSecret,
          verifyToken,
          redirectUri,
          pageId,
          pageName,
          pageAccessToken,
          igUserId,
          igUsername,
          igAccessToken,
          threadsUserId,
          threadsAccessToken,
        }),
      });
      setStatus(res);
      onNotice('success', 'Configurações do Microserviço Meta Social guardadas.');
    } catch (err) {
      onNotice('error', err instanceof Error ? err.message : 'Erro ao guardar configuração Meta.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartOAuth = async (targetMode?: string) => {
    setAuthorizing(true);
    try {
      // Guardar App ID / Secret antes de abrir o popup OAuth
      await apiFetch('/api/v1/admin/meta/config', {
        method: 'POST',
        body: JSON.stringify({ authMode, appId, appSecret, verifyToken, redirectUri }),
      });
      const qs = new URLSearchParams({
        mode: targetMode || authMode,
        redirectUri: redirectUri || `${window.location.origin}/api/v1/meta/auth/callback`,
      });
      const res = await apiFetch<{ url: string }>(`/api/v1/admin/meta/auth/url?${qs.toString()}`);
      if (res.url) {
        window.open(res.url, 'jogimil_meta_oauth', 'width=640,height=740,noopener=no');
        onNotice('success', 'Janela oficial de autenticação Meta aberta. Conclua o login no popup.');
      }
    } catch (err) {
      onNotice('error', err instanceof Error ? err.message : 'Configure o App ID antes de iniciar o OAuth.');
    } finally {
      setAuthorizing(false);
    }
  };

  const handleDisconnect = async (target: 'facebook' | 'instagram' | 'threads' | 'all') => {
    try {
      const res = await apiFetch<MetaStatusResponse>('/api/v1/admin/meta/disconnect', {
        method: 'POST',
        body: JSON.stringify({ target }),
      });
      setStatus(res);
      await loadMetaStatus();
      onNotice('success', 'Conta desconectada com sucesso.');
    } catch (err) {
      onNotice('error', err instanceof Error ? err.message : 'Erro ao desconectar.');
    }
  };

  const webhookUrl = `${window.location.origin.replace(':5174', ':3101')}/api/v1/webhooks/meta`;

  const copyText = (val: string, label: string) => {
    navigator.clipboard?.writeText(val);
    onNotice('success', `${label} copiado para a área de transferência.`);
  };

  return (
    <form onSubmit={handleSaveConfig} className="ds-card overflow-hidden">
      <div className="ds-card-header flex-wrap">
        <div className="flex items-center gap-2.5">
          <Link2 className="h-4 w-4 text-brand" />
          <div>
            <h2 className="ds-title">Redes Sociais · Microserviço Meta (Facebook, Instagram &amp; Threads)</h2>
            <p className="ds-subtitle">
              Publicação orgânica 100% gratuita (Posts, Reels, Stories, Carrossel) e DMs centralizadas (Messenger &amp; Instagram Direct · tag HUMAN_AGENT 7 dias)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
            {status?.mode === 'microservice_http' ? 'Microserviço :3102 Online' : 'Ponte Local Ativa'}
          </span>
          <button type="button" onClick={loadMetaStatus} disabled={loading} className="btn btn-secondary btn-sm">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Estado das 3 Contas Conectadas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              key: 'facebook' as const,
              title: 'Facebook Page & Messenger',
              iconSrc: '/icons/facebook.svg',
              connected: Boolean(status?.facebook?.connected),
              detail: status?.facebook?.pageName || status?.facebook?.pageId || 'Não conectado',
              accent: 'text-blue-400',
            },
            {
              key: 'instagram' as const,
              title: 'Instagram Business & Direct',
              iconSrc: '/icons/instagram.svg',
              connected: Boolean(status?.instagram?.connected),
              detail: status?.instagram?.username
                ? `@${status.instagram.username}`
                : status?.instagram?.igUserId || 'Não conectado',
              accent: 'text-pink-400',
            },
            {
              key: 'threads' as const,
              title: 'Threads API (Orgânico)',
              iconSrc: '/icons/threads.svg',
              connected: Boolean(status?.threads?.connected),
              detail: status?.threads?.username || status?.threads?.userId || 'Não conectado',
              accent: 'text-sky-400',
            },
          ].map((acc) => (
            <div key={acc.key} className="p-3.5 border ds-divider ds-surface-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={acc.iconSrc} alt={acc.title} className="h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <p className={`text-xs font-semibold ${acc.accent}`}>{acc.title}</p>
                  <p className="text-[11px] ds-muted truncate mt-0.5">{acc.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`badge text-[10px] ${
                    acc.connected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-500/10 ds-muted ds-divider'
                  }`}
                >
                  {acc.connected ? <CheckCircle2 className="h-3 w-3" /> : null}
                  {acc.connected ? 'Conectado' : 'Pendente'}
                </span>
                {acc.connected && (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(acc.key)}
                    title="Desconectar"
                    className="btn btn-ghost btn-icon h-7 w-7 text-rose-400"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Escolha do Fluxo de Autenticação */}
        <div className="space-y-2">
          <label className="label">Fluxo de Autenticação Meta</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {AUTH_OPTIONS.map((opt) => {
              const selected = authMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAuthMode(opt.id)}
                  className={`text-left p-3.5 border transition-colors ${
                    selected
                      ? 'border-brand bg-brand/10'
                      : 'ds-divider ds-surface-2 hover:border-[rgb(var(--border-strong))]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold">{opt.title}</span>
                    <span className="font-mono text-[10px] ds-subtle">{opt.host}</span>
                  </div>
                  <p className="text-[11px] ds-muted mt-1 leading-relaxed">{opt.desc}</p>
                  <p className="font-mono text-[10px] text-brand/90 mt-1.5 truncate">{opt.scopes}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Credenciais da App Meta (para OAuth) */}
        {authMode !== 'manual_token' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Meta App ID</label>
              <input
                className="input font-mono text-xs"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Ex.: 123456789012345"
              />
            </div>
            <div>
              <label className="label">Meta App Secret</label>
              <input
                type="password"
                className="input font-mono text-xs"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="label">Redirect URI (OAuth Callback)</label>
              <input
                className="input font-mono text-xs"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border ds-divider ds-surface-2">
            <div>
              <label className="label">Facebook Page ID</label>
              <input className="input font-mono text-xs" value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="Ex.: 10482910..." />
            </div>
            <div>
              <label className="label">Nome da Página</label>
              <input className="input text-xs" value={pageName} onChange={(e) => setPageName(e.target.value)} placeholder="JOGIMIL Tecnologias" />
            </div>
            <div>
              <label className="label">Page Access Token</label>
              <input type="password" className="input font-mono text-xs" value={pageAccessToken} onChange={(e) => setPageAccessToken(e.target.value)} placeholder="EAAG..." />
            </div>
            <div>
              <label className="label">Instagram Business User ID</label>
              <input className="input font-mono text-xs" value={igUserId} onChange={(e) => setIgUserId(e.target.value)} placeholder="17841400..." />
            </div>
            <div>
              <label className="label">Username Instagram</label>
              <input className="input text-xs" value={igUsername} onChange={(e) => setIgUsername(e.target.value)} placeholder="jogimil.ao" />
            </div>
            <div>
              <label className="label">Instagram Token (se direto)</label>
              <input type="password" className="input font-mono text-xs" value={igAccessToken} onChange={(e) => setIgAccessToken(e.target.value)} placeholder="Opcional no login unificado" />
            </div>
            <div>
              <label className="label">Threads User ID (opcional)</label>
              <input className="input font-mono text-xs" value={threadsUserId} onChange={(e) => setThreadsUserId(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Threads Access Token (opcional)</label>
              <input type="password" className="input font-mono text-xs" value={threadsAccessToken} onChange={(e) => setThreadsAccessToken(e.target.value)} />
            </div>
          </div>
        )}

        {/* Webhook Meta para Mensagens em Tempo Real (Messenger + IG Direct) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 border ds-divider ds-surface-2">
          <div>
            <label className="label">Webhook URL (colar no Meta for Developers)</label>
            <div className="flex gap-1.5">
              <input readOnly className="input font-mono text-xs flex-1" value={webhookUrl} />
              <button type="button" onClick={() => copyText(webhookUrl, 'Webhook URL')} className="btn btn-secondary btn-sm">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label className="label">Verify Token (hub.verify_token)</label>
            <div className="flex gap-1.5">
              <input className="input font-mono text-xs flex-1" value={verifyToken} onChange={(e) => setVerifyToken(e.target.value)} />
              <button type="button" onClick={() => copyText(verifyToken, 'Verify Token')} className="btn btn-secondary btn-sm">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra de ações */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t ds-divider">
          <div className="inline-flex items-center gap-1.5 text-[11px] ds-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Eventos assinados: <code className="font-mono">messages</code> · <code className="font-mono">messaging_postbacks</code> · Tag <code className="font-mono">HUMAN_AGENT</code> ativa</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {authMode !== 'manual_token' && (
              <button
                type="button"
                disabled={authorizing || !appId.trim()}
                onClick={() => handleStartOAuth(authMode)}
                className="btn btn-secondary"
              >
                {authorizing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4 text-brand" />}
                <span>
                  {authMode === 'instagram_direct'
                    ? 'Conectar via Instagram Login'
                    : authMode === 'threads'
                    ? 'Conectar via Threads OAuth'
                    : 'Conectar com Facebook Login'}
                </span>
              </button>
            )}
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Guardar Credenciais Meta</span>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
