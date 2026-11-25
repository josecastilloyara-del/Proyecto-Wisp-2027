import { useState } from 'react';
import { Copy, Check, Database, Globe, GitBranch, Link2, ArrowRight } from 'lucide-react';
import type { EnterpriseSpec, PriorityLevel } from '../data/enterpriseData';

interface SpecBlueprintCardProps {
  spec: EnterpriseSpec;
}

type SpecViewTab = 'resumen' | 'sql' | 'api';

function priorityTextClass(priority: PriorityLevel): string {
  if (priority === 'P0') return 'text-[#DC2626]';
  if (priority === 'P1') return 'text-[#D97706]';
  return 'text-[#1D4ED8]';
}

function methodTextClass(method: string): string {
  if (method === 'POST') return 'text-[#16A34A]';
  if (method === 'PATCH' || method === 'PUT') return 'text-[#D97706]';
  if (method === 'DELETE') return 'text-[#DC2626]';
  return 'text-[#1D4ED8]';
}

export function SpecBlueprintCard({ spec }: SpecBlueprintCardProps) {
  const [activeTab, setActiveTab] = useState<SpecViewTab>('resumen');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(spec.dataModelSql);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 1800);
    } catch {
      setCopiedSql(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      {/* Header metadata bar (zero pills — clean unboxed typography with separators) */}
      <div className="p-6 border-b border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono font-semibold text-slate-500">{spec.code}</span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className={`font-mono font-semibold ${priorityTextClass(spec.priority)}`}>
              {spec.priorityLabel}
            </span>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="text-slate-600">{spec.targetPhase}</span>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('resumen')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'resumen'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Funcional y Flujo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sql')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'sql'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Modelo PostgreSQL</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('api')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'api'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>API y Dependencias</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">{spec.title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{spec.subtitle}</p>
        </div>
      </div>

      {/* Tab 1: Functional Description + User Flow + Dependencies summary */}
      {activeTab === 'resumen' && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-2">
              <h3 className="text-xs font-semibold text-slate-900">Descripción Funcional</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{spec.functionalDescription}</p>
            </div>
            <div className="lg:col-span-5 space-y-2 lg:border-l lg:border-slate-200 lg:pl-6">
              <h3 className="text-xs font-semibold text-slate-900">Impacto de Negocio / Por Qué es Necesario</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{spec.businessValue}</p>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-semibold text-slate-900">Flujo Operativo de Usuario / Sistema</h3>
            <div className="space-y-2.5">
              {spec.userFlow.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-[#1D4ED8] shrink-0 mt-1" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
              <Link2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Integración con Módulos Existentes</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spec.dependencies.map((dep) => (
                <div key={dep.module} className="p-3.5 rounded-md bg-[#F8FAFC] border border-slate-200/80">
                  <div className="text-xs font-semibold text-slate-900">{dep.module}</div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{dep.integration}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PostgreSQL Data Model */}
      {activeTab === 'sql' && (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Modelo de Datos Relacional (PostgreSQL 16 + Multi-Tenant Ready)
              </h3>
              <p className="text-xs text-slate-500">
                Incluye llaves primarias UUID, aislamiento por <span className="font-mono">tenant_id</span> e integridad referencial.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>SQL copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>
          </div>
          <pre className="bg-[#0F172A] text-slate-100 p-4 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto">
            <code>{spec.dataModelSql}</code>
          </pre>
        </div>
      )}

      {/* Tab 3: REST Endpoints & Dependencies */}
      {activeTab === 'api' && (
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Endpoints REST API Requeridos</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600">
                      <th className="py-2.5 px-4 w-20">Método</th>
                      <th className="py-2.5 px-4">Ruta</th>
                      <th className="py-2.5 px-4">Propósito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {spec.endpoints.map((ep) => (
                      <tr key={`${ep.method}-${ep.path}`} className="hover:bg-slate-50/70">
                        <td className={`py-3 px-4 font-mono font-bold whitespace-nowrap ${methodTextClass(ep.method)}`}>
                          {ep.method}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-900 whitespace-nowrap">{ep.path}</td>
                        <td className="py-3 px-4 text-slate-600">{ep.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Dependencias con Módulos Existentes</h3>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
              {spec.dependencies.map((dep) => (
                <div key={dep.module} className="p-4 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 text-xs">
                  <div className="font-semibold text-slate-900 sm:w-56 shrink-0">{dep.module}</div>
                  <div className="text-slate-600 leading-relaxed">{dep.integration}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
