import { observer } from "mobx-react";
import React from "react";
import { DATE_FORMAT } from "../../constants";

import subscriptionStore from "../../stores/subscriptionStore";
import SubscriptionItem from "./SubscriptionItem";
import { SubscriptionCategoryName } from "./SubscriptionsList.styled";

interface Props {
  onEditClick(subscriptionId: number): void;
}

const SubscriptionsList: React.FC<Props> = observer(function SubscriptionsList({
  onEditClick,
}) {
  const subscriptions = subscriptionStore.byCategory;
  return (
    <div>
      {Object.keys(subscriptions).map((categoryName) => (
        <div key={categoryName}>
          <SubscriptionCategoryName level={3}>
            {categoryName}
          </SubscriptionCategoryName>
          <ul>
            {subscriptions[categoryName].map((subscription) => (
              <li key={subscription.id}>
                <SubscriptionItem
                  id={subscription.id}
                  name={subscription.name}
                  costString={subscription.costString}
                  nextDate={subscription.nextDate.format(DATE_FORMAT)}
                  onEdit={(subscriptionId) => {
                    onEditClick(subscriptionId);
                  }}
                  onDelete={(subscriptionId) => {
                    subscriptionStore.delete(subscriptionId);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
});

export default SubscriptionsList;
