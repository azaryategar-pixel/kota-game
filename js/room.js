// =========================================================
// KOTA - ROOM
// =========================================================


// =========================================================
// ROOM DATA
// =========================================================

const roomId =
  sessionStorage.getItem(
    "kota_room_id"
  );


const roomCode =
  sessionStorage.getItem(
    "kota_room_code"
  );


// =========================================================
// DOM ELEMENTS
// =========================================================

const roomCodeElement =
  document.getElementById(
    "roomCode"
  );


const statusElement =
  document.getElementById(
    "status"
  );


const playersElement =
  document.getElementById(
    "players"
  );


const copyButton =
  document.getElementById(
    "copyButton"
  );


const leaveButton =
  document.getElementById(
    "leaveButton"
  );


// =========================================================
// REALTIME CHANNEL
// =========================================================

let roomChannel = null;


// =========================================================
// INITIAL CHECK
// =========================================================

if (!roomId || !roomCode) {

  window.location.href =
    "lobby.html";

}


// =========================================================
// DISPLAY ROOM CODE
// =========================================================

if (roomCodeElement) {

  roomCodeElement.textContent =
    roomCode;

}


// =========================================================
// LOAD ROOM
// =========================================================

async function loadRoom() {

  // -----------------------------------------
  // CHECK SESSION
  // -----------------------------------------

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

    return;

  }


  // -----------------------------------------
  // GET ROOM
  // -----------------------------------------

  const {
    data: room,
    error: roomError
  } =
    await supabaseClient
      .from("game_rooms")
      .select(
        "id, room_code, status, max_players"
      )
      .eq(
        "id",
        roomId
      )
      .single();


  // -----------------------------------------
  // ROOM ERROR
  // -----------------------------------------

  if (roomError) {

    console.error(
      "Room error:",
      roomError
    );

    showRoomError(
      "Room tidak dapat ditemukan."
    );

    return;

  }


  // -----------------------------------------
  // DISPLAY ROOM CODE
  // -----------------------------------------

  if (roomCodeElement) {

    roomCodeElement.textContent =
      room.room_code;

  }


  // -----------------------------------------
  // LOAD PLAYERS
  // -----------------------------------------

  await loadPlayers();


  // -----------------------------------------
  // UPDATE PLAYER COUNT
  // -----------------------------------------

  await updateRoomStatus(
    room.max_players
  );


  // -----------------------------------------
  // START REALTIME
  // -----------------------------------------

  subscribeToRoom(
    room.id
  );

}


// =========================================================
// UPDATE ROOM STATUS
// =========================================================

async function updateRoomStatus(
  maxPlayers
) {

  const {
    count,
    error
  } =
    await supabaseClient
      .from("game_players")
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      )
      .eq(
        "game_id",
        roomId
      );


  // -----------------------------------------
  // COUNT ERROR
  // -----------------------------------------

  if (error) {

    console.error(
      "Player count error:",
      error
    );

    return;

  }


  // -----------------------------------------
  // PLAYER COUNT
  // -----------------------------------------

  const playerCount =
    count || 0;


  // -----------------------------------------
  // UPDATE STATUS ELEMENT
  // -----------------------------------------

  if (statusElement) {

    statusElement.className =
      "status";

    statusElement.textContent =
      `Waiting for players · ${playerCount}/${maxPlayers}`;

  }

}


// =========================================================
// REALTIME
// =========================================================

function subscribeToRoom(
  currentRoomId
) {

  // -----------------------------------------
  // CLEAN OLD CHANNEL
  // -----------------------------------------

  if (roomChannel) {

    supabaseClient
      .removeChannel(
        roomChannel
      );

  }


  // -----------------------------------------
  // CREATE CHANNEL
  // -----------------------------------------

  roomChannel =
    supabaseClient
      .channel(
        `kota-room-${currentRoomId}`
      );


  // -----------------------------------------
  // PLAYER CHANGES
  // -----------------------------------------

  roomChannel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "game_players",
      filter:
        `game_id=eq.${currentRoomId}`
    },

    async function () {

      console.log(
        "Player change detected"
      );


      // Reload player list
      await loadPlayers();


      // Get latest room information
      const {
        data: room,
        error: roomError
      } =
        await supabaseClient
          .from("game_rooms")
          .select(
            "max_players"
          )
          .eq(
            "id",
            currentRoomId
          )
          .single();


      if (roomError) {

        console.error(
          "Room status error:",
          roomError
        );

        return;

      }


      if (room) {

        await updateRoomStatus(
          room.max_players
        );

      }

    }
  );


  // -----------------------------------------
  // ROOM CHANGES
  // -----------------------------------------

  roomChannel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "game_rooms",
      filter:
        `id=eq.${currentRoomId}`
    },

    async function () {

      console.log(
        "Room change detected"
      );


      const {
        data: room,
        error: roomError
      } =
        await supabaseClient
          .from("game_rooms")
          .select(
            "id, room_code, status, max_players"
          )
          .eq(
            "id",
            currentRoomId
          )
          .single();


      if (roomError) {

        console.error(
          "Room realtime error:",
          roomError
        );

        return;

      }


      if (!room) {

        return;

      }


      // Update room code if changed
      if (roomCodeElement) {

        roomCodeElement.textContent =
          room.room_code;

      }


      // Update player count
      await updateRoomStatus(
        room.max_players
      );

    }
  );


  // -----------------------------------------
  // SUBSCRIBE
  // -----------------------------------------

  roomChannel.subscribe(
    function (status) {

      console.log(
        "Realtime status:",
        status
      );

    }
  );

}


// =========================================================
// LOAD PLAYERS
// =========================================================

