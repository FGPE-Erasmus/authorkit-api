import { ModuleRef } from '@nestjs/core';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { UserService } from '../../user/user.service';

@ValidatorConstraint({ name: 'unique-email', async: true })
@Injectable()
export class UniqueEmailValidator implements ValidatorConstraintInterface, OnModuleInit {
    private userService: UserService;

    constructor(private readonly moduleRef: ModuleRef) {}

    public async validate(email: string) {
        if (!this.userService) {
            return true;
        }
        const user = await this.userService.findByEmail(email);
        return !user;
    }

    onModuleInit() {
      this.userService = this.moduleRef.get('UserService');
    }
}
