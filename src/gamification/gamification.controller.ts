import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { CreateGamificationDto } from './dto/create-gamification.dto';
import { UpdateGamificationDto } from './dto/update-gamification.dto';

@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

//   @Post()
//   create(@Body() createGamificationDto: CreateGamificationDto) {
//     return this.gamificationService.create(createGamificationDto);
//   }

//   @Get()
//   findAll() {
//     return this.gamificationService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.gamificationService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateGamificationDto: UpdateGamificationDto) {
//     return this.gamificationService.update(+id, updateGamificationDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.gamificationService.remove(+id);
//   }
}
