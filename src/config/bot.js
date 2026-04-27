import discord
from discord.ext import commands
import yt_dlp
import asyncio

intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

# یارمەتیدەری یوتوب
ytdl_format_options = {
    'format': 'bestaudio/best',
    'quiet': True,
    'noplaylist': True,
}

ffmpeg_options = {
    'options': '-vn'
}

ytdl = yt_dlp.YoutubeDL(ytdl_format_options)

# کلاسی مۆسیقا
class YTDLSource(discord.PCMVolumeTransformer):
    def __init__(self, source, *, data, volume=0.5):
        super().__init__(source, volume)
        self.data = data
        self.title = data.get('title')

    @classmethod
    async def from_url(cls, url, *, loop=None):
        loop = loop or asyncio.get_event_loop()
        data = await loop.run_in_executor(None, lambda: ytdl.extract_info(url, download=False))
        filename = data['url']
        return cls(discord.FFmpegPCMAudio(filename, **ffmpeg_options), data=data)

# کۆمەند: join
@bot.command(/)
async def join(ctx):
    if ctx.author.voice:
        channel = ctx.author.voice.channel
        await channel.connect()
    else:
        await ctx.send("پێویستە لە ڤۆیس بیت!")

# کۆمەند: leave
@bot.command(/)
async def leave(ctx):
    if ctx.voice_client:
        await ctx.guild.voice_client.disconnect()

# کۆمەند: play
@bot.command(/)
async def play(ctx, url):
    if not ctx.voice_client:
        await ctx.invoke(join)

    async with ctx.typing():
        player = await YTDLSource.from_url(url, loop=bot.loop)
        ctx.voice_client.stop()
        ctx.voice_client.play(player)

    await ctx.send(f"🎶 ئێستا پەخش دەکرێت: {player.title}")

# کۆمەند: stop
@bot.command(/)
async def stop(ctx):
    if ctx.voice_client:
        ctx.voice_client.stop()
        await ctx.send("⏹ وەستاندرا")

# کۆمەند: pause
@bot.command(/)
async def pause(ctx):
    if ctx.voice_client:
        ctx.voice_client.pause()
        await ctx.send("⏸ وەستانی کاتی")

# کۆمەند: resume
@bot.command(/)
async def resume(ctx):
    if ctx.voice_client:
        ctx.voice_client.resume()
        await ctx.send("▶️ بەردەوام بوو")

# تۆکەنەکەت لێرە دابنێ
bot.run("MTQ5ODI4MTA3MTM4Nzg2OTMyNQ.G_oON4.PXiLTn_tsqj7mmaHSEqnAxnevxFReQNOKw5")
