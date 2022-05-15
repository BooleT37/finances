import { observer } from "mobx-react"
import WhiteHeader from "../WhiteHeader"
import { Typography } from 'antd';
import SiteContent from "../SiteContent";

const { Title } = Typography;

const PlanningScreen = observer(function PlanningScreen()  {
  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Планирование</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        Content
      </SiteContent>
    </>
  )
})

export default PlanningScreen