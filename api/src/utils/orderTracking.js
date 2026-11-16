const DAY = 24 * 60 * 60 * 1000;

// Promised delivery time (in days) at each stage.
// The estimate can only get shorter as the order moves forward.
export const DELIVERY_DAYS = {
    pending: 7,
    confirmed: 5,
    shipped: 2
};

// When did the order reach this status? (the last time)
const timeOf = (order, status) => {
    const entries = (order.statusHistory || []).filter(h => h.status === status);

    if (entries.length) return new Date(entries[entries.length - 1].at);

    if (status === "pending") return new Date(order.createdAt);

    // Old orders (made before statusHistory existed)
    if (order.status === status) return new Date(order.updatedAt || order.createdAt);

    return null;
};

// The real delivery time (only for delivered orders)
export const getDeliveredAt = (order) => {
    return order.status === "delivered" ? timeOf(order, "delivered") : null;
};

// The expected delivery date (null if the order is delivered or cancelled)
export const getEstimatedDelivery = (order) => {
    if (order.status === "delivered" || order.status === "cancelled") return null;

    const candidates = [new Date(order.createdAt).getTime() + DELIVERY_DAYS.pending * DAY];

    const confirmedAt = timeOf(order, "confirmed");
    if (confirmedAt && (order.status === "confirmed" || order.status === "shipped")) {
        candidates.push(confirmedAt.getTime() + DELIVERY_DAYS.confirmed * DAY);
    }

    const shippedAt = timeOf(order, "shipped");
    if (shippedAt && order.status === "shipped") {
        candidates.push(shippedAt.getTime() + DELIVERY_DAYS.shipped * DAY);
    }

    return new Date(Math.min(...candidates));
};