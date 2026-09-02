"""Motor de scoring. Logica pura y explicable.

El score es mitad PRECIO y mitad CALIDAD. El precio se compara en la unidad en que se
vende cada categoria (EUR por kilo en polvo, EUR por capsula en perlas y comprimidos),
siempre contra el mas barato de su categoria. La calidad es lo comprobable que sea su
certificacion, la forma quimica del activo y, cuando la tienda publica las dosis, si la
formula llega a la dosis efectiva o va infradosificada.

El coste por dosis efectiva se sigue calculando y se enseña en la ficha de cada producto,
porque es lo que explica que dos botes al mismo precio por kilo no rindan lo mismo, pero
no mueve el ranking.

    python -m scoring.motor            # recalcula la tabla score de toda la BD
    python -m scoring.motor creatina   # solo una categoria

Cada score sale con su desglose en texto: el numero sin el "por que" no vale nada.
"""

import json
import sys
from datetime import date

import categorias
from . import config as cfg
from . import requisitos as reqs

# --- logica pura: dicts entran, dicts salen. Sin BD, sin red, testeable. ---------


def _factor_forma(forma_producto, forma_preferida):
    # Si la referencia no distingue formas (proteina, cafeina), no declararla no resta:
    # solo penaliza no saber la forma cuando la evidencia va con una concreta.
    if not forma_preferida:
        return cfg.FACTOR_FORMA_PREFERIDA, "la evidencia no distingue formas quimicas"
    if not forma_producto:
        return cfg.FACTOR_FORMA_DESCONOCIDA, "forma no declarada en la ficha"
    if forma_producto == forma_preferida:
        return cfg.FACTOR_FORMA_PREFERIDA, "forma %s (la estudiada)" % forma_producto
    return (cfg.FACTOR_FORMA_ALTERNATIVA,
            "forma %s en vez de %s, que es la que tiene la evidencia"
            % (forma_producto, forma_preferida))


ETIQUETA_NIVEL = {4: "certificacion respaldada por un tercero (nivel 4)",
                  3: "declaracion comprobable de la marca (nivel 3)",
                  2: "certificacion solo declarada en la ficha (nivel 2)",
                  1: "sin certificacion (nivel 1)"}

# Un mismo nivel lo pueden dar cosas distintas, y el lector merece saber cual. Solo se usa
# de nivel 3 para arriba: en el 2 el sello esta mencionado y no hay nada mas que contar.
ETIQUETA_TIPO = {
    "creapure_qs": "codigo QS de Creapure comprobado en creapure.com (nivel %d)",
    "creapure": "Creapure en el nombre del producto: marca licenciada, "
                "declarada por la tienda (nivel %d)",
    "ifos": "IFOS en el nombre del producto: programa de analisis por lotes de un "
            "tercero, declarado por la tienda (nivel %d)",
    "analisis_marca": "analisis publicado por la propia marca (nivel %d)",
    "informed_sport": "lote en la lista publica de Informed Sport (nivel %d)",
    "informed_choice": "lote en la lista publica de Informed Choice (nivel %d)",
}


def _factor_verificacion(nivel, tipo=None):
    plantilla = ETIQUETA_TIPO.get(tipo) if nivel >= 3 else None
    etiqueta = plantilla % nivel if plantilla else ETIQUETA_NIVEL[nivel]
    return cfg.FACTOR_VERIFICACION[nivel], etiqueta


def _factor_pureza(pureza_real, pureza_tipica):
    """Cuanto sube o baja la calidad por lo que la TABLA de esta ficha declara.

    Sin tabla no hay factor: se sigue usando la pureza tipica de la categoria, que es lo
    que se hacia antes, y el desglose lo dice. Ningun producto pierde nota porque su
    tienda publique menos.
    """
    if not pureza_real:
        return 1.0, None
    if not pureza_tipica:
        # Hay dato pero no con que compararlo (la categoria no declara pureza tipica).
        # Se cuenta, no se puntua.
        return 1.0, "la ficha declara %.0f%% de activo por cada 100 g" % (pureza_real * 100)
    factor = min(cfg.FACTOR_PUREZA_MAX,
                 max(cfg.FACTOR_PUREZA_MIN, pureza_real / pureza_tipica))
    return factor, ("%.0f%% de activo por cada 100 g segun su tabla, frente al %.0f%% "
                    "tipico de la categoria" % (pureza_real * 100, pureza_tipica * 100))


