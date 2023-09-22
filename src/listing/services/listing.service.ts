import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import puppeteer, { Page } from 'puppeteer';
import { firstValueFrom } from 'rxjs';
import { BucketService } from 'src/bucket/services/bucket.service';
import { DatabaseService } from 'src/database/database.service';
import { DateInWords, Day, Month, Year } from '../types';
import { Listing } from '../types/Listing.type';

@Injectable()
export class ListingService {
  BASEURL = 'https://www.hemnet.se/bostader?';
  ITEM_TYPES = 'bostadsratt';
  NEW_CONSTRUCTION = 'exclude';
  LISTINGS: Listing[] = [];

  constructor(
    private httpService: HttpService,
    private bucketService: BucketService,
    private databaseService: DatabaseService,
  ) {}

  async scrape(location: string) {
    const params = this.createParams(location);

    const response$ = this.httpService.get(this.BASEURL, { params: params });

    const response = await firstValueFrom(response$);

    const $ = cheerio.load(response.data);

    const listings = this.scrapeAttributes($, location);

    if ($('.next_page')) {
      const link = $('.next_page').attr('href');
      const hemnetUrl = 'https://www.hemnet.se';

      const response$ = this.httpService.get(hemnetUrl + link);
      const response = await firstValueFrom(response$);
      const $nextPage = cheerio.load(response.data);

      const listingsOnNextPage = this.scrapeAttributes($nextPage, location);
      listings.push(...listingsOnNextPage);
    }

    try {
      const updatedListings = await this.getDatePublished(listings);
      //const updatedListings = await this.bucketService.uploadImages(listings);

      const failed = this.databaseService.saveListings(updatedListings);
      return failed;
    } catch (error) {
      console.error(`An error occurred. ${error}`);
    }
  }

  private createParams(location: string, page?: string): URLSearchParams {
    const params = new URLSearchParams();
    params.append('location_ids[]', location);
    params.append('item_types[]', this.ITEM_TYPES);
    params.append('new_construction', this.NEW_CONSTRUCTION);

    if (page) {
      params.append('page', page);
    }

    return params;
  }

  async populateUniqueListings() {
    return this.databaseService.populateUniqueListings();
  }

  getAllUnique(page?: number, limit?: number) {
    return this.databaseService.getAllUnique(page, limit);
  }

  getAll(page?: number, limit?: number) {
    return this.databaseService.getAll(page, limit);
  }

  async getMatches(id: number) {
    const listing = await this.databaseService.getOne(id);
    const hemnetListingId = listing.hemnetListingId;
    return this.databaseService.getHemnetListingIdMatch(hemnetListingId);
  }

  getOne(id: number) {
    console.log('Get request incoming! Asking for id:', id);
    return this.databaseService.getOne(id);
  }

