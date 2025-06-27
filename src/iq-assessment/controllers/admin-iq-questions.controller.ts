import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from "@nestjs/swagger"
import { AdminIqQuestionsService } from "../providers/admin-iq-questions.service"
import { CreateIqQuestionDto } from "../dto/create-iq-question.dto"
import { AdminQuestionsQueryDto } from "../dto/admin-questions-query.dto"
import { AdminQuestionResponseDto, PaginatedQuestionsResponseDto } from "../dto/admin-question-response.dto"
import { RoleDecorator } from "../../auth/decorators/role-decorator"
import { Role } from "../../auth/enum/roles.enum"
import { Auth } from "../../auth/decorators/auth.decorator"
import { authType } from "src/auth/enum/auth-type.enum"

@ApiTags("Admin - IQ Questions")
@Controller("admin/iq-questions")
@ApiBearerAuth()
@Auth(authType.Bearer)
@RoleDecorator(Role.Admin)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class AdminIqQuestionsController {
  constructor(private readonly adminIqQuestionsService: AdminIqQuestionsService) {}

  @Get()
  @ApiOperation({ summary: "Get paginated list of IQ questions (Admin only)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Questions retrieved successfully",
    type: PaginatedQuestionsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized - Invalid or missing authentication token",
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Forbidden - Admin role required",
  })
  async findAll(query: AdminQuestionsQueryDto): Promise<PaginatedQuestionsResponseDto> {
    return this.adminIqQuestionsService.findAll(query)
  }

  @Get("stats")
  @ApiOperation({ summary: "Get question statistics (Admin only)" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Question statistics retrieved successfully",
  })
  async getStats() {
    return this.adminIqQuestionsService.getQuestionStats()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific IQ question by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Question retrieved successfully',
    type: AdminQuestionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Question not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AdminQuestionResponseDto> {
    return this.adminIqQuestionsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new IQ question (Admin only)' })
  @ApiBody({ type: CreateIqQuestionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Question created successfully',
    type: AdminQuestionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or duplicate question',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async create(@Body() createQuestionDto: CreateIqQuestionDto): Promise<AdminQuestionResponseDto> {
    return this.adminIqQuestionsService.create(createQuestionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an IQ question (Admin only)' })
  @ApiParam({ name: 'id', description: 'Question UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Question deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Question not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete question used in active sessions',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - Admin role required',
  })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.adminIqQuestionsService.delete(id);
  }
}
