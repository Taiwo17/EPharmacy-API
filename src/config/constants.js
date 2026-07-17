module.exports = {
  ROLES: {
    CUSTOMER: 'customer',
    BRANCH_STAFF: 'branch_staff',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin',
  },

  AUTH_PROVIDERS: {
    LOCAL: 'local',
    GOOGLE: 'google',
    APPLE: 'apple',
  },

  PRESCRIPTION_STATUS: {
    SUBMITTED: 'submitted',
    UNDER_REVIEW: 'under_review',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  ORDER_STATUS: {
    PENDING_PAYMENT: 'pending_payment',
    AWAITING_PRESCRIPTION: 'awaiting_prescription',
    PROCESSING: 'processing',
    PACKED: 'packed',
    DISPATCHED: 'dispatched',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURN_REQUESTED: 'return_requested',
    RETURNED: 'returned',
  },

  DELIVERY_METHOD: {
    DELIVERY: 'delivery',
    PICKUP: 'pickup',
  },

  PAYMENT_METHOD_TYPE: {
    CARD: 'card',
    BANK_TRANSFER: 'bank_transfer',
    WALLET: 'wallet',
    CASH_ON_PICKUP: 'cash_on_pickup',
  },

  PROMO_DISCOUNT_TYPE: {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
  },

  LOYALTY_ENTRY_TYPE: {
    EARNED: 'earned',
    REDEEMED: 'redeemed',
    EXPIRED: 'expired',
    ADJUSTED: 'adjusted',
  },

  REFERRAL_STATUS: {
    INVITED: 'invited',
    JOINED: 'joined',
    REWARDED: 'rewarded',
  },

  NOTIFICATION_TYPE: {
    ORDER_UPDATE: 'order_update',
    PRESCRIPTION_STATUS: 'prescription_status',
    PROMO: 'promo',
    LOYALTY: 'loyalty',
    SYSTEM: 'system',
  },

  ERP_SYNC_DIRECTION: {
    INBOUND: 'inbound',
    OUTBOUND: 'outbound',
  },

  ERP_SYNC_STATUS: {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
  },

  BRANCH_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },
};
