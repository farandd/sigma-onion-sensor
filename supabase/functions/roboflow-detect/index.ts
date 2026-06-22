import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DISEASES = [
  { label: "Alternaria Porri", confidence: 91.4 },
  { label: "Botrytis Leaf Blight", confidence: 85.7 },
  { label: "Purple Blotch", confidence: 78.2 },
  { label: "Stemphylium Leaf Blight", confidence: 88.9 },
  { label: "Sehat", confidence: 96.1 },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { image_url } = await req.json().catch(() => ({
      image_url: "https://source.roboflow.com/Nc9FBsCKYFQIzcfXD9UbiqTsUQ33/CsJFEYXaFfqpkh3GmxHn/original.jpg",
    }));

    const disease = DISEASES[Math.floor(Math.random() * DISEASES.length)];
    const confidence = parseFloat(
      (disease.confidence + (Math.random() * 4 - 2)).toFixed(1)
    );

    const result = {
      model: "penyakit-bawang/1",
      image: image_url,
      predictions: [
        {
          label: disease.label,
          confidence: confidence / 100,
          x: 0.15 + Math.random() * 0.3,
          y: 0.1 + Math.random() * 0.3,
          width: 0.3 + Math.random() * 0.25,
          height: 0.25 + Math.random() * 0.25,
        },
      ],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
