export interface BasketConstituent {
  symbol: string;
  weight: number;
  current_price?: number;
}

export interface InvestmentBasket {
  id: number;
  name: string;
  description: string;
  category: string;
  constituents: BasketConstituent[];
  risk_level: 'Low' | 'Medium' | 'High';
  min_investment: number;
}
