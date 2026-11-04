# BLACKCAT AUTO V1 · entorno de preparación

Dos módulos independientes para BLACKCAT STREETWEAR. **No modifica la tienda ni activa mensajes o publicaciones sin aprobación.**

## 1. WhatsApp Business (desplegado en modo seguro, NO conectado al número)

- Proyecto Supabase: PBK, referencia `gzwcdmcxpbkqnszpfwoa`
- Función nueva: `blackcat-whatsapp-ai` (verifica una firma HMAC SHA256 real de Meta)
- Endpoint de configuración en Meta: `https://gzwcdmcxpbkqnszpfwoa.supabase.co/functions/v1/blackcat-whatsapp-ai`
- Webhook GET: desafío `hub.challenge`, protegido mediante `META_VERIFY_TOKEN`.
- Webhook POST: exige `X-Hub-Signature-256` y `META_APP_SECRET`. Sin tokens, retorna error seguro y no envía mensajes.
- Respuestas sólo a mensajes entrantes, en ventana de servicio. Sin campañas salientes ni plantillas automáticas.
- Catálogo leído de `public.products` con `brand='blackcat'`, `active=true` y precios de base de datos.
- Envíos: costo leído de `site_settings.commerce_config.shipping`. **No** cotiza precios de BOX no confirmados.
- Estado de orden: sólo consulta `public.orders`, con número WhatsApp remitente coincidente; no devuelve direcciones, montos o datos ajenos. `blackcat_manual_orders` sigue privado.
- Atención humana: comando `asesor` bloquea respuestas automáticas posteriores y registra bandera, sin texto ni número almacenados. Para regresar: `volver al bot`.
- Deduplicación: tabla `blackcat_ai_events` almacena únicamente ID de mensaje, digest HMAC del remitente y estado, no mensajes.

### Para activar con Meta

1. Desde Meta for Developers, vincular el negocio y verificar acceso a WhatsApp Business Platform. Comprobar primero si el número actual es elegible para **coexistencia** con WhatsApp Business App; no migrarlo a Cloud API exclusiva sin analizar las consecuencias.
2. Configurar en el panel Supabase Edge Function Secrets: `META_VERIFY_TOKEN` (valor aleatorio largo), `META_APP_SECRET` (secreto de la app Meta), `META_PHONE_NUMBER_ID`, `META_ACCESS_TOKEN`, `META_GRAPH_VERSION` (versión compatible). **No añadir secretos al repositorio.**
3. Opcional: `OPENAI_API_KEY` y `OPENAI_MODEL` para respuestas generativas; sin ellas sigue funcionando la búsqueda determinista, una vez conectado.
4. En Meta registrar la URL anterior y el mismo Verify Token; suscribir campo `messages`.
5. Probar primero con número de pruebas, mensajes duplicados, invalidación de firma, consulta de producto, orden, asesor y ausencia de orden; después habilitar número comercial con aprobación expresa.
6. Mantener una bandeja humana adecuada o la app en coexistencia; registrar la bandera de asesor **no** envía notificaciones a un operador por sí sola.
7. Confirmar condiciones comerciales, protección de datos y tarifas de Meta/OpenAI; sólo después habilitar servicio permanente.

### Despliegue y advertencias
La función está desplegada, pero no se han configurado secretos ni vinculado número a Meta. Permanece **inactiva para clientes reales**. Los cambios en este PR son independientes de la tienda; no desplegar la rama a Netlify por ser ajena al frontend.

## 2. BLACKCAT VIDEO STUDIO

- Primer teaser de 15 s generado para revisión, sin publicación en YouTube ni en otras redes.
- Brief y prompts de OpenMontage en `automation/video/OPENMONTAGE.md`.
- Flujo semanal programable de GitHub Actions en `.github/workflows/blackcat-short-draft.yml`: genera archivo MP4 de borrador y lo guarda como artifact para revisión; **no sube a YouTube**.
- OpenMontage requiere Python, FFmpeg, Node y un agente local; modelos de terceros pueden tener costo.

## Siguientes controles

- No modificar `products`, `orders`, `blackcat_manual_orders`, pagos o diseños desde el bot.
- No recopilar datos de tarjeta ni exponer llaves privadas a código del navegador.
- Aprobación humana obligatoria para mensajes fuera de las 24 horas, campañas, pagos, órdenes y publicación de videos.
- Futura mejora: panel de atención humana, opt-out, retención con limpieza de eventos, integración de escenas reales DTF, YouTube OAuth para borradores privados, métricas.
