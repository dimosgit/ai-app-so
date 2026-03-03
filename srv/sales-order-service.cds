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

annotate SalesOrderService.SalesOrders with @(
    UI.SelectionFields            : [
        SalesOrder,
        SoldToParty
    ],
    UI.LineItem                   : [
        {
            $Type: 'UI.DataField',
            Value: SalesOrder,
            Label: 'Sales Order'
        },
        {
            $Type: 'UI.DataField',
            Value: SoldToParty,
            Label: 'Customer (Sold-to)'
        },
        {
            $Type: 'UI.DataField',
            Value: TotalNetAmount,
            Label: 'Net Value'
        },
        {
            $Type: 'UI.DataField',
            Value: TransactionCurrency,
            Label: 'Currency'
        },
        {
            $Type: 'UI.DataField',
            Value: RequestedDeliveryDate,
            Label: 'Delivery Date'
        },
        {
            $Type      : 'UI.DataField',
            Value      : reviewStatus,
            Label      : 'Reason (tag)',
            Criticality: 3
        }
    ],
    UI.Identification             : [{
        $Type : 'UI.DataFieldForAction',
        Action: 'SalesOrderService.markAsNeedsReview',
        Label : 'Mark as Needs Review'
    }],
    UI.FieldGroup #GeneratedGroup1: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: SalesOrder,
                Label: 'Sales Order'
            },
            {
                $Type: 'UI.DataField',
                Value: SoldToParty,
                Label: 'Customer (Sold-to)'
            },
            {
                $Type: 'UI.DataField',
                Value: TotalNetAmount,
                Label: 'Net Value'
            },
            {
                $Type: 'UI.DataField',
                Value: TransactionCurrency,
                Label: 'Currency'
            },
            {
                $Type: 'UI.DataField',
                Value: RequestedDeliveryDate,
                Label: 'Delivery Date'
            }
        ]
    },
    UI.FieldGroup #ReviewGroup    : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: reviewStatus,
                Label: 'Status'
            },
            {
                $Type: 'UI.DataField',
                Value: reviewNotes,
                Label: 'Notes'
            }
        ]
    },
    UI.Facets                     : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'GeneratedFacet1',
            Label : 'General Information',
            Target: '@UI.FieldGroup#GeneratedGroup1'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'ReviewFacet',
            Label : 'Review Details',
            Target: '@UI.FieldGroup#ReviewGroup'
        }
    ]
);
