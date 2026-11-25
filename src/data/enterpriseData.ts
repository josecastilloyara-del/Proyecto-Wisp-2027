export type PriorityLevel = 'P0' | 'P1' | 'P2';

export interface EnterpriseSpec {
  id: string;
  category: 'modulo' | 'arquitectura' | 'seguridad_escala' | 'colombia';
  code: string;
  title: string;
  subtitle: string;
  priority: PriorityLevel;
  priorityLabel: 'P0 · Crítico' | 'P1 · Importante' | 'P2 · Deseable';
  targetPhase: 'Fase 1 (MVP Legal Colombia)' | 'Fase 2 (Escalamiento 500+)' | 'Fase 3 (Enterprise)';
  functionalDescription: string;
  businessValue: string;
  dataModelSql: string;
  endpoints: {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    path: string;
    description: string;
  }[];
  userFlow: string[];
  dependencies: {
    module: string;
    integration: string;
  }[];
  engineeringNotes?: string[];
}

export interface ThreePhaseRoadmapItem {
  id: 'fase1' | 'fase2' | 'fase3';
  phaseTag: string;
  title: string;
  scaleTarget: string;
  duration: string;
  objective: string;
  team: string;
  modulesIncluded: {
    name: string;
    priority: PriorityLevel;
    area: string;
    deliverable: string;
  }[];
  complianceGate: string;
}

