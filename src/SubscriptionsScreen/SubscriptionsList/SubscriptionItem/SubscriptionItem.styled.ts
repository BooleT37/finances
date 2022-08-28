import styled from "styled-components";

export const SubscriptionItemProp = styled.span`
  margin-right: 10px;
`;

export const SubscriptionName = styled(SubscriptionItemProp)`
  font-size: 16px;
`;

export const SubscriptionCost = styled(SubscriptionItemProp)`
  color: green;
`;

export const SubscriptionDate = styled(SubscriptionItemProp)`
  color: darkgray;
`;
