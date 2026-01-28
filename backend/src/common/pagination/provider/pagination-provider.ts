import { Inject, Injectable } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { paginationQueryDto } from '../paginationQueryDto';
import { PaginatedInterface } from '../paginatedInterfaces';

@Injectable()
export class PaginationProvider {
  constructor(
    @Inject(REQUEST)
    private readonly request: Request,
  ) {}
  public async qpaginatedQuer<T extends ObjectLiteral>(
    paginatedQueryDto: paginationQueryDto,
    repository: Repository<T>,
  ): Promise<PaginatedInterface<T>> {
    const result = await repository.find({
      skip: (paginatedQueryDto.page - 1) * paginatedQueryDto.limit,
      take: paginatedQueryDto.limit,
    });

    // create a request url
    const baseUrl =
      this.request.protocol + '://' + this.request.headers.host + '/';
    const newUrl = new URL(this.request.url, baseUrl);
    console.log(newUrl);

    /**
     * calculating page number
     */
    const totalItems = await repository.count();
    const totalPages = Math.ceil(totalItems / paginatedQueryDto.limit);
    const nextPage =
      paginatedQueryDto.page === totalPages
        ? paginatedQueryDto.page
        : paginatedQueryDto.page + 1;
    const prevPage =
      paginatedQueryDto.page === 1
        ? paginatedQueryDto.page
        : paginatedQueryDto.page - 1;

    const finalResponse: PaginatedInterface<T> = {
      data: result,
      meta: {
        itemsPerPage: paginatedQueryDto.limit,
        totalItems: totalItems,
        currentPage: paginatedQueryDto.page,
        totalPages: totalPages,
      },
      links: {
        first: `${newUrl.origin}&${newUrl.pathname}?limit=${paginatedQueryDto.limit}&page=1`,
        last: `${newUrl.origin}&${newUrl.pathname}?limit=${paginatedQueryDto.limit}&page=${totalPages}`,
        current: `${newUrl.origin}&${newUrl.pathname}?limit=${paginatedQueryDto.limit}&page=${paginatedQueryDto.page}`,
        previous: `${newUrl.origin}&${newUrl.pathname}?limit=${paginatedQueryDto.limit}&page=${prevPage}`,
        next: `${newUrl.origin}&${newUrl.pathname}?limit=${paginatedQueryDto.limit}&page=${nextPage}`,
      },
    };

    return finalResponse;
  }
}
