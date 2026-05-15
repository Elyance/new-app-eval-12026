/**
 * Service de parsing utilitaire pour l'API PrestaShop
 */

/**
 * Extrait une valeur numérique sécurisée depuis un champ potentiellement un objet XML
 * (utile lorsque fast-xml-parser retourne un objet pour les éléments avec attributs)
 */
export function getXmlValue(field) {
    if (field === null || field === undefined) return 0;
    if (typeof field === 'object') {
        return field['#text'] !== undefined ? Number(field['#text']) : 0;
    }
    return Number(field) || 0;
}

/**
 * Extrait une valeur texte sécurisée depuis un champ potentiellement un objet XML
 */
export function getXmlString(field) {
    if (field === null || field === undefined) return '';
    if (typeof field === 'object') {
        return field['#text'] !== undefined ? String(field['#text']) : '';
    }
    return String(field);
}

/**
 * Parse une date depuis l'API et la retourne au format lisible (JJ/MM/AAAA à HH:MM)
 * @param {string} dateString - La date à parser (ex: "2023-05-15 10:30:00")
 * @returns {string} Date et heure formatées
 */
export function parseDate(dateString) {
    if (!dateString) return '';
    
    // Essayer de parser la date
    const date = new Date(dateString);
    
    // Si la date est invalide
    if (isNaN(date.getTime())) return dateString;
    
    // Formater en français avec l'heure (ex: 15/05/2026 à 10:30)
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date).replace(' ', ' à ');
}