export const ENTERPRISE_MODULES: EnterpriseSpec[] = [
  {
    id: 'billing-engine',
    category: 'modulo',
    code: 'MOD-01',
    title: 'Billing Engine Completo (Prorrateo, Mora y PDF)',
    subtitle: 'Motor de facturación recurrente con libro mayor de doble entrada y generación asíncrona de PDF',
    priority: 'P0',
    priorityLabel: 'P0 · Crítico',
    targetPhase: 'Fase 1 (MVP Legal Colombia)',
    functionalDescription:
      'Calcula automáticamente facturas recurrentes según ciclo de corte, aplica prorrateo exacto por días efectivos en altas o cambios de plan a mitad de mes, gestiona descuentos comerciales, notas crédito/débito y recargos por mora tras el período de gracia. Emite PDFs livianos en background (PDFKit/Typst) listos para envío por WhatsApp/Email y enlazados al XML DIAN.',
    businessValue:
      'Elimina errores de cobro manual, garantiza cuadre contable exacto (libro mayor inmutable) y habilita el ciclo completo de corte y reconexión desatendida.',
    dataModelSql: `CREATE TABLE billing_cycles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(40) NOT NULL,           -- Ej: "Corte día 1", "Corte día 15"
  cutoff_day SMALLINT NOT NULL CHECK (cutoff_day BETWEEN 1 AND 28),
  grace_days SMALLINT NOT NULL DEFAULT 5,
  late_fee_type VARCHAR(12) NOT NULL,  -- 'FIXED' | 'PERCENT'
  late_fee_value NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  invoice_number VARCHAR(32) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL,
  discount_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  late_fee_total NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(14,2) NOT NULL,
  balance_due NUMERIC(14,2) NOT NULL,
  status VARCHAR(20) NOT NULL,         -- 'DRAFT'|'ISSUED'|'PARTIAL'|'PAID'|'OVERDUE'|'VOID'
  dian_cufe VARCHAR(128),
  pdf_s3_key TEXT,
  idempotency_key VARCHAR(80) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL,      -- 'PLAN'|'PRORATION'|'DISCOUNT'|'LATE_FEE'|'INSTALL'
  description TEXT NOT NULL,
  quantity NUMERIC(10,4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19.00,
  line_total NUMERIC(14,2) NOT NULL
);

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  subscriber_id UUID NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  entry_type VARCHAR(16) NOT NULL,     -- 'DEBIT' | 'CREDIT'
  amount NUMERIC(14,2) NOT NULL,
  reference_type VARCHAR(24) NOT NULL, -- 'INVOICE'|'PAYMENT'|'CREDIT_NOTE'|'LATE_FEE'
  reference_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/billing/runs', description: 'Ejecuta corrida de facturación por ciclo (idempotente vía BullMQ).' },
      { method: 'POST', path: '/api/v1/billing/preview-proration', description: 'Simula prorrateo exacto por cambio de plan o instalación a mitad de ciclo.' },
      { method: 'GET', path: '/api/v1/invoices?subscriber_id=&status=', description: 'Lista facturas con saldos, filtros de mora y estado DIAN.' },
      { method: 'POST', path: '/api/v1/invoices/:id/credit-notes', description: 'Emite nota crédito parcial/total y ajusta saldo en ledger.' },
      { method: 'GET', path: '/api/v1/invoices/:id/pdf', description: 'Devuelve URL pre-firmada temporal (15 min) de S3/R2.' }
    ],
    userFlow: [
      '1. Cron diario a las 02:00 AM encola el trabajo de ciclo en BullMQ por tenant y fecha de corte.',
      '2. El Billing Engine calcula días activos del plan (prorrateo), suma descuentos vigentes, IVA 19% (o exención estrato 1-2-3 en Colombia) y genera el asiento DEBIT en `ledger_entries`.',
      '3. Dispara emisión electrónica DIAN (UBL 2.1) y renderiza el PDF corporativo en almacenamiento S3/R2.',
      '4. Encola notificación automática por WhatsApp Cloud API + Email con link de pago Wompi/PSE.',
      '5. Si vence `due_date + grace_days` con `balance_due > 0`, aplica recargo por mora y encola `SUSPEND_SUBSCRIBER` hacia MikroTik.'
    ],
    dependencies: [
      { module: 'CRM / Planes', integration: 'Lee tarifa vigente, estrato tributario, fecha de instalación y descuentos activos.' },
      { module: 'Facturación DIAN (Colombia)', integration: 'Cada factura emitida dispara firma XML UBL 2.1 y guarda el CUFE.' },
      { module: 'Pasarelas Locales + MikroTik', integration: 'Al acreditarse un pago en `ledger_entries` con saldo 0, dispara reconexión automática.' }
    ]
  },
  {
    id: 'support-tickets',
    category: 'modulo',
    code: 'MOD-02',
    title: 'Sistema de Tickets de Soporte y Motor SLA',
    subtitle: 'Gestión de incidentes de red y clientes, despacho a técnicos Android y control de tiempos de respuesta',
    priority: 'P1',
    priorityLabel: 'P1 · Importante',
    targetPhase: 'Fase 2 (Escalamiento 500+)',
    functionalDescription:
      'Centraliza reportes de fallas originados por el cliente (portal/WhatsApp), por el NOC o automáticamente por alertas de caída de CPE/torre. Permite asignar órdenes a técnicos de campo en la App Android, registrar evidencias fotográficas y medir cumplimiento de SLA (tiempo de primera respuesta y resolución) por categoría y severidad.',
    businessValue:
      'Reduce el churn (cancelaciones) al garantizar atención medible, elimina el caos de reportes perdidos en chats de WhatsApp y vincula cada visita técnica al historial del suscriptor.',
    dataModelSql: `CREATE TABLE sla_policies (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  severity VARCHAR(16) NOT NULL,       -- 'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'
  first_response_mins INT NOT NULL,    -- Ej: 30, 120, 240
  resolution_mins INT NOT NULL         -- Ej: 240, 720, 1440
);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ticket_code VARCHAR(20) NOT NULL UNIQUE,
  subscriber_id UUID REFERENCES subscribers(id),
  tower_id UUID REFERENCES gis_towers(id),
  assigned_technician_id UUID REFERENCES users(id),
  category VARCHAR(32) NOT NULL,       -- 'NO_INTERNET'|'HIGH_LATENCY'|'INSTALL'|'BILLING'
  severity VARCHAR(16) NOT NULL,
  status VARCHAR(20) NOT NULL,         -- 'OPEN'|'ASSIGNED'|'IN_FIELD'|'WAITING_CLIENT'|'RESOLVED'|'CLOSED'
  source VARCHAR(20) NOT NULL,         -- 'NOC'|'PORTAL'|'WHATSAPP'|'AUTO_RULE'
  sla_due_at TIMESTAMPTZ NOT NULL,
  sla_breached BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE ticket_events (
  id UUID PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id),
  event_type VARCHAR(24) NOT NULL,     -- 'COMMENT'|'STATUS_CHANGE'|'PHOTO'|'PING_SNAPSHOT'
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/tickets', description: 'Crea ticket (manual, portal o regla automática) y calcula `sla_due_at`.' },
      { method: 'PATCH', path: '/api/v1/tickets/:id/assign', description: 'Asigna técnico de campo y envía push notification (FCM) a Android.' },
      { method: 'POST', path: '/api/v1/tickets/:id/events', description: 'Agrega comentario, foto de instalación o captura de diagnóstico ping/dBm.' },
      { method: 'GET', path: '/api/v1/tickets/sla-summary', description: 'Métricas de cumplimiento SLA por técnico, torre y tipo de falla.' }
    ],
    userFlow: [
      '1. Se crea un ticket desde el Portal de Clientes, el NOC o una regla automática (ej. caída masiva de torre).',
      '2. El coordinador NOC ve en el Mapa GIS los técnicos más cercanos y asigna la orden.',
      '3. El técnico recibe la orden en la App Android (disponible offline), navega a las coordenadas GPS del CPE y ejecuta prueba de señal.',
      '4. Al resolver, adjunta foto del router/antena y firma del cliente; el ticket se cierra y notifica encuesta de satisfacción por WhatsApp.'
    ],
    dependencies: [
      { module: 'App Android Campo', integration: 'Consume la bandeja de órdenes asignadas y sincroniza fotos/cierre en modo offline.' },
      { module: 'Mapa GIS & NOC', integration: 'Correlaciona múltiples tickets de una misma torre como incidente masivo (Parent Ticket).' },
      { module: 'Motor de Reglas', integration: 'Permite apertura automática de tickets ante pérdida de conectividad sostenida.' }
    ]
  },
  {
    id: 'inventory-management',
    category: 'modulo',
    code: 'MOD-03',
    title: 'Gestión de Inventario de Equipos, Torres y CPEs',
    subtitle: 'Control serializado (MAC/SN) de antenas y routers + consumibles con alertas de stock mínimo',
    priority: 'P1',
    priorityLabel: 'P1 · Importante',
    targetPhase: 'Fase 2 (Escalamiento 500+)',
    functionalDescription:
      'Controla activos serializados (antenas CPE, ONTs, routers Wi-Fi, sectoriales en torres) y materiales consumibles (cable UTP exterior, conectores RJ45 blindados, mástiles, PoE). Rastrea en todo momento si un equipo está en bodega, asignado a la camioneta de un técnico, instalado en un cliente (comodato o venta) o en garantía RMA, disparando alertas automáticas al cruzar el punto de reorden.',
    businessValue:
      'Evita pérdidas silenciosas de hardware (principal fuga de capital en WISPs), acelera la recuperación de CPEs ante bajas de clientes y previene detenciones de instalaciones por falta de stock.',
    dataModelSql: `CREATE TABLE inventory_skus (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  sku_code VARCHAR(32) NOT NULL,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(24) NOT NULL,       -- 'CPE'|'ROUTER_WIFI'|'TOWER_RADIO'|'CABLE'|'CONNECTOR'
  is_serialized BOOLEAN NOT NULL,
  unit_of_measure VARCHAR(16) NOT NULL,-- 'UNIT' | 'METER' | 'BOX'
  min_stock_threshold INT NOT NULL DEFAULT 10,
  unit_cost NUMERIC(12,2) NOT NULL
);

CREATE TABLE inventory_assets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  sku_id UUID NOT NULL REFERENCES inventory_skus(id),
  serial_number VARCHAR(64) NOT NULL UNIQUE,
  mac_address MACADDR UNIQUE,
  status VARCHAR(24) NOT NULL,         -- 'IN_WAREHOUSE'|'WITH_TECH'|'ASSIGNED_CLIENT'|'ON_TOWER'|'RMA'
  location_type VARCHAR(20) NOT NULL,  -- 'WAREHOUSE'|'TECHNICIAN'|'SUBSCRIBER'|'TOWER'
  location_ref_id UUID NOT NULL,
  ownership VARCHAR(16) NOT NULL,      -- 'WISP_LOAN' | 'CLIENT_OWNED'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  sku_id UUID NOT NULL REFERENCES inventory_skus(id),
  asset_id UUID REFERENCES inventory_assets(id),
  quantity NUMERIC(10,2) NOT NULL,
  from_location_id UUID,
  to_location_id UUID NOT NULL,
  reason VARCHAR(32) NOT NULL,         -- 'PURCHASE'|'DISPATCH_TECH'|'INSTALL'|'RECOVERY'|'RMA'
  performed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/inventory/movements', description: 'Registra entrada a bodega, entrega a técnico o instalación en cliente/torre.' },
      { method: 'GET', path: '/api/v1/inventory/assets/lookup?mac=&sn=', description: 'Escaneo rápido desde cámara Android para verificar estado e historial de un CPE.' },
      { method: 'GET', path: '/api/v1/inventory/alerts/low-stock', description: 'Retorna SKUs por debajo de `min_stock_threshold` agrupados por bodega.' },
      { method: 'POST', path: '/api/v1/inventory/assets/:id/recover', description: 'Registra devolución de antena en comodato al dar de baja un cliente.' }
    ],
    userFlow: [
      '1. Bodega registra compra de equipos y asigna lote diario a la camioneta del técnico.',
      '2. Durante la instalación, el técnico escanea el código de barras/MAC del CPE desde la App Android.',
      '3. El backend cambia el activo a `ASSIGNED_CLIENT`, vincula la MAC al aprovisionamiento MikroTik y descuenta metros de cable UTP/conectores.',
      '4. Un trigger/worker verifica el saldo de stock; si cae bajo el umbral mínimo, envía alerta al administrador de compras.'
    ],
    dependencies: [
      { module: 'App Android + GIS', integration: 'Escaneo QR/MAC en instalación y asociación automática del equipo al punto GPS del cliente o torre.' },
      { module: 'CRM / Bajas', integration: 'Al cancelar servicio, genera automáticamente orden de retiro si el CPE es `WISP_LOAN`.' }
    ]
  },
  {
    id: 'automation-rules',
    category: 'modulo',
    code: 'MOD-04',
    title: 'Motor de Automatización y Reglas Configurables',
    subtitle: 'Evaluador CEP en streaming para alertas proactivas de latencia, saturación de plan y salud de torres',
    priority: 'P2',
    priorityLabel: 'P2 · Deseable',
    targetPhase: 'Fase 3 (Enterprise)',
    functionalDescription:
      'Permite a los ingenieros NOC definir reglas sin programar código, por ejemplo: "si latencia > 100 ms durante 5 minutos consecutivos → crear ticket y alertar por WhatsApp al NOC" o "si consumo sostenido > 90% del plan contratado durante 3 días → ofrecer upgrade automático al cliente". Incluye ventanas de enfriamiento (cooldown) para evitar tormentas de alertas.',
    businessValue:
      'Convierte la operación de reactiva (el cliente llama molesto) a proactiva y genera ingresos adicionales mediante campañas automáticas de upgrade de plan.',
    dataModelSql: `CREATE TABLE automation_rules (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(120) NOT NULL,
  scope VARCHAR(20) NOT NULL,          -- 'SUBSCRIBER' | 'ROUTER' | 'TOWER'
  metric VARCHAR(32) NOT NULL,         -- 'LATENCY_MS'|'PACKET_LOSS'|'PLAN_USAGE_PCT'|'CPU_PCT'
  operator VARCHAR(8) NOT NULL,        -- '>' | '>=' | '<' | '=='
  threshold NUMERIC(10,2) NOT NULL,
  duration_seconds INT NOT NULL,       -- Ventana sostenida (ej. 300s = 5 min)
  cooldown_minutes INT NOT NULL DEFAULT 60,
  actions JSONB NOT NULL,              -- [{"type":"NOTIFY_NOC"},{"type":"CREATE_TICKET"}]
  is_enabled BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE rule_executions (
  id UUID PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES automation_rules(id),
  target_id UUID NOT NULL,
  observed_value NUMERIC(10,2) NOT NULL,
  action_status VARCHAR(20) NOT NULL,  -- 'TRIGGERED' | 'COOLDOWN_SKIPPED' | 'FAILED'
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/automation/rules', description: 'Crea o actualiza una regla declarativa con validación de métricas permitidas.' },
      { method: 'POST', path: '/api/v1/automation/rules/:id/dry-run', description: 'Simula la regla contra los últimos 7 días en TimescaleDB para calibrar falsos positivos.' },
      { method: 'GET', path: '/api/v1/automation/executions', description: 'Historial auditable de disparos y acciones ejecutadas.' }
    ],
    userFlow: [
      '1. El administrador NOC crea la regla `latencia > 100 ms por 5 min` y activa acción `Alerta WhatsApp NOC + Ticket`.',
      '2. El Go Collector evalúa cada muestra entrante (60s) contra un estado de ventana deslizante en Redis (O(1) en memoria).',
      '3. Solo si 5 muestras consecutivas superan 100 ms y el `cooldown_minutes` expiró, publica el evento `RULE_TRIGGERED` en BullMQ.',
      '4. El Backend ejecuta las acciones configuradas (notificación, ticket o propuesta comercial de upgrade).'
    ],
    dependencies: [
      { module: 'Colector Go + TimescaleDB + Redis', integration: 'Consume el stream de métricas sin consultas pesadas a disco.' },
      { module: 'Tickets + WhatsApp Cloud API', integration: 'Dispara creación de incidentes o mensajes automatizados.' }
    ]
  },
  {
    id: 'self-service-portal',
    category: 'modulo',
    code: 'MOD-05',
    title: 'Portal de Autogestión para Suscriptores',
    subtitle: 'Aplicación Web PWA ligera servida por CDN para pagos en 1 clic, facturas DIAN, consumo y reportes',
    priority: 'P2',
    priorityLabel: 'P2 · Deseable',
    targetPhase: 'Fase 3 (Enterprise)',
    functionalDescription:
      'Portal web responsivo (PWA) autenticado sin contraseñas complejas (acceso por código OTP vía WhatsApp/Email o número de documento) donde cada suscriptor consulta su consumo de ancho de banda histórico, descarga facturas PDF + XML DIAN, reporta fallas con diagnóstico guiado y paga en segundos por PSE, Nequi, Daviplata o tarjeta.',
    businessValue:
      'Reduce entre 40% y 60% el volumen de mensajes de soporte y solicitudes de recibos en WhatsApp, acelerando el recaudo y habilitando auto-reconexión 24/7.',
    dataModelSql: `CREATE TABLE portal_sessions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  otp_hash VARCHAR(128),
  channel VARCHAR(16) NOT NULL,        -- 'WHATSAPP' | 'EMAIL'
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reutiliza vistas de lectura aisladas por subscriber_id y tenant_id
-- sobre invoices, telemetry_hourly_cagg (TimescaleDB) y support_tickets.`,
    endpoints: [
      { method: 'POST', path: '/api/v1/portal/auth/request-otp', description: 'Envía código temporal de 6 dígitos vía WhatsApp/Email (rate-limited).' },
      { method: 'GET', path: '/api/v1/portal/me/summary', description: 'Estado de servicio, plan actual, saldo vencido y gráfico de consumo cacheado.' },
      { method: 'POST', path: '/api/v1/portal/me/payments/checkout', description: 'Genera sesión de pago Wompi/PayU/Nequi para facturas pendientes.' },
      { method: 'POST', path: '/api/v1/portal/me/tickets', description: 'Permite reportar falla y adjuntar evidencia; vincula automáticamente el CPE.' }
    ],
    userFlow: [
      '1. El suscriptor entra desde el enlace de su factura o desde la redirección de aviso de mora (incluido en lista blanca del MikroTik).',
      '2. Ingresa su cédula/NIT y valida OTP de 6 dígitos enviado por WhatsApp.',
      '3. Consulta su consumo mensual, descarga PDF/XML de la DIAN o hace clic en "Pagar con Nequi / PSE".',
      '4. Al confirmarse el webhook de Wompi/PayU, el portal muestra "Servicio reconectado" en menos de 5 segundos.'
    ],
    dependencies: [
      { module: 'CDN (Cloudflare)', integration: 'Sirve assets estáticos en edge con baja latencia y protección DDoS.' },
      { module: 'MikroTik Lista Blanca', integration: 'El dominio del portal y pasarelas está en `wisp_pagos_permitidos` para clientes en mora.' }
    ]
  }
];

