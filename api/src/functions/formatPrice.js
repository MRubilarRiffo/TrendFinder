function formatPrice(price, country) {
    if (price === null || price === undefined || price === '' || !country) return;

    const num = typeof price === 'number' ? price : parseFloat(price);
    if (isNaN(num)) return;

    const formatOptions = {
        style: 'currency',
        currency: getCurrency(country),
        minimumFractionDigits: getDecimalPlaces(country),
        useGrouping: true,
    };

    return new Intl.NumberFormat(getLocale(country), formatOptions).format(num);
}

function getCurrency(country) {
    switch (country.toUpperCase()) {
        case 'COLOMBIA': return 'COP'
        case 'MÉXICO': return 'MXN'
        case 'PANAMÁ': return 'PAB'
        case 'CHILE': return 'CLP'
        case 'ECUADOR': return 'USD'
        case 'PERÚ': return 'PEN'
        case 'ESPAÑA': return 'EUR'
        default: return 'USD'
    }
}

function getLocale(country) {
    switch (country.toUpperCase()) {
        case 'COLOMBIA': return 'es-CO'
        case 'MÉXICO': return 'es-MX'
        case 'PANAMÁ': return 'es-PA'
        case 'CHILE': return 'es-CL'
        case 'ECUADOR': return 'es-EC'
        case 'PERÚ': return 'es-PE'
        case 'ESPAÑA': return 'es-ES'
        default: return 'en-US'
    }
}

function getDecimalPlaces(country) {
    switch (country.toUpperCase()) {
        case 'COLOMBIA':
        case 'CHILE':
        case 'PERÚ':
            return 0
        case 'PANAMÁ':
            return 2
        default:
            return 2
    }
}

module.exports = { formatPrice }