import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Listing } from 'src/listing/types/Listing.type';

@Injectable()
export class PrismaService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async saveListings(listings: Listing[]) {
    for (const listing of listings) {
      const match = this.checkMatchByHemnetListingId(listing);
      //this.checkMatchByListingProperties(listing);

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
      } catch (error) {
        console.log(
          `An error occured. Could not add listing ${listing.address} to database: ${error}`,
        );
      }
    }
  }

  async getAll() {
    return await this.prisma.listing.findMany();
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

  async getHemnetListingIdMatch(listing: Listing) {
    return await this.prisma.listing.findFirst({
      where: {
        hemnetListingId: listing.hemnetListingId,
      },
    });
  }

  async checkMatchByHemnetListingId(listing: Listing) {
    const match = await this.getHemnetListingIdMatch(listing);
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
    }
  }
}

// TODO: add check for "if address, sqm, roomcount the same AND date published the same => don't save to listing table"
