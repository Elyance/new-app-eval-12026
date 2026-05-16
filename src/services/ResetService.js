import { xmlToJson } from '@/utils/xmlParser';
import { API_URL } from '@/constants/constant';

export async function resetData(listModules) {
    try {
        for (const moduleName of listModules) {
            const count = await resetTable(moduleName);
            console.log(`Nombre d'éléments dans ${moduleName} : ${count}`);
        }
    } catch (error) {
        console.error("Erreur dans resetData: ", error);
        throw error;
    }
}

export async function resetTable(moduleName) {
    try {
        const response = await fetch(`${API_URL}/${moduleName}`);
        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération du nombre d'éléments : ${response.statusText}`);
        }

        const data = await xmlToJson(await response.text());

        let dataJson = data.prestashop?.[moduleName]?.[moduleName.slice(0, -1)] || [];

        if (dataJson && !Array.isArray(dataJson)) {
            dataJson = [dataJson];
        }

        const count = dataJson.length;

        for (let index = 0; index < dataJson.length; index++) {
            const element = dataJson[index];
            const repDelete = await fetch(`${API_URL}/${moduleName}/${element["@_id"]}`, {
                method: 'DELETE'
            });
            if (!repDelete.ok) {
                throw new Error(`Erreur lors de la suppression de l'élément ${element["@_id"]} : ${repDelete.statusText}`);
            }
            console.log(`Élément ${element["@_id"]} supprimé de ${moduleName}`);
        }
        
        return count;
    } catch (error) {
        console.error("Erreur dans resetTable: ", error);
        throw error;
    }
}
