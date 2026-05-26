import { xmlToJson } from '@/utils/xmlParser';
import { API_URL, API_KEY } from '@/constants/constant';

// Retourne le nom singulier exact utilisé par PrestaShop dans son XML
function getSingularName(pluralName) {
    if (pluralName === 'categories') return 'category';
    if (pluralName === 'taxes') return 'tax';
    if (pluralName === 'addresses') return 'address';
    if (pluralName.endsWith('histories')) return pluralName.replace(/histories$/, 'history');
    if (pluralName.endsWith('deliveries')) return pluralName.replace(/deliveries$/, 'delivery');
    if (pluralName.endsWith('rules')) return pluralName.replace(/rules$/, 'rule');
    if (pluralName.endsWith('groups')) return pluralName.replace(/groups$/, 'group');
    if (pluralName.endsWith('s')) return pluralName.slice(0, -1);
    return pluralName;
}

export async function resetData(listModules) {
    try {
        for (const moduleName of listModules) {
            const count = await resetTable(moduleName);
            console.log(`Nombre d'éléments dans ${moduleName} : ${count}`);
        }
    } catch (error) {
        console.error("Erreur dans resetData: ", error.message);
        throw error.message;
    }
}

export async function resetTable(moduleName) {
    try {
        const authHeader = { 'Authorization': `Basic ${btoa(`${API_KEY}:`)}`}
        
        const response = await fetch(`${API_URL}/${moduleName}`, {
            headers: authHeader
        });
        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération du nombre d'éléments : ${response.statusText}`);
        }

        const data = await xmlToJson(await response.text());

        const singularKey = getSingularName(moduleName);
        let dataJson = data.prestashop?.[moduleName]?.[singularKey] || [];

        if (dataJson && !Array.isArray(dataJson)) {
            dataJson = [dataJson];
        }

        const count = dataJson.length;

        for (let index = 0; index < dataJson.length; index++) {
            const element = dataJson[index];
            const idRaw = element["@_id"] || element.id;
            const id = idRaw !== undefined && idRaw !== null ? String(idRaw).trim() : '';

            // Ne pas supprimer les catégories système (1 = Racine/Root, 2 = Accueil/Home)
            if (moduleName === 'categories' && (id === '1' || id === '2')) {
                console.log(`Catégorie système ${id} préservée (non supprimée)`);
                continue;
            }

            // Ne pas supprimer le client système de base (1 = Admin/Guest/System default)
            if (moduleName === 'customers' && id === '1') {
                console.log(`Client système ${id} préservé (non supprimé)`);
                continue;
            }

            try {
                const repDelete = await fetch(`${API_URL}/${moduleName}/${id}`, {
                    method: 'DELETE',
                    headers: authHeader
                });
                if (!repDelete.ok) {
                    console.warn(`[Reset] Impossible de supprimer l'élément ${id} de ${moduleName} (Status: ${repDelete.statusText}). Cet élément est probablement protégé par le système.`);
                    continue;
                }
                console.log(`Élément ${id} supprimé de ${moduleName}`);
            } catch (err) {
                console.warn(`[Reset] Exception lors de la suppression de l'élément ${id} de ${moduleName} :`, err);
            }
        }
        
        return count;
    } catch (error) {
        console.error("Erreur dans resetTable: ", error);
        throw error;
    }
}
