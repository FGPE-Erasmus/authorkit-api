import { readFileSync } from 'fs';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConnectionOptions } from 'typeorm';

const appPackage = readFileSync(`${__dirname}/../../package.json`, {
    encoding: 'utf8'
});
const appData = JSON.parse(appPackage);

interface Config {
    appRootPath: string;
    version: string;
    name: string;
    description: string;
    uuid: string;
    isProduction: boolean;
    salt: string;
    assetsPath: string;
    mail: {
        from: string,
        host: string,
        port: number,
        secure: boolean,
        user: string,
        password: string,

        templatesDir: string
    };
    database: ConnectionOptions;
    auth: {
        domain: string;
        access: {
            secret: string;
            timeout: number;
        };
        refresh: {
            secret: string;
            timeout: number;
        };
        password_reset: {
            secret: string;
            timeout: number;
        };
        verify: {
            secret: string;
            timeout: number;
        }
    };
    social: {
        facebook: {
            app_id: string;
            app_secret: string;
        },
        google: {
            app_id: string;
            app_secret: string;
        },
        twitter: {
            app_id: string;
            app_secret: string;
        },
        github: {
            app_id: string;
            app_secret: string;
        }
    };
    githubApi: {
        baseUrl: string;
        secret: string;
    };
    port: number;
    host: string;
    microservice: {
        transport: Transport,
        options?: {
            host?: string;
            port?: number;
        }
    };
    logger: {
        level: string;
        transports?: any[];
    };
    validator: {
        options: {
            validationError: {
                target?: boolean; // indicates if target should be exposed in ValidationError.
                value: boolean; // indicates if validated value should be exposed in ValidationError.
            };
            whitelist: boolean;
        };
        password: {
            min_length: number;
            enforce_strong: boolean;
        };
    };
}

export const config: Config = {
    appRootPath: `${__dirname}/../app`,
    version: appData.version,
    name: appData.name,
    description: appData.description,
    uuid: process.env.APP_UUID,
    isProduction: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod',
    salt: process.env.APP_SALT,
    assetsPath: `${__dirname}/../assets`,
    database: {
        type: 'mongodb',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,

        // synchronize: true,
        logging: 'all',
        useNewUrlParser: true,
        migrationsRun: true,
        migrations: [
            __dirname + '/../migrations/*{.ts,.js}'
        ],
        entities: [
            __dirname + '/../**/entity/*.entity{.ts,.js}'
        ]
    },
    auth: {
        domain: process.env.AUTH_DOMAIN,
        access: {
            secret: process.env.AUTH_ACCESS_SECRET,
            timeout: parseInt(process.env.AUTH_ACCESS_TIMEOUT, 10)
        },
        refresh: {
            secret: process.env.AUTH_REFRESH_SECRET,
            timeout: parseInt(process.env.AUTH_REFRESH_TIMEOUT, 10)
        },
        password_reset: {
            secret: process.env.AUTH_PASSWORD_RESET_SECRET,
            timeout: parseInt(process.env.AUTH_PASSWORD_RESET_TIMEOUT, 10)
        },
        verify: {
            secret: process.env.AUTH_VERIFY_SECRET,
            timeout: parseInt(process.env.AUTH_VERIFY_TIMEOUT, 10)
        }
    },
    mail: {
        from: process.env.MAIL_FROM,
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT, 10),
        secure: /true/i.test(process.env.MAIL_SECURE),
        user: process.env.MAIL_USER,
        password: process.env.MAIL_PASSWORD,

        templatesDir: `${__dirname}/../assets/mail`
    },
    social: {
        facebook: {
            app_id: process.env.SOCIAL_FACEBOOK_APP_ID,
            app_secret: process.env.SOCIAL_FACEBOOK_APP_SECRET
        },
        google: {
            app_id: process.env.SOCIAL_GOOGLE_APP_ID,
            app_secret: process.env.SOCIAL_GOOGLE_APP_SECRET
        },
        twitter: {
            app_id: process.env.SOCIAL_TWITTER_APP_ID,
            app_secret: process.env.SOCIAL_TWITTER_APP_SECRET
        },
        github: {
            app_id: process.env.SOCIAL_GITHUB_APP_ID,
            app_secret: process.env.SOCIAL_GITHUB_APP_SECRET
        }
    },
    githubApi: {
        baseUrl: 'https://api.github.com',
        secret: process.env.GITHUB_API_SECRET
    },
    port: parseInt(process.env.APP_PORT, 10),
    host: process.env.APP_HOST,
    microservice: {
        transport: Transport.TCP,
        options: {
            host: process.env.APP_HOST,
            port: 3002
        }
    },
    logger: {
        level: process.env.APP_LOGGER_LEVEL
    },
    validator: {
        options: {
            validationError: {
                target: false,
                value: false
            },
            whitelist: false
        },
        password: {
            min_length: parseInt(process.env.VALIDATOR_PASSWORD_MIN_LENGTH || '6', 10),
            enforce_strong: /true/i.test(process.env.VALIDATOR_PASSWORD_ENFORCE_STRONG)
        }
    }
};
