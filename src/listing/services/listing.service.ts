import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
import { BucketService } from 'src/bucket/services/bucket.service';
import { PrismaService } from 'src/prisma/prisma.service';
import puppeteer from 'puppeteer';

@Injectable()
export class ListingService {
  constructor(
    private httpService: HttpService,
    private bucketService: BucketService,
    private prismaService: PrismaService,
  ) {}

  async scrape(location: string) {
    const baseUrl = 'https://www.hemnet.se/bostader?';
    const itemTypes = 'bostadsratt';

    const params = this.createParams(location, itemTypes);

    const response$ = this.httpService.get(baseUrl, { params: params });
    const response = await firstValueFrom(response$);
    const $ = cheerio.load(response.data);

    const listings = this.scrapeAttributes($, location);

    if ($('.next_page')) {
      const link = $('.next_page').attr('href');
      const hemnetUrl = 'https://www.hemnet.se';

      const response$ = this.httpService.get(hemnetUrl + link);
      const response = await firstValueFrom(response$);
      const $b = cheerio.load(response.data);

      const listingsPage2 = this.scrapeAttributes($b, location);
      listings.push(...listingsPage2);
    }

    try {
      const updatedListings = await this.getDatePublished(listings);
      //const updatedListings = await this.bucketService.uploadImages(listings);
      this.prismaService.saveListings(updatedListings);
      return listings;
    } catch (error) {
      console.error(`An error occurred. ${error}`);
    }
  }

  private createParams(location: string, itemTypes: string, page?: string) {
    const params = new URLSearchParams();
    params.append('location_ids[]', location);
    params.append('item_types[]', itemTypes);

    if (typeof page !== 'undefined') {
      params.append('page', page);
    }

    return params;
  }

  getAll() {
    return this.prismaService.getAll();
  }

  getOne(id: number) {
    return this.prismaService.getOne(id);
  }

  private async getDatePublished(listings) {
    const updatedListings = [];
    for (const listing of listings) {
      const browser = await puppeteer.launch({ headless: 'new' });
      try {
        const page = await browser.newPage();
        await page.goto(listing.url); //, { waitUntil: 'networkidle2' });

        await this.scrollToBottom(page);

        const datePublishedElement = await page.evaluate(() => {
          document.scrollingElement.scrollTop = document.body.scrollHeight;

          const elements = Array.from(
            document.querySelectorAll('.hcl-hint > span'),
          );
          return elements.map((element) => element.innerHTML);
        });

        let datePublishedDescription = datePublishedElement[0].split('</span>');
        datePublishedDescription = datePublishedDescription[1].split(',');
        datePublishedDescription = datePublishedDescription[1].split('.');
        const date = datePublishedDescription[0].replace('den ', '').trim();

        const dateComponents = date.split(' ');
        console.log('dateComponents', dateComponents);

        const dateInText = {
          day: dateComponents[0],
          month: dateComponents[1],
          year: dateComponents[2],
        };

        const dateInDigits = this.convertDate(dateInText);
        listing['datePublished'] = dateInDigits;
        updatedListings.push(listing);
      } catch (e) {
        console.error(`Failed to fetch date for listing ${listing.url}`);
      } finally {
        await browser.close();
      }
    }
    console.log(updatedListings);
    return updatedListings;
  }

  public convertDate(date) {
    const months = {
      januari: '01',
      februari: '02',
      mars: '03',
      april: '04',
      maj: '05',
      juni: '06',
      juli: '07',
      augusti: '08',
      september: '09',
      oktober: '10',
      november: '11',
      december: '12',
    };
    console.log('date is', date);

    if (date.day.length === 1) {
      return '0' + date.day + '-' + months[date.month] + '-' + date.year;
    }
    return date.day + '-' + months[date.month] + '-' + date.year;
  }

  private scrapeAttributes($: cheerio.CheerioAPI, location: string) {
    const listings = [];

    $('li.normal-results__hit').each((_i, element) => {
      const listing = {};

      const url = $(element).find('.js-listing-card-link');
      if (url) {
        listing['url'] = url.attr('href');
        const urlComponents = url.attr('href').split('-');
        listing['hemnetListingId'] = urlComponents.pop();
      }

      const image = $(element).find(
        'div.listing-card__images-container > div > img',
      );
      if (image) {
        listing['imageUrl'] = image.attr('data-src');
      }

      const address = $(element).find('h2.listing-card__street-address');
      if (address) {
        listing['address'] = address.text().trim();
      }

      const attributesRow = $(element).find(
        'div.listing-card__attribute--primary',
      );
      if (attributesRow) {
        const infoString = attributesRow.text().trim().split('\n');
        const info = infoString.filter(function (entry) {
          return entry.trim() != '';
        });
        if (info.length === 3) {
          listing['price'] = info[0].trim();
          listing['sqmSize'] = info[1].trim();
          listing['roomCount'] = info[2].trim();
        }
      }

      const fee = $(element).find('div.listing-card__attribute--fee');
      if (fee) {
        listing['monthlyFee'] = fee.text().trim();
      }

      const price = $(element).find(
        'div.listing-card__attribute--square-meter-price',
      );
      if (price) {
        listing['sqmPrice'] = price.text().trim();
      }

      listing['locationId'] = location;
      listings.push(listing);
    });

    return listings;
  }

  async scrollToBottom(page): Promise<void> {
    await page.evaluate(async () => {
      await new Promise<void>((resolve, reject) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }
}
