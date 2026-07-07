# Modelos de Datos (Models)

La capa de modelos abstrae el acceso físico de la base de datos a entidades y objetos relacionales de negocio.

---

## 👥 Modelo Patient
Ubicación del archivo: [Patient.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/modelos/Patient.ts)

### Métodos del Modelo:
*   `Patient.all()`: Obtiene todos los pacientes registrados desde la base de datos.
*   `Patient.create(name, birthDate)`: Inserta un nuevo perfil de paciente en la base de datos.

### Interfaz del Paciente (`PatientData`):
*   `id`: Identificador único de tipo UUID o texto simulado.
*   `name`: Nombre completo del paciente.
*   `birth_date`: Fecha de nacimiento en formato de texto (ej. `YYYY-MM-DD`).
*   `sessions_count`: Cantidad de sesiones de medición asociadas al paciente.

---

## 📁 Modelo Session
Ubicación del archivo: [Session.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/modelos/Session.ts)

### Métodos del Modelo:
*   `Session.find(patientId, limit)`: Obtiene el listado de sesiones, filtrado opcionalmente por paciente, ordenado por fecha.
*   `Session.create(sessionData)`: Guarda una nueva sesión de medición.
*   `Session.delete(id)`: Elimina de forma física una sesión por su ID.

### Estructura de Sesión:
El modelo almacena métricas analíticas calculadas por el módulo de visión artificial, incluyendo ángulos mínimos/máximos, velocidad máxima, frecuencia y amplitud de temblores en Hz, y un string semiestructurado con el trazo crudo de ángulos y tiempo.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura general del sistema.
*   [[Controladores_Negocio]]: Controladores del sistema.
