document.getElementById("next").addEventListener("click", async () => {
  const mobile = document.getElementById("mobile").value;

  if (!mobile || mobile.length<10) {
    alert("Please enter a valid 10 digit mobile number.");
    return;
  }

  const response = await fetch("/check-mobile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile }),
  });

  const data = await response.json();
  if (data.exists) {
    alert("Mobile number already exists for today.");
  } else {
    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
  }
});

document.getElementById("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const mobile = document.getElementById("mobile").value;
  const investigator = document.getElementById("investigator").value;
  const inclusions = document.getElementById("inclusions").value;

  const response = await fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile, investigator, inclusions }),
  });

  const data = await response.json();
  if (response.ok) {
    document.getElementById("message").textContent = data.message;
  } else {
    alert(data.message);
  }
});