import Currency from "../Currency";

const currencySymbols: Record<Currency, string> = {
    Eur: '€',
    Rub: '₽'
}

export default function costToString(cost: number, currency: Currency) {
    if (currency === Currency.Eur) {
        return `${currencySymbols.Eur}${cost}`
    }
    return `${cost}${currencySymbols.Rub}`
}