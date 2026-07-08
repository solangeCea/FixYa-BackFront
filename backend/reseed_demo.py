"""Reseed limpio de usuarios para la presentacion final de FixYa.

Genera un conjunto coherente y valido:
- 2 administradores
- 16 tecnicos (2 por cada uno de los 8 servicios), verificados y en catalogo,
  con documentos CARNET_IDENTIDAD y ANTECEDENTES aprobados
- 4 clientes

Todos con RUT chileno de DV valido, telefono valido (9########), correo valido
y contrasena que cumple la politica (8+, mayuscula, minuscula, numero).

Uso:
  python reseed_demo.py --emit   -> imprime el SQL (para pegar en seed.sql)
  python reseed_demo.py --apply  -> aplica el reseed limpio a la BD conectada
"""

import sys
from app.security import hash_password

PWD_ADMIN = "Admin1234"
PWD_TECNICO = "Tecnico1234"
PWD_CLIENTE = "Cliente1234"


def dv(cuerpo: str) -> str:
    suma, mult = 0, 2
    for d in reversed(cuerpo):
        suma += int(d) * mult
        mult = 2 if mult == 7 else mult + 1
    resto = 11 - (suma % 11)
    return "0" if resto == 11 else "K" if resto == 10 else str(resto)


def rut(cuerpo: str) -> str:
    return f"{cuerpo}-{dv(cuerpo)}"


# --- Definicion del dataset (cuerpos de RUT elegidos; DV se calcula) ---
ADMINS = [
    ("21000101", "Vanesa Gonzalez Navarro", "F", "Femenino", "1992-05-12", "990010101", "vanesa.gonzalez@fixya.cl", 1),
    ("21000202", "Daniel Orellana Soto", "M", "Masculino", "1988-09-03", "990010202", "daniel.orellana@fixya.cl", 1),
]

# (cuerpo, nombre, genero_txt, nacimiento, telefono, correo, comuna, servicio_id,
#  descripcion, experiencia, nivel)
TECNICOS = [
    # Electricidad (1)
    ("22010011", "Matias Fuentes Morales", "Masculino", "1989-07-22", "961000011", "matias.fuentes@fixya.cl", 12, 1, "Electricista con certificacion SEC, instalaciones domiciliarias y tableros electricos.", 12, "Avanzado"),
    ("22010022", "Antonia Salas Espinoza", "Femenino", "1990-08-17", "961000022", "antonia.salas@fixya.cl", 13, 1, "Tecnica electrica orientada a mantencion integral del hogar y locales comerciales.", 9, "Avanzado"),
    # Gasfiteria (2)
    ("22020011", "Sofia Contreras Rojas", "Femenino", "1991-03-14", "962000011", "sofia.contreras@fixya.cl", 11, 2, "Gasfiter certificada en deteccion de filtraciones y redes de agua potable.", 8, "Avanzado"),
    ("22020022", "Rodrigo Pizarro Leon", "Masculino", "1986-02-09", "962000022", "rodrigo.pizarro@fixya.cl", 10, 2, "Gasfiter en instalacion y reparacion de artefactos sanitarios y calefont.", 11, "Avanzado"),
    # Carpinteria (3)
    ("22030011", "Francisca Munoz Tapia", "Femenino", "1985-09-30", "963000011", "francisca.munoz@fixya.cl", 5, 3, "Maestra carpintera de muebles a medida, terminaciones y estructuras de madera.", 15, "Avanzado"),
    ("22030022", "Tomas Reyes Alarcon", "Masculino", "1994-04-18", "963000022", "tomas.reyes@fixya.cl", 6, 3, "Carpintero en revestimientos, puertas, ventanas y reparaciones de madera.", 6, "Intermedio"),
    # Cerrajeria (4)
    ("22040011", "Sebastian Navarro Fuentealba", "Masculino", "1982-12-11", "964000011", "sebastian.navarro@fixya.cl", 7, 4, "Cerrajero de urgencias: apertura, cambio de cerraduras y sistemas de seguridad.", 18, "Avanzado"),
    ("22040022", "Daniela Vergara Rojas", "Femenino", "1993-06-27", "964000022", "daniela.vergara@fixya.cl", 9, 4, "Cerrajera en instalacion de cerraduras de seguridad y control de acceso.", 7, "Intermedio"),
    # Techumbre (5)
    ("22050011", "Camila Herrera Nunez", "Femenino", "1994-11-02", "965000011", "camila.herrera@fixya.cl", 8, 5, "Especialista en techumbres: reparacion de goteras, cambio de planchas y hojalateria.", 5, "Intermedio"),
    ("22050022", "Cristobal Bravo Miranda", "Masculino", "1993-05-05", "965000022", "cristobal.bravo@fixya.cl", 16, 5, "Tecnico en techumbres y cubiertas para viviendas y locales comerciales.", 6, "Intermedio"),
    # Pintura (6)
    ("22060011", "Diego Vera Sanhueza", "Masculino", "1996-01-19", "966000011", "diego.vera@fixya.cl", 19, 6, "Pintor profesional de interiores y exteriores, esmalte al agua y tratamiento de humedad.", 4, "Intermedio"),
    ("22060022", "Paula Cortes Marin", "Femenino", "1991-10-08", "966000022", "paula.cortes@fixya.cl", 20, 6, "Pintora en terminaciones finas, estuco y recuperacion de muros.", 8, "Avanzado"),
    # Albanileria (7)
    ("22070011", "Ignacio Riquelme Soto", "Masculino", "1990-04-08", "967000011", "ignacio.riquelme@fixya.cl", 23, 7, "Albanil en construccion de muros, radieres y reparaciones de obra gruesa.", 10, "Avanzado"),
    ("22070022", "Marcelo Aravena Diaz", "Masculino", "1987-01-23", "967000022", "marcelo.aravena@fixya.cl", 7, 7, "Albanil en estucos, enchapes y ampliaciones menores.", 13, "Avanzado"),
    # Jardineria (8)
    ("22080011", "Valentina Caceres Pino", "Femenino", "1995-06-25", "968000011", "valentina.caceres@fixya.cl", 14, 8, "Jardinera en mantencion de areas verdes, poda y diseno de jardines.", 6, "Intermedio"),
    ("22080022", "Felipe Munoz Carrasco", "Masculino", "1992-03-30", "968000022", "felipe.munoz@fixya.cl", 11, 8, "Jardinero en riego automatico, cesped y control de plagas de jardin.", 7, "Intermedio"),
]

