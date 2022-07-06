import { Spin } from "antd"
import React from "react"
import categoriesManager from "../readonlyStores/categories"
import sourcesManager from "../readonlyStores/sources"
import expenseStore from "../stores/expenseStore"
import forecastStore from "../stores/forecastStore/forecastStore"

// eslint-disable-next-line mobx/missing-observer
const App = function App({ children }: React.PropsWithChildren<{}>) {
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    (async () => {
      const [categories, sources, expenses, forecasts] = await Promise.all([
        await fetch(`${process.env.REACT_APP_API_URL}/category`).then(res => res.json()),
        await fetch(`${process.env.REACT_APP_API_URL}/source`).then(res => res.json()),
        await fetch(`${process.env.REACT_APP_API_URL}/expense`).then(res => res.json()),
        await fetch(`${process.env.REACT_APP_API_URL}/forecast`).then(res => res.json()),
      ])
      categoriesManager.fromJson(categories)
      sourcesManager.set(sources)
      expenseStore.fromJson(expenses)
      forecastStore.fromJson(forecasts)
      setLoaded(true)
    })()}, [])

  if (!process.env.REACT_APP_API_URL) {
    return <div>ERROR: API url is undefined, please check your environmental settings</div>
  }

  if (!loaded) {
    return <Spin size="large" />
  }
  return <>{children}</>
}

export default App