const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");


// =========================
// MOBILE MENU
// =========================

menuButton.addEventListener("click", () => {

    navLinks.classList.toggle("show");

    const icon = menuButton.querySelector("i");

    if (navLinks.classList.contains("show")) {

        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");

    } else {

        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");

    }

});


navLinks.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

        navLinks.classList.remove("show");

        const icon = menuButton.querySelector("i");

        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");

    });

});


// =========================
// APPOINTMENT FORM
// =========================

const bookingForm = document.getElementById("bookingForm");


bookingForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    console.log("FORM SUBMITTED");


    const appointment = {

        firstName: document.getElementById("firstName").value,

        lastName: document.getElementById("lastName").value,

        phone: document.getElementById("phone").value,

        email: document.getElementById("email").value,

        treatment: document.getElementById("treatment").value,

        message: document.getElementById("message").value

    };


    console.log("Appointment:", appointment);


    try {

        const response = await fetch("/api/appointments", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(appointment)

        });


        const result = await response.json();


        console.log("Server response:", result);


        if (result.success) {

            alert("Your appointment request has been received.");

            bookingForm.reset();

        }

    } catch (error) {

        console.error("ERROR:", error);

        alert("Something went wrong. Please try again.");

    }

});


// =========================================================
// LOADING SCREEN + WELCOME POPUP
// =========================================================

const loader = document.getElementById("loader");
const welcomePopup = document.getElementById("welcomePopup");
const welcomeClose = document.getElementById("welcomeClose");


// Hide loader and show welcome popup
window.addEventListener("load", () => {

    setTimeout(() => {

        loader.classList.add("hide");

        setTimeout(() => {
            welcomePopup.classList.add("show");
        }, 500);

    }, 1200);

});


// Close welcome popup
welcomeClose.addEventListener("click", () => {
    welcomePopup.classList.remove("show");
});


// Close popup when clicking outside it
welcomePopup.addEventListener("click", (event) => {

    if (event.target === welcomePopup) {
        welcomePopup.classList.remove("show");
    }

});
