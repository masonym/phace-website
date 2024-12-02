import {
    SignUpCommand,
    InitiateAuthCommand,
    ConfirmSignUpCommand,
    ForgotPasswordCommand,
    ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { cognitoClient, COGNITO_CONFIG } from "../aws-config";

export class AuthService {
    static async signUp(email: string, password: string, name: string) {
        const command = new SignUpCommand({
            ClientId: COGNITO_CONFIG.ClientId,
            Username: email,
            Password: password,
            UserAttributes: [
                {
                    Name: "name",
                    Value: name,
                },
                {
                    Name: "email",
                    Value: email,
                },
            ],
        });

        return await cognitoClient.send(command);
    }

    static async signIn(email: string, password: string) {
        const command = new InitiateAuthCommand({
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: COGNITO_CONFIG.ClientId,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password,
            },
        });

        return await cognitoClient.send(command);
    }

    static async confirmSignUp(email: string, code: string) {
        const command = new ConfirmSignUpCommand({
            ClientId: COGNITO_CONFIG.ClientId,
            Username: email,
            ConfirmationCode: code,
        });

        return await cognitoClient.send(command);
    }

    static async forgotPassword(email: string) {
        const command = new ForgotPasswordCommand({
            ClientId: COGNITO_CONFIG.ClientId,
            Username: email,
        });

        return await cognitoClient.send(command);
    }

    static async confirmForgotPassword(
        email: string,
        code: string,
        newPassword: string
    ) {
        const command = new ConfirmForgotPasswordCommand({
            ClientId: COGNITO_CONFIG.ClientId,
            Username: email,
            ConfirmationCode: code,
            Password: newPassword,
        });

        return await cognitoClient.send(command);
    }
}
