if (!process.env.DEBUG) process.env.DEBUG = "lavacoffee"

import ms from "ms"
import debugFactory from "debug"
import config from "./config.json"
import { CoffeeLava, CoffeeNode, CoffeeTrack, UnresolvedTrack, CoffeeFilters, version as coffeeVersion } from "../src"
import { Client, Intents, Message, MessageEmbed, MessageSelectMenu, TextChannel, version as djsVersion } from "discord.js"
import { LoadTypes, LoopMode, PlayerStates, PlayerVoiceStates } from "../src/utils"

const debug = debugFactory("lavacoffee")

class LavalinkClient extends Client {
  public prefix: string
  public lava: CoffeeLava<number>

  constructor(onMessage: (this: LavalinkClient, msg: Message) => any) {
    super({
      intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
    })

    this.prefix = config.prefix
    this.lava = new CoffeeLava({
      balanceLoad: "lavalink",
      send: (guildID, p) => {
        const guild = this.guilds.cache.get(guildID)
        guild?.shard.send(p)
      }
    })

    this.once("ready", () => {
      this.lava.init(this.user!.id)
      debug(`Logged in as ${this.user!.tag}`)
    })

    this.on("raw", p => this.lava.updateVoiceData(p))
    this.on("messageCreate", onMessage.bind(this))

    this.lava.on("nodeCreate", node => debug("Node Created: %s", node.options.name))
    this.lava.on("nodeDestroy", node => debug("Node Destroyed: %s", node.options.name))
    this.lava.on("nodeConnect", node => debug(
      "Node Connected: %s, Plugins: %s",
      node.options.name,
      node.plugins.size
        ? (() => {
          const plugins: string[] = []
          for (const plugin of node.plugins.keys()) {
            plugins.push(plugin)
          }
          return plugins.join(" , ")
        })()
        : "(none)"
    ))
    this.lava.on("nodeMissingPlugins", (node, missing) => debug(
      "Node Missing Plugins: %s, Missing: %s",
      node.options.name,
      missing.join(" , ")
    ))
    this.lava.on("nodeReconnect", node => debug("Node Reconnecting: %s", node.options.name))
    this.lava.on("nodeDisconnect", (node, reason) => debug("Node Disconnected: %s, Code: %d, Reason: %s", node.options.name, reason.code, reason.reason))
    this.lava.on("nodeError", (node, error) => debug("Node Error: %s, Error: %O", node.options.name, error))
    this.lava.on("playerCreate", player => debug("Player Created: %s", player.options.guildID))
    this.lava.on("playerDestroy", player => debug("Player Destroyed: %s", player.options.guildID))
    this.lava.on("playerMove", (player, oldCh, newCh) => debug("Player Move: %s, Old: %s, New: %s", player.options.guildID, oldCh, newCh))
    this.lava.on("socketClosed", (player, payload) => debug("Socket Closed: %s, Reason: %s", player.options.guildID, payload.reason))

    this.lava.on("playerReplay", player => {
      const embed = new MessageEmbed()
        .setTitle("Replaying Track")
        .setDescription("Replaying track because of reason: \`Disconnected from node\`")
        .setColor("ORANGE")
      
      const text = player.get<TextChannel>("text")!

      text.send({ embeds: [embed] })
    })

    this.lava.on("replayError", player => {
      const embed = new MessageEmbed()
        .setTitle("Replay Error")
        .setDescription("Error while replaying track after disconnected from node")
        .setColor("RED")

      const text = player.get<TextChannel>("text")!

      text.send({ embeds: [embed] })
    })

    this.lava.on("queueStart", player => {
      const embed = new MessageEmbed()
        .setTitle("Queue Starting")
        .setColor("GREEN")
      
      const text = player.get<TextChannel>("text")!

      text.send({ embeds: [embed] })
    })

    this.lava.on("queueEnd", player => {
      const embed = new MessageEmbed()
        .setTitle("Queue Ended")
        .setColor("YELLOW")
      
      const text = player.get<TextChannel>("text")!

      text.send({ embeds: [embed] })
    })

    this.lava.on("trackStart", (player, track) => {
      const embed = new MessageEmbed()
        .setTitle("Track Starting")
        .setDescription(`[${track.title}](${(track as CoffeeTrack).url})`)
        .setColor("GREEN")

      const text = player.get<TextChannel>("text")!

      text.send({ embeds: [embed] })
    })

    this.lava.on("trackEnd", (player, track) => {
      const embed = new MessageEmbed()
        .setTitle("Track Ended")
        .setDescription(`[${track.title}](${(track as CoffeeTrack).url})`)
        .setColor("YELLOW")

      const text = player.get<TextChannel>("text")!

      text.send({ embeds: [embed] })
    })

    this.lava.on("trackStuck", (player, track) => {
      const embed = new MessageEmbed()
        .setTitle("Track Stuck")
        .setDescription(`[${track.title}](${(track as CoffeeTrack).url})`)
        .setColor("ORANGE")

      const text = player.get<TextChannel>("text")!

      text.send({ embeds: [embed] })
    })

    this.lava.on("trackError", (player, track, payload) => {
      const embed = new MessageEmbed()
        .setTitle("Track Error")
        .setDescription(`[${track.title}](${(track as CoffeeTrack).url})`)
        .addField("Cause", payload.exception.cause)
        .addField("Severity", payload.exception.severity)
        .addField("Error", `\`\`\`\n${payload.exception.message}\`\`\``)
        .setColor("RED")

      const text = player.get<TextChannel>("text")!

      text.send({ embeds: [embed] })
    })

    for (const node of config.nodes) {
      this.lava.add({
        ...node,
        retryAmount: Infinity
      })
    }
  }
}

