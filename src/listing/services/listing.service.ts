import { Injectable } from '@nestjs/common';


@Injectable()
export class ListingService {

  scrape(location: string){
    return 'This action scrapes all listings';
  }

  findAll() {
    return `This action returns all listing`;
  }

  findOne(id: number) {
    return `This action returns a #${id} listing`;
  }
}
