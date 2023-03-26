import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';

@Injectable()
export class AppService {
  constructor(private httpService: HttpService) {}

  async getListings(url: string){
    const response$ = this.httpService.get(url);
    const response = await firstValueFrom(response$);
    const $ = cheerio.load(response.data);
    const listings = [];
    
    $('li.normal-results__hit').each((_i, element) => {
      const listing = {};

      const title = $(element).find('h2.listing-card__street-address');
      if (title) {
        listing['title'] = title.text().trim();
      }

      const price = $(element).find('div.listing-card__attribute--square-meter-price');
      if (price) {
        listing['squareMeterPrice'] = price.text().trim();
      }

      listings.push(listing);
    });

    return listings;
  }
}
