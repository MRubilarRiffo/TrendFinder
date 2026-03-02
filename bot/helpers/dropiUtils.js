/**
 * Normaliza y une en una cadena separada por comas las imágenes disponibles.
 */
const updateImages = (gallery, DROPI_IMG_URL, DROPI_IMG_URLS3) => {
    let images = [];
    if (gallery && gallery.length > 0) {
        gallery.forEach(item => {
            // Prioridad a S3, y como alternativa la URL base local
            if (item.urlS3) {
                images.push(`${DROPI_IMG_URLS3}${item.urlS3}`);
            } else if (item.url) {
                images.push(`${DROPI_IMG_URL}${item.url}`);
            }
        });
    }

    return images.join(',');
};

/**
 * Convierte cualquier texto a slug en minúsculas.
 */
const convertirString = (inputString) => {
    return inputString.toLowerCase().replace(/ /g, '-').replace(/[^a-zA-Z0-9-]/g, '');
};

/**
 * Compara dos categorías usando normalización NFD y un diccionario de palabras clave.
 */
const compareCategories = (cat1, cat2) => {
    const normalizarCadena = (str) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    cat1 = normalizarCadena(cat1);
    cat2 = normalizarCadena(cat2);

    const palabrasClave = {
        'moda': ['bolsos', 'ropa', 'accesorios moda', 'moda', 'ropa deportiva', 'bisuteria'],
        'salud y belleza': ['tobilleras', 'salud y belleza', 'corporal', 'capilar', 'belleza y cuidado personal', 'cuidado personal', 'belleza', 'bienestar', 'salud', 'salud y bienestar', 'cuidado personal y salud'],
        'hogar': ['hogar y accesorios', 'aseo', 'hogar', 'cocina', 'natural home', 'electrodomestico', 'electrodomesticos', 'limpieza y aseo'],
        'deportes y fitness': ['deportes', 'deporte', 'fitness', 'deportes y fitness'],
        'juguetes': ['jugueteria', 'juguetes', 'pinateria'],
        'automoviles': ['vehiculo', 'vehiculos', 'accesorios para vehiculos (carro, moto, bicicleta)'],
        'defensa personal': ['defensa personal'],
        'mascotas': ['mascotas'],
        'tecnologia': ['tecnologia', 'vaporizadores', 'gadgets', 'electronica'],
        'otros': ['casual', 'otro', 'combo', 'otra', 'mad', 'novedades'],
        'entretenimiento adulto': ['sex shop', 'lubricantes', 'cosmetologia erotica', 'dildos', 'vibradores', 'aceites para masajes', 'bienestar sexual'],
        'audio y video': ['audio y video'],
        'smartphones y celulares': ['smartphone y celulares'],
        'calzado': ['sandalias', 'tenis', 'calzado'],
        'ferreteria y cacharro': ['ferreteria y cacharro', 'herramientas', 'herramienta'],
        'ninos y bebes': ['bebe', 'bebes y materno'],
        'camping y pesca': ['camping', 'pesca'],
        'accesorios y joyeria': ['manillas', 'cadenas', 'accesorios']
    };

    const palabras = palabrasClave[cat1];
    if (palabras) {
        for (const palabra of palabras) {
            if (cat2.includes(palabra)) {
                return true;
            }
        }
    }

    return false;
};

module.exports = {
    updateImages,
    convertirString,
    compareCategories
};