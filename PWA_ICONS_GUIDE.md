# Guía de Iconos para PWA

## Ubicación de Iconos
Los iconos personalizados deben colocarse en: `public/icons/`

## Formatos Recomendados
- **PNG** (recomendado para máxima compatibilidad)
- **SVG** (opcional, pero no todos los navegadores lo soportan para PWA)

## Tamaños Necesarios
Para una PWA completa, necesitas iconos en los siguientes tamaños:

- 72x72 px
- 96x96 px  
- 128x128 px
- 144x144 px
- 152x152 px
- 192x192 px
- 384x384 px
- 512x512 px

## Nomenclatura
Nombre tus archivos siguiendo este patrón:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- etc.

## Cómo Crear Tus Iconos Personalizados

1. **Diseña tu icono** en un editor gráfico (Illustrator, Figma, Canva, etc.)
2. **Exporta** en formato PNG con fondo transparente
3. **Redimensiona** a todos los tamaños necesarios
4. **Coloca** los archivos en `public/icons/`
5. **Actualiza** el manifest.json si usas nombres diferentes

## Herramientas Recomendadas
- **Online**: https://realfavicongenerator.net/
- **Photoshop/Illustrator**: Exportar en múltiples tamaños
- **GIMP**: Software gratuito para edición

## Ejemplo de Estructura
```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
└── icon.png (icono principal)
```

## Notas Importantes
- Usa fondo transparente cuando sea posible
- Asegúrate de que tu icono se vea bien en tamaños pequeños
- Considera usar colores que contrasten bien con fondos claros y oscuros
- El icono debe ser reconocible incluso sin texto

## Actualización del Manifest
Una vez que tengas tus iconos PNG, actualiza el `public/manifest.json` para usar las extensiones .png en lugar de .svg