import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ListingService } from '../services/listing.service';

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Get('scrape')
  scrape(@Query('location_ids') location: string){
    return this.listingService.scrape(location);
  }

  @Get()
  getAll() {
    return this.listingService.getAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.listingService.getOne(+id);
  }

}
