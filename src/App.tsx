import { useState } from 'react';
import {
  Network,
  Layers,
  Terminal,
  Boxes,
  Cpu,
  Landmark,
  ShieldCheck,
  CalendarRange,
  Activity,
  Download,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import type { SectionId } from './data/proposalData';
import { ArchitectureSection } from './components/ArchitectureSection';
import { TechStackSection } from './components/TechStackSection';
import { MikrotikSection } from './components/MikrotikSection';
import { EnterpriseModulesSection } from './components/EnterpriseModulesSection';
import { EnterpriseArchSection } from './components/EnterpriseArchSection';
import { ColombiaLegalSection } from './components/ColombiaLegalSection';
import { SecuritySection } from './components/SecuritySection';
import { RoadmapSection } from './components/RoadmapSection';
import { OperationalDemoSection } from './components/OperationalDemoSection';
import { ExportModal } from './components/ExportModal';

interface NavItem {
  id: SectionId;
  index: string;
  label: string;
  breadcrumb: string;
  icon: typeof Network;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'arquitectura',
    index: '01',
    label: 'Arquitectura del Sistema',
    breadcrumb: 'Arquitectura del Sistema',
    icon: Network
  },
  {
    id: 'stack',
    index: '02',
    label: 'Stack Tecnológico',
    breadcrumb: 'Stack Tecnológico',
    icon: Layers
  },
  {
    id: 'mikrotik',
    index: '03',
    label: 'Integración MikroTik',
    breadcrumb: 'Integración MikroTik',
    icon: Terminal
  },
  {
    id: 'modulos',
    index: '04',
    label: 'Módulos Enterprise',
    breadcrumb: 'Módulos Enterprise (Billing · Tickets · Inventario · Reglas · Portal)',
    icon: Boxes
  },
  {
    id: 'mejoras',
    index: '05',
    label: 'Arquitectura y Escala',
    breadcrumb: 'Mejoras de Arquitectura (SNMP · Resiliencia · Multi-Tenant · Backups)',
    icon: Cpu
  },
  {
    id: 'colombia',
    index: '06',
    label: 'Colombia Legal (DIAN)',
    breadcrumb: 'Colombia Legal (DIAN UBL 2.1 · Wompi/Nequi · WhatsApp · Ley 1581)',
    icon: Landmark
  },
  {
    id: 'seguridad',
    index: '07',
    label: 'Seguridad y Auditoría',
    breadcrumb: 'Seguridad KMS, Auditoría Inmutable y Compliance',
    icon: ShieldCheck
  },
  {
    id: 'roadmap',
    index: '08',
    label: 'Roadmap 3 Fases',
    breadcrumb: 'Roadmap Priorizado en 3 Fases (Colombia → Enterprise)',
    icon: CalendarRange
  },
  {
    id: 'prototipo',
    index: '09',
    label: 'Prototipo Operativo',
    breadcrumb: 'Prototipo Operativo (NOC · GIS · Android)',
    icon: Activity
  }
];

export default function App() {
  const [activeSection, setActiveSection] = useState<SectionId>('modulos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const currentIdx = NAV_ITEMS.findIndex((item) => item.id === activeSection);
  const currentItem = NAV_ITEMS[currentIdx] ?? NAV_ITEMS[0];
  const prevItem = currentIdx > 0 ? NAV_ITEMS[currentIdx - 1] : null;
  const nextItem = currentIdx < NAV_ITEMS.length - 1 ? NAV_ITEMS[currentIdx + 1] : null;

  const navigateTo = (id: SectionId) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center border-b border-slate-200">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
            Arquitectura WISP Core
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Secciones de la propuesta">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeSection;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1D4ED8]' : 'text-slate-400'}`} />
                <span className="truncate">{item.index}. {item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 text-xs text-slate-500 space-y-1">
          <div className="font-medium text-slate-800">Edición Enterprise · CO</div>
          <div>DIAN UBL 2.1 · Wompi · Ley 1581</div>
          <div>Multi-Tenant · TimescaleDB · KMS</div>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[82vw] bg-white h-full border-r border-slate-200 flex flex-col z-10">
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-200">
              <span className="font-display text-base font-bold text-slate-900 whitespace-nowrap">
                Arquitectura WISP Core
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Cerrar menú"
                className="p-2 text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === activeSection;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-left text-sm font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#EFF6FF] text-[#1D4ED8] font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.index}. {item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Contract: Breadcrumb Left + 1 Primary Action Right */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir navegación"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="text-slate-500 whitespace-nowrap hidden sm:inline">
                WISP Core Enterprise
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
              <span className="font-semibold text-slate-900 truncate">{currentItem.breadcrumb}</span>
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Propuesta</span>
            </button>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 px-4 sm:px-8 py-8 max-w-6xl w-full mx-auto">
          {activeSection === 'arquitectura' && <ArchitectureSection />}
          {activeSection === 'stack' && <TechStackSection />}
          {activeSection === 'mikrotik' && <MikrotikSection />}
          {activeSection === 'modulos' && <EnterpriseModulesSection />}
          {activeSection === 'mejoras' && <EnterpriseArchSection />}
          {activeSection === 'colombia' && <ColombiaLegalSection />}
          {activeSection === 'seguridad' && <SecuritySection />}
          {activeSection === 'roadmap' && <RoadmapSection />}
          {activeSection === 'prototipo' && <OperationalDemoSection />}

          {/* Section Sequential Navigation Footer */}
          <footer className="mt-12 pt-6 border-t border-slate-200 flex items-center justify-between gap-4 no-print">
            <div>
              {prevItem ? (
                <button
                  type="button"
                  onClick={() => navigateTo(prevItem.id)}
                  className="text-left group cursor-pointer"
                >
                  <div className="text-xs text-slate-500">Sección anterior</div>
                  <div className="text-sm font-semibold text-slate-800 group-hover:text-[#1D4ED8] transition-colors">
                    {prevItem.index}. {prevItem.label}
                  </div>
                </button>
              ) : (
                <span className="text-xs text-slate-400">Inicio de la propuesta técnica</span>
              )}
            </div>
            <div className="text-right">
              {nextItem ? (
                <button
                  type="button"
                  onClick={() => navigateTo(nextItem.id)}
                  className="text-right group cursor-pointer"
                >
                  <div className="text-xs text-slate-500">Siguiente sección</div>
                  <div className="text-sm font-semibold text-slate-800 group-hover:text-[#1D4ED8] transition-colors">
                    {nextItem.index}. {nextItem.label} →
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  className="text-sm font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                >
                  Exportar propuesta completa (.md / PDF)
                </button>
              )}
            </div>
          </footer>
        </main>
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
