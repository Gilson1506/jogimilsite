import { useState, useEffect } from 'react';
import {
  Briefcase,
  Plus,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  TrendingUp,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';

interface PortfolioItem {
  id: string;
  title: string;
  client: string;
  category: string;
  description: string;
  image?: string;
  metrics?: string;
  tags: string[];
  link?: string;
}

interface PortfolioManagerProps {
  theme?: 'dark' | 'light';
}

export function PortfolioManager({ theme = 'dark' }: PortfolioManagerProps) {
  const isDark = theme === 'dark';

  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [category, setCategory] = useState('Web & Cloud');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [metrics, setMetrics] = useState('+140% Eficiência Operacional');
  const [tagsInput, setTagsInput] = useState('React, Node.js, SAF-T');
  const [link, setLink] = useState('https://jogimiltecnologias.it.ao');

  const portfolioPresets = [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&w=800&q=80',
  ];

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/v1/admin/portfolio');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setItems(json.data);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch portfolio from server, using local defaults', err);
    } finally {
      setLoading(false);
    }

    // Default fallback projects
    setItems([
      {
        id: 'port_1',
        title: 'POS SAF-T Angola Cloud',
        client: 'Rede de Varejo Alvalade',
        category: 'ERP & SAF-T',
        description: 'Implementação de ponto de venda em nuvem com sincronização offline e assinatura AGT.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        metrics: '100% Conformidade Fiscal AGT',
        tags: ['React', 'Node.js', 'PostgreSQL', 'SAF-T'],
        link: 'https://jogimiltecnologias.it.ao/produtos/pos-saft',
      },
      {
        id: 'port_2',
        title: 'Assistente IA Omnicanal WhatsApp',
        client: 'Grupo Logístico Benguela',
        category: 'Inteligência Artificial',
        description: 'Agente autónomo integrado à Evolution API para rastreamento de cargas e cotações 24/7.',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        metrics: '-80% Tempo de Espera do Cliente',
        tags: ['Evolution API', 'LLM Agents', 'Redis', 'Webhooks'],
        link: 'https://jogimiltecnologias.it.ao/produtos/omnichannel-ia',
      },
      {
        id: 'port_3',
        title: 'Portal de Gestão Acadêmica Integrada',
        client: 'Complexo Escolar Milénio',
        category: 'Web & Mobile',
        description: 'Plataforma completa de notas, matrículas, propinas e aplicativo móvel para os pais.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
        metrics: '3.200 Alunos Ativos',
        tags: ['Next.js', 'TailwindCSS', 'Multicaixa GPO'],
        link: 'https://jogimiltecnologias.it.ao/portfolio/colegio',
      },
    ]);
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !client.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newItem: PortfolioItem = {
      id: `port_${Date.now()}`,
      title,
      client,
      category,
      description,
      image: image || portfolioPresets[0],
      metrics,
      tags: tags.length > 0 ? tags : ['Tecnologia', 'JOGIMIL'],
      link,
    };

    try {
      const res = await fetch('http://localhost:3001/api/v1/admin/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        const json = await res.json();
        setItems((prev) => [json.data || newItem, ...prev]);
      } else {
        setItems((prev) => [newItem, ...prev]);
      }
    } catch {
      setItems((prev) => [newItem, ...prev]);
    }

    setNotice(`Projeto ${title} adicionado ao portfólio com imagem!`);
    setTimeout(() => setNotice(null), 4000);
    setModalOpen(false);
    setTitle('');
    setClient('');
    setDescription('');
    setImage('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja eliminar este projeto do portfólio?')) return;
    try {
      await fetch(`http://localhost:3001/api/v1/admin/portfolio/${id}`, { method: 'DELETE' });
    } catch {
      // offline ok
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
    setNotice('Projeto removido do portfólio.');
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 space-y-6 ${
        isDark
          ? 'bg-[#090D16] border-[#1E293B] text-slate-100 shadow-2xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-500">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Portfólio de Projetos</h2>
            <p className="text-xs text-slate-400">
              Projetos corporativos entregues, estudos de caso e produtos com suporte a imagens e mockups
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-semibold text-xs shadow-lg shadow-blue-600/25 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Projeto no Portfólio</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Grid of Portfolio Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
              isDark
                ? 'bg-[#0E1524] border-slate-800 hover:border-blue-500/50'
                : 'bg-slate-50 border-slate-200 hover:border-blue-500/50'
            }`}
          >
            {/* Project Image */}
            <div className="h-48 w-full relative overflow-hidden bg-slate-800">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500">
                  <ImageIcon className="h-10 w-10 opacity-40" />
                </div>
              )}

              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/20">
                {item.category}
              </span>

              {item.metrics && (
                <span className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600/90 backdrop-blur-md text-white shadow-md">
                  <TrendingUp className="h-3 w-3" />
                  {item.metrics}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-blue-500 mb-1">
                  Cliente: {item.client}
                </p>
                <h3 className="text-base font-bold text-inherit leading-snug mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                        isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Links */}
              <div className="pt-3 border-t border-inherit flex items-center justify-between">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-500 hover:text-blue-400 inline-flex items-center gap-1"
                  >
                    Ver Demonstração <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">Projeto Interno</span>
                )}

                <button
                  onClick={() => handleDelete(item.id)}
                  title="Eliminar projeto"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: NOVO PROJETO NO PORTFÓLIO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl ${
              isDark ? 'bg-[#0E1524] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-bold">Novo Projeto no Portfólio</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Título do Projeto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ERP Cloud SAF-T Angola"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Cliente / Entidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Banco ou Grupo Comercial"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="ERP & SAF-T">ERP & SAF-T</option>
                    <option value="Inteligência Artificial">Inteligência Artificial</option>
                    <option value="Web & Cloud">Web & Cloud</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Automação & Omnichannel">Automação & Omnichannel</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Métrica de Impacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: +140% Eficiência ou 100% AGT"
                    value={metrics}
                    onChange={(e) => setMetrics(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Image URL & Preset Selection */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Imagem / Mockup do Projeto (URL) *
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Mockups rápidos:</span>
                  {portfolioPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImage(preset)}
                      className="w-8 h-8 rounded-lg overflow-hidden border border-slate-600 hover:border-blue-500 transition"
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {image && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-700 h-36 relative">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-white">
                      Pré-visualização do Mockup
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Descrição do Projeto
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Objetivos do cliente, desafios superados e resultados obtidos..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none resize-none ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Tecnologias (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="React, Next.js, Docker, AI"
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Link da Demonstração / Case
                  </label>
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://..."
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
                    isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition"
                >
                  Publicar Projeto com Imagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
