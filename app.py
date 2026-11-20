"""
Backend principal de Catálogo Mecatrónico.
Servidor local offline con FastAPI, Uvicorn y SQLite.
"""

import json
import mimetypes
import re
import sqlite3
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

mimetypes.add_type("application/javascript", ".js")

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from seed_data import (
    CATEGORIAS_ORDEN,
    ESCALAS,
    SEED_COMPONENTES,
    build_ruler_svg_string,
    generate_all_seed_images,
)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "catalogo.db"
STATIC_DIR = BASE_DIR / "static"
UPLOADS_DIR = BASE_DIR / "uploads"
FOTOS_DIR = UPLOADS_DIR / "fotos"
DATASHEETS_DIR = UPLOADS_DIR / "datasheets"
MODELOS3D_DIR = UPLOADS_DIR / "modelos3d"

ALLOWED_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".svg"}
ALLOWED_PDF_EXTS = {".pdf"}
ALLOWED_MODEL3D_EXTS = {".glb", ".gltf", ".stl"}

STANDARD_FIELDS = {
    "modelo",
    "categoria",
    "escala",
    "dimensiones",
    "voltaje",
    "especificaciones",
    "usos",
    "precio_est",
    "donde_encontrar",
    "link_notas",
}


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db_and_seed() -> None:
    """Crea las tablas SQLite si no existen, migra columnas nuevas y carga datos iniciales."""
    FOTOS_DIR.mkdir(parents=True, exist_ok=True)
    DATASHEETS_DIR.mkdir(parents=True, exist_ok=True)
    MODELOS3D_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_DIR.mkdir(parents=True, exist_ok=True)

    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS componentes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                modelo TEXT NOT NULL,
                categoria TEXT NOT NULL,
                escala TEXT NOT NULL,
                dimensiones TEXT DEFAULT '',
                voltaje TEXT DEFAULT '',
                especificaciones TEXT DEFAULT '',
                usos TEXT DEFAULT '',
                precio_est TEXT DEFAULT '',
                donde_encontrar TEXT DEFAULT '',
                foto_path TEXT DEFAULT '',
                datasheet_path TEXT DEFAULT '',
                link_notas TEXT DEFAULT '',
                custom_attrs TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS custom_columns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT UNIQUE NOT NULL,
                label TEXT NOT NULL,
                sort_order INTEGER DEFAULT 0
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS proyectos_3d (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT UNIQUE NOT NULL,
                data_json TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )

        # Migración automática si la BD ya existía con el esquema anterior
        existing_cols = {
            r[1] for r in conn.execute("PRAGMA table_info(componentes)").fetchall()
        }
        for col_name in ("voltaje", "especificaciones", "usos"):
            if col_name not in existing_cols:
                conn.execute(
                    f"ALTER TABLE componentes ADD COLUMN {col_name} TEXT DEFAULT ''"
                )

        count = conn.execute("SELECT COUNT(*) FROM componentes").fetchone()[0]
        if count == 0:
            foto_map = generate_all_seed_images(FOTOS_DIR)
            for item in SEED_COMPONENTES:
                conn.execute(
                    """
                    INSERT INTO componentes (
                        modelo, categoria, escala, dimensiones, voltaje, especificaciones,
                        usos, precio_est, donde_encontrar, foto_path, datasheet_path, link_notas, custom_attrs
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '{}')
                    """,
                    (
                        item["modelo"],
                        item["categoria"],
                        item["escala"],
                        item["dimensiones"],
                        item["voltaje"],
                        item["especificaciones"],
                        item["usos"],
                        item["precio_est"],
                        item["donde_encontrar"],
                        foto_map.get(item["modelo"], ""),
                    ),
                )
        else:
            # Si había filas previas sin voltaje/especificaciones/usos, migrar desde seed o voltaje_specs
            seed_by_model = {s["modelo"]: s for s in SEED_COMPONENTES}
            rows = conn.execute("SELECT * FROM componentes").fetchall()
            for r in rows:
                d = dict(r)
                if not d.get("voltaje") and not d.get("especificaciones"):
                    seed_item = seed_by_model.get(d["modelo"])
                    if seed_item:
                        conn.execute(
                            "UPDATE componentes SET voltaje = ?, especificaciones = ?, usos = ? WHERE id = ?",
                            (
                                seed_item["voltaje"],
                                seed_item["especificaciones"],
                                seed_item["usos"],
                                d["id"],
                            ),
                        )
                    elif d.get("voltaje_specs"):
                        parts = d["voltaje_specs"].split(",", 1)
                        v_part = parts[0].strip()
                        e_part = parts[1].strip() if len(parts) > 1 else ""
                        conn.execute(
                            "UPDATE componentes SET voltaje = ?, especificaciones = ? WHERE id = ?",
                            (v_part, e_part, d["id"]),
                        )
        conn.commit()


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    d = dict(row)
    try:
        d["custom_attrs"] = json.loads(d.get("custom_attrs") or "{}")
    except json.JSONDecodeError:
        d["custom_attrs"] = {}
    return d


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db_and_seed()
    yield


