(function ($) {
  "use strict";


  // sidebar submenu collapsible js
  $(".sidebar-menu .dropdown").on("click", function () {
    var item = $(this);
    item.siblings(".dropdown").children(".sidebar-submenu").slideUp();

    item.siblings(".dropdown").removeClass("dropdown-open");

    item.siblings(".dropdown").removeClass("open");

    item.children(".sidebar-submenu").slideToggle();

    item.toggleClass("dropdown-open");
  });

  $(".sidebar-toggle").on("click", function () {
    $(this).toggleClass("active");
    $(".sidebar").toggleClass("active");
    $(".dashboard-main").toggleClass("active");
  });

  $(".sidebar-mobile-toggle").on("click", function () {
    $(".sidebar").addClass("sidebar-open");
    $("body").addClass("overlay-active");
  });

  $(".sidebar-close-btn").on("click", function () {
    $(".sidebar").removeClass("sidebar-open");
    $("body").removeClass("overlay-active");
  });

  //to keep the current page active
  $(function () {
    for (
      var nk = window.location,
        o = $("ul#sidebar-menu a")
          .filter(function () {
            return this.href == nk;
          })
          .addClass("active-page") // anchor
          .parent()
          .addClass("active-page");
      ;

    ) {
      // li
      if (!o.is("li")) break;
      o = o.parent().addClass("show").parent().addClass("open");
    }
  });

  /**
   * Utility function to calculate the current theme setting based on localStorage.
   */
  function calculateSettingAsThemeString({ localStorageTheme }) {
    if (localStorageTheme !== null) {
      return localStorageTheme;
    }
    return "light"; // default to light theme if nothing is stored
  }

  /**
   * Utility function to update the button text and aria-label.
   */
  function updateButton({ buttonEl, isDark }) {
    const newCta = isDark ? "dark" : "light";
    buttonEl.setAttribute("aria-label", newCta);
    buttonEl.innerText = newCta;
  }

  /**
   * Utility function to update the theme setting on the html tag.
   */
  function updateThemeOnHtmlEl({ theme }) {
    document.querySelector("html").setAttribute("data-theme", theme);
  }

  /**
   * 1. Grab what we need from the DOM and system settings on page load.
   */
  const button = document.querySelector("[data-theme-toggle]");
  const localStorageTheme = localStorage.getItem("theme");

  /**
   * 2. Work out the current site settings.
   */
  let currentThemeSetting = calculateSettingAsThemeString({
    localStorageTheme,
  });

  /**
   * 3. If the button exists, update the theme setting and button text according to current settings.
   */
  if (button) {
    updateButton({ buttonEl: button, isDark: currentThemeSetting === "dark" });
    updateThemeOnHtmlEl({ theme: currentThemeSetting });

    /**
     * 4. Add an event listener to toggle the theme.
     */
    button.addEventListener("click", (event) => {
      const newTheme = currentThemeSetting === "dark" ? "light" : "dark";

      localStorage.setItem("theme", newTheme);
      updateButton({ buttonEl: button, isDark: newTheme === "dark" });
      updateThemeOnHtmlEl({ theme: newTheme });

      currentThemeSetting = newTheme;
    });
  } else {
    // If no button is found, just apply the current theme to the page
    updateThemeOnHtmlEl({ theme: currentThemeSetting });
  }

  // =========================== Dark and light mode from sidebar js Start ================================
  const buttons = document.querySelectorAll(".dark-light-mode .theme-btn");

  function applyTheme(theme) {
    if (theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light"
      );
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.getAttribute("data-theme");

      // Apply theme
      applyTheme(theme);

      // Save in localStorage
      localStorage.setItem("theme", theme);

      // Remove active from all buttons
      buttons.forEach((btn) => btn.classList.remove("active"));

      // Add active to clicked button
      button.classList.add("active");
    });
  });

  // Load theme on page refresh
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    applyTheme(savedTheme);
    buttons.forEach((btn) => {
      if (btn.getAttribute("data-theme") === savedTheme) {
        btn.classList.add("active");
      }
    });
  }
  // =========================== Dark and light mode from sidebar js Start ================================

  // =========================== Theme Customization Show Hide js Start ================================
  $(".theme-customization__button").on("click", function () {
    $(".theme-customization-sidebar").toggleClass("active");
    $(".body-overlay").toggleClass("show");
  });

  $(".theme-customization-sidebar__close, .body-overlay").on(
    "click",
    function () {
      $(".theme-customization-sidebar").removeClass("active");
      $(".body-overlay").removeClass("show");
    }
  );
  // =========================== Theme Customization Show Hide js End ================================

  // =========================== RTL Mode js Start ================================
  $(".ltr-mode-btn").on("click", function () {
    $("html").attr("dir", "ltr");
    localStorage.setItem("direction", "ltr");

    // Toggle active state
    $(".theme-setting-item__btn").removeClass("active");
    $(this).addClass("active");
  });

  // RTL button
  $(".rtl-mode-btn").on("click", function () {
    $("html").attr("dir", "rtl");
    localStorage.setItem("direction", "rtl");

    // Toggle active state
    $(".theme-setting-item__btn").removeClass("active");
    $(this).addClass("active");
  });

  // Load saved direction from localStorage on page load
  $(document).ready(function () {
    const savedDir = localStorage.getItem("direction");
    if (savedDir) {
      $("html").attr("dir", savedDir);

      // Keep correct button active
      if (savedDir === "rtl") {
        $(".rtl-mode-btn").addClass("active");
      } else {
        $(".ltr-mode-btn").addClass("active");
      }
    }
  });
  // =========================== RTL Mode js End ================================

  // =========================== Color Schema js Start ================================
  const colorPickerButtons = document.querySelectorAll(".color-picker-btn");

  const colors = {
    base: "#25A194",
    red: "#dc2626",
    blue: "#2563eb",
    yellow: "#ff9f29",
    cyan: "#00b8f2",
    violet: "#7c3aed",
  };

  function applyColor(color) {
    document.documentElement.style.setProperty("--primary-600", colors[color]);
    localStorage.setItem("templateColor", color);
  }

  colorPickerButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-color");

      if (!color) return; // safety

      // Apply color
      applyColor(color);

      // Instantly update active state
      colorPickerButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Load saved color on refresh
  const savedColor = localStorage.getItem("templateColor");
  if (savedColor && colors[savedColor]) {
    applyColor(savedColor);
    document
      .querySelector(`.color-picker-btn[data-color="${savedColor}"]`)
      .classList.add("active");
  } else {
    // Default (base)
    document
      .querySelector(`.color-picker-btn[data-color="base"]`)
      .classList.add("active");
  }
  // =========================== Color Schema js End ================================

  // ================== Password Show Hide Js Start ==========
  function initializePasswordToggle(toggleSelector) {
    $(toggleSelector).on("click", function () {
      $(this).toggleClass("ri-eye-off-line");
      var input = $($(this).attr("data-toggle"));
      if (input.attr("type") === "password") {
        input.attr("type", "text");
      } else {
        input.attr("type", "password");
      }
    });
  }
  // Call the function
  initializePasswordToggle(".toggle-password");
  // ========================= Password Show Hide Js End ===========================

  // Current Date Js start
  $(document).ready(function () {
    let currentYear = document.querySelector(".current-year");
    if (currentYear) {
      let date = new Date();
      date = date.getFullYear();
      currentYear.innerHTML = date;
    }
  });
  // Current Date Js end
})(jQuery);