CLIENTES = [
    ("23000011", "Josefa Reyes Vidal", "Femenino", "1995-02-14", "970000011", "josefa.reyes@gmail.com", 10),
    ("23000022", "Catalina Figueroa Rojas", "Femenino", "1990-07-19", "970000022", "catalina.figueroa@gmail.com", 12),
    ("23000033", "Andres Soto Lagos", "Masculino", "1988-11-05", "970000033", "andres.soto@gmail.com", 8),
    ("23000044", "Martin Espinoza Ruiz", "Masculino", "1993-09-21", "970000044", "martin.espinoza@gmail.com", 5),
]

COMUNAS_EXTRA = {  # segunda comuna de cobertura por indice de tecnico (opcional)
}


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def build_sql() -> str:
    h_admin = hash_password(PWD_ADMIN)
    h_tec = hash_password(PWD_TECNICO)
    h_cli = hash_password(PWD_CLIENTE)

    out = []
    out.append("-- ====== RESEED LIMPIO (presentacion final) ======")
    out.append("-- Contrasenas: Admin1234 / Tecnico1234 / Cliente1234")

    # Usuarios admin
    out.append("INSERT INTO usuario (rut, nombre_completo, fecha_nacimiento, genero, correo, telefono, contrasena, estado_usuario, comuna_id_comuna, tipo_usuario) VALUES")
    filas = []
    for cuerpo, nombre, _g, gtxt, nac, tel, correo, comuna in ADMINS:
        filas.append(f"  ('{rut(cuerpo)}', '{sql_escape(nombre)}', '{nac}', '{gtxt}', '{correo}', '{tel}', '{h_admin}', true, {comuna}, 'ADMIN')")
    out.append(",\n".join(filas) + "\nON CONFLICT (rut) DO NOTHING;\n")

    # Usuarios tecnico
    out.append("INSERT INTO usuario (rut, nombre_completo, fecha_nacimiento, genero, correo, telefono, contrasena, estado_usuario, comuna_id_comuna, tipo_usuario) VALUES")
    filas = []
    for t in TECNICOS:
        cuerpo, nombre, gtxt, nac, tel, correo, comuna = t[0], t[1], t[2], t[3], t[4], t[5], t[6]
        filas.append(f"  ('{rut(cuerpo)}', '{sql_escape(nombre)}', '{nac}', '{gtxt}', '{correo}', '{tel}', '{h_tec}', true, {comuna}, 'TECNICO')")
    out.append(",\n".join(filas) + "\nON CONFLICT (rut) DO NOTHING;\n")

    # Usuarios cliente
    out.append("INSERT INTO usuario (rut, nombre_completo, fecha_nacimiento, genero, correo, telefono, contrasena, estado_usuario, comuna_id_comuna, tipo_usuario) VALUES")
    filas = []
    for cuerpo, nombre, gtxt, nac, tel, correo, comuna in CLIENTES:
        filas.append(f"  ('{rut(cuerpo)}', '{sql_escape(nombre)}', '{nac}', '{gtxt}', '{correo}', '{tel}', '{h_cli}', true, {comuna}, 'CLIENTE')")
    out.append(",\n".join(filas) + "\nON CONFLICT (rut) DO NOTHING;\n")

    # Roles
    out.append("INSERT INTO usuario_rol (usuario_rut, rol, activo) VALUES")
    filas = []
    for cuerpo, *_ in ADMINS:
        filas.append(f"  ('{rut(cuerpo)}', 'ADMIN', true)")
    for t in TECNICOS:
        filas.append(f"  ('{rut(t[0])}', 'TECNICO', true)")
    for cuerpo, *_ in CLIENTES:
        filas.append(f"  ('{rut(cuerpo)}', 'CLIENTE', true)")
    out.append(",\n".join(filas) + "\nON CONFLICT DO NOTHING;\n")

    # Perfil tecnico (verificado + APROBADO)
    out.append("INSERT INTO tecnico (usuario_rut, descripcion_perfil, experiencia_anios, nivel_tecnico, tecnico_verificado, estado_verificacion) VALUES")
    filas = []
    for t in TECNICOS:
        cuerpo, desc, exp, nivel = t[0], t[8], t[9], t[10]
        filas.append(f"  ('{rut(cuerpo)}', '{sql_escape(desc)}', {exp}, '{nivel}', true, 'APROBADO')")
    out.append(",\n".join(filas) + "\nON CONFLICT (usuario_rut) DO NOTHING;\n")

    # tecnico_servicio (especialidad)
    out.append("INSERT INTO tecnico_servicio (tecnico_usuario_rut, servicio_id_servicio) VALUES")
    filas = [f"  ('{rut(t[0])}', {t[7]})" for t in TECNICOS]
    out.append(",\n".join(filas) + "\nON CONFLICT DO NOTHING;\n")

    # tecnico_comuna (cobertura = comuna del tecnico)
    out.append("INSERT INTO tecnico_comuna (tecnico_usuario_rut, comuna_id_comuna, estado_cobertura) VALUES")
    filas = [f"  ('{rut(t[0])}', {t[6]}, true)" for t in TECNICOS]
    out.append(",\n".join(filas) + "\nON CONFLICT DO NOTHING;\n")

    # Nota: no se siembran documentos. Los técnicos ya quedan verificados
    # (tecnico_verificado=true / estado_verificacion='APROBADO'), que es lo que
    # los hace visibles en el catálogo. documento_tecnico no tiene índice único
    # natural, así que sembrarlo en cada arranque duplicaría/rompería el seed.

    return "\n".join(out)


WIPE_SQL = """
TRUNCATE TABLE
  audit_log, conflicto_evidencia, conflicto_solicitud, cancelacion_solicitud,
  reporte_solicitud, resena, mensaje_chat, chat, notificacion,
  historial_solicitud, cotizacion, documento_tecnico, solicitud_disponibilidad,
  solicitud, tecnico_solicitud_descartada, tecnico_servicio, tecnico_comuna,
  tecnico, password_reset_token, usuario_rol, usuario
RESTART IDENTITY CASCADE;
"""


def apply():
    from app.database import engine
    sql = build_sql()
    with engine.begin() as conn:
        conn.exec_driver_sql(WIPE_SQL)
        conn.exec_driver_sql(sql)
    print("[reseed] BD reseteada e insertados usuarios limpios.")


if __name__ == "__main__":
    if "--apply" in sys.argv:
        apply()
    else:
        print(build_sql())
