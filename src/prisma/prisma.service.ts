import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService {
    private readonly prisma: PrismaClient;

    constructor(){
        this.prisma = new PrismaClient()
    }

    async saveListings(){
        
            await this.prisma.listing.create({
                data: {
                    address: "test",
                    url:      "test",
                    price:     34,
                    sqmPrice:  54,
                    sqmSize:   45,
                    roomCount: 5,
                    imageKey:   "test",
                    imageUrl:  "test",
                }
            })
    }

    async getListings(){
        console.log(await this.prisma.listing.findMany());
    }
}
