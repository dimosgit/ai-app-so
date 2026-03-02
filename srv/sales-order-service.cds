using {my.salesorder as my} from '../db/schema';
using {API_SALES_ORDER_SRV as external} from './external/API_SALES_ORDER_SRV';

service SalesOrderService {
    @readonly
    entity SalesOrders  as
        select from external.A_SalesOrder {
            key SalesOrder,
                SoldToParty,
                TotalNetAmount,
                TransactionCurrency,
                RequestedDeliveryDate,
                null as reviewStatus : String(20),
                null as reviewNotes  : String
        }
        actions {
            action markAsNeedsReview(notes: String);
        };

    @readonly
    entity OrderReviews as projection on my.SalesOrderExtensions;
}
