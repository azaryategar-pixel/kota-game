// =========================================================
// KOTA LOBBY
// =========================================================


// =========================================================
// LOAD LOBBY
// =========================================================

async function loadLobby() {

  // -----------------------------------------
  // CHECK SESSION
  // -----------------------------------------

  const {
    data: {
      session
    },
    error: sessionError
  } =
    await supabaseClient
      .auth
      .getSession();


  // -----------------------------------------
  // SESSION ERROR
  // -----------------------------------------

  if (sessionError) {

    console.error(
      "Session error:",
      sessionError
    );

    return;

  }


  // -----------------------------------------
  // NOT LOGGED IN
  // -----------------------------------------

  if (!session) {

    window.location.href =
      "login.html";

    return;

  }


  const user =
    session.user;


  // =========================================================
  // DOM ELEMENTS
  // =========================================================

  const usernameElement =
    document.getElementById(
      "username"
    );


  const profileUsername =
    document.getElementById(
      "profileUsername"
    );


  const profileEmail =
    document.getElementById(
      "profileEmail"
    );


  // =========================================================
  // DISPLAY EMAIL IMMEDIATELY
  // =========================================================

  if (profileEmail) {

    profileEmail.textContent =
      user.email || "-";

  }


  // =========================================================
  // LOAD PROFILE
  // =========================================================

  const {
    data: profile,
    error: profileError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "username, display_name"
      )
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


  // =========================================================
  // DETERMINE USERNAME
  // =========================================================

  let username = null;


  // -----------------------------------------
  // PROFILE USERNAME
  // -----------------------------------------

  if (
    profile &&
    profile.username
  ) {

    username =
      profile.username;

  }


  // -----------------------------------------
  // PROFILE DISPLAY NAME
  // -----------------------------------------

  else if (
    profile &&
    profile.display_name
  ) {

    username =
      profile.display_name;

  }


  // -----------------------------------------
  // USER METADATA USERNAME
  // -----------------------------------------

  else if (
    user.user_metadata &&
    user.user_metadata.username
  ) {

    username =
      user.user_metadata.username;

  }


  // -----------------------------------------
  // USER METADATA DISPLAY NAME
  // -----------------------------------------

  else if (
    user.user_metadata &&
    user.user_metadata.display_name
  ) {

    username =
      user.user_metadata.display_name;

  }


  // -----------------------------------------
  // EMAIL FALLBACK
  // -----------------------------------------

  else if (user.email) {

    username =
      user.email.split("@")[0];

  }


  // -----------------------------------------
  // FINAL FALLBACK
  // -----------------------------------------

  else {

    username =
      "Player";

  }


  // =========================================================
  // PROFILE ERROR
  // =========================================================

  if (profileError) {

    console.error(
      "Profile error:",
      profileError
    );

  }


  // =========================================================
  // DISPLAY USERNAME
  // =========================================================

  if (usernameElement) {

    usernameElement.textContent =
      username;

  }


  if (profileUsername) {

    profileUsername.textContent =
      username;

  }

}


// =========================================================
// LOGOUT
// =========================================================

const logoutButton =
  document.getElementById(
    "logoutButton"
  );


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async function () {

      logoutButton.disabled =
        true;


      logoutButton.textContent =
        "Logging out...";


      const {
        error
      } =
        await supabaseClient
          .auth
          .signOut();


      if (error) {

        console.error(
          "Logout error:",
          error
        );


        logoutButton.disabled =
          false;


        logoutButton.textContent =
          "Logout";


        return;

      }


      window.location.href =
        "index.html";

    }
  );

}


// =========================================================
// CREATE ROOM
// =========================================================

const createRoomCard =
  document.getElementById(
    "createRoomCard"
  );


if (createRoomCard) {

  createRoomCard.addEventListener(
    "click",
    function () {

      window.location.href =
        "create-room.html";

    }
  );

}


// =========================================================
// JOIN ROOM
// =========================================================

const joinRoomCard =
  document.getElementById(
    "joinRoomCard"
  );


if (joinRoomCard) {

  joinRoomCard.addEventListener(
    "click",
    function () {

      window.location.href =
        "join-room.html";

    }
  );

}


// =========================================================
// INITIALIZE
// =========================================================

loadLobby();
