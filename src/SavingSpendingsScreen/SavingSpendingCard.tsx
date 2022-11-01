import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Table, Tooltip } from "antd";
import { ColumnType, TableProps } from "antd/lib/table";
import { sum } from "lodash";
import { observer } from "mobx-react";
import { FC } from "react";
import styled from "styled-components";
import SavingSpending from "../models/SavingSpending";
import { costToString, roundCost } from "../utils";

interface Props {
  spending: SavingSpending;
  onEditClick(): void;
  onDeleteClick(): void;
}

export interface RecordType {
  id: string;
  name: string;
  forecast: number;
  expenses: number;
}

const tableColumnsForSingleCategory: ColumnType<RecordType>[] = [
  {
    title: "План",
    dataIndex: "forecast",
    key: "forecast",
    render: costToString,
  },
  {
    title: "Факт",
    dataIndex: "expenses",
    key: "expenses",
    render: costToString,
  },
];

const tableColumns: ColumnType<RecordType>[] = [
  {
    title: "",
    dataIndex: "name",
    key: "name",
  },
  ...tableColumnsForSingleCategory,
];

const TableStyled = styled(Table)`
  .ant-table-thead > tr > th {
    background: white;
  }

  .ant-table-placeholder {
    .ant-empty {
      margin: 0;
    }
    .ant-empty-image {
      display: none;
    }
  }
`;

const SavingSpendingCard: React.FC<Props> = observer(
  function SavingSpendingCard({ spending, onEditClick, onDeleteClick }) {
    const title = (
      <Row>
        <Col flex="auto">{spending.name}</Col>
        <Col flex="0">
          <Tooltip title="Редактировать событие">
            <Button type="link" icon={<EditOutlined />} onClick={onEditClick} />
          </Tooltip>
        </Col>
        <Col flex="0">
          <Tooltip title="Удалить событие">
            <Button
              type="link"
              icon={<DeleteOutlined />}
              onClick={onDeleteClick}
            />
          </Tooltip>
        </Col>
      </Row>
    );
    return (
      <Card title={title}>
        <TableStyled<FC<TableProps<RecordType>>>
          columns={
            spending.categories.length > 1
              ? tableColumns
              : tableColumnsForSingleCategory
          }
          dataSource={spending.categories.map((c) => c.asTableRecord)}
          pagination={false}
          rowKey="id"
          size="small"
          summary={(pageData) => {
            if (pageData.length < 2) {
              return null;
            }
            return (
              <>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>Всего:</Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    {costToString(
                      roundCost(sum(pageData.map((r) => r.forecast)))
                    )}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    {costToString(
                      roundCost(sum(pageData.map((r) => r.expenses)))
                    )}
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </>
            );
          }}
        />
      </Card>
    );
  }
);

export default SavingSpendingCard;
