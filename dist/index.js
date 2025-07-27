var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default;
var init_vite_config = __esm({
  async "vite.config.ts"() {
    "use strict";
    vite_config_default = defineConfig({
      plugins: [
        react(),
        runtimeErrorOverlay(),
        ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
          await import("@replit/vite-plugin-cartographer").then(
            (m) => m.cartographer()
          )
        ] : []
      ],
      resolve: {
        alias: {
          "@": path3.resolve(import.meta.dirname, "client", "src"),
          "@shared": path3.resolve(import.meta.dirname, "shared"),
          "@assets": path3.resolve(import.meta.dirname, "attached_assets")
        }
      },
      root: path3.resolve(import.meta.dirname, "client"),
      build: {
        outDir: path3.resolve(import.meta.dirname, "dist/public"),
        emptyOutDir: true
      },
      server: {
        fs: {
          strict: true,
          deny: ["**/.*"]
        }
      }
    });
  }
});

// server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  log: () => log,
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
import express from "express";
import fs4 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs4.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs4.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}
var viteLogger;
var init_vite = __esm({
  async "server/vite.ts"() {
    "use strict";
    await init_vite_config();
    viteLogger = createLogger();
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  content: text("content").notNull(),
  chunks: jsonb("chunks").$type().notNull().default([]),
  embeddings: jsonb("embeddings").$type().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  documentId: integer("document_id").references(() => documents.id),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  role: text("role").$type().notNull(),
  content: text("content").notNull(),
  sourceChunks: jsonb("source_chunks").$type().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertDocumentSchema = createInsertSchema(documents).pick({
  filename: true,
  originalName: true,
  mimeType: true,
  size: true,
  content: true
});
var insertConversationSchema = createInsertSchema(conversations).pick({
  sessionId: true,
  documentId: true
});
var insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  role: true,
  content: true,
  sourceChunks: true
});

// server/storage.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
var MemStorage = class {
  users;
  documents;
  conversations;
  messages;
  currentUserId;
  currentDocumentId;
  currentConversationId;
  currentMessageId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.documents = /* @__PURE__ */ new Map();
    this.conversations = /* @__PURE__ */ new Map();
    this.messages = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getDocument(id) {
    return this.documents.get(id);
  }
  async createDocument(insertDocument) {
    const id = this.currentDocumentId++;
    const document = {
      ...insertDocument,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.documents.set(id, document);
    return document;
  }
  async deleteDocument(id) {
    this.documents.delete(id);
    const relatedConversations = Array.from(this.conversations.values()).filter((conv) => conv.documentId === id);
    for (const conv of relatedConversations) {
      const relatedMessages = Array.from(this.messages.values()).filter((msg) => msg.conversationId === conv.id);
      for (const msg of relatedMessages) {
        this.messages.delete(msg.id);
      }
      this.conversations.delete(conv.id);
    }
  }
  async getConversation(id) {
    return this.conversations.get(id);
  }
  async getConversationBySession(sessionId) {
    return Array.from(this.conversations.values()).find(
      (conv) => conv.sessionId === sessionId
    );
  }
  async createConversation(insertConversation) {
    const id = this.currentConversationId++;
    const conversation = {
      ...insertConversation,
      id,
      documentId: insertConversation.documentId || null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.conversations.set(id, conversation);
    return conversation;
  }
  async getMessage(id) {
    return this.messages.get(id);
  }
  async getConversationMessages(conversationId) {
    return Array.from(this.messages.values()).filter((msg) => msg.conversationId === conversationId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  async createMessage(insertMessage) {
    const id = this.currentMessageId++;
    const message = {
      ...insertMessage,
      id,
      role: insertMessage.role,
      sourceChunks: Array.isArray(insertMessage.sourceChunks) ? insertMessage.sourceChunks : null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.messages.set(id, message);
    return message;
  }
};
var DatabaseStorage = class {
  db;
  constructor() {
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }
  async getUser(id) {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  async getUserByUsername(username) {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }
  async createUser(insertUser) {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }
  async getDocument(id) {
    const result = await this.db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return result[0];
  }
  async createDocument(insertDocument) {
    const result = await this.db.insert(documents).values({
      ...insertDocument,
      chunks: insertDocument.chunks,
      embeddings: insertDocument.embeddings
    }).returning();
    return result[0];
  }
  async deleteDocument(id) {
    await this.db.delete(documents).where(eq(documents.id, id));
  }
  async getConversation(id) {
    const result = await this.db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    return result[0];
  }
  async getConversationBySession(sessionId) {
    const result = await this.db.select().from(conversations).where(eq(conversations.sessionId, sessionId)).limit(1);
    return result[0];
  }
  async createConversation(insertConversation) {
    const result = await this.db.insert(conversations).values(insertConversation).returning();
    return result[0];
  }
  async getMessage(id) {
    const result = await this.db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return result[0];
  }
  async getConversationMessages(conversationId) {
    const result = await this.db.select().from(messages).where(eq(messages.conversationId, conversationId));
    return result.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  async createMessage(insertMessage) {
    const messageData = {
      content: insertMessage.content,
      conversationId: insertMessage.conversationId,
      role: insertMessage.role,
      sourceChunks: Array.isArray(insertMessage.sourceChunks) ? insertMessage.sourceChunks : null
    };
    const result = await this.db.insert(messages).values(messageData).returning();
    return result[0];
  }
};
var storage = process.env.NODE_ENV === "production" ? new DatabaseStorage() : new MemStorage();

// server/routes.ts
import multer from "multer";
import path2 from "path";
import { promises as fs3 } from "fs";

// server/services/document-processor.ts
import { promises as fs } from "fs";
function chunkText(text2, chunkSize = 1e3, overlap = 200) {
  const chunks = [];
  const sentences = text2.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  let currentChunk = "";
  let currentSize = 0;
  for (const sentence of sentences) {
    const sentenceLength = sentence.trim().length;
    if (currentSize + sentenceLength > chunkSize && currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(-Math.floor(overlap / 6));
      currentChunk = overlapWords.join(" ") + " " + sentence.trim();
      currentSize = currentChunk.length;
    } else {
      currentChunk += (currentChunk ? ". " : "") + sentence.trim();
      currentSize = currentChunk.length;
    }
  }
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  return chunks.filter((chunk) => chunk.length > 50);
}
async function extractTextFromFile(filePath, mimeType) {
  try {
    if (mimeType === "text/plain") {
      return await fs.readFile(filePath, "utf-8");
    }
    if (mimeType === "application/pdf") {
      throw new Error("PDF processing requires additional setup. Please convert to text format.");
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      throw new Error("DOCX processing requires additional setup. Please convert to text format.");
    }
    throw new Error(`Unsupported file type: ${mimeType}`);
  } catch (error) {
    throw new Error(`Failed to extract text from file: ${error.message}`);
  }
}
function validateFileUpload(file) {
  const allowedMimeTypes = [
    "text/plain",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  const maxSize = 10 * 1024 * 1024;
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload PDF, DOCX, or TXT files only."
    };
  }
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Maximum size is 10MB."
    };
  }
  return { valid: true };
}

// server/services/openai.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});
async function generateEmbeddings(texts) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts
    });
    return response.data.map((item) => item.embedding);
  } catch (error) {
    throw new Error(`Failed to generate embeddings: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
async function generateChatResponse(message, context, conversationHistory = []) {
  try {
    const enhancedMessage = context.length > 0 ? `Based on this information: ${context.join(" ")}

Question: ${message}

Please answer the question using the information provided above.` : message;
    const systemPrompt = `You are an AI assistant for Shop Twist and Thread. Always use the information provided in the user's message to answer questions. Do not say you don't have information if it's provided in the context.`;
    const messages2 = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: enhancedMessage }
    ];
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages2,
      max_tokens: 500,
      temperature: 0.7
    });
    return {
      response: response.choices[0].message.content || "I couldn't generate a response.",
      sourceChunks: context
    };
  } catch (error) {
    throw new Error(`Failed to generate chat response: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
async function findRelevantChunks(query, documentChunks, documentEmbeddings, topK = 3) {
  if (documentChunks.length === 0) return [];
  try {
    const queryEmbedding = await generateEmbeddings([query]);
    const queryVector = queryEmbedding[0];
    const similarities = documentEmbeddings.map((embedding, index) => ({
      index,
      similarity: cosineSimilarity(queryVector, embedding),
      chunk: documentChunks[index]
    }));
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, topK).filter((item) => item.similarity > 0.1).map((item) => item.chunk);
  } catch (error) {
    console.error("Error finding relevant chunks:", error);
    return [];
  }
}

// server/services/knowledge-base.ts
import { promises as fs2 } from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var knowledgeBaseId = null;
async function initializeKnowledgeBase(forceReload = false) {
  try {
    if (knowledgeBaseId && !forceReload) return;
    let knowledgeBasePath = path.join(__dirname, "../knowledge-base.txt");
    if (process.env.NODE_ENV === "production") {
      knowledgeBasePath = path.join(__dirname, "knowledge-base.txt");
    }
    const content = await fs2.readFile(knowledgeBasePath, "utf-8");
    const chunks = chunkText(content);
    const embeddings = await generateEmbeddings(chunks);
    if (knowledgeBaseId && forceReload) {
      try {
        await storage.deleteDocument(knowledgeBaseId);
      } catch (error) {
        console.warn("Could not delete old knowledge base:", error);
      }
    }
    const document = await storage.createDocument({
      filename: "knowledge-base.txt",
      originalName: "AI Assistant Knowledge Base",
      mimeType: "text/plain",
      size: content.length,
      content,
      chunks,
      embeddings
    });
    knowledgeBaseId = document.id;
    console.log(`Knowledge base ${forceReload ? "reloaded" : "initialized"} with ID: ${knowledgeBaseId}`);
  } catch (error) {
    console.error("Failed to initialize knowledge base:", error);
  }
}
function getKnowledgeBaseId() {
  return knowledgeBaseId;
}

// server/routes.ts
var upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }
  // 10MB limit
});
async function registerRoutes(app2) {
  app2.get("/widget.js", async (req, res) => {
    try {
      const widgetScript = path2.resolve(import.meta.dirname, "..", "public", "widget.js");
      const script = await fs3.readFile(widgetScript, "utf-8");
      res.status(200).set({ "Content-Type": "application/javascript" }).end(script);
    } catch (error) {
      console.error("Error serving widget script:", error);
      res.status(500).send("// Error loading widget script");
    }
  });
  app2.get("/embed", (req, res) => {
    const embedHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat Widget</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            overflow: hidden; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: transparent;
        }
        #widget-container { 
            width: 100vw; 
            height: 100vh; 
            background: transparent;
        }
    </style>
</head>
<body>
    <div id="widget-container">
        <iframe 
            src="/widget" 
            width="100%" 
            height="100%" 
            style="border: none; background: transparent;"
            title="AI Chat Interface">
        </iframe>
    </div>
    <script>
        // Widget ready notification
        if (window.parent !== window) {
            window.parent.postMessage({ 
                type: 'WIDGET_READY', 
                source: 'ai-widget' 
            }, '*');
        }
    </script>
</body>
</html>`;
    res.status(200).set({ "Content-Type": "text/html" }).end(embedHtml);
  });
  app2.post("/api/documents", upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const validation = validateFileUpload(req.file);
      if (!validation.valid) {
        await fs3.unlink(req.file.path).catch(() => {
        });
        return res.status(400).json({ error: validation.error });
      }
      const textContent = await extractTextFromFile(req.file.path, req.file.mimetype);
      const chunks = chunkText(textContent);
      const embeddings = await generateEmbeddings(chunks);
      const documentData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        content: textContent
      };
      const document = await storage.createDocument({
        ...documentData,
        chunks,
        embeddings
      });
      await fs3.unlink(req.file.path).catch(() => {
      });
      res.json({
        id: document.id,
        originalName: document.originalName,
        size: document.size,
        chunks: chunks.length,
        message: "Document processed successfully"
      });
    } catch (error) {
      if (req.file) {
        await fs3.unlink(req.file.path).catch(() => {
        });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.get("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json({
        id: document.id,
        originalName: document.originalName,
        size: document.size,
        chunks: document.chunks.length,
        createdAt: document.createdAt
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const existingConversation = await storage.getConversationBySession(validatedData.sessionId);
      if (existingConversation) {
        return res.json(existingConversation);
      }
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Message content is required" });
      }
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const userMessage = await storage.createMessage({
        conversationId,
        role: "user",
        content,
        sourceChunks: []
      });
      const messages2 = await storage.getConversationMessages(conversationId);
      const conversationHistory = messages2.slice(-6).map((msg) => ({
        role: msg.role,
        content: msg.content
      }));
      let relevantChunks = [];
      let aiResponse;
      const knowledgeBaseId2 = getKnowledgeBaseId();
      if (knowledgeBaseId2) {
        const knowledgeBase = await storage.getDocument(knowledgeBaseId2);
        if (knowledgeBase) {
          relevantChunks = await findRelevantChunks(
            content,
            knowledgeBase.chunks,
            knowledgeBase.embeddings,
            3
            // Use more chunks for better context
          );
        }
      }
      if (conversation.documentId) {
        const document = await storage.getDocument(conversation.documentId);
        if (document) {
          const docChunks = await findRelevantChunks(
            content,
            document.chunks,
            document.embeddings
          );
          relevantChunks = [...relevantChunks, ...docChunks];
        }
      }
      const { response, sourceChunks } = await generateChatResponse(
        content,
        relevantChunks,
        conversationHistory
      );
      aiResponse = response;
      const aiMessage = await storage.createMessage({
        conversationId,
        role: "assistant",
        content: aiResponse,
        sourceChunks
      });
      res.json({
        userMessage,
        aiMessage
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages2 = await storage.getConversationMessages(conversationId);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      await storage.deleteDocument(documentId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import path5 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path5.dirname(__filename2);
function log2(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log2(logLine);
    }
  });
  next();
});
(async () => {
  try {
    await initializeKnowledgeBase();
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(err);
    });
    if (process.env.NODE_ENV === "production") {
      const publicPath = path5.join(__dirname2, "public");
      app.use(express2.static(publicPath));
      app.get("*", (req, res) => {
        res.sendFile(path5.join(publicPath, "index.html"));
      });
    } else {
      const { setupVite: setupVite2 } = await init_vite().then(() => vite_exports);
      await setupVite2(app, server);
    }
    const PORT = parseInt(process.env.PORT || "5000", 10);
    server.listen(PORT, "0.0.0.0", () => {
      log2(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
})();
