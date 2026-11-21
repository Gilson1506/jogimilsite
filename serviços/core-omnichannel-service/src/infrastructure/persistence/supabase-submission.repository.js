import { ISubmissionRepository } from '../../application/ports/submission-repository.port.js';

export class SupabaseSubmissionRepository extends ISubmissionRepository {
  constructor(supabase) {
    super();
    this.supabase = supabase;
  }

  async save(submissionEntity) {
    const json = typeof submissionEntity.toJSON === 'function' ? submissionEntity.toJSON() : submissionEntity;
    const row = {
      id: json.id,
      form_type: String(json.formType || 'contacto'),
      form_title: json.formTitle || 'Formulário do Portal',
      client_name: json.clientName || null,
      client_email: json.clientEmail || null,
      client_phone: json.clientPhone || null,
      source: json.source || null,
      status: json.status || 'RECEIVED',
      correlation_id: json.correlationId || null,
      data: json.data || {},
      metadata: json.metadata || {},
      created_at: json.createdAt || new Date().toISOString(),
    };

    const { error } = await this.supabase.from('form_submissions').upsert(row, { onConflict: 'id' });
    if (error) throw new Error(`[SupabaseSubmissionRepository.save] ${error.message}`);
    return json;
  }

  async updateStatus(id, status, metadata = {}) {
    const { error } = await this.supabase
      .from('form_submissions')
      .update({
        status,
        metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw new Error(`[SupabaseSubmissionRepository.updateStatus] ${error.message}`);
  }

  async findRecent(limit = 50) {
    const { data, error } = await this.supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit) || 50);

    if (error) throw new Error(`[SupabaseSubmissionRepository.findRecent] ${error.message}`);

    return (data || []).map((r) => ({
      id: r.id,
      formType: r.form_type,
      formTitle: r.form_title,
      clientName: r.client_name,
      clientEmail: r.client_email,
      clientPhone: r.client_phone,
      source: r.source,
      status: r.status,
      correlationId: r.correlation_id,
      data: r.data || {},
      metadata: r.metadata || {},
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }
}
