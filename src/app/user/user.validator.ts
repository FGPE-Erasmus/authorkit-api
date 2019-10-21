import { Injectable, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

import { UserService } from './user.service';
import { ModuleRef } from '@nestjs/core';

@ValidatorConstraint({ name: 'isUserAlreadyExist', async: true })
@Injectable()
export class IsUserAlreadyExist implements ValidatorConstraintInterface, OnModuleInit {
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
