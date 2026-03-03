const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const s4 = await cds.connect.to('API_SALES_ORDER_SRV');
    const { SalesOrders, OrderReviews } = this.entities;
    const { SalesOrderExtensions } = cds.entities('my.salesorder');

    this.on('READ', SalesOrders, async (req) => {
        let orders = [];
        try {
            orders = await s4.run(req.query);
        } catch (error) {
            console.warn('S/4HANA destination call failed, using mock data:', error.message);
            // Fallback mock data
            orders = [
                { SalesOrder: '1000001', SoldToParty: 'CUST100', TotalNetAmount: 12500.00, TransactionCurrency: 'EUR', RequestedDeliveryDate: '2026-03-10' },
                { SalesOrder: '1000002', SoldToParty: 'CUST200', TotalNetAmount: 45000.50, TransactionCurrency: 'USD', RequestedDeliveryDate: '2026-03-15' },
                { SalesOrder: '1000003', SoldToParty: 'CUST300', TotalNetAmount: 7800.00, TransactionCurrency: 'GBP', RequestedDeliveryDate: '2026-03-20' },
                { SalesOrder: '1000004', SoldToParty: 'CUST400', TotalNetAmount: 15600.75, TransactionCurrency: 'EUR', RequestedDeliveryDate: '2026-03-22' },
                { SalesOrder: '1000005', SoldToParty: 'CUST500', TotalNetAmount: 98750.00, TransactionCurrency: 'USD', RequestedDeliveryDate: '2026-03-24' },
                { SalesOrder: '1000006', SoldToParty: 'CUST600', TotalNetAmount: 6100.30, TransactionCurrency: 'EUR', RequestedDeliveryDate: '2026-03-26' },
                { SalesOrder: '1000007', SoldToParty: 'CUST700', TotalNetAmount: 23500.00, TransactionCurrency: 'GBP', RequestedDeliveryDate: '2026-03-28' },
                { SalesOrder: '1000008', SoldToParty: 'CUST800', TotalNetAmount: 41000.99, TransactionCurrency: 'USD', RequestedDeliveryDate: '2026-03-29' },
                { SalesOrder: '1000009', SoldToParty: 'CUST900', TotalNetAmount: 1250.00, TransactionCurrency: 'EUR', RequestedDeliveryDate: '2026-03-30' },
                { SalesOrder: '1000010', SoldToParty: 'CUST910', TotalNetAmount: 55200.42, TransactionCurrency: 'EUR', RequestedDeliveryDate: '2026-04-01' }
            ];
        }

        const orderIds = orders.map(o => o.SalesOrder);
        let reviews = [];
        try {
            reviews = await SELECT.from(SalesOrderExtensions).where({ SalesOrder: { in: orderIds } });
        } catch (dbError) {
            console.warn('Database query failed (no DB connected?), skipping reviews.');
        }
        const reviewMap = new Map(reviews.map(r => [r.SalesOrder, r]));

        orders.forEach(order => {
            const review = reviewMap.get(order.SalesOrder);
            if (review) {
                order.reviewStatus = review.needsReview ? 'Needs Review' : '';
                order.reviewNotes = review.reviewNotes;
            } else {
                order.reviewStatus = '';
                order.reviewNotes = '';
            }
        });

        return orders;
    });

    this.on('markAsNeedsReview', 'SalesOrders', async (req) => {
        const { notes } = req.data;
        const salesOrder = req.params[0].SalesOrder;

        await UPSERT.into(SalesOrderExtensions).entries({
            SalesOrder: salesOrder,
            needsReview: true,
            reviewNotes: notes || 'No notes provided'
        });

        return "Order " + salesOrder + " marked as Needs Review.";
    });
});
