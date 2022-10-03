import { Button, Card, Tooltip, Typography } from "antd";
import { observer } from "mobx-react";
import SiteContent from "../SiteContent";
import savingSpendingStore from "../stores/savingSpendingStore";
import WhiteHeader from "../WhiteHeader";
import SavingSpendingCard from "./SavingSpendingCard";
import { PlusOutlined } from "@ant-design/icons";
import { useState } from "react";
import SavingSpendingModal from "./SavingSpendingModal";

const { Title } = Typography;

const SavingSpendingsScreen: React.FC = observer(
  function SavingSpendingsScreen() {
    const spendings = savingSpendingStore.savingSpendings;

    const [modalVisible, setModalVisible] = useState(false);
    const [editedSpendingId, setEditedSpendingId] = useState<number | null>(
      null
    );
    return (
      <>
        <WhiteHeader className="site-layout-background">
          <Title>Траты из сбережений</Title>
        </WhiteHeader>
        <SiteContent className="site-layout-background">
          {spendings.map((s) => (
            <SavingSpendingCard key={s.id} spending={s} />
          ))}
          <Card>
            <Tooltip title="Добавить расход">
              <Button
                type="link"
                icon={<PlusOutlined style={{ fontSize: 40 }} />}
                onClick={() => {
                  setEditedSpendingId(null);
                  setModalVisible(true);
                }}
              />
            </Tooltip>
          </Card>
        </SiteContent>
        <SavingSpendingModal
          editedSpendingId={editedSpendingId}
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
          }}
        />
      </>
    );
  }
);

export default SavingSpendingsScreen;
