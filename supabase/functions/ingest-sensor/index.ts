import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type SystemType = "portable" | "panel";

type DeviceSensorPayload = {
  device_id?: string;
  user_id?: string;
  system_type?: SystemType;
  land_id?: string;
  nitrogen?: number | string;
  phosphorus?: number | string;
  phosphor?: number | string;
  potassium?: number | string;
  kalium?: number | string;
  ph?: number | string;
  ph_tanah?: number | string;
  ec?: number | string;
  conductivity?: number | string;
  konduktivitas?: number | string;
  moisture?: number | string;
  kelembapan_tanah?: number | string;
  temperature?: number | string;
  suhu_tanah?: number | string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Device-Key",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pick(payload: DeviceSensorPayload, keys: Array<keyof DeviceSensorPayload>): unknown {
  for (const key of keys) {
    const value = payload[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function normalizeConductivity(payload: DeviceSensorPayload): number {
  const explicit = pick(payload, ["conductivity", "konduktivitas"]);
  if (explicit !== undefined) return toNumber(explicit);

  const ec = toNumber(payload.ec);
  if (ec > 20) return Number((ec / 1000).toFixed(3));
  return ec;
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const expectedDeviceKey = requireEnv("DEVICE_INGEST_KEY");
    const providedDeviceKey = req.headers.get("x-device-key");
    if (providedDeviceKey !== expectedDeviceKey) {
      return json({ error: "Invalid device key" }, 401);
    }

    const supabase = createClient(
      requireEnv("SUPABASE_URL"),
      requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const payload = (await req.json()) as DeviceSensorPayload;
    if (!payload.device_id) return json({ error: "device_id is required" }, 400);

    // Cari land_id & user_id berdasarkan device_id
    const { data: config, error: configError } = await supabase
      .from("device_config")
      .select("land_id, user_id")
      .eq("device_id", payload.device_id)
      .single();

    if (configError || !config) {
      return json({ error: "Device belum dikonfigurasi ke lahan manapun" }, 404);
    }

    const systemType = payload.system_type ?? "portable";
    if (!["portable", "panel"].includes(systemType)) {
      return json({ error: "system_type must be portable or panel" }, 400);
    }

    const reading = {
      device_id: payload.device_id,
      user_id: payload.user_id || config.user_id,
      system_type: systemType,
      land_id: config.land_id,
      moisture: toNumber(pick(payload, ["moisture", "kelembapan_tanah"])),
      nitrogen: toNumber(payload.nitrogen),
      phosphorus: toNumber(pick(payload, ["phosphorus", "phosphor"])),
      potassium: toNumber(pick(payload, ["potassium", "kalium"])),
      temperature: toNumber(pick(payload, ["temperature", "suhu_tanah"])),
      ph: toNumber(pick(payload, ["ph", "ph_tanah"])),
      conductivity: normalizeConductivity(payload),
    };

    // Insert ke tabel yang sesuai berdasarkan system_type
    const tableName = systemType === "portable" ? "sensor_readings_portable" : "sensor_readings_panel";
    
    const { data, error } = await supabase
      .from(tableName)
      .insert(reading)
      .select("*")
      .single();

    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, data }, 201);
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});

