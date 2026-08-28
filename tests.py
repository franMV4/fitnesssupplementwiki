"""Comprobaciones del proyecto. Sin red, sin framework:  python tests.py

ponytail: asserts planos. Cubren la logica que puede romperse en silencio y dar
numeros falsos (normalizacion, scoring, sellos); no cada funcion.
"""

from scraper import core
from scraper.tiendas.hsn import Hsn, _objeto_json


def test_gramos():
    assert core.gramos("Creatina Monohidrato 1KG - 294raciones") == 1000
    assert core.gramos("https://x.es/creatina-creapure-400g") == 400
    assert core.gramos("Creatina 500 g") == 500
    assert core.gramos("Toma 5 g al dia") is None          # una dosis no es un formato
    assert core.gramos("Creatina en capsulas") is None


def test_forma_e_ingrediente():
    assert core.forma("Creatina Monohidrato") == "monohidrato"
    assert core.forma("THE Creatine Creapure 500g") == "monohidrato"
    assert core.forma("Creatina HCL 100G") == "hcl"
    assert core.forma("Evokalyn creatina alcalina") == "kre_alkalyn"
    assert core.forma("Creatina misteriosa") is None       # no se inventa la forma


def test_sellos_siempre_nivel_2():
    """Un sello mencionado en la ficha NUNCA entra como verificado."""
    sellos = core.sellos_declarados("100% Creapure(R) con Informed Sport")
    assert {s["tipo"] for s in sellos} == {"creapure", "informed_sport"}
    assert all(s["nivel_verificacion"] == 2 for s in sellos)
    assert core.sellos_declarados("Creatina normal") == []


def test_filtro_categoria():
    assert core.es_valido("Creatina Monohidrato en polvo")
    assert not core.es_valido("Pack Evowhey + Creatina con Shaker")
    assert not core.es_valido("Creatina en capsulas")
    assert not core.es_valido("Proteina Whey")
    # La etiqueta de formato no lleva el nombre de la categoria: filtrarla sola dejaba
    # el catalogo de HSN en cero productos sin dar ningun error.
    assert not core.es_valido("500g")
    assert core.es_valido("Creatina Excell (100% Creapure) en polvo 500g")


def test_url_imagen_normaliza_las_tres_formas():
    """Cada tienda la publica distinta: absoluta (HSN), sin esquema (Prozis, //host) y
    sin esquema ni barras (Life Pro, www.host). Y unas dan cadena y otras lista."""
    u = core.url_imagen
    assert u("https://hsnstore.com/a.jpg") == "https://hsnstore.com/a.jpg"
    assert u("//static.sscontent.com/a.jpg") == "https://static.sscontent.com/a.jpg"
    assert u("www.lifepronutrition.com/5105/a.jpg") == "https://www.lifepronutrition.com/5105/a.jpg"
    assert u(["www.lifepronutrition.com/a.jpg", "b.jpg"]) == "https://www.lifepronutrition.com/a.jpg"
    assert u({"url": "//cdn.es/a.jpg"}) == "https://cdn.es/a.jpg"
    assert u(None) is None and u([]) is None and u("") is None


def test_item_normaliza():
    s = Hsn()
    fila = s.item(marca="raw series", nombre="Creatina Monohidrato 1Kg &amp; Creapure",
                  url="https://x.es/p", formato_gramos=1000, precio_eur=20.0, servicios=200)
    p = fila["producto"]
    assert p["marca"] == "HSN Raw Series"                  # alias canonico
    assert "&amp;" not in p["nombre"]                      # entidades HTML resueltas
    assert p["forma"] == "monohidrato"
    assert fila["ingredientes"][0]["ingrediente"] == "creatina_monohidrato"
    assert fila["ingredientes"][0]["dosis_por_servicio_mg"] == 5000   # 1000 g / 200 tomas
    assert fila["certificaciones"][0]["nivel_verificacion"] == 2


def test_ld_json_atraviesa_el_envoltorio_cdata():
    """Prozis emite /*<![CDATA[*/ {...} /*]]>*/. json.loads lo rechaza y ld_json
    descartaba la ficha entera en silencio: parecia que no publicaban datos."""
    html = ('<script type="application/ld+json">/*<![CDATA[*/'
            '{"@type":"Product","name":"Creatina 300 g","offers":{"price":"34.99"}}'
            '/*]]>*/</script>')
    d = core.ld_json(html)
    assert [x["@type"] for x in d] == ["Product"]
    assert d[0]["offers"]["price"] == "34.99"


def test_una_proteina_con_creatina_no_es_una_creatina():
    """'100% Whey Prime + Creatine 907g' pasaba el filtro de categoria y entraba en la
    comparativa como la creatina mas barata de la tabla."""
    assert core.es_valido("Creatina Creapure 300 g", "creatina")
    assert not core.es_valido("100% Whey Prime + Creatine 907g", "creatina")
    assert not core.es_valido("100% Whey Prime Isolate + Creatine 907g", "creatina")


def test_objeto_json_cuenta_llaves():
    html = 'basura "attributes": {"216": {"code": "content_weight", "options": [{"label": "1Kg"}]}} mas basura'
    assert _objeto_json(html, "attributes")["216"]["options"][0]["label"] == "1Kg"
    assert _objeto_json(html, "no_existe") is None


def test_variantes_hsn_usan_el_bloque_del_producto():
    """La ficha trae bloques de config de los carruseles; vale el ultimo, no el primero."""
    html = (
        "<script>function initConfigurableSwatchOptions_999(){const c={"
        '"attributes":{"216":{"code":"content_weight","options":[{"label":"1Kg","products":["1"]}]}},'
        '"optionPrices":{"1":{"finalPrice":{"amount":99.0}}}};}</script>'
        "<script>function initConfigurableSwatchOptions_1000(){ initConfigurableOptions( '1000', {"
        '"attributes":{"216":{"code":"content_weight","options":[{"label":"500g","products":["2"]}]}},'
        '"optionPrices":{"2":{"finalPrice":{"amount":14.82}}}});}</script>'
    )
    assert list(Hsn()._variantes(html)) == [("500g", 14.82)]


# --- fase 3: motor de scoring ---------------------------------------------------

from scoring.motor import evaluar, puntuar_categoria      # noqa: E402

DOSIS_REF = {
    "creatina_monohidrato": {"dosis_efectiva_min_mg": 3000, "dosis_efectiva_max_mg": 5000,
                             "forma_preferida": "monohidrato"},
    "citrulina_malato": {"dosis_efectiva_min_mg": 6000, "dosis_efectiva_max_mg": 8000,
                         "forma_preferida": None},
    "beta_alanina": {"dosis_efectiva_min_mg": 4000, "dosis_efectiva_max_mg": 6000,
                     "forma_preferida": None},
    "cafeina": {"dosis_efectiva_min_mg": 200, "dosis_efectiva_max_mg": 400,
                "forma_preferida": None},
}


