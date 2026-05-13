import os
import json
from groq import Groq
from typing import Dict, Any, List, Optional

class AIClient:
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)
        # Latest stable high-capacity model from Groq
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    def analyze_stock(
        self,
        ticker: str,
        technical_analysis: Dict[str, Any],
        fundamentals: Dict[str, Any],
        news: List[Dict[str, Any]],
        historical_memory: str
    ) -> Dict[str, Any]:
        
        prompt = f"""
        Eres un analista financiero experto de élite. Tu objetivo es aprender de experiencias pasadas y mejorar tus predicciones.
        
        Analiza {ticker} con la siguiente información:

        === MEMORIA HISTÓRICA (Lecciones aprendidas de trades pasados) ===
        {historical_memory}

        === ANÁLISIS TÉCNICO ===
        {json.dumps(technical_analysis, indent=2)}

        === FUNDAMENTALES ===
        {json.dumps(fundamentals, indent=2)}

        === NOTICIAS RECIENTES ===
        {json.dumps(news, indent=2)}

        Instrucciones Cruciales:
        1. REVISA la memoria histórica. Si cometiste errores similares en el pasado, NO los repitas.
        2. Analiza si el patrón técnico actual coincide con lecciones de "SUCCESS" o "ERROR".
        3. Da una recomendación clara: BUY, SELL, HOLD, o WATCH.
        4. Indica tu nivel de confianza (0-100).
        5. Explica tu razonamiento integrando lo que has aprendido.

        Responde ÚNICAMENTE en JSON con esta estructura:
        {{
            "recomendacion": "BUY|SELL|HOLD|WATCH",
            "confianza": 0-100,
            "nivel_riesgo": "BAJO|MEDIO|ALTO",
            "razonamiento": "texto detallado",
            "riesgos": ["riesgo1", "riesgo2"],
            "precio_objetivo": número,
            "stop_loss": número,
            "horizonte": "corto|mediano|largo plazo",
            "lecciones_aplicadas": ["título de la lección que usaste para decidir"]
        }}
        """

        chat_completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Eres un sistema de análisis financiero con capacidad de aprendizaje continuo. Tu prioridad es la gestión de riesgo y la mejora constante basada en datos históricos."
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=self.model,
            response_format={"type": "json_object"}
        )

        return json.loads(chat_completion.choices[0].message.content)

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """Maneja una conversación fluida con el usuario."""
        try:
            chat_completion = self.client.chat.completions.create(
                messages=messages,
                model=self.model,
                temperature=0.7,
                max_tokens=1000
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            print(f"Error en Groq Chat: {e}")
            return "Lo siento, mi conexión neuronal está experimentando interferencias. ¿Podrías repetir eso?"

    def generate_lesson(self, trade: Dict[str, Any], outcome: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"""
        Como sistema de aprendizaje, analiza este trade CERRADO para extraer una lección que mejore tu desempeño futuro.

        DATOS DEL TRADE:
        - Ticker: {trade['ticker']}
        - Entrada: ${trade['precio_entrada']} ({trade['fecha_entrada']})
        - Salida: ${trade['precio_salida']} ({trade['fecha_salida']})
        - P&L: {outcome['pnl_porcentaje']}% (${outcome['pnl']})
        - Tu razonamiento original: {trade['razonamiento']}

        CONTEXTO DEL MERCADO AL CERRAR:
        {outcome.get('contexto_mercado', 'No disponible')}

        Crea una lección estructurada en JSON para tu memoria a largo plazo:
        {{
            "tipo": "SUCCESS|ERROR|NEUTRAL",
            "titulo": "Resumen de la lección (máx 10 palabras)",
            "leccion": "Explicación profunda de por qué se ganó o perdió y qué patrón evitar o repetir",
            "tags": ["{trade['ticker']}", "sector", "tipo_de_fallo_o_acierto"],
            "patron": "Nombre del patrón técnico/fundamental identificado",
            "aplicar_cuando": "Condiciones específicas para aplicar esta lección en el futuro",
            "estrellas": 1-5
        }}
        """

        chat_completion = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": "Eres un motor de aprendizaje automático humano-céntrico especializado en mercados financieros."},
                {"role": "user", "content": prompt}
            ],
            model=self.model,
            response_format={"type": "json_object"}
        )

        return json.loads(chat_completion.choices[0].message.content)
