/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LogLevel } from "@azure/msal-browser";
export const DOMAIN =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://events.gbsl.website";
export const API =
  process.env.NODE_ENV === "development"
    ? "http://localhost:3002"
    : "https://event-api.gbsl.website";
const CLIENT_ID =
  process.env.NODE_ENV === "development"
    ? "d47ad32d-d977-4fdb-8b00-86f780e10c46"
    : "d47ad32d-d977-4fdb-8b00-86f780e10c46";

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */
export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority:
      "https://login.microsoftonline.com/49068363-8361-4607-9549-62b6b55794aa",
    redirectUri: DOMAIN,
  },
  cache: {
    cacheLocation: "localStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            if (process.env.NODE_ENV !== 'debug') {
              return
            }
            console.info(message);
            return;
          case LogLevel.Verbose:
            if (process.env.NODE_ENV !== 'debug') {
              return
            }
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

// Add here the endpoints and scopes for the web API you would like to use.
export const apiConfig = {
  uri: `${API}/api`,
  scopes: [`${API}/api/access_as_user`],
};
/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: ["User.Read", "openid", "profile"],
};

/**
 * Scopes you add here will be used to request a token from Azure AD to be used for accessing a protected resource.
 * To learn more about how to work with scopes and resources, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const tokenRequest = {
  scopes: [...apiConfig.scopes],
};
