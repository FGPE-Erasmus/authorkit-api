import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    NotAcceptableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from './../config';
import { User, UsersService } from './../user';
import { I18nService } from 'nestjs-i18n';
import { LoginPayload } from './payloads/login.payload';
import { ForgotPasswordPayload } from './payloads/forgot-password.payload';
import { ResetPasswordPayload } from './payloads/reset-password.payload';
import { generateToken } from './../../common/utils/token.util';
import { MailService } from '../../modules/mail/mail.service';

const RESET_PASSWORD_MIN_INTERVAL = 60 * 60 * 1000; // one hour between consecutive resets
const RESET_PASSWORD_TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours for reset token validity

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly userService: UsersService,
        private readonly i18n: I18nService,
        private readonly mailService: MailService,
    ) { }

    async sendActivationEmail(user: User): Promise<boolean> {
        if (!user || !user.email) {
            throw new InternalServerErrorException(
                this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.INTERNAL_SERVER_ERROR.SEND_ACTIVATION_EMAIL_UNDEFINED_USER_EMAIL'));
        }

        const sent = await this.mailService.sendEmail(
            'email-verification',
            user.email,
            {
                firstname: user.firstname,
                lastname: user.lastname,
                token: user.activationToken,
                // locale: 'en-gb',
            },
        );

        if (!sent) {
            throw new InternalServerErrorException(
                this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.INTERNAL_SERVER_ERROR.SEND_ACTIVATION_EMAIL_FAILED'));
        }

        return sent;
    }

    async activateUser(activationToken: string): Promise<User> {
        const user = await this.userService.getByActivationToken(activationToken);

        if (!user) {
            throw new BadRequestException(this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.BAD_REQUEST.ACTIVATE_TOKEN_NOT_FOUND'));
        }

        user.activated = true;
        user.activationToken = null;

        return this.userService.update(user._id, user);
    }

    async authenticateUser(payload: LoginPayload): Promise<User> {
        const user = await this.userService.getByUsernameOrEmail(payload.username, payload.email);

        if (!user) {
            throw new UnauthorizedException(this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.NOT_FOUND.USER_NOT_FOUND_USERNAME_OR_EMAIL'));
        }

        if (user.password !== payload.password) {
            throw new UnauthorizedException(this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.UNAUTHORIZED.INVALID_CREDENTIALS'));
        }

        return user;
    }

    async createToken(user: User): Promise<object> {
        const expiresIn = Number(this.configService.get('JWT_EXPIRATION_TIME'));
        return {
            expiresIn,
            accessToken: this.jwtService.sign({
                id: user._id,
                roles: user.roles,
                username: user.username,
                email: user.email,
            }, { expiresIn }),
        };
    }

    async requestPasswordReset(payload: ForgotPasswordPayload): Promise<User> {
        const user = await this.userService.getByUsernameOrEmail(payload.username, payload.email);

        if (!user) {
            throw new NotFoundException(this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.NOT_FOUND.USER_NOT_FOUND_USERNAME_OR_EMAIL'));
        }

        if ((new Date().getTime() - user.resetTokenDate.getTime()) < RESET_PASSWORD_MIN_INTERVAL) {
            throw new BadRequestException('EXCEPTIONS.MESSAGES.BAD_REQUEST.RESET_PASSWORD_TOO_CLOSE');
        }

        const token = await generateToken();
        const timestamp = new Date();

        user.resetToken = token;
        user.resetTokenDate = timestamp;

        return this.userService.update(user._id, user);
    }

    async resetPassword(payload: ResetPasswordPayload): Promise<User> {
        const user = await this.userService.getByResetToken(payload.resetToken);

        if (!user) {
            throw new BadRequestException(this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.BAD_REQUEST.RESET_PASSWORD_TOKEN_NOT_FOUND'));
        }

        if (!user.resetTokenDate || (new Date().getTime() - user.resetTokenDate.getTime()) > RESET_PASSWORD_TOKEN_TTL) {
            throw new NotAcceptableException(this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.BAD_REQUEST.RESET_PASSWORD_EXPIRED_TOKEN'));
        }

        user.password = payload.password;
        user.resetToken = null;
        user.resetTokenDate = null;

        return this.userService.update(user._id, user);
    }

    async sendResetPasswordEmail(user: User): Promise<boolean> {
        if (!user || !user.email) {
            throw new InternalServerErrorException(
                this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.INTERNAL_SERVER_ERROR.SEND_RESET_PASSWORD_EMAIL_UNDEFINED_USER_EMAIL'));
        }

        const sent = await this.mailService.sendEmail(
            'reset-password',
            user.email,
            {
                firstname: user.firstname,
                lastname: user.lastname,
                token: user.resetToken,
                // locale: 'en-gb',
            },
        );

        if (!sent) {
            throw new InternalServerErrorException(
                this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.INTERNAL_SERVER_ERROR.SEND_RESET_PASSWORD_EMAIL_FAILED'));
        }

        return sent;
    }

    async sendWelcomeEmail(user: User): Promise<boolean> {
        if (!user || !user.email) {
            throw new InternalServerErrorException(
                this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.INTERNAL_SERVER_ERROR.SEND_RESET_PASSWORD_EMAIL_UNDEFINED_USER_EMAIL'));
        }

        const sent = await this.mailService.sendEmail(
            'welcome',
            user.email,
            {
                firstname: user.firstname,
                lastname: user.lastname,
                token: user.resetToken,
                // locale: 'en-gb',
            },
        );

        if (!sent) {
            throw new InternalServerErrorException(
                this.i18n.translate('en-gb', 'EXCEPTIONS.MESSAGES.INTERNAL_SERVER_ERROR.SEND_RESET_PASSWORD_EMAIL_FAILED'));
        }

        return sent;
    }
}
