import { Form, Modal } from "antd";
import { runInAction } from "mobx";
import { useEffect } from "react";
import savingSpendingStore from "../../stores/savingSpendingStore";
import SpendingCategoriesForm, { FormValues } from "./SpendingCategoriesForm";
import { saveSavingSpending } from "./utils/saveSavingSpending";

interface Props {
  editedSpendingId: number;
  visible: boolean;
  onClose(): void;
}

// eslint-disable-next-line mobx/missing-observer
const SavingSpendingModal: React.FC<Props> = ({
  visible,
  editedSpendingId,
  onClose,
}) => {
  const [form] = Form.useForm<FormValues>();
  const handleOk = () => {
    form.submit();
  };

  const editedSpending =
    editedSpendingId === -1
      ? null
      : savingSpendingStore.getById(editedSpendingId);

  const handleFinish = (values: FormValues) => {
    runInAction(() => {
      saveSavingSpending(editedSpendingId, values);
    });
    onClose();
  };

  useEffect(() => {
    if (visible) {
      if (editedSpending === null) {
        form.resetFields();
      } else {
        runInAction(() => {
          form.setFieldsValue({
            name: editedSpending.name,
            categories: editedSpending.categories.map((c) => ({
              comment: c.comment,
              forecast: c.forecast,
              name: c.name,
              id: c.id,
            })),
          });
        });
      }
    }
  });

  return (
    <Modal
      title={editedSpending ? "Редактирование события" : "Добавление события"}
      visible={visible}
      onCancel={onClose}
      okText={editedSpending ? "Сохранить" : "Добавить"}
      onOk={handleOk}
    >
      <SpendingCategoriesForm formRef={form} onFinish={handleFinish} />
    </Modal>
  );
};

export default SavingSpendingModal;