NOMBRE_ADITIVO = {"edulcorante_artificial": "edulcorantes artificiales",
                  "colorante": "colorantes", "aroma_artificial": "aromas artificiales",
                  "relleno": "rellenos", "antiaglomerante": "antiaglomerantes"}


def _factor_aditivos(aditivos):
    """Penalizacion por los aditivos que la ETIQUETA declara. 1.0 si no la publica.

    `aditivos` es None cuando la tienda no publica la lista de ingredientes y una lista
    vacia cuando la publica y no lleva ninguno de los penalizados. No son lo mismo y no
    se puntuan igual.
    """
    if aditivos is None:
        return 1.0, "la ficha no publica la lista de ingredientes"
    if not aditivos:
        return 1.0, "etiqueta limpia: ningun edulcorante artificial, colorante ni relleno"
    factor = max(cfg.SUELO_ADITIVOS, 1.0 - cfg.PENALIZACION_POR_ADITIVO * len(aditivos))
    return factor, "lleva %s en su lista de ingredientes" % ", ".join(
        NOMBRE_ADITIVO.get(a, a) for a in aditivos)


def evaluar(producto, ingredientes, nivel_verificacion, dosis_ref, tipo_certificacion=None):
    """Calidad, precio de referencia y coste por dosis efectiva de UN producto.

    producto: {formato_gramos, precio_eur, servicios_por_envase, forma, categoria}
    ingredientes: [{ingrediente, dosis_por_servicio_mg}]
    dosis_ref: {ingrediente: {dosis_efectiva_min_mg, dosis_efectiva_max_mg, forma_preferida}}
    """
    precio, unidad = precio_referencia(producto)
    # Una cifra por encima del techo de credibilidad no es la dosis de ese activo: es una
    # equivalencia de extracto, el peso de la sal o el de la capsula. Se tira aqui y no en
    # el scraper a proposito: el scraper apunta lo que dice la etiqueta y el motor decide
    # que puede usar. Ver cfg.TECHO_DOSIS_MG.
    ingredientes = [i for i in ingredientes
                    if not (i.get("dosis_por_servicio_mg")
                            and i["dosis_por_servicio_mg"] > cfg.TECHO_DOSIS_MG.get(
                                i["ingrediente"], float("inf")))]
    claves = [i for i in ingredientes
              if i["ingrediente"] in dosis_ref
              and i["ingrediente"] not in cfg.INGREDIENTES_IGNORADOS]
    # La composicion se juzga igual haya dosis o no: la pureza y los aditivos salen de la
    # tabla y de la etiqueta, no de saber que lleva cada activo.
    pureza_real = producto.get("pureza_real")
    pureza_tipica = (dosis_ref[claves[0]["ingrediente"]].get("pureza_tipica")
                     if claves else None)
    f_pureza, motivo_pureza = _factor_pureza(pureza_real, pureza_tipica)
    f_aditivos, motivo_aditivos = _factor_aditivos(producto.get("aditivos"))
    f_composicion = f_pureza * f_aditivos
    motivos_composicion = [m for m in (motivo_pureza, motivo_aditivos) if m]

    # Los requisitos de la categoria van en su propia parte de la nota, no multiplicando
    # a la calidad: son una pregunta distinta ("¿es esto lo que dice ser?") y el lector
    # tiene que poder ver por separado cuanto pesa cada una.
    nota_requisitos, detalle_requisitos = reqs.evaluar(
        producto, producto.get("categoria"), n_dosis=len(claves))
    motivos_requisitos = [
        ("cumple: %s" % r["que"]) if cumple else ("no cumple: %s" % r["que"])
        for cumple, r in detalle_requisitos]
    if not claves:
        # La tienda no publica que lleva cada dosis. El producto se compara igual por
        # precio y por lo comprobable que sea su certificacion, pero de su formula no se
        # afirma nada: ni bien ni mal dosificado.
        f_verif, motivo = _factor_verificacion(nivel_verificacion, tipo_certificacion)
        return {"score_calidad": round(100.0 * f_verif * f_composicion, 1),
                "coste_por_dosis_efectiva": None, "flag_infradosaje": False,
                "modo": "sin_dosis",
                "precio_referencia": round(precio, 4) if precio else None,
                "unidad_precio": unidad,
                "score_requisitos": nota_requisitos,
                "requisitos": detalle_requisitos,
                "desglose": [motivo, "la ficha no publica las dosis de sus activos: la "
                                     "nota solo mira certificacion, composicion y precio"]
                            + motivos_composicion + motivos_requisitos}

    # El modo lo manda la CATEGORIA, no cuantos ingredientes sepamos juzgar. Un
    # preentreno del que solo hayamos podido leer la cafeina sigue siendo una formula:
    # tratarlo como simple (el bote entero es cafeina) daria un coste por dosis absurdo
    # y lo pondria el primero de la tabla.
    modo = ("complejo" if categorias.es_formula(producto.get("categoria"))
            or len(ingredientes) > 1 else "simple")
    desglose = []
    sin_referencia = [i["ingrediente"] for i in ingredientes
                      if i["ingrediente"] not in dosis_ref
                      and i["ingrediente"] not in cfg.INGREDIENTES_IGNORADOS]

    ref_principal = dosis_ref[claves[0]["ingrediente"]]
    f_verif, motivo_verif = _factor_verificacion(nivel_verificacion, tipo_certificacion)
    desglose.append(motivo_verif)
    if modo == "simple":
        # La forma quimica solo tiene sentido cuando hay un unico activo. En una formula
        # lo que se juzga son las dosis de cada ingrediente, no "la forma del producto".
        f_forma, motivo_forma = _factor_forma(producto.get("forma"),
                                              ref_principal.get("forma_preferida"))
        desglose.append(motivo_forma)
    else:
        f_forma = 1.0

    if modo == "simple":
        ref = ref_principal
        dosis_min = ref["dosis_efectiva_min_mg"]
        # Un kilo de concentrado de suero no es un kilo de proteina: la pureza tipica de
        # la categoria (citada en la tabla de dosis) descuenta lo que no es activo.
        # Manda la pureza REAL de la tabla de esta ficha cuando la tienda la publica: la
        # tipica de la categoria es una estimacion y esta es el dato del bote.
        pureza = pureza_real or ref.get("pureza_tipica") or 1.0
        mg_envase = (producto["formato_gramos"] or 0) * 1000 * pureza
        dosis_por_envase = mg_envase / dosis_min if dosis_min else None
        coste = (producto["precio_eur"] / dosis_por_envase) if dosis_por_envase else None
        calidad = 100.0 * f_verif * f_forma * f_composicion
        infradosaje = False
        if dosis_por_envase:
            desglose.append(
                "%.0f g%s dan %.0f dosis efectivas de %.0f mg: %.3f EUR por dosis"
                % (producto["formato_gramos"],
                   "" if pureza == 1.0 else " al %.0f%% de activo" % (pureza * 100),
                   dosis_por_envase, dosis_min, coste))
        elif not producto.get("unidades"):
            desglose.append("sin formato en gramos no se puede calcular el coste por dosis")
    else:
        # Modo complejo: cada ingrediente clave contra su dosis efectiva minima.
        ratios, peor = [], 1.0
        for ing in claves:
            ref = dosis_ref[ing["ingrediente"]]
            nombre_ing = ing["ingrediente"].replace("_", " ")
            dosis = ing.get("dosis_por_servicio_mg")
            if not dosis:
                ratios.append(0.0)
                desglose.append("%s: la ficha no dice la dosis" % nombre_ing)
                continue
            ratio = dosis / ref["dosis_efectiva_min_mg"]
            ratios.append(min(ratio, 1.0))
            peor = min(peor, ratio) if ratio < peor else peor
            if ratio < cfg.UMBRAL_INFRADOSAJE:
                desglose.append(
                    "penalizado por %s a %.1f g de %.1f g recomendados (%.0f%% de la dosis)"
                    % (nombre_ing, dosis / 1000, ref["dosis_efectiva_min_mg"] / 1000,
                       ratio * 100))
            elif ratio < 1.0:
                desglose.append("%s a %.1f g, algo por debajo de los %.1f g de referencia"
                                % (nombre_ing, dosis / 1000,
                                   ref["dosis_efectiva_min_mg"] / 1000))
            else:
                desglose.append("%s a %.1f g, en rango efectivo" % (nombre_ing,
                                                                    dosis / 1000))

        adecuacion = sum(ratios) / len(ratios)
        infradosaje = any(r < cfg.UMBRAL_INFRADOSAJE for r in ratios)
        calidad = 100.0 * adecuacion * f_verif * f_forma * f_composicion
        if infradosaje:
            calidad *= cfg.PENALIZACION_INFRADOSAJE

        # Cuantos servicios hacen falta para llegar a dosis efectiva del peor ingrediente.
        # Si necesitas 2 scoops, el envase rinde la mitad y el coste real se dobla.
        scoops = 1 / peor if peor > 0 else None
        servicios = producto.get("servicios_por_envase")
        if scoops and servicios:
            servicios_efectivos = servicios / scoops
            coste = producto["precio_eur"] / servicios_efectivos
            if scoops > 1.05:
                desglose.append(
                    "hacen falta %.1f servicios para llegar a dosis efectiva: el envase rinde "
                    "%.0f dosis reales, no %.0f" % (scoops, servicios_efectivos, servicios))
        else:
            coste = None
            desglose.append("sin servicios por envase no se puede calcular el coste por dosis")

    desglose.extend(motivos_composicion)
    desglose.extend(motivos_requisitos)
    for ing in sin_referencia:
        desglose.append("%s: sin dosis de referencia publicada, no cuenta en la nota"
                        % ing.replace("_", " "))

    return {"score_calidad": round(calidad, 1),
            # Ya no manda en el ranking, pero se sigue calculando y enseñando en la ficha:
            # es el dato que explica por que dos botes al mismo precio por kilo no rinden
            # lo mismo.
            "coste_por_dosis_efectiva": round(coste, 4) if coste else None,
            "flag_infradosaje": infradosaje,
            "modo": modo,
            "precio_referencia": round(precio, 4) if precio else None,
            "unidad_precio": unidad,
            "score_requisitos": nota_requisitos,
            "requisitos": detalle_requisitos,
            "desglose": desglose}


