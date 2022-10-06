import { ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Col, Modal, Row, Tooltip, Typography } from "antd";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import { useState } from "react";
import styled from "styled-components";
import SiteContent from "../SiteContent";
import savingSpendingStore from "../stores/savingSpendingStore";
import WhiteHeader from "../WhiteHeader";
import SavingSpendingCard from "./SavingSpendingCard";
import SavingSpendingModal from "./SavingSpendingModal";

const { Title } = Typography;

const ContentStyled = styled(SiteContent)`
  background: transparent;
`;

const ColStyled = styled(Col)`
  margin-bottom: 16px;
`;

const AddEventCard = styled(Card)`
  text-align: center;
`;

const SavingSpendingsScreen: React.FC = observer(
  function SavingSpendingsScreen() {
    const spendings = savingSpendingStore.savingSpendings;

    const [modalVisible, setModalVisible] = useState(false);
    const [editedSpendingId, setEditedSpendingId] = useState<number>(-1);
    return (
      <>
        <WhiteHeader>
          <Title>Траты из сбережений</Title>
        </WhiteHeader>
        <ContentStyled>
          <Row gutter={16}>
            {spendings
              .slice()
              .sort((s1, s2) =>
                s1.name < s2.name ? -1 : s1.name > s2.name ? 1 : 0
              )
              .map((s) => (
                <ColStyled key={s.id} span={8}>
                  <SavingSpendingCard
                    spending={s}
                    onEditClick={() => {
                      runInAction(() => {
                        setEditedSpendingId(s.id);
                      });
                      setModalVisible(true);
                    }}
                    onDeleteClick={() => {
                      Modal.confirm({
                        title: "Вы уверены, что хотите удалить это событие?",
                        icon: <ExclamationCircleOutlined />,
                        onOk: async () =>
                          runInAction(() =>
                            savingSpendingStore.removeSpending(s.id)
                          ),
                      });
                    }}
                  />
                </ColStyled>
              ))}
            <ColStyled span={8}>
              <AddEventCard>
                <Tooltip title="Добавить расход">
                  <Button
                    type="link"
                    icon={<PlusOutlined style={{ fontSize: 40 }} />}
                    onClick={() => {
                      setEditedSpendingId(-1);
                      setModalVisible(true);
                    }}
                  />
                </Tooltip>
              </AddEventCard>
            </ColStyled>
          </Row>
        </ContentStyled>
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
