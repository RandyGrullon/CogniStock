-- =====================================================================
-- COGNISTOCK - ESQUEMA COMPLETO SUPABASE
-- Una tabla por tipo de dato. Ejecutar en el SQL Editor de Supabase.
-- =====================================================================

-- 1. TABLA DE PORTAFOLIO (Estado global de la wallet)
CREATE TABLE IF NOT EXISTS portafolio (
    id int PRIMARY KEY DEFAULT 1,
    capital_inicial float DEFAULT 100000.0,
    capital_disponible float DEFAULT 100000.0,
    valor_posiciones float DEFAULT 0.0,
    capital_total float DEFAULT 100000.0,
    total_trades int DEFAULT 0,
    trades_ganadores int DEFAULT 0,
    trades_perdedores int DEFAULT 0,
    mejor_trade_pnl float DEFAULT 0.0,
peor_trade_pnl float DEFAULT 0.0,
    ultima_actualizacion timestamp with time zone DEFAULT timezone('utc'::text, now()),
    CONSTRAINT single_row CHECK (id = 1)
);

-- 2. TABLA DE TRADES (Historial de operaciones)
CREATE TABLE IF NOT EXISTS trades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker text NOT NULL,
    tipo text CHECK (tipo IN ('BUY', 'SELL')),
    acciones float NOT NULL,
    precio_entrada float NOT NULL,
    precio_actual float,
    precio_salida float,
    fecha_entrada timestamp with time zone DEFAULT timezone('utc'::text, now()),
    fecha_salida timestamp with time zone,
    razonamiento text,
    analisis_tecnico jsonb,
    estado text DEFAULT 'OPEN' CHECK (estado IN ('OPEN', 'CLOSED')),
    pnl float DEFAULT 0.0,
    pnl_porcentaje float DEFAULT 0.0,
    leccion_generada boolean DEFAULT false
);
CREATE INDEX IF NOT EXISTS trades_ticker_idx ON trades (ticker);
CREATE INDEX IF NOT EXISTS trades_estado_idx ON trades (estado);
CREATE INDEX IF NOT EXISTS trades_fecha_entrada_idx ON trades (fecha_entrada DESC);

-- 3. TABLA DE ANALISIS (Lo que la IA piensa en cada momento)
CREATE TABLE IF NOT EXISTS analisis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker text NOT NULL,
    fecha timestamp with time zone DEFAULT timezone('utc'::text, now()),
    recomendacion text,
    confianza int,
    nivel_riesgo text,
    razonamiento text,
    riesgos text[],
    precio_objetivo float,
    stop_loss float,
    horizonte text,
    datos_tecnicos jsonb,
    datos_fundamentales jsonb
);
CREATE INDEX IF NOT EXISTS analisis_ticker_idx ON analisis (ticker);
CREATE INDEX IF NOT EXISTS analisis_fecha_idx ON analisis (fecha DESC);

-- 4. TABLA DE LECCIONES (La memoria a largo plazo de la IA)
CREATE TABLE IF NOT EXISTS lecciones (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id uuid REFERENCES trades(id),
    ticker text,
    tipo text,
    titulo text,
    leccion text,
    tags text[],
    patron text,
    aplicar_cuando text,
    estrellas int,
    fecha timestamp with time zone DEFAULT timezone('utc'::text, now()),
    veces_aplicada int DEFAULT 0
);
CREATE INDEX IF NOT EXISTS lecciones_ticker_idx ON lecciones (ticker);
CREATE INDEX IF NOT EXISTS lecciones_fecha_idx ON lecciones (fecha DESC);

-- 5. TABLA DE RESUMENES DIARIOS (Apertura y cierre del dia con metas)
CREATE TABLE IF NOT EXISTS daily_summaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha text NOT NULL,
    intencion text,
    objetivos text,
    resultado text,
    obstaculos text,
    lecciones text,
    estado text DEFAULT 'PENDING' CHECK (estado IN ('PENDING', 'COMPLETED')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    closed_at timestamp with time zone
);
CREATE UNIQUE INDEX IF NOT EXISTS daily_summaries_fecha_idx ON daily_summaries (fecha);

-- 6. TABLA DE SESIONES DE CHAT (Cada conversacion con su duracion)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL UNIQUE,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    duration_seconds int,
    message_count int DEFAULT 0,
    transcript jsonb,
    summary jsonb,
    sentiment text
);
CREATE INDEX IF NOT EXISTS chat_sessions_started_at_idx ON chat_sessions (started_at DESC);

-- 7. TABLA DE MENSAJES DE CHAT (Cada mensaje individual)
CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    ts timestamp with time zone DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages (session_id, ts);

-- 8. TABLA DE TICKS DE MERCADO (Log granular de cada precio)
CREATE TABLE IF NOT EXISTS market_ticks (
    id bigserial PRIMARY KEY,
    symbol text NOT NULL,
    price float NOT NULL,
    source text DEFAULT 'tradingview',
    ts timestamp with time zone DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS market_ticks_symbol_ts_idx ON market_ticks (symbol, ts DESC);

-- 9. TABLA PRE-ACTION LOGS (Lo que la IA planea hacer minutos antes)
CREATE TABLE IF NOT EXISTS pre_action_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scheduled_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    ticker text NOT NULL,
    planned_action text,
    rationale text,
    market_snapshot jsonb,
    confidence int,
    expected_outcome text
);
CREATE INDEX IF NOT EXISTS pre_action_logs_scheduled_idx ON pre_action_logs (scheduled_at DESC);

-- 10. TABLA POST-ACTION LOGS (Que paso y que aprendio despues)
CREATE TABLE IF NOT EXISTS post_action_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_action_id uuid REFERENCES pre_action_logs(id),
    ticker text NOT NULL,
    executed_action text,
    result text,
    lessons text,
    pnl float,
    ts timestamp with time zone DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS post_action_logs_ts_idx ON post_action_logs (ts DESC);

-- 11. TABLA DE EJECUCIONES DE CRON (Auditoria de jobs programados)
CREATE TABLE IF NOT EXISTS cron_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name text NOT NULL,
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    finished_at timestamp with time zone,
    status text DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'SUCCESS', 'ERROR')),
    payload jsonb,
    error text
);
CREATE INDEX IF NOT EXISTS cron_runs_started_idx ON cron_runs (started_at DESC);

-- Inicializar el portafolio si no existe
INSERT INTO portafolio (id, capital_inicial, capital_disponible, capital_total)
VALUES (1, 100000.0, 100000.0, 100000.0)
ON CONFLICT (id) DO NOTHING;