UNIDAD_LARGA = {"kg": "kilo", "capsula": "capsula"}


def precio_referencia(producto):
    """(precio, unidad) con el que se compara este producto dentro de su categoria.

    La unidad la manda la CATEGORIA (categorias.py), no lo que publique cada ficha: los
    polvos se comparan por kilo y las perlas por capsula. Un producto que no traiga la
    medida de su categoria (un preentreno que solo declara "30raciones") se queda sin
    precio comparable y sin la mitad del score: si la tienda no dice cuanto te llevas,
    no puede competir en precio.
    """
    unidad = categorias.unidad(producto.get("categoria"))
    if unidad == "kg" and producto.get("formato_gramos"):
        return producto["precio_eur"] / (producto["formato_gramos"] / 1000.0), "kg"
    if unidad == "capsula" and producto.get("unidades"):
        return producto["precio_eur"] / producto["unidades"], "capsula"
    return None, unidad


def puntuar_categoria(evaluaciones):
    """score_final 0-100 comparando dentro de la categoria.

    La calidad va en absoluto (0-100) y el precio en relativo al mas barato de la
    categoria, que es la unica forma de que "caro" signifique algo.

    El "mas barato" se busca entre los que se miden IGUAL: los €/kg contra los €/kg y
    los €/capsula contra los €/capsula. Comparar 30 €/kg con 0,07 €/capsula no da un
    ranking, da un numero sin sentido.
    """
    # --- nota de los compradores en la tienda -----------------------------------
    # Media bayesiana contra la media de la categoria: una nota con tres opiniones
    # todavia es casi la media de todos, y con cuatrocientas es casi la suya. Asi la
    # ficha nueva con un unico cinco estrellas no adelanta a la que lleva anos vendiendo.
    # Quien no tiene nota se queda EN la media: no publicar opiniones no es una falta.
    notas = [(e.get("valoracion"), e.get("n_valoraciones") or 0) for e in evaluaciones
             if e.get("valoracion")]
    media = (sum(v * n for v, n in notas) / sum(n for v, n in notas)
             if notas and sum(n for _, n in notas) else None)

    # --- requisitos de la categoria ---------------------------------------------
    # Misma regla que con las opiniones: a quien no se le ha podido juzgar ni un
    # requisito (su ficha no publica ni la lista de ingredientes ni la forma) se le pone
    # la media de su categoria. No es un aprobado regalado: es no afirmar nada de lo que
    # su tienda no cuenta, que es lo que hace el resto del proyecto.
    juzgados = [e["score_requisitos"] for e in evaluaciones
                if e.get("score_requisitos") is not None]
    media_req = sum(juzgados) / len(juzgados) if juzgados else None
    mas_barato = {}
    for e in evaluaciones:
        precio, unidad = e.get("precio_referencia"), e.get("unidad_precio")
        if precio:
            mas_barato[unidad] = min(mas_barato.get(unidad, precio), precio)
    for e in evaluaciones:
        precio, unidad = e.get("precio_referencia"), e.get("unidad_precio")
        suelo = mas_barato.get(unidad)
        if precio and suelo:
            precio_rel = suelo / precio             # 1.0 = el mas barato de su unidad
            e["desglose"] = e["desglose"] + [
                "%.2f EUR por %s (el mas barato de la categoria son %.2f)"
                % (precio, UNIDAD_LARGA.get(unidad, unidad), suelo)]
        else:
            precio_rel = 0.0
            e["desglose"] = e["desglose"] + [
                "la ficha no dice cuanto producto trae el envase: sin precio comparable "
                "se queda sin la mitad de la nota"]
        nota, n = e.get("valoracion"), e.get("n_valoraciones") or 0
        if media is None:
            # Nadie en la categoria publica opiniones: el peso vuelve a calidad y precio
            # repartido como estan, en vez de darle a todo el mundo el mismo regalo.
            valoracion_rel = (cfg.PESO_CALIDAD * e["score_calidad"] / 100.0
                              + cfg.PESO_COSTE * precio_rel) / (cfg.PESO_CALIDAD
                                                                + cfg.PESO_COSTE)
        elif nota:
            m = cfg.OPINIONES_DE_REFERENCIA
            bayes = (n * nota + m * media) / (n + m)
            valoracion_rel = bayes / 5.0
            e["desglose"] = e["desglose"] + [
                "%.1f sobre 5 con %d opiniones en la tienda (la media de la categoria es "
                "%.1f)" % (nota, n, media)]
        else:
            valoracion_rel = media / 5.0
            e["desglose"] = e["desglose"] + [
                "la tienda no publica opiniones de este producto: cuenta como la media de "
                "la categoria, ni suma ni resta"]
        req = e.get("score_requisitos")
        if req is not None and media_req is not None:
            # Amortiguada contra la media de su categoria segun cuantos se le hayan
            # podido juzgar: con uno solo, la nota apenas se mueve de la media; con
            # cuatro, manda casi entera la suya. Un si o un no no puede valer 20 puntos.
            n_req = len(e.get("requisitos") or [])
            k = cfg.REQUISITOS_DE_REFERENCIA
            req = (n_req * req + k * media_req) / (n_req + k)
        if req is None:
            # Nadie en la categoria publica lo suficiente: el peso vuelve a las partes
            # que si tienen datos, repartido como estan.
            req = media_req if media_req is not None else (
                100.0 * (cfg.PESO_CALIDAD * e["score_calidad"] / 100.0
                         + cfg.PESO_COSTE * precio_rel)
                / (cfg.PESO_CALIDAD + cfg.PESO_COSTE))
            e["desglose"] = e["desglose"] + [
                "su ficha no publica lo suficiente para juzgar los requisitos de la "
                "categoria: cuenta como la media, ni suma ni resta"]
        else:
            cumplidos = sum(1 for cumple, _ in e.get("requisitos") or [] if cumple)
            total = len(e.get("requisitos") or [])
            e["desglose"] = e["desglose"] + [
                "cumple %d de los %d requisitos de su categoria que su ficha permite "
                "comprobar" % (cumplidos, total)]
        e["score_final"] = round(
            cfg.PESO_CALIDAD * e["score_calidad"] + cfg.PESO_COSTE * 100.0 * precio_rel
            + cfg.PESO_REQUISITOS * req
            + cfg.PESO_VALORACION * 100.0 * valoracion_rel, 1)
    return evaluaciones


