import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { BucketService } from 'src/bucket/services/bucket.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ListingService {
  constructor(private httpService: HttpService, private bucketService: BucketService, private prismaService: PrismaService) {}

  async scrape(location: string){
    const baseUrl = 'https://www.hemnet.se/bostader?';
    const itemTypes = 'bostadsratt';

    this.prismaService.getListings();

    const params = new URLSearchParams();
    params.append("location_ids[]", location);
    params.append("item_types[]", itemTypes);

    const response$ = this.httpService.get(baseUrl, { params: params });
    const response = await firstValueFrom(response$);
    const $ = cheerio.load(response.data);
    const listings = [];

    $('li.normal-results__hit').each((_i, element) => {
      const listing = {};

      const image = $(element).find('div.listing-card__images-container > div > img');
      if(image){
        listing['imageUrl'] = image.attr('data-src');
      }

      const address = $(element).find('h2.listing-card__street-address');
      if (address) {
        listing['address'] = address.text().trim();
      }

      const attributesRow = $(element).find('div.listing-card__attribute--primary');
      if(attributesRow) {
        const infoString = attributesRow.text().trim().split("\n");
        const info = infoString.filter(function(entry) { return entry.trim() != ''; });
        if(info.length === 3){
          listing['price'] = info[0].trim();
          listing['sqmSize'] = info[1].trim();
          listing['roomCount'] = info[2].trim();
        }
      }

      const price = $(element).find('div.listing-card__attribute--square-meter-price');
      if (price) {
        listing['sqmPrice'] = price.text().trim();
      }

      listing['locationId'] = location;
      listings.push(listing);
    });

    try {
      const updatedListings = this.bucketService.uploadImages(listings);
      this.prismaService.saveListings(updatedListings);
      return listings;

    } catch (error){
      return `An error occurred. Error ${error}`;
    }
  }

  findAll() {
    return `This action returns all listing`;
  }

  findOne(id: number) {
    return `This action returns a #${id} listing`;
  }
}
