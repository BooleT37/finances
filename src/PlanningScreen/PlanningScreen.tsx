import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import type { CellEditRequestEvent, RowNode } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Button, DatePicker, Space, Typography } from "antd";
import { action } from "mobx";
import { observer } from "mobx-react";
import moment, { Moment } from "moment";
import React, { useCallback } from "react";
import { MONTH_DATE_FORMAT } from "../constants";
import categories from "../readonlyStores/categories";
import SiteContent from "../SiteContent";
import forecastStore from "../stores/forecastStore/forecastStore";
import WhiteHeader from "../WhiteHeader";
import columnDefs from "./columnDefs";
import personalExpensesColumnDefs from "./personalExpensesColumnDefs";
import SurplusData from "./SurplusData";

const { Title } = Typography;

const PlanningScreen = observer(function PlanningScreen() {
  const [date, setDate] = React.useState<Moment | null>(moment());
  const gridRef = React.useRef<AgGridReact>(null);

  const scrollToRow = useCallback((categoryId: number) => {
    gridRef.current?.api.ensureNodeVisible(
      (node: RowNode) => node.data.categoryId === categoryId,
      "middle"
    );
  }, []);

  const handleCellEditRequest = action((params: CellEditRequestEvent) => {
    if (!date) {
      return;
    }
    const field = params.column.getColDef().field;
    if (field === "sum") {
      forecastStore.changeForecastSum(
        categories.getById(params.data.categoryId),
        date.month(),
        date.year(),
        parseFloat(params.newValue.value)
      );
    } else if (field === "comment") {
      forecastStore.changeForecastComment(
        categories.getById(params.data.categoryId),
        date.month(),
        date.year(),
        params.newValue
      );
    }
    setTimeout(() => {
      scrollToRow(params.data.categoryId);
    });
  });

  const goToPrevMonth = () => {
    setDate((d) => {
      if (!d) {
        return d;
      }
      return d.clone().subtract(1, "month");
    });
  };

  const goToNextMonth = () => {
    setDate((d) => {
      if (!d) {
        return d;
      }
      return d.clone().add(1, "month");
    });
  };

  const setForecastSum = useCallback(
    (categoryId: number, sum: number) => {
      if (date) {
        forecastStore.changeForecastSum(
          categories.getById(categoryId),
          date.month(),
          date.year(),
          sum
        );
      }
    },
    [date]
  );

  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Планирование</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <Space direction="vertical" size="middle">
          <div>
            <Button
              type="link"
              size="large"
              icon={<LeftOutlined />}
              onClick={goToPrevMonth}
            />
            <DatePicker
              value={date}
              picker="month"
              onChange={(date) => setDate(date)}
              format={MONTH_DATE_FORMAT}
              allowClear={false}
              style={{ width: 160 }}
              size="large"
            />
            <Button
              type="link"
              size="large"
              icon={<RightOutlined />}
              onClick={goToNextMonth}
            />
          </div>
          {date && (
            <Space direction="vertical" size="middle">
              <div>
                <Title level={2}>Расходы</Title>
                <div className="ag-theme-alpine" style={{ width: 1130 }}>
                  <AgGridReact
                    ref={gridRef}
                    readOnlyEdit
                    onCellEditRequest={handleCellEditRequest}
                    columnDefs={columnDefs}
                    rowData={forecastStore.tableData(
                      date.year(),
                      date.month(),
                      false,
                      false,
                      false
                    )}
                    context={{
                      year: date.year(),
                      month: date.month(),
                      scrollToRow,
                      setForecastSum,
                    }}
                    domLayout="autoHeight"
                  />
                </div>
              </div>
              <div>
                <Title level={2}>Сбережения</Title>
                <div className="ag-theme-alpine" style={{ width: 1130 }}>
                  <AgGridReact
                    readOnlyEdit
                    onCellEditRequest={handleCellEditRequest}
                    columnDefs={columnDefs}
                    rowData={forecastStore.tableData(
                      date.year(),
                      date.month(),
                      false,
                      false,
                      true
                    )}
                    domLayout="autoHeight"
                    context={{
                      year: date.year(),
                      month: date.month(),
                      scrollToRow,
                    }}
                  />
                </div>
              </div>
              <div>
                <Title level={2}>Личные Расходы</Title>
                <div className="ag-theme-alpine" style={{ width: 1200 }}>
                  <AgGridReact
                    ref={gridRef}
                    readOnlyEdit
                    onCellEditRequest={handleCellEditRequest}
                    columnDefs={personalExpensesColumnDefs}
                    rowData={forecastStore.tableData(
                      date.year(),
                      date.month(),
                      false,
                      true,
                      false
                    )}
                    context={{
                      year: date.year(),
                      month: date.month(),
                      scrollToRow,
                    }}
                    domLayout="autoHeight"
                  />
                </div>
              </div>
              <div>
                <Title level={2}>Доходы</Title>
                <div className="ag-theme-alpine" style={{ width: 1130 }}>
                  <AgGridReact
                    readOnlyEdit
                    onCellEditRequest={handleCellEditRequest}
                    columnDefs={columnDefs}
                    rowData={forecastStore.tableData(
                      date.year(),
                      date.month(),
                      true,
                      false,
                      false
                    )}
                    domLayout="autoHeight"
                    context={{
                      year: date.year(),
                      month: date.month(),
                      scrollToRow,
                    }}
                  />
                </div>
              </div>
              <SurplusData month={date.month()} year={date.year()} />
            </Space>
          )}
        </Space>
      </SiteContent>
    </>
  );
});

export default PlanningScreen;