  private async getDatePublished(listings: Listing[]) {
    const updatedListings = [];
    for (const listing of listings) {
      const browser = await puppeteer.launch({
        args: ['--shm-size=3gb'],
        headless: 'new',
      });
      try {
        const page = await browser.newPage();
        await page.goto(listing.url);
        await this.scrollToBottom(page);

        const floorComponents = await page.evaluate(() => {
          const floorElements = Array.from(
            document.querySelectorAll(
              '.qa-floor-attribute > .property-attributes-table__value',
            ),
          );
          return floorElements.map((element) =>
            element.innerHTML.replace('\n', '').trim(),
          );
        });

        const floorAndElevator = floorComponents.pop();
        console.log(
          'Processing listing',
          listing.address,
          ', floorAndElevator: ',
          floorAndElevator,
        );

        if (floorAndElevator !== undefined) {
          if (floorAndElevator.includes('hiss')) {
            if (floorAndElevator.split(',').length - 1 == 2) {
              const indexToSplitOn = floorAndElevator.lastIndexOf(',');
              listing['floor'] = floorAndElevator
                .slice(0, indexToSplitOn)
                .trim();
              listing['elevator'] = floorAndElevator
                .slice(indexToSplitOn + 1)
                .trim();
            } else {
              listing['floor'] = floorAndElevator.split(',')[0].trim();
              listing['elevator'] = floorAndElevator.split(',')[1].trim();
            }
          } else {
            if (floorAndElevator.length === 1) {
              listing['floor'] = floorAndElevator.trim();
              listing['elevator'] = '';
            } else {
              listing['floor'] = '';
              listing['elevator'] = '';
            }
          }
        } else {
          listing['floor'] = '';
          listing['elevator'] = '';
        }

        console.log(
          'Listing floor: ',
          listing['floor'],
          'elevator: ',
          listing['elevator'],
        );
        console.log('\n');

        const balconyElement = await page.evaluate(() => {
          const floorElements = Array.from(
            document.querySelectorAll(
              '.qa-balcony-attribute > .property-attributes-table__value',
            ),
          );
          return floorElements.map((element) =>
            element.innerHTML.replace('\n', '').trim(),
          );
        });

        if (balconyElement.length > 0) {
          listing['balcony'] = balconyElement.pop();
        } else {
          listing['balcony'] = '';
        }

        const patioElement = await page.evaluate(() => {
          const patioElement = Array.from(
            document.querySelectorAll(
              '.qa-patio-attribute > .property-attributes-table__value',
            ),
          );
          return patioElement.map((element) =>
            element.innerHTML.replace('\n', '').trim(),
          );
        });

        if (patioElement.length > 0) {
          listing['patio'] = patioElement.pop();
        } else {
          listing['patio'] = '';
        }

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

        const dateInWords: DateInWords = {
          day: dateComponents[0] as Day,
          month: dateComponents[1] as Month,
          year: dateComponents[2] as Year,
        };

        const dateInDigits = this.convertDate(dateInWords);
        listing['datePublished'] = dateInDigits;

        updatedListings.push(listing);
      } catch (error) {
        console.error(
          `Failed to fetch date for listing ${listing.url}: ${error} \n floor: ${listing.floor}\n balcony: ${listing.balcony} \n elevator: ${listing.elevator} \n datePublished: ${listing.datePublished}`,
        );
      } finally {
        await browser.close();
      }
    }
    return updatedListings;
  }

  public convertDate(date: DateInWords): string {
    const monthMap = {
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

    if (date.day.length === 1) {
      return '0' + date.day + '-' + monthMap[date.month] + '-' + date.year;
    }
    return date.day + '-' + monthMap[date.month] + '-' + date.year;
  }

  private scrapeAttributes($: cheerio.CheerioAPI, location: string) {
    const listings = [];

    $('li.normal-results__hit').each((_i, element) => {
      if (element.attribs.class.includes('recommendation')) {
        return;
      }

      const listing = {};

      const url = $(element).find('.js-listing-card-link');

      if (url.attr('class').includes('deactivated')) {
        return;
      }

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
        const fullAddress = address.text().trim();
        if (fullAddress.includes(',')) {
          const streetAddress = fullAddress.split(',')[0];
          listing['address'] = streetAddress;
        } else {
          listing['address'] = fullAddress;
        }
      }

      const attributesRow = $(element).find(
        'div.listing-card__attribute--primary',
      );
      if (attributesRow) {
        const infoString = attributesRow.text().trim().split('\n');
        const info = infoString.filter(function (entry) {
          return entry.trim() != '';
        });

        if (info.length === 4) {
          info.splice(2, 1);
        }
        if (info.length === 3) {
          listing['price'] = parseInt(
            info[0].replace('kr', '').replace(/\s/g, '').trim(),
          );
          listing['sqmSize'] = info[1].replace('m²', '').trim();
          listing['roomCount'] = info[2].replace('rum', '').trim();
        }
      }

      const fee = $(element).find('div.listing-card__attribute--fee');

      if (fee.text() !== '') {
        listing['monthlyFee'] = parseInt(
          fee.text().replace('kr/mån', '').replace(/\s/g, '').trim(),
        );
      } else {
        listing['monthlyFee'] = '';
      }

      const price = $(element).find(
        'div.listing-card__attribute--square-meter-price',
      );
      if (price.text() !== '') {
        listing['sqmPrice'] = parseInt(
          price.text().replace('kr/m²', '').replace(/\s/g, '').trim(),
        );
      } else {
        listing['sqmPrice'] = '';
      }

      listing['locationId'] = parseInt(location);
      listings.push(listing);
    });

    return listings;
  }

  async scrollToBottom(page: Page): Promise<void> {
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
        }, 40);
      });
    });
  }
}
