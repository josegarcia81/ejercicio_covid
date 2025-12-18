// Estilos de los Features del mapa

import {Fill, Stroke, Style, Circle}  from "ol/style";

/////////// COMUNES ///////////
const blueFill = new Fill({color:[78, 191, 255, 0.58]});
const greenFill = new Fill({color:[123, 226, 98, 0.8]});
const yellowFill = new Fill({color:[234, 229, 77, 0.8]});
const redFill = new Fill({color:[234, 77, 77, 0.8]});
const rosaFill = new Fill({color:[245, 40, 145, 0.8]});

const blueStroke = new Stroke({color: [39, 88, 245, 0.8],
                               width: 1,});
const blackStroke = new Stroke({color:[0, 0, 0, 0.8],
                                width: 1});
const redStroke = new Stroke({color: [255, 0, 0, 0.58],
                               width: 5,});
const bluePoint = new Circle({
                    fill: new Fill({
                        color:[78, 191, 255, 0.58]
                        }),
                    radius: 5
                })

/////////// POLIGONOS ///////////
// Estilo del relleno de los Feature poligon state por defecto
const polygon = new Style({
    fill: blueFill,
    stroke: blueStroke,
    image: bluePoint
})
// Estilo del relleno de los Feature poligon state por casos covid
const greenPolygon = new Style({
    fill: greenFill,
    stroke: blackStroke
})

const yellowPolygon = new Style({
    fill: yellowFill,
    stroke: blackStroke
})

const redPolygon = new Style({
    fill: redFill,
    stroke: blackStroke
})
// Rosa para destacar estados al ser seleccionados
const rosaPolygon = new Style({
    fill: rosaFill,
    stroke: blackStroke
})

//////// LINEAS ///////////
// Estilo del relleno del Feature Linea
const lineBlue = new Style({
    stroke: blueStroke,
    image: bluePoint
})

const redLine = new Style({
    stroke: redStroke,
})

//////// EXPORTACIONES ///////////
export const styleArray = [{
    polygon:polygon,
    green: greenPolygon, 
    yellow: yellowPolygon, 
    red: redPolygon, 
    rosa: rosaPolygon,
    lineBlue: lineBlue,
    lineRed: redLine
}];