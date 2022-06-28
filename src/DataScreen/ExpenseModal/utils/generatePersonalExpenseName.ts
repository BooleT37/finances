interface Params {
  name?: string,
  category?: string
}

export default function generatePersonalExpenseName({ category, name}: Params): string {
  if (name) {
    return `За '${name}'`
  }

  return `За категорию '${category}'`
}