app = FastAPI(title="Catálogo Mecatrónico", lifespan=lifespan)

# Asegurar carpetas antes de montar estáticos
FOTOS_DIR.mkdir(parents=True, exist_ok=True)
DATASHEETS_DIR.mkdir(parents=True, exist_ok=True)
MODELOS3D_DIR.mkdir(parents=True, exist_ok=True)
STATIC_DIR.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


class ComponenteCreate(BaseModel):
    modelo: str
    categoria: str
    escala: str
    dimensiones: str = ""
    voltaje: str = ""
    especificaciones: str = ""
    usos: str = ""
    precio_est: str = ""
    donde_encontrar: str = ""
    link_notas: str = ""
    custom_attrs: dict[str, str] = {}


class ComponentePatch(BaseModel):
    field: str
    value: str


class ColumnCreate(BaseModel):
    label: str


@app.get("/")
def serve_index():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/data")
def get_all_data():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM componentes ORDER BY id ASC").fetchall()
        cols = conn.execute(
            "SELECT * FROM custom_columns ORDER BY sort_order ASC, id ASC"
        ).fetchall()

        componentes = [row_to_dict(r) for r in rows]
        custom_columns = [dict(c) for c in cols]

        # Combinar categorías predefinidas con cualquier categoría nueva creada por el usuario
        seen = set(CATEGORIAS_ORDEN)
        categorias = list(CATEGORIAS_ORDEN)
        for comp in componentes:
            cat = comp["categoria"]
            if cat and cat not in seen:
                seen.add(cat)
                categorias.append(cat)

    return {
        "componentes": componentes,
        "custom_columns": custom_columns,
        "categorias": categorias,
        "escalas": ESCALAS,
    }


