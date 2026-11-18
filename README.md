# GlobalAnalyzer

**Proyecto personal de consulta y análisis de instrumentos financieros.**

Aplicación web experimental que combina una interfaz HTML con una API de consulta de datos públicos. El repositorio incluye `index.html` y `api/market.js`; la API consulta información de mercado y relaciones de conversión de CEDEAR, utilizando fuentes de terceros.

- **Demostración publicada:** https://global-analyzer.vercel.app
- **Arquitectura:** interfaz web ligera, API serverless y consultas externas HTTP.
- **Integraciones observables en el código:** Yahoo Finance, DolarApi y una fuente web de ratios de conversión de CEDEAR.
- **Controles:** validación de símbolos, comprobación de datos OHLC y tratamiento de fallas de proveedores.

## Alcance y limitaciones

Es un proyecto de investigación y visualización. Las fuentes externas pueden cambiar, bloquear consultas o devolver información incompleta. Los ratios y cotizaciones deben verificarse con fuentes oficiales antes de tomar decisiones financieras. El repositorio no representa una plataforma bancaria de producción ni garantiza disponibilidad continua.

## Organización

- `index.html`: presentación e interacción web.
- `api/market.js`: adaptación y normalización de información de proveedores.

## Contexto del portfolio

Este proyecto ilustra integración de fuentes heterogéneas, normalización, validación y diseño de un servicio de consulta. Para una visión más amplia de arquitectura y controles operativos, ver [Radar Técnico G2](https://github.com/augustogjmm/Radar) y [MTF Live Monitor](https://github.com/augustogjmm/mtf-live-monitor).

**Autor:** Augusto García Juárez Matorras · [LinkedIn](https://www.linkedin.com/in/augustog/)
