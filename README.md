# Vue3 Login with LinkedIn

This is a Vue3 package that provides a simple way to authenticate users with LinkedIn. It uses the LinkedIn OAuth2 protocol for user authentication and the LinkedIn API to retrieve the user's profile and other information.

## Installation

```
npm install --save vue3-linkedin-login
```

We will trigger `linkedInLogin` by using `useLinkedIn` after click on Sign in with LinkedIn button, a popup window will show up and ask for the permission. After we accepted, the pop up window will redirect to redirectUri (should be LinkedInCallback component) then notice its opener about the authorization code Linked In provides us.

## Usage

```html
<template>
  <button @click="linkedInLogin">test</button>
</template>

<script setup>
  import { onMounted } from "vue";
  import { useLinkedIn, LinkedInCallback } from "./index";

  const { linkedInLogin, exchangeCodeForToken, getAccount, getMail } =
    useLinkedIn({
      clientId: "",
      clientSecret: "",
      redirectUri: "",
      onSuccess: async (code) => {
        const exchangeCode = await exchangeCodeForToken(code);
        const account = await getAccount(exchangeCode.access_token);
        const email = await getMail(exchangeCode.access_token);

        if (!account || !email) {
          return;
        }

        const firstName = account.localizedFirstName;
        const lastName = account.localizedLastName;
        const emailAddress = email.elements[0]["handle~"].emailAddress;

        const user = {
          firstName,
          lastName,
          emailAddress,
        };

        console.log(user);
      },
      scope: "r_emailaddress,r_liteprofile",
      onError: (error) => {
        console.log(error);
      },
    });

  onMounted(() => {
    LinkedInCallback();
  });
</script>
```

## Props

| Parameter    | Value    | Is Required | Default       |
| ------------ | -------- | ----------- | ------------- |
| clientId     | string   | true        | -             |
| clientSecret | string   | true        | -             |
| redirectUri  | string   | true        | -             |
| onSuccess    | function | true        | -             |
| onError      | function | true        | -             |
| scope        | string   | true        | r_liteprofile |
| state        | string   | false       | -             |


> This repo is inspired by the https://github.com/nvh95/react-linkedin-login-oauth2/ repo.
