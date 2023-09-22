import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ListingService } from '../services/listing.service';

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  /**
   * Scrape Hemnet for apartment listings and store them in the database
   * @param location_ids: a location id corresponding to a location, as defined by Hemnet
   */
  @Get('scrape')
  scrape(@Query('location_ids') location: string) {
    return this.listingService.scrape(location);
  }

  @Get('unique')
  getAllUnique(@Query('page') page: number, @Query('limit') limit: number) {
    // TODO add DTO for transformation
    page = Number(page);
    limit = Number(limit);

    return this.listingService.getAllUnique(page, limit);
  }

  /**
   * Get all listings from the database
   */
  @Get()
  getAll(@Query('page') page: number, @Query('limit') limit: number) {
    // TODO add DTO for transformation
    page = Number(page);
    limit = Number(limit);

    return this.listingService.getAll(page, limit);
  }

  /**
   * Populate the most recent listing occurance table with unique listings
   */
  @Post('populate')
  populateUniqueListings() {
    return this.listingService.populateUniqueListings();
  }

  @Get('matches')
  getMatches(@Query('id') id: string) {
    console.log('Getting matches for id:', id);
    return this.listingService.getMatches(+id);
  }

  /**
   * Get one listing, given its unique id in the database
   * @param id: id of the listing as defined by the database
   */
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.listingService.getOne(+id);
  }
}
