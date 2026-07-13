let cachedOffers = {
  activeOnly: null,
  includeInactive: null,
  at: 0,
};

export const getOffersCache = () => cachedOffers;

export const setOffersCache = (nextCache) => {
  cachedOffers = nextCache;
};

export const invalidateOffersCache = () => {
  cachedOffers = {
    activeOnly: null,
    includeInactive: null,
    at: 0,
  };
};

