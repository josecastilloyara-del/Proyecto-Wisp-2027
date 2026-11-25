import { useState } from 'react';
import { FileCheck2, MessageSquare, CreditCard } from 'lucide-react';
import { COLOMBIA_INTEGRATIONS, SECURITY_COMPLIANCE_UPGRADES } from '../data/enterpriseData';
import { SpecBlueprintCard } from './SpecBlueprintCard';

export function ColombiaLegalSection() {
  const colombiaPrivacy = SECURITY_COMPLIANCE_UPGRADES.find((s) => s.id === 'data-privacy-colombia')!;
  const allColombiaSpecs = [...COLOMBIA_INTEGRATIONS, colombiaPrivacy];
  const [selectedId, setSelectedId] = useState<string>(allColombiaSpecs[0].id);

  const activeSpec =
    allColombiaSpecs.find((s) => s.id === selectedId) ?? allColombiaSpecs[0];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-xs font-medium text-slate-500">
          Sección 06 · Cumplimiento Regulatorio, Tributario y Financiero en Colombia
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Integraciones para Operar un WISP Legal en Colombia desde Cero
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Diseño adaptado a la realidad regulatoria y comercial colombiana: facturación electrónica DIAN (UBL 2.1 +
          CUFE + exención IVA estratos 1-2), recaudo local omnicanal (Wompi, PayU, PSE, Nequi, Daviplata),
          WhatsApp Business Cloud API oficial y cumplimiento de Ley 1581 de 2012 (Habeas Data).
        </p>
      </div>

      {/* Selector Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {allColombiaSpecs.map((item) => {
          const isSelected = item.id === activeSpec.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
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
                      : 'text-[#D97706] font-semibold'
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

      {/* Colombia Strategic Decision Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Official vs Unofficial */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1D4ED8]" />
            <h3 className="text-sm font-semibold text-slate-900">
              Meta WhatsApp Cloud API Oficial vs. Soluciones No Oficiales
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600">
                  <th className="py-2.5 px-4">Criterio</th>
                  <th className="py-2.5 px-3">Meta Cloud API (Recomendada)</th>
                  <th className="py-2.5 px-3">No Oficiales (Baileys / QR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">Riesgo de Baneo</td>
                  <td className="py-2.5 px-3 text-[#16A34A] font-medium">Nulo (cumpliendo políticas)</td>
                  <td className="py-2.5 px-3 text-[#DC2626] font-medium">Muy alto en cobranza masiva</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">Costo en Colombia</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">Muy bajo en categoría Utility</td>
                  <td className="py-2.5 px-3 text-slate-600">Sin tarifa Meta, pero costo oculto de mantenimiento y pérdida de línea</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-900">Estabilidad</td>
                  <td className="py-2.5 px-3 text-slate-700">Webhooks oficiales SLA Meta + botones de pago</td>
                  <td className="py-2.5 px-3 text-slate-600">Caídas frecuentes por cambios de protocolo WhatsApp Web</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Gateways Colombia */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#1D4ED8]" />
            <h3 className="text-sm font-semibold text-slate-900">
              Cobertura de Recaudo Local en Colombia
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600">
                  <th className="py-2.5 px-4">Pasarela</th>
                  <th className="py-2.5 px-3">Medios Clave</th>
                  <th className="py-2.5 px-3">Rol Recomendado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">Wompi (Bancolombia)</td>
                  <td className="py-2.5 px-3 text-slate-700">PSE, Nequi Push, Botón Bancolombia, Corresponsal, Tarjetas</td>
                  <td className="py-2.5 px-3 text-[#1D4ED8] font-medium">Primaria (MVP Fase 1)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">PayU Colombia</td>
                  <td className="py-2.5 px-3 text-slate-700">PSE, Daviplata, Efecty, SuRed, Tarjetas</td>
                  <td className="py-2.5 px-3 text-slate-700">Secundaria / Efectivo rural</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">Nequi / Daviplata Directo</td>
                  <td className="py-2.5 px-3 text-slate-700">API Conecta (notificación push directa sin intermediario)</td>
                  <td className="py-2.5 px-3 text-slate-600">Optimización comisiones (Fase 3)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Checklist Legal WISP Colombia */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FileCheck2 className="w-4 h-4 text-[#1D4ED8]" />
          <span>Consideraciones Regulatorias Adicionales (MinTIC / CRC Colombia)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Además de la DIAN y la Ley 1581, el modelo de datos de <span className="font-mono">subscribers</span> y{' '}
          <span className="font-mono">gis_towers</span> incluye código DANE de municipio, estrato socioeconómico y
          velocidades contratadas (subida/bajada) para exportar con un clic los reportes trimestrales exigidos por el
          Registro TIC (MinTIC) y el sistema Colombia TIC / Postdata de la CRC.
        </p>
      </div>
    </div>
  );
}