def _preentreno(nombre, precio, dosis, servicios=30):
    return (dict(nombre=nombre, categoria="preentreno", formato_gramos=300,
                 precio_eur=precio, servicios_por_envase=servicios, forma=None),
            [dict(ingrediente=k, dosis_por_servicio_mg=v) for k, v in dosis.items()])


def test_el_bien_dosificado_caro_gana_al_barato_infradosificado():
    """El caso que justifica todo el proyecto."""
    bueno = _preentreno("Bien dosificado", 39.90,
                        {"citrulina_malato": 8000, "beta_alanina": 4000, "cafeina": 300})
    malo = _preentreno("Fairy dusting", 19.90,
                       {"citrulina_malato": 1000, "beta_alanina": 800, "cafeina": 150})
    ev = [evaluar(p, i, 2, DOSIS_REF) for p, i in (bueno, malo)]
    puntuar_categoria(ev)
    assert ev[0]["score_final"] > ev[1]["score_final"], ev
    assert ev[1]["flag_infradosaje"] and not ev[0]["flag_infradosaje"]
    assert any("citrulina" in d for d in ev[1]["desglose"])       # el por que, en texto


def test_infradosaje_dobla_el_coste_real():
    """Si necesitas 2 scoops para llegar a dosis, el envase rinde la mitad."""
    p, i = _preentreno("Medio dosificado", 30.0,
                       {"citrulina_malato": 3000, "beta_alanina": 2000, "cafeina": 100})
    e = evaluar(p, i, 2, DOSIS_REF)
    assert abs(e["coste_por_dosis_efectiva"] - 2.0) < 0.01     # 30 EUR / 15 dosis reales
    assert e["flag_infradosaje"]


def test_modo_simple_usa_gramos_del_envase():
    p = dict(formato_gramos=1000, precio_eur=15.0, servicios_por_envase=None,
             forma="monohidrato", categoria="creatina")
    e = evaluar(p, [dict(ingrediente="creatina_monohidrato", dosis_por_servicio_mg=5000)],
                4, DOSIS_REF)
    assert e["modo"] == "simple"
    assert abs(e["coste_por_dosis_efectiva"] - 15.0 / (1000 * 1000 / 3000)) < 1e-6
    assert e["score_calidad"] == 100.0                        # nivel 4 + forma preferida


def test_la_verificacion_pesa_en_la_calidad():
    p = dict(formato_gramos=500, precio_eur=20.0, servicios_por_envase=None,
             forma="monohidrato", categoria="creatina")
    ing = [dict(ingrediente="creatina_monohidrato", dosis_por_servicio_mg=5000)]
    niveles = [evaluar(p, ing, n, DOSIS_REF)["score_calidad"] for n in (1, 2, 3, 4)]
    assert niveles == sorted(niveles) and niveles[0] < niveles[-1]


def test_forma_rara_puntua_menos_que_la_estudiada():
    base = dict(formato_gramos=500, precio_eur=20.0, servicios_por_envase=None,
                categoria="creatina")
    ing = [dict(ingrediente="creatina_monohidrato", dosis_por_servicio_mg=5000)]
    mono = evaluar(dict(base, forma="monohidrato"), ing, 2, DOSIS_REF)["score_calidad"]
    hcl = evaluar(dict(base, forma="hcl"), ing, 2, DOSIS_REF)["score_calidad"]
    assert mono > hcl


def test_sin_dosis_de_referencia_no_se_juzga_la_formula():
    """Preferimos no decir nada de la formula a inventarnos una referencia. El precio y
    la certificacion si se comparan: son datos, no suposiciones."""
    p = dict(formato_gramos=500, precio_eur=20.0, servicios_por_envase=30, forma=None,
             categoria="rara")
    e = evaluar(p, [dict(ingrediente="ingrediente_desconocido", dosis_por_servicio_mg=1000)],
                2, DOSIS_REF)
    assert e["coste_por_dosis_efectiva"] is None       # no se inventa
    assert e["score_calidad"] == 70.0                  # solo el nivel 2 de certificacion
    assert e["precio_referencia"] == 40.0 and e["unidad_precio"] == "kg"
    assert any("no publica las dosis" in d for d in e["desglose"])


def test_una_formula_nunca_usa_el_modo_simple():
    """El modo simple asume que el bote entero es el activo. En una formula eso daria
    un coste por dosis ridiculo (paso de verdad con un preentreno de HSN)."""
    p = dict(formato_gramos=500, precio_eur=26.16, servicios_por_envase=25, forma=None,
             categoria="preentreno")
    ingredientes = [dict(ingrediente="citrulina_malato", dosis_por_servicio_mg=5417.5),
                    dict(ingrediente="arginina", dosis_por_servicio_mg=3000)]   # sin referencia
    e = evaluar(p, ingredientes, 1, DOSIS_REF)
    assert e["modo"] == "complejo"
    assert e["coste_por_dosis_efectiva"] > 1.0          # ~1.16 EUR, no 0.31
    assert any("arginina" in d for d in e["desglose"])  # se dice que no se puede juzgar


# --- fases 5 y 6: afiliacion y sellos -------------------------------------------

from exportar import aplicar_afiliados, asignar_sellos, enlace_afiliado   # noqa: E402
from scoring.motor import sellos_de                                       # noqa: E402

CATALOGO = [
    dict(id=1, tienda="hsn", categoria="creatina", url="https://hsn.es/p?x=1",
         score_final=92.5, nivel_verificacion=3),
    dict(id=2, tienda="myprotein", categoria="creatina", url="https://mp.es/p",
         score_final=48.4, nivel_verificacion=1),
    dict(id=3, tienda="nutritienda", categoria="creatina", url="https://nt.es/p",
         score_final=46.2, nivel_verificacion=2),
]


def _orden(mapa):
    productos = [dict(p) for p in CATALOGO]
    aplicar_afiliados(productos, mapa)
    productos.sort(key=lambda p: -p["score_final"])
    return [(p["id"], p["score_final"]) for p in productos]


def test_los_afiliados_no_mueven_el_ranking():
    """La promesa central de la fase 5: cambiar los enlaces no cambia el orden."""
    sin_nada = _orden({})
    solo_uno = _orden({"nutritienda": {"parametros": {"aff": "ME_PAGAN_MUCHO"}}})
    todas = _orden({t: {"parametros": {"aff": "x"}} for t in ("hsn", "myprotein", "nutritienda")})
    assert sin_nada == solo_uno == todas


def test_enlace_afiliado_conserva_la_url_de_la_tienda():
    url = enlace_afiliado("hsn", "https://hsn.es/p?x=1", {"hsn": {"parametros": {"awc": "ID"}}})
    assert url.startswith("https://hsn.es/p?") and "x=1" in url and "awc=ID" in url
    assert enlace_afiliado("hsn", "https://hsn.es/p", {}) is None      # sin programa, sin enlace


