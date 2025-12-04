// Estilos de los Features del mapa

import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";

/////////// POLIGONOS ///////////

// Estilo del relleno de los Feature poligon state por defecto
const polygon = new Style({
    fill: new Fill({
    color:[78, 191, 255, 0.58]
    })
})
// Estilo del relleno de los Feature poligon state
// Lineas de limitacion de estados
const linde = new Stroke ({
    color:[0, 0, 0, 0.8],
    width: 1
})

const greenPolygon = new Style({
    fill: new Fill({
    color:[123, 226, 98, 0.8]
    }),
    stroke: linde
})

const yellowPolygon = new Style({
    fill: new Fill({
    color:[234, 229, 77, 0.8]
    }),
    stroke: linde
})

const redPolygon = new Style({
    fill: new Fill({
    color:[234, 77, 77, 0.8]
    }),
    stroke: linde
})
// Rosa para destacar ciertos estados al ser seleccionados
const rosaPolygon = new Style({
    fill: new Fill({
    color:[245, 40, 145, 0.8]
    }),
    stroke: linde
})


//////// LINEAS ///////////
// Estilo del relleno del Feature Linea
const line = new Style({
    stroke: new Stroke({
    color:[255, 106, 106, 0.8],
    width: 5
    })
})

//////// EXPORTACIONES ///////////
export const styleArray = [{
    polygon:polygon,
    green: greenPolygon, 
    yellow: yellowPolygon, 
    red: redPolygon, 
    line: line, 
    rosa: rosaPolygon
}];