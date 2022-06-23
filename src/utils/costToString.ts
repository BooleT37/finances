import Currency from "../models/Currency";

const currencySymbols: Record<Currency, string> = {
  Eur: '€',
  Rub: '₽'
}

export default function costToString(cost?: {
  value: number,
  currency?: Currency
}) {
  if (!cost) {
    return ''
  }
  const { value, currency = Currency.Eur } = cost
  if (currency === Currency.Eur) {
    return `${currencySymbols.Eur}${value}`
  }
  return `${value}${currencySymbols.Rub}`
}