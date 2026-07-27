import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { generateInviteCode } from "./utils/inviteCode";

// Public signup is disabled, so the very first account has to come from
// somewhere. On startup, if the database has no users at all, create one
// admin account from environment variables so there's a way to log in and
// start managing accounts from /admin. This account also becomes the
// instance's permanent super-admin (the only one able to create additional
// households from /households) — there's no other path to that role.
export async function bootstrapAdmin() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";
  const householdName = process.env.HOUSEHOLD_NAME || "Hornsby Household";

  if (!email || !password) {
    console.warn(
      "No users exist yet and ADMIN_EMAIL/ADMIN_PASSWORD are not set — " +
        "set them in server/.env and restart to create the first admin account."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const household = await prisma.household.create({
    data: { name: householdName, inviteCode: generateInviteCode() },
  });
  await prisma.user.create({
    data: { email, passwordHash, name, householdId: household.id, isAdmin: true, isSuperAdmin: true },
  });

  console.log(`Bootstrapped admin account: ${email}`);
}
