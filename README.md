# Bookmark Manager Sync (BMS)

Una aplicación web moderna para la gestión centralizada de enlaces, ofreciendo organización inteligente de links y características centradas en el usuario. Diseñada para optimizar colecciones de enlaces personales y profesionales con capacidades avanzadas de almacenamiento y enrutamiento.

## Características

- **Autenticación y autorización completa**:
  - Autenticación segura mediante Firebase Authentication
  - Sistema de roles (Administrador y Usuario)
  - Controles de acceso basados en roles
  - El primer usuario registrado obtiene automáticamente rol de administrador

- **Panel principal con organización de enlaces**:
  - Agrupación de enlaces por categorías personalizables
  - Vista en tarjetas con íconos y descripciones
  - Detección automática de favicon para nuevas aplicaciones
  - Registro de último acceso a cada enlace

- **Gestión de favoritos**:
  - Marcado de enlaces como favoritos para acceso rápido
  - Sección dedicada para visualización de favoritos
  - Destacado visual de elementos favoritos en las listas

- **Historial de enlaces recientes**:
  - Seguimiento de los últimos enlaces visitados
  - Ordenación cronológica inversa (más recientes primero)
  - Acceso rápido al historial desde cualquier sección

- **Búsqueda avanzada**:
  - Búsqueda en tiempo real por título, descripción y URL
  - Filtros de búsqueda por categoría
  - Resultados destacados según relevancia

- **Administración completa**:
  - Panel de administración para gestionar usuarios
  - Asignación de roles (promoción/degradación)
  - Activación/desactivación de usuarios
  - Configuración global de la aplicación
  - Opción para mostrar/ocultar registro de nuevos usuarios

- **Características técnicas**:
  - Diseño responsive para dispositivos móviles y escritorio
  - Soporte para tema claro/oscuro con persistencia
  - Multilingüe (Español e Inglés) con detección automática
  - Almacenamiento seguro en Firebase, PostgreSQL o Supabase
  - Arquitectura de backend flexible con múltiples implementaciones de almacenamiento

- **Seguridad**:
  - Datos aislados por usuario para mantener privacidad
  - Validación de datos en cliente y servidor
  - Protección contra accesos no autorizados
  - Encriptación en tránsito mediante HTTPS

## Arquitectura Técnica

La aplicación utiliza una arquitectura moderna basada en:

- **Frontend**:
  - React con TypeScript para UI
  - Vite como bundler y servidor de desarrollo
  - React Query para gestión de estado y comunicación con API
  - Tailwind CSS con Shadcn UI para diseño visualmente atractivo
  - React Hook Form para manejo de formularios
  - i18next para internacionalización

- **Backend**:
  - Node.js con Express para API RESTful
  - Interfaz de almacenamiento abstracta (IStorage)
  - Implementaciones múltiples:
    - FirebaseStorage: Utiliza Firebase/Firestore
    - PostgresStorage: Utiliza PostgreSQL con Drizzle ORM
    - SupabaseStorage: Utiliza Supabase para datos y autenticación
    - MemStorage: Implementación en memoria para desarrollo rápido
  - Autenticación mediante Firebase Authentication
  - Comunicación segura con bases de datos

- **Almacenamiento de Datos**:
  - Estructura de datos jerárquica (Usuario > Categorías > Aplicaciones)
  - Colecciones basadas en documentos en Firestore
  - Tablas relacionales en PostgreSQL o Supabase
  - Transacciones atómicas para operaciones críticas
  - Abstracciones de consultas mediante APIs dedicadas

## Adaptabilidad y Escalabilidad

BMS está diseñado para adaptarse a diferentes escenarios:

- Configuración mediante variables de entorno
- Selección de base de datos mediante `BMS_DATABASE` (firebase/postgres/supabase/memory)
- Despliegue mediante Docker para entornos aislados y consistentes
- Arquitectura de múltiples capas para fácil extensibilidad
- Posibilidad de añadir nuevos proveedores de almacenamiento

## Despliegue Local

1. Instalar dependencias:
   ```
   npm install
   ```

