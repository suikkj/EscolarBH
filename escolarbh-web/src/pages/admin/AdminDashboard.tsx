import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalParents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Obviamente numa app real, teríamos um endpoint no Spring Boot para isso.
        // Como o Admin pode fazer bypass pelo Supabase RLS (se configurado assim) ou pelo backend, 
        // faremos queries diretas simulando as métricas iniciais.
        const { data, error } = await supabase.from('users').select('role', { count: 'exact' });
        
        if (!error && data) {
          const drivers = data.filter(u => u.role === 'MOTORISTA').length;
          const parents = data.filter(u => u.role === 'CONTRATANTE').length;
          setStats({
            totalUsers: data.length,
            totalDrivers: drivers,
            totalParents: parents,
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-white">Carregando métricas...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h1>
          <p className="text-gray-400 mt-2">Acompanhe os números da plataforma Escolar Allyson.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-[#334155] shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <span className="text-blue-500 text-xl font-bold">👥</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Total de Usuários</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</h3>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-[#334155] shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <span className="text-green-500 text-xl font-bold">🚌</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Motoristas</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.totalDrivers}</h3>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-[#1e293b] rounded-2xl p-6 border border-[#334155] shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <span className="text-purple-500 text-xl font-bold">👨‍👩‍👧‍👦</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-400">Pais / Responsáveis</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.totalParents}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-[#334155] shadow-lg overflow-hidden">
        <div className="p-6 border-b border-[#334155]">
          <h2 className="text-xl font-semibold text-white">Ações Administrativas Recentes</h2>
        </div>
        <div className="p-8 text-center text-gray-400">
          O log de auditoria está vazio no momento.
        </div>
      </div>
    </div>
  );
}
