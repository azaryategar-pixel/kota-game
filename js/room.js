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
// REALTIME
// =========================================================

let roomChannel = null;

let refreshTimer = null;

let isRefreshing = false;

let isStartingGame = false;


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
    await supabaseClient.auth.getSession();


  // -----------------------------------------
  // NOT LOGGED IN
  // -----------------------------------------

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
        "id, room_code, status, max_players, host_id"
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

  const playerCount =
    await loadPlayers();


  // -----------------------------------------
  // UPDATE STATUS
  // -----------------------------------------

  await updateRoomStatus(
    room.max_players,
    room.status
  );


  // -----------------------------------------
  // CHECK START GAME
  // -----------------------------------------

  await checkStartGame(
    room,
    playerCount,
    session.user.id
  );


  // -----------------------------------------
  // START REALTIME
  // -----------------------------------------

  subscribeToRoom(
    room.id
  );

}


// =========================================================
// REFRESH ROOM DATA
// =========================================================

async function refreshRoomData() {

  // -----------------------------------------
  // PREVENT DUPLICATE REFRESH
  // -----------------------------------------

  if (isRefreshing) {

    return;

  }


  isRefreshing = true;


  try {

    console.log(
      "Refreshing room data..."
    );


    // -----------------------------------------
    // GET SESSION
    // -----------------------------------------

    const {
      data: {
        session
      }
    } =
      await supabaseClient.auth.getSession();


    if (!session) {

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
          "id, room_code, status, max_players, host_id"
        )
        .eq(
          "id",
          roomId
        )
        .single();


    if (roomError) {

      console.error(
        "Room refresh error:",
        roomError
      );

      return;

    }


    // -----------------------------------------
    // LOAD PLAYERS
    // -----------------------------------------

    const playerCount =
      await loadPlayers();


    // -----------------------------------------
    // UPDATE COUNT / STATUS
    // -----------------------------------------

    await updateRoomStatus(
      room.max_players,
      room.status
    );


    // -----------------------------------------
    // CHECK START GAME
    // -----------------------------------------

    await checkStartGame(
      room,
      playerCount,
      session.user.id
    );


  } finally {

    isRefreshing =
      false;

  }

}


// =========================================================
// SCHEDULE REFRESH
// =========================================================

function scheduleRefresh() {

  clearTimeout(
    refreshTimer
  );


  refreshTimer =
    setTimeout(
      async function () {

        await refreshRoomData();

      },
      150
    );

}


// =========================================================
// UPDATE ROOM STATUS
// =========================================================

async function updateRoomStatus(
  maxPlayers,
  roomStatus
) {

  // -----------------------------------------
  // GET PLAYER COUNT
  // -----------------------------------------

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
  // ERROR
  // -----------------------------------------

  if (error) {

    console.error(
      "Player count error:",
      error
    );

    return 0;

  }


  const playerCount =
    count || 0;


  // -----------------------------------------
  // DISPLAY STATUS
  // -----------------------------------------

  if (statusElement) {

    statusElement.className =
      "status";


    if (
      roomStatus ===
      "playing"
    ) {

      statusElement.textContent =
        "Game started";

    } else if (
      roomStatus ===
      "starting"
    ) {

      statusElement.textContent =
        "Game starting...";

    } else {

      statusElement.textContent =
        `Waiting for players · ${playerCount}/${maxPlayers}`;

    }

  }


  return playerCount;

}


// =========================================================
// CHECK START GAME
// =========================================================

