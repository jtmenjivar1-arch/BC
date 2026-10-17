# Catálogo Social Black Cat: incorporación desde Instagram (fase de prueba)

## Alcance aprobado
- Origen de selección: publicaciones de @blackcat.sivar con ficha «Ver producto».
- Los 133 registros de `public.products` NO se importan ni se modifican.
- No conectar o reemplazar el catálogo de WhatsApp Business mientras no exista respaldo verificable del catálogo manual.
- Se reutilizará un catálogo vacío únicamente tras confirmar ID, permisos y que no contiene productos indispensables.
- Mantener el prototipo en la rama `feature/catalogo-social-meta-prueba` y la bandera `META_CATALOG_FEED_ENABLED` desactivada por defecto.

## Limitación actual
La función «Agregar detalles del producto» utilizada en Instagram no proporciona, por sí sola, una exportación confirmada a Meta Commerce Manager. Se requieren los enlaces de las publicaciones y verificación visual de los nombres, precios, imágenes y permiso de uso. No inventar ni deducir un precio de los campos de la web.

## Lote piloto: cinco productos existentes
Para cada uno reunir:
1. URL de publicación en Instagram.
2. Nombre exacto mostrado en la ficha del producto.
3. Precio mostrado, en USD.
4. URL HTTPS estable de la imagen que se va a utilizar en el catálogo (preferir imagen original del dueño).
5. Descripción breve, categoría y disponibilidad real (incluida «bajo pedido»).
6. URL de destino para solicitar compra, elegida y probada.

## Criterios antes de activar
- Separación efectiva de la tabla `public.products`, sin consultas cruzadas.
- SKU único y estable; fotografías autorizadas accesibles públicamente.
- Exportación de CSV compatible con campos requeridos por Meta: id, title, description, availability, condition, price, link, image_link, brand.
- Sin fichas incompletas, enlaces rotos ni precios asumidos.
- Revisión de autorizaciones del catálogo elegido y su política de publicaciones.
- Comparación del antes/después de productos de WhatsApp y captura/respaldo de su catálogo manual.
- Confirmación explícita antes de cambiar conexión a WhatsApp.

## Retroceso
1. Desactivar la fuente programada y `META_CATALOG_FEED_ENABLED` en el entorno de prueba.
2. No fusionar el PR ni desplegar hasta aprobar el lote.
3. Si el catálogo de WhatsApp fue cambiado, reconectar el catálogo anterior por las opciones de Meta/WhatsApp, si siguen disponibles.
4. Si el catálogo manual no reaparece, restaurar únicamente desde el respaldo verificado. No prometer recuperación automática.

## Nota técnica
`meta_products` contiene una ficha de prueba existente. Debe examinarse y tratarse como dato previo, no se considera una importación realizada desde Instagram.
