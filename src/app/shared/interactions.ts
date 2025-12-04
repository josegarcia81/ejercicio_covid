import GeoJSON from 'ol/format/GeoJSON';
import Draw from "ol/interaction/Draw";
import Select from 'ol/interaction/Select.js';
import VectorSource from "ol/source/Vector";


// Draw Interaction // Pintar en el mapa 
    const drawInteraction = new Draw({
    type: 'Polygon',
    geometryName:'polygon'
    })

// Borrar Polygono
    const delPolygon = new Select({
    })

export const arrayInteractions = [{
    draw : drawInteraction,
    del : delPolygon
}]
