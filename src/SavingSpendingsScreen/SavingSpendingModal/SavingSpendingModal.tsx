import { Button, Input, Modal, Space, Tooltip } from "antd";
import { observer, useLocalObservable } from "mobx-react";
import { createViewModel } from "mobx-utils";
import SavingSpending from "../../models/SavingSpending";
import SavingSpendingCategory from "../../models/SavingSpendingCategory";
import savingSpendingStore from "../../stores/savingSpendingStore";
import SpendingCategoryForm, { FormValues } from "./SpendingCategoryForm";
import { PlusOutlined } from "@ant-design/icons";

interface Props {
  editedSpendingId: number | null;
  visible: boolean;
  onClose(): void;
}

const SavingSpendingModal: React.FC<Props> = observer(
  function SavingSpendingModal({ visible, editedSpendingId, onClose }) {
    const editedSpending = useLocalObservable(() => ({
      value:
        editedSpendingId === null
          ? new SavingSpending(-1, "", false, [])
          : createViewModel(savingSpendingStore.getById(editedSpendingId)),
    }));

    const handleSubmit = () => {
      savingSpendingStore.addSpending(editedSpending.value);
    };

    return (
      <Modal
        title="Добавление/редактирование события"
        visible={visible}
        onCancel={onClose}
        width={850}
        okText="Добавить"
        onOk={handleSubmit}
      >
        <Space direction="vertical">
          <Space>
            Имя события:
            <Input
              placeholder="Событие"
              name={editedSpending.value.name}
              onChange={(e) => editedSpending.value.changeName(e.target.value)}
              style={{ width: 300 }}
            />
          </Space>
          {editedSpending.value.categories.map((category) => {
            const initialValues: FormValues = {
              name: category.name,
              forecast: category.forecast,
              comment: category.comment,
            };
            const handleSubmit = (values: FormValues) => {
              const newCategory = new SavingSpendingCategory(
                category.id,
                values.name,
                values.forecast,
                values.comment
              );
              editedSpending.value.editCategory(newCategory);
            };
            return (
              <SpendingCategoryForm
                initialValues={initialValues}
                onSubmit={handleSubmit}
                key={category.id}
              />
            );
          })}
          <Tooltip title="Добавить расход">
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={() => {
                editedSpending.value.addEmptyCategory();
              }}
            />
          </Tooltip>
        </Space>
      </Modal>
    );
  }
);

export default SavingSpendingModal;
