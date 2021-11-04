# lavacoffee
> A fast and rich-featured lavalink wrapper for node.js

[![NPM Version](https://img.shields.io/npm/v/lavacoffee.svg?maxAge=3600)](https://www.npmjs.com/package/lavacoffee)
[![NPM Downloads](https://img.shields.io/npm/dt/lavacoffee.svg?maxAge=3600)](https://www.npmjs.com/package/lavacoffee)

# Table Of Contents
- [Features](#features)
- [Installation](#installation)
- [Documentation](#documentation)
- [Getting Lavalink](#getting-lavalink)
- [Cycle](#cycle)
- [Test](#test)
- [Examples](#examples)
  - [Init](#init)
  - [Nodes](#nodes)
  - [Voice Updates](#voice-updates)
  - [Events](#events)
  - [Resuming Session](#resuming-session)
  - [Players](#players)
    - [Creating](#creating)
    - [Getting](#getting)
    - [Replaying](#replaying)
    - [Filters](#filters)
    - [Unknown Track](#unknown-track)

# Features
- Easy-to-use
- Performant

# Installation
> NPM (Stable) => npm install lavacoffee

> Github (Dev) => npm install XzFirzal/lavacoffee#main

# Documentation
> https://xzfirzal.github.io/lavacoffee

# Getting Lavalink
Download the latest binaries from the [CI Server (Dev)](https://ci.fredboat.com/repository/download/Lavalink_Build?guest=1&branch=refs/heads/dev)

Put an [application.yml](https://github.com/freyacodes/Lavalink/blob/master/LavalinkServer/application.yml.example) in your working directory.

Run with `java -jar Lavalink.jar`

Docker images are available on the [Docker hub](https://hub.docker.com/r/fredboat/lavalink/)

# Cycle
> Init lava client

> Add some nodes

> Play track

> Grab some coffee ☕

# Test
[Test Bot](https://github.com/XzFirzal/lavacoffee/blob/main/test/index.ts)
> npm run test

# Examples
### Init
```ts
// Importing lava instance constructor
import { CoffeeLava } from "lavacoffee"

// Construct the lava instance
const lava = new CoffeeLava(lavaOptions)

// Init the lava instance
lava.init(clientID)
```

### Nodes
```ts
// Adding a node
lava.add(nodeOptions)

// More nodes
lava.add(nodeOptions1)
lava.add(nodeOptions2)
...
```

### Voice Updates
```ts
// Payload can be a voice state update payload or a voice server update payload
lava.updateVoiceData(payload)
```

### Events
> [LavaEvents](https://xzfirzal.github.io/lavacoffee/interfaces/LavaEvents.html)

### Resuming Session
```ts
/**
 * Lavalink got a feature
 * which will allow for resuming
 * a session after it got
 * disconnected
 */

/**
 * After v1.2.0, lavacoffee
 * added support for this feature,
 * allowing for resuming lavalink session
 * incase of bot restarted
 */

// Create the resume configuration
const config = {
  // The resume custom key for resuming lavalink session
  key: "somekey",
  // The timeout for the session, if timeout is passed before resumed, it can't be resumed anymore
  timeout: 60, // 60 seconds
  // Incase of player resumed, it must be handled manually by the user
  handle(lava, guildID, callback) {
    // Creating the player
    const player = lava.create({ guildID })

    // Redo the player state, e.g getting the player queue from database
    ...

    // Call callback to indicate as done
    callback(player)
  }
}

// Creating lava instance
const lava = new CoffeeLava({
  resumeConfig: config,
  /** other lava options */
})
...
```

## Players 
### Creating
```ts
// THis will create a new player or get an existing if exist
const player = lava.create(playerOptions)

// Connect to voice channel
player.options.voiceID = voiceChannelID
player.connect()

// Adding tracks
player.queue.add(tracks)

// Play
player.play()
...
```

### Getting
```ts
// Use this if you only want to get a player without creating it
const player = lava.get(guildID)

if (!player) return

// Getting queue
const queue = player.queue

// Getting current track
const track = player.queue.current
...
```

### Replaying
```ts
/**
 * When player is disconnected from node
 * it will automatically move to another node
 * then replay the track on current position
 * you can disable this behaviour by setting
 * the `autoReplay` option to false in LavaOptions
 */

// Replay events

// When successfully replayed
lava.on("playerReplay", player => { ... })

// When there's an error while replaying
lava.on("replayError", (player, error) => { ... })
...
```

### Filters
```ts
/**
 * LavaCoffee also supports lavalink filters
 * it also got filters builder to manage filters easier
 */

// Importing filters builder
import { CoffeeFilters } from "lavacoffee"

// Creating filters
const filters = new CoffeeFilters()

// Example on setting equalizer
filters.equalizers
  .setBand(2, 0.25)
  .setBand(6, -0.25)

// Example to enable karaoke filter
filters.karaoke.enabled = true

// Example on setting 2x speed and half pitch
filters.timescale
  .setSpeed(2)
  .setPitch(0.5)

// Example on setting vibrato filter
filters.vibrato
  .setFrequency(2)
  .setDepth(0.5)

// Example on setting the audio to only left channel
filters.channelMix
  .setRightToLeft(1)
  .setRightToRight(0)

// Set the filters
player.setFilters(filters)
```

### Unknown Track
```ts
/**
 * You can make an unknown track
 * from unknown source, and resolve it
 * once it playing
 */

// Importing unresolved track
import { UnresolvedTrack } from "lavacoffee"

// Creating the track
const track = new UnresolvedTrack(title, author, duration, requester)

// Adding the track
player.queue.add(track)
```
