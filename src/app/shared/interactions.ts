import GeoJSON from 'ol/format/GeoJSON';
import Draw from "ol/interaction/Draw";
import Select from 'ol/interaction/Select.js';
import VectorSource from "ol/source/Vector";


// Draw Interaction // Pintar en el mapa 
const drawPolygonInteraction = new Draw({
    type: 'Polygon',
    geometryName: 'polygon'
})

// Borrar Polygono
const drawLineInteraction = new Draw({
    type: 'LineString',
    geometryName: 'lineString'
})

export const arrayInteractions = [{
    drawPolygon: drawPolygonInteraction,
    drawLineString: drawLineInteraction
}]
