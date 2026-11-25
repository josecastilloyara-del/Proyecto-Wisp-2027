import { useState } from 'react';
import { ShieldAlert, Lock, Activity, CheckCircle2, KeyRound } from 'lucide-react';
import { SECURITY_CONTROLS, type SecurityControl } from '../data/proposalData';
import { SECURITY_COMPLIANCE_UPGRADES } from '../data/enterpriseData';
import { SpecBlueprintCard } from './SpecBlueprintCard';

type DomainFilter = 'Todos' | SecurityControl['domain'];

const DOMAIN_FILTERS: DomainFilter[] = [
  'Todos',
  'Credenciales MikroTik',
  'Perímetro y Auth',
  'Pagos e Idempotencia',
  'Escalabilidad y HA'
];

export function SecuritySection() {
  const [activeDomain, setActiveDomain] = useState<DomainFilter>('Todos');
  const [selectedSpecId, setSelectedSpecId] = useState<string>(SECURITY_COMPLIANCE_UPGRADES[0].id);

  const filteredControls =
    activeDomain === 'Todos'
      ? SECURITY_CONTROLS
      : SECURITY_CONTROLS.filter((c) => c.domain === activeDomain);

  const activeSpec =
    SECURITY_COMPLIANCE_UPGRADES.find((s) => s.id === selectedSpecId) ??
    SECURITY_COMPLIANCE_UPGRADES[0];

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="text-xs font-medium text-slate-500">
          Sección 07 · Seguridad Enterprise, Cifrado KMS, Auditoría y Cumplimiento
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Seguridad, Auditoría Inmutable y Protección de Datos
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
          Diseño de seguridad nivel enterprise para proteger credenciales RouterOS, registrar trazabilidad completa
          de acciones NOC/campo y cumplir la Ley 1581 de 2012 (Colombia) y GDPR.
        </p>
      </div>

      {/* Key Guarantees Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 border border-slate-200 rounded-lg bg-white divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <div className="p-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-slate-900">Envelope Encryption (KMS)</div>
            <p className="text-xs text-slate-600 mt-0.5">
              Recomendado sobre Vault auto-alojado en Fase 1–2: DEK única por router + llave maestra KMS sin costo operativo de clúster Vault.
            </p>
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-slate-900">Auditoría Append-Only</div>
            <p className="text-xs text-slate-600 mt-0.5">
              Registro inmutable de quién suspendió, reconectó, ajustó facturas o rotó credenciales con diff JSON antes/después.
            </p>
          </div>
        </div>
        <div className="p-4 flex items-start gap-3">
          <Activity className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-slate-900">Ley 1581 (Colombia) & GDPR</div>
            <p className="text-xs text-slate-600 mt-0.5">
              Consentimientos versionados, gestión de solicitudes Habeas Data (10–15 días hábiles) y anonimización compatible con DIAN.
            </p>
          </div>
        </div>
      </div>

      {/* Vault vs KMS vs Symmetric Comparison */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#1D4ED8]" />
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Decisión de Cifrado de Credenciales RouterOS: KMS vs. Vault vs. Simétrico Simple
            </h2>
            <p className="text-xs text-slate-500">
              Evaluación de seguridad, rotación de llaves y esfuerzo SRE para un WISP en crecimiento.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 font-semibold text-slate-600">
                <th className="py-2.5 px-4">Estrategia</th>
                <th className="py-2.5 px-4">Nivel de Seguridad</th>
                <th className="py-2.5 px-4">Carga Operativa</th>
                <th className="py-2.5 px-4">Veredicto Arquitectónico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-[#EFF6FF]/60">
                <td className="py-3 px-4 font-semibold text-[#1D4ED8]">Cloud KMS + Envelope AES-256-GCM</td>
                <td className="py-3 px-4 text-[#16A34A] font-medium">Muy alto (HSM administrado + IAM)</td>
                <td className="py-3 px-4 text-slate-700">Baja (~$1 USD/mes por llave)</td>
                <td className="py-3 px-4 font-semibold text-slate-900">Recomendado (Fase 1 a Enterprise)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">HashiCorp Vault (Self-Hosted)</td>
                <td className="py-3 px-4 text-[#16A34A] font-medium">Muy alto (secretos dinámicos)</td>
                <td className="py-3 px-4 text-[#D97706]">Alta (clúster HA, auto-unseal, SRE)</td>
                <td className="py-3 px-4 text-slate-600">Solo si el WISP opera 100% on-premise sin nube pública</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">AES-256 con clave fija en .env</td>
                <td className="py-3 px-4 text-[#DC2626] font-medium">Medio-Bajo (riesgo de fuga única)</td>
                <td className="py-3 px-4 text-slate-700">Mínima</td>
                <td className="py-3 px-4 text-slate-600">No recomendado para producción enterprise</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed 6-part Security & Compliance Specs */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SECURITY_COMPLIANCE_UPGRADES.map((spec) => {
            const isSelected = spec.id === activeSpec.id;
            return (
              <button
                key={spec.id}
                type="button"
                onClick={() => setSelectedSpecId(spec.id)}
                className={`text-left p-4 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#EFF6FF] border-[#1D4ED8]'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">{spec.code}</span>
                  <span className="text-[#DC2626] font-semibold">{spec.priority}</span>
                </div>
                <div className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">{spec.title}</div>
              </button>
            );
          })}
        </div>
        <SpecBlueprintCard key={activeSpec.id} spec={activeSpec} />
      </div>

      {/* Domain Filter for Operational Controls Matrix */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {DOMAIN_FILTERS.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => setActiveDomain(domain)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeDomain === domain
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-500">
          {filteredControls.length} controles adicionales de red y concurrencia
        </div>
      </div>

      {/* Security & Scalability Matrix */}
      <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
        {filteredControls.map((control) => (
          <div
            key={control.id}
            className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start hover:bg-slate-50/50 transition-colors"
          >
            <div className="lg:col-span-4 space-y-1">
              <div className="text-xs font-medium text-[#1D4ED8]">{control.domain}</div>
              <h3 className="text-sm font-bold text-slate-900">{control.title}</h3>
              <div className="text-xs font-mono text-slate-500 pt-1">{control.metricOrStandard}</div>
            </div>
            <div className="lg:col-span-3 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Riesgo Mitigado</div>
              <p className="text-xs text-slate-700 leading-relaxed">{control.threatAddressed}</p>
            </div>
            <div className="lg:col-span-5 space-y-1">
              <div className="text-[11px] font-semibold text-slate-500">Implementación Técnica</div>
              <p className="text-xs text-slate-600 leading-relaxed">{control.implementation}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Concurrency & Billing Day Pattern */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="pb-3 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">
            Manejo de Picos de Concurrencia (Día de Corte y Facturación Masiva)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            El día 1 o día 5 de cada mes concentra miles de facturas DIAN, webhooks de Wompi y cortes simultáneos.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-slate-600">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Sharding de Colas por Router</span>
            </div>
            <p className="leading-relaxed">
              Las órdenes de suspensión se encolan en BullMQ con concurrencia máxima de 3–5 operaciones
              simultáneas por <span className="font-mono">router_id</span>, manteniendo el CPU del MikroTik estable.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Prioridad Absoluta a Reconexiones</span>
            </div>
            <p className="leading-relaxed">
              La cola de reconexión por pago confirmado tiene prioridad 1 sobre cortes masivos o generación de
              PDFs, garantizando que quien paga recupere Internet en menos de 5 segundos.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Throttling de Notificaciones</span>
            </div>
            <p className="leading-relaxed">
              El despacho de recordatorios por Meta WhatsApp Cloud API y SES se dosifica en ventanas escalonadas para
              mantener alta reputación del número corporativo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
