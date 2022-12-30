import { Button, Modal } from "antd";
import { useCallback, useState } from "react";
import { MonthsDataStep } from "./steps/MonthsDataStep";
import { MostSpendingsStep } from "./steps/MostSpendingsStep";
import { SavingsStep } from "./steps/SavingsStep";
import { SubscriptionsStep } from "./steps/SubscriptionsStep";

interface Props {
  visible: boolean;
  onClose(): void;
}

enum Steps {
  MostSpendings = "MostSpendings",
  Savings = "Savings",
  Subscriptions = "Subscriptions",
  MonthsData = "MonthsData",
}

const stepsOrder = [
  Steps.MostSpendings,
  Steps.Savings,
  Steps.Subscriptions,
  Steps.MonthsData,
];

// eslint-disable-next-line mobx/missing-observer
export const YearReview: React.FC<Props> = ({ visible, onClose }) => {
  const [step, setStep] = useState<Steps>(Steps.MostSpendings);
  const stepIndex = stepsOrder.indexOf(step);

  const nextStep = useCallback(() => {
    if (stepIndex === stepsOrder.length - 1) {
      return;
    }
    setStep(stepsOrder[stepIndex + 1]);
  }, [stepIndex]);

  const previousStep = useCallback(() => {
    if (stepIndex === 0) {
      return;
    }
    setStep(stepsOrder[stepIndex - 1]);
  }, [stepIndex]);

  const footer = (
    <div>
      <Button disabled={stepIndex === 0} onClick={previousStep}>
        Назад
      </Button>
      <Button disabled={stepIndex === stepsOrder.length - 1} onClick={nextStep}>
        Далее
      </Button>
      <Button type="primary" onClick={onClose}>
        Закрыть
      </Button>
    </div>
  );

  return (
    <Modal
      title="Итоги года"
      visible={visible}
      onCancel={onClose}
      footer={footer}
      width={800}
    >
      {step === Steps.MostSpendings && <MostSpendingsStep />}
      {step === Steps.Savings && <SavingsStep />}
      {step === Steps.Subscriptions && <SubscriptionsStep />}
      {step === Steps.MonthsData && <MonthsDataStep />}
    </Modal>
  );
};
