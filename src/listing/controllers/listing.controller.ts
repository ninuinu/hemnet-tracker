import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListingService } from '../services/listing.service';

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

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

  @Get()
  getAll(@Query('page') page: number, @Query('limit') limit: number) {
    // TODO add DTO for transformation
    page = Number(page);
    limit = Number(limit);

    return this.listingService.getAll(page, limit);
  }

  @Get('populate')
  populateUniqueListings() {
    return this.listingService.populateUniqueListings();
  }

  @Get('matches')
  getMatches(@Query('id') id: string) {
    console.log('Getting matches for id:', id);
    return this.listingService.getMatches(+id);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.listingService.getOne(+id);
  }
}
