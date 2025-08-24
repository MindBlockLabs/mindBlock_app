import { PartialType } from '@nestjs/swagger';
import { CreateIqAssessmentDto } from './create-iq-assessment.dto';

export class UpdateIqAssessmentDto extends PartialType(CreateIqAssessmentDto) {}