def test_el_sello_se_gana_por_umbral_publico():
    mejor = 92.5
    primero = dict(score_final=92.5, nivel_verificacion=3, categoria="creatina")
    segundo = dict(score_final=90.0, nivel_verificacion=4, categoria="creatina")
    ids = lambda p, m: {s["id"] for s in sellos_de(p, m)}                # noqa: E731
    assert ids(primero, mejor) == {"calidad_precio"}
    assert ids(segundo, mejor) == {"verificado"}                        # no es el nº1
    # Si el mejor de la categoria no llega al umbral, la categoria se queda sin sello.
    flojo = dict(score_final=40.0, nivel_verificacion=2, categoria="creatina")
    assert ids(flojo, 40.0) == set()


def test_asignar_sellos_solo_premia_al_primero():
    productos = [dict(p) for p in CATALOGO]
    asignar_sellos(productos)
    con_sello = [p["id"] for p in productos if p["sellos"]]
    assert con_sello == [1]


# --- verificacion de sellos ------------------------------------------------------

from data.db import connect, guardar_producto, init                       # noqa: E402
from scoring.config import NIVEL_MARCA_LICENCIADA                         # noqa: E402
from verificar import (candidatos_analisis, mismo_dominio,               # noqa: E402
                       promover_marcas_licenciadas)


def _bd_con(nombre, url="https://hsnstore.com/p"):
    """BD en memoria con un solo producto. Sin ficheros ni red."""
    con = connect(":memory:")
    init(con)
    pid = guardar_producto(con, dict(
        marca="Marca", nombre=nombre, categoria="creatina", tienda="hsn", url=url,
        formato_gramos=500, precio_eur=20.0, forma="monohidrato", fecha_scrape="2026-01-01"))
    return con, pid


def _cert(con, pid, tipo="creapure"):
    return con.execute("SELECT * FROM certificacion WHERE producto_id=? AND tipo=?",
                       (pid, tipo)).fetchone()


def test_creapure_en_el_nombre_sube_de_nivel():
    """La marca licenciada en el nombre la firman marca y tienda: no es un logo suelto."""
    con, pid = _bd_con("Creatina Monohidrato Creapure 500g")
    assert promover_marcas_licenciadas(con) == (1, 0)
    c = _cert(con, pid)
    assert c["nivel_verificacion"] == NIVEL_MARCA_LICENCIADA
    assert c["url_evidencia"] == "https://hsnstore.com/p" and c["verificado_por"] == "auto"
    # Idempotente: volver a pasarla no vuelve a subir nada.
    assert promover_marcas_licenciadas(con) == (0, 0)


def test_creapure_fuera_del_nombre_no_cuenta():
    """En la descripcion y los carruseles aparece el Creapure de OTROS productos."""
    con, pid = _bd_con("Creatina Monohidrato 200 mesh 500g")
    assert promover_marcas_licenciadas(con) == (0, 0)
    assert _cert(con, pid) is None


def test_si_la_tienda_deja_de_declararlo_el_sello_baja():
    con, pid = _bd_con("Creatina Creapure 500g")
    promover_marcas_licenciadas(con)
    con.execute("UPDATE producto SET nombre='Creatina 500g' WHERE id=?", (pid,))
    assert promover_marcas_licenciadas(con) == (0, 1)
    assert _cert(con, pid)["nivel_verificacion"] == 2


def test_una_comprobacion_manual_manda_sobre_lo_automatico():
    """Un nivel 4 con codigo QS no lo toca nadie, y un 2 bajado a mano tampoco sube solo."""
    con, pid = _bd_con("Creatina Creapure 500g")
    con.execute("INSERT INTO certificacion (producto_id, tipo, nivel_verificacion, codigo_qs,"
                " verificado_fecha, verificado_por) VALUES (?,'creapure',4,'123456',"
                "'2026-01-01','manual')", (pid,))
    assert promover_marcas_licenciadas(con) == (0, 0)
    assert _cert(con, pid)["nivel_verificacion"] == 4


def test_el_desglose_distingue_los_dos_niveles_4():
    """Creapure declarado y Creapure con codigo QS puntuan igual, pero no prueban lo mismo:
    el lector tiene que poder ver cual de los dos tiene delante."""
    from scoring.motor import _factor_verificacion
    declarado = _factor_verificacion(4, "creapure")[1]
    comprobado = _factor_verificacion(4, "creapure_qs")[1]
    assert declarado != comprobado
    assert "QS" in comprobado and "QS" not in declarado
    assert "nombre" in declarado


def test_un_pdf_de_un_tercero_no_es_analisis_de_la_marca():
    """'lab' casaba dentro de 'labelling' y colaba una guia de la UE como analisis."""
    ficha = "https://www.hsnstore.com/creatina"
    assert mismo_dominio("/media/analisis-lote.pdf", ficha)
    assert mismo_dominio("https://hsnstore.com/media/certificado.pdf", ficha)
    assert not mismo_dominio(
        "https://food.ec.europa.eu/labelling_nutrition-guidance_tolerances.pdf", ficha)


def test_el_analisis_del_producto_va_con_comillas_simples():
    """El WYSIWYG de HSN emite href='...': aceptar solo comillas dobles dejaba fuera
    el analisis de pureza del producto y colaba los certificados de fabrica."""
    ficha = "https://www.hsnstore.com/marcas/raw-series/creatina-monohidrato-200-mesh"
    html = ("<a href='https://www.hsnstore.com/media/wysiwyg/analysis/"
            "nutri-creatine-mono-creatine-hsn_1.pdf' target='_blank'>analisis de pureza</a>"
            '<a href="https://www.hsnstore.com/media/wysiwyg/analysis/'
            'certificate-es-accp-hsn-2026-2027_1.pdf">HACCP de la fabrica</a>')
    assert candidatos_analisis(html, ficha) == [
        "https://www.hsnstore.com/media/wysiwyg/analysis/nutri-creatine-mono-creatine-hsn_1.pdf"]


def test_el_rescrape_retira_un_sello_que_ya_no_esta():
    """Incluso los que declaro una version vieja del scraper (verificado_por NULL)."""
    con, pid = _bd_con("Creatina Creapure 500g")
    con.execute("INSERT INTO certificacion (producto_id, tipo, nivel_verificacion)"
                " VALUES (?,'creapure',2)", (pid,))
    guardar_producto(con, dict(marca="Marca", nombre="Creatina 500g", categoria="creatina",
                               tienda="hsn", url="https://hsnstore.com/p", formato_gramos=500,
                               precio_eur=20.0, forma="monohidrato", fecha_scrape="2026-01-02"))
    assert _cert(con, pid) is None


