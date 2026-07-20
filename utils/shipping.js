export const resolveAddressShippingCost = (address) => {
  const candidates = [
    address?.city?.shipping_cost,
    address?.shipping_cost,
    address?.city_shipping_cost,
    address?.shippingCost,
    address?.city?.shippingCost,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value) && value >= 0) {
      return value;
    }
  }

  return 0;
};
