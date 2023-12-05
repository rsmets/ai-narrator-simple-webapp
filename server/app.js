const { Server } = require("socket.io");

const { createServer } = require("http");
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  }
});

const OpenAIVision = require("./visionAPI");
const ElevenLabsVoice = require("./elevenLabs");

const openAIVision = new OpenAIVision();
const elevenLabsVoice = new ElevenLabsVoice();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("🤝 A new client has connected");

  socket.on("capturedFrame", async (image) => {
    console.log("📸 New image received");

    try {
      const analysis = await openAIVision.analyzeImage(image);
      console.log("🎙️ {Narrator} says:", analysis);

      const stream = await elevenLabsVoice.textToSpeechStream(analysis);
      console.log("🎙️ {Narrator} is speaking");
      socket.emit("narratorText", analysis);
      for await (const chunk of stream) {
        socket.emit("narratorAudio", chunk);
      }
      socket.emit("narratorFinished");
      console.log("🎙️ {Narrator} has finished speaking");
    } catch (err) {
      console.error(err.message);
    }
  });
  socket.on("disconnect", () => {
    console.log("👋 A client has disconnected");
  });

  socket.on('error', (error) => {
    console.error('An error occurred:', error);
  });
});

httpServer.listen(3000, '0.0.0.0', () => {
  console.log('Server is running on port 3000');
});