# --- categorias nuevas: capsulas, proteina y formulas sin tabla nutricional -------

import categorias                                                         # noqa: E402
import pathlib                                                            # noqa: E402


def test_unidades_solo_cuenta_envases():
    assert core.unidades("Omega 3 1000 mg 120 softgels") == 120
    assert core.unidades("Multivitaminico 90 capsulas") == 90
    assert core.unidades("Colageno 300 g") is None
    assert core.unidades("Toma 2 capsulas al dia") is None      # una toma no es un envase
    # 1000 mg por perla no son gramos de envase, y las perlas no son gramos.
    assert core.medida("Omega-3 aceite pescado 1000mg 120 perlas") == (None, 120.0)


def test_cada_categoria_se_queda_con_lo_suyo():
    """Sin esto una isolate cuenta dos veces y un pack entra como producto."""
    v = core.es_valido
    assert v("Impact Whey Protein 1kg", "proteina_whey")
    assert not v("Impact Whey Isolate 1kg", "proteina_whey")    # es de la otra categoria
    assert v("Impact Whey Isolate 1kg", "proteina_aislada")
    assert not v("Proteina de guisante aislada 1kg", "proteina_aislada")
    assert not v("Cafe proteico 500g", "proteina_whey")         # no es un bote de proteina
    assert v("Omega 3 90 capsulas", "omega3")                   # aqui las capsulas SI valen
    assert not v("Omega 3-6-9 120 perlas", "omega3")            # el 6 y el 9 no son omega 3
    assert not v("Creatina en capsulas", "creatina")
    assert not v("Pack Whey + Creatina", "proteina_whey")
    assert not v("Muestra Whey 30g", "proteina_whey")


def test_dosis_en_prosa_de_la_ficha():
    """Myprotein no publica tabla nutricional pero cuenta la formula en la descripcion."""
    texto = ("Una dosis de 200&nbsp;mg de cafeina agudiza la concentracion. Tambien "
             "contiene 3&nbsp;g de monohidrato de creatina para las rafagas de fuerza.")
    assert core.dosis_en_texto(texto) == [
        {"ingrediente": "creatina_monohidrato", "dosis_por_servicio_mg": 3000.0},
        {"ingrediente": "cafeina", "dosis_por_servicio_mg": 200.0}]
    # Marketing sin cifras no inventa dosis.
    assert core.dosis_en_texto("El mejor preentreno con cafeina y creatina del mercado") == []


def test_un_preentreno_sin_formula_no_se_puntua_como_si_la_tuviera():
    """Life Pro no publica dosis: entra por precio y certificacion, pero no se le
    inventa un coste por dosis ni se le acusa de infradosificado."""
    p = dict(formato_gramos=400, precio_eur=26.91, servicios_por_envase=None, forma=None,
             categoria="preentreno")
    e = evaluar(p, [], 1, DOSIS_REF)
    assert e["coste_por_dosis_efectiva"] is None and not e["flag_infradosaje"]
    assert e["precio_referencia"] and e["unidad_precio"] == "kg"
    assert any("no publica las dosis" in d for d in e["desglose"])


def test_una_formula_con_un_solo_dato_sigue_siendo_formula():
    """El modo lo manda la categoria: si no, un preentreno del que solo sabemos la
    cafeina se puntuaria como si el bote entero fuese cafeina (0,03 EUR/dosis)."""
    p = dict(formato_gramos=650, precio_eur=32.99, servicios_por_envase=25, forma=None,
             categoria="preentreno")
    e = evaluar(p, [dict(ingrediente="cafeina", dosis_por_servicio_mg=300)], 1, DOSIS_REF)
    assert e["modo"] == "complejo"
    assert e["coste_por_dosis_efectiva"] > 1.0


def test_la_pureza_separa_concentrado_de_aislado():
    """Dos botes al mismo precio por kilo no cuestan lo mismo por dosis de proteina."""
    ref = {"proteina_whey_concentrada": {"dosis_efectiva_min_mg": 20000,
                                         "pureza_tipica": 0.75, "forma_preferida": None},
           "proteina_whey_aislada": {"dosis_efectiva_min_mg": 20000,
                                     "pureza_tipica": 0.88, "forma_preferida": None}}
    def coste(cat, ing):
        p = dict(formato_gramos=1000, precio_eur=30.0, servicios_por_envase=None,
                 forma=None, categoria=cat)
        return evaluar(p, [dict(ingrediente=ing, dosis_por_servicio_mg=None)], 1,
                       ref)["coste_por_dosis_efectiva"]
    conc = coste("proteina_whey", "proteina_whey_concentrada")
    aisl = coste("proteina_aislada", "proteina_whey_aislada")
    assert abs(conc - 30.0 / 37.5) < 0.001      # 750 g de proteina = 37,5 dosis
    assert aisl < conc                          # el aislado rinde mas dosis por bote


def test_no_declarar_forma_solo_penaliza_donde_la_evidencia_la_pide():
    """Una creatina sin forma declarada baja; una proteina no, porque su referencia no
    distingue formas quimicas."""
    ref_prot = {"proteina_whey_concentrada": {"dosis_efectiva_min_mg": 20000,
                                              "pureza_tipica": 0.75, "forma_preferida": None}}
    prot = evaluar(dict(formato_gramos=1000, precio_eur=30.0, servicios_por_envase=None,
                        forma=None, categoria="proteina_whey"),
                   [dict(ingrediente="proteina_whey_concentrada", dosis_por_servicio_mg=None)],
                   1, ref_prot)
    crea = evaluar(dict(formato_gramos=1000, precio_eur=15.0, servicios_por_envase=None,
                        forma=None, categoria="creatina"),
                   [dict(ingrediente="creatina_monohidrato", dosis_por_servicio_mg=None)],
                   1, DOSIS_REF)
    assert prot["score_calidad"] > crea["score_calidad"]


def test_las_categorias_del_registro_estan_completas():
    """categorias.py lo leen el scraper, el motor y la web: una entrada a medias rompe
    las tres a la vez y en sitios distintos."""
    for slug, c in categorias.CATEGORIAS.items():
        assert c["modo"] in ("simple", "formula"), slug
        assert c["nombre"] and isinstance(c["nombre"], str), slug
        # Una categoria simple necesita saber cual es su activo (la creatina lo deduce
        # de la forma quimica y por eso es la unica que puede no declararlo).
        assert c["modo"] == "formula" or c["activo"] or slug == "creatina", slug


def test_una_categoria_en_capsulas_no_ensena_precio_por_kilo():
    from data.db import connect as _connect
    con = _connect(":memory:")
    init(con)
    pid = guardar_producto(con, dict(
        marca="Marca", nombre="Omega 3 120 perlas", categoria="omega3", tienda="hsn",
        url="https://hsnstore.com/omega", unidades=120, precio_eur=9.06,
        fecha_scrape="2026-08-21"))
    fila = con.execute("SELECT precio_por_kg, precio_por_unidad FROM producto WHERE id=?",
                       (pid,)).fetchone()
    assert fila["precio_por_kg"] is None
    assert abs(fila["precio_por_unidad"] - 0.0755) < 0.0001