def sellos_de(producto, mejor_score_categoria):
    """Sellos de recomendacion. Criterio objetivo, umbral publico, cero dedo.

    Certifican un criterio EDITORIAL (que es lo mejor por calidad-precio verificable),
    nunca un efecto fisiologico. Por eso el texto no promete resultados.
    """
    sellos = []
    if producto.get("nivel_verificacion", 1) >= cfg.NIVEL_SELLO_VERIFICADO:
        sellos.append({
            "id": "verificado",
            "texto": "Verificado nivel 4",
            "criterio": "Su certificacion la respalda un tercero: comprobada contra la "
                        "fuente que la emite, o declarada en el nombre del producto con "
                        "una marca que exige ese tercero (Creapure, IFOS).",
        })
    score = producto.get("score_final")
    if (score is not None and score >= cfg.UMBRAL_SELLO_CALIDAD_PRECIO
            and mejor_score_categoria is not None and score >= mejor_score_categoria):
        sellos.append({
            "id": "calidad_precio",
            "texto": "Mejor calidad-precio verificada",
            "criterio": "Score mas alto de su categoria y por encima de %d sobre 100."
                        % cfg.UMBRAL_SELLO_CALIDAD_PRECIO,
        })
    return sellos


# --- capa de BD -----------------------------------------------------------------


