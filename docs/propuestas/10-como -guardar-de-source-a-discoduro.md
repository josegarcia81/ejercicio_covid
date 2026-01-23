Hola buenos días, me puedes ayudar con el manejo de archivos geojson?

¡Buenos días! Claro 😊. Dime qué quieres hacer exactamente con tus GeoJSON y te lo guío paso a paso.

Mientras tanto, aquí tienes un “mapa rápido” de las operaciones más típicas con GeoJSON (elige la que te encaje y te doy el detalle):

1) Validar que el GeoJSON está bien

Comprobar que tiene type correcto (FeatureCollection, Feature, Geometry)

Que cada Feature tenga geometry y properties

Que las geometrías sean válidas (polígonos cerrados, coordenadas en orden, etc.)

2) Reproyectar coordenadas

Muchísimos GeoJSON vienen en EPSG:4326 (lon, lat).

Si lo necesitas en EPSG:3857 (web maps) o un UTM, hay que transformar coordenadas.

3) Cargar/visualizar en un mapa (OpenLayers / Leaflet)

Leer FeatureCollection

Pintar en una capa vectorial

Estilizar por atributos (properties)

Hacer zoom a la extensión del GeoJSON

4) Filtrar / consultar por atributos

Ej.: “quédate solo con features donde tipo = 'X'”

Buscar por id, por rango de fechas, etc.

5) Operaciones espaciales

Cortar polígonos, unir, crear agujeros, dividir con línea, buffer…

Normalmente con Turf.js (frontend) o PostGIS (backend).

6) Simplificar / reducir peso

Simplificación de geometrías (menos vértices)

Eliminar propiedades innecesarias

Convertir a formatos más eficientes (p.ej. vector tiles si aplica)

Para ayudarte bien, te propongo que me digas una de estas 3 cosas (con lo que tengas):

¿Lo quieres manejar en Angular/OpenLayers, en backend (Java/Spring) o con scripts (Node/Python)?

¿Qué necesitas hacer: cargar, validar, reproyectar, editar, cortar/unir, exportar, optimizar…?

Si puedes, pega aquí un trozo pequeño del GeoJSON (10–30 líneas) o describe su estructura (tipo, geometrías, campos).

Si me dices tu caso (por ejemplo: “arrastrar un GeoJSON al mapa y visualizarlo” o “reproyectar y guardar”), te doy una solución directa con ejemplos.

quiero guardar a un archvio en disco duro un archivo con las features que he creado en una capa o que las tengo en un source
Pensó durante 11s

Perfecto. Si estás en Angular + OpenLayers y tienes las geometrías en una VectorLayer o en un VectorSource, lo normal es:

sacar las features del source

convertirlas a GeoJSON

descargar un archivo (el navegador te lo “guarda” en disco con un diálogo / carpeta de descargas)

Importante: desde el navegador no puedes escribir directamente en C:\... o /home/... por seguridad; se hace como descarga (o usando la File System Access API en Chrome/Edge).

Opción A (la más típica): descargar un .geojson desde el navegador


import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
// import Map from 'ol/Map'; // si necesitas la proyección del mapa

export function downloadSourceAsGeoJSON(
  source: VectorSource,
  filename = 'mis-features.geojson',
  mapProjection = 'EPSG:3857',    // la proyección en la que están las features (normalmente la del mapa)
  outputProjection = 'EPSG:4326'  // lo habitual para GeoJSON (lon/lat)
) {
  const features = source.getFeatures();

  const format = new GeoJSON();

  // Mejor: generar objeto GeoJSON y luego stringify bonito
  const geojsonObject = format.writeFeaturesObject(features, {
    featureProjection: mapProjection,
    dataProjection: outputProjection,
  });

  const json = JSON.stringify(geojsonObject, null, 2);
  const blob = new Blob([json], { type: 'application/geo+json;charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}


Uso:

// Si tienes layer:
const source = this.miVectorLayer.getSource();
downloadSourceAsGeoJSON(source!, 'capas-editadas.geojson', 'EPSG:3857', 'EPSG:4326');

// O si ya tienes source:
downloadSourceAsGeoJSON(this.drawSource, 'draw.geojson');


📌 ¿Qué pongo en mapProjection?

Si tus features están en la proyección del mapa (muy típico), usa this.map.getView().getProjection().getCode() en vez de 'EPSG:3857'.

Opción B: guardar “tal cual” (sin reproyectar)

Si quieres que el GeoJSON salga en la misma proyección que trabajas (no recomendado para interoperabilidad, pero a veces útil):

const geojsonObject = format.writeFeaturesObject(features, {
  featureProjection: mapProjection,
  dataProjection: mapProjection,
});

Opción C: Guardar en servidor (backend) para que quede en “disco duro del servidor”

Si lo que quieres es que se guarde automáticamente en el disco del servidor (o S3), entonces:

Frontend: mandar el GeoJSON por POST
this.http.post('/api/geojson/save', geojsonObject).subscribe();

Backend (Spring Boot): escribir archivo
@RestController
@RequestMapping("/api/geojson")
public class GeoJsonController {

  @PostMapping("/save")
  public ResponseEntity<?> save(@RequestBody String geojson) throws IOException {
    Path path = Paths.get("data", "export.geojson");
    Files.createDirectories(path.getParent());
    Files.writeString(path, geojson, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
    return ResponseEntity.ok().build();
  }
}


(En vez de String, puedes recibir un Map<String,Object> o un DTO, pero como GeoJSON es JSON puro, String es práctico.)

Si me dices esto, te lo dejo 100% integrado en tu código

¿Tus features están en un Draw (capa de dibujo), en una capa “statesLayer”, o en varias capas?

¿En qué proyección trabaja tu mapa (3857 seguro, o 4326)?

¿Quieres descargar una capa o todas las capas visibles?

Con eso te paso el método exacto para tu caso (incluyendo nombre de archivo con fecha, y/o exportar varias capas en un solo GeoJSON).

ChatGPT puede cometer errores. Considera verificar la información imp