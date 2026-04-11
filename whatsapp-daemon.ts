import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { PrismaClient } from "@prisma/client";
import { differenceInDays, format } from "date-fns";
import cron from "node-cron";
import "dotenv/config";

const prisma = new PrismaClient();

console.log("Starting WhatsApp Headless Daemon...");

// Initialize WhatsApp Client with persistent session
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./.wwebjs_auth" }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on("qr", (qr) => {
  console.log("\nSCAN THIS QR CODE IN WHATSAPP TO LINK THE BOT:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("\n✅ WhatsApp Daemon is ONLINE and officially linked to your account!");
  startCronLoop();
});

client.on("auth_failure", msg => {
  console.error("Authentication failure:", msg);
});

client.initialize();

// Memory cache to prevent WhatsApp from banning us during the rapid loop test!
const recentPings = new Map<string, number>();

// Clean up memory cache every hour
setInterval(() => {
  const now = Date.now();
  for (const [id, timestamp] of recentPings.entries()) {
    // We clear the cache every 2 minutes for testing purposes
    if (now - timestamp > 2 * 60 * 1000) {
      recentPings.delete(id);
    }
  }
}, 30 * 1000);

// The Automated Pinger Loop
function startCronLoop() {
  console.log(`Starting automated checks... (Configured for Daily at 9:00 AM)`);

  cron.schedule("0 9 * * *", async () => {
    try {
      console.log(`[${new Date().toLocaleTimeString()}] Executing Daily Billing Sweep...`);
      
      const clients = await prisma.client.findMany({
        where: { 
          status: "active",
          phoneNumber: { not: null }
        }
      });

      for (const c of clients) {
        if (!c.phoneNumber || c.phoneNumber.trim().length === 0) continue;
        
        const nextPaymentDate = new Date(c.nextPaymentDate);
        const isOverdue = new Date() > nextPaymentDate;
        const daysUntilDue = differenceInDays(nextPaymentDate, new Date());
        const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 5;

        if (isOverdue || isDueSoon) {
          const numberId = c.phoneNumber.replace(/[^0-9]/g, '') + "@c.us";
          
          const message = `*Automated Reminder from CRM*\n\nHi ${c.name} Team,\n\nThis is a friendly reminder that your website (${c.websiteUrl}) ` + 
            (isOverdue 
              ? `is currently *OVERDUE by ${Math.abs(daysUntilDue)} days*. Please clear your dues immediately to prevent automated service suspension.` 
              : `is scheduled for renewal on *${format(nextPaymentDate, "MMM d, yyyy")}*.\n\nYou have ${daysUntilDue} days remaining until your grace period expires.`) + 
            `\n\n_This message was generated automatically._`;

          if (!recentPings.has(c.id)) {
            console.log(`[${new Date().toLocaleTimeString()}] -> Sending ping to ${c.name} (${numberId})...`);
            
            try {
              await client.sendMessage(numberId, message);
              console.log(`✅ Message successfully delivered to ${c.name}!`);
              recentPings.set(c.id, Date.now());
            } catch (err) {
              console.error(`❌ Failed to send message to ${c.name}. Verify the phone number format.`, err);
            }
          }
        }
      }
    } catch (err) {
      console.error("Database scan failed:", err);
    }
  });
}

// Safe disconnect
process.on('SIGINT', async () => {
  console.log("\nShutting down daemon...");
  await client.destroy();
  await prisma.$disconnect();
  process.exit(0);
});
