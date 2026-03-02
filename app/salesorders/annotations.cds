using SalesOrderService as service from '../../srv/sales-order-service';

annotate service.SalesOrders with @(
    UI.SelectionFields: [
        SalesOrder,
        SoldToParty
    ],
    UI.LineItem       : [
        {
            $Type: 'UI.DataField',
            Value: SalesOrder,
            Label: 'Sales Order',
        },
        {
            $Type: 'UI.DataField',
            Value: SoldToParty,
            Label: 'Customer (Sold-to)',
        },
        {
            $Type: 'UI.DataField',
            Value: TotalNetAmount,
            Label: 'Net Value',
        },
        {
            $Type: 'UI.DataField',
            Value: TransactionCurrency,
            Label: 'Currency',
        },
        {
            $Type: 'UI.DataField',
            Value: RequestedDeliveryDate,
            Label: 'Delivery Date',
        },
        {
            $Type      : 'UI.DataField',
            Value      : reviewStatus,
            Label      : 'Reason (tag)',
            Criticality: 3 // Critical/Warning
        }
    ]
);

annotate service.SalesOrders with @(
    UI.FieldGroup #GeneratedGroup1: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: SalesOrder,
                Label: 'Sales Order',
            },
            {
                $Type: 'UI.DataField',
                Value: SoldToParty,
                Label: 'Customer (Sold-to)',
            },
            {
                $Type: 'UI.DataField',
                Value: TotalNetAmount,
                Label: 'Net Value',
            },
            {
                $Type: 'UI.DataField',
                Value: TransactionCurrency,
                Label: 'Currency',
            },
            {
                $Type: 'UI.DataField',
                Value: RequestedDeliveryDate,
                Label: 'Delivery Date',
            },
        ],
    },
    UI.Facets                     : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'GeneratedFacet1',
            Label : 'General Information',
            Target: '@UI.FieldGroup#GeneratedGroup1',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'ReviewFacet',
            Label : 'Review Details',
            Target: '@UI.FieldGroup#ReviewGroup',
        }
    ],
    UI.FieldGroup #ReviewGroup    : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: reviewStatus,
                Label: 'Status',
            },
            {
                $Type: 'UI.DataField',
                Value: reviewNotes,
                Label: 'Notes',
            }
        ]
    }
);

annotate service.SalesOrders with @(UI.Identification: [{
    $Type : 'UI.DataFieldForAction',
    Action: 'SalesOrderService.markAsNeedsReview',
    Label : 'Mark as Needs Review',
}]);
