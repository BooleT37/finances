import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Select,
  AutoComplete,
  DatePicker,
  InputRef
} from 'antd';
import { observer } from 'mobx-react';
import { Moment } from 'moment';
import React from 'react';
import Currency from '../../models/Currency';
import Expense from '../../models/Expense';
import categoryStore from '../../stores/categoryStore';
import expenseStore from '../../stores/extenseStore';

const { Option } = Select;

interface Props {
  visible: boolean;
  expense?: Expense
  onSave(expense: Expense): void
  onCancel(): void
}

interface FormValues {
  cost: string,
  currency: Currency,
  date: Moment,
  category: string,
  name: string
}

const ExpenseModal: React.FC<Props> = observer(function ExpenseModal(props) {
  const { visible, expense: initialExpense, onSave, onCancel } = props;
  const [form] = Form.useForm<FormValues>();
  const inputRef = React.useRef<InputRef>(null);

  const handleSubmit = () => {
    form
      .validateFields()
      .then(values => {
        form.resetFields();
        onSave(new Expense(
          expenseStore.nextId,
          parseInt(values.cost),
          values.currency,
          values.date.format('YYYY-MM-DD'),
          categoryStore.getByName(values.category), values.name)
        )
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });

  }

  React.useEffect(() => {
    if (visible) {
      inputRef.current?.focus()
    }
  }, [visible])

  return (
    <Modal
      visible={visible}
      title={initialExpense ? 'Редактирование траты' : 'Новая трата'}
      onOk={handleSubmit}
      onCancel={onCancel}
      footer={[
        <Checkbox key="more">Добавить ещё</Checkbox>,
        <Button key="cancel" onClick={onCancel}>
          Отмена
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Ввод
        </Button>,
      ]}
    >
      <Form
        form={form}
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        initialValues={{
          cost: '',
          currency: 'Eur',
          category: categoryStore.getByName('Подписки'),
          name: ''
        }}
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="cost"
          label="Сумма"
          rules={[{ required: true, message: 'Введите сумму траты' }]}
        >
          <Input ref={inputRef} />
        </Form.Item>
        <Form.Item name="currency" label="Валюта">
          <Select>
            <Option value={Currency.Eur}>€</Option>
            <Option value={Currency.Rub}>₽</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="date"
          label="Дата"
          rules={[{ required: true, message: 'Введите дату' }]}
        >
          <DatePicker />
        </Form.Item>
        <Form.Item
          name="category"
          label="Категория"
          rules={[{ required: true, message: 'Выберите категорию' }]}
        >
          <AutoComplete
            options={categoryStore.asOptions}
            placeholder="Начните вводить"
          />
        </Form.Item>
        <Form.Item name="name" label="Коментарий">
          <Input />
        </Form.Item>
      </Form>
    </Modal >
  )
});

export default ExpenseModal