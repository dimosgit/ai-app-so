namespace my.salesorder;

using {API_SALES_ORDER_SRV as external} from '../srv/external/API_SALES_ORDER_SRV';

entity SalesOrderExtensions {
    key SalesOrder  : String(10);
        needsReview : Boolean default false;
        reviewNotes : String;
}
