import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/comms";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // 1. Verify the user is logged into the CRM
    const session = await auth();
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // 2. Extract the socket ID and requested channel from Pusher's automated request
    const data = await req.formData();
    const socketId = data.get("socket_id") as string;
    const channel = data.get("channel_name") as string;

    // 3. Absolute Security: Prevent users from listening to other people's channels
    if (channel !== `private-user-${session.user.id}`) {
       return new Response("Forbidden: You cannot subscribe to another user's comms.", { status: 403 });
    }

    // 4. Generate the cryptographic signature and send it back to the browser
    const authResponse = pusherServer.authorizeChannel(socketId, channel);
    return NextResponse.json(authResponse);

  } catch (error) {
    console.error("Pusher Auth Engine Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}