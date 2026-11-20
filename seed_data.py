"""
Datos iniciales (Seed) y generador de imágenes técnicas SVG con regla en milímetros
para el Catálogo Mecatrónico.
"""

import os
import re
import html
from pathlib import Path

ESCALAS = [
    {
        "codigo": "Escala 1",
        "titulo": "Escala 1: Micro / Cucaracha (< 5x5 cm)",
        "descripcion": "Robots insectos, wearables, micro-drones y PCBs ultracompactas",
    },
    {
        "codigo": "Escala 2",
        "titulo": "Escala 2: Pequeña / Escritorio (10-25 cm)",
        "descripcion": "Seguidores de línea, brazos mini, prototipos de escritorio",
    },
    {
        "codigo": "Escala 3",
        "titulo": "Escala 3: Mediana / Rover-CNC (30-70 cm)",
        "descripcion": "Rovers autónomos, impresoras 3D, CNC de escritorio, brazos medios",
    },
    {
        "codigo": "Escala 4",
        "titulo": "Escala 4: Grande / Humana-Vehículo (> 1 m)",
        "descripcion": "Vehículos eléctricos, automatización industrial, exoesqueletos",
    },
]

CATEGORIAS_ORDEN = [
    "ESP32",
    "Baterías",
    "Sensores de Distancia",
    "Servomotores",
    "Motores Paso a Paso",
    "Motores DC",
    "Drivers",
    "Resistencias",
    "Reguladores y Alimentación",
    "Electrónica Básica y Discretos",
    "Otros Sensores y Actuadores",
]

