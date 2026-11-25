import { useState } from 'react';
import { CheckCircle2, Users, Milestone, Server } from 'lucide-react';
import { THREE_PHASE_ROADMAP, type PriorityLevel } from '../data/enterpriseData';

function priorityColor(priority: PriorityLevel): string {
  if (priority === 'P0') return 'text-[#DC2626]';
  if (priority === 'P1') return 'text-[#D97706]';
  return 'text-[#1D4ED8]';
}

export function RoadmapSection() {
  const [selectedPhaseId, setSelectedPhaseId] = useState<'fase1' | 'fase2' | 'fase3'>('fase1');
  const [subscribers, setSubscribers] = useState<number>(1500);
  const [routers, setRouters] = useState<number>(8);

  const activePhase =
    THREE_PHASE_ROADMAP.find((p) => p.id === selectedPhaseId) ?? THREE_PHASE_ROADMAP[0];

  // Dynamic WISP Infrastructure Sizing Calculation
  const isHighScale = subscribers > 2500 || routers > 15;
  const isMidScale = subscribers > 500 || routers > 4;

  const recommendedControlMode =
    subscribers > 2500
      ? 'FreeRADIUS + CoA (RFC 5176) + WireGuard Redundante'
      : subscribers > 800
      ? 'PPPoE Secrets + Address-List vía Go Worker (SNMPv3 60s)'
      : 'Simple Queues / PPPoE + Address-List (REST v7)';

  const appServerSpec = isHighScale
    ? '2x 4 vCPU / 8 GB RAM (HA + Redis Cluster + Cloudflare CDN)'
    : isMidScale
    ? '1x 4 vCPU / 8 GB RAM (NestJS + Go Colector + Redis)'
    : '1x 2 vCPU / 4 GB RAM (VPS / Cloud Run + WireGuard Hub)';

  const dbSpec = isHighScale
    ? 'PostgreSQL + TimescaleDB 4 vCPU / 16 GB + Réplica Lectura'
    : isMidScale
    ? 'PostgreSQL + PostGIS + TimescaleDB 2 vCPU / 8 GB RAM'
    : 'PostgreSQL + PostGIS + TimescaleDB 2 vCPU / 4 GB RAM';

  const monthlyTelemetryGb = Math.max(1.5, Math.round((subscribers * 0.015 + routers * 0.5) * 10) / 10);
  const estimatedCloudUsd = Math.round(
    (isHighScale ? 280 : isMidScale ? 125 : 55) + routers * 3.5 + subscribers * 0.015
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-xs font-medium text-slate-500">
          Sección 08 · Entregable Final — Hoja de Ruta Priorizada (P0 → P1 → P2)
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Roadmap Priorizado en 3 Fases: Colombia Legal a Enterprise
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Plan incremental diseñado para lanzar un WISP 100% legal en Colombia en la Fase 1 (DIAN + Wompi +
          WireGuard + Ley 1581), profesionalizar soporte e inventario para 500+ clientes en la Fase 2 y escalar
          a Multi-Tenancy, Autogestión y Automatización en la Fase 3.
        </p>
      </div>

      {/* 3-Phase Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {THREE_PHASE_ROADMAP.map((phase) => {
          const isSelected = phase.id === selectedPhaseId;
          return (
            <button
              key={phase.id}
              type="button"
              onClick={() => setSelectedPhaseId(phase.id)}
              className={`text-left p-5 rounded-lg border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                isSelected
                  ? 'bg-[#EFF6FF] border-[#1D4ED8]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div
                className={`text-xs font-semibold ${
                  isSelected ? 'text-[#1D4ED8]' : 'text-slate-500'
                }`}
              >
                {phase.phaseTag}
              </div>
              <div className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">{phase.title}</div>
              <div className="text-xs text-slate-600 mt-1">{phase.scaleTarget}</div>
              <div className="text-xs font-mono tabular-nums text-slate-500 mt-2.5 pt-2.5 border-t border-slate-200/80">
                {phase.duration} · {phase.modulesIncluded.length} módulos clave
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Phase Detail */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-slate-200">
          <div className="space-y-1.5 max-w-2xl">
            <div className="text-xs font-medium text-[#1D4ED8]">
              {activePhase.phaseTag} · {activePhase.duration}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{activePhase.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{activePhase.objective}</p>
          </div>
          <div className="lg:text-right space-y-1 shrink-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Users className="w-3.5 h-3.5" />
              <span>Equipo Recomendado</span>
            </div>
            <div className="text-xs font-medium text-slate-800 max-w-xs">{activePhase.team}</div>
          </div>
        </div>

        {/* Prioritized Deliverables Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-2.5 pr-4 w-20">Prioridad</th>
                <th className="py-2.5 px-4">Área</th>
                <th className="py-2.5 px-4">Módulo / Mejora</th>
                <th className="py-2.5 pl-4">Entregable Verificable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activePhase.modulesIncluded.map((item) => (
                <tr key={item.name} className="hover:bg-slate-50/70">
                  <td className={`py-3.5 pr-4 font-mono font-bold align-top ${priorityColor(item.priority)}`}>
                    {item.priority}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap align-top">
                    {item.area}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">{item.name}</td>
                  <td className="py-3.5 pl-4 text-slate-600 align-top">
                    <span className="inline-flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>{item.deliverable}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-start gap-2.5 text-xs">
          <Milestone className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900">Criterio de salida / Go-Live: </span>
            <span className="text-slate-700">{activePhase.complianceGate}</span>
          </div>
        </div>
      </div>

      {/* Interactive WISP Scale & Infrastructure Sizing Calculator */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="pb-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Server className="w-4 h-4 text-[#1D4ED8]" />
              <h2>Calculadora de Dimensionamiento Cloud + Retención TimescaleDB</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Estima cómputo, almacenamiento con retención 30 días crudos / 1 año agregados y costo mensual en nube.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500">
            Política TimescaleDB: Compresión &gt;85%
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="subscribers-slider" className="font-medium text-slate-700">
                Suscriptores Activos Proyectados
              </label>
              <span className="font-mono tabular-nums font-semibold text-[#1D4ED8]">
                {subscribers.toLocaleString('es-CO')} clientes
              </span>
            </div>
            <input
              id="subscribers-slider"
              type="range"
              min={200}
              max={15000}
              step={100}
              value={subscribers}
              onChange={(e) => setSubscribers(Number(e.target.value))}
              className="w-full accent-[#1D4ED8] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400">
              <span>200</span>
              <span>2,500</span>
              <span>7,500</span>
              <span>15,000</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="routers-slider" className="font-medium text-slate-700">
                Routers MikroTik (Borde / Torres)
              </label>
              <span className="font-mono tabular-nums font-semibold text-[#1D4ED8]">
                {routers} {routers === 1 ? 'router' : 'routers'}
              </span>
            </div>
            <input
              id="routers-slider"
              type="range"
              min={1}
              max={40}
              step={1}
              value={routers}
              onChange={(e) => setRouters(Number(e.target.value))}
              className="w-full accent-[#1D4ED8] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-400">
              <span>1</span>
              <span>10</span>
              <span>25</span>
              <span>40</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-slate-200 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-[#F8FAFC]">
          <div className="p-4">
            <div className="text-xs text-slate-500">Control MikroTik Sugerido</div>
            <div className="mt-1 text-xs font-semibold text-slate-900 leading-snug">
              {recommendedControlMode}
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-500">Cómputo Backend + VPN</div>
            <div className="mt-1 text-xs font-mono font-medium text-slate-900">{appServerSpec}</div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-500">Base de Datos y Telemetría</div>
            <div className="mt-1 text-xs font-mono font-medium text-slate-900">{dbSpec}</div>
            <div className="mt-1 text-[11px] font-mono tabular-nums text-slate-500">
              ~{monthlyTelemetryGb} GB/mes (30d crudo / 1a cagg)
            </div>
          </div>
          <div className="p-4">
            <div className="text-xs text-slate-500">Costo Cloud Estimado</div>
            <div className="mt-1 text-xl font-bold font-mono tabular-nums text-[#1D4ED8]">
              ${estimatedCloudUsd} USD
            </div>
            <div className="text-[11px] text-slate-500">mensuales (excl. DIAN / WhatsApp)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
