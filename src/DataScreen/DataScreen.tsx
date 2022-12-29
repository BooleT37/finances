import {
  ClockCircleOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { AgGridReact } from "ag-grid-react";
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Space,
  Tooltip,
  Typography,
} from "antd";
import { action } from "mobx";
import { observer } from "mobx-react";
import moment, { Moment } from "moment";
import React, { useCallback } from "react";
import styled from "styled-components";
import { AG_GRID_LOCALE_RU } from "../agGridLocale.ru";
import { DATE_FORMAT, MONTH_DATE_FORMAT } from "../constants";
import Expense, { TableData } from "../models/Expense";
import SiteContent from "../SiteContent";
import expenseStore from "../stores/expenseStore";
import forecastStore from "../stores/forecastStore";
import WhiteHeader from "../WhiteHeader";
import ExpenseModal from "./ExpenseModal/ExpenseModal";
import expenseModalStore from "./expenseModalStore";
import autoGroupColumnDef from "./gridColumnDefs/autoGroupColumnDef";
import columnDefs from "./gridColumnDefs/columnDefs";
import { getRowStyle, resetTime, setTimeToMax } from "./utils";

const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Search } = Input;

const today = moment();

const DateTypeButton = styled(Button)`
  padding-left: 0;
`;

const ContentWrapper = styled("div")`
  position: relative;
  max-width: 850px;
`;

const SearchStyled = styled(Search)`
  position: absolute;
  right: 50px;
  width: 300px;
`;

const AgGridStyled = styled(AgGridReact)`
  .data-row-upcoming-subscription {
    color: darkgray;
  }
`;