def test_un_multivitaminico_no_se_puntua_por_su_cafeina():
    """Un multi de HSN con 100 mg de cafeina se estaba puntuando como si fuera un
    suplemento de cafeina infradosificado, y con eso encabezaba su categoria."""
    class Falsa(core.Scraper):
        tienda = "hsn"
    fila = Falsa().item(marca="HSN", nombre="360 multi am 120 tabletas",
                        url="https://hsnstore.com/multi", unidades=120, precio_eur=15.9,
                        categoria="multivitaminico",
                        ingredientes=[dict(ingrediente="cafeina",
                                           dosis_por_servicio_mg=100)])
    assert fila["ingredientes"] == []
    # El omega 3 si conserva lo suyo y solo lo suyo.
    omega = Falsa().item(marca="HSN", nombre="Omega-3 120 perlas",
                         url="https://hsnstore.com/omega", unidades=120, precio_eur=9.06,
                         categoria="omega3",
                         ingredientes=[dict(ingrediente="omega_3_epa_dha",
                                            dosis_por_servicio_mg=300),
                                       dict(ingrediente="cafeina",
                                            dosis_por_servicio_mg=10)])
    assert [i["ingrediente"] for i in omega["ingredientes"]] == ["omega_3_epa_dha"]


def test_el_rescrape_retira_un_ingrediente_que_ya_no_esta():
    """Mismo criterio que con los sellos: arreglar una deteccion no puede dejar vivo lo
    que metio mal la version anterior."""
    con, pid = _bd_con("Multivitaminico 120 tabletas")
    con.execute("INSERT INTO ingrediente_producto (producto_id, ingrediente,"
                " dosis_por_servicio_mg) VALUES (?,'cafeina',100)", (pid,))
    guardar_producto(con, dict(marca="Marca", nombre="Creatina 500g", categoria="creatina",
                               tienda="hsn", url="https://hsnstore.com/p", formato_gramos=500,
                               precio_eur=20.0, forma="monohidrato", fecha_scrape="2026-01-02"),
                     [dict(ingrediente="creatina_monohidrato", dosis_por_servicio_mg=5000)])
    quedan = [r[0] for r in con.execute(
        "SELECT ingrediente FROM ingrediente_producto WHERE producto_id=?", (pid,))]
    assert quedan == ["creatina_monohidrato"], quedan


def test_ifos_en_el_nombre_es_nivel_4():
    """IFOS no es un logo que se ponga uno: analiza los lotes un tercero (Nutrasource) y
    publica el informe. Ponerlo en el nombre es firmarlo, igual que Creapure."""
    con, pid = _bd_con("Ultra omega-3 TG (IFOS) 1000mg 120 perlas")
    assert promover_marcas_licenciadas(con) == (1, 0)
    c = _cert(con, pid, "ifos")
    assert c["nivel_verificacion"] == NIVEL_MARCA_LICENCIADA
    # Y un omega 3 cualquiera no lo hereda por vender aceite de pescado.
    con2, pid2 = _bd_con("Omega-3 aceite pescado 1000mg 120 perlas")
    assert promover_marcas_licenciadas(con2) == (0, 0)


def test_la_fila_de_omega_3_de_hsn_cuenta_aunque_no_nombre_el_epa():
    """La mitad de las fichas de HSN titulan esa fila "Acidos grasos Omega 3" a secas.
    Sin reconocerla, sus aceites de pescado se quedaban sin dosis y sin puntuar."""
    assert core.normalizar_ingrediente("Acidos grasos Omega 3") == "omega_3_epa_dha"
    assert core.normalizar_ingrediente("Acidos grasos Omega 3 (EPA + DHA)") == "omega_3_epa_dha"
    assert core.normalizar_ingrediente("Aceite de pescado (trigliceridos)") is None


def test_una_creatina_sin_forma_declarada_se_puntua_penalizada():
    """Prozis vende "Zero Creatine" sin decir que forma es. Antes se quedaba sin nota y
    sin coste por dosis; ahora se compara con la referencia de monohidrato y paga el no
    declararlo (FACTOR_FORMA_DESCONOCIDA), que es para lo que existe ese factor."""
    class Falsa(core.Scraper):
        tienda = "prozis"
    fila = Falsa().item(marca="Prozis", nombre="Zero Creatine 300 g",
                        url="https://prozis.com/zero", formato_gramos=300,
                        precio_eur=37.09, categoria="creatina")
    assert fila["producto"]["forma"] is None
    assert [i["ingrediente"] for i in fila["ingredientes"]] == ["creatina_monohidrato"]
    # Pero si la ficha SI dice la forma, manda la forma y no el activo por defecto.
    hcl = Falsa().item(marca="Myprotein", nombre="Creatina HCL 100g",
                       url="https://mp.es/hcl", formato_gramos=100, precio_eur=16.99,
                       categoria="creatina")
    assert [i["ingrediente"] for i in hcl["ingredientes"]] == ["creatina_hcl"]

    e = evaluar(fila["producto"], fila["ingredientes"], 1, DOSIS_REF)
    assert e["coste_por_dosis_efectiva"] and e["score_calidad"] > 0
    assert any("forma no declarada" in d for d in e["desglose"])


# --- el score va por precio de la unidad de venta (cambio del 2026-08-21) ---------

from scoring.motor import precio_referencia                                # noqa: E402


def test_el_precio_por_kilo_manda_la_mitad_del_score():
    """Misma calidad y distinto precio por kilo: gana el barato, y el mas caro pierde
    exactamente la proporcion en la que es mas caro."""
    barato = dict(formato_gramos=1000, precio_eur=20.0, servicios_por_envase=None,
                  forma="monohidrato", categoria="creatina")
    caro = dict(barato, precio_eur=40.0)
    ing = [dict(ingrediente="creatina_monohidrato", dosis_por_servicio_mg=None)]
    ev = [evaluar(p, ing, 1, DOSIS_REF) for p in (barato, caro)]
    assert [e["precio_referencia"] for e in ev] == [20.0, 40.0]
    puntuar_categoria(ev)
    # Calidad identica (60), precio 100 % vs 50 %: 0.5*60+0.5*100 = 80 y 0.5*60+0.5*50 = 55.
    assert ev[0]["score_final"] == 80.0 and ev[1]["score_final"] == 55.0
    assert any("20.00 EUR por kilo" in d for d in ev[0]["desglose"])


