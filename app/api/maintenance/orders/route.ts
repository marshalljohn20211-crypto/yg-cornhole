import { runOrderMaintenance } from "../../../lib/order-maintenance";

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function POST(request: Request) {
  const secret = process.env.ORDER_MAINTENANCE_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 32 || !safeEqual(authorization, `Bearer ${secret}`)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    return Response.json(await runOrderMaintenance());
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Order maintenance failed." },
      { status: 500 },
    );
  }
}
