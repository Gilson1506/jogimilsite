import { useEffect, useState } from 'react';
import { Contact as ContactIcon, MessageSquare } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { Pagination } from './Pagination';
import { BrandLoader } from './BrandLoader';
import {
  Contact,
  INTERACTION_STATUSES,
  STAGES,
  normalizeContact,
  optionOf,
  relativeTime,
} from '../lib/crm';

interface TickerListProps {
  theme?: 'dark' | 'light';
}

export function TickerList(_props: TickerListProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiFetch<{ success: boolean; contacts?: Record<string, unknown>[] }>(
          '/api/v1/admin/contacts'
        );
        const list = (res.contacts || []).map((c) => normalizeContact(c));
        list.sort((a, b) => b.history.length - a.history.length);
        setContacts(list);
      } catch {
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="ds-card overflow-hidden">
      <div className="ds-card-header">
        <div className="flex items-center gap-2.5">
          <ContactIcon className="h-4 w-4 text-brand" />
          <div>
            <h2 className="ds-title">Contactos Mais Ativos (por Interações)</h2>
            <p className="ds-subtitle">Leads e contactos sincronizados do portal e atendimento</p>
          </div>
        </div>
        <span className="text-xs font-mono ds-muted">{contacts.length} registados</span>
      </div>

      {loading ? (
        <BrandLoader size="md" />
      ) : contacts.length === 0 ? (
        <p className="text-xs ds-muted py-10 text-center">
          Nenhum contacto registado até ao momento.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Contacto</th>
                <th>Empresa</th>
                <th>Etapa</th>
                <th>Estado da Interação</th>
                <th className="text-right">Interações</th>
                <th>Última Interação</th>
                <th>Origem</th>
              </tr>
            </thead>
            <tbody>
              {contacts.slice((page - 1) * pageSize, page * pageSize).map((c) => {
                const st = optionOf(STAGES, c.stage);
                const ist = optionOf(INTERACTION_STATUSES, c.interactionStatus);
                return (
                  <tr key={c.id}>
                    <td>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs ds-muted">{c.email || c.phone || '—'}</p>
                    </td>
                    <td className="ds-muted">{c.company || '—'}</td>
                    <td>
                      <span className={`badge ${st.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ist.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ist.dot}`} />
                        {ist.label}
                      </span>
                    </td>
                    <td className="text-right font-mono font-semibold tabular-nums">
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 ds-muted" />
                        {c.history.length}
                      </span>
                    </td>
                    <td className="ds-muted whitespace-nowrap">{relativeTime(c.lastInteractionAt)}</td>
                    <td className="text-xs ds-muted">{c.source}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={contacts.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
