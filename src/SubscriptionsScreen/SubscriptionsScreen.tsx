import React from "react";
import WhiteHeader from "../WhiteHeader";
import { Button, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

import SiteContent from "../SiteContent";
import SubscriptionsList from "./SubscriptionsList";
import SubscriptionModal from "./SubscriptionModal";

const { Title } = Typography;

// eslint-disable-next-line mobx/missing-observer
const SubscriptionsScreen: React.FC = function SubscriptionsScreen() {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingSubscriptionId, setEditingSubscriptionId] = React.useState<
    number | null
  >(null);

  const openModal = (subscriptionId: number | null) => {
    setEditingSubscriptionId(subscriptionId);
    setModalVisible(true);
  };

  return (
    <>
      <WhiteHeader className="site-layout-background">
        <Title>Подписки</Title>
      </WhiteHeader>
      <SiteContent className="site-layout-background">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            openModal(null);
          }}
        >
          Добавить
        </Button>
        <SubscriptionsList
          onEditClick={(subscriptionId) => {
            openModal(subscriptionId);
          }}
        />
        <SubscriptionModal
          subscriptionId={editingSubscriptionId}
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </SiteContent>
    </>
  );
};

export default SubscriptionsScreen;
