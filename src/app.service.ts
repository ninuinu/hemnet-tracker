import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';

@Injectable()
export class AppService {
  constructor(private httpService: HttpService) {}

  async getListings(location: string){
    const baseUrl = 'https://www.hemnet.se/bostader?';
    const itemTypes = 'bostadsratt';

    const params = new URLSearchParams();
    params.append("location_ids[]", location);
    params.append("item_types[]", itemTypes);

    const response$ = this.httpService.get(baseUrl, { params: params });
    const response = await firstValueFrom(response$);
    const $ = cheerio.load(response.data);
    const listings = [];

    $('li.normal-results__hit').each((_i, element) => {
      console.log("HEJ");
      const listing = {};

      const title = $(element).find('h2.listing-card__street-address');
      if (title) {
        listing['title'] = title.text().trim();
      }

      const attributesRow = $(element).find('div.listing-card__attribute--primary');
      if(attributesRow) {
        const infoString = attributesRow.text().trim().split("\n");
        const info = infoString.filter(function(entry) { return entry.trim() != ''; });
        listing['info'] = info.map(infoItem=>infoItem.trim());
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