async function checkStartGame(
  room,
  playerCount,
  currentUserId
) {

  // -----------------------------------------
  // ROOM ALREADY PLAYING
  // -----------------------------------------

  if (
    room.status ===
    "playing"
  ) {

    return;

  }


  // -----------------------------------------
  // ROOM STARTING
  // -----------------------------------------

  if (
    room.status ===
    "starting"
  ) {

    return;

  }


  // -----------------------------------------
  // NOT ENOUGH PLAYERS
  // -----------------------------------------

  if (
    playerCount <
    room.max_players
  ) {

    return;

  }


  // -----------------------------------------
  // ONLY HOST STARTS GAME
  // -----------------------------------------

  if (
    room.host_id !==
    currentUserId
  ) {

    return;

  }


  // -----------------------------------------
  // PREVENT DUPLICATE RPC
  // -----------------------------------------

  if (isStartingGame) {

    return;

  }


  isStartingGame =
    true;


  try {

    console.log(
      "Room full. Starting game..."
    );


    if (statusElement) {

      statusElement.className =
        "status";

      statusElement.textContent =
        "Game starting...";

    }


    // -----------------------------------------
    // CALL START GAME RPC
    // -----------------------------------------

    const {
      error
    } =
      await supabaseClient
        .rpc(
          "start_game",
          {
            p_game_id:
              room.id
          }
        );


    // -----------------------------------------
    // RPC ERROR
    // -----------------------------------------

    if (error) {

      console.error(
        "Start game error:",
        error
      );


      if (statusElement) {

        statusElement.textContent =
          `Waiting for players · ${playerCount}/${room.max_players}`;

      }


      return;

    }


    console.log(
      "Game started successfully."
    );


    // -----------------------------------------
    // REFRESH ROOM
    // -----------------------------------------

    await refreshRoomData();


  } finally {

    isStartingGame =
      false;

  }

}


// =========================================================
// REALTIME SUBSCRIPTION
// =========================================================

function subscribeToRoom(
  currentRoomId
) {

  // -----------------------------------------
  // REMOVE OLD CHANNEL
  // -----------------------------------------

  if (roomChannel) {

    supabaseClient
      .removeChannel(
        roomChannel
      );

    roomChannel =
      null;

  }


  // -----------------------------------------
  // CREATE CHANNEL
  // -----------------------------------------

  roomChannel =
    supabaseClient
      .channel(
        `kota-room-${currentRoomId}-${Date.now()}`
      );


  // =======================================================
  // GAME PLAYERS - INSERT
  // =======================================================

  roomChannel.on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "game_players",
      filter:
        `game_id=eq.${currentRoomId}`
    },
    function (payload) {

      console.log(
        "PLAYER JOINED:",
        payload
      );


      scheduleRefresh();

    }
  );


  // =======================================================
  // GAME PLAYERS - DELETE
  // =======================================================

  roomChannel.on(
    "postgres_changes",
    {
      event: "DELETE",
      schema: "public",
      table: "game_players",
      filter:
        `game_id=eq.${currentRoomId}`
    },
    function (payload) {

      console.log(
        "PLAYER LEFT:",
        payload
      );


      scheduleRefresh();

    }
  );


  // =======================================================
  // GAME PLAYERS - UPDATE
  // =======================================================

  roomChannel.on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "game_players",
      filter:
        `game_id=eq.${currentRoomId}`
    },
    function (payload) {

      console.log(
        "PLAYER UPDATED:",
        payload
      );


      scheduleRefresh();

    }
  );


  // =======================================================
  // GAME ROOMS
  // =======================================================

  roomChannel.on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "game_rooms",
      filter:
        `id=eq.${currentRoomId}`
    },
    function (payload) {

      console.log(
        "ROOM CHANGED:",
        payload
      );


      scheduleRefresh();

    }
  );


  // =======================================================
  // SUBSCRIBE
  // =======================================================

  roomChannel.subscribe(
    function (status) {

      console.log(
        "Realtime status:",
        status
      );


      if (
        status ===
        "SUBSCRIBED"
      ) {

        console.log(
          "KOTA realtime connected."
        );

      }

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

    return 0;

  }


  // -----------------------------------------
  // NO PLAYERS
  // -----------------------------------------

  if (
    !players ||
    players.length === 0
  ) {

    renderPlayers([]);

    return 0;

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
  // PROFILE ERROR
  // -----------------------------------------

  if (profilesError) {

    console.error(
      "Profiles error:",
      profilesError
    );

    showRoomError(
      "Profile pemain tidak dapat dimuat."
    );

    return players.length;

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
  // RENDER
  // -----------------------------------------

  renderPlayers(
    playersWithProfiles
  );


  return players.length;

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
  // CLEAR
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
      // CALL RPC
      // -----------------------------------------

      const {
        error
      } =
        await supabaseClient
          .rpc(
            "leave_game",
            {
              p_game_id:
                roomId
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
      // REMOVE SESSION
      // -----------------------------------------

      sessionStorage.removeItem(
        "kota_room_id"
      );

      sessionStorage.removeItem(
        "kota_room_code"
      );


      // -----------------------------------------
      // REMOVE REALTIME
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
      // GO LOBBY
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
