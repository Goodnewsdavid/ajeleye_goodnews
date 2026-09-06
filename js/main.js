const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const links = [...document.querySelectorAll(".nav a")];
const form = document.querySelector("#contact-form");
const cursor = document.querySelector(".cursor");
const pin = document.querySelector(".works-pin");
const track = document.querySelector("#works-track");
const indexEl = document.querySelector("#works-index");
const totalEl = document.querySelector("#works-total");
if (totalEl && track) {
  totalEl.textContent = String(track.querySelectorAll("figure").length).padStart(2, "0");
}
const finePointer = window.matchMedia("(pointer: fine)").matches;
const desktop = window.matchMedia("(min-width: 981px)");

function setNav(open) {
  nav?.classList.toggle("open", open);
  document.body.classList.toggle("nav-open", open);
  toggle?.setAttribute("aria-expanded", String(open));
  toggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

function closeNav() {
  setNav(false);
}

toggle?.addEventListener("click", () => {
  setNav(!nav.classList.contains("open"));
});

links.forEach((link) => link.addEventListener("click", closeNav));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNav();
});

desktop.addEventListener("change", () => {
  if (desktop.matches) closeNav();
  sizeWorks();
  updateWorks();
});

if (finePointer && desktop.matches && cursor) {
  document.body.classList.add("has-cursor");
  let x = 0;
  let y = 0;
  let cx = 0;
  let cy = 0;

  window.addEventListener("pointermove", (event) => {
    x = event.clientX;
    y = event.clientY;
  });

  const tick = () => {
    cx += (x - cx) * 0.18;
    cy += (y - cy) * 0.18;
    cursor.style.transform = `translate3d(${cx - 9}px, ${cy - 9}px, 0)`;
    requestAnimationFrame(tick);
  };
  tick();

  document.querySelectorAll("a, button, input, textarea, video").forEach((el) => {
    el.addEventListener("mouseenter", () => document.body.classList.add("is-hovering"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("is-hovering"));
  });
}

const sections = ["#about", "#do", "#works", "#process", "#contact"]
  .map((id) => document.querySelector(id))
  .filter(Boolean);

if (sections.length && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: "-35% 0px -50% 0px" }
  );
  sections.forEach((section) => observer.observe(section));
}

function setIndex(progress) {
  if (!indexEl || !track) return;
  const frames = track.querySelectorAll("figure").length;
  const current = Math.min(frames, Math.max(1, Math.round(progress * (frames - 1)) + 1));
  indexEl.textContent = String(current).padStart(2, "0");
}

function sizeWorks() {
  if (!pin || !track) return;
  if (!desktop.matches) {
    pin.style.height = "auto";
    track.style.transform = "";
    return;
  }
  const travel = Math.max(track.scrollWidth - window.innerWidth + 56, 0);
  pin.style.height = `${window.innerHeight + travel}px`;
}

function updateWorks() {
  if (!pin || !track || !desktop.matches) return;
  const total = pin.offsetHeight - window.innerHeight;
  const scrolled = Math.min(Math.max(-pin.getBoundingClientRect().top, 0), total);
  const progress = total ? scrolled / total : 0;
  const maxX = Math.max(track.scrollWidth - window.innerWidth + 56, 0);
  track.style.transform = `translate3d(${-maxX * progress}px, 0, 0)`;
  setIndex(progress);
}

function updateMobileWorks() {
  if (!track || desktop.matches) return;
  const figures = [...track.querySelectorAll("figure")];
  if (!figures.length) return;
  const marker = track.scrollLeft + 48;
  let current = 1;
  figures.forEach((figure, i) => {
    if (figure.offsetLeft <= marker) current = i + 1;
  });
  if (indexEl) indexEl.textContent = String(current).padStart(2, "0");
}

const workVideos = [...document.querySelectorAll("#works-track video")];

function setVideoSound(video, muted) {
  video.muted = muted;
  const clip = video.closest(".work-clip");
  const button = clip?.querySelector(".work-sound");
  clip?.classList.toggle("is-live", !muted);
  if (button) {
    button.textContent = muted ? "Sound off" : "Sound on";
    button.setAttribute("aria-label", muted ? "Unmute video" : "Mute video");
  }
}

function syncWorkVideos() {
  workVideos.forEach((video) => {
    const rect = video.getBoundingClientRect();
    const visible = rect.right > 64 && rect.left < window.innerWidth - 64 && rect.bottom > 80 && rect.top < window.innerHeight - 80;
    if (visible) {
      video.play().catch(() => {});
    } else {
      video.pause();
      setVideoSound(video, true);
    }
  });
}

workVideos.forEach((video) => {
  video.addEventListener("loadedmetadata", () => {
    sizeWorks();
    updateWorks();
  });

  const button = video.closest(".work-clip")?.querySelector(".work-sound");
  button?.addEventListener("click", (event) => {
    event.stopPropagation();
    const nextMuted = !video.muted;
    workVideos.forEach((other) => setVideoSound(other, other === video ? nextMuted : true));
    video.play().catch(() => {});
  });
});

sizeWorks();
updateWorks();
syncWorkVideos();
window.addEventListener("resize", () => {
  sizeWorks();
  updateWorks();
  syncWorkVideos();
});
window.addEventListener("scroll", () => {
  updateWorks();
  syncWorkVideos();
}, { passive: true });
track?.addEventListener("scroll", () => {
  updateMobileWorks();
  syncWorkVideos();
}, { passive: true });

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const message = String(data.get("message") || "").trim();
  window.location.href = `mailto:hello@goodnewsajileye.com?subject=${encodeURIComponent(`UGC / modeling inquiry from ${name}`)}&body=${encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`)}`;
  const note = form.querySelector(".form-note");
  if (note) note.hidden = false;
  form.reset();
});