SEED_COMPONENTES = [
    # --- ESP32 ---
    {
        "categoria": "ESP32",
        "modelo": "ESP32 (Original DevKit V1)",
        "escala": "Escala 2",
        "dimensiones": "55 x 28 mm",
        "voltaje": "3.3V lógica (5V VIN/USB)",
        "especificaciones": "Dual-Core 240MHz, WiFi + BT + BLE, I máx: ~500mA pico WiFi (12mA/pin)",
        "precio_est": "S/ 25 - 35",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Robots WiFi/BT, domótica, control de rovers y telemetría.\nCONSIDERAR:\n- Pines solo toleran 3.3V (no conectar sensores de 5V directo).\n- Picos de transmisión WiFi alcanzan 400-500mA: usar fuente estable.\n- Pines GPIO 34-39 son solo entrada y no tienen pull-up interno.",
    },
    {
        "categoria": "ESP32",
        "modelo": "Seeed Studio XIAO ESP32-C3",
        "escala": "Escala 1",
        "dimensiones": "21 x 17.5 mm",
        "voltaje": "3.3V (5V USB / 3.7V LiPo)",
        "especificaciones": "RISC-V 160MHz, WiFi + BLE 5.0, Cargador LiPo, I máx: ~350mA pico",
        "precio_est": "S/ 35 - 50",
        "donde_encontrar": "Naylamp / AliExpress",
        "usos": "USOS: Robots micro/cucaracha, wearables, nodos IoT ultracompactos con batería.\nCONSIDERAR:\n- Incluye antena externa U.FL obligatoria para buen alcance WiFi/BLE.\n- Tiene solo 11 pines GPIO disponibles.\n- Carga LiPo por pads traseros (verificar polaridad antes de soldar).",
    },
    {
        "categoria": "ESP32",
        "modelo": "ESP32-C3 SuperMini",
        "escala": "Escala 1",
        "dimensiones": "22.5 x 18 mm",
        "voltaje": "3.3V (5V USB-C)",
        "especificaciones": "RISC-V 160MHz, WiFi + BLE 5.0, USB nativo, I máx: ~330mA pico",
        "precio_est": "S/ 15 - 25",
        "donde_encontrar": "Paruro / Mercado Libre",
        "usos": "USOS: Micro-robots económicos, reemplazo compacto de Arduino Nano con WiFi.\nCONSIDERAR:\n- La antena cerámica integrada es sensible a interferencia si va pegada a metal.\n- Para flashear la primera vez suele requerir mantener BOOT al conectar USB.",
    },
    {
        "categoria": "ESP32",
        "modelo": "ESP32-S3 DevKitC-1",
        "escala": "Escala 3",
        "dimensiones": "63 x 25 mm",
        "voltaje": "3.3V (5V USB-C)",
        "especificaciones": "Dual-Core 240MHz + PSRAM, IA/Cámaras, USB OTG, I máx: ~600mA pico",
        "precio_est": "S/ 45 - 75",
        "donde_encontrar": "Naylamp / AliExpress",
        "usos": "USOS: Visión artificial ligera, procesamiento de audio/voz, rovers avanzados.\nCONSIDERAR:\n- Tiene dos puertos USB-C (uno UART y otro USB OTG nativo).\n- Mayor consumo con PSRAM y cámara activa; dimensionar regulador de 1A.",
    },
    {
        "categoria": "ESP32",
        "modelo": "ESP32-S2 Mini",
        "escala": "Escala 2",
        "dimensiones": "34.3 x 25.4 mm",
        "voltaje": "3.3V (5V USB-C)",
        "especificaciones": "Single-Core 240MHz, WiFi, USB HID nativo (Sin BT), I máx: ~350mA",
        "precio_est": "S/ 18 - 28",
        "donde_encontrar": "Paruro / Mercado Libre",
        "usos": "USOS: Dispositivos USB HID (teclados/joysticks DIY), nodos WiFi económicos.\nCONSIDERAR:\n- NO tiene Bluetooth.\n- Formato compatible con shields de Wemos D1 Mini.",
    },
    {
        "categoria": "ESP32",
        "modelo": "ESP32-C6 DevKit",
        "escala": "Escala 2",
        "dimensiones": "51.8 x 25.4 mm",
        "voltaje": "3.3V (5V USB-C)",
        "especificaciones": "RISC-V 160MHz, WiFi 6 + BLE 5.0 + Zigbee/Thread, I máx: ~400mA",
        "precio_est": "S/ 40 - 60",
        "donde_encontrar": "AliExpress / Naylamp",
        "usos": "USOS: Domótica Matter/Zigbee, redes mesh de sensores de bajo consumo.\nCONSIDERAR:\n- Requiere ESP-IDF v5.1+ o Arduino Core v3.x.",
    },
    {
        "categoria": "ESP32",
        "modelo": "ESP32-H2",
        "escala": "Escala 1",
        "dimensiones": "25 x 18 mm",
        "voltaje": "3.3V",
        "especificaciones": "RISC-V 96MHz, Solo BLE + Zigbee/Thread (Sin WiFi), I máx: ~150mA",
        "precio_est": "S/ 30 - 45",
        "donde_encontrar": "AliExpress",
        "usos": "USOS: Sensores inalámbricos a batería de muy larga duración.\nCONSIDERAR:\n- NO tiene WiFi; ideal si usas un hub Zigbee o comunicación BLE.",
    },
    {
        "categoria": "ESP32",
        "modelo": "ESP32-P4",
        "escala": "Escala 4",
        "dimensiones": "65 x 30 mm",
        "voltaje": "3.3V (5V USB)",
        "especificaciones": "Dual-Core 400MHz, MIPI-CSI/DSI, HMI (Sin radio), I máx: ~800mA",
        "precio_est": "S/ 80 - 120",
        "donde_encontrar": "AliExpress",
        "usos": "USOS: Pantallas industriales HMI, procesamiento de video HD sin radio.\nCONSIDERAR:\n- No incluye WiFi/BT integrado (requiere coprocesador ESP32-C6 si se necesita red).",
    },
    {
        "categoria": "ESP32",
        "modelo": "ESP32-CAM (AI-Thinker OV2640)",
        "escala": "Escala 2",
        "dimensiones": "40.5 x 27 x 4.5 mm",
        "voltaje": "5V (3.3V interno)",
        "especificaciones": "Cámara 2MP + microSD + Flash LED, WiFi, I máx: ~600mA (con flash)",
        "precio_est": "S/ 30 - 45",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Streaming FPV en rovers, timelapses, reconocimiento de QR/colores.\nCONSIDERAR:\n- No tiene puerto USB: usar adaptador FTDI o base ESP32-CAM-MB.\n- Alimentar por pin 5V con al menos 1A; con 3.3V suele reiniciarse por brownout.",
    },

    # --- Baterías ---
    {
        "categoria": "Baterías",
        "modelo": "LiPo 1S 502030 / 602035 (250-400mAh)",
        "escala": "Escala 1",
        "dimensiones": "20 x 30 x 5 mm",
        "voltaje": "3.7V nom (4.2V máx)",
        "especificaciones": "250-400mAh, BMS integrado, Descarga máx: ~1C-2C (0.5A - 0.8A)",
        "precio_est": "S/ 15 - 25",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Micro-robots, wearables, módulos ESP32-C3 portátiles.\nCONSIDERAR:\n- No perforar ni doblar la bolsa.\n- Cargar máximo a 4.2V con TP4056 ajustado a <= 300mA.",
    },
    {
        "categoria": "Baterías",
        "modelo": "Celda 18650 (2x en serie)",
        "escala": "Escala 2",
        "dimensiones": "65 x 18 mm (c/u)",
        "voltaje": "7.4V nom (8.4V máx)",
        "especificaciones": "2200-3000mAh, Li-Ion, Descarga máx: 5A - 15A (según celda)",
        "precio_est": "S/ 20 - 45",
        "donde_encontrar": "Paruro / Mercado Libre",
        "usos": "USOS: Carritos seguidores de línea, brazos mini, proyectos con L298N/TB6612.\nCONSIDERAR:\n- Usar portabaterías de buena presión o soldadura por puntos (no soldar directo con cautín).\n- Usar BMS 2S si se cargan en serie.",
    },
    {
        "categoria": "Baterías",
        "modelo": "LiPo 3S 2200mAh - 5000mAh",
        "escala": "Escala 3",
        "dimensiones": "105 x 35 x 25 mm",
        "voltaje": "11.1V nom (12.6V máx)",
        "especificaciones": "2200-5000mAh, Alta descarga 30C+, I máx: 66A - 150A continuos",
        "precio_est": "S/ 90 - 180",
        "donde_encontrar": "Tiendas RC / Paruro",
        "usos": "USOS: Rovers medianos, drones, motores DC 12V de alto torque, steppers.\nCONSIDERAR:\n- NUNCA descargar por debajo de 9.9V (3.3V por celda) o se daña irreversiblemente.\n- Usar cargador balanceador (ej. IMAX B6) y conector XT60.",
    },
    {
        "categoria": "Baterías",
        "modelo": "LiFePO4 12V / 24V (20Ah-100Ah)",
        "escala": "Escala 4",
        "dimensiones": "180 x 77 x 167 mm",
        "voltaje": "12.8V / 25.6V nom",
        "especificaciones": "20Ah-100Ah, Ciclo profundo (>3000 ciclos), I máx: 20A - 100A BMS",
        "precio_est": "S/ 350 - 2500",
        "donde_encontrar": "Importadores solares / ML",
        "usos": "USOS: Vehículos eléctricos, robots de carga, sistemas solares autónomos.\nCONSIDERAR:\n- Química mucho más segura que LiPo ante golpes o calor.\n- Requiere cargador específico LiFePO4 (14.4V para 12V).",
    },
    {
        "categoria": "Baterías",
        "modelo": "LiPo 2S 7.4V 1000-1500mAh",
        "escala": "Escala 2",
        "dimensiones": "70 x 35 x 14 mm",
        "voltaje": "7.4V nom (8.4V máx)",
        "especificaciones": "1000-1500mAh, 20C-25C, Conector XT30/JST, I máx: 20A - 37A",
        "precio_est": "S/ 45 - 75",
        "donde_encontrar": "Tiendas RC / Mercado Libre",
        "usos": "USOS: Robots sumo mini, arañas hexápodas con varios servos MG90S.\nCONSIDERAR:\n- Usar alarma LiPo (buzzer de voltaje) para no bajar de 6.6V en uso.",
    },

    # --- Sensores de Distancia ---
    {
        "categoria": "Sensores de Distancia",
        "modelo": "Láser ToF VL53L0X / VL53L1X",
        "escala": "Escala 1",
        "dimensiones": "13 x 18 mm",
        "voltaje": "3.3V - 5V",
        "especificaciones": "Láser ToF I2C, Rango 2m (L0X) - 4m (L1X), I máx: ~40mA",
        "precio_est": "S/ 18 - 35",
        "donde_encontrar": "Naylamp / Paruro",
        "usos": "USOS: Laberintos micromouse, detección precisa en micro-robots.\nCONSIDERAR:\n- Si usas varios en el mismo bus I2C, cambiar dirección con el pin XSHUT.\n- Retirar el film protector amarillo del sensor óptico antes de probar.",
    },
    {
        "categoria": "Sensores de Distancia",
        "modelo": "Ultrasónico HC-SR04",
        "escala": "Escala 2",
        "dimensiones": "45 x 20 x 15 mm",
        "voltaje": "5V",
        "especificaciones": "Trigger/Echo, Rango 2cm - 4m, Ángulo ~15°, I máx: 15mA",
        "precio_est": "S/ 8 - 12",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Evasor de obstáculos básico, medición de nivel en tanques.\nCONSIDERAR:\n- El pin ECHO entrega 5V: usar divisor resistivo si se conecta a ESP32 (3.3V).\n- Superficies blandas (tela/espuma) o muy inclinadas absorben/desvían el eco.",
    },
    {
        "categoria": "Sensores de Distancia",
        "modelo": "Infrarrojo Sharp GP2Y0A21",
        "escala": "Escala 2",
        "dimensiones": "44.5 x 18.9 x 13.5 mm",
        "voltaje": "4.5V - 5.5V",
        "especificaciones": "Salida analógica no lineal, Rango 10-80cm, I máx: 40mA (picos 200mA)",
        "precio_est": "S/ 25 - 35",
        "donde_encontrar": "Naylamp / Paruro",
        "usos": "USOS: Robots sumo (detección rápida sin interferencia ultrasónica).\nCONSIDERAR:\n- Poner un capacitor de 10uF-100uF entre VCC y GND cerca del sensor para evitar ruido.\n- La salida es curva (requiere tabla o fórmula de linealización).",
    },
    {
        "categoria": "Sensores de Distancia",
        "modelo": "RPLIDAR A1 (360°)",
        "escala": "Escala 3",
        "dimensiones": "Ø 70 x 41 mm",
        "voltaje": "5V",
        "especificaciones": "UART 115200/256000 bps, Escaneo 360° hasta 12m, I máx: ~600mA",
        "precio_est": "S/ 380 - 480",
        "donde_encontrar": "Naylamp / AliExpress",
        "usos": "USOS: Mapeo SLAM con ROS2, navegación autónoma en interiores.\nCONSIDERAR:\n- Requiere fuente de 5V dedicada de al menos 1A (el motor del rotor consume al arrancar).\n- No funciona bien bajo luz solar directa intensa.",
    },
    {
        "categoria": "Sensores de Distancia",
        "modelo": "TFmini-S LiDAR",
        "escala": "Escala 4",
        "dimensiones": "42 x 15 x 16 mm",
        "voltaje": "5V",
        "especificaciones": "UART / I2C, Alcance 0.1m - 12m, 100Hz, I máx: 140mA (pico 200mA)",
        "precio_est": "S/ 160 - 220",
        "donde_encontrar": "AliExpress / Naylamp",
        "usos": "USOS: Altímetro en drones, detección de largo alcance en vehículos.\nCONSIDERAR:\n- Señales UART trabajan a 3.3V (compatible directo con ESP32, aunque VCC sea 5V).",
    },

    # --- Servomotores ---
    {
        "categoria": "Servomotores",
        "modelo": "Sub-micro Servo 1.7g / 3.7g",
        "escala": "Escala 1",
        "dimensiones": "13 x 6 x 17 mm",
        "voltaje": "3.7V - 4.2V",
        "especificaciones": "Torque ~0.1 - 0.5 kg·cm, PWM 50Hz, I máx (stall): ~350mA",
        "precio_est": "S/ 18 - 30",
        "donde_encontrar": "AliExpress / Tiendas RC",
        "usos": "USOS: Micro-aviones RC, pinzas diminutas, mecanismos de micro-robots.\nCONSIDERAR:\n- Engranajes de plástico muy frágiles ante trabas mecánicas.",
    },
    {
        "categoria": "Servomotores",
        "modelo": "SG90 / MG90S",
        "escala": "Escala 2",
        "dimensiones": "23 x 12.2 x 29 mm",
        "voltaje": "4.8V - 6V",
        "especificaciones": "Torque 1.8 - 2.2 kg·cm, PWM 50Hz, I máx (stall): 650mA - 800mA",
        "precio_est": "S/ 10 - 18",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Brazos robóticos ligeros, pan-tilt de cámara, compuertas.\nCONSIDERAR:\n- NUNCA alimentar varios servos desde el pin 5V del Arduino/ESP32.\n- Preferir MG90S (piñonería metálica) sobre SG90 si habrá carga.",
    },
    {
        "categoria": "Servomotores",
        "modelo": "MG996R / DS3218",
        "escala": "Escala 3",
        "dimensiones": "40 x 20 x 40.5 mm",
        "voltaje": "4.8V - 7.2V",
        "especificaciones": "Torque 10 - 20 kg·cm, Piñonería metálica, I máx (stall): 2.5A - 3.2A",
        "precio_est": "S/ 25 - 65",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Brazos robóticos medianos, dirección de rovers, cuadrúpedos.\nCONSIDERAR:\n- En bloqueo (stall) cada servo puede pedir hasta 2.5A+: usar Buck 5A o BEC dedicado.\n- Unir GND de la fuente de servos con GND del microcontrolador.",
    },
    {
        "categoria": "Servomotores",
        "modelo": "Servo Serial Bus STS3215 (30 kg·cm)",
        "escala": "Escala 3",
        "dimensiones": "45.2 x 24.7 x 35 mm",
        "voltaje": "6V - 12.6V",
        "especificaciones": "UART Daisy-Chain, Feedback 360° posición/carga, I máx: ~2.7A",
        "precio_est": "S/ 85 - 120",
        "donde_encontrar": "AliExpress",
        "usos": "USOS: Brazos robóticos de precisión (SO-100), bípedos, robótica educativa.\nCONSIDERAR:\n- Requiere placa conversora TTL Half-Duplex (no es PWM estándar).\n- Se conectan en cadena reduciendo cableado.",
    },

    # --- Motores Paso a Paso ---
    {
        "categoria": "Motores Paso a Paso",
        "modelo": "28BYJ-48 (con reductora)",
        "escala": "Escala 2",
        "dimensiones": "Ø 28 x 19 mm",
        "voltaje": "5V (o 12V según variante)",
        "especificaciones": "Unipolar 4 fases, Reducción 1:64, I máx: ~250mA por bobina",
        "precio_est": "S/ 12 - 18",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Relojes, persianas livianas, dosificadores lentos de bajo torque.\nCONSIDERAR:\n- Velocidad máxima muy baja (~15 RPM).\n- Se suele vender en kit con el driver ULN2003.",
    },
    {
        "categoria": "Motores Paso a Paso",
        "modelo": "NEMA 17 (1.8°/paso)",
        "escala": "Escala 3",
        "dimensiones": "42 x 42 x 40 mm",
        "voltaje": "12V - 24V (en driver)",
        "especificaciones": "Bipolar 200 pasos/rev, Torque ~0.4 Nm, I máx: 1.5A - 2.0A / fase",
        "precio_est": "S/ 45 - 65",
        "donde_encontrar": "Naylamp / Paruro",
        "usos": "USOS: Impresoras 3D, plotters, CNC láser/router ligero, sliders.\nCONSIDERAR:\n- Siempre regular el límite de corriente (Vref) en el driver (A4988/TMC2209).\n- NUNCA desconectar los cables del motor con el driver energizado (quema el driver).",
    },
    {
        "categoria": "Motores Paso a Paso",
        "modelo": "NEMA 23 / NEMA 34",
        "escala": "Escala 4",
        "dimensiones": "57x57x76 / 86x86x114 mm",
        "voltaje": "24V - 48V (en driver)",
        "especificaciones": "Alto torque 1.2 - 8 Nm, Bipolar, I máx: 3.0A - 6.0A / fase",
        "precio_est": "S/ 140 - 380",
        "donde_encontrar": "Paruro / Importadores CNC",
        "usos": "USOS: Fresadoras CNC de aluminio/madera, ejes pesados, automatización.\nCONSIDERAR:\n- Usar drivers industriales tipo DM542/DM860H con fuente switching 24V-48V.",
    },

    # --- Motores DC ---
    {
        "categoria": "Motores DC",
        "modelo": "Micro-motorreductor N20",
        "escala": "Escala 1",
        "dimensiones": "24 x 12 x 10 mm",
        "voltaje": "3V - 6V (hay versión 12V)",
        "especificaciones": "Caja reductora metálica (50-1000 RPM), I máx (stall): ~0.8A - 1.6A",
        "precio_est": "S/ 18 - 30",
        "donde_encontrar": "Naylamp / Paruro",
        "usos": "USOS: Seguidores de línea velocistas, micromouse, mini sumo.\nCONSIDERAR:\n- Elegir las RPM según tu proyecto (1000 RPM para velocista, 100-200 RPM para fuerza).\n- Soldar capacitor cerámico de 100nF entre terminales para reducir ruido eléctrico.",
    },
    {
        "categoria": "Motores DC",
        "modelo": "Motorreductor amarillo TT",
        "escala": "Escala 2",
        "dimensiones": "70 x 22 x 18 mm",
        "voltaje": "3V - 6V",
        "especificaciones": "Reducción 1:48, Eje doble plástico, I máx (stall): ~1.2A",
        "precio_est": "S/ 8 - 12",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Carritos educativos Arduino/ESP32, evasores de obstáculos.\nCONSIDERAR:\n- Engranajes plásticos se barren si el robot es muy pesado o choca fuerte.",
    },
    {
        "categoria": "Motores DC",
        "modelo": "Motorreductor metálico 25GA / 37GB",
        "escala": "Escala 3",
        "dimensiones": "Ø 25-37 x 65 mm",
        "voltaje": "12V (o 24V)",
        "especificaciones": "Caja metálica + Encoder cuadratura, I máx (stall): 3.0A - 5.5A",
        "precio_est": "S/ 45 - 95",
        "donde_encontrar": "Naylamp / AliExpress",
        "usos": "USOS: Rovers todo terreno, robots con control PID de velocidad/odometría.\nCONSIDERAR:\n- El encoder requiere alimentación de 3.3V o 5V aparte de los 12V del motor.",
    },
    {
        "categoria": "Motores DC",
        "modelo": "Motor BLDC Hub / Actuador Lineal",
        "escala": "Escala 4",
        "dimensiones": "Ø 150-250 mm",
        "voltaje": "24V - 48V",
        "especificaciones": "250W - 1000W, Sensores Hall, I máx: 15A - 45A continuos",
        "precio_est": "S/ 250 - 800",
        "donde_encontrar": "AliExpress / Mercado Libre",
        "usos": "USOS: Scooters, sillas motorizadas, robots de reparto pesados.\nCONSIDERAR:\n- Requiere controlador BLDC (VESC / ODrive / controlador e-bike) con frenado regenerativo.",
    },

    # --- Drivers ---
    {
        "categoria": "Drivers",
        "modelo": "L298N (Módulo Puente H Doble)",
        "escala": "Escala 2",
        "dimensiones": "43 x 43 x 27 mm",
        "voltaje": "5V - 35V (lógica 5V)",
        "especificaciones": "Doble Puente H BJT, Disipador aluminio, Regulador 5V, I máx: 2A/canal (3A pico)",
        "precio_est": "S/ 10 - 16",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Control de 2 motores DC (carritos TT/25GA) o 1 motor paso a paso bipolar.\nCONSIDERAR:\n- Pierde ~1.8V a 2V por caída interna en transistores (si usas batería 7.4V, llegan ~5.4V al motor).\n- El jumper de regulador 5V solo debe estar puesto si la entrada VMS es <= 12V.\n- Conectar GND común entre la batería, el L298N y el ESP32/Arduino.",
    },
    {
        "categoria": "Drivers",
        "modelo": "DRV8833 / MX1508",
        "escala": "Escala 1",
        "dimensiones": "18 x 21 mm",
        "voltaje": "2.7V - 10.8V",
        "especificaciones": "Doble Puente H MOSFET, I máx: 1.5A por canal (2A pico)",
        "precio_est": "S/ 8 - 15",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Motores N20 y TT en robots alimentados con 1S/2S LiPo.\nCONSIDERAR:\n- Mucho más eficiente que el L298N (casi no calienta ni pierde voltaje).\n- En DRV8833 el pin EEP debe ir a HIGH (o puenteado) para habilitar.",
    },
    {
        "categoria": "Drivers",
        "modelo": "TB6612FNG / L298N / ULN2003",
        "escala": "Escala 2",
        "dimensiones": "20x20 / 43x43 mm",
        "voltaje": "5V - 35V (L298N) / 2.5-13.5V (TB)",
        "especificaciones": "Doble Puente H / Darlington, I máx: 1.2A cont (TB6612) / 2A (L298N)",
        "precio_est": "S/ 10 - 18",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Carritos escolares, control de 2 motores DC o 1 stepper pequeño.\nCONSIDERAR:\n- El L298N pierde ~2V en sus transistores (si metes 7.4V, llegan ~5.4V al motor).\n- Preferir TB6612FNG para proyectos a batería.",
    },
    {
        "categoria": "Drivers",
        "modelo": "TMC2209 / A4988 / BTS7960",
        "escala": "Escala 3",
        "dimensiones": "15x20 / 50x50 mm",
        "voltaje": "8V - 35V (Stepper) / 6-27V (BTS)",
        "especificaciones": "Microstepping 256 (TMC) / Puente H DC, I máx: 2A (TMC) / 43A (BTS7960)",
        "precio_est": "S/ 12 - 45",
        "donde_encontrar": "Naylamp / Paruro",
        "usos": "USOS: TMC2209/A4988 para NEMA 17 silenciosos; BTS7960 para motores DC pesados.\nCONSIDERAR:\n- Poner siempre el disipador de aluminio en el chip.\n- En BTS7960 conectar R_EN y L_EN a 5V/3.3V para habilitar.",
    },
    {
        "categoria": "Drivers",
        "modelo": "TB6600 / DM542 / VESC",
        "escala": "Escala 4",
        "dimensiones": "118 x 75 x 34 mm",
        "voltaje": "12V - 48V",
        "especificaciones": "Entradas optoacopladas, I máx: 4.2A (Stepper) / 50A-100A (VESC BLDC)",
        "precio_est": "S/ 65 - 450",
        "donde_encontrar": "Naylamp / AliExpress",
        "usos": "USOS: CNC con NEMA 23/34 (TB6600/DM542) o tracción BLDC (VESC).\nCONSIDERAR:\n- Configurar los DIP switches de corriente antes de encender según tu motor.",
    },
    {
        "categoria": "Drivers",
        "modelo": "PCA9685 (16-ch PWM Servo Driver)",
        "escala": "Escala 2",
        "dimensiones": "62 x 25 mm",
        "voltaje": "3.3V-5V lógica / 5-6V servos",
        "especificaciones": "I2C, 16 canales PWM 12-bit, I máx bornera: ~10A totales",
        "precio_est": "S/ 15 - 25",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Hexápodos, brazos de 6+ DOF, matrices de LEDs.\nCONSIDERAR:\n- La bornera azul alimenta SOLO los servos; el ESP32 va por VCC lógico.",
    },

    # --- Resistencias ---
    {
        "categoria": "Resistencias",
        "modelo": "SMD 0805 / 0603 / 0402 (tamaño arroz)",
        "escala": "Escala 1",
        "dimensiones": "2.0x1.25 / 1.6x0.8 / 1.0x0.5 mm",
        "voltaje": "50V - 150V máx",
        "especificaciones": "Montaje superficial, Potencia: 1/8W - 1/16W, I máx: ~20-100mA",
        "precio_est": "S/ 5 - 10 (tira)",
        "donde_encontrar": "Paruro (galerías)",
        "usos": "USOS: PCBs diseñadas en KiCad/EasyEDA de tamaño reducido.\nCONSIDERAR:\n- 0805 se puede soldar a mano con cautín fino; 0402 requiere pistola de aire caliente y pinzas.",
    },
    {
        "categoria": "Resistencias",
        "modelo": "Through-Hole (THT) Carbón/Metal",
        "escala": "Escala 2",
        "dimensiones": "6.5 x 2.3 mm (cuerpo)",
        "voltaje": "200V - 250V máx",
        "especificaciones": "1/4W - 1/2W, Bandas de color, I máx típica: ~50mA (a 100Ω)",
        "precio_est": "S/ 0.10 - 0.20",
        "donde_encontrar": "Paruro / Tiendas locales",
        "usos": "USOS: Protoboard, limitación de LEDs (220Ω-330Ω), pull-up/down (10kΩ), divisores.\nCONSIDERAR:\n- Verificar potencia disipada P = I²·R para no exceder 0.25W.",
    },
    {
        "categoria": "Resistencias",
        "modelo": "Cerámica de potencia",
        "escala": "Escala 3",
        "dimensiones": "22 x 9 x 9 mm",
        "voltaje": "300V máx",
        "especificaciones": "Cuerpo cerámico, Potencia: 2W - 10W, I máx: según valor (ej. 1A-5A)",
        "precio_est": "S/ 1 - 3",
        "donde_encontrar": "Paruro",
        "usos": "USOS: Cargas de prueba, limitación de corriente en motores/fuentes, frenado.\nCONSIDERAR:\n- Alcanzan temperaturas altas (>80°C) en uso continuo; separarlas de plásticos y cables.",
    },
    {
        "categoria": "Resistencias",
        "modelo": "Carcasa Aluminio / Shunt",
        "escala": "Escala 4",
        "dimensiones": "50 x 27 x 15 mm",
        "voltaje": "500V máx",
        "especificaciones": "Con aletas disipadoras, Potencia: 25W - 100W, I máx: 5A - 50A+",
        "precio_est": "S/ 10 - 30",
        "donde_encontrar": "Paruro / Las Malvinas",
        "usos": "USOS: Frenado regenerativo CNC/VESC, medición de altas corrientes (shunt).\nCONSIDERAR:\n- Atornillar a un chasis metálico con pasta térmica para lograr la potencia nominal.",
    },

    # --- Reguladores y Alimentación ---
    {
        "categoria": "Reguladores y Alimentación",
        "modelo": "Mini Buck MP1584EN / Mini360",
        "escala": "Escala 1",
        "dimensiones": "17 x 11 x 3.8 mm",
        "voltaje": "In: 4.75-23V / Out: 1-17V",
        "especificaciones": "Step-Down alta frecuencia, I máx: 1.8A cont (3A pico)",
        "precio_est": "S/ 6 - 12",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Bajar de LiPo 2S/3S a 5V o 3.3V dentro de robots muy pequeños.\nCONSIDERAR:\n- Ajustar el potenciómetro con multímetro ANTES de conectar el ESP32 (no girar de golpe).",
    },
    {
        "categoria": "Reguladores y Alimentación",
        "modelo": "LM2596 Step-Down (Buck)",
        "escala": "Escala 2",
        "dimensiones": "43 x 21 x 14 mm",
        "voltaje": "In: 4-35V / Out: 1.25-30V",
        "especificaciones": "Step-Down clásico, Eficiencia ~85%, I máx: 2A cont (3A c/ disipador)",
        "precio_est": "S/ 8 - 14",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Alimentar ESP32, sensores o servos pequeños desde batería 12V.\nCONSIDERAR:\n- Requiere al menos 2V más en la entrada que en la salida.\n- El potenciómetro multivuelta puede requerir 10+ vueltas para empezar a bajar voltaje.",
    },
    {
        "categoria": "Reguladores y Alimentación",
        "modelo": "XL4015 Buck 5A (con Voltímetro)",
        "escala": "Escala 3",
        "dimensiones": "61 x 36 x 18 mm",
        "voltaje": "In: 4-38V / Out: 1.25-36V",
        "especificaciones": "Buck CC/CV 75W, I máx: 4A cont (5A pico)",
        "precio_est": "S/ 18 - 30",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Alimentar múltiples servos MG996R, tiras LED o cargar baterías.\nCONSIDERAR:\n- Si se usa continuo a >3.5A, añadir ventilación o disipador extra.",
    },
    {
        "categoria": "Reguladores y Alimentación",
        "modelo": "Cargador TP4056 USB-C + Protección",
        "escala": "Escala 1",
        "dimensiones": "26 x 17 mm",
        "voltaje": "In: 5V USB-C / Out: 4.2V",
        "especificaciones": "Carga Li-Ion/LiPo 1S + Corte sobredescarga DW01A, I máx carga: 1A",
        "precio_est": "S/ 4 - 8",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Cargar celdas 18650 o LiPo 1S de forma segura.\nCONSIDERAR:\n- Para LiPo pequeñas (<500mAh), cambiar la resistencia Rprog (R3) para bajar de 1A a 200-400mA.",
    },

    # --- Electrónica Básica y Discretos ---
    {
        "categoria": "Electrónica Básica y Discretos",
        "modelo": "LED 5mm / 3mm (Indicador)",
        "escala": "Escala 1",
        "dimensiones": "Ø 5 x 8.6 mm",
        "voltaje": "1.8V - 3.3V (según color)",
        "especificaciones": "Rojo/Amarillo ~2.0V, Azul/Blanco ~3.2V, I rec: 10-20mA (I máx: 20mA)",
        "precio_est": "S/ 0.10 - 0.30",
        "donde_encontrar": "Paruro / Tiendas locales",
        "usos": "USOS: Indicadores de encendido, estado WiFi, depuración de señales GPIO.\nCONSIDERAR:\n- SIEMPRE usar resistencia en serie (220Ω-330Ω a 5V, 100Ω-150Ω a 3.3V).\n- Pata larga es Ánodo (+), lado plano del encapsulado es Cátodo (-).",
    },
    {
        "categoria": "Electrónica Básica y Discretos",
        "modelo": "Potenciómetro Lineal 10kΩ (WH148)",
        "escala": "Escala 2",
        "dimensiones": "Ø 17 x 24 mm",
        "voltaje": "0V - 5V (analógico)",
        "especificaciones": "10kΩ lineal (B10K), Eje 6mm, Potencia: 0.5W, I máx consumo: ~0.5mA",
        "precio_est": "S/ 1.50 - 3",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Control de velocidad PWM, ángulo de servos, ajuste de parámetros/menús.\nCONSIDERAR:\n- Conectar extremos a VCC (3.3V en ESP32) y GND, y el pin central al pin ADC.",
    },
    {
        "categoria": "Electrónica Básica y Discretos",
        "modelo": "TRIAC BT136 + Optotriac MOC3021",
        "escala": "Escala 3",
        "dimensiones": "25 x 15 x 18 mm",
        "voltaje": "3.3V-5V (LED opto) / 220V AC (carga)",
        "especificaciones": "Control AC 600V, I máx carga: 4A (BT136) / 16A (BTA16), I LED: 15mA",
        "precio_est": "S/ 4 - 8 (par)",
        "donde_encontrar": "Paruro",
        "usos": "USOS: Dimmer AC para focos, control de calefactores o motores AC desde ESP32/Arduino.\nCONSIDERAR:\n- El MOC3021 aísla eléctricamente la parte de 220V AC del microcontrolador.\n- Para cargas inductivas (motores AC), agregar red snubber RC en paralelo al TRIAC.",
    },
    {
        "categoria": "Electrónica Básica y Discretos",
        "modelo": "MOSFET Canal-N IRLZ44N / IRF520",
        "escala": "Escala 2",
        "dimensiones": "15 x 10 x 4.5 mm (TO-220)",
        "voltaje": "Lógica 3.3V-5V (IRLZ44N) / Carga hasta 55V",
        "especificaciones": "Switch DC baja Rds(on), I máx: 47A (con disipador, ~10A sin disipador)",
        "precio_est": "S/ 3 - 6",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Encender motores DC en un sentido, tiras LED 12V, solenoides, bombas.\nCONSIDERAR:\n- Preferir IRLZ44N (Logic Level) para 3.3V/5V; el IRF520 no satura bien a 3.3V.\n- Poner resistencia pull-down de 10kΩ en Gate y diodo flyback en cargas inductivas.",
    },
    {
        "categoria": "Electrónica Básica y Discretos",
        "modelo": "Buzzer Activo / Pasivo 5V",
        "escala": "Escala 1",
        "dimensiones": "Ø 12 x 9.5 mm",
        "voltaje": "3.3V - 5V",
        "especificaciones": "Activo (tono fijo) / Pasivo (tonos PWM), ~85dB, I máx: ~30mA",
        "precio_est": "S/ 1.50 - 3",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Alarmas de batería baja, confirmación de botones, melodías.\nCONSIDERAR:\n- Si consume >20mA y usas ESP32 (máx 12mA/pin), manejarlo con un transistor NPN.",
    },
    {
        "categoria": "Electrónica Básica y Discretos",
        "modelo": "Pulsador Táctil 6x6mm / Switch",
        "escala": "Escala 1",
        "dimensiones": "6 x 6 x 5 mm",
        "voltaje": "3.3V - 12V (señal)",
        "especificaciones": "Contacto momentáneo SPST, I máx: 50mA (señal)",
        "precio_est": "S/ 0.20 - 0.50",
        "donde_encontrar": "Paruro / Tiendas locales",
        "usos": "USOS: Botón de inicio/parada, reset, cambio de modo, interfaz humana.\nCONSIDERAR:\n- Activar INPUT_PULLUP interno en el microcontrolador para ahorrar resistencia externa.",
    },
    {
        "categoria": "Electrónica Básica y Discretos",
        "modelo": "Capacitor Electrolítico 470uF-1000uF + 100nF",
        "escala": "Escala 2",
        "dimensiones": "Ø 10 x 16 mm",
        "voltaje": "16V - 35V máx",
        "especificaciones": "Filtro de alimentación / desacople, Reduce picos y brownouts, I fuga: <1mA",
        "precio_est": "S/ 0.50 - 1.50",
        "donde_encontrar": "Paruro",
        "usos": "USOS: Estabilizar voltaje cerca de servos, ESP32-CAM, drivers y sensores Sharp.\nCONSIDERAR:\n- Respetar polaridad (franja blanca/gris es Negativo -) o puede explotar.",
    },
    {
        "categoria": "Electrónica Básica y Discretos",
        "modelo": "Diodo 1N4007 / Schottky 1N5819",
        "escala": "Escala 1",
        "dimensiones": "Ø 2.7 x 5.2 mm",
        "voltaje": "Hasta 1000V (4007) / 40V (5819)",
        "especificaciones": "Protección polaridad inversa y flyback, I máx: 1A continuo (30A pico)",
        "precio_est": "S/ 0.20 - 0.50",
        "donde_encontrar": "Paruro",
        "usos": "USOS: Diodo flyback en paralelo a relés/motores/solenoides para proteger drivers.\nCONSIDERAR:\n- La banda plateada indica el Cátodo (-). En flyback va conectado al Positivo (+).",
    },
    {
        "categoria": "Electrónica Básica y Discretos",
        "modelo": "Transistor NPN 2N2222 / BC547",
        "escala": "Escala 1",
        "dimensiones": "4.5 x 3.5 x 4.5 mm (TO-92)",
        "voltaje": "Hasta 40V-45V",
        "especificaciones": "Switch de baja potencia / amplificador, I máx: 600mA (2N2222) / 100mA (BC547)",
        "precio_est": "S/ 0.30 - 0.80",
        "donde_encontrar": "Paruro",
        "usos": "USOS: Encender buzzers, tiras cortas de LEDs o relés desde un pin de 3.3V.\nCONSIDERAR:\n- Usar resistencia de 1kΩ en la Base para limitar la corriente que sale del GPIO.",
    },

    # --- Otros Sensores y Actuadores ---
    {
        "categoria": "Otros Sensores y Actuadores",
        "modelo": "IMU MPU6050 + Micro final de carrera",
        "escala": "Escala 1",
        "dimensiones": "15 x 20 mm",
        "voltaje": "3.3V - 5V",
        "especificaciones": "Acelerómetro + Giroscopio 6 ejes I2C, I máx: ~4mA",
        "precio_est": "S/ 10 - 15",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Robots auto-balanceados, detección de inclinación, homing CNC.\nCONSIDERAR:\n- Calibrar offsets en reposo al iniciar; el giroscopio sufre deriva (drift) en guiñada (yaw).",
    },
    {
        "categoria": "Otros Sensores y Actuadores",
        "modelo": "OLED 0.96\" I2C + Sensor TCRT5000",
        "escala": "Escala 2",
        "dimensiones": "27 x 27 mm",
        "voltaje": "3.3V - 5V",
        "especificaciones": "Pantalla 128x64 SSD1306 + IR reflectivo, I máx: ~25mA",
        "precio_est": "S/ 12 - 20",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Telemetría local en robots, seguidores de línea blanca/negra.\nCONSIDERAR:\n- Verificar orden de pines VCC/GND en OLED (algunas invierten los dos primeros pines).",
    },
    {
        "categoria": "Otros Sensores y Actuadores",
        "modelo": "INA219 / Optoacoplador PC817 / HX711",
        "escala": "Escala 3",
        "dimensiones": "22 x 20 mm",
        "voltaje": "3.3V - 5V",
        "especificaciones": "Monitor corriente I2C (hasta 3.2A) / Aislamiento / ADC 24-bit",
        "precio_est": "S/ 8 - 35",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Medir consumo real de batería (INA219), aislar señales 12V/24V (PC817), balanzas (HX711).\nCONSIDERAR:\n- INA219 mide hasta 26V en bus DC.",
    },
    {
        "categoria": "Otros Sensores y Actuadores",
        "modelo": "Sensor Inductivo LJ12A3 + Relé SSR",
        "escala": "Escala 4",
        "dimensiones": "Ø 12 x 60 mm",
        "voltaje": "6V - 36V DC (Sensor)",
        "especificaciones": "Detección metálica 4mm (NPN/PNP) + SSR 25A/40A AC, I máx salida: 200mA",
        "precio_est": "S/ 15 - 60",
        "donde_encontrar": "Las Malvinas / Paruro",
        "usos": "USOS: Finales de carrera industriales en CNC, control de resistencias AC.\nCONSIDERAR:\n- Si el sensor es 12V, usar optoacoplador o divisor antes de entrar al GPIO de 3.3V.",
    },
    {
        "categoria": "Otros Sensores y Actuadores",
        "modelo": "Encoder Rotativo KY-040",
        "escala": "Escala 2",
        "dimensiones": "31 x 19 x 29 mm",
        "voltaje": "3.3V - 5V",
        "especificaciones": "20 pulsos/rev + Pulsador integrado, I máx: <5mA",
        "precio_est": "S/ 6 - 10",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Menús en pantalla OLED, ajuste manual de velocidad/posición.\nCONSIDERAR:\n- Aplicar debounce por software o hardware para evitar saltos falsos.",
    },
    {
        "categoria": "Otros Sensores y Actuadores",
        "modelo": "Módulo Relé 5V (1 / 2 / 4 canales)",
        "escala": "Escala 2",
        "dimensiones": "50 x 26 x 19 mm",
        "voltaje": "5V bobina (señal 3.3V/5V)",
        "especificaciones": "Optoacoplado, Carga máx: 10A 250VAC / 30VDC, I máx bobina: ~70mA/canal",
        "precio_est": "S/ 8 - 22",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Encender bombas de agua, electroválvulas, lámparas AC.\nCONSIDERAR:\n- Muchos módulos se activan en LOW (0V).\n- Para cargas inductivas DC, agregar diodo flyback.",
    },
    {
        "categoria": "Otros Sensores y Actuadores",
        "modelo": "GPS NEO-6M (con antena cerámica)",
        "escala": "Escala 3",
        "dimensiones": "36 x 26 mm",
        "voltaje": "3.3V - 5V",
        "especificaciones": "UART 9600 bps, Precisión ~2.5m, I máx: ~67mA",
        "precio_est": "S/ 25 - 40",
        "donde_encontrar": "Paruro / Naylamp",
        "usos": "USOS: Rovers autónomos exteriores, drones, rastreadores.\nCONSIDERAR:\n- No capta satélites dentro de edificios; probar en exterior o junto a ventana.",
    },
    {
        "categoria": "Otros Sensores y Actuadores",
        "modelo": "Sensor Ambiental BME280 (I2C/SPI)",
        "escala": "Escala 1",
        "dimensiones": "15 x 12 mm",
        "voltaje": "3.3V",
        "especificaciones": "Temp + Humedad + Presión barométrica, I máx: <1mA",
        "precio_est": "S/ 15 - 25",
        "donde_encontrar": "Naylamp / AliExpress",
        "usos": "USOS: Estaciones meteorológicas, altímetro barométrico en drones.\nCONSIDERAR:\n- No confundir con BMP280 (el BMP280 no mide humedad).",
    },
]