export const ARCHITECTURE_UPGRADES: EnterpriseSpec[] = [
  {
    id: 'snmp-vs-api',
    category: 'arquitectura',
    code: 'ARC-01',
    title: 'Estrategia Híbrida de Polling SNMPv3 (60s) vs. RouterOS API',
    subtitle: 'Política de recolección diferenciada para monitorear miles de clientes sin degradar el CPU del router',
    priority: 'P0',
    priorityLabel: 'P0 · Crítico',
    targetPhase: 'Fase 1 (MVP Legal Colombia)',
    functionalDescription:
      'Establece una separación estricta de responsabilidades: el monitoreo masivo periódico se realiza vía SNMPv3 (SNMP BulkWalk sobre IF-MIB y MIKROTIK-MIB Queue counters) cada 60 segundos, consumiendo <2% de CPU. La API REST/API-SSL de RouterOS se reserva exclusivamente para cambios de estado (cortes, reconexiones, altas) y para sesiones "Live View" de 2 segundos bajo demanda cuando un operador abre la ficha de un cliente específico (con auto-apagado a los 90s de inactividad).',
    businessValue:
      'Un error clásico en WISPs es consultar `/queue/simple/print` cada 5 segundos por API a 2,000 clientes, llevando los MikroTik a 100% de CPU y causando pérdida de paquetes. Esta estrategia escala linealmente sin afectar el plano de datos.',
    dataModelSql: `CREATE TABLE router_polling_profiles (
  id UUID PRIMARY KEY,
  router_id UUID NOT NULL REFERENCES mikrotik_routers(id),
  snmp_version VARCHAR(8) NOT NULL DEFAULT 'v3',
  snmp_interval_sec INT NOT NULL DEFAULT 60,
  icmp_ping_interval_sec INT NOT NULL DEFAULT 30,
  max_concurrent_api_calls SMALLINT NOT NULL DEFAULT 3,
  live_stream_ttl_sec SMALLINT NOT NULL DEFAULT 90,
  cpu_throttle_threshold SMALLINT NOT NULL DEFAULT 75
);`,
    endpoints: [
      { method: 'PATCH', path: '/api/v1/routers/:id/polling-profile', description: 'Ajusta intervalos SNMPv3/ICMP y umbral de protección de CPU por router.' },
      { method: 'POST', path: '/api/v1/telemetry/live-sessions', description: 'Abre sesión temporal (máx 90s) de muestreo 2s por WebSocket para un CPE.' }
    ],
    userFlow: [
      '1. El Colector Go ejecuta SNMPv3 BulkWalk escalonado (jitter aleatorio 0–15s) cada 60s por router.',
      '2. Si el CPU del router reporta >75%, el colector duplica automáticamente el intervalo a 120s (backpressure adaptativo).',
      '3. Cuando un técnico abre un cliente en NOC/Android, solicita `live-session` y recibe datos cada 2s vía WebSocket sin afectar otros clientes.'
    ],
    dependencies: [
      { module: 'Colector Go + TimescaleDB', integration: 'Persiste muestras de 60s en lote (`COPY`) y publica resúmenes en Redis.' }
    ]
  },
  {
    id: 'disconnection-resilience',
    category: 'arquitectura',
    code: 'ARC-02',
    title: 'Resiliencia ante Caídas de MikroTik o Túnel WireGuard',
    subtitle: 'Circuit Breaker por router, cola de reconciliación diferida y alertas escalonadas sin falsos positivos',
    priority: 'P0',
    priorityLabel: 'P0 · Crítico',
    targetPhase: 'Fase 1 (MVP Legal Colombia)',
    functionalDescription:
      'Cuando un enlace backhaul cae o un túnel WireGuard pierde handshake (>90s sin respuesta y 3 pings ICMP fallidos consecutivos), el router pasa a estado `UNREACHABLE` y activa su Circuit Breaker. Las órdenes de corte, reconexión o cambio de plan dirigidas a ese router no se pierden ni bloquean el backend: se almacenan en `router_pending_ops` con prioridad (reconexiones primero). Al detectarse el restablecimiento del túnel, un Reconciliador sincroniza automáticamente el estado deseado (Desired State) contra el estado real del MikroTik.',
    businessValue:
      'Evita inconsistencias peligrosas donde un cliente pagó mientras la torre estaba sin luz y nunca fue reconectado al volver la energía.',
    dataModelSql: `CREATE TABLE router_health_state (
  router_id UUID PRIMARY KEY REFERENCES mikrotik_routers(id),
  tunnel_status VARCHAR(16) NOT NULL,  -- 'ONLINE'|'DEGRADED'|'UNREACHABLE'
  circuit_state VARCHAR(16) NOT NULL,  -- 'CLOSED'|'OPEN'|'HALF_OPEN'
  consecutive_failures SMALLINT NOT NULL DEFAULT 0,
  last_wg_handshake_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ NOT NULL,
  outage_incident_id UUID
);

CREATE TABLE router_pending_ops (
  id UUID PRIMARY KEY,
  router_id UUID NOT NULL REFERENCES mikrotik_routers(id),
  subscriber_id UUID NOT NULL,
  op_type VARCHAR(24) NOT NULL,        -- 'RECONNECT'|'SUSPEND'|'UPDATE_PLAN'
  priority SMALLINT NOT NULL,          -- 1=RECONNECT, 2=UPDATE, 3=SUSPEND
  payload JSONB NOT NULL,
  attempts SMALLINT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'PENDING'
);`,
    endpoints: [
      { method: 'GET', path: '/api/v1/routers/:id/health', description: 'Estado del túnel WireGuard, último handshake, Circuit Breaker y cola pendiente.' },
      { method: 'POST', path: '/api/v1/routers/:id/reconcile', description: 'Fuerza reconciliación completa entre estado en PostgreSQL y reglas activas en MikroTik.' }
    ],
    userFlow: [
      '1. El Colector detecta 3 fallos consecutivos de ping + handshake WireGuard expirado → marca `UNREACHABLE` y abre Circuit Breaker.',
      '2. Dispara alerta crítica al NOC (Push Android + WhatsApp) y opcionalmente crea incidente padre de torre.',
      '3. Mientras está caído, cualquier pago aprobado guarda una operación `RECONNECT` (prioridad 1) en `router_pending_ops`.',
      '4. Al recuperarse el túnel WireGuard, el Reconciliador vacía la cola ordenada por prioridad y cierra el incidente.'
    ],
    dependencies: [
      { module: 'WireGuard Hub + BullMQ', integration: 'Soporte opcional de doble concentrador WireGuard (Primary/Backup) para alta disponibilidad.' }
    ]
  },
  {
    id: 'multi-tenancy',
    category: 'arquitectura',
    code: 'ARC-03',
    title: 'Arquitectura Multi-Tenancy (SaaS para Múltiples WISPs)',
    subtitle: 'Aislamiento estricto por PostgreSQL Row-Level Security (RLS) y subredes VPN segregadas',
    priority: 'P2',
    priorityLabel: 'P2 · Deseable',
    targetPhase: 'Fase 3 (Enterprise)',
    functionalDescription:
      'Prepara el sistema desde el esquema base (columna `tenant_id` obligatoria desde Día 1) para evolucionar hacia una plataforma SaaS que opere múltiples WISPs independientes sobre la misma infraestructura. Garantiza aislamiento lógico reforzado a nivel de motor de base de datos mediante PostgreSQL Row-Level Security (RLS), segmentación de subredes WireGuard por tenant (`10.250.<tenant_idx>.0/24`), llaves KMS y credenciales DIAN/Wompi aisladas por empresa.',
    businessValue:
      'Permite comercializar la plataforma a otros WISPs o manejar múltiples razones sociales/sucursales sin duplicar servidores ni arriesgar fugas de datos entre operadores.',
    dataModelSql: `CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  slug VARCHAR(48) NOT NULL UNIQUE,
  legal_name VARCHAR(160) NOT NULL,
  tax_id_nit VARCHAR(32) NOT NULL UNIQUE,
  wg_subnet CIDR NOT NULL UNIQUE,      -- Ej: 10.250.14.0/24
  custom_domain VARCHAR(120),
  branding_json JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
);

-- Ejemplo de política PostgreSQL RLS obligatoria en tablas multi-tenant:
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_subscribers ON subscribers
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/platform/tenants', description: 'Aprovisiona nuevo WISP, asigna subred WireGuard /24 y crea rol SuperAdmin.' },
      { method: 'PATCH', path: '/api/v1/tenant/settings', description: 'Configura branding, certificados DIAN, credenciales Wompi y plantillas WhatsApp propias.' }
    ],
    userFlow: [
      '1. Cada request JWT incluye `tenant_id` firmado; un interceptor NestJS ejecuta `SET LOCAL app.current_tenant_id` dentro de cada transacción PostgreSQL.',
      '2. Incluso ante un error de programación en un `WHERE`, PostgreSQL RLS bloquea cualquier lectura cruzada entre WISPs.',
      '3. El concentrador WireGuard aplica reglas `iptables/nftables` impidiendo ruteo lateral entre subredes `/24` de distintos tenants.'
    ],
    dependencies: [
      { module: 'Todas las tablas Core', integration: 'Incluir `tenant_id` desde Fase 1 cuesta casi cero y ahorra meses de migración en Fase 3.' }
    ]
  },
  {
    id: 'mikrotik-backups',
    category: 'arquitectura',
    code: 'ARC-04',
    title: 'Backup Automático y Versionamiento de Configuraciones MikroTik',
    subtitle: 'Respaldo diario programado de `/export` y `.backup`, detección de diffs y restauración controlada',
    priority: 'P1',
    priorityLabel: 'P1 · Importante',
    targetPhase: 'Fase 2 (Escalamiento 500+)',
    functionalDescription:
      'Cada noche (03:00 AM) o antes de un cambio masivo, el Worker Go solicita la exportación textual (`/export show-sensitive` sobre canal cifrado WireGuard) y calcula su hash SHA-256. Solo almacena una nueva versión cifrada en S3/R2 si hubo cambios reales, guardando un diff legible línea por línea para auditar modificaciones manuales hechas por técnicos en Winbox.',
    businessValue:
      'Si un router de torre se quema por tormenta eléctrica o se corrompe en una actualización de RouterOS, un técnico puede clonar un equipo de repuesto en minutos.',
    dataModelSql: `CREATE TABLE router_config_backups (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  router_id UUID NOT NULL REFERENCES mikrotik_routers(id),
  routeros_version VARCHAR(24) NOT NULL,
  sha256_hash CHAR(64) NOT NULL,
  has_changes BOOLEAN NOT NULL,
  s3_encrypted_key TEXT NOT NULL,
  size_bytes INT NOT NULL,
  diff_summary TEXT,
  triggered_by VARCHAR(20) NOT NULL,   -- 'SCHEDULED' | 'MANUAL' | 'PRE_CHANGE'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/routers/:id/backups', description: 'Ejecuta respaldo inmediato `/export` vía WireGuard.' },
      { method: 'GET', path: '/api/v1/routers/:id/backups', description: 'Lista versiones históricas con hash, tamaño y resumen de cambios.' },
      { method: 'GET', path: '/api/v1/routers/:id/backups/diff?v1=&v2=', description: 'Compara dos versiones del `/export` para detectar cambios manuales no autorizados.' }
    ],
    userFlow: [
      '1. Scheduler nocturno ejecuta respaldo escalonado sobre todos los routers `ONLINE`.',
      '2. Compara SHA-256 contra la última versión; si cambió, cifra el archivo (AES-256-GCM) y lo sube a S3/R2 con retención de 90 días.',
      '3. El ingeniero NOC puede revisar el diff en pantalla o descargar el `.rsc` firmado para restaurar hardware de reemplazo.'
    ],
    dependencies: [
      { module: 'Bóveda KMS + S3/R2', integration: 'Los archivos `/export` contienen claves PPPoE/WireGuard, por lo que se cifran con Envelope Encryption antes de guardarse.' }
    ]
  },
  {
    id: 'timescaledb-redis-cdn',
    category: 'seguridad_escala',
    code: 'ESC-01',
    title: 'Particionamiento TimescaleDB, Caché Redis NOC y CDN Portal',
    subtitle: 'Políticas de retención 30 días crudos / 1 año agregados, lecturas sub-10ms en NOC y borde Cloudflare',
    priority: 'P1',
    priorityLabel: 'P1 · Importante',
    targetPhase: 'Fase 2 (Escalamiento 500+)',
    functionalDescription:
      'Optimiza almacenamiento y velocidad al escalar a miles de suscriptores: (1) TimescaleDB particiona la hipertabla `telemetry_samples` en chunks de 1 día, comprime automáticamente tras 7 días (>85% ahorro), mantiene agregados continuos por hora durante 1 año y purga muestras crudas a los 30 días. (2) Redis almacena snapshots vivos (`noc:router:{id}:summary`, TTL 90s) para que el dashboard NOC nunca ejecute agregaciones pesadas en PostgreSQL. (3) Cloudflare CDN + WAF sirve el Portal de Autogestión y PDFs cacheados en el borde.',
    businessValue:
      'Mantiene el costo de base de datos estable aunque el WISP crezca de 500 a 10,000 clientes y garantiza respuestas de dashboard NOC menores a 50 ms.',
    dataModelSql: `CREATE TABLE telemetry_samples (
  ts TIMESTAMPTZ NOT NULL,
  tenant_id UUID NOT NULL,
  subscriber_id UUID NOT NULL,
  router_id UUID NOT NULL,
  rx_bps BIGINT NOT NULL,
  tx_bps BIGINT NOT NULL,
  latency_ms REAL,
  packet_loss_pct REAL
);

SELECT create_hypertable('telemetry_samples', 'ts', chunk_time_interval => INTERVAL '1 day');
ALTER TABLE telemetry_samples SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'tenant_id, subscriber_id'
);
SELECT add_compression_policy('telemetry_samples', INTERVAL '7 days');
SELECT add_retention_policy('telemetry_samples', INTERVAL '30 days');

-- Vista materializada continua (retenida 365 días para reportes anuales):
CREATE MATERIALIZED VIEW telemetry_hourly_cagg
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', ts) AS bucket, tenant_id, subscriber_id,
       AVG(rx_bps) AS avg_rx_bps, MAX(rx_bps) AS peak_rx_bps, AVG(latency_ms) AS avg_latency_ms
FROM telemetry_samples GROUP BY 1, 2, 3;
SELECT add_retention_policy('telemetry_hourly_cagg', INTERVAL '365 days');`,
    endpoints: [
      { method: 'GET', path: '/api/v1/noc/overview', description: 'Lee snapshot agregado desde Redis (<15 ms) con KPIs globales por torre/router.' },
      { method: 'GET', path: '/api/v1/telemetry/subscribers/:id?range=24h|30d|1y', description: 'Enruta automáticamente a tabla cruda (≤30d) o `telemetry_hourly_cagg` (>30d).' }
    ],
    userFlow: [
      '1. El Colector Go escribe lotes SNMPv3 en TimescaleDB y actualiza simultáneamente los hashes de estado actual en Redis.',
      '2. Al abrir el Dashboard NOC, NestJS lee directo de Redis sin tocar PostgreSQL.',
      '3. Cuando un cliente consulta su consumo de los últimos 6 meses en el Portal, el backend consulta `telemetry_hourly_cagg` pre-calculado y servido tras Cloudflare CDN.'
    ],
    dependencies: [
      { module: 'Panel NOC + Portal Clientes', integration: 'Acelera cargas concurrentes en horas pico y días de facturación.' }
    ]
  }
];

