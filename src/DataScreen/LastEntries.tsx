import { Select, Space } from "antd";
import { observer } from "mobx-react";
import React from "react";
import sources from "../readonlyStores/sources";
import expenseStore from "../stores/expenseStore";

const LastEntries: React.FC = observer(function LastEntries() {
  const [source, setSource] = React.useState(sources.getAll()[0].id);
  const lastModifiedDate =
    source === undefined ? null : expenseStore.lastModifiedPerSource[source];

  return (
    <Space size="middle">
      Последняя модификация:
      <Select options={sources.asOptions} value={source} onChange={setSource} />
      {lastModifiedDate ?? "Нет модификаций"}
    </Space>
  );
});

export default LastEntries;
