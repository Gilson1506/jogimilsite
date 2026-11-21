export class SupabaseAdminRepository {
  constructor(supabase) {
    this.supabase = supabase;
    this._missingTables = new Map();
    this._supportMessagesExtendedCols = null;
  }

  _isKnownMissingTable(tableName) {
    const ts = this._missingTables.get(tableName);
    if (!ts) return false;
    if (Date.now() - ts < 60000) return true;
    this._missingTables.delete(tableName);
    return false;
  }

  _markMissingTable(tableName) {
    this._missingTables.set(tableName, Date.now());
  }

  _isMissingColumnError(err) {
    const msg = String(err?.message || '').toLowerCase();
    return (
      err?.code === '42703' ||
      err?.code === 'PGRST204' ||
      /column .* does not exist/i.test(msg) ||
      /could not find the ['"][^'"]+['"] column/i.test(msg)
    );
  }

  _normalizePhone(phone) {
    return String(phone || '').replace(/\D/g, '').slice(-9);
  }

  _normalizeText(str) {
    return String(str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  _contactKeys(c) {
    const keys = [];
    const email = String(c.email || '').trim().toLowerCase();
    const phone = this._normalizePhone(c.phone);
    if (email) keys.push(`email:${email}`);
    if (phone.length >= 9) keys.push(`phone:${phone}`);
    if (!keys.length) {
      const n = this._normalizeText(c.name);
      const co = this._normalizeText(c.company);
      if (n) keys.push(`nc:${n}|${co}`);
    }
    return keys;
  }

  _hasDuplicates(rows) {
    const seen = new Set();
    for (const r of rows) {
      for (const k of this._contactKeys(r)) {
        if (seen.has(k)) return true;
        seen.add(k);
      }
    }
    return false;
  }

  /**
   * Varredura automática de deduplicação na base Supabase.
   * Funde campos em falta, migra todo o histórico de interações para o contacto principal
   * e elimina os registos duplicados.
   */
  async deduplicateContacts() {
    const { data: rows, error } = await this.supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw new Error(`[SupabaseAdminRepository.deduplicateContacts] ${error.message}`);
    if (!rows || rows.length < 2 || !this._hasDuplicates(rows)) {
      return { merged: 0, removed: 0, total: rows?.length || 0 };
    }

    const keyToPrimary = new Map();
    const groups = new Map(); // primaryId -> { primary, duplicates: [] }

    for (const row of rows) {
      const keys = this._contactKeys(row);
      let primaryId = null;
      for (const k of keys) {
        if (keyToPrimary.has(k)) {
          primaryId = keyToPrimary.get(k);
          break;
        }
      }

      if (!primaryId) {
        primaryId = row.id;
        groups.set(primaryId, { primary: row, duplicates: [] });
      } else {
        groups.get(primaryId).duplicates.push(row);
      }

      for (const k of keys) {
        keyToPrimary.set(k, primaryId);
      }
    }

    let merged = 0;
    let removed = 0;

    for (const { primary, duplicates } of groups.values()) {
      if (!duplicates.length) continue;
      merged += 1;

      const patch = {};
      const mergedTags = new Set(Array.isArray(primary.tags) ? primary.tags : []);
      let notes = primary.notes || '';

      for (const dup of duplicates) {
        if (!primary.email && !patch.email && dup.email) patch.email = dup.email;
        if (!primary.phone && !patch.phone && dup.phone) patch.phone = dup.phone;
        if (!primary.company && !patch.company && dup.company) patch.company = dup.company;
        if (!primary.role && !patch.role && dup.role) patch.role = dup.role;
        if (!primary.owner && !patch.owner && dup.owner) patch.owner = dup.owner;
        if (Array.isArray(dup.tags)) dup.tags.forEach((t) => mergedTags.add(t));
        if (dup.notes && !notes.includes(dup.notes)) {
          notes = notes ? `${notes}\n${dup.notes}` : dup.notes;
        }

        // Migrar histórico de interações do duplicado para o contacto principal
        await this.supabase
          .from('contact_interactions')
          .update({ contact_id: primary.id })
          .eq('contact_id', dup.id);

        // Remover duplicado
        await this.supabase.from('contacts').delete().eq('id', dup.id);
        removed += 1;
      }

      if (mergedTags.size > (primary.tags?.length || 0)) {
        patch.tags = Array.from(mergedTags);
      }
      if (notes !== (primary.notes || '')) {
        patch.notes = notes;
      }
      if (Object.keys(patch).length > 0) {
        patch.updated_at = new Date().toISOString();
        await this.supabase.from('contacts').update(patch).eq('id', primary.id);
      }
    }

    return { merged, removed, total: rows.length - removed };
  }

  _mapContactRow(r, interactions = []) {
    const history = (interactions || []).map((m) => ({
      id: m.id,
      channel: m.channel,
      direction: m.direction,
      type: m.type,
      outcome: m.outcome,
      content: m.content,
      author: m.author,
      timestamp: m.created_at,
    }));
    return {
      id: r.id,
      name: r.name,
      email: r.email || '',
      phone: r.phone || '',
      company: r.company || '',
      role: r.role || '',
      stage: r.stage || r.status || 'novo',
      status: r.status || r.stage || 'novo',
      interactionStatus: r.interaction_status || 'sem_contacto',
      priority: r.priority || 'media',
      tags: Array.isArray(r.tags) ? r.tags : [],
      owner: r.owner || '',
      notes: r.notes || '',
      nextFollowUp: r.next_follow_up || null,
      source: r.source || 'Painel Admin',
      lastInteractionAt: r.last_interaction_at || (history.length ? history[history.length - 1].timestamp : null),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      history,
    };
  }

  // --- CONTACTOS & CRM ---
  async getContacts({ skipDedupe = false } = {}) {
    const [{ data: rows, error: e1 }, { data: interactions, error: e2 }] = await Promise.all([
      this.supabase.from('contacts').select('*').order('created_at', { ascending: false }),
      this.supabase.from('contact_interactions').select('*').order('created_at', { ascending: true }),
    ]);
    if (e1) throw new Error(`[SupabaseAdminRepository.getContacts] ${e1.message}`);
    if (e2) throw new Error(`[SupabaseAdminRepository.getContacts.interactions] ${e2.message}`);

    // Varredura automática se detetar duplicados na base
    if (!skipDedupe && rows && this._hasDuplicates(rows)) {
      await this.deduplicateContacts();
      return this.getContacts({ skipDedupe: true });
    }

    const byContact = new Map();
    for (const m of interactions || []) {
      if (!byContact.has(m.contact_id)) byContact.set(m.contact_id, []);
      byContact.get(m.contact_id).push(m);
    }

    return (rows || []).map((r) => this._mapContactRow(r, byContact.get(r.id) || []));
  }

  async _findDuplicateRow({ email, phone, name, company }) {
    const { data: rows } = await this.supabase.from('contacts').select('*');
    if (!rows?.length) return null;
    const keys = new Set(this._contactKeys({ email, phone, name, company }));
    if (!keys.size) return null;
    return rows.find((r) => this._contactKeys(r).some((k) => keys.has(k))) || null;
  }

  async saveContact(contact) {
    const now = new Date().toISOString();
    const existing = contact.id
      ? (await this.supabase.from('contacts').select('*').eq('id', contact.id).maybeSingle()).data
      : await this._findDuplicateRow(contact);

    const id = existing?.id || contact.id || `cont_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const stage = existing?.stage || contact.stage || contact.status || 'novo';

    const row = {
      id,
      name: contact.name || existing?.name || 'Visitante do Portal',
      email: contact.email ?? existing?.email ?? '',
      phone: contact.phone ?? existing?.phone ?? '',
      company: contact.company ?? existing?.company ?? '',
      role: contact.role ?? existing?.role ?? '',
      stage,
      status: stage,
      interaction_status: contact.interactionStatus || existing?.interaction_status || 'sem_contacto',
      priority: contact.priority || existing?.priority || 'media',
      tags: Array.isArray(contact.tags) ? contact.tags : existing?.tags || [],
      owner: contact.owner ?? existing?.owner ?? '',
      notes: contact.notes ?? existing?.notes ?? '',
      next_follow_up: contact.nextFollowUp ?? existing?.next_follow_up ?? null,
      source: existing?.source || contact.source || 'Painel Admin',
      last_interaction_at: contact.history?.length ? now : existing?.last_interaction_at || null,
      updated_at: now,
    };

    const { data, error } = await this.supabase.from('contacts').upsert(row, { onConflict: 'id' }).select().single();
    if (error) throw new Error(`[SupabaseAdminRepository.saveContact] ${error.message}`);

    if (Array.isArray(contact.history) && contact.history.length) {
      const msgRows = contact.history.map((m) => ({
        id: m.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        contact_id: id,
        channel: m.channel || 'portal',
        direction: m.direction || 'inbound',
        type: m.type || 'nota',
        outcome: m.outcome || '',
        content: m.content || '',
        author: m.author || 'Sistema Portal',
        created_at: m.timestamp || now,
      }));
      await this.supabase.from('contact_interactions').upsert(msgRows, { onConflict: 'id' });
    }

    const { data: history } = await this.supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: true });

    return this._mapContactRow(data, history || []);
  }

  async updateContact(contactId, patch = {}) {
    const update = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.email !== undefined) update.email = patch.email;
    if (patch.phone !== undefined) update.phone = patch.phone;
    if (patch.company !== undefined) update.company = patch.company;
    if (patch.role !== undefined) update.role = patch.role;
    if (patch.stage !== undefined) {
      update.stage = patch.stage;
      update.status = patch.stage;
    }
    if (patch.interactionStatus !== undefined) update.interaction_status = patch.interactionStatus;
    if (patch.priority !== undefined) update.priority = patch.priority;
    if (patch.tags !== undefined) update.tags = Array.isArray(patch.tags) ? patch.tags : [];
    if (patch.owner !== undefined) update.owner = patch.owner;
    if (patch.notes !== undefined) update.notes = patch.notes;
    if (patch.nextFollowUp !== undefined) update.next_follow_up = patch.nextFollowUp || null;
    if (patch.source !== undefined) update.source = patch.source;

    const { data, error } = await this.supabase
      .from('contacts')
      .update(update)
      .eq('id', contactId)
      .select()
      .maybeSingle();

    if (error) throw new Error(`[SupabaseAdminRepository.updateContact] ${error.message}`);
    if (!data) throw new Error('Contacto não encontrado');

    const { data: history } = await this.supabase
      .from('contact_interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: true });

    return this._mapContactRow(data, history || []);
  }

  async updateContactStatus(contactId, status) {
    return this.updateContact(contactId, { stage: status });
  }

  async deleteContact(contactId) {
    const { error } = await this.supabase.from('contacts').delete().eq('id', contactId);
    if (error) throw new Error(`[SupabaseAdminRepository.deleteContact] ${error.message}`);
    return { deleted: 1 };
  }

  async importContacts(rows = [], { source = 'Importação Excel', updateExisting = true } = {}) {
    const result = { created: 0, updated: 0, skipped: 0, duplicatesAvoided: 0, errors: [] };

    // Carregar índice completo em memória para deteção 100% precisa (ignora espaços/traços/+244 e duplicados dentro do próprio ficheiro)
    const { data: existingRows } = await this.supabase.from('contacts').select('*');
    const keyIndex = new Map();
    for (const r of existingRows || []) {
      for (const k of this._contactKeys(r)) {
        if (!keyIndex.has(k)) keyIndex.set(k, r);
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row.name || '').trim();
      const email = String(row.email || '').trim();
      const phone = String(row.phone || '').trim();
      const company = String(row.company || '').trim();

      if (!name && !email && !phone) {
        result.skipped += 1;
        continue;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        result.errors.push({ row: i + 2, message: `Email inválido: ${email}` });
      }

      const candidate = { name: name || email || phone, email, phone, company };
      const keys = this._contactKeys(candidate);
      let existing = null;
      for (const k of keys) {
        if (keyIndex.has(k)) {
          existing = keyIndex.get(k);
          break;
        }
      }

      const tags = row.tags
        ? String(row.tags).split(/[,;]/).map((t) => t.trim()).filter(Boolean)
        : undefined;

      if (existing) {
        result.duplicatesAvoided += 1;
        if (!updateExisting) {
          result.skipped += 1;
          continue;
        }
        const patch = {};
        if (name && !existing.name) patch.name = name;
        if (email && !existing.email) patch.email = email;
        if (phone && !existing.phone) patch.phone = phone;
        if (company && !existing.company) patch.company = company;
        if (row.role && !existing.role) patch.role = String(row.role).trim();
        if (row.stage) patch.stage = row.stage;
        if (row.priority) patch.priority = row.priority;
        if (row.notes) patch.notes = String(row.notes).trim();
        if (tags?.length) patch.tags = Array.from(new Set([...(existing.tags || []), ...tags]));

        if (Object.keys(patch).length > 0) {
          const updated = await this.updateContact(existing.id, patch);
          for (const k of this._contactKeys(updated)) keyIndex.set(k, updated);
          result.updated += 1;
        } else {
          result.skipped += 1;
        }
      } else {
        const created = await this.saveContact({
          name: name || email || phone,
          email,
          phone,
          company,
          role: String(row.role || '').trim(),
          stage: row.stage || 'novo',
          priority: row.priority || 'media',
          notes: String(row.notes || '').trim(),
          tags: tags || [],
          source: row.source || source,
        });
        for (const k of this._contactKeys(created)) keyIndex.set(k, created);
        result.created += 1;
      }
    }

    const { count } = await this.supabase.from('contacts').select('*', { count: 'exact', head: true });
    return { ...result, total: count || 0 };
  }

  async addContactMessage(contactId, message) {
    const now = new Date().toISOString();
    const row = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      contact_id: contactId,
      channel: message.channel || 'whatsapp',
      direction: message.direction || 'outbound',
      type: message.type || 'nota',
      outcome: message.outcome || '',
      content: message.content,
      author: message.author || 'Equipa JOGIMIL',
      created_at: now,
    };

    const { error } = await this.supabase.from('contact_interactions').insert(row);
    if (error) throw new Error(`[SupabaseAdminRepository.addContactMessage] ${error.message}`);

    const contactPatch = { last_interaction_at: now, updated_at: now };
    if (message.interactionStatus) contactPatch.interaction_status = message.interactionStatus;
    if (message.stage) {
      contactPatch.stage = message.stage;
      contactPatch.status = message.stage;
    }
    if (message.nextFollowUp !== undefined) contactPatch.next_follow_up = message.nextFollowUp || null;
    if (row.direction === 'inbound' && !message.interactionStatus) {
      contactPatch.interaction_status = 'por_responder';
    }

    await this.supabase.from('contacts').update(contactPatch).eq('id', contactId);
    return { ...row, timestamp: now };
  }

  // --- LEMBRETES ---
  async getReminders() {
    const { data, error } = await this.supabase.from('reminders').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      dueDate: r.due_date,
      notifyPhone: r.notify_phone,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  async saveReminder(reminder) {
    const row = {
      id: reminder.id || `rem_${Date.now()}`,
      title: reminder.title,
      description: reminder.description || '',
      due_date: reminder.dueDate || null,
      notify_phone: reminder.notifyPhone || '',
      status: reminder.status || 'pending',
    };
    const { data, error } = await this.supabase.from('reminders').upsert(row).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async updateReminderStatus(id, status) {
    const { data, error } = await this.supabase.from('reminders').update({ status }).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteReminder(id) {
    await this.supabase.from('reminders').delete().eq('id', id);
  }

  // --- NOTÍCIAS ---
  async getNews() {
    const { data, error } = await this.supabase.from('news_posts').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async saveNews(item) {
    const slug =
      item.slug ||
      String(item.title || 'noticia')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`;
    const normalizedContent =
      typeof item.content === 'string' && item.content.trim()
        ? item.content
        : Array.isArray(item.body)
        ? item.body.join('\n\n')
        : typeof item.body === 'string'
        ? item.body
        : item.excerpt || '';
    const row = {
      slug,
      title: item.title,
      category: item.category || item.tag || 'Tecnologia',
      date: item.date || new Date().toISOString().slice(0, 10),
      excerpt: item.excerpt || item.summary || '',
      content: normalizedContent,
      image: item.image || '',
      author: item.author || 'Equipa JOGIMIL',
      published: item.published !== false,
    };
    const { data, error } = await this.supabase.from('news_posts').upsert(row, { onConflict: 'slug' }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteNews(slug) {
    await this.supabase.from('news_posts').delete().eq('slug', slug);
  }

  // --- EQUIPA ---
  async _readTeamMetaMap() {
    const { data, error } = await this.supabase
      .from('system_settings')
      .select('config')
      .eq('id', 'workspace_team_meta')
      .maybeSingle();
    if (error || !data || !data.config || typeof data.config !== 'object') return {};
    return data.config;
  }

  async _writeTeamMetaMap(metaMap) {
    await this.supabase.from('system_settings').upsert({
      id: 'workspace_team_meta',
      config: metaMap || {},
      updated_at: new Date().toISOString(),
    });
  }

  async getTeam() {
    const [{ data, error }, metaMap] = await Promise.all([
      this.supabase.from('team_members').select('*').order('sort_order', { ascending: true }),
      this._readTeamMetaMap(),
    ]);
    if (error) throw new Error(error.message);
    return (data || []).map((m) => {
      const meta = metaMap[m.id] || {};
      return {
        ...m,
        phone: meta.phone || m.phone || '',
        whatsapp: meta.whatsapp || meta.phone || m.whatsapp || '',
      };
    });
  }

  async saveTeamMember(member) {
    const id = member.id || `team_${Date.now()}`;
    const row = {
      id,
      name: member.name,
      role: member.role,
      department: member.department || 'Engenharia',
      bio: member.bio || '',
      photo: member.photo || '',
      email: member.email || '',
      linkedin: member.linkedin || '',
      sort_order: Number(member.sortOrder || member.sort_order || 0),
    };
    const { data, error } = await this.supabase.from('team_members').upsert(row).select().single();
    if (error) throw new Error(error.message);

    const phone = String(member.phone || '').trim();
    const whatsapp = String(member.whatsapp || member.phone || '').trim();
    try {
      const metaMap = await this._readTeamMetaMap();
      metaMap[id] = { phone, whatsapp };
      await this._writeTeamMetaMap(metaMap);
    } catch {
      /* non-fatal */
    }

    return { ...data, phone, whatsapp };
  }

  async deleteTeamMember(id) {
    await this.supabase.from('team_members').delete().eq('id', id);
    try {
      const metaMap = await this._readTeamMetaMap();
      if (metaMap[id]) {
        delete metaMap[id];
        await this._writeTeamMetaMap(metaMap);
      }
    } catch {
      /* non-fatal */
    }
  }

  // --- PORTFÓLIO ---
  async getPortfolio() {
    const { data, error } = await this.supabase.from('portfolio_items').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  async savePortfolioItem(item) {
    const slug =
      item.slug ||
      String(item.title || 'projeto')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`;
    const row = {
      slug,
      title: item.title,
      client: item.client || '',
      category: item.category || 'Software',
      description: item.description || '',
      image: item.image || '',
      metrics: item.metrics || '',
      tags: Array.isArray(item.tags) ? item.tags : [],
      link: item.link || '',
    };
    const { data, error } = await this.supabase.from('portfolio_items').upsert(row, { onConflict: 'slug' }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deletePortfolioItem(slug) {
    await this.supabase.from('portfolio_items').delete().eq('slug', slug);
  }

  // --- PRODUTOS DO PORTAL (armazenados em system_settings id='workspace_products') ---
  async getProducts() {
    const { data } = await this.supabase
      .from('system_settings')
      .select('config')
      .eq('id', 'workspace_products')
      .maybeSingle();
    const list = Array.isArray(data?.config?.items) ? data.config.items : [];
    return list;
  }

  async saveProduct(item) {
    const list = await this.getProducts();
    const slug =
      item.slug ||
      String(item.name || 'produto')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${Date.now().toString(36)}`;

    const fullDescription = Array.isArray(item.fullDescription)
      ? item.fullDescription.map((p) => String(p).trim()).filter(Boolean)
      : typeof item.fullDescription === 'string'
      ? item.fullDescription.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean)
      : item.description
      ? [String(item.description).trim()]
      : [];

    const features = Array.isArray(item.features)
      ? item.features.map((f) => String(f).trim()).filter(Boolean)
      : typeof item.features === 'string'
      ? item.features.split(/\n/).map((f) => f.trim()).filter(Boolean)
      : [];

    const gallery = Array.isArray(item.gallery)
      ? item.gallery.map((g) => String(g || '').trim()).filter(Boolean).slice(0, 5)
      : [];
    const primaryImage = String(item.image || '').trim() || gallery[0] || '';
    const mergedGallery = primaryImage
      ? [primaryImage, ...gallery.filter((g) => g !== primaryImage)].slice(0, 5)
      : gallery;

    const record = {
      slug,
      name: String(item.name || '').trim(),
      category: String(item.category || 'Software & ERP').trim(),
      tag: String(item.tag || 'JOGIMIL').trim(),
      tagline: String(item.tagline || item.description || '').trim(),
      description: String(item.description || '').trim(),
      fullDescription,
      features,
      image: primaryImage,
      gallery: mergedGallery,
      pdfUrl: String(item.pdfUrl || '').trim(),
      priceStarting: String(item.priceStarting || item.starterPriceValue || 'Sob consulta').trim(),
      starterPriceValue: String(item.starterPriceValue || item.priceStarting || 'Sob consulta').trim(),
      starterPeriod: String(item.starterPeriod || '/mês').trim(),
      published: item.published !== false,
      updatedAt: new Date().toISOString(),
    };

    const idx = list.findIndex((p) => p.slug === slug);
    if (idx >= 0) list[idx] = { ...list[idx], ...record };
    else list.unshift({ ...record, createdAt: new Date().toISOString() });

    await this.supabase.from('system_settings').upsert({
      id: 'workspace_products',
      config: { items: list },
      updated_at: new Date().toISOString(),
    });
    return record;
  }

  async deleteProduct(slug) {
    const list = await this.getProducts();
    const next = list.filter((p) => p.slug !== slug);
    await this.supabase.from('system_settings').upsert({
      id: 'workspace_products',
      config: { items: next },
      updated_at: new Date().toISOString(),
    });
  }

  // --- DEFINIÇÕES ---
  async getSettings() {
    const { data } = await this.supabase.from('system_settings').select('config').eq('id', 'default').maybeSingle();
    return data?.config || {};
  }

  async saveSettings(settings) {
    const { data, error } = await this.supabase
      .from('system_settings')
      .upsert({ id: 'default', config: settings || {}, updated_at: new Date().toISOString() })
      .select('config')
      .single();
    if (error) throw new Error(error.message);
    return data?.config || {};
  }

  // --- SUPORTE / ATENDIMENTO ---
  async _readSupportMessageMetaMap() {
    const { data, error } = await this.supabase
      .from('system_settings')
      .select('config')
      .eq('id', 'workspace_support_message_meta')
      .maybeSingle();
    if (error) return {};
    const meta = data?.config?.meta;
    return meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {};
  }

  async _writeSupportMessageMetaMap(meta) {
    const entries = Object.entries(meta || {});
    const trimmed = entries.length > 1000 ? Object.fromEntries(entries.slice(-1000)) : meta || {};
    const { error } = await this.supabase
      .from('system_settings')
      .upsert({ id: 'workspace_support_message_meta', config: { meta: trimmed } }, { onConflict: 'id' });
    if (error) throw new Error(`[SupabaseAdminRepository._writeSupportMessageMetaMap] ${error.message}`);
  }

  async getSupportTickets() {
    const [{ data: tickets, error: e1 }, { data: messages, error: e2 }, metaMap] = await Promise.all([
      this.supabase.from('support_tickets').select('*').order('updated_at', { ascending: false }),
      this.supabase.from('support_messages').select('*').order('created_at', { ascending: true }),
      this._readSupportMessageMetaMap().catch(() => ({})),
    ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);

    const byTicket = new Map();
    for (const m of messages || []) {
      if (!byTicket.has(m.ticket_id)) byTicket.set(m.ticket_id, []);
      const meta = metaMap[m.id] || {};
      const resolvedAttachments =
        Array.isArray(m.attachments) && m.attachments.length > 0
          ? m.attachments
          : Array.isArray(meta.attachments)
          ? meta.attachments
          : [];
      byTicket.get(m.ticket_id).push({
        id: m.id,
        sender: m.sender,
        channel: m.channel,
        subject: m.subject || meta.subject || undefined,
        content: m.content,
        html: meta.html || undefined,
        attachments: resolvedAttachments,
        timestamp: m.created_at,
      });
    }

    return (tickets || []).map((t) => ({
      id: t.id,
      clientName: t.client_name,
      clientContact: t.client_contact,
      clientEmail: t.client_email,
      channel: t.channel,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      submissionId: t.submission_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      messages: byTicket.get(t.id) || [],
    }));
  }

  async getSupportTicketById(ticketId) {
    const { data: t, error } = await this.supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!t) return null;
    return {
      id: t.id,
      clientName: t.client_name,
      clientContact: t.client_contact,
      clientEmail: t.client_email,
      channel: t.channel,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      submissionId: t.submission_id,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    };
  }

  async createSupportTicket(ticket) {
    const id = ticket.id || `tkt_${Date.now()}`;
    const row = {
      id,
      client_name: ticket.clientName || 'Visitante do Portal',
      client_contact: ticket.clientContact || '',
      client_email: ticket.clientEmail || '',
      channel: ticket.channel || 'email',
      subject: ticket.subject || 'Novo Pedido do Portal',
      status: ticket.status || 'aberto',
      priority: ticket.priority || 'normal',
      submission_id: ticket.submissionId || null,
    };
    const { error } = await this.supabase.from('support_tickets').insert(row);
    if (error) throw new Error(error.message);

    if (Array.isArray(ticket.messages) && ticket.messages.length) {
      const prepared = ticket.messages.map((m) => ({
        id: m.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        ticket_id: id,
        sender: m.sender || 'client',
        channel: m.channel || 'portal',
        content: m.content || '',
        created_at: m.timestamp || new Date().toISOString(),
        _subject: m.subject ? String(m.subject).trim() : undefined,
        _html: m.html ? String(m.html).slice(0, 120000) : undefined,
        _attachments: Array.isArray(m.attachments) ? m.attachments : [],
      }));
      await this.supabase.from('support_messages').insert(
        prepared.map(({ _subject, _html, _attachments, ...dbRow }) => dbRow)
      );
      const needsMeta = prepared.some((p) => p._subject || p._html || p._attachments.length > 0);
      if (needsMeta) {
        try {
          const metaMap = await this._readSupportMessageMetaMap();
          for (const p of prepared) {
            if (p._subject || p._html || p._attachments.length > 0) {
              metaMap[p.id] = {
                subject: p._subject,
                html: p._html,
                attachments: p._attachments,
              };
            }
          }
          await this._writeSupportMessageMetaMap(metaMap);
        } catch {
          /* non-fatal */
        }
      }
    }
    return { id, ...ticket };
  }

  async updateSupportMessageHtml(msgId, { html, content, subject }) {
    if (!msgId) return;
    const cleanHtml = html ? String(html).slice(0, 120000) : undefined;
    if (content) {
      try {
        await this.supabase.from('support_messages').update({ content }).eq('id', msgId);
      } catch {
        /* non-fatal */
      }
    }
    if (cleanHtml || subject) {
      try {
        const metaMap = await this._readSupportMessageMetaMap();
        metaMap[msgId] = {
          ...(metaMap[msgId] || {}),
          ...(subject ? { subject: String(subject).trim() } : {}),
          ...(cleanHtml ? { html: cleanHtml } : {}),
        };
        await this._writeSupportMessageMetaMap(metaMap);
      } catch {
        /* non-fatal */
      }
    }
  }

  async saveSupportMessage(ticketId, message) {
    const msgId = message.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const subject = message.subject ? String(message.subject).trim() : undefined;
    const sanitizedAttachments = Array.isArray(message.attachments)
      ? message.attachments.map((a) => ({
          name: String(a?.name || 'anexo'),
          type: String(a?.type || 'application/octet-stream'),
          size: Number(a?.size || 0),
          url: String(a?.url || ''),
          digitalFileId: a?.digitalFileId || null,
        }))
      : [];

    const baseRow = {
      id: msgId,
      ticket_id: ticketId,
      sender: message.sender || 'agent',
      channel: message.channel || 'whatsapp',
      content: message.content || '',
      created_at: message.timestamp || new Date().toISOString(),
    };

    let insertedExtended = false;
    if (this._supportMessagesExtendedCols !== false) {
      const { error } = await this.supabase.from('support_messages').insert({
        ...baseRow,
        subject: subject || null,
        attachments: sanitizedAttachments,
      });
      if (!error) {
        this._supportMessagesExtendedCols = true;
        insertedExtended = true;
      } else if (this._isMissingColumnError(error)) {
        this._supportMessagesExtendedCols = false;
      } else {
        throw new Error(error.message);
      }
    }

    const cleanHtml =
      typeof message.html === 'string' && message.html.trim()
        ? message.html.trim().slice(0, 65000)
        : undefined;

    if (!insertedExtended) {
      const { error } = await this.supabase.from('support_messages').insert(baseRow);
      if (error) throw new Error(error.message);
    }

    if ((!insertedExtended && (subject || sanitizedAttachments.length > 0)) || cleanHtml) {
      try {
        const metaMap = await this._readSupportMessageMetaMap();
        metaMap[msgId] = {
          ...(metaMap[msgId] || {}),
          ...(!insertedExtended && subject ? { subject } : {}),
          ...(!insertedExtended && sanitizedAttachments.length > 0 ? { attachments: sanitizedAttachments } : {}),
          ...(cleanHtml ? { html: cleanHtml } : {}),
        };
        await this._writeSupportMessageMetaMap(metaMap);
      } catch {
        // non-blocking fallback metadata
      }
    }

    await this.supabase.from('support_tickets').update({ updated_at: baseRow.created_at }).eq('id', ticketId);
    return {
      ...baseRow,
      subject,
      html: cleanHtml,
      attachments: sanitizedAttachments,
      timestamp: baseRow.created_at,
    };
  }

  async updateTicketStatus(ticketId, status) {
    const { data, error } = await this.supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteSupportTicket(ticketId) {
    try {
      const { data: msgs } = await this.supabase
        .from('support_messages')
        .select('id')
        .eq('ticket_id', ticketId);
      if (Array.isArray(msgs) && msgs.length > 0) {
        const metaMap = await this._readSupportMessageMetaMap();
        let changed = false;
        for (const m of msgs) {
          if (metaMap[m.id]) {
            delete metaMap[m.id];
            changed = true;
          }
        }
        if (changed) await this._writeSupportMessageMetaMap(metaMap);
      }
    } catch {
      // non-blocking metadata cleanup
    }
    await this.supabase.from('support_messages').delete().eq('ticket_id', ticketId);
    const { error } = await this.supabase.from('support_tickets').delete().eq('id', ticketId);
    if (error) throw new Error(error.message);
    return { deleted: 1 };
  }

  async deleteSupportMessage(ticketId, messageId) {
    const { error } = await this.supabase
      .from('support_messages')
      .delete()
      .eq('id', messageId)
      .eq('ticket_id', ticketId);
    if (error) throw new Error(error.message);
    try {
      const metaMap = await this._readSupportMessageMetaMap();
      if (metaMap[messageId]) {
        delete metaMap[messageId];
        await this._writeSupportMessageMetaMap(metaMap);
      }
    } catch {
      // non-blocking metadata cleanup
    }
    return { deleted: 1 };
  }

  // --- DISPARO EM MASSA & CAMPANHAS GUARDADAS ---
  async _readBroadcastReportsMap() {
    const items = await this._readJsonCollection('workspace_broadcast_reports').catch(() => []);
    const map = {};
    for (const entry of items) {
      if (entry?.id) map[entry.id] = entry;
    }
    return map;
  }

  async _saveBroadcastReport(id, meta) {
    try {
      const items = await this._readJsonCollection('workspace_broadcast_reports').catch(() => []);
      const filtered = items.filter((item) => item?.id !== id);
      filtered.unshift({ id, ...meta, savedAt: new Date().toISOString() });
      await this._writeJsonCollection('workspace_broadcast_reports', filtered.slice(0, 100));
    } catch {
      // non-blocking metadata storage
    }
  }

  async getBroadcasts() {
    const [{ data, error }, reportsMap] = await Promise.all([
      this.supabase.from('broadcasts').select('*').order('created_at', { ascending: false }),
      this._readBroadcastReportsMap(),
    ]);
    if (error) throw new Error(error.message);
    return (data || []).map((b) => {
      const meta = reportsMap[b.id] || {};
      return {
        id: b.id,
        title: b.title,
        channels: b.channels || [],
        audience: b.audience,
        totalRecipients: Number(b.total_recipients || 0),
        sentCount: Number(b.sent_count || 0),
        deliveredCount: Number(b.delivered_count || 0),
        failedCount: Number(b.failed_count || 0),
        skippedCount: Number(meta.skippedCount || 0),
        subject: b.subject || '',
        message: b.message || '',
        attachments: Array.isArray(meta.attachments) ? meta.attachments : [],
        deliveries: Array.isArray(meta.deliveries) ? meta.deliveries : [],
        status: b.status || 'completed',
        createdAt: b.created_at,
      };
    });
  }

  async createBroadcastCampaign(b) {
    return this.saveBroadcast(b);
  }

  async saveBroadcast(b) {
    const id = b.id || `bc_${Date.now()}`;
    const row = {
      id,
      title: b.title,
      channels: Array.isArray(b.channels) ? b.channels : [],
      audience: b.audience || 'Todos',
      total_recipients: Number(b.totalRecipients || 0),
      sent_count: Number(b.sentCount || 0),
      delivered_count: Number(b.deliveredCount || 0),
      failed_count: Number(b.failedCount || 0),
      subject: b.subject || '',
      message: b.message || '',
      status: b.status || 'completed',
    };
    const { data, error } = await this.supabase.from('broadcasts').insert(row).select().single();
    if (error) throw new Error(error.message);

    const skippedCount = Number(b.skippedCount || 0);
    const attachments = Array.isArray(b.attachments) ? b.attachments : [];
    const deliveries = Array.isArray(b.deliveries) ? b.deliveries : [];

    await this._saveBroadcastReport(id, { skippedCount, attachments, deliveries });

    return {
      id: data.id,
      title: data.title,
      channels: data.channels || [],
      audience: data.audience,
      totalRecipients: Number(data.total_recipients || 0),
      sentCount: Number(data.sent_count || 0),
      deliveredCount: Number(data.delivered_count || 0),
      failedCount: Number(data.failed_count || 0),
      skippedCount,
      subject: data.subject || '',
      message: data.message || '',
      attachments,
      deliveries,
      status: data.status || 'completed',
      createdAt: data.created_at,
    };
  }

  async getSavedCampaigns() {
    const items = await this._readJsonCollection('workspace_saved_campaigns').catch(() => []);
    return items.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()
    );
  }

  async createSavedCampaign(payload) {
    const list = await this.getSavedCampaigns();
    const now = new Date().toISOString();
    const record = {
      id: payload.id || `cmp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: String(payload.title || 'Nova Campanha').trim(),
      channels: Array.isArray(payload.channels) && payload.channels.length > 0 ? payload.channels : ['email'],
      subject: String(payload.subject || '').trim(),
      message: String(payload.message || ''),
      html: String(payload.html || ''),
      templateName: payload.templateName || null,
      attachments: Array.isArray(payload.attachments)
        ? payload.attachments.map((a) => ({
            name: String(a?.name || 'anexo'),
            type: String(a?.type || 'application/octet-stream'),
            size: Number(a?.size || 0),
            url: String(a?.url || ''),
            digitalFileId: a?.digitalFileId || null,
          }))
        : [],
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(record);
    await this._writeJsonCollection('workspace_saved_campaigns', list);
    return record;
  }

  async updateSavedCampaign(id, patch) {
    const list = await this.getSavedCampaigns();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Campanha guardada não encontrada.');
    const next = {
      ...list[idx],
      ...(patch.title !== undefined ? { title: String(patch.title).trim() } : {}),
      ...(Array.isArray(patch.channels) ? { channels: patch.channels } : {}),
      ...(patch.subject !== undefined ? { subject: String(patch.subject).trim() } : {}),
      ...(patch.message !== undefined ? { message: String(patch.message) } : {}),
      ...(patch.html !== undefined ? { html: String(patch.html) } : {}),
      ...(patch.templateName !== undefined ? { templateName: patch.templateName || null } : {}),
      ...(Array.isArray(patch.attachments)
        ? {
            attachments: patch.attachments.map((a) => ({
              name: String(a?.name || 'anexo'),
              type: String(a?.type || 'application/octet-stream'),
              size: Number(a?.size || 0),
              url: String(a?.url || ''),
              digitalFileId: a?.digitalFileId || null,
            })),
          }
        : {}),
      id,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = next;
    await this._writeJsonCollection('workspace_saved_campaigns', list);
    return next;
  }

  async deleteSavedCampaign(id) {
    const list = await this.getSavedCampaigns();
    await this._writeJsonCollection(
      'workspace_saved_campaigns',
      list.filter((c) => c.id !== id)
    );
    return true;
  }

  async getScheduledBroadcasts() {
    const items = await this._readJsonCollection('workspace_scheduled_broadcasts').catch(() => []);
    return items.sort(
      (a, b) => new Date(a.scheduledAt || a.createdAt || 0).getTime() - new Date(b.scheduledAt || b.createdAt || 0).getTime()
    );
  }

  async createScheduledBroadcast(payload) {
    const list = await this.getScheduledBroadcasts();
    const now = new Date().toISOString();
    const record = {
      id: payload.id || `sbc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: String(payload.title || 'Campanha Agendada').trim(),
      channels: Array.isArray(payload.channels) ? payload.channels : ['email'],
      audience: String(payload.audience || 'Todos os Contactos'),
      recipients: Array.isArray(payload.recipients) ? payload.recipients : [],
      totalRecipients: Number(payload.totalRecipients || (payload.recipients || []).length || 0),
      subject: String(payload.subject || '').trim(),
      message: String(payload.message || ''),
      html: String(payload.html || ''),
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
      scheduledAt: payload.scheduledAt,
      status: 'pending',
      broadcastId: null,
      deliveredCount: 0,
      failedCount: 0,
      skippedCount: 0,
      error: '',
      syncToCalendar: Boolean(payload.syncToCalendar),
      calendarEventId: payload.calendarEventId || null,
      syncToTask: Boolean(payload.syncToTask),
      taskId: payload.taskId || null,
      createdAt: now,
      sentAt: null,
    };
    list.unshift(record);
    await this._writeJsonCollection('workspace_scheduled_broadcasts', list);
    return record;
  }

  async updateScheduledBroadcast(id, patch) {
    const list = await this.getScheduledBroadcasts();
    const idx = list.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Campanha agendada não encontrada.');
    list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
    await this._writeJsonCollection('workspace_scheduled_broadcasts', list);
    return list[idx];
  }

  async deleteScheduledBroadcast(id) {
    const list = await this.getScheduledBroadcasts();
    await this._writeJsonCollection(
      'workspace_scheduled_broadcasts',
      list.filter((i) => i.id !== id)
    );
    return true;
  }

  // --- MULTI-UTILIZADORES (RBAC) & ACL DE SEPARAÇÃO DE DADOS ---
  _defaultAdminUser() {
    const now = new Date().toISOString();
    return {
      id: 'usr_admin_root',
      name: 'Joel Gaspar',
      email: 'admin@jogimiltecnologias.it.ao',
      passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // sha256('admin123')
      role: 'admin',
      jobTitle: 'Administrador Executivo',
      whatsapp: '244942775559',
      notifyWhatsapp: true,
      active: true,
      permissions: ['*'],
      createdAt: now,
      updatedAt: now,
    };
  }

  async getUsers() {
    let list = await this._readJsonCollection('workspace_users').catch(() => []);
    if (!Array.isArray(list) || list.length === 0) {
      list = [this._defaultAdminUser()];
      await this._writeJsonCollection('workspace_users', list).catch(() => {});
    }
    return list;
  }

  async getUserById(id) {
    const list = await this.getUsers();
    return list.find((u) => u.id === id) || null;
  }

  async getUserByEmail(email) {
    const clean = String(email || '').trim().toLowerCase();
    const list = await this.getUsers();
    return list.find((u) => String(u.email || '').trim().toLowerCase() === clean) || null;
  }

  async createUser(payload) {
    const list = await this.getUsers();
    const cleanEmail = String(payload.email || '').trim().toLowerCase();
    if (list.some((u) => String(u.email || '').trim().toLowerCase() === cleanEmail)) {
      throw new Error('Já existe um utilizador registado com este endereço de email.');
    }
    const now = new Date().toISOString();
    const record = {
      id: payload.id || `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: String(payload.name || '').trim(),
      email: cleanEmail,
      passwordHash: payload.passwordHash,
      role: payload.role || 'agente',
      jobTitle: String(payload.jobTitle || '').trim(),
      whatsapp: String(payload.whatsapp || '').trim(),
      avatarUrl: String(payload.avatarUrl || '').trim(),
      notifyWhatsapp: payload.notifyWhatsapp !== false,
      active: payload.active !== false,
      permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
      createdAt: now,
      updatedAt: now,
    };
    list.push(record);
    await this._writeJsonCollection('workspace_users', list);
    return record;
  }

  async updateUser(id, patch) {
    const list = await this.getUsers();
    const idx = list.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Utilizador não encontrado.');
    const next = {
      ...list[idx],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    list[idx] = next;
    await this._writeJsonCollection('workspace_users', list);
    return next;
  }

  async deleteUser(id) {
    if (id === 'usr_admin_root') {
      throw new Error('O Administrador Principal não pode ser eliminado.');
    }
    const list = await this.getUsers();
    await this._writeJsonCollection(
      'workspace_users',
      list.filter((u) => u.id !== id)
    );
    return true;
  }

  async getContactAclMap() {
    const items = await this._readJsonCollection('workspace_contact_acl').catch(() => []);
    const map = {};
    for (const item of items) {
      if (item?.id) map[item.id] = item;
    }
    return map;
  }

  async setContactAcl(contactId, acl) {
    const items = await this._readJsonCollection('workspace_contact_acl').catch(() => []);
    const filtered = items.filter((i) => i?.id !== contactId);
    const entry = {
      id: contactId,
      ownerId: acl.ownerId || 'usr_admin_root',
      ownerName: acl.ownerName || 'Joel Gaspar',
      sharedWith: Array.isArray(acl.sharedWith) ? Array.from(new Set(acl.sharedWith.filter(Boolean))) : [],
      updatedAt: new Date().toISOString(),
    };
    filtered.unshift(entry);
    await this._writeJsonCollection('workspace_contact_acl', filtered);
    return entry;
  }

  async getTicketAclMap() {
    const items = await this._readJsonCollection('workspace_ticket_acl').catch(() => []);
    const map = {};
    for (const item of items) {
      if (item?.id) map[item.id] = item;
    }
    return map;
  }

  async setTicketAcl(ticketId, acl) {
    const items = await this._readJsonCollection('workspace_ticket_acl').catch(() => []);
    const filtered = items.filter((i) => i?.id !== ticketId);
    const entry = {
      id: ticketId,
      ownerId: acl.ownerId || 'usr_admin_root',
      ownerName: acl.ownerName || 'Joel Gaspar',
      assignedTo: acl.assignedTo || null,
      assignedToName: acl.assignedToName || '',
      sharedWith: Array.isArray(acl.sharedWith) ? Array.from(new Set(acl.sharedWith.filter(Boolean))) : [],
      updatedAt: new Date().toISOString(),
    };
    filtered.unshift(entry);
    await this._writeJsonCollection('workspace_ticket_acl', filtered);
    return entry;
  }

  // --- COMUNICAÇÃO INTERNA (CHAT CORPORATIVO ENTRE UTILIZADORES) ---
  async getInternalMessages() {
    const items = await this._readJsonCollection('workspace_internal_messages').catch(() => []);
    return items.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
  }

  async createInternalMessage(payload) {
    const list = await this.getInternalMessages();
    const record = {
      id: payload.id || `im_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      channel: payload.channel || 'direct', // 'general' | 'direct'
      senderId: payload.senderId,
      senderName: payload.senderName || 'Utilizador',
      senderRole: payload.senderRole || 'agente',
      recipientId: payload.recipientId || null,
      recipientName: payload.recipientName || '',
      content: String(payload.content || '').trim(),
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
      readBy: Array.isArray(payload.readBy) ? payload.readBy : [payload.senderId],
      createdAt: new Date().toISOString(),
    };
    list.push(record);
    // Manter as últimas 500 mensagens internas para performance
    const trimmed = list.slice(-500);
    await this._writeJsonCollection('workspace_internal_messages', trimmed);
    return record;
  }

  async markInternalMessagesRead(readerId, { channel = 'direct', peerId = null } = {}) {
    const list = await this.getInternalMessages();
    let changed = false;
    for (const m of list) {
      const readBy = Array.isArray(m.readBy) ? m.readBy : [];
      if (readBy.includes(readerId)) continue;
      const matchesRoom = channel !== 'direct' && m.channel === channel;
      const matchesDirect =
        channel === 'direct' &&
        m.channel === 'direct' &&
        m.recipientId === readerId &&
        (!peerId || m.senderId === peerId);
      if (matchesRoom || matchesDirect) {
        m.readBy = [...readBy, readerId];
        changed = true;
      }
    }
    if (changed) {
      await this._writeJsonCollection('workspace_internal_messages', list);
    }
    return changed;
  }

  // --- AUDITORIA & LOGS DE AÇÕES DE UTILIZADORES ---
  async getAuditLogs() {
    const items = await this._readJsonCollection('workspace_audit_logs').catch(() => []);
    return items.sort(
      (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
  }

  async appendAuditLog(entry) {
    try {
      const list = await this._readJsonCollection('workspace_audit_logs').catch(() => []);
      const record = {
        id: entry.id || `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: entry.timestamp || new Date().toISOString(),
        userId: entry.userId || 'system',
        userName: entry.userName || 'Sistema',
        userEmail: entry.userEmail || '',
        userRole: entry.userRole || '',
        method: entry.method || 'POST',
        path: entry.path || '',
        module: entry.module || 'Sistema',
        action: entry.action || '',
        summary: entry.summary || '',
        statusCode: Number(entry.statusCode || 200),
        ip: entry.ip || '',
        durationMs: Number(entry.durationMs || 0),
      };
      list.unshift(record);
      await this._writeJsonCollection('workspace_audit_logs', list.slice(0, 1000));
      return record;
    } catch {
      return null;
    }
  }

  // Compatibilidade caso rotas antigas de /crm/deals sejam chamadas
  async getCrmDeals() {
    return [];
  }
  async saveCrmDeal(d) {
    return d;
  }
  async updateDealStage(_id, stage) {
    return { stage };
  }
  async addDealInteraction(_id, i) {
    return i;
  }
  async deleteCrmDeal() {
    return { deleted: 0 };
  }

  // --- SINCRONIZAÇÃO AUTOMÁTICA DE FORMULÁRIOS DO PORTAL ---
  async syncFormSubmission(submission) {
    const data = submission.data || {};
    const name = submission.clientName || data.nome || data.name || 'Visitante do Portal';
    const email = submission.clientEmail || data.email || '';
    const phone = submission.clientPhone || data.telefone || data.phone || data.whatsapp || '';
    const company = data.empresa || data.company || data.organizacao || '';
    const messageText =
      data.mensagem ||
      data.message ||
      data.descricao ||
      data.assunto ||
      data.produto ||
      `${submission.formTitle} submetido no portal.`;

    const formType = String(submission.formType || 'contacto').toLowerCase();
    const isNewsletter = formType.includes('newsletter');

    const contact = await this.saveContact({
      name,
      email,
      phone,
      company,
      stage: 'novo',
      interactionStatus: 'por_responder',
      source: `Portal · ${submission.formTitle || formType}`,
      history: [
        {
          id: `msg_${Date.now()}`,
          channel: 'portal',
          direction: 'inbound',
          content: `[${submission.formTitle}] ${messageText}`,
          timestamp: submission.createdAt || new Date().toISOString(),
        },
      ],
    });

    if (!isNewsletter) {
      await this.createSupportTicket({
        clientName: name,
        clientContact: phone || email || 'Portal Web',
        clientEmail: email,
        channel: phone ? 'whatsapp' : 'email',
        subject: `${submission.formTitle || 'Contacto Portal'}${company ? ` · ${company}` : ''}`,
        status: 'aberto',
        priority: formType.includes('orcamento') || formType.includes('demo') ? 'alta' : 'normal',
        submissionId: submission.id,
        messages: [
          {
            id: `msg_${Date.now()}`,
            sender: 'client',
            content: messageText,
            channel: 'portal',
            timestamp: submission.createdAt || new Date().toISOString(),
          },
        ],
      });
    }

    return { contact };
  }

  // =========================================================================
  // HELPER GENÉRICO: Persistência com fallback transparente em system_settings
  // (Caso o utilizador ainda não tenha corrido o SQL das novas tabelas)
  // =========================================================================
  _isMissingTableError(err) {
    const msg = String(err?.message || '').toLowerCase();
    return (
      err?.code === '42P01' ||
      err?.code === 'PGRST205' ||
      msg.includes('could not find the table') ||
      msg.includes('does not exist')
    );
  }

  async _readJsonCollection(key) {
    const { data, error } = await this.supabase
      .from('system_settings')
      .select('config')
      .eq('id', key)
      .maybeSingle();
    if (error) return [];
    const items = data?.config?.items;
    return Array.isArray(items) ? items : [];
  }

  async _writeJsonCollection(key, items) {
    const { error } = await this.supabase
      .from('system_settings')
      .upsert({ id: key, config: { items } }, { onConflict: 'id' });
    if (error) throw new Error(`[SupabaseAdminRepository._writeJsonCollection(${key})] ${error.message}`);
    return items;
  }

  // =========================================================================
  // CALENDÁRIO CORPORATIVO (Eventos)
  // =========================================================================
  _mapCalendarRow(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      type: row.type || 'reuniao',
      status: row.status || 'agendado',
      priority: row.priority || 'media',
      startAt: row.start_at || row.startAt,
      endAt: row.end_at || row.endAt || row.start_at || row.startAt,
      allDay: Boolean(row.all_day ?? row.allDay),
      location: row.location || '',
      contactId: row.contact_id || row.contactId || null,
      contactName: row.contact_name || row.contactName || '',
      taskId: row.task_id || row.taskId || null,
      owner: row.owner || 'Equipa JOGIMIL',
      source: row.source || 'admin',
      caldavUid: row.caldav_uid || row.caldavUid || '',
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    };
  }

  async getCalendarEvents() {
    if (!this._isKnownMissingTable('calendar_events')) {
      const { data, error } = await this.supabase
        .from('calendar_events')
        .select('*')
        .order('start_at', { ascending: true });
      if (!error) return (data || []).map((r) => this._mapCalendarRow(r));
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.getCalendarEvents] ${error.message}`);
      }
      this._markMissingTable('calendar_events');
    }
    const items = await this._readJsonCollection('workspace_calendar_events');
    return items.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  async createCalendarEvent(payload) {
    const now = new Date().toISOString();
    const ev = {
      id: payload.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: String(payload.title || 'Evento JOGIMIL').trim(),
      description: String(payload.description || '').trim(),
      type: payload.type || 'reuniao',
      status: payload.status || 'agendado',
      priority: payload.priority || 'media',
      startAt: payload.startAt || now,
      endAt: payload.endAt || payload.startAt || now,
      allDay: Boolean(payload.allDay),
      location: String(payload.location || '').trim(),
      contactId: payload.contactId || null,
      contactName: String(payload.contactName || '').trim(),
      taskId: payload.taskId || null,
      owner: String(payload.owner || 'Equipa JOGIMIL').trim(),
      source: payload.source || 'admin',
      caldavUid: payload.caldavUid || '',
      createdAt: now,
      updatedAt: now,
    };

    if (!this._isKnownMissingTable('calendar_events')) {
      const { data, error } = await this.supabase
        .from('calendar_events')
        .insert({
          id: ev.id,
          title: ev.title,
          description: ev.description,
          type: ev.type,
          status: ev.status,
          priority: ev.priority,
          start_at: ev.startAt,
          end_at: ev.endAt,
          all_day: ev.allDay,
          location: ev.location,
          contact_id: ev.contactId,
          contact_name: ev.contactName,
          task_id: ev.taskId,
          owner: ev.owner,
          source: ev.source,
          caldav_uid: ev.caldavUid,
        })
        .select()
        .single();

      if (!error) return this._mapCalendarRow(data);
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.createCalendarEvent] ${error.message}`);
      }
      this._markMissingTable('calendar_events');
    }

    const items = await this._readJsonCollection('workspace_calendar_events');
    items.push(ev);
    await this._writeJsonCollection('workspace_calendar_events', items);
    return ev;
  }

  async updateCalendarEvent(id, patch) {
    const now = new Date().toISOString();
    const dbPatch = {};
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.type !== undefined) dbPatch.type = patch.type;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.startAt !== undefined) dbPatch.start_at = patch.startAt;
    if (patch.endAt !== undefined) dbPatch.end_at = patch.endAt;
    if (patch.allDay !== undefined) dbPatch.all_day = Boolean(patch.allDay);
    if (patch.location !== undefined) dbPatch.location = patch.location;
    if (patch.contactId !== undefined) dbPatch.contact_id = patch.contactId || null;
    if (patch.contactName !== undefined) dbPatch.contact_name = patch.contactName || '';
    if (patch.taskId !== undefined) dbPatch.task_id = patch.taskId || null;
    if (patch.owner !== undefined) dbPatch.owner = patch.owner;
    if (patch.caldavUid !== undefined) dbPatch.caldav_uid = patch.caldavUid;

    if (!this._isKnownMissingTable('calendar_events')) {
      const { data, error } = await this.supabase
        .from('calendar_events')
        .update(dbPatch)
        .eq('id', id)
        .select()
        .single();

      if (!error) return this._mapCalendarRow(data);
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.updateCalendarEvent] ${error.message}`);
      }
      this._markMissingTable('calendar_events');
    }

    const items = await this._readJsonCollection('workspace_calendar_events');
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Evento não encontrado');
    items[idx] = { ...items[idx], ...patch, id, updatedAt: now };
    await this._writeJsonCollection('workspace_calendar_events', items);
    return items[idx];
  }

  async deleteCalendarEvent(id) {
    if (!this._isKnownMissingTable('calendar_events')) {
      const { error } = await this.supabase.from('calendar_events').delete().eq('id', id);
      if (!error) return true;
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.deleteCalendarEvent] ${error.message}`);
      }
      this._markMissingTable('calendar_events');
    }
    const items = await this._readJsonCollection('workspace_calendar_events');
    await this._writeJsonCollection(
      'workspace_calendar_events',
      items.filter((i) => i.id !== id)
    );
    return true;
  }

  // =========================================================================
  // GESTÃO DE TAREFAS & PROCESSOS
  // =========================================================================
  _mapTaskRow(row) {
    return {
      id: row.id,
      code: row.code || 'PROC-001',
      title: row.title,
      description: row.description || '',
      category: row.category || 'operacao',
      stage: row.stage || 'todo',
      priority: row.priority || 'media',
      assignee: row.assignee || '',
      contactId: row.contact_id || row.contactId || null,
      contactName: row.contact_name || row.contactName || '',
      dueDate: row.due_date || row.dueDate || null,
      calendarEventId: row.calendar_event_id || row.calendarEventId || null,
      syncToCalendar: Boolean(row.sync_to_calendar ?? row.syncToCalendar ?? true),
      checklist: Array.isArray(row.checklist) ? row.checklist : [],
      tags: Array.isArray(row.tags) ? row.tags : [],
      progress: Number(row.progress ?? 0),
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    };
  }

  _calcTaskProgress(stage, checklist) {
    if (stage === 'done') return 100;
    if (Array.isArray(checklist) && checklist.length > 0) {
      const doneCount = checklist.filter((c) => c.done).length;
      return Math.round((doneCount / checklist.length) * 100);
    }
    if (stage === 'review') return 80;
    if (stage === 'in_progress') return 45;
    return 0;
  }

  async getTasks() {
    if (!this._isKnownMissingTable('tasks_processes')) {
      const { data, error } = await this.supabase
        .from('tasks_processes')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) return (data || []).map((r) => this._mapTaskRow(r));
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.getTasks] ${error.message}`);
      }
      this._markMissingTable('tasks_processes');
    }
    const items = await this._readJsonCollection('workspace_tasks_processes');
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTask(payload) {
    const now = new Date().toISOString();
    const existing = await this.getTasks();
    const nextNum = existing.length + 1;
    const checklist = Array.isArray(payload.checklist) ? payload.checklist : [];
    const stage = payload.stage || 'todo';
    const task = {
      id: payload.id || `tsk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      code: payload.code || `PROC-${String(nextNum).padStart(3, '0')}`,
      title: String(payload.title || 'Nova Tarefa').trim(),
      description: String(payload.description || '').trim(),
      category: payload.category || 'operacao',
      stage,
      priority: payload.priority || 'media',
      assignee: String(payload.assignee || '').trim(),
      contactId: payload.contactId || null,
      contactName: String(payload.contactName || '').trim(),
      dueDate: payload.dueDate || null,
      calendarEventId: payload.calendarEventId || null,
      syncToCalendar: payload.syncToCalendar !== false,
      checklist,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      progress: payload.progress !== undefined ? Number(payload.progress) : this._calcTaskProgress(stage, checklist),
      createdAt: now,
      updatedAt: now,
    };

    if (!this._isKnownMissingTable('tasks_processes')) {
      const { data, error } = await this.supabase
        .from('tasks_processes')
        .insert({
          id: task.id,
          code: task.code,
          title: task.title,
          description: task.description,
          category: task.category,
          stage: task.stage,
          priority: task.priority,
          assignee: task.assignee,
          contact_id: task.contactId,
          contact_name: task.contactName,
          due_date: task.dueDate,
          calendar_event_id: task.calendarEventId,
          sync_to_calendar: task.syncToCalendar,
          checklist: task.checklist,
          tags: task.tags,
          progress: task.progress,
        })
        .select()
        .single();

      if (!error) return this._mapTaskRow(data);
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.createTask] ${error.message}`);
      }
      this._markMissingTable('tasks_processes');
    }

    const items = await this._readJsonCollection('workspace_tasks_processes');
    items.unshift(task);
    await this._writeJsonCollection('workspace_tasks_processes', items);
    return task;
  }

  async updateTask(id, patch) {
    const now = new Date().toISOString();
    const existingList = await this.getTasks();
    const current = existingList.find((t) => t.id === id);
    if (!current) throw new Error('Tarefa/Processo não encontrado');

    const nextStage = patch.stage !== undefined ? patch.stage : current.stage;
    const nextChecklist = patch.checklist !== undefined ? patch.checklist : current.checklist;
    const progress =
      patch.progress !== undefined ? Number(patch.progress) : this._calcTaskProgress(nextStage, nextChecklist);

    const dbPatch = { progress };
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.stage !== undefined) dbPatch.stage = patch.stage;
    if (patch.priority !== undefined) dbPatch.priority = patch.priority;
    if (patch.assignee !== undefined) dbPatch.assignee = patch.assignee;
    if (patch.contactId !== undefined) dbPatch.contact_id = patch.contactId || null;
    if (patch.contactName !== undefined) dbPatch.contact_name = patch.contactName || '';
    if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate || null;
    if (patch.calendarEventId !== undefined) dbPatch.calendar_event_id = patch.calendarEventId || null;
    if (patch.syncToCalendar !== undefined) dbPatch.sync_to_calendar = Boolean(patch.syncToCalendar);
    if (patch.checklist !== undefined) dbPatch.checklist = patch.checklist;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;

    if (!this._isKnownMissingTable('tasks_processes')) {
      const { data, error } = await this.supabase
        .from('tasks_processes')
        .update(dbPatch)
        .eq('id', id)
        .select()
        .single();

      if (!error) return this._mapTaskRow(data);
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.updateTask] ${error.message}`);
      }
      this._markMissingTable('tasks_processes');
    }

    const items = await this._readJsonCollection('workspace_tasks_processes');
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Tarefa/Processo não encontrado');
    items[idx] = { ...items[idx], ...patch, progress, id, updatedAt: now };
    await this._writeJsonCollection('workspace_tasks_processes', items);
    return items[idx];
  }

  async deleteTask(id) {
    if (!this._isKnownMissingTable('tasks_processes')) {
      const { error } = await this.supabase.from('tasks_processes').delete().eq('id', id);
      if (!error) return true;
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.deleteTask] ${error.message}`);
      }
      this._markMissingTable('tasks_processes');
    }
    const items = await this._readJsonCollection('workspace_tasks_processes');
    await this._writeJsonCollection(
      'workspace_tasks_processes',
      items.filter((i) => i.id !== id)
    );
    return true;
  }

  // =========================================================================
  // ARQUIVOS DIGITAIS (PDF, Excel, Imagens) + Supabase Storage
  // =========================================================================
  async _ensureDigitalFilesBucket() {
    if (this._digitalFilesBucketReady) return true;
    try {
      const { data: buckets } = await this.supabase.storage.listBuckets();
      const exists = (buckets || []).some((b) => b.name === 'digital-files');
      if (!exists) {
        await this.supabase.storage.createBucket('digital-files', {
          public: true,
          fileSizeLimit: 26214400, // 25MB
        });
      }
      this._digitalFilesBucketReady = true;
      return true;
    } catch {
      return false;
    }
  }

  _detectFileType(mimeType = '', fileName = '') {
    const m = String(mimeType).toLowerCase();
    const n = String(fileName).toLowerCase();
    if (m.includes('pdf') || n.endsWith('.pdf')) return 'pdf';
    if (
      m.includes('spreadsheet') ||
      m.includes('excel') ||
      m.includes('csv') ||
      n.endsWith('.xlsx') ||
      n.endsWith('.xls') ||
      n.endsWith('.csv')
    ) {
      return 'excel';
    }
    if (m.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(n)) return 'image';
    return 'document';
  }

  _mapDigitalFileRow(row) {
    return {
      id: row.id,
      name: row.name,
      fileName: row.file_name || row.fileName || row.name,
      category: row.category || 'geral',
      fileType: row.file_type || row.fileType || 'pdf',
      mimeType: row.mime_type || row.mimeType || 'application/octet-stream',
      size: Number(row.size || 0),
      description: row.description || '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      storagePath: row.storage_path || row.storagePath || '',
      publicUrl: row.public_url || row.publicUrl || '',
      dataUrl: row.data_url || row.dataUrl || '',
      uploadedBy: row.uploaded_by || row.uploadedBy || 'Equipa JOGIMIL',
      sendCount: Number(row.send_count ?? row.sendCount ?? 0),
      createdAt: row.created_at || row.createdAt || new Date().toISOString(),
      updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    };
  }

  async downloadDigitalFileBuffer(fileRecord) {
    if (!fileRecord?.storagePath) return null;
    try {
      const { data, error } = await this.supabase.storage
        .from('digital-files')
        .download(fileRecord.storagePath);
      if (error || !data) return null;
      const ab = await data.arrayBuffer();
      const buf = Buffer.from(ab);
      return buf.length > 0 ? buf : null;
    } catch {
      return null;
    }
  }

  async getDigitalFiles() {
    if (!this._isKnownMissingTable('digital_files')) {
      const { data, error } = await this.supabase
        .from('digital_files')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) return (data || []).map((r) => this._mapDigitalFileRow(r));
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.getDigitalFiles] ${error.message}`);
      }
      this._markMissingTable('digital_files');
    }
    const items = await this._readJsonCollection('workspace_digital_files');
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getDigitalFileById(id) {
    if (!this._isKnownMissingTable('digital_files')) {
      const { data, error } = await this.supabase
        .from('digital_files')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!error) return data ? this._mapDigitalFileRow(data) : null;
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.getDigitalFileById] ${error.message}`);
      }
      this._markMissingTable('digital_files');
    }
    const items = await this._readJsonCollection('workspace_digital_files');
    return items.find((f) => f.id === id) || null;
  }

  async createDigitalFile(payload) {
    const now = new Date().toISOString();
    const id = payload.id || `file_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const fileName = String(payload.fileName || payload.name || 'documento.pdf').trim();
    const mimeType = String(payload.mimeType || 'application/octet-stream').trim();
    const fileType = this._detectFileType(mimeType, fileName);

    let storagePath = '';
    let publicUrl = payload.publicUrl || '';
    let dataUrl = '';

    const rawBase64 = payload.dataBase64 || payload.dataUrl || '';
    if (rawBase64) {
      const cleanBase64 = String(rawBase64).replace(/^data:[^,]*;base64,/i, '').trim();
      const buffer = Buffer.from(cleanBase64, 'base64');
      if (buffer.length === 0) {
        throw new Error('O conteúdo do arquivo enviado está vazio ou inválido.');
      }

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = `${fileType}/${id}_${safeName}`;

      let uploadErr = null;
      const bucketReady = await this._ensureDigitalFilesBucket();
      if (bucketReady) {
        const res = await this.supabase.storage
          .from('digital-files')
          .upload(targetPath, buffer, { contentType: mimeType, upsert: true });
        uploadErr = res.error || null;
        if (!uploadErr) {
          storagePath = targetPath;
          const { data: pub } = this.supabase.storage.from('digital-files').getPublicUrl(targetPath);
          publicUrl = pub?.publicUrl || '';
        }
      }

      // Fallback se Storage não estiver disponível (só para ficheiros pequenos)
      if (!publicUrl && buffer.length <= 2 * 1024 * 1024) {
        dataUrl = String(rawBase64).startsWith('data:')
          ? rawBase64
          : `data:${mimeType};base64,${cleanBase64}`;
      }

      if (!publicUrl && !dataUrl) {
        throw new Error(
          `Falha ao guardar o ficheiro no armazenamento: ${uploadErr?.message || 'erro desconhecido'}`
        );
      }
    }

    const record = {
      id,
      name: String(payload.name || fileName).trim(),
      fileName,
      category: String(payload.category || 'geral').trim(),
      fileType,
      mimeType,
      size: Number(payload.size || 0),
      description: String(payload.description || '').trim(),
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      storagePath,
      publicUrl,
      dataUrl,
      uploadedBy: String(payload.uploadedBy || 'Equipa JOGIMIL').trim(),
      sendCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    if (!this._isKnownMissingTable('digital_files')) {
      const { data, error } = await this.supabase
        .from('digital_files')
        .insert({
          id: record.id,
          name: record.name,
          file_name: record.fileName,
          category: record.category,
          file_type: record.fileType,
          mime_type: record.mimeType,
          size: record.size,
          description: record.description,
          tags: record.tags,
          storage_path: record.storagePath,
          public_url: record.publicUrl,
          data_url: record.dataUrl,
          uploaded_by: record.uploadedBy,
          send_count: 0,
        })
        .select()
        .single();

      if (!error) return this._mapDigitalFileRow(data);
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.createDigitalFile] ${error.message}`);
      }
      this._markMissingTable('digital_files');
    }

    const items = await this._readJsonCollection('workspace_digital_files');
    items.unshift(record);
    await this._writeJsonCollection('workspace_digital_files', items);
    return record;
  }

  async updateDigitalFile(id, patch) {
    const now = new Date().toISOString();
    const dbPatch = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    if (patch.sendCount !== undefined) dbPatch.send_count = Number(patch.sendCount);

    if (!this._isKnownMissingTable('digital_files')) {
      const { data, error } = await this.supabase
        .from('digital_files')
        .update(dbPatch)
        .eq('id', id)
        .select()
        .single();

      if (!error) return this._mapDigitalFileRow(data);
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.updateDigitalFile] ${error.message}`);
      }
      this._markMissingTable('digital_files');
    }

    const items = await this._readJsonCollection('workspace_digital_files');
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Arquivo não encontrado');
    items[idx] = { ...items[idx], ...patch, id, updatedAt: now };
    await this._writeJsonCollection('workspace_digital_files', items);
    return items[idx];
  }

  async deleteDigitalFile(id) {
    const existing = await this.getDigitalFileById(id);
    if (existing?.storagePath) {
      await this.supabase.storage.from('digital-files').remove([existing.storagePath]).catch(() => {});
    }

    if (!this._isKnownMissingTable('digital_files')) {
      const { error } = await this.supabase.from('digital_files').delete().eq('id', id);
      if (!error) return true;
      if (!this._isMissingTableError(error)) {
        throw new Error(`[SupabaseAdminRepository.deleteDigitalFile] ${error.message}`);
      }
      this._markMissingTable('digital_files');
    }

    const items = await this._readJsonCollection('workspace_digital_files');
    await this._writeJsonCollection(
      'workspace_digital_files',
      items.filter((i) => i.id !== id)
    );
    return true;
  }

  // =========================================================================
  // EMAILS AGENDADOS (Atendimento + Integração Calendário)
  // =========================================================================
  async getScheduledEmails() {
    const items = await this._readJsonCollection('workspace_scheduled_emails');
    return items.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  async createScheduledEmail(payload) {
    const now = new Date().toISOString();
    const record = {
      id: payload.id || `sch_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      ticketId: payload.ticketId || null,
      clientName: String(payload.clientName || 'Cliente').trim(),
      to: String(payload.to || '').trim(),
      cc: String(payload.cc || '').trim(),
      subject: String(payload.subject || 'Atendimento JOGIMIL').trim(),
      content: String(payload.content || ''),
      html: payload.html || '',
      attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
      scheduledAt: payload.scheduledAt || now,
      status: 'pending',
      calendarEventId: payload.calendarEventId || null,
      syncToCalendar: payload.syncToCalendar !== false,
      error: '',
      sentAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const items = await this._readJsonCollection('workspace_scheduled_emails');
    items.push(record);
    await this._writeJsonCollection('workspace_scheduled_emails', items);
    return record;
  }

  async updateScheduledEmail(id, patch) {
    const items = await this._readJsonCollection('workspace_scheduled_emails');
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Agendamento não encontrado');
    items[idx] = { ...items[idx], ...patch, id, updatedAt: new Date().toISOString() };
    await this._writeJsonCollection('workspace_scheduled_emails', items);
    return items[idx];
  }

  async deleteScheduledEmail(id) {
    const items = await this._readJsonCollection('workspace_scheduled_emails');
    await this._writeJsonCollection(
      'workspace_scheduled_emails',
      items.filter((i) => i.id !== id)
    );
    return true;
  }
}
