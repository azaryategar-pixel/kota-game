// =========================================================
// KOTA LOBBY
// =========================================================

async function loadLobby() {

  // -----------------------------------------
  // CHECK SESSION
  // -----------------------------------------

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();


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


  // -----------------------------------------
  // LOAD PROFILE
  // -----------------------------------------

  const {
    data: profile,
    error
  } = await supabaseClient
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .single();


  if (error) {

    console.error(
      "Profile error:",
      error
    );

    return;
  }


  // -----------------------------------------
  // DISPLAY USERNAME
  // -----------------------------------------

  const username =
    profile.username;


  const usernameElement =
    document.getElementById("username");


  const profileUsername =
    document.getElementById("profileUsername");


  const profileEmail =
    document.getElementById("profileEmail");


  if (usernameElement) {

    usernameElement.textContent =
      username;
  }


  if (profileUsername) {

    profileUsername.textContent =
      username;
  }


  if (profileEmail) {

    profileEmail.textContent =
      user.email || "-";
  }

}


// =========================================================
// LOGOUT
// =========================================================

const logoutButton =
  document.getElementById("logoutButton");


if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async function () {

      logoutButton.disabled = true;

      logoutButton.textContent =
        "Logging out...";


      const {
        error
      } = await supabaseClient.auth.signOut();


      if (error) {

        console.error(
          "Logout error:",
          error
        );

        logoutButton.disabled = false;

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
  document.getElementById("createRoomCard");


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
  document.getElementById("joinRoomCard");


if (joinRoomCard) {

  joinRoomCard.addEventListener(
    "click",
    function () {

      alert(
        "Join Room akan kita buat pada tahap berikutnya."
      );

    }
  );

}


// =========================================================
// INITIALIZE
// =========================================================

loadLobby();
