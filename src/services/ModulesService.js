import { xmlToJson } from '@/utils/xmlParser';
import { API_URL } from '@/constants/constant';

export async function getModules() {
    const prestashopTablesToReset = [

        // ── 1. Commandes ─────────────────────────────────
        "order_slip",
        "order_cart_rules",
        "order_carriers",
        "order_histories",
        "order_payments",
        "order_invoices",
        "order_details",
        "deliveries",
        "orders",        // ← orders doit être vidé AVANT carts 

        // ── 2. Paniers ────────────────────────────────────
        "cart_rules",
        "carts",

        // ── 3. Clients ────────────────────────────────────
        "customer_messages",
        "customer_threads",
        "messages",
        "addresses",
        "guests",
        "customers",

        // ── 4. Personnalisations ──────────────────────────
        "customizations",
        "product_customization_fields",

        // ── 5. Fournisseurs / Stock ───────────────────────
        "product_suppliers",
        "stock_movements",
        "supply_order_details",
        "supply_order_histories",
        "supply_order_receipt_histories",
        "warehouse_product_locations",
        // "stock_availables",
        "stocks",

        // ── 6. Produits ───────────────────────────────────
        "combinations",
        "product_option_values",
        "product_options",
        "product_feature_values",
        "product_features",
        "images",
        "tags",
        "specific_prices",
        "specific_price_rules",
        "products",


        //── 7. Catégories et Taxes ───────────────────────────────────

        "categories", 
        "tax_rule_groups",       
        "taxes",                 
        "tax_rules"
    ];
    return prestashopTablesToReset;
}

export async function sortModulesByOrder(selectedModules) {
    const correctOrder = await getModules();
    return selectedModules.sort((a, b) => {
        const indexA = correctOrder.indexOf(a);
        const indexB = correctOrder.indexOf(b);
        return indexA - indexB;
    });
}
