// =========================================================
// KOTA - CREATE ROOM
// =========================================================


const createRoomForm =
  document.getElementById("createRoomForm");

const createRoomButton =
  document.getElementById("createRoomButton");

const createRoomMessage =
  document.getElementById("message");


// =========================================================
// CHECK SESSION
// =========================================================

async function checkCreateRoomSession() {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();


  if (!session) {

    window.location.href =
      "login.html";

    return false;
  }


  return true;
}


// =========================================================
// CREATE ROOM
// =========================================================

if (createRoomForm) {

  createRoomForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const selectedPlayers =
        document.querySelector(
          'input[name="maxPlayers"]:checked'
        );


      if (!selectedPlayers) {

        showCreateRoomMessage(
          "Pilih jumlah pemain terlebih dahulu.",
          "error"
        );

        return;
      }


      const maxPlayers =
        Number(selectedPlayers.value);


      createRoomButton.disabled = true;

      createRoomButton.textContent =
        "CREATING ROOM...";

      clearCreateRoomMessage();


      try {

        // -----------------------------------------
        // CHECK LOGIN
        // -----------------------------------------

        const loggedIn =
          await checkCreateRoomSession();


        if (!loggedIn) {
          return;
        }


        // -----------------------------------------
        // CALL RPC
        // -----------------------------------------

        const {
          data,
          error
        } = await supabaseClient.rpc(
          "create_game_room",
          {
            p_max_players: maxPlayers
          }
        );


        // -----------------------------------------
        // ERROR
        // -----------------------------------------

        if (error) {

          console.error(
            "Create room error:",
            error
          );

          showCreateRoomMessage(
            getReadableRoomError(error),
            "error"
          );

          return;
        }


        // -----------------------------------------
        // SUCCESS
        // -----------------------------------------

        console.log(
          "Room created:",
          data
        );


        // RPC returns the newly created
        // game_rooms row.

        const roomId =
          data.id;

        const roomCode =
          data.room_code;


        // -----------------------------------------
        // STORE ROOM INFO
        // -----------------------------------------

        sessionStorage.setItem(
          "kota_room_id",
          roomId
        );

        sessionStorage.setItem(
          "kota_room_code",
          roomCode
        );


        // -----------------------------------------
        // GO TO ROOM
        // -----------------------------------------

        window.location.href =
          "room.html";


      } catch (error) {

        console.error(
          "Unexpected create room error:",
          error
        );

        showCreateRoomMessage(
          "Terjadi kesalahan. Silakan coba lagi.",
          "error"
        );


      } finally {

        createRoomButton.disabled = false;

        createRoomButton.textContent =
          "CREATE ROOM";

      }

    }
  );

}


// =========================================================
// MESSAGE
// =========================================================

function showCreateRoomMessage(
  text,
  type
) {

  if (!createRoomMessage) {
    return;
  }


  createRoomMessage.textContent =
    text;

  createRoomMessage.className =
    "message " + type;

}


function clearCreateRoomMessage() {

  if (!createRoomMessage) {
    return;
  }


  createRoomMessage.textContent =
    "";

  createRoomMessage.className =
    "message";

}


// =========================================================
// ERROR HANDLING
// =========================================================

function getReadableRoomError(error) {

  const message =
    error?.message?.toLowerCase() || "";


  if (
    message.includes("logged in")
  ) {

    return "Kamu harus login terlebih dahulu.";
  }


  if (
    message.includes("maximum players")
  ) {

    return "Jumlah pemain harus antara 2 dan 8.";
  }


  if (
    message.includes("permission")
    || message.includes("execute")
  ) {

    return "Akses Create Room belum dikonfigurasi dengan benar.";
  }


  return (
    error?.message ||
    "Room gagal dibuat."
  );

}
