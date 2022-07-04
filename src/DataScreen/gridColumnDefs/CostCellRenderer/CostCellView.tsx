import React from "react";
import styled from "styled-components";

interface Props {
  cost: string;
  personalExpStr?: string
}

const ShiftedCost = styled.div`
  position: relative;
  bottom: 5px;
`

const PersonalExp = styled.div`
  position: relative;
  bottom: 30px;
  font-size: 10px;
  font-style: italic;
  color: gray;
`

// eslint-disable-next-line mobx/missing-observer
const CostCellView: React.FC<Props> = ({cost, personalExpStr}) => {
  return (
    <div>
      {personalExpStr
        ? (
          <>
            <ShiftedCost>{cost}</ShiftedCost>
            <PersonalExp>+{personalExpStr}</PersonalExp>
          </>
        ) : <div>{cost}</div>
      }
    </div>
  )
}

export default CostCellView