def test_los_kilos_y_las_capsulas_no_se_mezclan():
    """Cada categoria se compara en su unidad. 30 EUR/kg y 0,07 EUR/capsula en la misma
    columna no son un ranking, son dos numeros sin relacion."""
    polvo = dict(formato_gramos=300, unidades=None, precio_eur=9.0, categoria="creatina")
    perlas = dict(formato_gramos=None, unidades=120, precio_eur=9.0, categoria="omega3")
    assert precio_referencia(polvo) == (30.0, "kg")
    assert precio_referencia(perlas) == (0.075, "capsula")
    # Un bote de capsulas en una categoria de polvo no tiene precio comparable...
    assert precio_referencia(dict(perlas, categoria="creatina")) == (None, "kg")
    # ...y por eso el scraper ni lo recoge: medida solo devuelve la medida de su categoria.
    assert core.medida("Creatina 90 capsulas", categoria="creatina") == (None, None)
    assert core.medida("Omega 3 90 capsulas", categoria="omega3") == (None, 90.0)
    assert core.medida("Aceite de pescado 300 g", categoria="omega3") == (None, None)


def test_sin_formato_declarado_no_hay_media_nota():
    """Myprotein vende "THE Pre-Workout 30raciones" sin decir los gramos en ninguna parte.
    Sin formato no hay precio comparable, y sin precio no se puede ser el mas barato."""
    p = dict(formato_gramos=None, unidades=None, servicios_por_envase=30, precio_eur=20.99,
             forma=None, categoria="preentreno")
    e = evaluar(p, [], 1, DOSIS_REF)
    assert e["precio_referencia"] is None
    puntuar_categoria([e])
    assert e["score_final"] == round(0.5 * e["score_calidad"], 1)
    assert any("sin precio comparable" in d for d in e["desglose"])


def test_cada_categoria_declara_su_consulta_y_su_slug_de_web():
    """El SEO de una categoria nueva no puede depender de que alguien se acuerde.

    La pagina construye su titulo, su H1 y sus preguntas desde estos campos: sin ellos
    la categoria se publica con el titulo generico y no compite por nada. Y el slug de
    la web va con guiones porque Google no parte palabras en "_": /proteina_whey es un
    token unico y /proteina-whey son dos palabras. Ver SEO-PRODUCTOS.md."""
    import json
    import exportar
    dosis = json.loads(pathlib.Path("data/dosis_referencia.json").read_text(encoding="utf-8"))
    for slug in categorias.CATEGORIAS:
        seo = exportar.seo(slug)
        assert seo["termino"], slug
        assert seo["mejor"].startswith(("el ", "la ", "los ", "las ")), slug
        assert "mejor" in seo["consultas"], slug
        # Una pregunta sin generador que la conteste dejaria un hueco silencioso.
        assert set(seo["consultas"]) <= {"mejor", "barato", "precio", "certificacion", "dosis"}, slug
        # Si promete responder cuanto tomar, tiene que haber una dosis con fuente.
        if "dosis" in seo["consultas"]:
            assert seo["dosis_key"] in {d["ingrediente"] for d in dosis["dosis"]}, slug
        assert "_" not in exportar.web_slug(slug), slug


def test_dos_fichas_no_comparten_url():
    """El slug sale de marca+nombre+tienda, y Myprotein vende el mismo producto y
    formato a dos precios (los sabores no valen todos lo mismo). Sin desempate, esas
    fichas escriben el mismo fichero: se publica una y las otras enlazan a un precio
    que no es el suyo. Eran 9 URLs y 19 productos hasta el 2026-08-21."""
    from exportar import desambiguar_slugs
    ps = [dict(slug="whey-1kg-myprotein", url="https://t/a"),
          dict(slug="whey-1kg-myprotein", url="https://t/b"),
          dict(slug="creatina-hsn", url="https://t/c")]
    desambiguar_slugs(ps)
    assert len({p["slug"] for p in ps}) == 3
    assert ps[2]["slug"] == "creatina-hsn"        # el que no colisiona no se toca
    # Estable: una segunda pasada no vuelve a renombrar nada, o cada actualizacion
    # cambiaria las URLs ya indexadas.
    antes = [p["slug"] for p in ps]
    desambiguar_slugs(ps)
    assert [p["slug"] for p in ps] == antes


def test_el_mismo_bote_listado_dos_veces_es_una_fila():
    """Life Pro tiene su glutamina en dos URLs de su propio catalogo, a 26,01 y a 26,91.
    Con el precio dentro de la clave de agrupar_sabores salian dos filas del mismo bote
    en la misma tabla, con dos fichas casi identicas. Se queda la mas barata."""
    from exportar import agrupar_sabores
    base = dict(marca="Life Pro", formato_gramos=500.0, unidades=None, forma=None,
                categoria="glutamina", tienda="lifepro", score_final=70,
                precio_referencia=52.0, sabores=None)
    ps = [dict(base, nombre="LIFE PRO GLUTAMINE 500G", precio_eur=26.91, slug="a", url="u1"),
          dict(base, nombre="LIFE PRO GLUTAMINE 500G", precio_eur=26.01, slug="b", url="u2"),
          dict(base, nombre="LIFE PRO CREATINE 500G", precio_eur=30.0, slug="c", url="u3")]
    fuera = agrupar_sabores(ps)
    assert len(fuera) == 2
    glutaminas = [p for p in fuera if "GLUTAMINE" in p["nombre"]]
    assert len(glutaminas) == 1 and glutaminas[0]["precio_eur"] == 26.01


def test_dos_sabores_a_distinto_precio_conservan_su_nombre():
    """Myprotein vende el mismo formato a dos precios: el sin sabor mas barato que el de
    cacao. Son dos grupos distintos, asi que quitarles el sabor del nombre dejaba dos
    filas llamadas igual y con el mismo slug: una se publicaba y la otra enlazaba a la
    ficha equivocada."""
    from exportar import agrupar_sabores
    base = dict(marca="Myprotein", formato_gramos=1000.0, unidades=None, forma=None,
                categoria="proteina_aislada", tienda="myprotein", score_final=70,
                precio_referencia=60.0)
    ps = [dict(base, nombre="Impact Whey Isolate 1KG - Sin Sabor", precio_eur=59.99, slug="a", url="u1"),
          dict(base, nombre="Impact Whey Isolate 1KG - Vainilla", precio_eur=59.99, slug="b", url="u2"),
          dict(base, nombre="Impact Whey Isolate 1KG - Cocoa", precio_eur=74.99, slug="c", url="u3")]
    fuera = agrupar_sabores(ps)
    # Los dos de 59,99 son sabores del mismo producto y colapsan; el de 74,99 no.
    assert len(fuera) == 2
    assert len({p["nombre"] for p in fuera}) == 2
    assert len({p["slug"] for p in fuera}) == 2


