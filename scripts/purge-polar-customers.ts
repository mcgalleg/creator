import { config } from "dotenv";
config({ path: ".env.local" });
import * as readline from "readline";
import { Polar } from "@polar-sh/sdk";

async function purgeAllCustomers() {
  // Warn if pointing at production
  const server = process.env.POLAR_SERVER ?? "sandbox";
  if (server === "production") {
    console.error("ERROR: POLAR_SERVER is set to 'production'. Aborting.");
    process.exit(1);
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>(resolve => rl.question("\u26A0\uFE0F  This will DELETE ALL POLAR CUSTOMERS. Type 'YES' to confirm: ", resolve));
  rl.close();
  if (answer !== "YES") { console.log("Aborted."); process.exit(0); }

  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: (server as "sandbox" | "production"),
  });

  console.log(`Polar server: ${server}`);

  let deleted = 0;
  let page = 1;

  while (true) {
    const result = await polar.customers.list({ limit: 100, page });
    const items = result.result.items;

    if (items.length === 0) break;

    for (const customer of items) {
      console.log(
        `Deleting customer: ${customer.email} (id: ${customer.id}, externalId: ${customer.externalId ?? "none"})`
      );
      await polar.customers.delete({ id: customer.id });
      deleted++;
    }

    // After deleting a page, start from page 1 again since items shift
    page = 1;
  }

  console.log(`\nDone. Deleted ${deleted} customer(s).`);
}

purgeAllCustomers().catch((e) => {
  console.error("Failed to purge Polar customers:", e);
  process.exit(1);
});