export const SECURITY_COMPLIANCE_UPGRADES: EnterpriseSpec[] = [
  {
    id: 'credential-encryption',
    category: 'seguridad_escala',
    code: 'SEC-01',
    title: 'Cifrado de Credenciales RouterOS: KMS Envelope Encryption vs. Vault',
    subtitle: 'Decisión arquitectónica para proteger accesos de red con menor complejidad operativa y máxima seguridad',
    priority: 'P0',
    priorityLabel: 'P0 · Crítico',
    targetPhase: 'Fase 1 (MVP Legal Colombia)',
    functionalDescription:
      'Evalúa tres estrategias: (A) Cifrado simétrico con clave estática en `.env` (insuficiente en enterprise por difícil rotación), (B) HashiCorp Vault auto-alojado (máximo control pero alto costo operativo de HA/unsealing para equipos pequeños), y (C) **Envelope Encryption AES-256-GCM respaldado por Cloud KMS (AWS KMS / GCP KMS)** — opción recomendada. Cada credencial de MikroTik se cifra con una DEK única, la DEK se envuelve con la llave maestra en KMS y solo el Go Worker con rol IAM específico puede descifrar en RAM.',
    businessValue:
      'Un volcado robado de PostgreSQL resulta matemáticamente inútil sin permisos IAM hacia KMS, evitando el secuestro masivo de la red del WISP.',
    dataModelSql: `CREATE TABLE router_credentials (
  router_id UUID PRIMARY KEY REFERENCES mikrotik_routers(id),
  tenant_id UUID NOT NULL,
  api_username VARCHAR(64) NOT NULL,
  ciphertext BYTEA NOT NULL,           -- Secreto cifrado con AES-256-GCM
  iv BYTEA NOT NULL,                   -- Nonce único de 96 bits
  auth_tag BYTEA NOT NULL,             -- Etiqueta de integridad GCM
  encrypted_dek BYTEA NOT NULL,        -- DEK envuelta por AWS/GCP KMS
  kms_key_version VARCHAR(64) NOT NULL,
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    endpoints: [
      { method: 'PUT', path: '/api/v1/routers/:id/credentials', description: 'Actualiza usuario/contraseña API del MikroTik cifrando con nueva DEK vía KMS.' },
      { method: 'POST', path: '/api/v1/routers/:id/credentials/rotate', description: 'Rota contraseña tanto en RouterOS (vía WireGuard) como en bóveda de forma atómica.' }
    ],
    userFlow: [
      '1. El SuperAdmin registra el usuario `wisp_api` del MikroTik; el Backend genera una DEK con KMS y guarda únicamente `ciphertext + encrypted_dek`.',
      '2. El API nunca devuelve el secreto en respuestas GET ni lo expone a la App Android.',
      '3. El Worker Go descifra en memoria RAM durante el pool de conexión y limpia el buffer al cerrar.'
    ],
    dependencies: [
      { module: 'Integración MikroTik + Multi-Tenancy', integration: 'Cada tenant puede asociar su propia KMS Key para aislamiento criptográfico.' }
    ]
  },
  {
    id: 'immutable-audit',
    category: 'seguridad_escala',
    code: 'SEC-02',
    title: 'Auditoría Completa Inmutable (Quién Hizo Qué y Cuándo)',
    subtitle: 'Trazabilidad legal y operativa de cortes, reconexiones, ajustes de saldo y accesos a datos',
    priority: 'P0',
    priorityLabel: 'P0 · Crítico',
    targetPhase: 'Fase 1 (MVP Legal Colombia)',
    functionalDescription:
      'Registra automáticamente cada acción crítica en una tabla `audit_logs` de solo inserción (`append-only`, sin permisos UPDATE/DELETE para el usuario de aplicación). Captura actor, rol, IP, dispositivo, recurso afectado, diff antes/después y marca de tiempo exacta (ej. "Técnico Juan Pérez suspendió a Cliente CLI-1042 a las 14:30:12 desde App Android").',
    businessValue:
      'Previene fraude interno (reconexiones por fuera de caja o borrado de deuda), resuelve reclamos ante la SIC/CRC en Colombia y facilita auditorías contables.',
    dataModelSql: `CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  actor_user_id UUID REFERENCES users(id),
  actor_name VARCHAR(120) NOT NULL,
  actor_role VARCHAR(32) NOT NULL,
  action VARCHAR(64) NOT NULL,         -- 'SUBSCRIBER_SUSPENDED'|'INVOICE_VOIDED'|'CREDENTIAL_ROTATED'
  entity_type VARCHAR(32) NOT NULL,
  entity_id UUID NOT NULL,
  before_state JSONB,
  after_state JSONB,
  source_channel VARCHAR(20) NOT NULL, -- 'WEB_NOC'|'ANDROID_APP'|'SYSTEM_CRON'|'WEBHOOK'
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- REVOKE UPDATE, DELETE ON audit_logs FROM wisp_app_role;`,
    endpoints: [
      { method: 'GET', path: '/api/v1/audit-logs?actor=&entity_id=&from=&to=', description: 'Consulta filtrable de eventos de auditoría con paginación por cursor.' },
      { method: 'POST', path: '/api/v1/audit-logs/export', description: 'Exporta bitácora firmada en CSV/PDF para inspecciones regulatorias.' }
    ],
    userFlow: [
      '1. Un interceptor global en NestJS + hooks del Worker Go emiten el evento de auditoría dentro de la misma transacción o cola garantizada.',
      '2. El administrador filtra por cliente o técnico y visualiza la línea de tiempo exacta de cambios.'
    ],
    dependencies: [
      { module: 'Todos los Módulos', integration: 'Transversal a Billing, MikroTik, Inventario, Tickets y Credenciales.' }
    ]
  },
  {
    id: 'data-privacy-colombia',
    category: 'colombia',
    code: 'COL-04',
    title: 'Protección de Datos: Ley 1581 de 2012 (Colombia) y GDPR',
    subtitle: 'Habeas Data, consentimiento verificable, derecho de supresión y retención tributaria armonizada',
    priority: 'P0',
    priorityLabel: 'P0 · Crítico',
    targetPhase: 'Fase 1 (MVP Legal Colombia)',
    functionalDescription:
      'Implementa cumplimiento técnico de la Ley Estatutaria 1581 de 2012 (Colombia), Decreto 1377 de 2013 y principios GDPR: captura de autorización previa e informada (con evidencia de fecha, IP/firma y versión de política), clasificación de datos personales (PII), exportación de datos a solicitud del titular (ARCO/Habeas Data) y proceso de anonimización controlada que elimina PII sin destruir la integridad contable exigida por la DIAN (retención tributaria de 5 a 10 años).',
    businessValue:
      'Evita multas de la Superintendencia de Industria y Comercio (SIC) y prepara al WISP para contratos corporativos e inscripción ante el RNBD cuando supere los topes legales.',
    dataModelSql: `CREATE TABLE privacy_consents (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  policy_version VARCHAR(16) NOT NULL,
  purpose VARCHAR(32) NOT NULL,        -- 'SERVICE_BILLING'|'WHATSAPP_ALERTS'|'MARKETING'
  granted BOOLEAN NOT NULL,
  evidence_channel VARCHAR(24) NOT NULL,-- 'ANDROID_SIGNATURE'|'PORTAL_OTP'|'WHATSAPP_OPTIN'
  evidence_hash CHAR(64) NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE data_subject_requests (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  subscriber_id UUID NOT NULL,
  request_type VARCHAR(20) NOT NULL,   -- 'ACCESS'|'RECTIFY'|'ERASURE'|'REVOKE_MARKETING'
  status VARCHAR(20) NOT NULL,
  legal_deadline_at TIMESTAMPTZ NOT NULL, -- 10-15 días hábiles según Ley 1581
  resolved_at TIMESTAMPTZ
);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/privacy/consents', description: 'Registra consentimiento firmado/OTP de tratamiento de datos (Ley 1581).' },
      { method: 'POST', path: '/api/v1/privacy/requests', description: 'Radica solicitud Habeas Data con contador automático de término legal (10/15 días hábiles).' },
      { method: 'POST', path: '/api/v1/privacy/subscribers/:id/anonymize', description: 'Anonimiza PII conservando únicamente metadatos tributarios requeridos por ley.' }
    ],
    userFlow: [
      '1. En el alta del cliente (App Android o Portal), se captura aceptación explícita de la Política de Tratamiento de Datos y alertas por WhatsApp.',
      '2. Si un ex-cliente solicita supresión, el sistema valida que no tenga obligaciones vigentes y ejecuta anonimización reversible solo a nivel tributario legal.'
    ],
    dependencies: [
      { module: 'CRM + WhatsApp + Billing', integration: 'Valida opt-in vigente antes de enviar campañas comerciales (sin bloquear avisos contractuales de corte/factura).' }
    ]
  }
];

