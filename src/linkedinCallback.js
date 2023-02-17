import { LINKEDIN_OAUTH2_STATE, parse } from "./utils";

export function LinkedInCallback() {
  const params = parse(window.location.search);

  if (
    params.state &&
    params.state !== localStorage.getItem(LINKEDIN_OAUTH2_STATE)
  ) {
    console.error("State does not match");
  } else if (params.error) {
    const errorMessage =
      params.error_description || "Login failed. Please try again.";
    window.opener &&
      window.opener.postMessage(
        {
          error: params.error,
          state: params.state,
          errorMessage,
          from: "Linked In",
        },
        window.location.origin
      );
    // Close tab if user cancelled login
    if (params.error === "user_cancelled_login") {
      window.close();
    }
  }
  if (params.code) {
    window.opener &&
      window.opener.postMessage(
        { code: params.code, state: params.state, from: "Linked In" },
        window.location.origin
      );
  }
}
