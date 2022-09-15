import React from "react";
import styled from "styled-components";
import type { MonthSpendings } from "../stores/forecastStore/types";
import { costToString } from "../utils";

interface Props {
  value: MonthSpendings;
}

const WithOffset = styled("div")<{ offset: number }>`
  position: ${(props) => (props.offset ? "relative" : "static")};
  bottom: ${(props) => (props.offset ? `${props.offset}px` : "auto")};
`;

const Diff = styled(WithOffset)`
  font-size: 10px;
`;

const Red = styled(Diff)`
  color: red;
`;

const Green = styled(Diff)`
  color: green;
`;

// eslint-disable-next-line mobx/missing-observer
const MonthCellRenderer: React.FC<Props> = ({ value: col }) => {
  return (
    <>
      <WithOffset offset={col.diff ? 3 : 0}>
        {costToString(col.spendings)}
      </WithOffset>
      {col.diff ? (
        <>
          {col.diff >= 0 ? (
            <Green offset={29}>+{costToString(col.diff)}</Green>
          ) : (
            <Red offset={29}>{costToString(col.diff)}</Red>
          )}
        </>
      ) : null}
    </>
  );
};

export default MonthCellRenderer;