def _slugify(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9]+", "_", text.lower()).strip("_")
    return s[:60]


def _parse_dimensions_mm(dim_str: str) -> tuple[float, float, bool]:
    """
    Extrae (ancho_mm, alto_mm, es_circular) de cadenas como:
    '55 x 28 mm', 'Ø 28 x 19 mm', '2.0x1.25 / ...', 'Ø 150-250 mm'.
    """
    is_round = "Ø" in dim_str or "ø" in dim_str
    # Tomar la primera opción antes de '/' si hay varias
    first_part = dim_str.split("/")[0]
    nums = [float(x) for x in re.findall(r"\d+(?:\.\d+)?", first_part)]
    if not nums:
        return 30.0, 20.0, is_round
    if len(nums) == 1:
        return nums[0], nums[0], is_round
    return nums[0], nums[1], is_round


def _choose_px_per_mm(w_mm: float, h_mm: float, max_draw_w: float, max_draw_h: float) -> float:
    """Elige una escala limpia (px por mm) para que el dibujo quepa con su regla."""
    raw = min(max_draw_w / max(w_mm, 1.0), max_draw_h / max(h_mm, 1.0))
    # Limitar zoom extremo en SMD muy pequeños o muy grandes
    return max(0.7, min(raw, 18.0))


def _build_component_shape(categoria: str, x: float, y: float, w: float, h: float, is_round: bool) -> str:
    """Genera los elementos SVG vectoriales representativos según la categoría."""
    cat = categoria.lower()

    if "esp32" in cat:
        # PCB oscuro + blindaje metálico + conector USB + pines laterales
        shield_w = max(10.0, w * 0.42)
        shield_h = max(10.0, h * 0.64)
        usb_w = min(10.0, w * 0.16)
        usb_h = max(6.0, h * 0.34)
        pins = []
        step = max(5.0, w / 12)
        px = x + step
        while px < x + w - step * 0.5:
            pins.append(f'<circle cx="{px:.1f}" cy="{y + 3:.1f}" r="1.4" fill="#e5c07b"/>')
            pins.append(f'<circle cx="{px:.1f}" cy="{y + h - 3:.1f}" r="1.4" fill="#e5c07b"/>')
            px += step
        return (
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="3" fill="#232a34" stroke="#61afef" stroke-width="1.5"/>'
            f'<rect x="{x + w * 0.16:.1f}" y="{y + (h - shield_h) / 2:.1f}" width="{shield_w:.1f}" height="{shield_h:.1f}" rx="2" fill="#8b949e" stroke="#d0d7de" stroke-width="1"/>'
            f'<rect x="{x + w - usb_w + 1:.1f}" y="{y + (h - usb_h) / 2:.1f}" width="{usb_w:.1f}" height="{usb_h:.1f}" rx="1.5" fill="#c9d1d9" stroke="#6e7681" stroke-width="1"/>'
            + "".join(pins)
        )

    if "bater" in cat:
        if w > h * 2.2:
            # Celda cilíndrica 18650
            return (
                f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="{min(6.0, h*0.25):.1f}" fill="#2b4c7e" stroke="#79c0ff" stroke-width="1.5"/>'
                f'<rect x="{x + w:.1f}" y="{y + h * 0.28:.1f}" width="4" height="{h * 0.44:.1f}" rx="1" fill="#d0d7de"/>'
                f'<text x="{x + w/2:.1f}" y="{y + h/2 + 3:.1f}" text-anchor="middle" fill="#e6edf3" font-size="9" font-family="sans-serif">+</text>'
            )
        # Pack LiPo / LiFePO4
        return (
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="4" fill="#2c333d" stroke="#f0883e" stroke-width="1.5"/>'
            f'<line x1="{x + w:.1f}" y1="{y + h * 0.35:.1f}" x2="{x + w + 12:.1f}" y2="{y + h * 0.25:.1f}" stroke="#ff5555" stroke-width="2.2"/>'
            f'<line x1="{x + w:.1f}" y1="{y + h * 0.65:.1f}" x2="{x + w + 12:.1f}" y2="{y + h * 0.75:.1f}" stroke="#8b949e" stroke-width="2.2"/>'
        )

    if "distancia" in cat:
        if is_round:
            r = min(w, h) / 2
            cx, cy = x + w / 2, y + h / 2
            return (
                f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="#252b33" stroke="#56d364" stroke-width="1.5"/>'
                f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * 0.62:.1f}" fill="#161b22" stroke="#8b949e" stroke-width="1.2"/>'
                f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r * 0.2:.1f}" fill="#56d364"/>'
            )
        # Sensor tipo HC-SR04 / ToF / LiDAR
        r_eye = max(4.0, min(w * 0.16, h * 0.36))
        return (
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="3" fill="#1f3a5f" stroke="#79c0ff" stroke-width="1.5"/>'
            f'<circle cx="{x + w * 0.28:.1f}" cy="{y + h * 0.5:.1f}" r="{r_eye:.1f}" fill="#30363d" stroke="#d0d7de" stroke-width="1.2"/>'
            f'<circle cx="{x + w * 0.72:.1f}" cy="{y + h * 0.5:.1f}" r="{r_eye:.1f}" fill="#30363d" stroke="#d0d7de" stroke-width="1.2"/>'
        )

    if "servo" in cat:
        horn_r = max(4.0, min(w, h) * 0.24)
        return (
            f'<rect x="{x - 5:.1f}" y="{y + h * 0.25:.1f}" width="{w + 10:.1f}" height="6" rx="1.5" fill="#30363d" stroke="#8b949e" stroke-width="1"/>'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="2.5" fill="#21262d" stroke="#d2a8ff" stroke-width="1.5"/>'
            f'<circle cx="{x + w * 0.28:.1f}" cy="{y + h * 0.5:.1f}" r="{horn_r:.1f}" fill="#d0d7de" stroke="#6e7681" stroke-width="1"/>'
        )

    if "paso" in cat or "motor" in cat:
        if is_round:
            r = min(w, h) / 2
            cx, cy = x + w / 2, y + h / 2
            return (
                f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="#2b313a" stroke="#ffa657" stroke-width="1.5"/>'
                f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{max(3.0, r * 0.18):.1f}" fill="#d0d7de"/>'
            )
        return (
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="3" fill="#2b313a" stroke="#ffa657" stroke-width="1.5"/>'
            f'<rect x="{x + w:.1f}" y="{y + h * 0.42:.1f}" width="12" height="{max(4.0, h * 0.16):.1f}" rx="1" fill="#d0d7de"/>'
            f'<circle cx="{x + w * 0.5:.1f}" cy="{y + h * 0.5:.1f}" r="{max(4.0, min(w, h) * 0.24):.1f}" fill="none" stroke="#8b949e" stroke-width="1.2"/>'
        )

    if "resistencia" in cat:
        # Cuerpo con bandas de color
        bh = max(8.0, h)
        bw = max(18.0, w)
        return (
            f'<line x1="{x - 14:.1f}" y1="{y + bh / 2:.1f}" x2="{x + bw + 14:.1f}" y2="{y + bh / 2:.1f}" stroke="#c9d1d9" stroke-width="2"/>'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{bw:.1f}" height="{bh:.1f}" rx="3" fill="#d2b48c" stroke="#f0e6d2" stroke-width="1"/>'
            f'<rect x="{x + bw * 0.2:.1f}" y="{y:.1f}" width="3" height="{bh:.1f}" fill="#a52a2a"/>'
            f'<rect x="{x + bw * 0.4:.1f}" y="{y:.1f}" width="3" height="{bh:.1f}" fill="#111111"/>'
            f'<rect x="{x + bw * 0.6:.1f}" y="{y:.1f}" width="3" height="{bh:.1f}" fill="#d2691e"/>'
            f'<rect x="{x + bw * 0.8:.1f}" y="{y:.1f}" width="2.5" height="{bh:.1f}" fill="#daa520"/>'
        )

    # Drivers, Reguladores, Otros Sensores (PCB con chip + bornes)
    chip = min(w, h) * 0.42
    return (
        f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="3" fill="#1c2d24" stroke="#3fb950" stroke-width="1.5"/>'
        f'<rect x="{x + (w - chip) / 2:.1f}" y="{y + (h - chip) / 2:.1f}" width="{chip:.1f}" height="{chip:.1f}" rx="1.5" fill="#161b22" stroke="#8b949e" stroke-width="1"/>'
        f'<circle cx="{x + 5:.1f}" cy="{y + 5:.1f}" r="1.8" fill="#e5c07b"/>'
        f'<circle cx="{x + w - 5:.1f}" cy="{y + 5:.1f}" r="1.8" fill="#e5c07b"/>'
        f'<circle cx="{x + 5:.1f}" cy="{y + h - 5:.1f}" r="1.8" fill="#e5c07b"/>'
        f'<circle cx="{x + w - 5:.1f}" cy="{y + h - 5:.1f}" r="1.8" fill="#e5c07b"/>'
    )