export const COLOMBIA_INTEGRATIONS: EnterpriseSpec[] = [
  {
    id: 'dian-ubl',
    category: 'colombia',
    code: 'COL-01',
    title: 'Facturación Electrónica DIAN (UBL 2.1 + CUFE)',
    subtitle: 'Emisión legal en Colombia vía Proveedor Tecnológico API (recomendado MVP) o software propio',
    priority: 'P0',
    priorityLabel: 'P0 · Crítico',
    targetPhase: 'Fase 1 (MVP Legal Colombia)',
    functionalDescription:
      'Integra la emisión de Factura Electrónica de Venta (FEV), Notas Crédito y Notas Débito cumpliendo el Anexo Técnico 1.9 de la DIAN (estándar XML UBL 2.1, firma digital XAdES-BES con certificado .p12 de Certicámara/GSE, cálculo de CUFE y representación gráfica con QR). Para un WISP desde cero se recomienda el patrón **Adapter hacia Proveedor Tecnológico / API Especializada** (ej. Siigo API, Alegra, Matias API, Factus o Carvajal) en Fase 1, evitando mantener directamente el complejo SOAP/certificados de la DIAN, con opción de motor propio en Fase 3 si el volumen supera 15,000 facturas/mes.',
    businessValue:
      'Requisito indispensable para operar legalmente como ISP/WISP en Colombia (junto con el registro TIC / MinTIC y reporte de formatos CRC), aplicando correctamente exención de IVA para Internet fijo residencial estratos 1 y 2 (y tope UVT para estrato 3).',
    dataModelSql: `CREATE TABLE dian_resolutions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  resolution_number VARCHAR(40) NOT NULL,
  prefix VARCHAR(10) NOT NULL,
  range_from BIGINT NOT NULL,
  range_to BIGINT NOT NULL,
  current_consecutive BIGINT NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  technical_key VARCHAR(128) NOT NULL,
  environment VARCHAR(12) NOT NULL     -- 'TEST' | 'PRODUCTION'
);

CREATE TABLE dian_documents (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  document_type VARCHAR(16) NOT NULL,  -- 'INVOICE' | 'CREDIT_NOTE' | 'DEBIT_NOTE'
  cufe_cude VARCHAR(128) UNIQUE,
  dian_status VARCHAR(24) NOT NULL,    -- 'PENDING'|'ACCEPTED'|'REJECTED'|'RETRYING'
  xml_s3_key TEXT,
  attached_doc_s3_key TEXT,
  dian_response_json JSONB,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ
);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/colombia/dian/invoices/:id/emit', description: 'Encola generación XML UBL 2.1, firma y envío a la DIAN con control de consecutivo.' },
      { method: 'GET', path: '/api/v1/colombia/dian/documents/:id/status', description: 'Consulta validación DIAN, CUFE, XML AttachedDocument y errores de esquema.' },
      { method: 'POST', path: '/api/v1/colombia/dian/resolutions', description: 'Registra resolución de numeración DIAN y alerta cuando falte <10% del rango.' }
    ],
    userFlow: [
      '1. Al emitirse una factura en el Billing Engine, el sistema verifica el estrato del suscriptor para aplicar IVA 0% (estratos 1 y 2 / tope legal estrato 3) o 19% (estratos 4-6 y empresas).',
      '2. Asigna el consecutivo atómicamente con lock en PostgreSQL (`SELECT ... FOR UPDATE` sobre `dian_resolutions`).',
      '3. El Worker DIAN envía el payload al Adapter (Proveedor Tecnológico o módulo UBL 2.1), obtiene el CUFE y el ZIP AttachedDocument.',
      '4. Adjunta el QR oficial de validación DIAN en el PDF y lo envía al correo electrónico obligatorio del adquirente.'
    ],
    dependencies: [
      { module: 'Billing Engine', integration: 'Sincronización 1:1 entre facturas/notas crédito y consecutivos DIAN; nunca elimina facturas emitidas (solo notas crédito).' }
    ]
  },
  {
    id: 'colombia-payments',
    category: 'colombia',
    code: 'COL-02',
    title: 'Pasarelas Locales Colombia: Wompi, PayU, PSE, Nequi y Daviplata',
    subtitle: 'Recaudo omnicanal adaptado al mercado colombiano con reconexión automática en <5 segundos',
    priority: 'P0',
    priorityLabel: 'P0 · Crítico',
    targetPhase: 'Fase 1 (MVP Legal Colombia)',
    functionalDescription:
      'Implementa un `ColombiaPaymentGatewayAdapter` unificado. **Wompi (Bancolombia)** se recomienda como pasarela primaria por su integración nativa y limpia con **PSE, Nequi, Botón Bancolombia, tarjetas y Corresponsales Bancolombia (efectivo)** con tarifas competitivas y webhooks firmados con SHA-256. **PayU** funciona como respaldo/alternativa con cobertura de **Daviplata, Efecty y Baloto/SuRed**. Todas las transacciones se validan por firma criptográfica y doble verificación contra la API de la pasarela antes de acreditar.',
    businessValue:
      'En WISPs rurales y urbanos de Colombia, más del 75% de los pagos se hacen por Nequi, PSE, Daviplata o corresponsal en efectivo, no por tarjeta de crédito internacional.',
    dataModelSql: `CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  subscriber_id UUID NOT NULL REFERENCES subscribers(id),
  gateway VARCHAR(20) NOT NULL,        -- 'WOMPI'|'PAYU'|'NEQUI_DIRECT'|'CASH_TECH'
  payment_method VARCHAR(24) NOT NULL, -- 'PSE'|'NEQUI'|'DAVIPLATA'|'CARD'|'CORRESPONSAL'
  gateway_tx_id VARCHAR(120) NOT NULL UNIQUE,
  amount_cop NUMERIC(14,2) NOT NULL,
  status VARCHAR(20) NOT NULL,         -- 'PENDING'|'APPROVED'|'DECLINED'|'VOIDED'
  webhook_signature_valid BOOLEAN NOT NULL DEFAULT false,
  raw_webhook_payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/payments/checkout', description: 'Genera link de pago Wompi/PayU con `reference` única y fecha de expiración.' },
      { method: 'POST', path: '/api/v1/webhooks/wompi', description: 'Recibe eventos `transaction.updated`, valida checksum SHA-256 y reconecta MikroTik.' },
      { method: 'POST', path: '/api/v1/webhooks/payu', description: 'Recibe confirmación PayU (Daviplata/Efecty/PSE), valida firma MD5/SHA256 e idempotencia.' },
      { method: 'POST', path: '/api/v1/payments/reconcile-pending', description: 'Job de conciliación cada 15 min para pagos PSE/Nequi cuyo webhook se retrasó.' }
    ],
    userFlow: [
      '1. El cliente recibe su factura por WhatsApp con enlace corto de pago o entra al Portal de Autogestión.',
      '2. Selecciona Nequi (push al celular), PSE (banco) o Daviplata y aprueba el débito.',
      '3. Wompi/PayU envía webhook firmado → Backend verifica integridad, registra `CREDIT` en `ledger_entries` y dispara `RECONNECT` en MikroTik.',
      '4. El suscriptor recupera Internet en <5s y recibe comprobante por WhatsApp.'
    ],
    dependencies: [
      { module: 'Billing Engine + MikroTik Worker', integration: 'Dispara reconexión con prioridad 1 en BullMQ y emite recibo.' }
    ]
  },
  {
    id: 'whatsapp-official-vs-unofficial',
    category: 'colombia',
    code: 'COL-03',
    title: 'WhatsApp Business API Oficial (Meta Cloud API) vs. No Oficiales',
    subtitle: 'Estrategia anti-baneo, control de costos por conversación y plantillas de utilidad aprobadas',
    priority: 'P1',
    priorityLabel: 'P1 · Importante',
    targetPhase: 'Fase 2 (Escalamiento 500+)',
    functionalDescription:
      'Adopta **Meta WhatsApp Cloud API Oficial** directamente (sin sobrecostos de intermediarios) como canal productivo principal, descartando librerías no oficiales (Baileys, WPPConnect, Evolution API sin API oficial) para envíos masivos de cobranza por su alto riesgo de suspensión permanente del número corporativo del WISP. Optimiza costos clasificando las notificaciones de factura, recordatorio de vencimiento, corte y recibo en la categoría **Utility (Utilidad)** de Meta, cuyo costo en Colombia es mínimo (~$0.0008–$0.01 USD por mensaje según tarifa vigente) y gratuito dentro de la ventana de 24h iniciada por el cliente.',
    businessValue:
      'Protege la reputación y el número oficial del WISP (canal #1 de relación con el cliente en Colombia) y garantiza entregabilidad >98% con botones interactivos de pago.',
    dataModelSql: `CREATE TABLE notification_templates (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  meta_template_name VARCHAR(80) NOT NULL,
  category VARCHAR(20) NOT NULL,       -- 'UTILITY' | 'AUTHENTICATION' | 'MARKETING'
  language_code VARCHAR(8) NOT NULL DEFAULT 'es_CO',
  approval_status VARCHAR(20) NOT NULL
);

CREATE TABLE notification_dispatches (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  subscriber_id UUID NOT NULL,
  channel VARCHAR(16) NOT NULL,        -- 'WHATSAPP_META' | 'EMAIL_SES' | 'FCM_PUSH'
  template_name VARCHAR(80),
  provider_message_id VARCHAR(120),
  status VARCHAR(20) NOT NULL,         -- 'QUEUED'|'SENT'|'DELIVERED'|'READ'|'FAILED'
  error_code VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`,
    endpoints: [
      { method: 'POST', path: '/api/v1/notifications/send', description: 'Encola envío priorizado con rate-limiting compatible con tiers de Meta Cloud API.' },
      { method: 'POST', path: '/api/v1/webhooks/meta-whatsapp', description: 'Recibe estados (`sent`, `delivered`, `read`, `failed`) y respuestas entrantes de clientes.' }
    ],
    userFlow: [
      '1. El Billing Engine o Motor de Reglas encola el evento (ej. "Factura emitida" o "Falla en Torre Norte").',
      '2. El Worker verifica opt-in (Ley 1581), selecciona la plantilla `UTILITY` aprobada y envía vía Graph API de Meta.',
      '3. Si Meta reporta `failed` (número sin WhatsApp), ejecuta fallback automático por Correo Electrónico (AWS SES).'
    ],
    dependencies: [
      { module: 'Billing Engine + Tickets + Ley 1581', integration: 'Solo envía mensajes promocionales si existe consentimiento `MARKETING` activo.' }
    ]
  }
];