def test_microdatos_leen_un_producto_con_marca_y_oferta():
    """El otro formato de schema.org. Zumub publica asi todo su catalogo.

    Lo que no puede hacer una regex y por lo que esto va con html.parser: la marca es un
    itemscope DENTRO del producto, y su "name" no es el name del producto.
    """
    html = """
    <div itemscope itemtype="https://schema.org/Product">
      <span class="hidden" itemprop="name">Creatina 1 kg</span>
      <div class="hidden" itemprop="brand" itemscope itemtype="https://schema.org/Brand">
        <span itemprop="name">Zumub</span>
      </div>
      <span class="hidden" itemprop="sku">7186</span>
      <div itemprop="offers" itemscope itemtype="https://schema.org/Offer">
        <span itemprop="priceCurrency" content="EUR"></span>
        <span itemprop="price" content="12.98">12,98 EUR</span>
      </div>
    </div>
    <div itemscope itemtype="https://schema.org/Product">
      <span itemprop="name">Creatina 500 g</span>
    </div>"""
    productos = core.microdatos(html, "Product")
    assert len(productos) == 2, productos
    p = productos[0]
    assert p["name"] == "Creatina 1 kg"
    assert p["brand"]["name"] == "Zumub"            # la marca no pisa el nombre del producto
    assert p["sku"] == "7186"
    assert p["offers"]["price"] == "12.98"          # gana el atributo content, no el texto
    # El segundo itemscope no hereda nada del primero.
    assert productos[1]["name"] == "Creatina 500 g"
    assert "sku" not in productos[1]


def test_amazon_saca_la_marca_del_titulo():
    """Amazon no publica la marca en ningun campo: se corta el titulo donde empieza el
    producto. Sin esto, toda la tienda salia en la tabla como "Desconocida"."""
    from scraper.tiendas.amazon import _marca, _precio
    assert _marca("HSN Creatina Monohidrato en Polvo 1 Kg") == "HSN"
    assert _marca("Optimum Nutrition Creatina Monohidrato Micronizada, 634g") == "Optimum Nutrition"
    assert _marca("Bandini(R) Creatina Monohidratada en Polvo 1kg") == "Bandini(R)"
    # Si el titulo empieza por el producto, no hay marca que sacar y no se inventa.
    assert _marca("Creatina Monohidratada Extrapura Polvo 1 kg") == "Desconocida"
    assert _precio("16,40 EUR") == 16.4
    assert _precio("1.299,00 EUR") == 1299.0        # el punto de los miles no es decimal
    assert _precio("") is None


def test_amazon_no_da_nivel_4_por_el_nombre():
    """En un marketplace el titulo lo escribe el vendedor, no la tienda: "Creapure" ahi no
    es nadie firmando un contrato de licencia. El nivel 4 exige un tercero detras."""
    from verificar import promover_marcas_licenciadas
    con = connect(":memory:")
    init(con)
    for tienda, url in (("hsn", "https://hsnstore.com/p"), ("amazon", "https://amazon.es/dp/X")):
        guardar_producto(con, dict(
            marca="Marca", nombre="Creatina Creapure 500g", categoria="creatina",
            tienda=tienda, url=url, formato_gramos=500, precio_eur=20.0,
            forma="monohidrato", fecha_scrape="2026-01-01"))
    promover_marcas_licenciadas(con)
    niveles = {r["tienda"]: r["n"] for r in con.execute(
        "SELECT p.tienda, c.nivel_verificacion n FROM producto p "
        "LEFT JOIN certificacion c ON c.producto_id = p.id")}
    assert niveles["hsn"] == NIVEL_MARCA_LICENCIADA
    assert niveles["amazon"] is None or niveles["amazon"] < NIVEL_MARCA_LICENCIADA


def test_la_melatonina_tiene_su_propio_suelo_de_dosis():
    """El suelo comun son 10 mg (por debajo, en una ficha, hay precios y calorias, no
    dosis). La dosis util de melatonina es 1 mg, asi que con el suelo comun la categoria
    entera se quedaba sin nota."""
    assert core.dosis_en_texto("Melatonina 1 mg 120 capsulas") == [
        dict(ingrediente="melatonina", dosis_por_servicio_mg=1.0)]
    # El suelo comun sigue en pie para el resto: 2 mg de cafeina no es una dosis.
    assert core.dosis_en_texto("Bebida con 2 mg de cafeina") == []


def test_la_cafeina_no_es_un_cafe():
    """NO_ES_UN_BOTE llevaba "cafe" sin \b y casaba con "cafeina": la categoria entera
    salia con cero productos y sin un solo error en el log."""
    assert core.es_valido("Cafeina Natural 200 mg 90 capsulas", "cafeina")
    # Un cafe con cafeina anadida sigue siendo un cafe, no un bote de cafeina.
    assert not core.es_valido("Keto Cafe Instantaneo con Cafeina 200 g", "cafeina")
    assert not core.es_valido("Pre-entreno con cafeina 300 g", "cafeina")


def test_amazon_corta_la_cola_de_marketing_del_titulo():
    """Un titulo de Amazon son 200 caracteres. Sin cortarlo, dos formatos del mismo
    producto acaban con el mismo <title> (se corta a 78) y compiten entre ellos."""
    from scraper.tiendas.amazon import _nombre_corto
    largo = ("HSN Creatina Monohidrato en Polvo (200 mesh) Sin Sabor 1 Kg | 100% Puro "
             "Monohidrato de Creatina Sin Anadidos. Libre de DCD o DHT.")
    assert _nombre_corto(largo) == "HSN Creatina Monohidrato en Polvo (200 mesh) Sin Sabor 1 Kg"
    # Si la cabeza no trae el formato, el formato esta en la cola y el nombre no se toca:
    # es lo unico que distingue dos variantes.
    sin_formato = "Creatina Monohidratada | Bote de 500 g y 294 dosis"
    assert _nombre_corto(sin_formato) == sin_formato


def test_la_marca_no_se_repite_dentro_del_nombre():
    """Zumub lista el mismo bote con y sin su marca delante ("EAA powder 250 g" y "Zumub
    EAA powder 250 g"): sin quitarla eran dos productos, dos fichas y dos titulos iguales."""
    class Falsa(core.Scraper):
        tienda = "zumub"
    fila = Falsa().item(marca="Zumub", nombre="Zumub EAA powder 250 g",
                        url="https://zumub.com/p", formato_gramos=250, precio_eur=20.0,
                        categoria="eaa")["producto"]
    assert fila["marca"] == "Zumub" and fila["nombre"] == "EAA powder 250 g"
    # Un nombre que solo EMPIEZA parecido no se toca.
    otra = Falsa().item(marca="Zumub", nombre="Zumubino EAA 250 g", url="https://zumub.com/q",
                        formato_gramos=250, precio_eur=20.0, categoria="eaa")["producto"]
    assert otra["nombre"] == "Zumubino EAA 250 g"


