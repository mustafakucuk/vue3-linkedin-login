import { ref, watchEffect, onUnmounted } from "vue";
import { LINKEDIN_OAUTH2_STATE } from "./utils";

const getPopupPositionProperties = ({ width = 600, height = 600 }) => {
  const left = screen.width / 2 - width / 2;
  const top = screen.height / 2 - height / 2;
  return `left=${left},top=${top},width=${width},height=${height}`;
};

const generateRandomString = (length = 20) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export function useLinkedIn({
  redirectUri,
  clientId,
  clientSecret,
  onSuccess,
  onError,
  scope = "r_emailaddress",
  state = "",
  closePopupMessage = "User closed the popup",
  useProxy = false,
  proxyUrl = "https://cors-anywhere.herokuapp.com/",
  exchangeCodeForTokenMethod = "POST",
}) {
  const popupRef = ref(null);
  const popUpIntervalRef = ref(null);

  const receiveMessage = (event) => {
    const savedState = localStorage.getItem(LINKEDIN_OAUTH2_STATE);

    if (event.origin === window.location.origin) {
      if (event.data.errorMessage && event.data.from === "Linked In") {
        // Prevent CSRF attack by testing state
        if (event.data.state !== savedState) {
          popupRef.value && popupRef.value.close();
          return;
        }
        onError && onError(event.data);
        popupRef.value && popupRef.value.close();
        popupRef.value = null;
        popUpIntervalRef.value && window.clearInterval(popUpIntervalRef.value);
      } else if (event.data.code && event.data.from === "Linked In") {
        // Prevent CSRF attack by testing state
        if (event.data.state !== savedState) {
          console.error("State does not match");
          popupRef.value && popupRef.value.close();
          return;
        }
        onSuccess && onSuccess(event.data.code);
        popupRef.value && popupRef.value.close();
        popupRef.value = null;
        popUpIntervalRef.value && window.clearInterval(popUpIntervalRef.value);
      }
    }
  };

  watchEffect(() => {
    window.addEventListener("message", receiveMessage, false);

    return () => {
      window.removeEventListener("message", receiveMessage, false);
    };
  });

  const getUrl = () => {
    const generatedState = state || generateRandomString();
    localStorage.setItem(LINKEDIN_OAUTH2_STATE, generatedState);

    const url = "https://www.linkedin.com/oauth/v2/authorization";

    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state: generatedState,
    });

    return `${url}?${params.toString()}`;
  };

  const buildUrl = (url, params) => {
    params = new URLSearchParams({
      ...params,
    });

    url = `${url}?${params.toString()}`;

    url = encodeURIComponent(url);

    if (useProxy) {
      url = `${proxyUrl}${url}`;
    }

    return url;
  };

  const linkedInLogin = () => {
    popupRef.value?.close();

    popupRef.value = window.open(
      getUrl(),
      "_blank",
      getPopupPositionProperties({ width: 600, height: 600 })
    );

    if (popUpIntervalRef.value) {
      window.clearInterval(popUpIntervalRef.value);

      popUpIntervalRef.value = null;
    }

    popUpIntervalRef.value = window.setInterval(() => {
      try {
        if (popupRef.value && popupRef.value.closed) {
          window.clearInterval(popUpIntervalRef.value);
          popUpIntervalRef.value = null;

          if (onError) {
            onError({
              error: "user_closed_popup",
              errorMessage: closePopupMessage,
            });
          }
        }
      } catch (error) {
        window.clearInterval(popUpIntervalRef.value);
        popUpIntervalRef.value = null;
      }
    }, 1000);
  };

  const exchangeCodeForToken = async (code) => {
    if (!clientSecret) throw new Error("clientSecret is required");
    if (!code) throw new Error("code is required");

    const url = buildUrl("https://www.linkedin.com/oauth/v2/accessToken", {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(url, {
      method: exchangeCodeForTokenMethod,
    });

    const data = await response.json();

    return data;
  };

  const getAccount = async (accessToken = "") => {
    if (!accessToken) {
      const exchangeCodeForToken = await exchangeCodeForToken(code);

      if (exchangeCodeForToken.error) {
        return exchangeCodeForToken;
      }

      accessToken = exchangeCodeForToken.access_token;
    }

    const url = buildUrl("https://api.linkedin.com/v2/me", {
      projection: "(id,localizedFirstName,localizedLastName,email)",
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    return data;
  };

  const getMail = async (accessToken = "") => {
    if (!accessToken) {
      const exchangeCodeForToken = await exchangeCodeForToken(code);

      if (exchangeCodeForToken.error) {
        return exchangeCodeForToken;
      }

      accessToken = exchangeCodeForToken.access_token;
    }

    const url = buildUrl("https://api.linkedin.com/v2/emailAddress", {
      q: "members",
      projection: "(elements*(handle~))",
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    return data;
  };

  return {
    linkedInLogin,
    exchangeCodeForToken,
    getAccount,
    getMail,
  };
}
