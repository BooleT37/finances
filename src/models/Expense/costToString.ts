import Currency from "../Currency";

const currencySymbols: Record<Currency, string> = {
    EUR: '€',
    RUB: '₽'
}

export default function costToString(cost: number, currency: Currency) {
    if (currency === Currency.Eur) {
        return `${currencySymbols.EUR}${cost}`
    }
    return `${cost}${currencySymbols.RUB}`
}