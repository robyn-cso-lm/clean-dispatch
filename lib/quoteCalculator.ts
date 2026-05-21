export interface QuoteRequest {
  serviceType: "standard" | "deep" | "move-in" | "move-out" | "airbnb";
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  addOns: string[]; // add-on names
}

const SERVICE_MULTIPLIERS: Record<string, number> = {
  standard: 1,
  deep: 1.5,
  "move-in": 1.75,
  "move-out": 1.75,
  airbnb: 1.25, // turnover clean — thorough but focused
};

const ADD_ON_PRICES: Record<string, number> = {
  fridge: 50,
  oven: 40,
  blinds: 30,
  laundry: 45,
  linens: 35,  // full linen change — all beds
  restock: 20, // restock soaps, TP, paper towels
};

const BASE_PRICE = 50;

export function calculateQuote(request: QuoteRequest): {
  basePrice: number;
  hoursEstimate: number;
  addOnsCost: number;
  totalQuote: number;
} {
  // Base calculation: $20/hr
  // Formula: (sqft / 500) * 20 + (bedrooms * 15) + (bathrooms * 10) + base $50

  const sqftCost = (request.squareFeet / 500) * 20;
  const bedroomCost = request.bedrooms * 15;
  const bathroomCost = request.bathrooms * 10;

  let basePrice = BASE_PRICE + sqftCost + bedroomCost + bathroomCost;

  const multiplier = SERVICE_MULTIPLIERS[request.serviceType] || 1;
  basePrice = basePrice * multiplier;

  const hoursEstimate = basePrice / 20;

  let addOnsCost = 0;
  request.addOns.forEach((addOn) => {
    addOnsCost += ADD_ON_PRICES[addOn] || 0;
  });

  const totalQuote = basePrice + addOnsCost;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    hoursEstimate: Math.round(hoursEstimate * 10) / 10,
    addOnsCost: Math.round(addOnsCost * 100) / 100,
    totalQuote: Math.round(totalQuote * 100) / 100,
  };
}

export function calculateCleanerPayout(
  hours: number,
  hasGasFee: boolean = true
): number {
  const hourlyRate = 20;
  const gasFee = hasGasFee ? 8 : 0;
  return Math.round((hours * hourlyRate + gasFee) * 100) / 100;
}
