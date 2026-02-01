import bcrypt from "bcryptjs";

const passwords = ["admin123", "user123"]; 

async function hashPasswords() {
  for (const p of passwords) {
    const hash = await bcrypt.hash(p, 10);
    console.log(`${p} → ${hash}`);
  }
}

hashPasswords();
