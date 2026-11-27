
let dateElement = document.getElementById("current-date");

let today = new Date();

dateElement.textContent = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
});
