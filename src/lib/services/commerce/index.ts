// Commerce domain services — orders, quotes, pricing
// NOTE: order.service.ts was removed — it was a dangerous duplicate of
// transitionOrderStatus and recordPayment in /lib/pricing/order-lifecycle.ts.
// All code must import from /lib/pricing/order-lifecycle.ts only.
export * from "./quote.service";