export const THREE_PHASE_ROADMAP: ThreePhaseRoadmapItem[] = [
  {
    id: 'fase1',
    phaseTag: 'Fase 1 · MVP Productivo Legal Colombia',
    title: 'Operación Legal WISP desde Cero (0 – 250 Clientes)',
    scaleTarget: '1 – 5 Routers MikroTik · Hasta 250 suscriptores',
    duration: 'Semanas 1 – 10 (2.5 meses)',
    objective:
      'Poner en marcha un WISP 100% legal en Colombia con facturación electrónica DIAN, recaudo local (Wompi/Nequi/PSE), control seguro de MikroTik sin exposición WAN y cumplimiento de Ley 1581 y auditoría.',
    team: '1 Arquitecto/Backend Sr · 1 Mobile Dev (Flutter/Kotlin) · 1 DevOps/MikroTik (part-time)',
    modulesIncluded: [
      { name: 'WireGuard Hub-and-Spoke + Polling SNMPv3 60s + Manejo de Desconexiones', priority: 'P0', area: 'Red / MikroTik', deliverable: 'Zero-WAN, Circuit Breaker y cola de reconciliación.' },
      { name: 'Billing Engine Completo (Prorrateo, Mora, Ledger ACID y PDF)', priority: 'P0', area: 'Facturación', deliverable: 'Corrida recurrente idempotente con cálculo exacto.' },
      { name: 'Facturación Electrónica DIAN (UBL 2.1 vía Adapter) + IVA Estratos', priority: 'P0', area: 'Colombia Legal', deliverable: 'Emisión con CUFE, QR y Notas Crédito válidas ante DIAN.' },
      { name: 'Pasarelas Locales Colombia (Wompi PSE/Nequi + PayU/Daviplata)', priority: 'P0', area: 'Pagos', deliverable: 'Webhooks firmados y reconexión automática en <5s.' },
      { name: 'Cifrado KMS (Envelope Encryption) + Auditoría Inmutable + Ley 1581', priority: 'P0', area: 'Seguridad', deliverable: 'Credenciales seguras, log append-only y consentimiento Habeas Data.' },
      { name: 'App Android v1 + CRM Base + Esquema listo con tenant_id', priority: 'P0', area: 'Operación', deliverable: 'Alta de clientes con GPS, cobros y cortes remotos desde campo.' }
    ],
    complianceGate:
      'Habilitación ante la DIAN en producción, contrato de recaudo activo en Wompi/PayU y pruebas de reconexión automática tras corte de energía en torre.'
  },
  {
    id: 'fase2',
    phaseTag: 'Fase 2 · Escalamiento Operativo',
    title: 'Crecimiento Sostenible y Control de Campo (500 – 2,500 Clientes)',
    scaleTarget: '5 – 15 Routers MikroTik · 500 a 2,500 suscriptores',
    duration: 'Semanas 11 – 18 (2 meses)',
    objective:
      'Profesionalizar soporte técnico, blindar el capital en equipos (antenas/CPEs), automatizar respaldos de red y escalar la telemetría sin incrementar el costo de base de datos ni latencia del NOC.',
    team: '2 Backend/Go Devs · 1 Mobile Dev · 1 QA/NOC',
    modulesIncluded: [
      { name: 'Sistema de Tickets de Soporte + Políticas SLA + Modo Offline Campo', priority: 'P1', area: 'Soporte', deliverable: 'Despacho de técnicos en mapa GIS y control de cumplimiento SLA.' },
      { name: 'Gestión de Inventario Serializado (CPEs/Torres) y Alertas de Stock', priority: 'P1', area: 'Inventario', deliverable: 'Trazabilidad por MAC/Serial desde bodega hasta comodato en cliente.' },
      { name: 'Backup Automático de Configuraciones MikroTik (/export + Diff)', priority: 'P1', area: 'Resiliencia', deliverable: 'Versionado cifrado diario en S3/R2 con comparador de cambios.' },
      { name: 'TimescaleDB (30d crudos / 1 año agregados) + Caché Redis NOC', priority: 'P1', area: 'Performance', deliverable: 'Dashboard NOC <50ms y compresión >85% en disco.' },
      { name: 'WhatsApp Business API Oficial (Meta Cloud API) + Fallback SES', priority: 'P1', area: 'Alertas', deliverable: 'Plantillas Utility aprobadas para cobranza, corte y mantenimiento.' }
    ],
    complianceGate:
      'Operación estable con >1,000 clientes, <2% CPU en routers por monitoreo y trazabilidad 100% del inventario desplegado.'
  },
  {
    id: 'fase3',
    phaseTag: 'Fase 3 · Nivel Enterprise & SaaS',
    title: 'Autogestión Masiva, Automatización Proactiva y Multi-Tenancy (2,500 – 15,000+ Clientes)',
    scaleTarget: '15 – 60+ Routers · Miles de suscriptores o múltiples WISPs',
    duration: 'Semanas 19 – 26 (2 meses)',
    objective:
      'Convertir la arquitectura en una plataforma carrier-grade capaz de operar múltiples WISPs con aislamiento estricto, reducir soporte con autogestión y anticipar incidentes mediante reglas automáticas.',
    team: '1 Arquitecto Sr · 2 Backend/Go Devs · 1 Frontend Dev · 1 SRE',
    modulesIncluded: [
      { name: 'Multi-Tenancy Completo (PostgreSQL RLS + Subredes WireGuard /24)', priority: 'P2', area: 'Plataforma', deliverable: 'Gestión de múltiples razones sociales/WISPs con aislamiento criptográfico.' },
      { name: 'Portal de Autogestión de Suscriptores + CDN Cloudflare', priority: 'P2', area: 'Experiencia', deliverable: 'Consumo en vivo, facturas DIAN, tickets y pago local 24/7 en el borde.' },
      { name: 'Motor de Reglas y Automatización (Latencia >100ms / Plan >90%)', priority: 'P2', area: 'AIOps / NOC', deliverable: 'Evaluación en streaming con cooldown, auto-tickets y ofertas de upgrade.' },
      { name: 'Evolución AAA: FreeRADIUS + CoA (RFC 5176) + WireGuard HA', priority: 'P2', area: 'Alta Escala', deliverable: 'Autenticación centralizada y cambios de velocidad en caliente para >2,500 PPPoE.' }
    ],
    complianceGate:
      'Disponibilidad objetivo 99.9%, pruebas de carga para 10,000 suscriptores y certificación de aislamiento entre tenants.'
  }
];

export const ALL_ENTERPRISE_SPECS: EnterpriseSpec[] = [
  ...ENTERPRISE_MODULES,
  ...ARCHITECTURE_UPGRADES,
  ...SECURITY_COMPLIANCE_UPGRADES,
  ...COLOMBIA_INTEGRATIONS
];
