import { observer } from "mobx-react";
import { Button, DatePicker, Space, Typography } from "antd";
import WhiteHeader from "../WhiteHeader";
import SiteContent from "../SiteContent";
import { AgGridReact } from "ag-grid-react";
import columnDefs from "./columnDefs";
import forecastStore from "../stores/forecastStore/forecastStore";
import React, { useCallback } from "react";
import { Moment } from "moment";
import moment from "moment";
import type { CellEditRequestEvent, RowNode } from "ag-grid-community";
import { action } from "mobx";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import categories from "../readonlyStores/categories";
import SurplusData from "./SurplusData";
import { MONTH_DATE_FORMAT } from "../constants";
import personalExpensesColumnDefs from "./personalExpensesColumnDefs";

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
              icon={<LeftOutlined />}
              onClick={goToPrevMonth}
            />
            <DatePicker
              value={date}
              picker="month"
              onChange={(date) => setDate(date)}
              format={MONTH_DATE_FORMAT}
              allowClear={false}
            />
            <Button
              type="link"
              icon={<RightOutlined />}
              onClick={goToNextMonth}
            />
          </div>
          {date && (
            <Space direction="vertical" size="middle">
              <div>
                <Title level={2}>Расходы</Title>
                <div className="ag-theme-alpine" style={{ width: 1110 }}>
                  <AgGridReact
                    ref={gridRef}
                    readOnlyEdit
                    onCellEditRequest={handleCellEditRequest}
                    columnDefs={columnDefs}
                    rowData={forecastStore.tableData(
                      date.year(),
                      date.month(),
                      false,
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
                <Title level={2}>Личные Расходы</Title>
                <div className="ag-theme-alpine" style={{ width: 1110 }}>
                  <AgGridReact
                    ref={gridRef}
                    readOnlyEdit
                    onCellEditRequest={handleCellEditRequest}
                    columnDefs={personalExpensesColumnDefs}
                    rowData={forecastStore.tableData(
                      date.year(),
                      date.month(),
                      false,
                      true
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
                <div className="ag-theme-alpine" style={{ width: 1110 }}>
                  <AgGridReact
                    readOnlyEdit
                    onCellEditRequest={handleCellEditRequest}
                    columnDefs={columnDefs}
                    rowData={forecastStore.tableData(
                      date.year(),
                      date.month(),
                      true,
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