def _dosis_referencia(con):
    return {r["ingrediente"]: dict(r)
            for r in con.execute("SELECT * FROM dosis_referencia").fetchall()}


def _nivel_verificacion(con, producto_id):
    """(nivel, tipo) de la MEJOR certificacion del producto. El tipo solo sirve para
    explicar el desglose: dos sellos distintos pueden dar el mismo nivel."""
    fila = con.execute(
        "SELECT nivel_verificacion n, tipo, codigo_qs FROM certificacion WHERE producto_id=? "
        "ORDER BY nivel_verificacion DESC LIMIT 1", (producto_id,)).fetchone()
    if not fila:
        return 1, None
    # Un Creapure con codigo QS comprobado y uno declarado en el nombre estan los dos en
    # nivel 4 pero no prueban lo mismo: el desglose tiene que decir cual es cual.
    tipo = "creapure_qs" if fila["tipo"] == "creapure" and fila["codigo_qs"] else fila["tipo"]
    return fila["n"], tipo


def _producto(fila):
    """La fila de la BD como dict, con `aditivos` ya des-serializado.

    En la BD es un JSON (o NULL si la ficha no publica la lista); el motor trabaja con
    una lista de Python, y None sigue significando "no lo dice".
    """
    p = dict(fila)
    p["aditivos"] = json.loads(p["aditivos"]) if p.get("aditivos") else p.get("aditivos")
    return p


