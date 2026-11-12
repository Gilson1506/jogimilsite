import { useState, useEffect } from 'react';
import {
  Newspaper,
  Plus,
  Trash2,
  Image as ImageIcon,
  Calendar,
  User,
  CheckCircle2,
  X,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  image?: string;
  category: string;
  author: string;
  date: string;
}

interface NewsManagerProps {
  theme?: 'dark' | 'light';
}

export function NewsManager({ theme = 'dark' }: NewsManagerProps) {
  const isDark = theme === 'dark';

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState('Tecnologia');
  const [author, setAuthor] = useState('Redação JOGIMIL');

  const defaultPresets = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
  ];

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/v1/admin/news');
      if (res.ok) {
        const json = await res.json();
        if (json.data) setNews(json.data);
      }
    } catch (err) {
      console.warn('Failed to fetch news from server, using local defaults', err);
      setNews([
        {
          id: 'news_1',
          title: 'JOGIMIL lança nova suite de IA em Luanda',
          summary: 'Automação avançada com conformidade e dados protegidos para empresas angolanas.',
          content: 'A JOGIMIL Tecnologias anunciou hoje o lançamento de uma infraestrutura pioneira de inteligência artificial soberana para o setor empresarial em Angola.',
          image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          category: 'Tecnologia',
          author: 'Redação JOGIMIL',
          date: '2026-03-28',
        },
        {
          id: 'news_2',
          title: 'Atualização das Normas de Validação AGT 2026 para POS',
          summary: 'Exportação instantânea de SAF-T (AO) para retalho e faturamento corporativo.',
          content: 'O sistema de POS da JOGIMIL recebeu a mais recente certificação e conformidade para envio automático de ficheiros fiscais em Angola.',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
          category: 'SAF-T POS',
          author: 'Engenharia Fiscal',
          date: '2026-03-25',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    const newItem: NewsItem = {
      id: `news_${Date.now()}`,
      title,
      summary,
      content: content || summary,
      image: image || defaultPresets[0],
      category,
      author,
      date: new Date().toISOString().split('T')[0],
    };

    try {
      const res = await fetch('http://localhost:3001/api/v1/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        const json = await res.json();
        setNews((prev) => [json.data || newItem, ...prev]);
      } else {
        setNews((prev) => [newItem, ...prev]);
      }
    } catch {
      setNews((prev) => [newItem, ...prev]);
    }

    setNotice('Notícia publicada com sucesso com foto!');
    setTimeout(() => setNotice(null), 4000);
    setModalOpen(false);
    setTitle('');
    setSummary('');
    setContent('');
    setImage('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar esta notícia?')) return;
    try {
      await fetch(`http://localhost:3001/api/v1/admin/news/${id}`, { method: 'DELETE' });
    } catch {
      // offline ok
    }
    setNews((prev) => prev.filter((n) => n.id !== id));
    setNotice('Notícia removida com sucesso.');
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
            <Newspaper className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Publicação de Notícias</h2>
            <p className="text-xs text-slate-400">
              Artigos oficiais, atualizações tecnológicas e comunicados com foto em destaque
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
            <span>Nova Notícia com Foto</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Grid of news cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
              isDark
                ? 'bg-[#0E1524] border-slate-800 hover:border-blue-500/50'
                : 'bg-slate-50 border-slate-200 hover:border-blue-500/50'
            }`}
          >
            {/* Featured Image */}
            <div className="h-44 w-full relative overflow-hidden bg-slate-800">
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
            </div>

            {/* Card Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-blue-500" />
                    {item.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <User className="h-3 w-3 text-blue-500" />
                    {item.author}
                  </span>
                </div>

                <h3 className="text-sm font-bold line-clamp-2 mb-1.5 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-inherit flex items-center justify-between">
                <a
                  href={`#news-${item.id}`}
                  className="text-xs font-semibold text-blue-500 hover:text-blue-400 inline-flex items-center gap-1"
                >
                  Ver no portal <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  onClick={() => handleDelete(item.id)}
                  title="Eliminar notícia"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: NOVA NOTÍCIA COM FOTO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl ${
              isDark ? 'bg-[#0E1524] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-bold">Publicar Nova Notícia com Foto</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNews} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Título da Notícia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: JOGIMIL expande soluções de IA e POS em Luanda"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
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
                    <option value="Tecnologia">Tecnologia</option>
                    <option value="SAF-T POS">SAF-T POS</option>
                    <option value="Inteligência Artificial">Inteligência Artificial</option>
                    <option value="Institucional">Institucional</option>
                    <option value="Inovação">Inovação</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Autor
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              {/* Photo URL & Instant Preview */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  URL da Foto em Destaque *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                {/* Preset image suggestions */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Sugestões de fotos tech:</span>
                  {defaultPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImage(preset)}
                      className="w-7 h-7 rounded-lg overflow-hidden border border-slate-600 hover:border-blue-500 transition"
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Live Preview Box */}
                {image && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-slate-700 h-36 relative">
                    <img src={image} alt="Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-white">
                      Pré-visualização da Foto
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Sumário Executivo *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Breve resumo para o cabeçalho e listagem..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none resize-none ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Conteúdo Completo
                </label>
                <textarea
                  rows={4}
                  placeholder="Texto integral da publicação..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full p-3 text-xs rounded-xl border outline-none resize-none ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
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
                  Publicar Notícia com Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