def build_ruler_svg_string(modelo: str, categoria: str, dimensiones: str, escala: str) -> str:
    """
    Construye el SVG técnico con regla graduada en mm/cm al costado
    y debajo del componente, escalado proporcionalmente a sus dimensiones reales.
    """
    w_mm, h_mm, is_round = _parse_dimensions_mm(dimensiones)

    # Área disponible para el dibujo del componente
    area_x, area_y = 58.0, 34.0
    max_draw_w, max_draw_h = 200.0, 108.0
    px_per_mm = _choose_px_per_mm(w_mm, h_mm, max_draw_w, max_draw_h)

    draw_w = max(12.0, min(max_draw_w, w_mm * px_per_mm))
    draw_h = max(8.0, min(max_draw_h, h_mm * px_per_mm))

    # Centrar levemente dentro del área sobre la regla
    comp_x = area_x + 16.0
    comp_y = area_y + (max_draw_h - draw_h) / 2.0

    # Regla horizontal (debajo del componente)
    ruler_y = 156.0
    ruler_x_start = comp_x
    ruler_len_mm = max(10, int(round(max_draw_w / px_per_mm)))
    # Elegir paso de marcas legible en mm
    if px_per_mm >= 8:
        tick_step_mm = 1
        major_every = 5
    elif px_per_mm >= 3:
        tick_step_mm = 2
        major_every = 10
    elif px_per_mm >= 1.3:
        tick_step_mm = 5
        major_every = 10
    else:
        tick_step_mm = 10
        major_every = 50

    h_ticks = []
    mm = 0
    while mm <= ruler_len_mm:
        tx = ruler_x_start + mm * px_per_mm
        if tx > 304:
            break
        is_major = (mm % major_every == 0)
        tick_h = 10 if is_major else 5
        h_ticks.append(
            f'<line x1="{tx:.1f}" y1="{ruler_y:.1f}" x2="{tx:.1f}" y2="{ruler_y + tick_h:.1f}" '
            f'stroke="#d0d0d0" stroke-width="{1.2 if is_major else 0.7}"/>'
        )
        if is_major:
            label = f"{mm // 10}cm" if (mm % 10 == 0 and mm > 0) else f"{mm}"
            h_ticks.append(
                f'<text x="{tx:.1f}" y="{ruler_y + 21:.1f}" text-anchor="middle" '
                f'fill="#a8b3c2" font-size="8.5" font-family="Consolas, monospace">{label}</text>'
            )
        mm += tick_step_mm

    # Regla vertical (a la izquierda del componente)
    vruler_x = 40.0
    vruler_y_start = comp_y + draw_h
    v_ticks = []
    v_mm = 0
    max_v_mm = max(5, int(round((draw_h + 12) / px_per_mm)))
    while v_mm <= max_v_mm:
        ty = vruler_y_start - v_mm * px_per_mm
        if ty < 26:
            break
        is_major = (v_mm % major_every == 0)
        tick_w = 8 if is_major else 4
        v_ticks.append(
            f'<line x1="{vruler_x - tick_w:.1f}" y1="{ty:.1f}" x2="{vruler_x:.1f}" y2="{ty:.1f}" '
            f'stroke="#d0d0d0" stroke-width="{1.1 if is_major else 0.7}"/>'
        )
        if is_major and v_mm > 0:
            v_ticks.append(
                f'<text x="{vruler_x - 11:.1f}" y="{ty + 3:.1f}" text-anchor="end" '
                f'fill="#a8b3c2" font-size="8" font-family="Consolas, monospace">{v_mm}</text>'
            )
        v_mm += tick_step_mm

    shape_svg = _build_component_shape(categoria, comp_x, comp_y, draw_w, draw_h, is_round)
    safe_title = html.escape(modelo[:38])
    safe_dims = html.escape(dimensiones)
    safe_escala = html.escape(escala)

    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="320" height="200">
  <rect width="320" height="200" fill="#16181c"/>
  <defs>
    <pattern id="grid" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#242830" stroke-width="0.6"/>
    </pattern>
  </defs>
  <rect width="320" height="200" fill="url(#grid)"/>

  <!-- Encabezado técnico -->
  <text x="12" y="18" fill="#e6edf3" font-size="10.5" font-weight="600" font-family="Segoe UI, sans-serif">{safe_title}</text>
  <rect x="242" y="7" width="68" height="16" rx="3" fill="#262b33" stroke="#58a6ff" stroke-width="0.8"/>
  <text x="276" y="18" text-anchor="middle" fill="#79c0ff" font-size="8.5" font-weight="600" font-family="Segoe UI, sans-serif">{safe_escala}</text>

  <!-- Líneas guía de cota -->
  <line x1="{comp_x:.1f}" y1="{comp_y + draw_h + 2:.1f}" x2="{comp_x:.1f}" y2="{ruler_y:.1f}" stroke="#58a6ff" stroke-width="0.7" stroke-dasharray="2,2"/>
  <line x1="{comp_x + draw_w:.1f}" y1="{comp_y + draw_h + 2:.1f}" x2="{comp_x + draw_w:.1f}" y2="{ruler_y:.1f}" stroke="#58a6ff" stroke-width="0.7" stroke-dasharray="2,2"/>

  <!-- Componente escalado -->
  {shape_svg}

  <!-- Regla vertical (mm) -->
  <line x1="{vruler_x:.1f}" y1="26" x2="{vruler_x:.1f}" y2="{vruler_y_start:.1f}" stroke="#d0d0d0" stroke-width="1.2"/>
  {"".join(v_ticks)}

  <!-- Regla horizontal (mm / cm) -->
  <rect x="{ruler_x_start - 4:.1f}" y="{ruler_y:.1f}" width="{308 - ruler_x_start:.1f}" height="28" fill="#1e2229" opacity="0.9"/>
  <line x1="{ruler_x_start:.1f}" y1="{ruler_y:.1f}" x2="304" y2="{ruler_y:.1f}" stroke="#d0d0d0" stroke-width="1.2"/>
  {"".join(h_ticks)}

  <!-- Etiqueta de dimensiones -->
  <text x="308" y="194" text-anchor="end" fill="#7ee787" font-size="9.5" font-weight="600" font-family="Consolas, monospace">Dim: {safe_dims} (escala c/ regla mm)</text>
</svg>'''
    return svg_content


def generate_ruler_svg(modelo: str, categoria: str, dimensiones: str, escala: str, out_path: Path) -> None:
    """Guarda en disco el SVG técnico con regla graduada."""
    out_path.write_text(
        build_ruler_svg_string(modelo, categoria, dimensiones, escala),
        encoding="utf-8",
    )


def generate_all_seed_images(fotos_dir: Path) -> dict[str, str]:
    """Genera las imágenes SVG con regla para todos los componentes semilla."""
    fotos_dir.mkdir(parents=True, exist_ok=True)
    mapping: dict[str, str] = {}
    for item in SEED_COMPONENTES:
        slug = _slugify(item["modelo"])
        filename = f"seed_{slug}.svg"
        out_file = fotos_dir / filename
        if not out_file.exists():
            generate_ruler_svg(
                modelo=item["modelo"],
                categoria=item["categoria"],
                dimensiones=item["dimensiones"],
                escala=item["escala"],
                out_path=out_file,
            )
        mapping[item["modelo"]] = f"/uploads/fotos/{filename}"
    return mapping
