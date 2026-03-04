import { Controller, Get, Post, Delete, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComparisonsService } from './comparisons.service';

@ApiTags('comparisons')
@Controller('comparisons')
export class ComparisonsController {
  constructor(private readonly service: ComparisonsService) {}

  @Post()
  createList(@Body() body: { userId: string; name: string }) {
    return this.service.createList(body.userId, body.name);
  }

  @Get('user/:userId')
  getUserLists(@Param('userId') userId: string) {
    return this.service.getUserLists(userId);
  }

  @Get(':id')
  getList(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.getList(id, userId);
  }

  @Post(':id/items')
  addItem(
    @Param('id') listId: string,
    @Body() body: { userId: string; listingId: string },
  ) {
    return this.service.addItem(listId, body.userId, body.listingId);
  }

  @Delete(':id/items/:itemId')
  removeItem(
    @Param('id') listId: string,
    @Param('itemId') itemId: string,
    @Body('userId') userId: string,
  ) {
    return this.service.removeItem(listId, userId, itemId);
  }

  @Patch(':id/rename')
  renameList(@Param('id') id: string, @Body() body: { userId: string; name: string }) {
    return this.service.renameList(id, body.userId, body.name);
  }

  @Delete(':id')
  deleteList(@Param('id') id: string, @Body('userId') userId: string) {
    return this.service.deleteList(id, userId);
  }
}
