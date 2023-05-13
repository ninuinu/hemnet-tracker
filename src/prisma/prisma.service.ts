import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async saveListings(listings) {
    for (const listing of listings) {
      const matches = await this.exists(listing);
      console.log('matches is', matches);
      if (matches.length != 0) {
        // register
      }
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
          },
        });
      } catch (error) {
        console.log(
          `An error occured. Could not add listing ${listing.address} to database.`,
        );
        console.error(error);
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

  async exists(listing) {
    return await this.prisma.listing.findMany({
      where: {
        roomCount: listing.roomCount,
        sqmSize: listing.sqmSize,
        address: listing.address,
      },
    });
  }
}
