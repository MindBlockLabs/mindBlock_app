import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from './entities/badge.entity';
import { LeaderboardEntry } from 'src/leaderboard/entities/leaderboard.entity';
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

@Injectable()
export class BadgeService {
  private readonly logger = new Logger(BadgeService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,

    @InjectRepository(LeaderboardEntry)
    private readonly leaderboardRepository: Repository<LeaderboardEntry>,
  ) {}

  async findAll(): Promise<Badge[]> {
    return this.badgeRepository.find({
      order: { rank: "ASC" },
    })
  }

  async findAllActive(): Promise<Badge[]> {
    return this.badgeRepository.find({
      where: { isActive: true },
      order: { rank: "ASC" },
    })
  }

  async findOne(id: number): Promise<Badge> {
    const badge = await this.badgeRepository.findOne({
      where: { id },
      relations: ["leaderboardEntries"],
    })

    if (!badge) {
      throw new NotFoundException(`Badge with ID ${id} not found`)
    }

    return badge
  }

  async create(createBadgeDto: CreateBadgeDto): Promise<Badge> {
    // Check if badge with same title already exists
    const existingBadge = await this.badgeRepository.findOne({
      where: { title: createBadgeDto.title },
    })

    if (existingBadge) {
      throw new ConflictException(`Badge with title "${createBadgeDto.title}" already exists`)
    }

    // Check if badge with same rank already exists
    const existingRank = await this.badgeRepository.findOne({
      where: { rank: createBadgeDto.rank },
    })

    if (existingRank) {
      throw new ConflictException(`Badge with rank ${createBadgeDto.rank} already exists`)
    }

    const badge = this.badgeRepository.create(createBadgeDto)
    return this.badgeRepository.save(badge)
  }

  async update(id: number, updateBadgeDto: UpdateBadgeDto): Promise<Badge> {
    const badge = await this.findOne(id)

    // Check for title conflicts if title is being updated
    if (updateBadgeDto.title && updateBadgeDto.title !== badge.title) {
      const existingBadge = await this.badgeRepository.findOne({
        where: { title: updateBadgeDto.title },
      })

      if (existingBadge) {
        throw new ConflictException(`Badge with title "${updateBadgeDto.title}" already exists`)
      }
    }

    // Check for rank conflicts if rank is being updated
    if (updateBadgeDto.rank && updateBadgeDto.rank !== badge.rank) {
      const existingRank = await this.badgeRepository.findOne({
        where: { rank: updateBadgeDto.rank },
      })

      if (existingRank) {
        throw new ConflictException(`Badge with rank ${updateBadgeDto.rank} already exists`)
      }
    }

    Object.assign(badge, updateBadgeDto)
    return this.badgeRepository.save(badge)
  }

  async remove(id: number): Promise<void> {
    const badge = await this.findOne(id)

    // Check if badge is assigned to any leaderboard entries
    const assignedEntries = await this.leaderboardRepository.count({
      where: { badge: { id } },
    })

    if (assignedEntries > 0) {
      throw new ConflictException(
        `Cannot delete badge "${badge.title}" as it is assigned to ${assignedEntries} leaderboard entries`,
      )
    }

    await this.badgeRepository.remove(badge)
  }

  async getBadgeByRank(rank: number): Promise<Badge | null> {
    return this.badgeRepository.findOne({
      where: { rank, isActive: true },
    })
  }

  async autoAssignBadges(): Promise<void> {
    this.logger.log("Starting automatic badge assignment...")

    try {
      // Get all leaderboard entries ordered by score
      const leaderboardEntries = await this.leaderboardRepository.find({
        order: { score: "DESC" },
        relations: ["player"],
      })

      // Get all auto-assignable badges
      const autoAssignableBadges = await this.badgeRepository.find({
        where: { isAutoAssigned: true, isActive: true },
        order: { rank: "ASC" },
      })

      for (let i = 0; i < leaderboardEntries.length; i++) {
        const entry = leaderboardEntries[i]
        const playerRank = i + 1 // 1-based rank
        const appropriateBadge = this.determineBadgeForRank(playerRank, autoAssignableBadges)

        if (appropriateBadge && (!entry.badge || entry.badge.id !== appropriateBadge.id)) {
          entry.badge = appropriateBadge
          await this.leaderboardRepository.save(entry)
          this.logger.log(`Assigned badge "${appropriateBadge.title}" to player at rank ${playerRank}`)
        }
      }

      this.logger.log("Automatic badge assignment completed")
    } catch (error) {
      this.logger.error("Error during automatic badge assignment:", error)
      throw error
    }
  }

  private determineBadgeForRank(playerRank: number, badges: Badge[]): Badge | null {
    // Badge assignment logic based on rank
    if (playerRank === 1) {
      return badges.find((badge) => badge.title === "Puzzle Master") || null
    } else if (playerRank === 2) {
      return badges.find((badge) => badge.title === "Grand Champion") || null
    } else if (playerRank === 3) {
      return badges.find((badge) => badge.title === "Blockchain Expert") || null
    } else if (playerRank >= 4 && playerRank <= 10) {
      return badges.find((badge) => badge.title === "Algorithm Specialist") || null
    } else if (playerRank > 10) {
      return badges.find((badge) => badge.title === "Rising Star") || null
    }

    return null
  }

  async seedDefaultBadges(): Promise<void> {
    this.logger.log("Seeding default badges...")

    const defaultBadges = [
      {
        title: "Puzzle Master",
        description: "Awarded to the top performer on the leaderboard",
        rank: 1,
        isAutoAssigned: true,
        iconUrl: "/badges/puzzle-master.png",
      },
      {
        title: "Grand Champion",
        description: "Awarded to the second-place performer",
        rank: 2,
        isAutoAssigned: true,
        iconUrl: "/badges/grand-champion.png",
      },
      {
        title: "Blockchain Expert",
        description: "Awarded to the third-place performer",
        rank: 3,
        isAutoAssigned: true,
        iconUrl: "/badges/blockchain-expert.png",
      },
      {
        title: "Algorithm Specialist",
        description: "Awarded to top 10 performers",
        rank: 4,
        isAutoAssigned: true,
        iconUrl: "/badges/algorithm-specialist.png",
      },
      {
        title: "Rising Star",
        description: "Awarded to promising performers",
        rank: 5,
        isAutoAssigned: true,
        iconUrl: "/badges/rising-star.png",
      },
    ]

    for (const badgeData of defaultBadges) {
      const existingBadge = await this.badgeRepository.findOne({
        where: { title: badgeData.title },
      })

      if (!existingBadge) {
        const badge = this.badgeRepository.create(badgeData)
        await this.badgeRepository.save(badge)
        this.logger.log(`Created default badge: ${badgeData.title}`)
      }
    }

    this.logger.log("Default badges seeding completed")
  }
}
