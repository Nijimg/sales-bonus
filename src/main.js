/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const discount = 1 - (purchase.discount / 100);
    const revenue = _product.sale_price * purchase.quantity * discount; 
    return revenue;
};
/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    if (index === 0) {
        return seller.profit * 0.15; 
    }
    else if (index === 1 || index === 2) {
        return seller.profit * 0.10; 
    }
    else if (index === total - 1) {
        return 0;
    }
    else {
        return seller.profit * 0.05; 
    };
};

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
    if( !data || !Array.isArray(data.sellers) || data.sellers.length === 0 ) {
        throw new Error('Некорректные входные данные');
    };
    if(typeof options !== 'object' ) {
        throw new Error('Некорректные опции'); 
    };
    options = { calculateSimpleRevenue, calculateBonusByProfit };
    if (typeof calculateSimpleRevenue !== 'function' ) {
        throw new Error('Некорректная функция расчета выручки');
    };
    if (typeof calculateBonusByProfit !== 'function' ) {
        throw new Error('Некорректная функция расчета бонусов');
    };
    const sellersStats = data.sellers.map( seller => {
        return {
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: 0,
            profit: 0,
            sales_count: 0,
        products_sold: {}
        };
    });

    const sellersIndex = Object.fromEntries(sellersStats.map ( seller => [seller.id, seller] ));
    const productsIndex = Object.fromEntries(data.products.map ( product => [product.sku, product] ));
    data.purchase_records.forEach( record => {  
        const seller = sellersIndex[record.seller_id]; 
        seller.sales_count += 1;
        seller.revenue += record.total_amount;
    record.items.forEach(item => {
        const product = productsIndex[item.sku]; 
        if (!product) {
            throw new Error(`Товар с артикулом ${item.sku} не найден`);
        };
        const cost = product.purchase_price * item.quantity;
        const revenue = calculateSimpleRevenue(item, item);
        const profit = revenue - cost;
        seller.profit += profit;
        if( !seller.products_sold[item.sku] ) {
            seller.products_sold[item.sku] = 0;
        };
        seller.products_sold[item.sku] += item.quantity;
    }); 
});
    sellersStats.sort( (a, b) => b.profit - a.profit );
    sellersStats.forEach( (seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellersStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    });
    return sellersStats.map( seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
};
