import { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Trash2,
  Mail,
  ExternalLink,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  photo?: string;
  email?: string;
  linkedin?: string;
  github?: string;
}

interface TeamManagerProps {
  theme?: 'dark' | 'light';
}

export function TeamManager({ theme = 'dark' }: TeamManagerProps) {
  const isDark = theme === 'dark';

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Engenharia de Software');
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');

  const photoPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  ];

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/v1/admin/team');
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          setTeam(json.data);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch team from server, using local defaults', err);
    } finally {
      setLoading(false);
    }

    // Default fallback members
    setTeam([
      {
        id: 'team_1',
        name: 'Joel Gaspar',
        role: 'CEO & Head of Technology',
        department: 'Direção Executiva',
        bio: 'Especialista em arquiteturas escaláveis, sistemas fiscais SAF-T e inteligência artificial aplicada.',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        email: 'joel.gaspar@jogimiltecnologias.it.ao',
        linkedin: 'https://linkedin.com',
      },
      {
        id: 'team_2',
        name: 'Engª. Helena Kiala',
        role: 'Lead AI & Cloud Architect',
        department: 'Engenharia de Software',
        bio: 'Arquiteta de sistemas distribuídos, microsserviços Node.js/Go e modelos preditivos para Angola.',
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        email: 'helena.kiala@jogimiltecnologias.it.ao',
        linkedin: 'https://linkedin.com',
      },
      {
        id: 'team_3',
        name: 'Mauro dos Santos',
        role: 'Senior Full Stack & Mobile Engineer',
        department: 'Engenharia de Software',
        bio: 'Desenvolvedor especializado em Next.js, React Native/Flutter e integrações WhatsApp Evolution.',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        email: 'mauro.santos@jogimiltecnologias.it.ao',
        linkedin: 'https://linkedin.com',
      },
    ]);
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    const newMember: TeamMember = {
      id: `team_${Date.now()}`,
      name,
      role,
      department,
      bio: bio || 'Colaborador da equipa de alta performance da JOGIMIL.',
      photo: photo || photoPresets[0],
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@jogimiltecnologias.it.ao`,
      linkedin: linkedin || 'https://linkedin.com',
    };

    try {
      const res = await fetch('http://localhost:3001/api/v1/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      if (res.ok) {
        const json = await res.json();
        setTeam((prev) => [json.data || newMember, ...prev]);
      } else {
        setTeam((prev) => [newMember, ...prev]);
      }
    } catch {
      setTeam((prev) => [newMember, ...prev]);
    }

    setNotice(`Membro ${name} adicionado à equipa com sucesso!`);
    setTimeout(() => setNotice(null), 4000);
    setModalOpen(false);
    setName('');
    setRole('');
    setBio('');
    setPhoto('');
    setEmail('');
    setLinkedin('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja remover este membro da equipa?')) return;
    try {
      await fetch(`http://localhost:3001/api/v1/admin/team/${id}`, { method: 'DELETE' });
    } catch {
      // offline ok
    }
    setTeam((prev) => prev.filter((m) => m.id !== id));
    setNotice('Membro removido da equipa.');
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
            <Users2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Membros da Equipa</h2>
            <p className="text-xs text-slate-400">
              Gestão executiva de engenheiros, diretores e consultores da JOGIMIL com foto
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
            <span>Adicionar Membro com Foto</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Grid of Team Members */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => (
          <div
            key={member.id}
            className={`flex flex-col rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl p-5 ${
              isDark
                ? 'bg-[#0E1524] border-slate-800 hover:border-blue-500/50'
                : 'bg-slate-50 border-slate-200 hover:border-blue-500/50'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              {/* Member Photo */}
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-500/30 shrink-0 shadow-md">
                <img
                  src={member.photo || photoPresets[0]}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                onClick={() => handleDelete(member.id)}
                title="Remover membro"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {member.department}
              </span>
              <h3 className="text-base font-bold text-inherit pt-1">{member.name}</h3>
              <p className="text-xs font-semibold text-blue-500">{member.role}</p>
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed pt-1">
                {member.bio}
              </p>
            </div>

            {/* Social / Contact links */}
            <div className="pt-4 mt-4 border-t border-inherit flex items-center justify-between text-xs text-slate-400">
              <span className="truncate text-[11px] font-mono">{member.email}</span>
              <div className="flex items-center gap-1.5">
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="p-1.5 rounded-lg hover:text-blue-400 hover:bg-blue-500/10 transition"
                    title="Enviar Email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:text-blue-400 hover:bg-blue-500/10 transition"
                    title="Perfil Profissional"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADICIONAR MEMBRO COM FOTO */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className={`w-full max-w-xl rounded-2xl border p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl ${
              isDark ? 'bg-[#0E1524] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-bold">Adicionar Membro da Equipa</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Joel Gaspar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Cargo / Função *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Senior Cloud Architect"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Departamento
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="Direção Executiva">Direção Executiva</option>
                  <option value="Engenharia de Software">Engenharia de Software</option>
                  <option value="Sistemas Fiscais SAF-T">Sistemas Fiscais SAF-T</option>
                  <option value="Inteligência Artificial">Inteligência Artificial</option>
                  <option value="Suporte & Operações">Suporte & Operações</option>
                  <option value="Comercial & Parcerias">Comercial & Parcerias</option>
                </select>
              </div>

              {/* Photo input with preview and presets */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Foto do Membro (URL) *
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />

                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Avatares rápidos:</span>
                  {photoPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhoto(preset)}
                      className="w-7 h-7 rounded-full overflow-hidden border border-slate-600 hover:border-blue-500 transition"
                    >
                      <img src={preset} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {photo && (
                  <div className="mt-3 flex items-center gap-3 p-2 rounded-xl border border-slate-700 bg-slate-900/50">
                    <img src={photo} alt="Preview" className="w-12 h-12 rounded-xl object-cover" />
                    <span className="text-xs text-slate-300">Foto configurada</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Biografia / Perfil Profissional
                </label>
                <textarea
                  rows={3}
                  placeholder="Experiência, especialidades e contribuições..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
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
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    placeholder="nome@jogimiltecnologias.it.ao"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Perfil LinkedIn
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/..."
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
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
                  Salvar Membro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
