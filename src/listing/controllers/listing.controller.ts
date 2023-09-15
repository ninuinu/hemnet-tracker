import { Controller, Get, Param, Query } from '@nestjs/common';
import { ListingService } from '../services/listing.service';

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Get('scrape')
  scrape(@Query('location_ids') location: string) {
    return this.listingService.scrape(location);
  }

  @Get()
  getAll(@Query('page') page: number, @Query('limit') limit: number) {
    // TODO add DTO for transformation
    page = Number(page);
    limit = Number(limit);

    return this.listingService.getAll(page, limit);
  }

  @Get('matches')
  getMatches(@Query('id') id: string) {
    return this.listingService.getMatches(+id);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.listingService.getOne(+id);
  }
}
