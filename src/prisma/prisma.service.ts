import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Listing } from 'src/listing/types/Listing.type';
import { StoredListing } from 'src/listing/types/StoredListing.type';

@Injectable()
export class PrismaService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async saveListings(listings: Listing[]) {
    let successfulWrite = 0;
    let failedWrite = 0;

    const failedListings = [];

    for (const listing of listings) {
      const match = this.checkMatchByHemnetListingId(listing);

      try {
        await this.prisma.listing.create({
          data: {
            address: listing.address,
            price: listing.price,
            sqmPrice: listing.sqmPrice,
            sqmSize: listing.sqmSize,
            roomCount: listing.roomCount,
            imageUrl: listing.imageUrl,
            url: listing.url,
            monthlyFee: listing.monthlyFee,
            hemnetListingId: listing.hemnetListingId,
            datePublished: listing.datePublished,
            locationId: listing.locationId,
            balcony: listing.balcony,
            floor: listing.floor,
            patio: listing.patio,
            elevator: listing.elevator,
          },
        });
        successfulWrite++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(
            `Listing ${listing.address} already exists in database. Skipping.`,
          );
        } else {
          console.log(
            `Failed to save listing ${listing.address} to database. Error: \n${error}`,
          );
        }

        failedListings.push(listing);
        failedWrite++;
      }
    }
    console.log(
      `\n\n${successfulWrite} listings added to database.\n${failedWrite} listings failed to add to database.`,
    );

    return failedListings;
    /*
    console.log(`\n\nFailed listings:`);
    failedListings.forEach((listing) =>
      console.log(JSON.stringify(listing, null, 4)),
    );
    */
  }

  async getAll(page?: number, limit?: number) {
    if (page && limit) {
      return await this.prisma.listing.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    return await this.prisma.listing.findMany();
  }

  async getAllUnique(page?: number, limit?: number) {
    if (page && limit) {
      return await this.prisma.mostRecentListingOccurance.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    return await this.prisma.mostRecentListingOccurance.findMany();
  }

  async populateUniqueListings() {
    const allListings = await this.prisma.listing.findMany();
    const resultMap = new Map<string, StoredListing>();

    allListings.forEach((item) => {
      if (
        !resultMap.has(item.hemnetListingId) ||
        item.createdAt > resultMap.get(item.hemnetListingId)!.createdAt
      ) {
        resultMap.set(item.hemnetListingId, item);
      }
    });

    let successfulWrite = 0;
    let failedWrite = 0;

    const failedListings = [];

    for (const listing of [...resultMap.values()]) {
      try {
        await this.prisma.mostRecentListingOccurance.create({
          data: {
            id: listing.id,
            address: listing.address,
            price: listing.price,
            sqmPrice: listing.sqmPrice,
            sqmSize: listing.sqmSize,
            roomCount: listing.roomCount,
            imageUrl: listing.imageUrl,
            url: listing.url,
            monthlyFee: listing.monthlyFee,
            hemnetListingId: listing.hemnetListingId,
            datePublished: listing.datePublished,
            locationId: listing.locationId,
            balcony: listing.balcony,
            floor: listing.floor,
            patio: listing.patio,
            elevator: listing.elevator,
            createdAt: listing.createdAt,
          },
        });
        successfulWrite++;
      } catch (error) {
        console.log(
          `An error occured. Could not add listing ${listing.address} to database.\n`,
        );
        failedListings.push(listing);
        failedWrite++;
      }
    }
    console.log(
      `\n\n${successfulWrite} listings added to database.\n${failedWrite} listings failed to add to database.`,
    );
    console.log(`\n\nFailed listings:`);
    failedListings.forEach((listing) =>
      console.log(JSON.stringify(listing, null, 4)),
    );

    return [...resultMap.values()];
  }

  async getOne(id: number) {
    return await this.prisma.listing.findUnique({
      where: {
        id,
      },
    });
  }

  async exists(listing: Listing) {
    return await this.prisma.listing.findMany({
      where: {
        roomCount: listing.roomCount,
        sqmSize: listing.sqmSize,
        address: listing.address,
      },
    });
  }

  async getHemnetListingIdMatchGivenListing(listing: Listing) {
    return await this.prisma.listing.findFirst({
      where: {
        hemnetListingId: listing.hemnetListingId,
      },
    });
  }

  async getHemnetListingIdMatch(hemnetListingId: string) {
    return await this.prisma.listing.findMany({
      where: {
        hemnetListingId: hemnetListingId,
      },
    });
  }

  async checkMatchByHemnetListingId(listing: Listing) {
    const match = await this.getHemnetListingIdMatchGivenListing(listing);
    if (match) {
      try {
        if (match.datePublished != listing.datePublished) {
          await this.prisma.match.create({
            data: {
              hemnetListingId: listing.hemnetListingId,
            },
          });
          return true;
        } else {
          return false;
        }
      } catch (error) {
        console.error(
          `Failed to att match with hemnetListingId ${listing.hemnetListingId}: ${error}`,
        );
      }
    }
  }

  async checkMatchByListingProperties(listing: Listing) {
    const match = await this.exists(listing);
    if (match.length > 0) {
      console.log('there was a match');
    }
  }
}
