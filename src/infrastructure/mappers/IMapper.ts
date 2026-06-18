export interface IMapper<TDto, TDomain> {
  toDomain(dto: TDto): TDomain;
  toDto(domain: TDomain): TDto;
}