@app.post("/api/componentes", status_code=201)
def create_componente(payload: ComponenteCreate):
    modelo = payload.modelo.strip()
    if not modelo:
        raise HTTPException(status_code=400, detail="El nombre del modelo es obligatorio.")

    with get_conn() as conn:
        cur = conn.execute(
            """
            INSERT INTO componentes (
                modelo, categoria, escala, dimensiones, voltaje, especificaciones,
                usos, precio_est, donde_encontrar, link_notas, custom_attrs
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                modelo,
                payload.categoria.strip() or "Otros Sensores y Actuadores",
                payload.escala.strip() or "Escala 2",
                payload.dimensiones.strip(),
                payload.voltaje.strip(),
                payload.especificaciones.strip(),
                payload.usos.strip(),
                payload.precio_est.strip(),
                payload.donde_encontrar.strip(),
                payload.link_notas.strip(),
                json.dumps(payload.custom_attrs, ensure_ascii=False),
            ),
        )
        conn.commit()
        new_row = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return row_to_dict(new_row)


@app.patch("/api/componentes/{comp_id}")
def patch_componente(comp_id: int, payload: ComponentePatch):
    field = payload.field.strip()
    value = payload.value

    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Componente no encontrado.")

        if field in STANDARD_FIELDS:
            if field == "modelo" and not value.strip():
                raise HTTPException(status_code=400, detail="El modelo no puede quedar vacío.")
            conn.execute(
                f"UPDATE componentes SET {field} = ? WHERE id = ?",
                (value.strip(), comp_id),
            )
        else:
            # Guardar en atributo dinámico custom_attrs
            try:
                attrs = json.loads(row["custom_attrs"] or "{}")
            except json.JSONDecodeError:
                attrs = {}
            attrs[field] = value.strip()
            conn.execute(
                "UPDATE componentes SET custom_attrs = ? WHERE id = ?",
                (json.dumps(attrs, ensure_ascii=False), comp_id),
            )

        conn.commit()
        updated = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
    return row_to_dict(updated)


@app.delete("/api/componentes/{comp_id}")
def delete_componente(comp_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Componente no encontrado.")
        conn.execute("DELETE FROM componentes WHERE id = ?", (comp_id,))
        conn.commit()
    return {"ok": True, "id": comp_id}


@app.post("/api/componentes/{comp_id}/foto")
async def upload_foto(comp_id: int, file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=400,
            detail="Formato no válido. Usa .png, .jpg, .jpeg, .webp o .svg",
        )

    filename = f"comp_{comp_id}_{uuid.uuid4().hex[:8]}{ext}"
    dest = FOTOS_DIR / filename
    content = await file.read()
    dest.write_bytes(content)

    rel_url = f"/uploads/fotos/{filename}"
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
        if not row:
            dest.unlink(missing_ok=True)
            raise HTTPException(status_code=404, detail="Componente no encontrado.")
        conn.execute(
            "UPDATE componentes SET foto_path = ? WHERE id = ?", (rel_url, comp_id)
        )
        conn.commit()
        updated = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
    return row_to_dict(updated)


@app.delete("/api/componentes/{comp_id}/foto")
def delete_foto(comp_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Componente no encontrado.")
        conn.execute("UPDATE componentes SET foto_path = '' WHERE id = ?", (comp_id,))
        conn.commit()
        updated = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
    return row_to_dict(updated)


@app.post("/api/componentes/{comp_id}/datasheet")
async def upload_datasheet(comp_id: int, file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_PDF_EXTS:
        raise HTTPException(status_code=400, detail="Solo se permiten archivos .pdf")

    filename = f"ds_{comp_id}_{uuid.uuid4().hex[:8]}.pdf"
    dest = DATASHEETS_DIR / filename
    content = await file.read()
    dest.write_bytes(content)

    rel_url = f"/uploads/datasheets/{filename}"
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
        if not row:
            dest.unlink(missing_ok=True)
            raise HTTPException(status_code=404, detail="Componente no encontrado.")
        conn.execute(
            "UPDATE componentes SET datasheet_path = ? WHERE id = ?",
            (rel_url, comp_id),
        )
        conn.commit()
        updated = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
    return row_to_dict(updated)


@app.delete("/api/componentes/{comp_id}/datasheet")
def delete_datasheet(comp_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Componente no encontrado.")
        conn.execute(
            "UPDATE componentes SET datasheet_path = '' WHERE id = ?", (comp_id,)
        )
        conn.commit()
        updated = conn.execute(
            "SELECT * FROM componentes WHERE id = ?", (comp_id,)
        ).fetchone()
    return row_to_dict(updated)


@app.post("/api/columns", status_code=201)
def add_custom_column(payload: ColumnCreate):
    label = payload.label.strip()
    if not label:
        raise HTTPException(status_code=400, detail="El nombre de la columna es obligatorio.")

    slug = re.sub(r"[^a-zA-Z0-9]+", "_", label.lower()).strip("_") or "attr"
    key = f"col_{slug}_{uuid.uuid4().hex[:4]}"

    with get_conn() as conn:
        max_order = conn.execute(
            "SELECT COALESCE(MAX(sort_order), 0) FROM custom_columns"
        ).fetchone()[0]
        cur = conn.execute(
            "INSERT INTO custom_columns (key, label, sort_order) VALUES (?, ?, ?)",
            (key, label, max_order + 1),
        )
        conn.commit()
        col = conn.execute(
            "SELECT * FROM custom_columns WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    return dict(col)


@app.delete("/api/columns/{col_id}")
def delete_custom_column(col_id: int):
    with get_conn() as conn:
        conn.execute("DELETE FROM custom_columns WHERE id = ?", (col_id,))
        conn.commit()
    return {"ok": True, "id": col_id}


@app.get("/api/componentes/{comp_id}/ruler-svg")
def get_componente_ruler_svg(comp_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT modelo, categoria, dimensiones, escala FROM componentes WHERE id = ?",
            (comp_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Componente no encontrado.")
    svg = build_ruler_svg_string(
        modelo=row["modelo"],
        categoria=row["categoria"],
        dimensiones=row["dimensiones"] or "30 x 20 mm",
        escala=row["escala"],
    )
    return Response(content=svg, media_type="image/svg+xml")


class Proyecto3DSave(BaseModel):
    nombre: str
    data: dict[str, Any]


@app.get("/api/maquetas")
def list_maquetas():
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, nombre, updated_at FROM proyectos_3d ORDER BY updated_at DESC, id DESC"
        ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/maquetas/{proj_id}")
def get_maqueta(proj_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, nombre, data_json, updated_at FROM proyectos_3d WHERE id = ?",
            (proj_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Maqueta no encontrada.")
    try:
        parsed = json.loads(row["data_json"])
    except json.JSONDecodeError:
        parsed = {"objects": [], "wires": []}
    return {
        "id": row["id"],
        "nombre": row["nombre"],
        "updated_at": row["updated_at"],
        "data": parsed,
    }


@app.post("/api/maquetas", status_code=201)
def save_maqueta(payload: Proyecto3DSave):
    nombre = payload.nombre.strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre de la maqueta es obligatorio.")

    data_str = json.dumps(payload.data, ensure_ascii=False)
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO proyectos_3d (nombre, data_json, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(nombre) DO UPDATE SET
                data_json = excluded.data_json,
                updated_at = CURRENT_TIMESTAMP
            """,
            (nombre, data_str),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, nombre, updated_at FROM proyectos_3d WHERE nombre = ?",
            (nombre,),
        ).fetchone()
    return dict(row)


