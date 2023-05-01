import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService {
    private readonly prisma: PrismaClient;

    constructor(){
        this.prisma = new PrismaClient()
    }

    async saveListings(listings){
        for(const listing of listings){
            await this.prisma.listing.create({
                data: {
                    address:  listing.address,
                    price:     listing.price,
                    sqmPrice:  listing.sqmPrice,
                    sqmSize:   listing.sqmSize,
                    roomCount: listing.roomCount,
                    imageKey:   listing.imageKey,
                    imageUrl:  listing.imageUrl,
                }
            })
        }
    }

    async getListings(){
        console.log(await this.prisma.listing.findMany());
    }
}
