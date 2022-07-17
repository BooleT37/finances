import { Input, Typography } from "antd";
import React, { useEffect } from "react";
import styled from "styled-components";
import { PE_SUM_DEFAULT, PE_SUM_LS_KEY } from "../constants";
import SiteContent from "../SiteContent";
import WhiteHeader from "../WhiteHeader";

const { Title } = Typography;

const PeSumInput = styled(Input)`
  width: 300px;
`;

// eslint-disable-next-line mobx/missing-observer
const SettingsScreen: React.FC = () => {
  const [peSum, setPeSum] = React.useState(() => {
    const peSumInLs = localStorage.getItem(PE_SUM_LS_KEY);
    return peSumInLs ? peSumInLs : PE_SUM_DEFAULT.toString();
  });

  useEffect(() => {
    localStorage.setItem(PE_SUM_LS_KEY, peSum);
  }, [peSum]);

  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Настройки</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <PeSumInput
          type="number"
          addonBefore="Персональные расходы/мес (€)"
          value={peSum}
          onChange={(e) => setPeSum(e.target.value)}
        />
      </SiteContent>
    </>
  );
};

export default SettingsScreen;
