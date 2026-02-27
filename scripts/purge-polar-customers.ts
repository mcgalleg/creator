import { config } from "dotenv";
config({ path: ".env.local" });
import { Polar } from "@polar-sh/sdk";

async function purgeAllCustomers() {
  const polar = new Polar({
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
  });

  console.log(`Polar server: ${process.env.POLAR_SERVER ?? "sandbox"}`);

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
