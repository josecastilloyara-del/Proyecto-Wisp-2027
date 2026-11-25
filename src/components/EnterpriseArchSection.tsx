import { useState } from 'react';
import { GitCompare, Activity } from 'lucide-react';
import { ARCHITECTURE_UPGRADES } from '../data/enterpriseData';
import { SpecBlueprintCard } from './SpecBlueprintCard';

export function EnterpriseArchSection() {
  const [selectedId, setSelectedId] = useState<string>(ARCHITECTURE_UPGRADES[0].id);

  const activeSpec =
    ARCHITECTURE_UPGRADES.find((item) => item.id === selectedId) ?? ARCHITECTURE_UPGRADES[0];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-xs font-medium text-slate-500">
          Sección 05 · Resiliencia, Multi-Tenancy, Backups y Performance
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Mejoras de Arquitectura y Escalabilidad Enterprise
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Refinamientos críticos sobre la base existente para soportar miles de suscriptores con estabilidad
          operativa: polling SNMPv3 sin saturar MikroTik, recuperación automática ante cortes de túnel WireGuard,
          aislamiento Multi-Tenant con PostgreSQL RLS, versionado de `/export` y retención TimescaleDB + Redis + CDN.
        </p>
      </div>

      {/* Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ARCHITECTURE_UPGRADES.map((item) => {
          const isSelected = item.id === activeSpec.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#EFF6FF] border-[#1D4ED8]'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">{item.code}</span>
                <span
                  className={
                    item.priority === 'P0'
                      ? 'text-[#DC2626] font-semibold'
                      : item.priority === 'P1'
                      ? 'text-[#D97706] font-semibold'
                      : 'text-[#1D4ED8] font-semibold'
                  }
                >
                  {item.priority}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">{item.title}</div>
            </button>
          );
        })}
      </div>

      {/* Full 6-Part Specification Card */}
      <SpecBlueprintCard key={activeSpec.id} spec={activeSpec} />

      {/* Polling Strategy Quick Comparison Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#1D4ED8]" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Matriz Operativa: SNMPv3 (60s) vs. RouterOS REST API vs. Live Stream (2s)
            </h3>
            <p className="text-xs text-slate-500">
              Regla de oro para proteger la CPU de routers MikroTik CCR/RB cuando superan los 1,000 suscriptores.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600">
                <th className="py-3 px-4">Canal de Recolección</th>
                <th className="py-3 px-4">Intervalo</th>
                <th className="py-3 px-4">Uso Correcto</th>
                <th className="py-3 px-4">Impacto CPU Router</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">SNMPv3 BulkWalk (AuthPriv)</td>
                <td className="py-3 px-4 font-mono tabular-nums text-slate-800">60 seg (escalonado)</td>
                <td className="py-3 px-4 text-slate-600">Consumo masivo de interfaces, colas, CPU, RAM y temperatura hacia TimescaleDB.</td>
                <td className="py-3 px-4 font-mono font-semibold text-[#16A34A]">&lt; 2%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">ICMP Ping Batch (Go Worker)</td>
                <td className="py-3 px-4 font-mono tabular-nums text-slate-800">30 seg</td>
                <td className="py-3 px-4 text-slate-600">Detección de latencia, jitter, packet loss y salud del túnel WireGuard.</td>
                <td className="py-3 px-4 font-mono font-semibold text-[#16A34A]">&lt; 1%</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">RouterOS REST API v7 / API-SSL</td>
                <td className="py-3 px-4 font-mono tabular-nums text-slate-800">Por evento (máx 3 en paralelo)</td>
                <td className="py-3 px-4 text-slate-600">Cortes, reconexiones, altas PPPoE/Queues, backups `/export` y reconciliación.</td>
                <td className="py-3 px-4 font-mono font-semibold text-[#D97706]">2% – 5% pico</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Live Queue Stream (Bajo Demanda)</td>
                <td className="py-3 px-4 font-mono tabular-nums text-slate-800">2 seg (auto-TTL 90s)</td>
                <td className="py-3 px-4 text-slate-600">Gráfico en vivo únicamente para el cliente que el técnico tiene abierto en pantalla.</td>
                <td className="py-3 px-4 font-mono font-semibold text-[#16A34A]">&lt; 1% por sesión</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Backup Diff Preview */}
      {activeSpec.id === 'mikrotik-backups' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#1D4ED8]" />
              <h3 className="text-sm font-semibold text-slate-900">
                Ejemplo de Detección de Cambios en Backup Diario (/export)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              MK-TORRE-NORTE · v12 → v13 · SHA-256 verificado
            </span>
          </div>
          <pre className="bg-[#0F172A] text-slate-200 p-4 rounded-lg text-xs font-mono leading-relaxed overflow-x-auto">
{`--- backup_v12_2026-11-24_0300.rsc
+++ backup_v13_2026-11-25_0300.rsc
@@ -42,4 +42,5 @@
 /ip/firewall/address-list
 add address=pagos.miwisp.com list=wisp_pagos_permitidos
+add address=checkout.wompi.co list=wisp_pagos_permitidos
-add address=100.64.14.112 comment="CLI-1089 | Mora" list=wisp_morosos
+# Cambio detectado: 1 insercion, 1 remocion (Reconexion automatica Wompi)`}
          </pre>
        </div>
      )}
    </div>
  );
}