@app.delete("/api/maquetas/{proj_id}")
def delete_maqueta(proj_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id FROM proyectos_3d WHERE id = ?", (proj_id,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Maqueta no encontrada.")
        conn.execute("DELETE FROM proyectos_3d WHERE id = ?", (proj_id,))
        conn.commit()
    return {"ok": True, "id": proj_id}


@app.get("/api/modelos3d")
def list_modelos3d():
    MODELOS3D_DIR.mkdir(parents=True, exist_ok=True)
    items = []
    files = sorted(
        (
            p
            for p in MODELOS3D_DIR.iterdir()
            if p.is_file() and p.suffix.lower() in ALLOWED_MODEL3D_EXTS
        ),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    for p in files:
        items.append(
            {
                "filename": p.name,
                "url": f"/uploads/modelos3d/{p.name}",
                "ext": p.suffix.lower(),
                "size": p.stat().st_size,
            }
        )
    return items


@app.post("/api/modelos3d", status_code=201)
async def upload_modelo3d(file: UploadFile = File(...)):
    orig_name = Path(file.filename or "modelo")
    ext = orig_name.suffix.lower()
    if ext not in ALLOWED_MODEL3D_EXTS:
        raise HTTPException(
            status_code=400,
            detail="Formato no válido. Usa .glb, .gltf o .stl",
        )

    slug = re.sub(r"[^a-zA-Z0-9_-]+", "_", orig_name.stem).strip("_") or "modelo"
    filename = f"{slug[:40]}_{uuid.uuid4().hex[:4]}{ext}"
    MODELOS3D_DIR.mkdir(parents=True, exist_ok=True)
    dest = MODELOS3D_DIR / filename
    content = await file.read()
    dest.write_bytes(content)

    return {
        "filename": filename,
        "url": f"/uploads/modelos3d/{filename}",
        "ext": ext,
        "size": len(content),
    }
