import { Injectable } from '@nestjs/common';
import { ConfigService } from './../config';

@Injectable()
export class AppService {
  constructor(private config: ConfigService) {}

  root(): string {
    return 'Welcome to FGPE AuthorKit API @ ' + this.config.get('APP_URL');
  }
}
