import Currency from "../models/Currency";

const currencySymbols: Record<Currency, string> = {
  Eur: '€',
  Rub: '₽'
}

export default function costToString(cost?: {
  value: number,
  currency: Currency
}) {
  if (!cost) {
    return ''
  }
  if (cost.currency === Currency.Eur) {
    return `${currencySymbols.Eur}${cost.value}`
  }
  return `${cost.value}${currencySymbols.Rub}`
}