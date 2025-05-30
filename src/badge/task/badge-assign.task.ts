import { Injectable, Logger } from "@nestjs/common"
import { Cron, CronExpression } from "@nestjs/schedule"
import { BadgeService } from "../badge.service"

@Injectable()
export class BadgeAssignmentTask {
  private readonly logger = new Logger(BadgeAssignmentTask.name)

  constructor(private readonly badgeService: BadgeService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleBadgeAssignment() {
    this.logger.log("Running scheduled badge assignment...")

    try {
      await this.badgeService.autoAssignBadges()
      this.logger.log("Scheduled badge assignment completed successfully")
    } catch (error) {
      this.logger.error("Error during scheduled badge assignment:", error)
    }
  }
}
