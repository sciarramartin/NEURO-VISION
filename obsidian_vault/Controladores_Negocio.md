# Controladores de Negocio (Controllers)

Los controladores actúan como orquestadores de negocio. Se encargan de validar la información entrante, manejar fallbacks y excepciones, y mapear los flujos de respuesta para las vistas.

---

## 👥 PatientController
Ubicación del archivo: [PatientController.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/controladores/PatientController.ts)

### Funciones:
*   `PatientController.getPatients()`: Retorna el listado completo de pacientes invocando al modelo `Patient`.
*   `PatientController.createPatient(name, birth_date)`: 
    *   **Validación de Negocio:** Asegura que el nombre no sea nulo ni contenga espacios en blanco.
    *   Llama al modelo `Patient` para su creación.

---

## 📁 SessionController
Ubicación del archivo: [SessionController.ts](file:///c:/Users/arrai/OneDrive/Documentos/PROYECTO%20NEURO%20VISION/src/controladores/SessionController.ts)

### Funciones:
*   `SessionController.getSessions(patientId, limit)`: Consulta y retorna las sesiones solicitadas por la vista usando el modelo `Session`.
*   `SessionController.createSession(sessionData)`:
    *   **Validación de Negocio:** Valida obligatoriamente la existencia de un `patient_id`.
    *   Delega la inserción al modelo `Session`.
*   `SessionController.deleteSession(id)`:
    *   **Validación de Negocio:** Valida que el `id` a borrar no esté vacío.
    *   Invoca la remoción en el modelo `Session`.

---

## 🔗 Nodos Relacionados
*   [[Inicio]]: Volver al panel principal.
*   [[Arquitectura_MVC]]: Arquitectura general.
*   [[Modelos_Datos]]: Detalle de la capa de datos.
