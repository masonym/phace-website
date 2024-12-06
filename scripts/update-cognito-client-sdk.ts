require('dotenv').config({ path: '.env.local' });
const { CognitoIdentityProviderClient, UpdateUserPoolClientCommand } = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient({ region: "us-west-2" });

async function updateCognitoClient() {
  const command = new UpdateUserPoolClientCommand({
    UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    ExplicitAuthFlows: [
      "ALLOW_USER_PASSWORD_AUTH",
      "ALLOW_REFRESH_TOKEN_AUTH"
    ],
    PreventUserExistenceErrors: "ENABLED",
    AccessTokenValidity: 1,
    IdTokenValidity: 1,
    RefreshTokenValidity: 30,
    TokenValidityUnits: {
      AccessToken: "days",
      IdToken: "days",
      RefreshToken: "days"
    }
  });

  try {
    const response = await client.send(command);
    console.log("Successfully updated Cognito User Pool Client:", response);
  } catch (error) {
    console.error("Error updating Cognito User Pool Client:", error);
    throw error;
  }
}

updateCognitoClient();
