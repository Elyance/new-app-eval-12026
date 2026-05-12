import { XMLParser } from 'fast-xml-parser';
import { XMLBuilder } from 'fast-xml-parser';

export async function xmlToJson(xml) {
    try {
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            parseAttributeValue: true
        });
        return parser.parse(xml);
    } catch (error) {
        throw new Error(`Erreur parsing XML: ${error.message}`);
    }
}

export function jsonToXml(data, moduleName) {
    const builder = new XMLBuilder({
        format: true,
        ignoreAttributes: false,
        suppressEmptyNode: true
    });

    const xmlObject = {
        prestashop: {
            [moduleName]: data
        }
    };

    return builder.build(xmlObject);
}
