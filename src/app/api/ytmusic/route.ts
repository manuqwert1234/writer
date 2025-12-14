import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";
import ytdl from "@distube/ytdl-core";

// Initialize YTMusic once
let ytmusic: YTMusic | null = null;

async function getYTMusic() {
    if (!ytmusic) {
        ytmusic = new YTMusic();
        await ytmusic.initialize();
    }
    return ytmusic;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const query = searchParams.get("q");
    const videoId = searchParams.get("id");

    try {
        if (action === "search" && query) {
            const yt = await getYTMusic();
            const results = await yt.searchSongs(query);
            
            // Return top 20 results with essential info
            const songs = results.slice(0, 20).map((song: any) => ({
                id: song.videoId,
                title: song.name,
                artist: song.artist?.name || "Unknown Artist",
                duration: song.duration,
                coverArt: song.thumbnails?.[0]?.url || "",
            }));

            return NextResponse.json({ songs });
        }

        if (action === "stream" && videoId) {
            // Get audio stream URL
            const info = await ytdl.getInfo(videoId);
            const audioFormat = ytdl.chooseFormat(info.formats, { 
                quality: "highestaudio",
                filter: "audioonly" 
            });

            if (audioFormat?.url) {
                return NextResponse.json({ 
                    audioUrl: audioFormat.url,
                    title: info.videoDetails.title,
                    artist: info.videoDetails.author.name,
                    duration: info.videoDetails.lengthSeconds,
                });
            }

            return NextResponse.json({ error: "No audio format found" }, { status: 404 });
        }

        if (action === "trending") {
            const yt = await getYTMusic();
            // Search for popular lofi/chill music
            const results = await yt.searchSongs("lofi chill beats");
            
            const songs = results.slice(0, 30).map((song: any) => ({
                id: song.videoId,
                title: song.name,
                artist: song.artist?.name || "Unknown Artist",
                duration: song.duration,
                coverArt: song.thumbnails?.[0]?.url || "",
            }));

            return NextResponse.json({ songs });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("YTMusic API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

