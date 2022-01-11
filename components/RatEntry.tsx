import React from 'react';
import { RatEntry, Status } from '../pages/api/rat/[lat]/[lng]';
import styled from 'styled-components';
import Image from 'next/image';

interface Props {
  RatEntry: RatEntry;
}

const Card = styled.div<{ status: Status }>`
  border: 1px solid #333;
  border-radius: 5px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;

  background: ${({ status }) =>
    status === 'IN_STOCK'
      ? '#0a7e0a33'
      : status === 'LOW_STOCK'
      ? '#ffbb0033'
      : '#ff000033'};
`;

const Name = styled.h2`
  padding: 0;
  margin: 0;
`;
const Price = styled.h2`
  font-size: 2rem;
  padding: 0;
  margin: 0 0 1rem;
`;
const Address = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;
const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

function getStatusLabel(status: Status) {
  switch (status) {
    case 'IN_STOCK':
      return 'In Stock';

    case 'LOW_STOCK':
      return 'Low Stock';

    case 'NO_STOCK':
      return 'Out of Stock';
  }
}

const Status = styled.div`
  font-size: 1.2rem;
`;

const StatusLabel = ({ status }: { status: Status }) => {
  return <Status>{getStatusLabel(status)}</Status>;
};

export const RatEntryCard = (props: Props) => {
  const {
    id,
    name,
    address,
    date,
    lastUpdated,
    status,
    priceInCents,
    pricePerN,
    distanceString
  } = props.RatEntry;
  return (
    <Card status={status}>
      <Address>
        <Name>{name}</Name>
        <div>
          <a
            href={`https://www.google.com.au/maps/search/${name}+${address}`}
            target="_blank"
            rel="noreferrer"
          >
            {address}
          </a>

          <StatusLabel status={status} />
          <div>{distanceString}</div>
          <div>Last updated: {lastUpdated}</div>
        </div>
      </Address>
      <PriceContainer>
        {priceInCents !== null && (
          <Price>
            {priceInCents / 100} per {pricePerN}
          </Price>
        )}
      </PriceContainer>
    </Card>
  );
};
