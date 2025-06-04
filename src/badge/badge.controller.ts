import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpStatus } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger"
import { BadgeService } from "./badge.service";
import { BadgeResponseDto } from "./dto/badge-response.dto";
import { CreateBadgeDto } from "./dto/create-badge.dto";
import { UpdateBadgeDto } from "./dto/update-badge.dto";

@ApiTags("badges")
@Controller("badges")
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get()
  @ApiOperation({ summary: "Get all badges" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of all badges",
    type: [BadgeResponseDto],
  })
  async findAll(): Promise<BadgeResponseDto[]> {
    return this.badgeService.findAll()
  }

  @Get("active")
  @ApiOperation({ summary: "Get all active badges" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "List of all active badges",
    type: [BadgeResponseDto],
  })
  async findAllActive(): Promise<BadgeResponseDto[]> {
    return this.badgeService.findAllActive()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a badge by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Badge details',
    type: BadgeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Badge not found',
  })
  async findOne(@Param('id') id: number): Promise<BadgeResponseDto> {
    return this.badgeService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new badge (admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Badge created successfully',
    type: BadgeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Badge with same title or rank already exists',
  })
  async create(@Body() createBadgeDto: CreateBadgeDto): Promise<BadgeResponseDto> {
    return this.badgeService.create(createBadgeDto);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update badge info (admin only)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Badge updated successfully",
    type: BadgeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Badge not found",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Badge with same title or rank already exists",
  })
  async update(@Param('id') id: number, @Body() updateBadgeDto: UpdateBadgeDto): Promise<BadgeResponseDto> {
    return this.badgeService.update(id, updateBadgeDto)
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a badge (admin only)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Badge deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Badge not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete badge assigned to leaderboard entries',
  })
 
  async remove(@Param('id') id: number): Promise<void> {
    return this.badgeService.remove(id);
  }

  @Post("auto-assign")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Trigger automatic badge assignment (admin only)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Automatic badge assignment completed",
  })
  async autoAssignBadges(): Promise<{ message: string }> {
    await this.badgeService.autoAssignBadges()
    return { message: "Automatic badge assignment completed successfully" }
  }

  @Post("seed")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Seed default badges (admin only)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Default badges seeded successfully",
  })
  
  async seedDefaultBadges(): Promise<{ message: string }> {
    await this.badgeService.seedDefaultBadges()
    return { message: "Default badges seeded successfully" }
  }
}