const DataScreen = observer(function DataScreen() {
  const [rangeStart, setRangeStart] = React.useState<Moment | null>(
    resetTime(today.clone().set("date", 1))
  );
  const [rangeEnd, setRangeEnd] = React.useState<Moment | null>(
    setTimeToMax(
      today.clone().add(1, "month").set("date", 1).subtract(1, "day")
    )
  );
  const gridRef = React.useRef<AgGridReact>(null);
  const [isRangePicker, setIsRangePicker] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [upcSubscriptionsShown, setUpcSubscriptionsShown] =
    React.useState(false);

  const handleRangeChange = (
    _dates: [Moment | null, Moment | null] | null,
    dateStrings: [string, string] | null
  ) => {
    setRangeStart(
      dateStrings && dateStrings[0] ? moment(dateStrings[0], DATE_FORMAT) : null
    );
    setRangeEnd(
      dateStrings && dateStrings[1]
        ? setTimeToMax(moment(dateStrings[1], DATE_FORMAT))
        : null
    );
  };

  const handleMonthChange = (date: Moment | null) => {
    setRangeStart(date ? resetTime(date.clone().set("date", 1)) : null);
    setRangeEnd(
      date
        ? setTimeToMax(date.clone().add(1, "month").subtract(1, "day"))
        : null
    );
  };

  const expandCategory = React.useCallback((category: string) => {
    setTimeout(() => {
      if (!gridRef.current) {
        return;
      }
      gridRef.current.api.forEachNode((node) => {
        if (node.key === category) {
          node.setExpanded(true);
        }
      });
    }, 0);
  }, []);

  const handleAdd = action(() => {
    expenseModalStore.open(null);
  });

  const goToPrevMonth = () => {
    setRangeStart((d) => {
      if (!d) {
        return d;
      }
      return d.clone().subtract(1, "month");
    });
    setRangeEnd((d) => {
      if (!d) {
        return d;
      }
      return d.clone().set("date", 1).subtract(1, "day");
    });
  };

  const goToNextMonth = () => {
    setRangeStart((d) => {
      if (!d) {
        return d;
      }
      return d.clone().add(1, "month");
    });
    setRangeEnd((d) => {
      if (!d) {
        return d;
      }
      return d.clone().add(2, "month").set("date", 1).subtract(1, "day");
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value) {
      setTimeout(() => {
        gridRef.current?.api.expandAll();
      });
    }
  };

  const isCurrentMonth =
    rangeStart &&
    today.month() === rangeStart.month() &&
    today.year() === rangeStart.year();

  const handleModalSubmit = useCallback(
    (expense: Expense) => {
      expandCategory(expense.category.name);
      setTimeout(
        action(() => {
          if (!gridRef.current) {
            return;
          }
          const { api } = gridRef.current;
          const nodeToFlash = api.getRowNode(expense.id.toString());
          if (nodeToFlash) {
            api.flashCells({
              rowNodes: [nodeToFlash],
            });
          }
        }),
        100
      );
    },
    [expandCategory]
  );

  const { boundaryDates } = expenseStore;

  const handleAcrossAllTimeClick = useCallback(() => {
    setRangeStart(boundaryDates[0]);
    setRangeEnd(boundaryDates[1]);
  }, [boundaryDates]);

  const handleDateTypeButtonClick = useCallback(() => {
    if (isRangePicker && rangeEnd) {
      setRangeEnd(
        rangeEnd.clone().add(1, "month").set("date", 1).subtract(1, "day")
      );
      setRangeStart(rangeEnd.clone().set("date", 1));
    }
    setIsRangePicker((value) => !value);
  }, [isRangePicker, rangeEnd]);

  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Данные</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <ContentWrapper>
          <SearchStyled
            placeholder="Найти..."
            onSearch={handleSearch}
            allowClear={true}
          />
          <Space direction="vertical" size="middle">
            <div>
              <Space size="middle">
                {isRangePicker ? (
                  <RangePicker
                    format={DATE_FORMAT}
                    value={[rangeStart, rangeEnd]}
                    onChange={handleRangeChange}
                    allowClear={false}
                  />
                ) : (
                  <div>
                    <Tooltip title="Предыдущий месяц">
                      <Button
                        type="text"
                        icon={<LeftOutlined />}
                        onClick={goToPrevMonth}
                      />
                    </Tooltip>
                    <DatePicker
                      value={rangeStart}
                      picker="month"
                      onChange={handleMonthChange}
                      format={MONTH_DATE_FORMAT}
                      allowClear={false}
                    />
                    <Tooltip title="Следующий месяц">
                      <Button
                        type="text"
                        icon={<RightOutlined />}
                        onClick={goToNextMonth}
                      />
                    </Tooltip>
                  </div>
                )}
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Добавить
                </Button>
              </Space>
              <br />
              <Space>
                <DateTypeButton
                  icon={<SwapOutlined />}
                  type="link"
                  onClick={handleDateTypeButtonClick}
                >
                  {isRangePicker
                    ? "Выбрать только месяц"
                    : "Выбрать точный период"}
                </DateTypeButton>
                {isRangePicker && (
                  <Button
                    icon={<ClockCircleOutlined />}
                    type="link"
                    onClick={handleAcrossAllTimeClick}
                  >
                    За все время
                  </Button>
                )}
              </Space>
            </div>
            <div>
              <Checkbox
                checked={upcSubscriptionsShown}
                onChange={(e) => setUpcSubscriptionsShown(e.target.checked)}
              >
                Предстоящие подписки
              </Checkbox>
            </div>
            {rangeStart && rangeEnd && (
              <div className="ag-theme-alpine" style={{ width: 950 }}>
                <AgGridStyled
                  ref={gridRef}
                  rowData={expenseStore.tableData(
                    rangeStart,
                    rangeEnd,
                    search,
                    upcSubscriptionsShown
                  )}
                  getRowClass={({ data }) =>
                    data && data.isUpcomingSubscription
                      ? "data-row-upcoming-subscription"
                      : undefined
                  }
                  defaultColDef={{
                    menuTabs: ["generalMenuTab"],
                  }}
                  columnDefs={columnDefs}
                  getRowId={({ data }) => (data as TableData).id.toString()}
                  context={{
                    expandCategory,
                    categoriesForecast: isRangePicker
                      ? null
                      : forecastStore.categoriesForecast(
                          rangeStart.year(),
                          rangeStart.month()
                        ),
                    passedDaysRatio: isRangePicker
                      ? null
                      : isCurrentMonth
                      ? today.date() / rangeStart.daysInMonth()
                      : 1,
                    savingSpendingsForecast:
                      expenseStore.savingSpendingsForecast(
                        rangeStart.year(),
                        rangeStart.month()
                      ),
                  }}
                  getRowStyle={getRowStyle}
                  groupIncludeFooter
                  suppressAggFuncInHeader
                  autoGroupColumnDef={autoGroupColumnDef}
                  domLayout="autoHeight"
                  localeText={AG_GRID_LOCALE_RU}
                />
              </div>
            )}
          </Space>
        </ContentWrapper>
      </SiteContent>
      <ExpenseModal
        startDate={rangeStart}
        endDate={rangeEnd}
        onSubmit={handleModalSubmit}
      />
    </>
  );
});

export default DataScreen;