def recalcular(con, categoria=None):
    ref = _dosis_referencia(con)
    sql = "SELECT * FROM producto" + (" WHERE categoria=?" if categoria else "")
    productos = con.execute(sql, (categoria,) if categoria else ()).fetchall()

    por_categoria = {}
    for p in productos:
        ingredientes = [dict(r) for r in con.execute(
            "SELECT ingrediente, dosis_por_servicio_mg FROM ingrediente_producto "
            "WHERE producto_id=?", (p["id"],)).fetchall()]
        nivel, tipo_cert = _nivel_verificacion(con, p["id"])
        e = evaluar(_producto(p), ingredientes, nivel, ref, tipo_cert)
        e["producto_id"] = p["id"]
        e["valoracion"] = p["valoracion"]
        e["n_valoraciones"] = p["n_valoraciones"]
        por_categoria.setdefault(p["categoria"], []).append(e)

    hoy = date.today().isoformat()
    total = 0
    for evaluaciones in por_categoria.values():
        for e in puntuar_categoria(evaluaciones):
            # Los requisitos se guardan con su texto: la ficha los enseña uno a uno con
            # un si o un no, y ese texto se escribe una sola vez, en requisitos.py.
            detalle = [{"id": r["id"], "que": r["que"], "porque": r["porque"],
                        "cumple": cumple} for cumple, r in (e.get("requisitos") or [])]
            con.execute(
                "INSERT INTO score (producto_id, score_calidad, coste_por_dosis_efectiva,"
                " flag_infradosaje, score_final, score_requisitos, requisitos, desglose,"
                " fecha_calculo) VALUES (?,?,?,?,?,?,?,?,?) "
                "ON CONFLICT(producto_id) DO UPDATE SET score_calidad=excluded.score_calidad,"
                " coste_por_dosis_efectiva=excluded.coste_por_dosis_efectiva,"
                " flag_infradosaje=excluded.flag_infradosaje, score_final=excluded.score_final,"
                " score_requisitos=excluded.score_requisitos, requisitos=excluded.requisitos,"
                " desglose=excluded.desglose, fecha_calculo=excluded.fecha_calculo",
                (e["producto_id"], e["score_calidad"], e["coste_por_dosis_efectiva"],
                 int(e["flag_infradosaje"]), e["score_final"], e.get("score_requisitos"),
                 json.dumps(detalle, ensure_ascii=False),
                 json.dumps(e["desglose"], ensure_ascii=False), hoy))
            total += 1
    con.commit()
    return total


def main():
    from data.db import connect
    categoria = sys.argv[1] if len(sys.argv) > 1 else None
    con = connect()
    n = recalcular(con, categoria)
    print("%d productos puntuados\n" % n)
    filas = con.execute(
        "SELECT p.marca, p.nombre, p.tienda, s.score_final f, s.score_calidad c,"
        " coalesce(p.precio_por_kg, p.precio_por_unidad) cd "
        "FROM score s JOIN producto p ON p.id=s.producto_id "
        + ("WHERE p.categoria=? " if categoria else "")
        + "ORDER BY s.score_final DESC LIMIT 10", (categoria,) if categoria else ()).fetchall()
    print("%-5s %-5s %-9s %-13s %s" % ("score", "cal", "EUR/kg-ud", "tienda", "producto"))
    for r in filas:
        print("%-5.1f %-5.1f %-9s %-13s %s %s" % (
            r["f"], r["c"], ("%.2f" % r["cd"]) if r["cd"] else "-", r["tienda"],
            r["marca"], r["nombre"][:44]))


if __name__ == "__main__":
    main()
