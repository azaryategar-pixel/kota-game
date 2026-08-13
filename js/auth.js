const { createClient } = supabase;

const supabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// =========================================================
// REGISTER
// =========================================================

const registerForm = document.getElementById("registerForm");
const registerButton = document.getElementById("registerButton");
const message = document.getElementById("message");


if (registerForm) {

  registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();


    const usernameInput =
      document.getElementById("username");

    const emailInput =
      document.getElementById("email");

    const passwordInput =
      document.getElementById("password");


    const username =
      usernameInput.value.trim();

    const email =
      emailInput.value.trim().toLowerCase();

    const password =
      passwordInput.value;


    // =========================================
    // VALIDATION
    // =========================================

    const usernamePattern =
      /^[a-zA-Z0-9_]+$/;


    if (username.length < 3 || username.length > 20) {

      showMessage(
        "Username harus terdiri dari 3–20 karakter.",
        "error"
      );

      return;
    }


    if (!usernamePattern.test(username)) {

      showMessage(
        "Username hanya boleh menggunakan huruf, angka, dan underscore (_).",
        "error"
      );

      return;
    }


    if (password.length < 8) {

      showMessage(
        "Password harus memiliki minimal 8 karakter.",
        "error"
      );

      return;
    }


    // =========================================
    // DISABLE BUTTON
    // =========================================

    registerButton.disabled = true;

    registerButton.textContent =
      "CREATING ACCOUNT...";


    clearMessage();


    // =========================================
    // CREATE ACCOUNT
    // =========================================

    try {

      const { data, error } =
        await supabaseClient.auth.signUp({

          email: email,

          password: password,

          options: {

            data: {
              username: username
            },

            emailRedirectTo:
              "https://azaryategar-pixel.github.io/kota-game/"
          }

        });


      // =========================================
      // ERROR
      // =========================================

      if (error) {

        console.error(
          "Registration error:",
          error
        );

        showMessage(
          getReadableAuthError(error),
          "error"
        );

        return;
      }


      // =========================================
      // SUCCESS
      // =========================================

      console.log(
        "Registration successful:",
        data
      );


      showMessage(
        "Akun berhasil dibuat! Silakan cek email kamu untuk melakukan verifikasi.",
        "success"
      );


      registerForm.reset();


    } catch (error) {

      console.error(
        "Unexpected registration error:",
        error
      );

      showMessage(
        "Terjadi kesalahan. Silakan coba lagi.",
        "error"
      );


    } finally {

      registerButton.disabled = false;

      registerButton.textContent =
        "CREATE ACCOUNT";

    }

  });

}


// =========================================================
// MESSAGE
// =========================================================

function showMessage(text, type) {

  if (!message) {
    return;
  }


  message.textContent = text;

  message.className =
    "message " + type;

}


function clearMessage() {

  if (!message) {
    return;
  }


  message.textContent = "";

  message.className =
    "message";

}


// =========================================================
// AUTH ERROR
// =========================================================

function getReadableAuthError(error) {

  const message =
    error?.message?.toLowerCase() || "";


  if (message.includes("already registered")) {

    return "Email tersebut sudah terdaftar. Silakan gunakan email lain atau login.";
  }


  if (message.includes("password")) {

    return "Password tidak memenuhi persyaratan.";
  }


  if (message.includes("invalid email")) {

    return "Format email tidak valid.";
  }


  if (message.includes("rate limit")) {

    return "Terlalu banyak percobaan. Silakan tunggu beberapa saat.";
  }


  if (message.includes("username")) {

    return "Username tersebut mungkin sudah digunakan.";
  }


  return (
    error?.message ||
    "Registrasi gagal. Silakan coba lagi."
  );

}

// =========================================================
// LOGIN
// =========================================================

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("message");


if (loginForm) {

  loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email =
      document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const password =
      document
        .getElementById("password")
        .value;


    loginButton.disabled = true;
    loginButton.textContent = "LOGGING IN...";

    clearLoginMessage();


    try {

      const { data, error } =
        await supabaseClient.auth.signInWithPassword({

          email: email,
          password: password

        });


      if (error) {

        console.error(
          "Login error:",
          error
        );

        showLoginMessage(
          getReadableLoginError(error),
          "error"
        );

        return;
      }


      console.log(
        "Login successful:",
        data
      );


      showLoginMessage(
        "Login berhasil. Mengarahkan ke lobby...",
        "success"
      );


      setTimeout(function () {

        window.location.href =
          "lobby.html";

      }, 800);


    } catch (error) {

      console.error(
        "Unexpected login error:",
        error
      );

      showLoginMessage(
        "Terjadi kesalahan. Silakan coba lagi.",
        "error"
      );


    } finally {

      loginButton.disabled = false;
      loginButton.textContent = "LOGIN";

    }

  });

}


// =========================================================
// LOGIN MESSAGE
// =========================================================

function showLoginMessage(text, type) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent = text;

  loginMessage.className =
    "message " + type;
}


function clearLoginMessage() {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent = "";

  loginMessage.className =
    "message";
}


// =========================================================
// LOGIN ERROR
// =========================================================

function getReadableLoginError(error) {

  const errorMessage =
    error?.message?.toLowerCase() || "";


  if (
    errorMessage.includes("invalid login credentials")
  ) {

    return "Email atau password salah.";
  }


  if (
    errorMessage.includes("email not confirmed")
  ) {

    return "Email kamu belum diverifikasi. Silakan cek inbox email.";
  }


  if (
    errorMessage.includes("rate limit")
  ) {

    return "Terlalu banyak percobaan. Silakan tunggu beberapa saat.";
  }


  return (
    error?.message ||
    "Login gagal. Silakan coba lagi."
  );
}

