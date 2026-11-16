export interface PaymentMethod {
  value: string;
  label: string;
  icon: string; // bootstrap icon
  transfer: boolean; // true = the customer transfers the money first
}

// Must match PAYMENT_METHODS in api/src/DB/models/order.model.js
export const PAYMENT_METHODS: PaymentMethod[] = [
  { value: 'cash_on_delivery', label: 'Cash on delivery', icon: 'bi-cash-coin', transfer: false },
  { value: 'vodafone_cash', label: 'Vodafone Cash / e-wallet', icon: 'bi-phone', transfer: true },
  { value: 'instapay', label: 'InstaPay', icon: 'bi-bank', transfer: true },
];

// TODO: put your real number / name here. It is shown to the customer when he picks a transfer method.
export const TRANSFER_ACCOUNT = {
  number: '01020963126',
  name: 'Deja Store',
};

export function paymentLabel(value: string): string {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? 'Cash on delivery';
}

export function isTransfer(value: string): boolean {
  return PAYMENT_METHODS.find((m) => m.value === value)?.transfer ?? false;
}