import React, { ChangeEventHandler, useCallback, useMemo, useRef } from 'react';
import { useQuery } from 'react-query';
import { useVirtual } from 'react-virtual';
import { RatEntry, Status } from '../pages/api/rat/[lat]/[lng]';
import { useLocalStorageState } from '../utils';
import { RatEntryCard } from './RatEntry';
import { useLocation } from './useLocation';

interface Props {}

const Location = ({
  currentLocation
}: {
  currentLocation: GeolocationPosition | null;
}) =>
  !currentLocation ? (
    <></>
  ) : (
    <div>
      Your location is:{' '}
      <a
        href={`https://www.google.com.au/maps/search/${currentLocation?.coords.latitude},${currentLocation?.coords.longitude}`}
        target="_blank"
        rel="noreferrer"
      >
        {currentLocation?.coords.latitude}, {currentLocation?.coords.longitude}
      </a>
    </div>
  );

const RatList = (props: Props) => {
  const currentLocation = useLocation();
  const { isLoading, data } = useQuery<RatEntry[]>(
    ['GET_RAT_LIST', currentLocation],
    async () => {
      if (currentLocation) {
        const res = await fetch(
          `/api/rat/${currentLocation?.coords.latitude}/${currentLocation?.coords.longitude}`
        );
        return await res.json();
      }
      return Promise.resolve([]);
    }
  );

  const [filter, setFilter] = useLocalStorageState('filter', '');
  const onChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (evt) => {
      setFilter(evt.target.value);
    },
    [setFilter]
  );

  type SortField = 'recency' | 'distance';
  const [sort, setSort] = useLocalStorageState<SortField>('sort', 'recency');
  const onChangeSort = useCallback<ChangeEventHandler<HTMLSelectElement>>(
    (evt) => {
      const isSortField = (field: string): field is SortField =>
        field === 'distance' || field === 'recency';
      const field = evt.target.value;
      if (isSortField(field)) {
        setSort(field);
      }
    },
    [setSort]
  );

  type DistanceFilter =
    | '100km'
    | '50km'
    | '20km'
    | '15km'
    | '10km'
    | '5km'
    | '1km';

  const distanceFilterKeys = useMemo<DistanceFilter[]>(
    () => ['100km', '50km', '20km', '15km', '10km', '5km', '1km'],
    []
  );
  const [distanceFilter, setDistanceFilter] =
    useLocalStorageState<DistanceFilter>('distanceFilter', '20km');
  const onChangeDistanceFilter = useCallback<
    ChangeEventHandler<HTMLSelectElement>
  >(
    (evt) => {
      const isDistanceFilter = (field: string): field is DistanceFilter =>
        distanceFilterKeys.includes(field as DistanceFilter);
      const field = evt.target.value;
      if (isDistanceFilter(field)) {
        setDistanceFilter(field);
      }
    },
    [distanceFilterKeys, setDistanceFilter]
  );

  type StatusFilter = Status | 'ALL';

  const statusFilterKeys = useMemo<StatusFilter[]>(
    () => ['IN_STOCK', 'LOW_STOCK', 'NO_STOCK', 'ALL'],
    []
  );
  const [statusFilter, setStatusFilter] = useLocalStorageState<StatusFilter>(
    'statusFilter',
    'ALL'
  );
  const onChangeStatusFilter = useCallback<
    ChangeEventHandler<HTMLSelectElement>
  >(
    (evt) => {
      const isStatusFilter = (field: string): field is StatusFilter =>
        statusFilterKeys.includes(field as StatusFilter);
      const field = evt.target.value;
      if (isStatusFilter(field)) {
        setStatusFilter(field);
      }
    },
    [setStatusFilter, statusFilterKeys]
  );

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return data
      .filter((entry) => {
        if (statusFilter === 'ALL') {
          return true;
        }
        return entry.status === statusFilter;
      })
      .filter((entry) =>
        entry.name.toLowerCase().includes(filter.toLowerCase())
      )
      .filter(
        (entry) =>
          entry.distance <= Number.parseFloat(distanceFilter.split('km')[0])
      )
      .sort((a, b) => {
        switch (sort) {
          case 'distance':
          default:
            return a.distance - b.distance;
          case 'recency':
            return b.timestamp - a.timestamp;
        }
      });
  }, [data, distanceFilter, filter, sort, statusFilter]);

  const theWindow = typeof window !== 'undefined' ? window : null;

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtual({
    size: filteredData.length,
    parentRef,
    windowRef: useRef(theWindow)
  });

  if (isLoading || !currentLocation) {
    return (
      <div>
        Loading...
        <Location currentLocation={currentLocation} />
      </div>
    );
  }

  return (
    <div>
      <Location currentLocation={currentLocation} />
      <br />
      <br />
      <label>
        Filter: <input type="text" onChange={onChange} value={filter} />
      </label>
      <br />
      <label>
        Sort by:{' '}
        <select onChange={onChangeSort} value={sort}>
          {['Distance', 'Recency'].map((option) => (
            <option key={option.toLowerCase()} value={option.toLowerCase()}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <br />
      <label>
        Distance less than:{' '}
        <select onChange={onChangeDistanceFilter} value={distanceFilter}>
          {distanceFilterKeys.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <br />
      <label>
        Show:{' '}
        <select onChange={onChangeStatusFilter} value={statusFilter}>
          {statusFilterKeys.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      {filteredData.length === 0 ? <div>No results</div> : null}
      <div ref={parentRef} style={{ width: `400px` }}>
        <div
          style={{
            height: `${rowVirtualizer.totalSize}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {rowVirtualizer.virtualItems.map((virtualRow) => (
            <div
              key={virtualRow.key}
              ref={virtualRow.measureRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <RatEntryCard
                key={filteredData[virtualRow.index].id}
                RatEntry={filteredData[virtualRow.index]}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatList;
