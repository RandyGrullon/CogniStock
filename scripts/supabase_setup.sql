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
    acciones int NOT NULL,
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

-- Inicializar el portafolio si no existe
INSERT INTO portafolio (id, capital_inicial, capital_disponible, capital_total)
VALUES (1, 100000.0, 100000.0, 100000.0)
ON CONFLICT (id) DO NOTHING;
