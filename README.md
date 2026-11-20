# Catálogo Mecatrónico & Maqueta 3D

Aplicación de escritorio offline para PC orientada al dimensionamiento, catálogo técnico, cálculo de autonomía energética y ensamblaje 3D de proyectos mecatrónicos y de robótica embebida (robots móviles, micro-sumos, cucarachas robóticas, IoT y sistemas de control).

---

## Características Principales

### 1. Catálogo Técnico de Componentes
- **Base de datos con más de 60 componentes** organizados por categorías: Microcontroladores (ESP32, Arduino, XIAO), Sensores (LiDAR, ToF, Ultrasonido, IMU), Actuadores y Motores (N20, Servos, Steppers NEMA, DC), Drivers de Potencia (L298N, TB6612FNG, TMC2209), Gestión Energética, Baterías, Fuentes y Pasivos/Discretos.
- **Vistas comparativas:** Vista detallada de componentes con especificaciones completas y vista a **Escala Real**.
- **Dimensionamiento y Cotas:** Diagramas dimensionales vectoriales con regla milimétrica integrada (mm) y alternancia rápida con fotos reales del componente.
- **Datasheets y Documentación Técnica:** Acceso y descarga directa a hojas de datos en PDF.
- **Columnas personalizables y CRUD dinámico:** Agregar, editar o eliminar parámetros de hardware en tiempo real.

### 2. Calculadora de Autonomía Energética
- Selección dinámica de fuente/batería o ingreso manual de capacidad y voltaje.
- Adición de componentes y cargas típicas (continuas, intermitentes y picos).
- Resultados precisos de autonomía en **horas y minutos (h + min)** y consumo en **mA / A**.

### 3. Maqueta 3D Interactiva (Three.js)
- **Renderizado isométrico estilizado:** Materiales mate con sombras suaves, cuadrícula milimétrica y colores distintivos por categoría.
- **Inserción y manipulación:** Posicionamiento, rotación e interacción tipo *clay / toy-like* respetando las dimensiones reales de cada componente del catálogo.
- **Cableado visual multipunto:** Conexión de cables visuales flexibles con curvatura realista (Catenary / Catmull-Rom) y selección de colores (Rojo, Negro, Azul, Amarillo, Verde, etc.).
- **Persistencia y Proyectos:** Guardar y cargar maquetas directamente en SQLite local.
- **Importación y Exportación:**
  - Exportación de escenas completas en formato **GLB/glTF** y **STL** para impresión 3D o diseño CAD.
  - Exportación e importación de proyectos en formato **JSON**.
  - Subida de archivos STL propios para integrarlos al ensamblado.

---

## Requisitos de Instalación

- **Python 3.10+**
- Navegador web moderno (Chrome, Edge, Firefox, Brave) con soporte WebGL.

### Instalación de dependencias:
```bash
pip install -r requirements.txt
```

---

## Ejecución Rápida en Windows

Hacer doble clic en el archivo:
```bash
iniciar.bat
```
El script activará el entorno virtual local, iniciará el servidor backend FastAPI en `http://127.0.0.1:8000` y abrirá automáticamente la aplicación en tu navegador predeterminado.

---

## Estructura del Proyecto

```
catalogo/
├── app.py                # Servidor Backend FastAPI & endpoints REST
├── seed_data.py          # Semilla con especificaciones de 62 componentes
├── catalogo.db           # Base de datos SQLite
├── iniciar.bat           # Lanzador automático para Windows
├── requirements.txt      # Dependencias Python (FastAPI, Uvicorn, Multipart)
├── static/
│   ├── index.html        # Interfaz web principal
│   ├── styles.css        # Hoja de estilos moderna y responsive
│   ├── app.js            # Lógica del catálogo, filtros y calculadora
│   ├── maqueta3d.js      # Módulo 3D Three.js, cables y exportadores
│   └── vendor/           # Librerías Three.js r160 descargadas localmente
└── uploads/              # Almacenamiento local de fotos, cotas, datasheets y STL
```
