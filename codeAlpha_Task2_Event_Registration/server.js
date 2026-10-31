require("dotenv").config();
const express = require("express");
const db = require("./db");
const app = express();
app.use(express.json());

db.exec(`
CREATE TABLE IF NOT EXISTS events (
 id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT DEFAULT '',
 location TEXT NOT NULL, event_date TEXT NOT NULL, capacity INTEGER NOT NULL CHECK(capacity > 0),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS registrations (
 id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 full_name TEXT NOT NULL, email TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(event_id, email)
);
`);

app.get("/", (_req, res) => res.json({service:"Event Registration API", endpoints:["GET /api/events","POST /api/events","GET /api/events/:id","POST /api/events/:id/register","GET /api/users/:email/registrations","DELETE /api/registrations/:id"]}));
app.get("/api/events", (_req,res) => res.json(db.prepare("SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id) AS registered FROM events e ORDER BY event_date").all()));
app.post("/api/events", (req,res) => {
 const {title, description="", location, event_date, capacity} = req.body;
 if (!title || !location || !event_date || !Number.isInteger(capacity) || capacity < 1) return res.status(400).json({error:"title, location, event_date and positive integer capacity are required"});
 const result = db.prepare("INSERT INTO events(title,description,location,event_date,capacity) VALUES(?,?,?,?,?)").run(title.trim(),description,location.trim(),event_date,capacity);
 res.status(201).json(db.prepare("SELECT * FROM events WHERE id=?").get(result.lastInsertRowid));
});
app.get("/api/events/:id", (req,res) => {
 const event = db.prepare("SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id) AS registered FROM events e WHERE e.id=?").get(req.params.id);
 if (!event) return res.status(404).json({error:"Event not found"});
 res.json(event);
});
app.post("/api/events/:id/register", (req,res) => {
 const {full_name,email} = req.body;
 if (!full_name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({error:"Valid full_name and email are required"});
 const event = db.prepare("SELECT * FROM events WHERE id=?").get(req.params.id);
 if (!event) return res.status(404).json({error:"Event not found"});
 const count = db.prepare("SELECT COUNT(*) AS n FROM registrations WHERE event_id=?").get(event.id).n;
 if (count >= event.capacity) return res.status(409).json({error:"Event is full"});
 try {
   const result = db.prepare("INSERT INTO registrations(event_id,full_name,email) VALUES(?,?,?)").run(event.id,full_name.trim(),email.toLowerCase().trim());
   return res.status(201).json(db.prepare("SELECT * FROM registrations WHERE id=?").get(result.lastInsertRowid));
 } catch (e) {
   if (String(e.code).startsWith("SQLITE_CONSTRAINT")) return res.status(409).json({error:"This email is already registered for the event"});
   throw e;
 }
});
app.get("/api/users/:email/registrations", (req,res) => res.json(db.prepare("SELECT r.*,e.title,e.event_date,e.location FROM registrations r JOIN events e ON e.id=r.event_id WHERE lower(r.email)=lower(?) ORDER BY e.event_date").all(req.params.email)));
app.delete("/api/registrations/:id", (req,res) => {
 const result = db.prepare("DELETE FROM registrations WHERE id=?").run(req.params.id);
 if (!result.changes) return res.status(404).json({error:"Registration not found"});
 res.json({message:"Registration cancelled"});
});
app.use((err,_req,res,_next) => { console.error(err); res.status(500).json({error:"Internal server error"}); });
app.listen(Number(process.env.PORT || 3002), () => console.log(`Event API running on port ${process.env.PORT || 3002}`));