async function loadPlayers() {

  // -----------------------------------------
  // GET PLAYERS
  // -----------------------------------------

  const {
    data: players,
    error: playersError
  } =
    await supabaseClient
      .from("game_players")
      .select(
        "player_number, is_host, user_id"
      )
      .eq(
        "game_id",
        roomId
      )
      .order(
        "player_number",
        {
          ascending: true
        }
      );


  // -----------------------------------------
  // PLAYERS ERROR
  // -----------------------------------------

  if (playersError) {

    console.error(
      "Players error:",
      playersError
    );

    showRoomError(
      "Pemain tidak dapat dimuat."
    );

    return;

  }


  // -----------------------------------------
  // NO PLAYERS
  // -----------------------------------------

  if (
    !players ||
    players.length === 0
  ) {

    renderPlayers([]);

    return;

  }


  // -----------------------------------------
  // GET USER IDS
  // -----------------------------------------

  const userIds =
    players.map(
      function (player) {

        return player.user_id;

      }
    );


  // -----------------------------------------
  // GET PROFILES
  // -----------------------------------------

  const {
    data: profiles,
    error: profilesError
  } =
    await supabaseClient
      .from("profiles")
      .select(
        "id, username, display_name"
      )
      .in(
        "id",
        userIds
      );


  // -----------------------------------------
  // PROFILES ERROR
  // -----------------------------------------

  if (profilesError) {

    console.error(
      "Profiles error:",
      profilesError
    );

    showRoomError(
      "Profile pemain tidak dapat dimuat."
    );

    return;

  }


  // -----------------------------------------
  // CREATE PROFILE MAP
  // -----------------------------------------

  const profileMap =
    new Map();


  (profiles || []).forEach(
    function (profile) {

      profileMap.set(
        profile.id,
        profile
      );

    }
  );


  // -----------------------------------------
  // COMBINE PLAYERS + PROFILES
  // -----------------------------------------

  const playersWithProfiles =
    players.map(
      function (player) {

        return {

          ...player,

          profiles:
            profileMap.get(
              player.user_id
            ) || null

        };

      }
    );


  // -----------------------------------------
  // RENDER PLAYERS
  // -----------------------------------------

  renderPlayers(
    playersWithProfiles
  );

}


// =========================================================
// RENDER PLAYERS
// =========================================================

function renderPlayers(
  players
) {

  if (!playersElement) {

    return;

  }


  // -----------------------------------------
  // CLEAR CURRENT PLAYERS
  // -----------------------------------------

  playersElement.innerHTML =
    "";


  // -----------------------------------------
  // NO PLAYERS
  // -----------------------------------------

  if (!players.length) {

    playersElement.innerHTML = `
      <div class="player">
        <div class="player-name loading">
          No players yet
        </div>
      </div>
    `;

    return;

  }


  // -----------------------------------------
  // RENDER EACH PLAYER
  // -----------------------------------------

  players.forEach(
    function (player) {

      const profile =
        player.profiles;


      const username =
        profile?.username ||
        profile?.display_name ||
        "Player";


      const playerElement =
        document.createElement(
          "div"
        );


      playerElement.className =
        "player";


      playerElement.innerHTML = `

        <div class="player-left">

          <div class="number">
            ${player.player_number}
          </div>

          <div>

            <div class="player-name">
              ${escapeHtml(username)}
            </div>

            ${
              player.is_host
                ? '<div class="host">Host</div>'
                : ''
            }

          </div>

        </div>

      `;


      playersElement.appendChild(
        playerElement
      );

    }
  );

}


// =========================================================
// COPY ROOM CODE
// =========================================================

if (copyButton) {

  copyButton.addEventListener(
    "click",
    async function () {

      try {

        await navigator.clipboard.writeText(
          roomCode
        );


        copyButton.textContent =
          "Copied!";


        setTimeout(
          function () {

            copyButton.textContent =
              "Copy Code";

          },
          1500
        );


      } catch (error) {

        console.error(
          "Copy error:",
          error
        );

      }

    }
  );

}


// =========================================================
// LEAVE ROOM
// =========================================================

if (leaveButton) {

  leaveButton.addEventListener(
    "click",
    async function () {

      // -----------------------------------------
      // DISABLE BUTTON
      // -----------------------------------------

      leaveButton.disabled =
        true;

      leaveButton.textContent =
        "Leaving...";


      // -----------------------------------------
      // REMOVE PLAYER FROM DATABASE
      // -----------------------------------------

      const {
        error
      } =
        await supabaseClient
          .rpc(
            "leave_game",
            {
              p_game_id: roomId
            }
          );


      // -----------------------------------------
      // HANDLE ERROR
      // -----------------------------------------

      if (error) {

        console.error(
          "Leave room error:",
          error
        );

        leaveButton.disabled =
          false;

        leaveButton.textContent =
          "Leave Room";

        alert(
          "Gagal keluar dari room."
        );

        return;

      }


      // -----------------------------------------
      // REMOVE SESSION DATA
      // -----------------------------------------

      sessionStorage.removeItem(
        "kota_room_id"
      );

      sessionStorage.removeItem(
        "kota_room_code"
      );


      // -----------------------------------------
      // REMOVE REALTIME CHANNEL
      // -----------------------------------------

      if (roomChannel) {

        await supabaseClient
          .removeChannel(
            roomChannel
          );

        roomChannel =
          null;

      }


      // -----------------------------------------
      // GO BACK TO LOBBY
      // -----------------------------------------

      window.location.href =
        "lobby.html";

    }
  );

}


// =========================================================
// HELPERS
// =========================================================

function showRoomError(
  text
) {

  if (!statusElement) {

    return;

  }


  statusElement.textContent =
    text;


  statusElement.className =
    "status error";

}


function escapeHtml(
  value
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}


// =========================================================
// INITIALIZE
// =========================================================

loadRoom();
