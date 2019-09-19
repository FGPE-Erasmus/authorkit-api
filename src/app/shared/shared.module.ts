import { Module } from '@nestjs/common';
import { DateScalar } from './scalars';

@Module({
    providers: [DateScalar],
    exports: [DateScalar]
})
export class SharedModule {}