2. Configurar variables de entorno:
   Crear un archivo `.env` en la raíz del proyecto con:
   ```
   # Firebase (obligatorio para autenticación)
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_PROJECT_ID=tu_project_id
   VITE_FIREBASE_APP_ID=tu_app_id
   
   # Base de datos (opcional)
   BMS_DATABASE=firebase    # O "postgres" o "memory"
   DATABASE_URL=postgres://usuario:contraseña@localhost:5432/bms    # Solo para PostgreSQL
   
   # Configuración de servidor (opcional)
   PORT=5000
   NODE_ENV=development
   ```

3. Iniciar el servidor de desarrollo:
   ```
   npm run dev
   ```

4. Abrir [http://localhost:5000](http://localhost:5000) en el navegador.

## Despliegue con Docker

### Opción 1: Dockerfile directo

1. Construir la imagen:
   ```
   docker build -t bookmark-manager-sync \
     --build-arg VITE_FIREBASE_API_KEY=tu_api_key \
     --build-arg VITE_FIREBASE_PROJECT_ID=tu_project_id \
     --build-arg VITE_FIREBASE_APP_ID=tu_app_id \
     .
   ```

2. Ejecutar el contenedor:
   ```
   docker run -p 5000:5000 \
     -e VITE_FIREBASE_API_KEY=tu_api_key \
     -e VITE_FIREBASE_PROJECT_ID=tu_project_id \
     -e VITE_FIREBASE_APP_ID=tu_app_id \
     -e BMS_DATABASE=firebase \
     bookmark-manager-sync
   ```

3. Acceder en [http://localhost:5000](http://localhost:5000)

### Opción 2: Docker Compose

1. Crear archivo `.env` con las credenciales necesarias
2. Ejecutar:
   ```
   docker-compose up -d
   ```
3. Acceder en [http://localhost:5000](http://localhost:5000)

## Configuración de Firebase

Para utilizar la aplicación con Firebase:

1. Ir a la [Consola de Firebase](https://console.firebase.google.com/)
2. Crear un nuevo proyecto
3. Añadir una aplicación web
4. Habilitar Autenticación con:
   - Email/Password para registro local
   - Google para inicio de sesión social
5. Habilitar Cloud Firestore con las siguientes colecciones (se crean automáticamente):
   - `users` - Información de usuarios
   - `categories` - Categorías de aplicaciones
   - `apps` - Aplicaciones individuales
   - `favorites` - Marcadores de favoritos
   - `accesses` - Registro de accesos a aplicaciones
   - `app_config` - Configuración global de la aplicación

6. Configurar reglas de seguridad:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /users/{userId}/categories/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /users/{userId}/apps/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /users/{userId}/favorites/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /users/{userId}/accesses/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /app_config/{document=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.token.role == 'admin';
       }
     }
   }
   ```

## Estructura del Proyecto

```
bookmark-manager-sync/
├── client/                 # Código de frontend
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── hooks/          # Custom hooks de React
│   │   ├── i18n/           # Archivos de internacionalización
│   │   ├── lib/            # Utilidades y lógica compartida
│   │   ├── pages/          # Páginas de la aplicación
│   │   └── styles/         # Estilos CSS globales
├── server/                 # Código de backend
│   ├── lib/                # Utilidades del servidor
│   ├── storage/            # Implementaciones de almacenamiento
│   │   ├── IStorage.ts     # Interfaz de almacenamiento
│   │   ├── StorageFactory.ts  # Fábrica para seleccionar implementación
│   │   ├── FirebaseStorage.ts # Implementación con Firebase
│   │   ├── PostgresStorage.ts # Implementación con PostgreSQL
│   │   └── MemStorage.ts   # Implementación en memoria
│   ├── index.ts            # Punto de entrada del servidor
│   └── routes.ts           # Definición de rutas API
├── shared/                 # Código compartido entre cliente y servidor
│   └── schema.ts           # Definiciones de esquemas y tipos
└── docker/                 # Configuración para Docker
```

## Licencia

MIT