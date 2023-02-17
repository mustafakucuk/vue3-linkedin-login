<template>
  <button @click="linkedInLogin">test</button>
</template>

<script setup>
import { onMounted } from "vue";
import { useLinkedIn, LinkedInCallback } from "./index";

const { linkedInLogin, exchangeCodeForToken, getAccount, getMail } =
  useLinkedIn({
    clientId: process.env.VUE_APP_LINKEDIN_CLIENT_ID,
    clientSecret: process.env.VUE_APP_LINKEDIN_CLIENT_SECRET,
    redirectUri: process.env.VUE_APP_LINKEDIN_REDIRECT_URI,
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
