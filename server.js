const express = require("express");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Directory for storing Excel files
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Get today's filename
const getTodayFileName = () => {
  const today = new Date().toISOString().split("T")[0];
  return path.join(dataDir, `${today}.xlsx`);
};

// Create a new Excel file if not exists
const createFileIfNotExists = () => {
  const filePath = getTodayFileName();
  if (!fs.existsSync(filePath)) {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([["Mobile No.", "Investigator", "Inclusions"]]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, filePath);
  }
  return filePath;
};

// API: Delete the Excel file (GET version for browser access)
app.get("/delete", (req, res) => {
  const filePath = getTodayFileName();
  console.log(`Attempting to delete file at: ${filePath}`);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).send("<h3>File deleted successfully.</h3>");
    } else {
      res.status(404).send("<h3>File not found.</h3>");
    }
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).send("<h3>An error occurred while deleting the file.</h3>");
  }
});

// API: Check if mobile exists
app.post("/check-mobile", (req, res) => {
  const { mobile } = req.body;
  const filePath = createFileIfNotExists();
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const exists = data.some((row) => row["Mobile No."] === mobile);
  res.json({ exists });
});

// API: Submit form
app.post("/submit", (req, res) => {
  const { mobile, investigator, inclusions } = req.body;

  if (req.cookies.submitted) {
    return res.status(400).json({ message: "Already submitted today" });
  }

  const filePath = createFileIfNotExists();
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const newRow = { "Mobile No.": mobile, Investigator: investigator, Inclusions: inclusions };
  const data = XLSX.utils.sheet_to_json(worksheet);
  data.push(newRow);

  const updatedSheet = XLSX.utils.json_to_sheet(data, { header: ["Mobile No.", "Investigator", "Inclusions"] });
  workbook.Sheets[workbook.SheetNames[0]] = updatedSheet;

  XLSX.writeFile(workbook, filePath);

  res.cookie("submitted", "true", { maxAge: 24 * 60 * 60 * 1000 }); // Set cookie for 1 day
  res.json({ message: "Form submitted successfully" });
});

// API: Download Excel file
app.get("/download", (req, res) => {
  const filePath = createFileIfNotExists();
  res.download(filePath);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
