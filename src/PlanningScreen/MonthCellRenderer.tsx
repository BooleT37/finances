import React from "react";
import styled from "styled-components";
import type { MonthSpendings } from "../stores/forecastStore/forecastStore";
import { costToString } from "../utils";

interface Props {
  value: MonthSpendings;
}

const Diff = styled("span")`
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
      {costToString({ value: col.spendings })}
      {col.diff ? (
        <>
          &nbsp;
          {col.diff >= 0 ? (
            <Green>+{costToString({ value: col.diff })}</Green>
          ) : (
            <Red>{costToString({ value: col.diff })}</Red>
          )}
        </>
      ) : null}
    </>
  );
};

export default MonthCellRenderer;
