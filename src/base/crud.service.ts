import { forwardRef, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { validate, ValidatorOptions } from 'class-validator';
import { DeepPartial, FindManyOptions, FindOneOptions, MongoRepository, ObjectLiteral } from 'typeorm';
import { ExtendedEntity, typeormFilterMapper, ValidationPhases } from '../app/_helpers';
import { SecurityService } from '../app/security/security.service';
import { RestVoterActionEnum } from '../app/security/voter';
import { config } from '../config';

export class CrudService<T extends ExtendedEntity> {
    protected repository: MongoRepository<T>;
    @Inject(forwardRef(() => SecurityService)) protected readonly securityService: SecurityService;

    constructor(repository?: MongoRepository<T>) {
        if (repository) {
            this.repository = repository;
        }
    }

    public async findAll(options?: FindManyOptions<T>, internal: boolean = false): Promise<T[]> {
        if (options && options.where) {
            options.where = typeormFilterMapper(options);
        }
        const entities = await this.repository.find(options);
        if (!internal) {
            await this.securityService.denyAccessUnlessGranted(RestVoterActionEnum.READ_ALL, entities);
        }
        return entities;
    }

    public async findOneById(id: string, internal: boolean = false): Promise<T> {
        try {
            const entity = await this.repository.findOneOrFail(id);
            if (!internal) {
                await this.securityService.denyAccessUnlessGranted(RestVoterActionEnum.READ, entity);
            }
            return entity;
        } catch (e) {
            throw new HttpException({
                error: 'Database',
                message: 'Item not found'
            }, HttpStatus.NOT_FOUND);
        }
    }

    public async findOne(options?: FindOneOptions<T>, internal: boolean = false): Promise<T> {
        if (options.where) {
            options.where = typeormFilterMapper(options);
        }
        const entity = await this.repository.findOne(options);
        if (!internal) {
            await this.securityService.denyAccessUnlessGranted(RestVoterActionEnum.READ, entity);
        }
        return entity;
    }

    public async create(data: DeepPartial<T>, internal: boolean = false): Promise<T> {
        const entity: T = this.repository.create(data);
        if (!internal) {
            const decision = await this.securityService.denyAccessUnlessGranted(RestVoterActionEnum.CREATE, entity);
            await this.securityService.removeNonAllowedProperties(entity, decision.attributes);
        }
        await this.validate(entity);
        return entity.save();
    }

    public async saveAll(data: DeepPartial<T>[]): Promise<T[]> {
        return this.repository.save(data);
    }

    public async update(id: string, data: DeepPartial<T> | T, internal: boolean = false): Promise<T> {
        return this.patch(id, data, internal);
    }

    public async updateAll(query, data: any, internal: boolean = false): Promise<boolean> {
        if (query) {
            query = typeormFilterMapper({ where: query });
        }
        const response = await this.repository.updateMany(query, data);
        return !!response.matchedCount;
    }

    public async patch(id: string, data: DeepPartial<T> | T, internal: boolean = false): Promise<T> {
        let entity: T = await this.findOneById(id, true);
        if (!internal) {
            const decision = await this.securityService.denyAccessUnlessGranted(RestVoterActionEnum.UPDATE, entity);
            await this.securityService.removeNonAllowedProperties(data, decision.attributes);
        }
        if (data instanceof ExtendedEntity) {
            entity = data;
        } else {
            if (data.id) {
                delete data.id;
            }
            entity = this.repository.merge(entity, data);
        }
        await this.validate(entity, {
            groups: [ValidationPhases.UPDATE]
        });
        return entity.save();
    }

    public async delete(id: string, internal: boolean = false): Promise<T> {
        const entity: T = await this.findOneById(id, true);
        if (!internal) {
            await this.securityService.denyAccessUnlessGranted(RestVoterActionEnum.DELETE, entity);
        }
        await this.repository.delete(id);
        return entity;
    }

    public deleteAll(conditions?: ObjectLiteral): Promise<any> {
        if (conditions) {
            conditions = typeormFilterMapper({ where: conditions });
        }
        return this.repository.deleteMany(conditions);
    }

    public async softDelete({ id }: DeepPartial<T>, internal: boolean = false): Promise<T> {
        const entity = await this.findOneById(id as any, true);
        if (!internal) {
            await this.securityService.denyAccessUnlessGranted(RestVoterActionEnum.SOFT_DELETE, entity);
        }
        entity.is_deleted = true;
        return entity.save();
    }

    protected async validate(entity: T, options?: ValidatorOptions) {
        const errors = await validate(entity, { ...config.validator.options, ...options } as ValidatorOptions);
        if (errors.length) {
            throw new HttpException({
                message: errors,
                error: 'Validation'
            }, HttpStatus.UNPROCESSABLE_ENTITY);
        }
    }
}
