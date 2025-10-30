document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const feedback = document.getElementById("feedback");
      feedback.textContent = "✅ Gracias por tu mensaje. Te responderemos pronto.";
      form.reset();
    });
  }
});
