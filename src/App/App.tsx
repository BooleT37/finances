import { Spin } from "antd"
import { observer } from "mobx-react"
import React from "react"
import categoryStore from "../stores/categoryStore"
import expenseStore from "../stores/expenseStore"
import forecastStore from "../stores/forecastStore"

const App = observer(function App({ children }: React.PropsWithChildren<{}>) {
  const [loaded, setLoaded] = React.useState(false)

  React.useEffect(() => {
    (async () => {
      const [categories, expenses] = await Promise.all([
        await fetch("https://rttvji9hud.execute-api.eu-central-1.amazonaws.com/dev/category").then(res => res.json()),
        await fetch("https://rttvji9hud.execute-api.eu-central-1.amazonaws.com/dev/expense").then(res => res.json()),
      ])
      categoryStore.fromJson(categories)
      expenseStore.fromJson(expenses)
      forecastStore.fromFakeData()
      setLoaded(true)
    })()}, [])

  if (!loaded) {
    return <Spin size="large" />
  }
  return <>{children}</>
})

export default App