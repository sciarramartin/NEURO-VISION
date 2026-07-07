<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Obsidian Second Brain & Repository Automation

## 1. Sincronización de Contexto (Segundo Cerebro)
- **Al INICIO de cada nueva conversación** en este espacio de trabajo, el agente DEBE leer inmediatamente `obsidian_vault/Inicio.md` y revisar las últimas notas modificadas del baúl de Obsidian. Esto actúa como el cargador de memoria de nuestro "Segundo Cerebro" para garantizar que el agente recuerde todas las decisiones previas de diseño, acuerdos arquitectónicos y lógica de negocio.

## 2. Mantenimiento Automático del Baúl
- Cada vez que se desarrolle, modifique o refactorice una funcionalidad, el agente DEBE actualizar las notas correspondientes dentro del directorio `obsidian_vault/` (tales como arquitectura, modelos, vistas, controladores o módulos matemáticos) o crear nuevos nodos si fuera necesario para documentar los cambios.
- Mantener el índice principal `obsidian_vault/Inicio.md` enlazado con los nuevos nodos creados.
- Todos los nodos deben enlazarse con el formato wiki-style `[[NombreNodo]]` para mantener la conectividad del grafo en Obsidian.
