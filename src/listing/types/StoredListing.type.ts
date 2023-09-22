import { Listing } from './Listing.type';

export type StoredListing = Listing & {
  id: number;
  createdAt: Date;
};
