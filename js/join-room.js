// =========================================================
// KOTA - JOIN ROOM
// =========================================================


const joinRoomForm =
  document.getElementById(
    "joinRoomForm"
  );


const roomCodeInput =
  document.getElementById(
    "roomCodeInput"
  );


const joinRoomButton =
  document.getElementById(
    "joinRoomButton"
  );


const messageElement =
  document.getElementById(
    "message"
  );


// =========================================================
// CHECK SESSION
// =========================================================

async function checkJoinSession() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient
      .auth
      .getSession();


  if (!session) {

    window.location.href =
      "login.html";

    return false;

  }


  return true;

}


// =========================================================
// FORM
// =========================================================

if (joinRoomForm) {

  joinRoomForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const loggedIn =
        await checkJoinSession();


      if (!loggedIn) {
        return;
      }


      const roomCode =
        roomCodeInput
          .value
          .trim()
          .toUpperCase();


      if (!roomCode) {

        showMessage(
          "Masukkan kode room terlebih dahulu.",
          "error"
        );

        return;

      }


      joinRoomButton.disabled =
        true;


      joinRoomButton.textContent =
        "JOINING...";


      clearMessage();


      try {

        // =========================================
        // CALL RPC
        // =========================================

        const {
          data,
          error
        } =
          await supabaseClient.rpc(
            "join_game_room",
            {
              p_room_code:
                roomCode
            }
          );


        if (error) {

          console.error(
            "Join room error:",
            error
          );

          showMessage(
            getReadableJoinError(error),
            "error"
          );

          return;

        }


        console.log(
          "Joined room:",
          data
        );


        // =========================================
        // SAVE ROOM
        // =========================================

        sessionStorage.setItem(
          "kota_room_id",
          data.room_id
        );


        sessionStorage.setItem(
          "kota_room_code",
          data.room_code
        );


        sessionStorage.setItem(
          "kota_player_number",
          data.player_number
        );


        // =========================================
        // OPEN ROOM
        // =========================================

        window.location.href =
          "room.html";


      } catch (error) {

        console.error(
          "Unexpected join error:",
          error
        );


        showMessage(
          "Terjadi kesalahan. Silakan coba lagi.",
          "error"
        );


      } finally {

        joinRoomButton.disabled =
          false;

        joinRoomButton.textContent =
          "JOIN ROOM";

      }

    }
  );

}


// =========================================================
// ERROR MESSAGE
// =========================================================

function getReadableJoinError(error) {

  const message =
    error?.message?.toLowerCase() || "";


  if (
    message.includes(
      "room not found"
    )
  ) {

    return "Room tidak ditemukan. Periksa kembali kode room.";

  }


  if (
    message.includes(
      "no longer accepting"
    )
  ) {

    return "Room tersebut sudah tidak menerima pemain.";

  }


  if (
    message.includes(
      "room is full"
    )
  ) {

    return "Room sudah penuh.";

  }


  if (
    message.includes(
      "logged in"
    )
  ) {

    return "Kamu harus login terlebih dahulu.";

  }


  return (
    error?.message ||
    "Gagal bergabung ke room."
  );

}


// =========================================================
// MESSAGE
// =========================================================

function showMessage(
  text,
  type
) {

  messageElement.textContent =
    text;

  messageElement.className =
    "message " + type;

}


function clearMessage() {

  messageElement.textContent =
    "";

  messageElement.className =
    "message";

}
