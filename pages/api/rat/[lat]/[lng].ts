import turfDistance from '@turf/distance';
import axios from 'axios';
import { format, formatDistance, parseISO } from 'date-fns';
import { enAU } from 'date-fns/locale';
import Geo from 'geo-nearby';
import type { NextApiRequest, NextApiResponse } from 'next';

export type Status = 'IN_STOCK' | 'LOW_STOCK' | 'NO_STOCK';

export interface RatEntry {
  id: string;
  name: string;
  address: string;
  date: string;
  lastUpdated: string;
  status: Status;
  lat: number;
  lng: number;
  priceInCents: number | null;
  pricePerN: number | null;
  distance: number;
  distanceString: string;
  timestamp: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RatEntry[]>
) {
  const { lat, lng } = req.query;

  let logArray: string[] = [];

  const myLog = (log: string) => {
    logArray.push(log);
  };

  console.log = myLog;

  const base = process.env.RAT_API_BASE;
  const instance = axios.create({
    baseURL: base
  });

  // get sites
  const sites = (await instance.get('/')).data;

  let currentLocation = {
    lat: Number.parseFloat(Array.isArray(lat) ? lat[0] : lat),
    lng: Number.parseFloat(Array.isArray(lng) ? lng[0] : lng)
  };
  console.log(currentLocation);
  //   currentLocation = { lat: -26.795640, lng: 153.108276 };

  const geoData = sites.map((site: any) => {
    return [site.lat, site.lng, site];
  });
  // console.log(geoData);

  const dataSet = (Geo as any).createCompactSet(geoData);
  const geo = new (Geo as any)(dataSet, {
    setOptions: { id: 'name', lat: 'lat', lon: 'lng' },
    sorted: true
  });

  const distanceRadiusKms = 100;

  const nearbySites = geo
    .nearBy(currentLocation.lat, currentLocation.lng, distanceRadiusKms * 1000)
    .map((site: any) => site.i);
  // console.log(nearbySites);

  const nearbyPrices: RatEntry[] = nearbySites
    .map((site: any) => {
      const distance = turfDistance(
        [currentLocation.lat, currentLocation.lng],
        [site.lat, site.lng],
        {
          units: 'kilometers'
        }
      );

      return {
        ...site,
        distance: distance,
        distanceString: distance.toFixed(2) + ' km',
        timestamp: format(parseISO(site.date + '+00'), 't', {
          locale: enAU
        }),
        lastUpdated: formatDistance(parseISO(site.date + '+00'), new Date(), {
          locale: enAU,
          addSuffix: true
        })
      };
    })

    .sort((a: any, b: any) => (a.distance < b.distance ? -1 : 1));

  // res.status(200).json({ logArray });
  res.status(200).json(nearbyPrices);
}