def test_un_precio_por_kilo_imposible_no_se_guarda():
    """El caso real de Zumub: el sobre de 30 g con el formato del bote de 1 kg."""
    assert core.sospechoso(dict(precio_eur=1.23, formato_gramos=1000.0)) is not None
    assert core.sospechoso(dict(precio_eur=0.0, formato_gramos=1000.0)) is not None
    # 20 sobres de 60 g leidos como 60 g: el mismo error por arriba.
    assert core.sospechoso(dict(precio_eur=56.99, formato_gramos=60.0)) is not None
    # Y lo barato de verdad pasa: la dextrosa a 3,49 EUR/kg no es un error.
    assert core.sospechoso(dict(precio_eur=3.49, formato_gramos=1000.0)) is None
    # Ni lo caro de verdad: 150 g de Creapure a 43,99 EUR son 293 EUR/kg reales.
    assert core.sospechoso(dict(precio_eur=43.99, formato_gramos=150.0)) is None
    # En capsulas manda el precio por unidad: 0,011 EUR/tableta es un precio real.
    assert core.sospechoso(dict(precio_eur=3.96, unidades=365.0)) is None
    assert core.sospechoso(dict(precio_eur=49.0, unidades=2.0)) is not None


def test_zumub_lee_cada_variante_con_su_propio_formato():
    """Un ProductGroup con dos variantes: el sobre no hereda el kilo del bote."""
    from scraper.tiendas.zumub import Zumub
    ficha = '''<script type="application/ld+json">{
      "@type": "ProductGroup", "name": "100% Whey", "brand": {"name": "Zumub"},
      "hasVariant": [
        {"@type": "Product", "name": "100% Whey Concentrada 30g", "sku": "23974",
         "size": "30 g", "offers": {"price": "1.23"}},
        {"@type": "Product", "name": "100% Whey Concentrada 1kg", "sku": "10326",
         "size": "1 Kg", "offers": {"price": "24.99"}}]}</script>'''
    grupos = [d for d in core.ld_json(ficha) if d.get("@type") == "ProductGroup"]
    variantes = grupos[0]["hasVariant"]
    medidas = [core.medida(v.get("size"), v["name"], categoria="proteina_whey")
               for v in variantes]
    assert medidas == [(None, None), (1000.0, None)]     # el sobre se queda fuera
    assert Zumub().tienda == "zumub"


def test_iogenix_saca_el_formato_del_fragmento_de_la_url():
    """iO.CREATINE no lleva el formato en el nombre; PrestaShop lo pone en el #."""
    from scraper.tiendas import iogenix
    variante = "#/3839-sabores-watermelon/3898-formatos-300_g"
    assert core.medida("iO.CREATINE", variante.replace("_", " "),
                       categoria="creatina") == (300.0, None)
    # Y una categoria mapeada a un listado que no la tiene no existe en el mapa.
    assert "ashwagandha" not in iogenix.CATEGORIA_URL


def test_una_marca_no_puede_ser_un_trozo_de_nombre_de_producto():
    """Lo que Amazon dejaba como marca cuando el titulo no empieza por ella.

    Una marca inventada viaja al brand del JSON-LD, rompe el emparejamiento del mismo
    bote entre tiendas y crearia paginas de marca fantasma: es peor que no tener marca.
    """
    for basura in ("Citrato de", "Extracto de", "Aceite de Krill", "Peptidos de",
                   "L-Glutamina en Polvo", "Complejo de", "L", "Probioticos y",
                   "Capsulas de", "Suplemento de"):
        assert core.marca_canonica(basura) == "Desconocida", basura
    # Y las de verdad no se tocan, incluidas las de tres letras y las que llevan
    # dentro una palabra que en otro sitio seria generica.
    for buena in ("Optimum Nutrition", "iO.GENIX", "Doctor's Best", "226ers", "QNT",
                  "Big", "Estado Puro", "LIFE PRO PURA VIDA", "vit4ever", "Solgar"):
        assert core.marca_canonica(buena) == buena, buena
    # La coletilla de marketing se cae por el final, nunca por el principio.
    assert core.marca_canonica("Optimum Nutrition Gold") == "Optimum Nutrition"
    assert core.marca_canonica("Bulk Pure") == "Bulk"


def test_el_historico_guarda_un_precio_por_producto_y_dia():
    """Dos pasadas el mismo dia no duplican ni pisan lo ya guardado."""
    import sqlite3
    from data import db
    con = sqlite3.connect(":memory:")
    con.row_factory = sqlite3.Row
    con.executescript(db.SCHEMA_PATH.read_text(encoding="utf-8"))
    db.guardar_producto(con, dict(marca="Demo", nombre="Creatina 1 kg", categoria="creatina",
                                  tienda="demo", url="https://demo.invalid/1",
                                  formato_gramos=1000, precio_eur=20.0))
    assert db.guardar_historico(con, "2026-01-01") == 1
    assert db.guardar_historico(con, "2026-01-01") == 0      # idempotente en el mismo dia
    con.execute("UPDATE producto SET precio_eur = 18.0")
    assert db.guardar_historico(con, "2026-01-02") == 1
    serie = [(r["fecha"], r["precio_eur"]) for r in
             con.execute("SELECT fecha, precio_eur FROM precio_historico ORDER BY fecha")]
    assert serie == [("2026-01-01", 20.0), ("2026-01-02", 18.0)]
    # El primer apunte NO se reescribe con el precio nuevo: si no, no hay historia.
    assert serie[0][1] == 20.0


def test_la_serie_exportada_solo_guarda_los_dias_en_que_cambia_el_precio():
    import sqlite3
    from data import db
    from exportar import historicos
    con = sqlite3.connect(":memory:")
    con.row_factory = sqlite3.Row
    con.executescript(db.SCHEMA_PATH.read_text(encoding="utf-8"))
    pid = db.guardar_producto(con, dict(marca="Demo", nombre="Creatina 1 kg",
                                        categoria="creatina", tienda="demo",
                                        url="https://demo.invalid/1",
                                        formato_gramos=1000, precio_eur=20.0))
    from datetime import date, timedelta
    hoy = date.today()
    for i, precio in enumerate([20.0, 20.0, 20.0, 17.5, 17.5]):
        con.execute("INSERT INTO precio_historico (producto_id, fecha, precio_eur) "
                    "VALUES (?,?,?)", (pid, (hoy - timedelta(days=4 - i)).isoformat(), precio))
    con.commit()
    h = historicos(con)[pid]
    assert h["n"] == 5 and h["min"] == 17.5 and h["max"] == 20.0
    assert [x[1] for x in h["serie"]] == [20.0, 17.5]      # cinco lecturas, dos puntos


def main():
    pruebas = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in pruebas:
        t()
        print("ok  " + t.__name__)
    print("%d comprobaciones pasan" % len(pruebas))


if __name__ == "__main__":
    main()
