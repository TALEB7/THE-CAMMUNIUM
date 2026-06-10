import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { AuctionsModule } from '../auctions/auctions.module';
import { ComparisonsModule } from '../comparisons/comparisons.module';

@Module({
  imports: [CategoriesModule, MarketplaceModule, AuctionsModule, ComparisonsModule],
  exports: [CategoriesModule, MarketplaceModule, AuctionsModule, ComparisonsModule],
})
export class CommerceModule {}