new LavalinkClient(async function (msg) {
  if (!msg.content.startsWith(this.prefix)) return

  const args = msg.content.substring(this.prefix.length).trim().split(" ")
  const command = args.shift()

  switch (command) {
    case "stats":
      {
        const client = this.user!.tag
        const memory = process.memoryUsage()
        const osMem = (memory.rss / 1024 / 1024).toFixed(2)
        const jsTotal = (memory.heapTotal / 1024 / 1024).toFixed(2)
        const jsUsed = (memory.heapUsed / 1024 / 1024).toFixed(2)
        const cpp = (memory.external / 1024 / 1024).toFixed(2)
        const arrayBuffer = (memory.arrayBuffers / 1024 / 1024).toFixed(2)

        const embed = new MessageEmbed()
          .setTitle("Client Stats")
          .setDescription(`\`\`\`\nClient: ${client}\nUptime: ${ms(Date.now() - this.readyTimestamp!, { long: true })}\nDiscord.js: ${djsVersion}\nLavacoffee: ${coffeeVersion}\`\`\``)
          .addField("Memory Usage", `\`\`\`\nOS: ${osMem}MB\nJSTotal: ${jsTotal}MB\nJSUsed: ${jsUsed}MB\nC++: ${cpp}MB\nArrayBuffers: ${arrayBuffer}MB\`\`\``)
          .setColor("FUCHSIA")

        const nodes: CoffeeNode[] = []
        
        const iterator = this.lava.nodes.values()
        for (let i = 0; i < Math.min(24, this.lava.nodes.size); i++) {
          nodes.push(iterator.next().value)
        }

        for (const node of nodes) {
          const stats = node.stats
          embed.addField(`${node.options.name} Stats`, `\`\`\`\nPlayers: ${stats.players}\nPlaying: ${stats.playingPlayers}\nUptime: ${
            ms(stats.uptime, { long: true })
          }\nMemory: ${(stats.memory.used / 1024 / 1024).toFixed(2)}MB\nCPU Cores: ${stats.cpu.cores}\nCPU System Load: ${
            ((stats.cpu.systemLoad / stats.cpu.cores) * 100).toFixed(2)
          }%\nCPU Lavalink Load: ${
            ((stats.cpu.lavalinkLoad / stats.cpu.cores) * 100).toFixed(2)
          }%\nLast Updated: ${ms(Date.now() - node.stats.lastUpdated, { long: true })} ago\`\`\``)
        }

        msg.reply({ embeds: [embed] })
      }
      break
    case "join":
      {
        if (!msg.member!.voice.channel) {
          msg.reply({ embeds: [error("You must be connected to voice channel") ]})
          return
        }

        const player = this.lava.create({
          guildID: msg.guildId!,
          metadata: {
            text: msg.channel
          }
        })

        player.options.voiceID = msg.member!.voice.channelId!
        player.connect()

        const embed = new MessageEmbed()
          .setTitle("Joined Voice")
          .setDescription(`Joined to ${msg.member!.voice.channel.name}`)
          .setColor("GREEN")

        msg.reply({ embeds: [embed] })
      }
      break
    case "leave":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        player.disconnect()

        const embed = new MessageEmbed()
          .setTitle("Disconnected from voice channel")
          .setColor("GREEN")

        msg.reply({ embeds: [embed] })
      }
      break
    case "play":
      {
        if (!args.length) {
          msg.reply({ embeds: [error("No query is provided!")] })
          return
        }

        const res = await this.lava.search({ query: args.join(" ") }, msg.author)

        if (res.loadType === LoadTypes.NoMatches) {
          msg.reply({ embeds: [error("No result found from query!")] })
          return
        }

        if (res.loadType === LoadTypes.LoadFailed) {
          msg.reply({ embeds: [error(`Search Failed, Reason: \`\`\`\n${res.error!.severity}: ${res.error!.message}\`\`\``)] })
          return
        }

        if (res.loadType === LoadTypes.SearchResult) {
          const tracks = Math.min(10, res.tracks.length)
          const selectMenu = new MessageSelectMenu()
            .setMinValues(1)
            .setMaxValues(tracks)
            .setCustomId("tracks")
            .setPlaceholder("Choose a track")

          for (let i = 0; i < tracks; i++) {
            const track = res.tracks[i]

            selectMenu.addOptions({
              label: track.url,
              value: i.toString(),
              description: track.title.substring(0, 100)
            })
          }

          const embed = new MessageEmbed()
            .setTitle("Search Results")
            .setDescription("Multiple tracks found, please select atleast one within 15 seconds")
            .setColor("ORANGE")

          const message = await msg.reply({ embeds: [embed], components: [{
            type: "ACTION_ROW",
            components: [selectMenu]
          }]})

          let success = false

          try {
            const interaction = await message.awaitMessageComponent({
              time: 15_000,
              componentType: "SELECT_MENU"
            })

            const tracks: CoffeeTrack[] = []

            for (const value of interaction.values) {
              const index = Number(value)
              tracks.push(res.tracks[index])
            }

            res.tracks = tracks
            success = true
          } catch {
            msg.reply({ embeds: [error("The prompt has timed out!")] })
          } finally {
            message.delete()
            if (!success) return
          }
        }

        const player = this.lava.create({
          guildID: msg.guildId!,
          metadata: {
            text: msg.channel
          }
        })

        player.queue.add(res.tracks)

        const embed = new MessageEmbed()
          .setTitle("Loaded Tracks")
          .setColor("GREEN")

        if (res.loadType === LoadTypes.TrackLoaded || res.tracks.length === 1) {
          embed.setDescription(`Added [${res.tracks[0].title}](${res.tracks[0].url})`)
        } else if (res.loadType === LoadTypes.PlaylistLoaded) {
          embed.setDescription(`Loaded playlist \`${res.playlist!.name}\``)
        } else {
          embed.setDescription("Added the selected tracks")
        }

        msg.reply({ embeds: [embed] })

        if (player.voiceState !== PlayerVoiceStates.Connected) {
          if (!msg.member!.voice.channel) {
            msg.reply({ embeds: [error("Cannot play the tracks because not connected to voice channel yet")] })
            return
          }

          player.options.voiceID = msg.member!.voice.channelId!
          player.connect()

          const embed1 = new MessageEmbed()
            .setTitle("Joined Voice")
            .setDescription(`Joined to ${msg.member!.voice.channel!.name}`)
            .setColor("GREEN")

          msg.reply({ embeds: [embed1] })
        }

        if (!player.queue.current) await player.play({})
      }
      break
    case "play-custom":
      {
        const title = args[0]

        if (!title) {
          msg.reply({ embeds: [error("Title must be provided")] })
          return
        }

        const author = args[1]
        const duration = Number(args[2])

        if (args.length >= 3 && isNaN(duration)) {
          msg.reply({ embeds: [error("Duration must be a number")] })
          return
        }

        const track = new UnresolvedTrack(title, author, duration ? duration : undefined, msg.author)

        const player = this.lava.create({
          guildID: msg.guildId!,
          metadata: {
            text: msg.channel
          }
        })

        player.queue.add(track)

        const embed = new MessageEmbed()
          .setTitle(`Added ${title}`)
          .setColor("GREEN")
        
        msg.reply({ embeds: [embed] })

        if (player.voiceState !== PlayerVoiceStates.Connected) {
          if (!msg.member!.voice.channel) {
            msg.reply({ embeds: [error("Cannot play the tracks because not connected to voice channel yet")] })
            return
          }

          player.options.voiceID = msg.member!.voice.channelId!
          player.connect()

          const embed1 = new MessageEmbed()
            .setTitle("Joined Voice")
            .setDescription(`Joined to ${msg.member!.voice.channel!.name}`)
            .setColor("GREEN")

          msg.reply({ embeds: [embed1] })
        }

        if (!player.queue.current) await player.play({})
      }
      break
    case "play-spotify":
      {
        const url = args[0]

        if (!url) {
          msg.reply({ embeds: [error("URL must be provided")] })
          return
        }

        if (!/^(?:http|https):\/\/open\.spotify\.com\/(?:track|album|playlist|artist)\/.+$/.test(url)) {
          msg.reply({
            embeds: [error("Unsupported url format")]
          })
          return
        }

        const res = await this.lava.search({
          query: url,
          allowSearch: false,
          requiredPlugins: ["spotify-plugin"]
        }, msg.author)

        if (res.loadType === LoadTypes.NoMatches) {
          msg.reply({ embeds: [error("No result found from query!")] })
          return
        }

        if (res.loadType === LoadTypes.LoadFailed) {
          msg.reply({ embeds: [error(`Search Failed, Reason: \`\`\`\n${res.error!.severity}: ${res.error!.message}\`\`\``)] })
          return
        }

        const player = this.lava.create({
          guildID: msg.guildId!,
          requiredPlugins: ["spotify-plugin"],
          metadata: {
            text: msg.channel
          }
        })

        player.queue.add(res.tracks)

        const embed = new MessageEmbed()
          .setTitle("Loaded Tracks")
          .setColor("GREEN")

        if (res.loadType === LoadTypes.TrackLoaded) {
          embed.setDescription(`Added ${res.tracks[0].title}`)
        } else if (res.loadType === LoadTypes.PlaylistLoaded) {
          embed.setDescription(`Loaded ${res.playlist!.name}`)
        }

        msg.reply({ embeds: [embed] })

        if (player.voiceState !== PlayerVoiceStates.Connected) {
          if (!msg.member!.voice.channel) {
            msg.reply({ embeds: [error("Cannot play the tracks because not connected to voice channel yet")] })
            return
          }

          player.options.voiceID = msg.member!.voice.channelId!
          player.connect()

          const embed1 = new MessageEmbed()
            .setTitle("Joined Voice")
            .setDescription(`Joined to ${msg.member!.voice.channel!.name}`)
            .setColor("GREEN")

          msg.reply({ embeds: [embed1] })
        }

        if (!player.queue.current) await player.play({})
      }
      break
    case "current":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        const track = player.queue.current as CoffeeTrack

        if (!track) {
          msg.reply({ embeds: [error("No track is currently playing")] })
          return
        }

        const embed = new MessageEmbed()
          .setTitle(track.title)
          .setURL(track.url)
          .setDescription(`\`\`\`\nAuthor: ${track.author}\nDuration: ${ms(track.duration, { long: true })}\nPlayed since ${ms(player.absolutePosition, { long: true })} ago\`\`\``)
          .setColor("FUCHSIA")
        
        if (track.source === "youtube") embed.setThumbnail(track.displayThumbnail()!)

        msg.reply({ embeds: [embed] })
      }
      break
    case "queue":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        if (!player.queue.length) {
          msg.reply({ embeds: [error("Queue is empty")] })
          return
        }

        const embed = new MessageEmbed()
          .setTitle("Queue")
          .setColor("FUCHSIA")
          .setDescription(player.queue.map((track, index) => `${index + 1}. ${CoffeeTrack.isTrack(track) ? `[${track.title}](${track.url})` : track.title}`).join("\n").substring(0, 2000))
        
        msg.reply({ embeds: [embed] })
      }
      break
    case "remove":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        if (!player.queue.length) {
          msg.reply({ embeds: [error("Queue is empty")] })
          return
        }

        const start = Number(args[0])

        if (isNaN(start)) {
          msg.reply({ embeds: [error("Start position must be a valid number")] })
          return
        }

        const end = Number(args[1])

        if (isNaN(end)) {
          msg.reply({ embeds: [error("End position must be a valid number")] })
          return
        }

        try {
          player.queue.remove(start, end)
          
          const embed = new MessageEmbed()
            .setTitle("Successfully removed the tracks")
            .setColor("GREEN")
          
          msg.reply({ embeds: [embed] })
        } catch {
          msg.reply({ embeds: [error("Error while removing the tracks")] })
        }
      }
      break
    case "loop":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        const loop = player.loop === LoopMode.None
          ? LoopMode.Queue
          : player.loop === LoopMode.Queue
          ? LoopMode.Track
          : LoopMode.None

        player.setLoop(loop)

        const embed = new MessageEmbed()
          .setTitle(`Set loop mode to ${
            loop === LoopMode.None
              ? "none"
              : loop === LoopMode.Queue
              ? "queue"
              : "track"
          }`)
          .setColor("GREEN")

        msg.reply({ embeds: [embed] })
      }
      break
    case "volume":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        const volume = Number(args[0])

        if (isNaN(volume)) {
          msg.reply({ embeds: [error("Volume must be a number")] })
          return
        }

        player.setVolume(volume)

        const embed = new MessageEmbed()
          .setTitle(`Set the volume to ${player.options.volume}`)
          .setColor("GREEN")
        
        msg.reply({ embeds: [embed] })
      }
      break
    case "skip":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        if (!player.queue.current) {
          msg.reply({ embeds: [error("No track is currently playing")] })
          return
        }

        player.stop()

        const embed = new MessageEmbed()
          .setTitle("Skipped current track")
          .setColor("GREEN")
        
        msg.reply({ embeds: [embed] })
      }
      break
    case "stop":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        if (!player.queue.current) {
          msg.reply({ embeds: [error("No track is currently playing")] })
          return
        }

        player.setLoop(LoopMode.None)
        player.queue.clear()
        player.stop()

        const embed = new MessageEmbed()
          .setTitle("Stopped the queue")
          .setColor("GREEN")
        
        msg.reply({ embeds: [embed] })
      }
      break
    case "clear":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        if (!player.queue.length) {
          msg.reply({ embeds: [error("Queue is empty")] })
          return
        }

        player.queue.clear()

        const embed = new MessageEmbed()
          .setTitle("Cleared the queue")
          .setColor("GREEN")

        msg.reply({ embeds: [embed] })
      }
      break
    case "seek":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        if (!player.queue.current) {
          msg.reply({ embeds: [error("No track is currently playing")] })
          return
        }

        const position = Number(args[0])

        if (isNaN(position)) {
          msg.reply({ embeds: [error("Seek position must be a number")] })
          return
        }

        player.seek(position)

        const embed = new MessageEmbed()
          .setTitle("Seekened to the specified position")
          .setColor("GREEN")
      }
      break
    case "filter-speed":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        const speed = Number(args[0])

        if (isNaN(speed)) {
          msg.reply({ embeds: [error("Speed must be a number")] })
          return
        }

        if (speed <= 0) {
          msg.reply({ embeds: [error("Speed must be more than 0")] })
          return
        }

        const filters = new CoffeeFilters(player.filters)

        filters.timescale.setSpeed(speed)

        player.setFilters(filters)
        player.patchFilters()

        const embed = new MessageEmbed()
          .setTitle("Successfully set the speed filter")
          .setColor("GREEN")

        msg.reply({ embeds: [embed] })
      }
      break
    case "filter-pitch":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        const pitch = Number(args[0])

        if (isNaN(pitch)) {
          msg.reply({ embeds: [error("Pitch must be a number")] })
          return
        }

        if (pitch <= 0) {
          msg.reply({ embeds: [error("Pitch must be more than 0")] })
          return
        }

        const filters = new CoffeeFilters(player.filters)

        filters.timescale.setPitch(pitch)

        player.setFilters(filters)
        player.patchFilters()

        const embed = new MessageEmbed()
          .setTitle("Successfully set the pitch filter")
          .setColor("GREEN")

        msg.reply({ embeds: [embed] })
      }
      break
    case "reset-filters":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        player.setFilters({})
        player.patchFilters()

        const embed = new MessageEmbed()
          .setTitle("Resetted the filters")
          .setColor("GREEN")
        
        msg.reply({ embeds: [embed] })
      }
      break
    case "pause":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        player.pause(true)

        const embed = new MessageEmbed()

        if (player.state === PlayerStates.Paused) {
          embed.setTitle("Paused the player")
            .setColor("GREEN")
        } else {
          embed.setTitle("Failed to pause")
            .setColor("RED")
        }

        msg.reply({ embeds: [embed] })
      }
      break
    case "resume":
      {
        const player = this.lava.get(msg.guildId!)

        if (!player) {
          msg.reply({ embeds: [error("No player was found")] })
          return
        }

        player.pause(false)

        const embed = new MessageEmbed()

        if (player.state === PlayerStates.Playing) {
          embed.setTitle("Resumed the player")
            .setColor("GREEN")
        } else {
          embed.setTitle("Failed to resume")
            .setColor("RED")
        }

        msg.reply({ embeds: [embed] })
      }
      break
    default:
      msg.reply({ embeds: [error(`Invalid command \`${command}\``)] })
  }
}).login(config.token)

function error(err: string): MessageEmbed {
  return new MessageEmbed()
    .setTitle("Error")
    .setDescription(err)
    .setColor("RED")
}
