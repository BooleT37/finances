import { Moment } from "moment"
import { DATE_FORMAT } from "../../../constants"

interface Params {
  date: Moment,
  name?: string,
  category?: string
}

export default function generatePersonalExpenseName({ date, category, name}: Params): string {
  if (name) {
    return `Возмещено за '${name}' ${date.format(DATE_FORMAT)}`
  }

  return `Возмещено за покупку в категории '${category}' ${date.format(DATE_FORMAT)}`
}