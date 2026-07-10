#!/usr/bin/env node
import { Entry } from "@napi-rs/keyring";

const token = new Entry("Supabase CLI", "supabase").getPassword();
if (!token || !/^sbp_/.test(token)) process.exit(1);
process.stdout.write(token);
